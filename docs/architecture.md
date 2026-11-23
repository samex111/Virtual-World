# System architecture

## Architectural summary

Virtual World separates the learner simulation, journey orchestration, optional visual reasoning, browser execution, evidence collection, evaluation, and reporting. The first version should be a small, inspectable system—not a large multi-agent framework.

## Logical flow

    Synthetic student profile + scenario
                  |
                  v
             Student agent
          (chooses learner intent)
                  |
                  v
          Journey orchestrator
       (state machine, budgets, IDs)
                  |
          current observation
                  v
        Observation / perception
      (URL, DOM, accessibility, text)
             |             |
      visual ambiguity     | ordinary UI facts
             v             v
         Vision adapter   Structured state
             |             |
             +-- proposal--+
                  |
                  v
         Action validation layer
      (schema, allowlist, target, limits)
                  |
                  v
         Playwright controller
      (click, type, select, scroll, wait)
                  |
                  v
              Aceraa UI
                  |
                  v
       Evidence and event collector
        (video, screenshots, trace,
        snapshots, structured events,
          app traces where available)
                  |
             +----+----+
             |         |
             v         v
       Evaluators   Report builder
             |         |
             +----+----+
                  |
           Run result + evidence

## Component responsibilities

| Component | Owns | Does not own |
|---|---|---|
| Student profile store | Stable synthetic identity, exam goal, topic knowledge, confidence, habits, preferences, and history | Browser execution or product grading |
| Scenario definition | Preconditions, target journey, expected checkpoints, limits, and evaluation references | Adaptive learner state |
| Student agent | Chooses a plausible next learner intention based on profile, scenario, and current observation | Declaring Aceraa passed/failed |
| Journey orchestrator | State machine, budgets, retries, IDs, timeouts, stop conditions, and run lifecycle | Academic judgment or direct page manipulation |
| Observation layer | URL, visible text, relevant DOM/accessibility snapshot, and selected screenshot context | Guessing that an action succeeded |
| Model/vision adapter | Provider-neutral request/response boundary for reasoning or screenshot interpretation | Executing browser actions |
| Action validator | Schema validation, allowlist checks, unique target checks, and policy enforcement | Arbitrary code execution |
| Playwright controller | Approved browser actions and deterministic postcondition checks | Choosing the learner's intention |
| Evidence collector | Correlated event records, screenshots, video, trace, snapshots, and available app telemetry | Altering evaluation results |
| Independent evaluators | UI, workflow, conversation, subject, and learning checks | Controlling the student journey |
| Report builder | Run summary, failure classification, metrics, evidence index, and HTML/PDF/ZIP packaging | Inventing unavailable evidence |

## Observe → decide → validate → act → verify → record

1. **Observe.** Read the current URL, visible text, relevant DOM, and accessibility tree. Capture a screenshot only when it adds value or a failure occurs.
2. **Decide.** The student agent selects the next learner intention. A visual adapter may interpret a screenshot when DOM data is insufficient.
3. **Propose.** Produce one structured action proposal at a time. Do not ask a model for an unverified sequence of browser actions.
4. **Validate.** Check the action schema, allowed action type, target uniqueness, allowed field, action budget, and run state.
5. **Act.** Playwright executes the approved operation using role/name, label, or test-ID locators where possible.
6. **Verify.** Wait for and assert a meaningful postcondition. A successful locator click or lack of exception is not sufficient.
7. **Record.** Append the intention, proposal, validated action, result, timestamp, and evidence references under stable run identifiers.

The next decision must use the new observation. Never assume that a click worked merely because Playwright returned.

## Browser action boundary

The initial allowlist should be limited to:

