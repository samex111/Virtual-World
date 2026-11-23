/**
 * Target-independent scenario metadata. The Aceraa adapter must supply the
 * actual authenticated UI mapping and an approved academic reference before
 * this scenario can be executed against Aceraa.
 */
export const physicsNewtonsLawsScenario = Object.freeze({
  id: "physics_newtons_laws_jee_main_v1",
  version: "1.0.0",
  subject: "Physics",
  topic: "Newton's laws of motion",
  level: "JEE Main",
  requiredCheckpoints: [
    "authenticated_home",
    "physics_practice",
    "question_rendered",
    "answer_selected_and_submitted",
    "feedback_rendered",
    "follow_up_answered",
    "session_finished",
  ],
  academicReferenceStatus: "pending_subject_owner_review",
  publicView: Object.freeze({
    goal: "Complete one JEE Main Physics practice journey on Newton's laws of motion.",
    learnerBehavior: "A synthetic intermediate learner may answer correctly or intentionally make a mistake, then asks for a step-by-step explanation.",
    constraints: ["One learner", "One Chromium browser", "One question", "One follow-up"],
  }),
});

export function createScenarioAdapter({ checkpoints, academicReference }) {
  if (!checkpoints || typeof checkpoints.isComplete !== "function") {
    throw new TypeError("An Aceraa-specific checkpoint adapter is required; selectors and routes must come from inspected QA UI.");
  }
  if (!academicReference || academicReference.status !== "approved" || !academicReference.reviewer) {
    throw new Error("A subject-owner-approved Newton's laws question and answer reference is required.");
  }
  return {
    ...physicsNewtonsLawsScenario,
    isComplete: checkpoints.isComplete,
    onVerifiedAction: checkpoints.onVerifiedAction,
  };
}
