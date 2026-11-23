import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { dirname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";
import { PHASE1_SCHEMA_VERSION, EVENT_TYPES } from "../contracts/phase1.mjs";
import { redactSensitive } from "./redaction.mjs";

function safeRelativePath(value) {
  if (typeof value !== "string" || !value.trim() || isAbsolute(value)) throw new TypeError("Artifact path must be a relative path.");
  const normalized = normalize(value);
  if (normalized === "." || normalized.startsWith(`..${sep}`) || normalized === ".." || normalized.split(sep).includes("..")) {
    throw new Error("Artifact path traversal is not allowed.");
  }
  return normalized;
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export class EvidenceStore {
  constructor({ rootDir, ids, scenarioId, scenarioVersion, profileVersion = 1, maxArtifactBytes = 50 * 1024 * 1024 }) {
    this.rootDir = resolve(rootDir);
    this.ids = ids;
    this.scenarioId = scenarioId;
    this.scenarioVersion = scenarioVersion;
    this.profileVersion = profileVersion;
    this.maxArtifactBytes = maxArtifactBytes;
    this.eventPath = join(this.rootDir, "events.jsonl");
    this.artifacts = [];
    this.startedAt = new Date().toISOString();
  }

  async initialize() {
    await mkdir(this.rootDir, { recursive: true, mode: 0o700 });
    await this.append("simulation_started", { scenarioId: this.scenarioId, scenarioVersion: this.scenarioVersion });
  }

  async append(eventType, payload = {}) {
    if (!EVENT_TYPES.includes(eventType)) throw new TypeError(`Unknown event type '${eventType}'.`);
    const event = redactSensitive({
      ...payload,
      schemaVersion: PHASE1_SCHEMA_VERSION,
      eventId: `EVT-${randomUUID()}`,
      eventType,
      occurredAt: new Date().toISOString(),
      traceId: payload.traceId ?? null,
      ...this.ids,
      scenarioId: this.scenarioId,
      scenarioVersion: this.scenarioVersion,
      profileVersion: this.profileVersion,
    });
    await appendFile(this.eventPath, `${JSON.stringify(event)}\n`, { encoding: "utf8", mode: 0o600 });
    return event;
  }

  async writeArtifact(relativePath, content, { contentType = "application/octet-stream", description = "" } = {}) {
    const safePath = safeRelativePath(relativePath);
    const absolutePath = resolve(this.rootDir, safePath);
    const rel = relative(this.rootDir, absolutePath);
    if (rel.startsWith(`..${sep}`) || rel === "..") throw new Error("Artifact path escaped the run directory.");
    const bytes = Buffer.isBuffer(content) ? content : Buffer.from(String(content), "utf8");
    if (bytes.byteLength > this.maxArtifactBytes) throw new RangeError(`Artifact exceeds the ${this.maxArtifactBytes}-byte size limit.`);
    await mkdir(dirname(absolutePath), { recursive: true, mode: 0o700 });
    await writeFile(absolutePath, bytes, { flag: "wx", mode: 0o600 });
    const artifact = {
      path: safePath.split(sep).join("/"),
      contentType,
      sizeBytes: bytes.byteLength,
      sha256: digest(bytes),
      createdAt: new Date().toISOString(),
      description: redactSensitive(description),
      redacted: true,
    };
    this.artifacts.push(artifact);
    return artifact;
  }

  async captureScreenshot(page, relativePath, description = "Browser checkpoint") {
    const bytes = await page.screenshot({ fullPage: true, animations: "disabled" });
    return this.writeArtifact(relativePath, bytes, { contentType: "image/png", description });
  }

  async captureObservation(observation, relativePath) {
    return this.writeArtifact(relativePath, `${JSON.stringify(redactSensitive(observation), null, 2)}\n`, {
      contentType: "application/json",
      description: "DOM-first browser observation",
    });
  }

  async finalize({ status, reason = null, browser = {}, scenario = {}, profile = {} } = {}) {
    const eventLines = await readFile(this.eventPath, "utf8").catch(() => "");
    const eventCount = eventLines.split("\n").filter(Boolean).length;
    const manifest = redactSensitive({
      schemaVersion: PHASE1_SCHEMA_VERSION,
      simulationId: this.ids.simulationId,
      studentId: this.ids.studentId,
      sessionId: this.ids.sessionId,
      scenario: { id: this.scenarioId, version: this.scenarioVersion, ...scenario },
      profile: { version: this.profileVersion, ...profile },
      status,
      reason,
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      eventCount,
      browser,
      artifacts: [...this.artifacts, {
        path: "events.jsonl",
        contentType: "application/x-ndjson",
        sizeBytes: Buffer.byteLength(eventLines),
        sha256: digest(Buffer.from(eventLines)),
        createdAt: new Date().toISOString(),
        redacted: true,
      }],
      redaction: { appliedToStructuredData: true, policyVersion: "1", privateChainOfThoughtStored: false },
    });
    await this.writeArtifact("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`, {
      contentType: "application/json",
      description: "Run artifact manifest (manifest does not checksum itself)",
    });
    return manifest;
  }
}
