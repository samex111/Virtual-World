import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ProfileStore, createInitialJeePhysicsProfile } from "../../src/profiles/profile-store.mjs";

test("persists a synthetic profile and evidence-backed versioned updates", async () => {
  const root = await mkdtemp(join(tmpdir(), "vw-profile-test-"));
  try {
    const store = new ProfileStore(root);
    const initial = createInitialJeePhysicsProfile();
    await store.create(initial);
    assert.equal((await store.load(initial.studentId)).version, 1);
    await assert.rejects(() => store.create(initial), /already exists/);
    const next = await store.update(initial.studentId, (draft) => {
      draft.learningState.topics.newtons_laws.evidenceCount = 1;
      return draft;
    }, { evidenceRef: "observations/ACT-001-after.json", reason: "verified_attempt" });
    assert.equal(next.version, 2);
    assert.equal(next.evidenceHistory[0].evidenceRef, "observations/ACT-001-after.json");
    assert.equal((await store.load(initial.studentId)).learningState.topics.newtons_laws.evidenceCount, 1);
    const raw = await readFile(join(root, `${initial.studentId}.json`), "utf8");
    assert.match(raw, /synthetic_student/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not permit profile path traversal or malformed profiles", async () => {
  const root = await mkdtemp(join(tmpdir(), "vw-profile-test-"));
  try {
    const store = new ProfileStore(root);
    await assert.rejects(() => store.load("../private"), /studentId/);
    await assert.rejects(() => store.create({ schemaVersion: "1", studentId: "x", version: 0 }), /invalid synthetic student profile/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
