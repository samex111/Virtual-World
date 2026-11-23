export const HARD_LIMITS = Object.freeze({
  maxActions: 30,
  maxDurationMs: 300_000,
  maxDecisionCalls: 30,
  maxRetries: 2,
  maxActionTimeoutMs: 10_000,
  maxDecisionCallMs: 30_000,
});

export function createBudget(input = {}) {
  const budget = {
    maxActions: input.maxActions ?? 20,
    maxDurationMs: input.maxDurationMs ?? 180_000,
    maxDecisionCalls: input.maxDecisionCalls ?? 20,
    maxRetries: input.maxRetries ?? 0,
    maxActionTimeoutMs: input.maxActionTimeoutMs ?? 8_000,
    maxDecisionCallMs: input.maxDecisionCallMs ?? 15_000,
  };
  for (const [key, hardMax] of Object.entries(HARD_LIMITS)) {
    const min = key === "maxRetries" ? 0 : 1;
    if (!Number.isInteger(budget[key]) || budget[key] < min || budget[key] > hardMax) {
      throw new RangeError(`${key} must be an integer between ${min} and ${hardMax}.`);
    }
  }
  return Object.freeze(budget);
}
