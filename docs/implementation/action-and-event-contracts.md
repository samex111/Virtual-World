# Action and event contracts

These versioned contracts are implemented for the Phase 1 runtime. Update the code, tests, and this document together when they evolve.

## Stable identifiers

| Field | Meaning | Scope |
|---|---|---|
| simulationId | Complete simulation run | One run |
| studentId | Synthetic learner profile | Stable across sessions |
| sessionId | One browser journey | One journey within a run |
| actionId | One proposed/executed browser action | One action |
| traceId | Optional backend correlation identifier | Present only when actually supplied by Aceraa |

Events carry schema version, ISO-8601 timestamp, event type, run identifiers, scenario/profile versions, and evidence references where applicable.

## Student intention and action proposal

The Student Agent returns one learner intention and a bounded behavior label. A separate action planner converts that intention and the latest verified observation into one action proposal. Neither component can execute browser operations.

Example action proposal:

~~~json
{
  "schemaVersion": "1",
  "actionId": "ACT-001",
  "intention": "Open the Physics practice area",
  "action": "click",
  "target": { "strategy": "role", "role": "button", "name": "Physics" },
  "expected": {
    "kind": "visible",
    "target": { "strategy": "text", "value": "Practice", "exact": true }
  },
  "timeoutMs": 5000
}
~~~

Allowed operations: `click`, `fill`, `check`, `uncheck`, `selectOption`, and a small keyboard-key allowlist. Targets must use exact accessible role/name, label, placeholder, test ID, or text. CSS, XPath, coordinates, arbitrary JavaScript, shell, and free-form network requests are not supported. Authentication and destructive/financial/external-communication controls are blocked. Every action needs a postcondition.

Target resolution must return exactly one visible, enabled element. Ambiguous/missing targets fail closed. Timeout and action budgets are controller-owned; model output cannot increase them. Browser actions are not automatically retried.

## Event record

Example (values are illustrative):

~~~json
{
  "schemaVersion": "1",
  "eventId": "EVT-example",
  "eventType": "browser_action_completed",
  "occurredAt": "2026-11-23T12:00:00.000Z",
  "simulationId": "SIM-example",
  "studentId": "student_jee_physics_001",
  "sessionId": "SESSION-example",
  "actionId": "ACT-001",
  "traceId": null,
  "scenarioId": "physics_newtons_laws_jee_main_v1",
  "scenarioVersion": "1.0.0",
  "profileVersion": 1,
  "execution": { "status": "completed", "durationMs": 420 },
  "verification": { "kind": "visible", "observed": "verified" },
  "evidenceRefs": ["observations/ACT-001-after.json", "screenshots/ACT-001.png"]
}
~~~

Event types include simulation start/finish/failure, intention selected, observation captured, action proposed/rejected/started/completed/failed, postcondition verified, model call completed, student state updated, checkpoint evaluated, and issue reported. Rejected and failed actions are records too. Model metadata is limited to provider, model ID, prompt version, latency, and token counts; request content and private chain-of-thought are never persisted.

## Student learning evidence

Keep learning state separate from raw conversation. Any update must identify topic, question/scenario, difficulty, attempt outcome, and supporting evidence. Phase 1 accepts only `approved_answer_key` or `reviewed_evaluator` as update provenance, and the evidence reference must belong to the verified action. One uncertain answer must not become a definitive misconception.

## Artifact manifest

Each artifact entry records relative path, content type, size, SHA-256, creation time, and redaction status. Run bundles include `events.jsonl`, DOM-first observations, screenshots, browser video, sanitized Playwright trace, and `manifest.json`. Artifact paths cannot escape the run directory; each file has a size cap.

Sensitive fields are redacted from structured records. The Playwright trace sanitizer removes headers/cookies and request/response bodies, strips URL query strings, and redacts email/token patterns before storage. Only synthetic QA accounts may be used; browser video is still treated as restricted test evidence.

## Contract evolution

- Keep schema versions explicit and prefer additive changes.
- Keep examples synthetic and clearly labelled.
- Never record model chain-of-thought, credentials, cookies, or real student data.
- Update tests and this document together when a contract changes.
