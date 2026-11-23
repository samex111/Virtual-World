# Implementation Rationale — Why We Are Building It This Way

## Why build Virtual-World?
We need to know whether Aceraa works for a learner—not merely whether APIs return successful responses.

A learner journey crosses intent, question generation, UI rendering, answer selection, submission, feedback, follow-up, and learning-state updates. Failures often occur at boundaries between these layers. API tests or fixed happy-path scripts may miss them, and disconnected logs make diagnosis expensive.

Virtual-World creates repeatable synthetic learners, runs them through the real product interface, and connects browser observations to available backend/model evidence. The output is a reproducible account of product behavior, not an AI-generated opinion.

## Why synthetic students instead of fixed scripts?
A fixed script checks a known sequence but does not represent differences in knowledge, confidence, misconceptions, or preferences. Persistent profiles let scenarios respond to prior attempts and make the next learner intention depend on the observed journey.

This is controlled variation, not unconstrained autonomy. Scenarios and action budgets preserve reproducibility.

## Why the real UI?
The visible interface is part of the product contract. A valid API response does not prove that a learner can read a question, select an answer, submit it, or understand feedback. Playwright exercises the browser-facing path. Backend events support diagnosis but do not replace UI verification.

## Why separate student and evaluator?
The student agent behaves like a learner. If it also grades the product, the system becomes self-validating. Independent evaluators use deterministic assertions and explicit subject/workflow rubrics. A student may intentionally make mistakes; the evaluator checks whether Aceraa handled them correctly.

## Why Playwright is the actuator?
Models can produce malformed, ambiguous, or unsafe instructions. Playwright provides deterministic locator APIs, timeouts, traces, and assertions. A model proposes one action; policy validates it; Playwright executes it; the runner verifies the resulting state.

## Why DOM-first and vision-on-demand?
Accessibility and DOM data are usually more precise for button names, labels, text, and selected states. Screenshots matter for layout, charts, images, and visual rendering defects, but sending every screen to a vision model adds cost and ambiguity. Use vision only when visual interpretation is actually needed.

## Why one student and one journey first?
A large multi-agent system multiplies moving parts before the basic evidence loop is proven. One synthetic JEE student and one Newton's laws journey validate profile state, orchestration, browser actions, verification, evidence correlation, and failure handling. Add evaluation, profiles, concurrency, and portability only after this loop is repeatable.

## Why evidence bundles?
A useful failure report should answer: What did the student intend? What did the model propose? What did the controller execute? What did the browser display? What did the application return? Which assertion failed? Can another engineer replay it?

Correlated screenshots, video, traces, events, and evaluator output turn vague reports into engineering artifacts.

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

The repository is currently at the documentation-foundation stage. The simulator runtime, browser runner, model adapter, evidence collector, evaluators, and report pipeline are not yet implemented.

Use the following documents as the execution contract:
- [Phase 1 — proof of concept](phase-1-poc.md) defines the first browser journey, implementation slices, preconditions, risks, and definition of done.
- [Action and event contracts](action-and-event-contracts.md) defines the proposed identifiers, constrained action proposal, event records, and evidence manifest.
- [Architecture decisions](decisions/README.md) records durable technical choices.

Do not mark a phase as implemented until its code exists and its exit criteria have been demonstrated with repeatable evidence.
