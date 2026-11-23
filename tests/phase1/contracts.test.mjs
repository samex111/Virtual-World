import test from "node:test";
import assert from "node:assert/strict";
import { createRunIds, validateActionProposal, validateExpected } from "../../src/contracts/phase1.mjs";

const base = {
  schemaVersion: "1",
  actionId: "ACT-001",
  intention: "Open Physics practice",
  action: "click",
  target: { strategy: "role", role: "button", name: "Physics" },
  expected: { kind: "visible", target: { strategy: "text", value: "Practice", exact: true } },
};

test("accepts a bounded semantic browser action with an explicit postcondition", () => {
  const result = validateActionProposal(base);
  assert.equal(result.timeoutMs, 5_000);
  assert.equal(result.action, "click");
});

test("rejects arbitrary selectors and unsupported browser capabilities", () => {
  assert.throws(() => validateActionProposal({ ...base, target: { strategy: "css", value: "body" } }), /Unsupported target strategy/);
  assert.throws(() => validateActionProposal({ ...base, action: "evaluate" }), /allowlist/);
  assert.throws(() => validateActionProposal({ ...base, target: { strategy: "role", role: "button", name: "Delete account" } }), /Destructive/);
  assert.throws(() => validateActionProposal({ ...base, action: "fill", target: { strategy: "placeholder", value: "Enter password" }, value: "secret" }), /Authentication fields/);
  assert.throws(() => validateActionProposal({ ...base, expected: undefined }), /postcondition/);
});

test("rejects authentication fields and invalid fill targets", () => {
  assert.throws(() => validateActionProposal({ ...base, target: { strategy: "label", value: "Password" } }), /Authentication fields/);
  assert.throws(() => validateActionProposal({ ...base, action: "fill", value: "anything" }), /textbox/);
  const fill = validateActionProposal({ ...base, action: "fill", target: { strategy: "role", role: "textbox", name: "Answer" }, value: "A", expected: { kind: "value", target: { strategy: "role", role: "textbox", name: "Answer" }, value: "A" } });
  assert.equal(fill.action, "fill");
});

test("clamps timeout and keyboard operations", () => {
  assert.throws(() => validateActionProposal({ ...base, timeoutMs: 10_001 }), /timeoutMs/);
  assert.throws(() => validateActionProposal({ ...base, action: "press", value: "Control+Alt+Delete" }), /keyboard-key allowlist/);
  assert.throws(() => validateExpected({ kind: "count", value: "1" }), /Unsupported postcondition/);
});

test("creates independent run identifiers with a stable supplied student id", () => {
  const one = createRunIds({ studentId: "student_jee_001" });
  const two = createRunIds({ studentId: "student_jee_001" });
  assert.equal(one.studentId, "student_jee_001");
  assert.notEqual(one.simulationId, two.simulationId);
  assert.notEqual(one.sessionId, two.sessionId);
  assert.throws(() => createRunIds({ studentId: "../student" }), /studentId/);
});