| Action | Inputs | Required guardrail |
|---|---|---|
| click | Role/name, label, or test ID; coordinates only as a last resort | Target resolves uniquely; verify resulting state |
| type | Approved field locator and synthetic text | Field is allowlisted; no real credentials or secrets |
| select | Select locator and option label | Confirm selected value after action |
| scroll | Direction and bounded distance or target | Bound movement and detect no-progress loops |
| wait | Specific UI condition and timeout | No unbounded or arbitrary long sleeps |
| navigate | Approved test-environment route | Same-origin/route policy and test-environment restriction |
| finish | Completion reason and summary | Persist final evidence and close cleanly |
| report_issue | Observed blocker and evidence references | Report only observed facts; preserve run artifacts |

Do not expose arbitrary JavaScript execution, browser devtools, shell commands, unrestricted network calls, or direct database mutation as model tools.

## Model adapter and visual reasoning

The system must not be coupled to a single provider. Define a narrow adapter for text reasoning and, where needed, image-capable reasoning. Record the exact provider, model ID, endpoint configuration version, prompt version, structured input/output, usage, latency, and errors.

Use the browser's DOM and accessibility tree for facts such as button names, text, labels, and selected values. Send screenshots to a vision-capable endpoint only when layout, diagrams, charts, visual hierarchy, or rendering cannot be interpreted reliably from structured browser data.

Nemotron is a candidate provider, not an assumed capability. Verify the exact model identifier and serving endpoint's image-input format, context limits, tool/function-calling support, rate limits, and pricing before depending on it. If the selected Nemotron endpoint is text-only, keep it for text reasoning and use a separate vision provider behind the same adapter boundary.

## Evidence and correlation

Every run should have stable identifiers:

- simulation_id: one complete simulation run.
- student_id: one synthetic learner profile.
- session_id: one browser journey/session.
- action_id: one proposed/executed action.
- trace_id: correlation to frontend/backend work when the application can propagate it.

The evidence collector should connect the learner intention, model proposal, Playwright action, visible browser state, and relevant application events. If the Aceraa application cannot yet propagate trace_id, keep browser evidence usable and mark backend correlation as unavailable rather than blocking the proof of concept.

Capture full browser video and a Playwright trace for the run. Add screenshots at meaningful checkpoints and failures—not after every mouse movement. Store DOM/accessibility snapshots near important transitions.

## Evaluation and reporting

Use deterministic assertions wherever possible. A separate evaluator layer checks:

- **UI:** expected question card, options, selected state, feedback, and visible controls.
- **Workflow:** expected path from practice entry through answer submission and follow-up.
- **Conversation:** relevance, context preservation, and whether the student's question was addressed.
- **Subject:** correctness against verified answer keys or reviewed reference material.
- **Learning:** whether an observed misconception was handled appropriately and the next recommendation is sensible.

The student agent is never the evaluator. LLM-based evaluators must use versioned rubrics, cite evidence references, and be calibrated against known examples. High-impact academic correctness claims should have deterministic references or human review; an unconstrained model score alone is not ground truth.

Each run should produce a machine-readable evaluation, a human-readable HTML/PDF summary, and a ZIP evidence bundle with a manifest.

## Reliability, privacy, and cost

- Run only in a dedicated Aceraa test environment with synthetic accounts.
- Keep secrets out of prompts and artifacts; redact cookies, tokens, and personal data from captured network evidence.
- Enforce action count, wall-clock, retry, model-call/token, and artifact-size budgets.
- Add loop detection and explicit stop conditions.
- Version profiles, scenarios, prompts, model IDs, and evaluator rubrics.
- Prefer DOM snapshots to vision calls when both provide the same information.
- Start sequentially; parallel browser workers are a later phase.
- Make missing telemetry explicit. Never imply that an API/backend event was observed when it was not.

## Proposed first-run artifacts

    simulation-SIM-001/
      student-profile.json
      run-manifest.json
      report.html
      report.pdf
      session-001/
        session.json
        browser-video.webm
        playwright-trace.zip
        events.jsonl
        evaluation.json
        model-interactions.json
        backend-traces.json
        screenshots/
      artifact-manifest.json

The precise storage backend and report-generation implementation remain open decisions. Local files are sufficient for the initial proof of concept.
