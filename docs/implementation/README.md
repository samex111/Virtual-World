# Implementation Rationale — Why We Are Building It This Way

Virtual-World tests whether Aceraa works for a learner—not merely whether APIs return successful responses. A learner journey crosses intent, question generation, UI rendering, answer selection, submission, feedback, follow-up, and learning-state updates. Failures occur at boundaries between these layers; connected browser and backend evidence makes them diagnosable.

## Key design choices

- **Synthetic students instead of fixed scripts:** Persistent profiles let scenarios respond to prior attempts, knowledge estimates, confidence, and preferences. Variation stays bounded and replayable.
- **Real UI:** The visible interface is part of the product contract. Playwright exercises the browser-facing path; backend events support but do not replace UI verification.
- **Separate student and evaluator:** The student behaves like a learner. Independent evaluators judge Aceraa so the system does not self-validate.
- **Playwright as actuator:** The Student Agent proposes an intention; a separate planner creates one action; deterministic policy validates; Playwright executes; the runner verifies.
- **DOM-first perception:** Accessibility/DOM data is usually more precise and cheaper for ordinary controls. Vision is on-demand for visual ambiguity.
- **One student/one journey first:** One synthetic JEE learner and one Newton's laws journey validate the core loop before multiple agents, profiles, and scale.
- **Correlated evidence:** The bundle answers what the learner intended, what was proposed, what the controller executed, what the browser displayed, and which assertion failed.

## Implementation order

1. Establish a safe Aceraa test environment and deterministic starting state.
2. Define structured student profile and scenario contracts.
3. Build bounded Playwright controller and observe/verify loop.
4. Persist correlated action and evidence events.
5. Complete the single Newton's laws journey.
6. Add independent evaluators and report export.
7. Expand profiles and scenarios.
8. Add scale controls; only then generalize to other applications.

## What not to optimize prematurely

Do not begin with a complex multi-agent hierarchy, autonomous browser computer-use, a large vector database, dashboard, or high concurrency. None proves that a synthetic student can complete a real learning journey and that the system can explain what happened.

## Decision log

Material technical decisions belong in [decisions/](decisions/). Each record states context, decision, alternatives, consequences, and when to revisit.

## Implementation tracker

- [Phase 0 — environment foundation](phase-0-foundation.md): reusable preflight and read-only UI inventory implemented; target-specific environment/account validation pending.
- [Phase 1 — proof of concept](phase-1-poc.md): reusable runtime implemented and unit-tested; Aceraa-specific journey pending QA readiness, live UI mapping, and subject approval.
- [Action and event contracts](action-and-event-contracts.md): implemented identifiers, constrained actions, event records, and evidence manifest.
- [Architecture decisions](decisions/README.md): durable technical choices.

Do not mark a phase as complete until its exit criteria have been demonstrated with repeatable evidence.
