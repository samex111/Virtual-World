# System Architecture

## Architectural shape

Keep learner simulation, model reasoning, browser execution, evidence collection, and evaluation separate so each failure can be diagnosed and model providers can be replaced independently.

```text
Virtual Student Profile + Learning State
                 |
                 v
       Student Agent / Orchestrator
       (chooses learner intention)
                 |
        task + current observation
                 v
     Perception / Model Adapter(s)
   (DOM-first; vision when necessary)
                 |
        constrained action proposal
                 v
       Action Validator / Policy
                 |
          approved action
                 v
       Playwright Browser Controller
                 |
                 v
             Real Aceraa UI
                 |
        observed result + events
                 v
 Evidence Collector + Correlation Layer
                 |
                 v
 Independent Evaluators + Report Builder
```

The application under test remains separate. An end-to-end run must not silently replace real product behavior with mocks.

## Component boundaries

| Component | Owns | Must not own |
|---|---|---|
| Student profile | Synthetic identity, goals, level, preferences, knowledge, history | Product pass/fail judgment |
| Student agent | Next learner intention and plausible behavior | Browser execution or product grading |
| Orchestrator | Run state machine, budgets, prompts, retries, sequencing | Unbounded autonomous execution |
| Perception/model adapter | Interpret observation and propose a schema-valid action | Direct browser control |
| Action validator | Schema, allowlist, target uniqueness, permissions, budgets | Guessing ambiguous targets |
| Playwright controller | Locator resolution, action execution, waits, assertions, browser artifacts | Model-driven arbitrary JavaScript |
| Evidence collector | Correlation, screenshots, video, traces, snapshots, metadata | Claims about unavailable backend events |
| Evaluators | UI, workflow, conversation, subject, learning checks | Relying solely on student-agent opinion |
| Report builder | Human-readable summary and raw evidence manifest | Inventing unsupported root causes |

## Controlled interaction loop
1. **Observe:** URL, visible text, relevant DOM, accessibility tree, and screenshot when visual context is needed.
2. **Decide:** student agent chooses an intention; adapter proposes one allowed action from the current observation.
3. **Validate:** check schema, action type, target uniqueness, environment policy, and remaining budgets.
4. **Act:** Playwright performs the action using accessible locators or stable test IDs.
5. **Verify:** wait for a meaningful expected state and assert it. A click call alone is not proof.
6. **Record:** persist intention, proposal, validated action, result, timestamp, and evidence references.

The next decision must use the newly observed state, never an assumption that the previous click worked.

## Constrained action contract
Example proposal:

```json
{
  "action": "click",
  "target": { "kind": "role", "role": "button", "name": "Start practice" },
  "expected": { "kind": "visible", "target": "practice-question-view" }
}
```

Initial allowlist:
- `click`: role/name, label, or test ID; target must resolve uniquely.
- `type`: approved synthetic input field only.
- `select`: visible option; verify selected value.
- `scroll`: bounded direction/distance or target; detect no progress.
- `wait`: specific UI condition with timeout.
- `finish`: structured completion summary.
- `report_issue`: stop or flag blocker with observed evidence.

Coordinates are a last-resort fallback for inaccessible visual controls and must be bounded and recorded. No arbitrary browser commands, shell access, model-authored page.evaluate, or unrestricted network access.

## Model and vision strategy
Use DOM/accessibility data first for button names, labels, text, and selected states. Use a vision-capable model only when layout, charts, images, or rendered content cannot be interpreted reliably from DOM data.

A provider-neutral adapter isolates model-specific schemas. Nemotron is a candidate, not a hard dependency. Verify the exact model ID, image-input support, payload format, context limits, tool/function calling, rate limits, and pricing before depending on an endpoint. A text-only reasoning endpoint can coexist with a separate vision model.

The model proposes actions; deterministic code validates and executes them.

## Persistent student state
Represent each student as versioned structured data:
- `student_id`, synthetic identity metadata, exam goal, class/level, subject.
- Topic knowledge estimates, evidence, confidence, and misconceptions.
- Behavior tendencies: pace, guessing likelihood, hint preference, explanation preference.
- Current goal/intention and scenario context.
- Session history and prior attempts.

After interactions, store evidence separately from raw conversation: topic, question ID, difficulty, selected answer, correctness, hint use, confidence, and evaluator-supported misconception. Do not update knowledge just because a model generated a plausible narrative.

## Evidence and correlation
Assign each run a `simulation_id`, each learner a `student_id`, each browser journey a `session_id`, and each action an `action_id`. Propagate a `trace_id` into frontend requests and backend logs where integration permits.

Capture:
- Full browser video.
- Screenshots at meaningful transitions and failures.
- Playwright trace and locator/action timeline.
- DOM/accessibility snapshots around important states.
- Available API/backend events and response metadata.
- Model ID, prompt version, structured input/output, latency, token usage, and errors.
- Evaluator output, expected/observed values, severity, and evidence references.

Do not screenshot every mouse movement. Use video for continuity and targeted screenshots for diagnosis. Redact secrets, cookies, tokens, and personal data.

## Independent evaluation
Use deterministic assertions wherever possible. LLM-assisted evaluation may support interpretation but cannot be the sole authority for facts that can be asserted.

- **UI evaluator:** question card visible, options readable, selection reflected, feedback rendered.
- **Workflow evaluator:** practice starts, answer submits, feedback appears, follow-up works.
- **Conversation evaluator:** response addresses the doubt and preserves relevant context.
- **Subject evaluator:** answer key and explanation are correct for Physics concept and level.
- **Learning evaluator:** misconception detection and recommendation fit observed evidence.

Each finding includes expected outcome, observed outcome, pass/fail, severity, evaluator version, and evidence references. Student behavior and product behavior remain separate.

## Reporting and artifacts
Eventually produce a readable HTML report (first) and PDF summary plus a ZIP evidence bundle. The bundle includes profile, session metadata, event JSONL, screenshots, video, Playwright trace, DOM snapshots, available backend/model records, evaluator output, and manifest.

```text
artifacts/<simulation-id>/
  student-profile.json
  report.html
  report.pdf
  manifest.json
  sessions/<session-id>/
    session.json
    events.jsonl
    browser-video.webm
    playwright-trace.zip
    evaluation.json
    screenshots/
    dom/
    backend/
    model/
```

## Reliability and safety
Use dedicated test environments and synthetic accounts. Set action, time, retry, token, concurrency, and artifact-size budgets. Add loop detection, bounded waits, redaction, and explicit stop conditions. Version scenarios, profiles, prompts, model IDs, and evaluator rubrics for comparison.
