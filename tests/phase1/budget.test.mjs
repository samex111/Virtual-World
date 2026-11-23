import test from "node:test";
import assert from "node:assert/strict";
import { createBudget, HARD_LIMITS } from "../../src/orchestration/budget.mjs";

test("uses conservative defaults and rejects values above hard limits", () => {
  const budget = createBudget();
  assert.equal(budget.maxActions, 20);
  assert.equal(budget.maxDurationMs, 180_000);
  assert.throws(() => createBudget({ maxActions: HARD_LIMITS.maxActions + 1 }), /maxActions/);
  assert.throws(() => createBudget({ maxDurationMs: 0 }), /maxDurationMs/);
});
