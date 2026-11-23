import { redactSensitive } from "../evidence/redaction.mjs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { join } from "node:path";

function safeId(value) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) {
    throw new TypeError("studentId must contain only letters, numbers, underscores, or hyphens.");
  }
  return value;
}

function validateProfile(profile) {
  if (!profile || profile.schemaVersion !== "1" || profile.kind !== "synthetic_student") {
    throw new TypeError("Unsupported or invalid synthetic student profile.");
  }
  safeId(profile.studentId);
  if (!Number.isInteger(profile.version) || profile.version < 1) throw new TypeError("Profile version must be a positive integer.");
  if (!profile.examGoal || !profile.learningState || !Array.isArray(profile.evidenceHistory)) {
    throw new TypeError("Profile is missing examGoal, learningState, or evidenceHistory.");
  }
  return profile;
}

export function createInitialJeePhysicsProfile({ studentId = "student_jee_physics_001" } = {}) {
  return validateProfile({
    schemaVersion: "1",
    kind: "synthetic_student",
    studentId: safeId(studentId),
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scenarioSeed: "physics_newtons_laws_jee_main_v1",
    examGoal: { exam: "JEE Main", level: "intermediate", subjects: ["Physics"] },
    preferences: { explanationStyle: "step_by_step", confidenceTendency: "moderate" },
    learningState: {
      topics: {
        "newtons_laws": {
          estimate: "intermediate",
          weakerAreas: ["friction", "free_body_diagrams"],
          evidenceCount: 0,
          lastUpdatedBy: "scenario_prior",
        },
      },
    },
    evidenceHistory: [],
  });
}

export class ProfileStore {
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  pathFor(studentId) {
    return join(this.rootDir, `${safeId(studentId)}.json`);
  }

  async load(studentId) {
    const path = this.pathFor(studentId);
    try {
      return validateProfile(JSON.parse(await readFile(path, "utf8")));
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  async create(profile) {
    validateProfile(profile);
    await mkdir(this.rootDir, { recursive: true, mode: 0o700 });
    const path = this.pathFor(profile.studentId);
    try {
      await writeFile(path, `${JSON.stringify(redactSensitive(profile), null, 2)}\n`, { flag: "wx", mode: 0o600 });
      return profile;
    } catch (error) {
      if (error.code === "EEXIST") throw new Error(`Profile '${profile.studentId}' already exists; use update() instead.`);
      throw error;
    }
  }

  async update(studentId, updater, { evidenceRef, reason } = {}) {
    const current = await this.load(studentId);
    if (!current) throw new Error(`Profile '${studentId}' does not exist.`);
    const draft = structuredClone(current);
    const updated = await updater(draft);
    const next = validateProfile(redactSensitive(updated ?? draft));
    if (next.studentId !== current.studentId) throw new Error("A profile update cannot change studentId.");
    next.version = current.version + 1;
    next.updatedAt = new Date().toISOString();
    if (evidenceRef || reason) {
      next.evidenceHistory.push({
        updateId: randomUUID(),
        profileVersion: next.version,
        occurredAt: next.updatedAt,
        evidenceRef: evidenceRef ?? null,
        reason: reason ?? "evidence_backed_update",
      });
    }
    const path = this.pathFor(studentId);
    const temp = `${path}.${randomUUID()}.tmp`;
    try {
      await writeFile(temp, `${JSON.stringify(next, null, 2)}\n`, { flag: "wx", mode: 0o600 });
      await rename(temp, path);
      return next;
    } finally {
      await import("node:fs/promises").then(({ rm }) => rm(temp, { force: true }));
    }
  }
}

export function profileFingerprint(profile) {
  return createHash("sha256").update(JSON.stringify(profile)).digest("hex");
}
