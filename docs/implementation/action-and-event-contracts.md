# Initial action and event contracts

These are proposed contracts for Phase 1, not claims about existing runtime code. Keep them versioned and update this document when implementation changes them.

## Stable identifiers

| Field | Meaning | Scope |
|---|---|---|
| simulation_id | Complete simulation run | One run |
| student_id | Synthetic learner profile | Stable across that learner's sessions |
| session_id | One browser journey | One journey within a run |
| action_id | One proposed/executed browser action | One action |
| trace_id | Correlates browser-triggered application work | Propagated when supported by Aceraa |

Events also carry an ISO-8601 timestamp, event type, schema version, and relevant profile/scenario versions.

## Action proposal

The Student Agent returns a learner intention, not unrestricted browser instructions. The orchestrator or a narrow action planner translates that intention into one allowed browser operation.

Illustrative proposal:

    {
      "schema_version": "1",
      "action_id": "ACT-001",
      "action": "click",
      "target": {
        "strategy": "role",
        "role": "button",
        "name": "Start practice"
      },
      "expected": {
        "kind": "visible",
        "target": {
          "strategy": "text",
          "value": "Practice"
        }
      },
      "timeout_ms": 5000
    }

The controller validates the proposal against an allowlist. The target must resolve uniquely. Timeout and action budgets are controller-owned; model output cannot raise them.

## Target strategy preference

1. Accessible role and name.
2. Label or placeholder, where appropriate.
3. Stable test ID.
4. Coordinates only for an explicitly visual target where semantic locators are unavailable.

Coordinates must be bounded to the current viewport and checked against a fresh screenshot. They are not a general alternative to semantic locators.

## Event record

Illustrative append-only event:

    {
      "schema_version": "1",
      "event_id": "EVT-001",
      "event_type": "browser_action_verified",
      "occurred_at": "2026-11-23T12:00:00.000Z",
      "simulation_id": "SIM-001",
      "student_id": "student_jee_001",
      "session_id": "SESSION-001",
      "action_id": "ACT-001",
      "trace_id": null,
      "scenario_id": "physics_newtons_laws_jee_main_v1",
      "profile_version": 1,
      "observation_ref": "observations/OBS-001.json",
      "proposal": {
        "action": "click",
        "target": "Start practice"
      },
      "execution": {
        "status": "completed",
        "duration_ms": 420
      },
      "verification": {
        "status": "passed",
        "postcondition": "Practice view is visible"
      },
      "evidence_refs": [
        "screenshots/practice-view.png",
        "snapshots/practice-view.json"
      ]
    }

Values are illustrative only. Runtime events must use actual observed values and generated identifiers. Do not store private chain-of-thought in events.

## Event types

- simulation_started
- student_intention_selected
- observation_captured
- action_proposed
- action_rejected
- browser_action_started
- browser_action_completed
- browser_action_failed
- postcondition_verified
- checkpoint_evaluated
- student_state_updated
- issue_reported
- simulation_finished

A failed or rejected action is still an event. Preserve enough context to explain why the controller refused it.

## Student learning evidence

Keep learning state separate from raw conversation. An evidence item may include:
- Topic and subtopic.
- Question/scenario identifier and difficulty.
- Student's selected answer and whether it was correct.
- Whether a hint or explanation was requested.
- Student confidence, if explicitly elicited or configured as a simulation attribute.
- Candidate misconception and supporting evidence reference.
- Outcome source: verified answer key, observed UI, or reviewed evaluator.
- Profile version before and after the update.

Do not promote one uncertain answer into a definitive misconception without an explicit confidence/update policy.

## Evaluation result

A finding identifies:
- Evaluator name and version.
- Check/rubric identifier and version.
- Expected result and observed result.
- Pass, fail, or inconclusive status.
- Severity, when applicable.
- Evidence references.
- Confidence and limitations for interpretive judgments.

Use inconclusive when evidence is insufficient. Missing evidence is not a pass.

## Artifact manifest

List each artifact's relative path, media/content type, size, checksum where practical, creation time, related IDs, and redaction status. Never expose secrets or private student data.

## Contract evolution

- Version schemas from the start.
- Prefer additive changes.
- Keep examples synthetic and clearly labelled.
- Update tests and this document together when a contract changes.
