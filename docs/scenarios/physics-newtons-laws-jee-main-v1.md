# Scenario: JEE Main Physics — Newton's laws (v1)

**Status: scenario contract drafted; target selectors and academic reference pending review.**

## Purpose

Verify that one persistent synthetic JEE Main learner can enter Aceraa Physics practice, request a Newton's laws question, inspect it, submit an answer, understand the feedback, and ask one relevant follow-up.

This scenario is a workflow contract. It does not invent a question, answer key, or expected explanation. Those must be approved against a trusted Physics reference before Phase 1 runs.

## Synthetic learner

| Attribute | Initial value |
|---|---|
| student_id | student_jee_physics_001 |
| Goal | JEE Main preparation |
| Subject | Physics |
| Topic | Newton's laws of motion |
| Knowledge estimate | Intermediate; friction and free-body diagrams are weaker areas |
| Confidence tendency | Moderate; may guess when uncertain |
| Explanation preference | Step-by-step reasoning after an attempt |
| Data classification | Synthetic test profile; no real learner data |

Initial knowledge values are scenario inputs, not a claim about a real student. The profile version and scenario version must be attached to every run.

## Preconditions

- Approved Aceraa test environment and synthetic account are ready.
- A clean starting state can be restored.
- The Physics practice entry point and required controls are mapped.
- A subject owner approves the reference question, answer key, and feedback rubric.
- Browser artifacts and available backend events can be retained safely.

## Learner journey and product expectations

| Step | Learner intention | Product behavior to verify | Evidence |
|---|---|---|---|
| 1. Enter | Open Aceraa | Test account reaches the expected signed-in state | URL, screenshot, heading/landmark snapshot |
| 2. Navigate | Find Physics practice | Correct subject/practice area is reachable through visible UI | Action event, route, screenshot |
| 3. Request | Ask for JEE Main Newton's laws practice | A question is generated or selected and rendered at the requested level/topic | Visible prompt, question ID when available, response metadata |
| 4. Inspect | Read question and options | Question text and all answer options are visible and associated correctly | DOM snapshot and screenshot |
| 5. Answer | Select one option and submit | Selected option is reflected in the UI and the submission is accepted once | Action result, selected state, network event when available |
| 6. Review | Read the result | Correctness indicator and explanation agree with the reviewed reference | Screenshot, visible feedback, independent reference |
| 7. Follow up | Ask why the answer is correct/incorrect | Response addresses this question and preserves relevant context | Follow-up input/output, conversation context evidence |
| 8. Finish | End the practice interaction | Session reaches a stable terminal state and evidence is persisted | Final URL/state, run manifest, event log |

## Academic reference (must be reviewed)

Do not hard-code an answer or explanation until the Physics reference is approved.

| Field | Value |
|---|---|
| Question ID / source | Pending subject-owner review |
| Exact question text | Pending |
| Correct option | Pending |
| Verified derivation / explanation | Pending |
| Accepted equivalent explanations | Pending |
| Common misconception(s) to probe | Pending |
| Reviewer and review date | Pending |

## Failure classification

A deliberately incorrect student answer is expected behavior. It is not a product defect by itself.

Potential product defects include:
- The UI selects or submits a different option from the one the student chose.
- The answer key or correctness indicator contradicts the approved reference.
- The explanation is materially incorrect, contradictory, or unrelated to the question.
- A required control is missing, inaccessible, or cannot be activated.
- The follow-up loses the question context or fails to render a response.

When evidence is insufficient, classify the check as inconclusive, not passed or failed.

## Replay and reset requirements

Every run must record the scenario/profile versions and begin from the documented clean state. The reset procedure must not delete or change production data. Randomized question selection must either be disabled for the first proof or capture enough identifiers and reference metadata to make the observed question reproducible.
