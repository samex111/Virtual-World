# Agents and responsibility boundaries

## First principle

Not every component in Virtual World should be an autonomous LLM agent. The journey orchestrator, action validator, Playwright controller, evidence collector, evaluators, and report builder should be deterministic software wherever possible.

The **Student Agent** simulates learner behavior. The vision/reasoning model is a bounded perception adapter. Independent evaluators judge Aceraa using evidence and criteria separate from the Student Agent.

## Responsibility map

### 1. Virtual Student Profile — persistent state, not an agent

**Purpose:** Maintain a synthetic learner identity and structured learning state across sessions.

Owns:
- Stable synthetic identity and student_id.
- Exam goal, class/level, subject focus, and preferences.
- Topic-level knowledge estimates, confidence, weak/strong topics, and candidate misconceptions.
- Interaction history and prior outcomes.
- Versioned state updates with provenance.

Must not:
- Exist only as a long prompt that disappears between turns.
- Treat an unverified model claim as a confirmed misconception.
- Contain real student personal data in the initial system.

### 2. Student Agent

**Purpose:** Choose plausible learner intentions from the profile, scenario, and latest verified browser observation.

Examples:
- Ask for Newton's laws practice.
- Read a question and inspect the options.
- Answer confidently, guess, or intentionally make a mistake.
- Ask for a hint or explanation after an incorrect answer.
- Accept or ignore a recommendation.
- Revisit a weak topic or end the session.

Inputs:
- Versioned student profile.
- Scenario and current journey goal.
- Latest browser observation and last verified action result.

Outputs:
- One learner intention at a time.
- Optional student utterance or synthetic answer.
- Structured behavior label or reason code suitable for audit, not private chain-of-thought.

Must not:
- Grade Aceraa or decide the run's final pass/fail status.
- Claim that a browser action happened before the controller verifies it.
- Directly execute Playwright, arbitrary code, or unrestricted tools.
- Change student knowledge without evidence-backed state updates.

### 3. Journey Orchestrator — deterministic state machine

**Purpose:** Own the run lifecycle and control observe → decide → validate → act → verify → record.

Owns:
- simulation_id, session_id, and action_id assignment.
- Scenario progression and expected checkpoints.
- Action, time, retry, and model-call budgets.
- State transitions, loop detection, timeout handling, and stop conditions.
- Supplying the next decision with the latest verified observation.

Must not:
- Treat a model proposal as an executed action.
- Skip verification because an action returned without an exception.
- Allow retries or loops to continue indefinitely.

### 4. Visual / Reasoning Adapter

**Purpose:** Interpret structured observations or screenshots when required and return constrained output.

Owns:
- Provider-neutral request/response interface.
- Image preparation only when the exact endpoint supports it.
- Model/provider/version metadata and structured-output parsing.

Must not:
- Assume every Nemotron model or hosted endpoint accepts images.
- Execute actions.
- Return arbitrary browser commands or code.
- Replace DOM/accessibility data as the source of truth for ordinary controls and text.

### 5. Action Validator and Playwright Browser Controller

**Purpose:** Convert an approved proposal into a browser operation and verify the result.

Owns:
- Action-schema validation and allowlisting.
- Safe locator resolution and uniqueness checks.
- Test-environment and field restrictions.
- Playwright execution, bounded waits, and explicit postconditions.
- Failure details when an action cannot be completed safely.

Must not:
- Expose arbitrary JavaScript or unrestricted browser access to a model.
- Type real credentials or secrets supplied in prompts.
- Silently choose one of several ambiguous targets.
- Report success without a verified postcondition.

### 6. Evidence Collector

**Purpose:** Preserve the facts needed to reconstruct and diagnose a run.

Owns:
- Structured event records and stable correlation IDs.
- Browser video, meaningful screenshots, Playwright trace, and DOM/accessibility snapshots.
- Model request/response metadata with sensitive data redacted.
- Backend/API traces when the application exposes them.
- Artifact manifest and retention metadata.

Must not:
- Capture secrets or unnecessary personal information.
- Treat missing backend telemetry as successful backend behavior.
- Record private model chain-of-thought.

### 7. Independent Evaluators

Evaluators judge Aceraa against expected outcomes; they do not decide what the student does.

| Evaluator | Questions it answers |
|---|---|
| UI evaluator | Was the expected question card visible? Were all options readable? Did selection and feedback render correctly? |
| Workflow evaluator | Could the learner complete the expected journey and reach each checkpoint? |
| Conversation evaluator | Did the response address the actual question and preserve relevant context? |
| Subject evaluator | Was the answer/explanation correct for the topic and level against a verified reference? |
| Learning evaluator | Was the misconception identified and was the next activity reasonable given the evidence? |

Use deterministic checks first. Use versioned independent rubrics for subjective dimensions. Preserve evidence references and confidence/limitations with every finding.

Must not:
- Depend on the Student Agent's self-assessment.
- Mark an intentional student mistake as a product defect.
- Treat a model-generated answer key as ground truth without verification.

### 8. Report Builder

**Purpose:** Turn run events and evaluator results into a reviewable report and raw evidence archive.

Owns:
- Run summary, timeline, pass/fail and severity breakdown.
- Key screenshots and evaluation outputs.
- Likely root causes clearly labelled as hypotheses, not facts.
- Recommended engineering follow-ups.
- HTML/PDF summary, ZIP evidence bundle, and artifact manifest.

Must not:
- Hide failed or missing checks.
- Invent root causes or telemetry.
- Replace raw evidence with a model-written summary.

## Handoff contract

1. The orchestrator provides the Student Agent with the latest profile, scenario goal, and verified observation.
2. The Student Agent returns one learner intention.
3. The orchestrator and observation layer derive the next allowed interaction; visual reasoning is called only when needed.
4. The validator approves or rejects one action proposal.
5. Playwright executes and verifies the postcondition.
6. The Evidence Collector records both success and failure outcomes.
7. Evaluators run at defined checkpoints or session end using captured evidence.
8. Student state is updated from verified learning evidence, separately from raw conversation.
9. The Report Builder packages the run without changing evaluator results.

## Design rule

Keep deterministic software in charge of control, permissions, persistence, and evidence. Use models for the narrow tasks that require language or visual interpretation. The system must remain understandable and debuggable even when a model provider is unavailable.
