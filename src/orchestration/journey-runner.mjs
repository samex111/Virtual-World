import { createHash, randomUUID } from "node:crypto";
import { createBudget } from "./budget.mjs";
import { validateActionProposal } from "../contracts/phase1.mjs";
import { redactSensitive } from "../evidence/redaction.mjs";

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function observationFingerprint(observation) {
  return stableHash({
    url: observation?.url ?? null,
    title: observation?.title ?? null,
    bodyText: observation?.bodyText ?? observation?.text ?? null,
    controls: observation?.controls ?? null,
  });
}

async function withinTimeout(promise, timeoutMs, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} exceeded ${timeoutMs}ms.`)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function validateIntention(value) {
  if (!value || typeof value !== "object" || typeof value.intention !== "string" || !value.intention.trim()) {
    throw new TypeError("Student Agent must return one structured learner intention.");
  }
  if (value.intention.length > 200) throw new TypeError("Learner intention must be at most 200 characters.");
  const allowedBehaviors = new Set(["confident", "uncertain", "guess", "intentional_mistake", "request_hint", "request_explanation", "read_question", "finish", "other"]);
  const behavior = allowedBehaviors.has(value.behavior) ? value.behavior : "other";
  const model = value.model && typeof value.model === "object" ? value.model : null;
  return { intention: value.intention, behavior, model };
}

function safeModelMetadata(metadata, stage, latencyMs) {
  if (!metadata) return null;
  const pickString = (value, max = 120) => typeof value === "string" && value.trim() ? value.slice(0, max) : null;
  const pickNumber = (value) => Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  return {
    stage,
    provider: pickString(metadata.provider),
    modelId: pickString(metadata.modelId),
    promptVersion: pickString(metadata.promptVersion),
    latencyMs: pickNumber(metadata.latencyMs) ?? Math.round(latencyMs),
    inputTokens: pickNumber(metadata.inputTokens),
    outputTokens: pickNumber(metadata.outputTokens),
  };
}

export class JourneyRunner {
  constructor({ agent, actionPlanner, controller, evidence, profileStore, profile, scenario, budget = {} }) {
    if (!agent?.decide || !actionPlanner?.plan) throw new TypeError("A Student Agent and a separate action planner are required.");
    this.agent = agent;
    this.actionPlanner = actionPlanner;
    this.controller = controller;
    this.evidence = evidence;
    this.profileStore = profileStore;
    this.profile = profile;
    this.scenario = scenario;
    this.budget = createBudget(budget);
    this.startedAt = Date.now();
    this.decisionCalls = 0;
    this.noProgressCount = 0;
    this.previousNoProgressKey = null;
    this.history = [];
  }

  assertWithinTimeBudget() {
    if (Date.now() - this.startedAt >= this.budget.maxDurationMs) throw new Error("Journey exceeded its wall-clock budget.");
  }

  async run(initialObservation) {
    let observation = initialObservation ?? await this.controller.observe();
    let status = "failed";
    let reason = null;
    try {
      await this.evidence.append("observation_captured", { observation });
      const initialRef = await this.evidence.captureObservation(observation, "observations/initial.json");
      let complete = await this.scenario.isComplete({ profile: this.profile, observation, history: this.history });

      while (!complete) {
        this.assertWithinTimeBudget();
        if (this.controller.actionsExecuted >= this.budget.maxActions) throw new Error("Journey action budget exhausted.");
        if (this.decisionCalls >= this.budget.maxDecisionCalls) throw new Error("Student decision-call budget exhausted.");

        let rawDecision;
        let attempts = 0;
        while (true) {
          this.decisionCalls += 1;
          try {
            const modelStartedAt = Date.now();
            rawDecision = await withinTimeout(this.agent.decide({
              profile: structuredClone(this.profile),
              scenario: this.scenario.publicView,
              observation: structuredClone(observation),
              history: structuredClone(this.history),
            }), Math.min(this.budget.maxDecisionCallMs, this.budget.maxDurationMs - (Date.now() - this.startedAt)), "Student Agent decision");
            const metadata = safeModelMetadata(rawDecision?.model, "student_agent", Date.now() - modelStartedAt);
            if (metadata) await this.evidence.append("model_call_completed", metadata);
            break;
          } catch (error) {
            if (attempts >= this.budget.maxRetries || this.decisionCalls >= this.budget.maxDecisionCalls) throw error;
            attempts += 1;
            await this.evidence.append("issue_reported", { category: "student_decision_error", retry: attempts, errorName: error.name || "Error" });
          }
        }

        const decision = validateIntention(rawDecision);
        await this.evidence.append("student_intention_selected", { intention: decision.intention, behavior: decision.behavior });

        this.assertWithinTimeBudget();
        if (this.decisionCalls >= this.budget.maxDecisionCalls) throw new Error("Action-planning call budget exhausted.");
        this.decisionCalls += 1;
        const plannerStartedAt = Date.now();
        const plannedResult = await withinTimeout(this.actionPlanner.plan({
          intention: decision.intention,
          behavior: decision.behavior,
          profile: structuredClone(this.profile),
          scenario: this.scenario.publicView,
          observation: structuredClone(observation),
          history: structuredClone(this.history),
        }), Math.min(this.budget.maxDecisionCallMs, this.budget.maxDurationMs - (Date.now() - this.startedAt)), "Action planner");
        const planned = plannedResult?.proposal ?? plannedResult;
        const plannerMetadata = safeModelMetadata(plannedResult?.model, "action_planner", Date.now() - plannerStartedAt);
        if (plannerMetadata) await this.evidence.append("model_call_completed", plannerMetadata);
        const proposal = validateActionProposal({
          ...planned,
          actionId: planned?.actionId ?? `ACT-${randomUUID()}`,
          intention: decision.intention,
          schemaVersion: planned?.schemaVersion ?? "1",
        }, { maxTimeoutMs: this.budget.maxActionTimeoutMs });
        await this.evidence.append("action_proposed", {
          actionId: proposal.actionId,
          action: proposal.action,
          target: proposal.target,
          expected: proposal.expected,
        });

        const actionFingerprint = {
          intention: decision.intention,
          action: proposal.action,
          target: proposal.target,
          value: proposal.value ?? null,
          expected: proposal.expected,
        };
        const noProgressKey = `${observationFingerprint(observation)}:${stableHash(actionFingerprint)}`;
        if (noProgressKey === this.previousNoProgressKey) this.noProgressCount += 1;
        else this.noProgressCount = 0;
        if (this.noProgressCount >= 1) throw new Error("No-progress loop detected: the same action was proposed repeatedly from an unchanged observation.");

        const result = await this.controller.execute(proposal);
        const updated = result.after ?? await this.controller.observe();
        this.history.push(redactSensitive({
          actionId: proposal.actionId,
          intention: decision.intention,
          behavior: decision.behavior,
          action: proposal.action,
          status: result.status,
          verification: result.verification,
          observationHash: stableHash(updated),
          evidenceRefs: result.evidenceRefs ?? [],
        }));
        observation = updated;
        this.previousNoProgressKey = noProgressKey;
        await this.evidence.append("observation_captured", {
          actionId: proposal.actionId,
          observation: updated,
          evidenceRefs: result.evidenceRefs ?? [],
        });

        if (typeof this.scenario.onVerifiedAction === "function") {
          const update = await this.scenario.onVerifiedAction({ profile: this.profile, proposal, result, history: this.history });
          if (update) {
            const evidenceRef = update.provenance?.evidenceRef;
            const outcomeSource = update.provenance?.outcomeSource;
            if (!update.learningState || !["approved_answer_key", "reviewed_evaluator"].includes(outcomeSource) || !result.evidenceRefs?.includes(evidenceRef)) {
              throw new Error("Student knowledge updates require approved-answer or reviewed-evaluator provenance linked to this action's evidence.");
            }
            this.profile = await this.profileStore.update(this.profile.studentId, (draft) => {
              draft.learningState = update.learningState;
              return draft;
            }, {
              evidenceRef,
              reason: outcomeSource,
            });
            this.evidence.profileVersion = this.profile.version;
            await this.evidence.append("student_state_updated", {
              profileVersion: this.profile.version,
              evidenceRefs: [evidenceRef],
              outcomeSource,
            });
          }
        }
        complete = await this.scenario.isComplete({ profile: this.profile, observation, history: this.history });
      }

      status = "completed";
      await this.evidence.append("simulation_finished", { status, actionCount: this.controller.actionsExecuted, decisionCalls: this.decisionCalls });
      return { status, profile: this.profile, history: this.history, finalObservation: observation, initialObservationRef: initialRef.path };
    } catch (error) {
      reason = error.message;
      await this.evidence.append("simulation_failed", {
        reason,
        actionCount: this.controller.actionsExecuted,
        decisionCalls: this.decisionCalls,
      });
      throw error;
    } finally {
      if (status !== "completed") this.failureReason = reason;
    }
  }
}
