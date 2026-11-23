# Phase 1 — Proof of concept

## Objective

Build one reliable end-to-end journey in which a synthetic JEE learner uses the real Aceraa Physics practice interface. The journey must be observable, bounded, replayable, and diagnosable.

The target is not a large simulation population. It is proof that learner intent, browser state, Playwright actions, application behavior, and evidence can be connected without guesswork.

## User journey

1. **Enter Aceraa.** Open the approved test environment and reach the synthetic student's authenticated starting state.
2. **Navigate to Physics practice.** Use visible navigation and verify the intended practice area is present.
3. **Request a question.** The learner requests Newton's laws practice at JEE Main level.
4. **Inspect the rendered question.** Read the visible question and options from accessible DOM/UI data. Use screenshot interpretation only if the question's visual form cannot be understood from the DOM.
5. **Choose and submit.** Select one option and submit through the actual visible controls.
6. **Verify feedback.** Confirm the selected state, submission result, correctness indicator, and feedback are rendered.
7. **Ask a follow-up.** The learner asks why the answer is correct or incorrect. Verify that the response addresses the actual question.
8. **Finish.** Persist the final session state, close the browser cleanly, and package the run evidence.

The student may intentionally choose an incorrect answer. That is valid learner behavior. It is a product defect only if Aceraa mishandles the selected answer, result, feedback, or subsequent interaction.

## Preconditions to confirm

- A dedicated Aceraa test URL and environment are available.
- A synthetic test account can be created or provisioned safely.
- Authentication can be performed without placing secrets in prompts or artifacts.
- The exact navigation route and visible Physics practice controls are known.
- The initial scenario has an expected answer/reference and acceptable feedback criteria.
- The team understands what network/backend telemetry can be correlated and what is unavailable.

Do not guess route paths, selectors, account credentials, or backend trace fields. Confirm them against the test environment.

## Implementation slices

### Slice A — Deterministic browser baseline
- Set up Playwright with Chromium.
- Configure the base URL and test credentials through environment/secret configuration, never committed files.
- Create one browser journey using accessible locators and explicit postconditions.
- Enable Playwright trace and browser video.
- Capture screenshots at the question, answer-selected, feedback, and failure checkpoints.
- Fail clearly when an expected control or state is absent.

**Why first:** Verify that the real target product can be exercised before model behavior adds another source of uncertainty.

### Slice B — Run and evidence contracts
- Generate simulation_id, student_id, session_id, and action_id.
- Write append-only event records with timestamps and evidence references.
- Store scenario/profile version and browser/environment metadata.
- Create an artifact manifest.
- Redact sensitive headers and fields from captured evidence.

### Slice C — Persistent synthetic learner
- Define one structured JEE student profile.
- Store knowledge state separately from raw conversation.
- Record answer correctness, topic, difficulty, hint use, confidence, and evidence for any misconception update.
- Version profile updates and retain provenance.

### Slice D — Student Agent and controlled loop
- Define a small set of learner intentions.
- Give the agent the current profile, scenario goal, and latest verified browser observation.
- Require one structured intention/action proposal at a time.
- Validate every action and verify the resulting UI state.
- Add action budgets, retries, timeouts, and no-progress detection.

### Slice E — Reproducible run and failure bundle
- Run the same scenario repeatedly from a clean test state.
- Confirm that each action and checkpoint has evidence.
- Confirm that a failed run preserves enough data to debug.
- Compare run manifests and scenario/profile versions.

## Definition of done

A Phase 1 run is complete only when all of the following are true:

- [ ] The scenario starts from a documented clean synthetic test state.
- [ ] The virtual student reaches the intended Physics practice journey.
- [ ] The student requests and inspects a Newton's laws question.
- [ ] The student selects and submits an option through the visible UI.
- [ ] Aceraa's resulting feedback is observed and recorded.
- [ ] The learner asks one follow-up and the resulting UI state is verified.
- [ ] Every browser action has an input, result, timestamp, and evidence reference.
- [ ] The run captures browser video, Playwright trace, meaningful screenshots, and structured events.
- [ ] The run is bounded by action, time, retry, and model-call limits.
- [ ] A failed run includes enough artifacts to reproduce the blocker.
- [ ] The journey can be replayed from a clean state without hidden manual steps.

Phase 1 does **not** require a production PDF report, multiple student profiles, parallel execution, or a dashboard. Phase 2 owns reliable independent evaluation and report export.

## Expected initial module boundaries

The exact module layout should follow the repository's eventual runtime choice, but keep these responsibilities distinct:

    src/
      config/             # environment and run configuration
      profiles/           # structured synthetic learner profiles
      scenarios/          # initial Physics scenario and checkpoints
      orchestration/      # journey state machine and budgets
      browser/            # Playwright controller and action validation
      models/             # provider-neutral model/vision adapters
      evidence/           # events, screenshots, traces, manifests
      evaluation/         # independent evaluators (Phase 2 expansion)
      reporting/          # run summaries and exports (Phase 2 expansion)
    tests/
      unit/
      integration/
      scenarios/

This is a conceptual separation, not a requirement to create empty directories immediately. Add modules when a working slice needs them.

## Phase 1 risks

| Risk | Mitigation |
|---|---|
| Aceraa UI flow or test access is not ready | Confirm environment and test account before implementing selectors. |
| Locator ambiguity or responsive UI changes | Prefer roles, labels, and test IDs; reject ambiguous targets. |
| Model proposes invalid or repeated actions | Strict schema, allowlist, one action per decision, budgets, and loop detection. |
| Vision endpoint is not image-capable | Verify the exact endpoint or use a separate vision adapter; keep DOM-first behavior. |
| Backend trace cannot be correlated | Keep UI evidence complete; mark missing backend correlation explicitly. |
| Synthetic answer is academically ambiguous | Use verified reference data or human review for the initial scenario. |
| Browser artifacts contain secrets | Redact network data and use dedicated synthetic credentials. |
