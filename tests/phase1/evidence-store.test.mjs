import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EvidenceStore } from "../../src/evidence/evidence-store.mjs";
import { redactSensitive, redactText } from "../../src/evidence/redaction.mjs";
import { sanitizeTraceValue } from "../../src/evidence/trace-redactor.mjs";

const ids = { simulationId: "SIM-test", studentId: "student_jee_001", sessionId: "SESSION-test" };

test("writes append-only correlated events and a checksummed artifact manifest", async () => {
  const root = await mkdtemp(join(tmpdir(), "vw-evidence-test-"));
  try {
    const store = new EvidenceStore({ rootDir: root, ids, scenarioId: "physics_v1", scenarioVersion: "1", profileVersion: 1 });
    await store.initialize();
    await store.append("student_intention_selected", { intention: "Read the question", password: "do-not-store", email: "student@example.test" });
    await store.writeArtifact("notes/observation.json", JSON.stringify({ title: "Question visible" }), { contentType: "application/json" });
    const manifest = await store.finalize({ status: "completed" });
    assert.equal(manifest.simulationId, ids.simulationId);
    assert.equal(manifest.eventCount, 2);
    assert.ok(manifest.artifacts.some((item) => item.path === "notes/observation.json" && item.sha256.length === 64));
    const lines = (await readFile(join(root, "events.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
    assert.equal(lines[1].simulationId, ids.simulationId);
    assert.equal(lines[1].sessionId, ids.sessionId);
    assert.equal(lines[1].studentId, ids.studentId);
    assert.equal(lines[1].password, "[REDACTED]");
    assert.equal(lines[1].email, "[REDACTED_EMAIL]");
    assert.equal(lines[1].eventType, "student_intention_selected");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects path traversal and duplicate artifact replacement", async () => {
  const root = await mkdtemp(join(tmpdir(), "vw-evidence-test-"));
  try {
    const store = new EvidenceStore({ rootDir: root, ids, scenarioId: "physics_v1", scenarioVersion: "1" });
    await store.initialize();
    await assert.rejects(() => store.writeArtifact("../secret.txt", "no"), /path traversal/);
    await store.writeArtifact("same.txt", "one");
    await assert.rejects(() => store.writeArtifact("same.txt", "two"), /EEXIST/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("redacts common credentials, bearer tokens, JWTs, and email identifiers", () => {
  assert.deepEqual(redactSensitive({ authorization: "Bearer abc", nested: { password: "secret" } }), {
    authorization: "[REDACTED]", nested: { password: "[REDACTED]" },
  });
  assert.match(redactText("contact student@example.com"), /\[REDACTED_EMAIL\]/);
  assert.match(redactText("Bearer abc.def"), /Bearer \[REDACTED\]/);
  assert.match(redactText('<input type="password" value="super-secret">'), /value="\[REDACTED\]"/);
});


test("sanitizes Playwright network records before trace artifacts are retained", () => {
  const cleaned = sanitizeTraceValue({
    url: "https://qa.aceraa.test/submit?access_token=secret#fragment",
    request: { headers: [{ name: "cookie", value: "session=secret" }], postData: "password=secret" },
    response: { headers: [{ name: "set-cookie", value: "session=secret" }], body: "private" },
    title: "student@example.test",
  });
  assert.equal(cleaned.url, "https://qa.aceraa.test/submit");
  assert.equal(cleaned.request.headers, "[REDACTED]");
  assert.equal(cleaned.request.postData, "[REDACTED]");
  assert.equal(cleaned.response.body, "[REDACTED]");
  assert.equal(cleaned.title, "[REDACTED_EMAIL]");
});


test("enforces a maximum artifact size", async () => {
  const root = await mkdtemp(join(tmpdir(), "vw-evidence-test-"));
  try {
    const store = new EvidenceStore({ rootDir: root, ids, scenarioId: "physics_v1", scenarioVersion: "1", maxArtifactBytes: 3 });
    await store.initialize();
    await assert.rejects(() => store.writeArtifact("too-large.txt", "four"), /size limit/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
