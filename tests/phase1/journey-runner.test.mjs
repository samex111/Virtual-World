import test from "node:test";
import assert from "node:assert/strict";
import { JourneyRunner } from "../../src/orchestration/journey-runner.mjs";

function harness({ decisions, completeAfter = 2, budget = {} } = {}) {
  const events = [];
  const evidence = {
    append: async (type, payload) => events.push({ type, payload }),
    captureObservation: async (_observation, path) => ({ path }),
  };
  const profile = { studentId: "student_jee_001", version: 1 };
  const profileStore = { update: async () => ({ ...profile, version: 2 }) };
  let step = 0;
  let calls = 0;
  const controller = {
    actionsExecuted: 0,
    observe: async () => ({ text: `state-${step}` }),
    execute: async (proposal) => {
      controller.actionsExecuted += 1;
      step += 1;
      return { status: "verified", verification: { status: "passed" }, after: { text: `state-${step}` }, evidenceRefs: [`screenshots/${proposal.actionId}.png`] };
    },
  };
  const agent = {
    decide: async () => {
      const value = decisions?.[calls] ?? { intention: "Continue the learner journey" };
      calls += 1;
      return value;
    },
  };
  const actionPlanner = {
    plan: async ({ intention }) => ({
      schemaVersion: "1",
      actionId: `ACT-${step + 1}`,
      intention,
      action: "click",
      target: { strategy: "role", role: "button", name: "Continue" },
      expected: { kind: "visible", target: { strategy: "text", value: "Next" } },
    }),
  };
  const scenario = {
    publicView: { goal: "test" },
    isComplete: async () => step >= completeAfter,
  };
  return { runner: new JourneyRunner({ agent, actionPlanner, controller, evidence, profileStore, profile, scenario, budget }), events, controller };
}

test("runs observe-decide-plan-act-verify-record until the scenario completes", async () => {
  const { runner, events, controller } = harness({ completeAfter: 2 });
  runner.agent.decide = async () => ({ intention: "Continue the learner journey", model: { provider: "mock", modelId: "test-model", promptVersion: "p1", inputTokens: 12, outputTokens: 4 } });
  const originalPlanner = runner.actionPlanner.plan;
  runner.actionPlanner.plan = async (input) => ({ proposal: await originalPlanner(input), model: { provider: "mock", modelId: "planner-model", promptVersion: "p2" } });
  const result = await runner.run({ text: "initial" });
  assert.equal(result.status, "completed");
  assert.equal(controller.actionsExecuted, 2);
  assert.equal(events[0].type, "observation_captured");
  assert.ok(events.some((event) => event.type === "student_intention_selected"));
  assert.equal(events.filter((event) => event.type === "model_call_completed").length, 4);
  assert.equal(events.at(-1).type, "simulation_finished");
});

test("enforces action budgets and records a failed run", async () => {
  const { runner, events } = harness({ completeAfter: 3, budget: { maxActions: 1, maxDecisionCalls: 4 } });
  await assert.rejects(() => runner.run({ text: "initial" }), /action budget/);
  assert.equal(events.at(-1).type, "simulation_failed");
});

test("detects repeated identical actions from an unchanged observation", async () => {
  const events = [];
  const evidence = { append: async (type, payload) => events.push({ type, payload }), captureObservation: async (_o, path) => ({ path }) };
  const controller = {
    actionsExecuted: 0,
    observe: async () => ({ text: "unchanged", capturedAt: new Date().toISOString() }),
    execute: async () => { controller.actionsExecuted += 1; return { status: "verified", after: { text: "unchanged", capturedAt: new Date().toISOString() } }; },
  };
  const runner = new JourneyRunner({
    agent: { decide: async () => ({ intention: "Try again" }) },
    actionPlanner: { plan: async () => ({ actionId: `ACT-different-${controller.actionsExecuted}`, schemaVersion: "1", action: "click", target: { strategy: "role", role: "button", name: "Retry" }, expected: { kind: "visible", target: { strategy: "text", value: "Retry" } } }) },
    controller, evidence, profileStore: {}, profile: { studentId: "student_jee_001", version: 1 },
    scenario: { publicView: {}, isComplete: async () => false }, budget: { maxActions: 10, maxDecisionCalls: 10 },
  });
  await assert.rejects(() => runner.run({ text: "unchanged" }), /No-progress loop/);
  assert.ok(events.some((event) => event.type === "simulation_failed"));
});

test("does not accept unstructured agent output", async () => {
  const { runner } = harness({ completeAfter: 1, decisions: ["just click it"] });
  await assert.rejects(() => runner.run({ text: "initial" }), /structured learner intention/);
});


test("times out unresponsive Student Agent calls", async () => {
  const { runner, events } = harness({ completeAfter: 1, budget: { maxActions: 2, maxDecisionCalls: 2, maxDecisionCallMs: 5 } });
  runner.agent.decide = () => new Promise((resolve) => setTimeout(() => resolve({ intention: "Too late" }), 50));
  await assert.rejects(() => runner.run({ text: "initial" }), /exceeded 5ms/);
  assert.equal(events.at(-1).type, "simulation_failed");
});

test("only changes learner knowledge with approved provenance linked to action evidence", async () => {
  const { runner, events } = harness({ completeAfter: 1 });
  runner.scenario.onVerifiedAction = ({ result }) => ({
    learningState: { topics: { newtons_laws: { evidenceCount: 1 } } },
    provenance: { outcomeSource: "approved_answer_key", evidenceRef: result.evidenceRefs[0] },
  });
  const result = await runner.run({ text: "initial" });
  assert.equal(result.profile.version, 2);
  assert.ok(events.some((event) => event.type === "student_state_updated"));
});

test("rejects knowledge updates without verified academic provenance", async () => {
  const { runner, events } = harness({ completeAfter: 1 });
  runner.scenario.onVerifiedAction = () => ({ learningState: { topics: {} } });
  await assert.rejects(() => runner.run({ text: "initial" }), /approved-answer or reviewed-evaluator provenance/);
  assert.equal(events.at(-1).type, "simulation_failed");
});
