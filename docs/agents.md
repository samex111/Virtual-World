# Agents and responsibility boundaries

## Important terminology

Virtual World uses a few reasoning components, but not every component should be an autonomous LLM agent. The journey orchestrator, validators, browser controller, evidence collector, and report builder should be ordinary, deterministic software wherever possible.

The only component whose primary job is to behave like a learner is the **Student Agent**. The visual model is a perception adapter. Evaluators are separate from the learner and from browser execution.

## Responsibility map

### 1. Virtual Student Profile (state, not an agent)

**Purpose:** Maintain a persistent synthetic learner identity and learning state.

Owns:
- Synthetic identity and stable student_id.
- Exam goal, class/level, subject focus, and preferences.
- Topic-level knowledge estimates, confidence, weak/strong topics, and known misconceptions.
- Interaction history and prior outcomes.
- Versioned state updates after a session.

Must not:
- Be represented only by a long prompt that disappears between turns.
- Be updated from an unverified model claim without recording the supporting evidence.
- Contain real student personal data in the initial system.

### 2. Student Agent

**Purpose:** Choose plausible learner intentions from the profile, scenario, and current browser observation.

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
- Current browser observation and last verified action result.

Outputs:
- One learner intention at a time.
- Optional student utterance or synthetic answer.
- A structured reason code or behavior label suitable for audit (not private chain-of-thought).

Must not:
- Grade Aceraa or decide the run's final pass/fail status.
- Claim that an action happened before the browser verifies it.
- Directly execute Playwright, arbitrary code, or unrestricted tools.
- Change profile knowledge without an evidence-backed state update.

### 3. Journey Orchestrator (deterministic state machine)

**Purpose:** Own the run lifecycle and control the observe → decide → validate → act → verify loop.

Owns:
- simulation_id, session_id, and action_id assignment.
- Scenario progression and expected checkpoints.
- Action, time, retry, and model-call budgets.
- State transitions, loop detection, timeout handling, and stop conditions.
- Passing current observations and verified results to the next step.

Must not:
- Treat a model proposal as an executed action.
- Skip verification because an action returned without an exception.
- Let retries continue indefinitely.

### 4. Visual / Reasoning Adapter

**Purpose:** Interpret structured observations or screenshots when required and return a constrained proposal.

Owns:
- Provider-neutral request/response interface.
- Image preparation and supported payload conversion, if the exact endpoint allows it.
- Model/provider/version metadata and structured output parsing.

Must not:
- Assume all Nemotron models or hosted endpoints accept images.
- Execute actions.
- Return arbitrary browser commands or code.
- Be the only source of truth for visible UI facts that can be read from the DOM.

### 5. Action Validator and Playwright Browser Controller

**Purpose:** Convert a valid, allowed proposal into a browser operation and verify its result.

Owns:
- Action schema validation and allowlisting.
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

Use deterministic checks first. Use versioned independent rubrics for subjective dimensions. Preserve evidence references and confidence/limitations with every evaluation result.

Must not:
- Depend on the Student Agent's self-assessment.
- Mark an intentional student mistake as a product defect.
- Treat a model-generated answer key as ground truth without verification.

### 8. Report Builder

**Purpose:** Turn run events and evaluator results into a concise, reviewable report plus raw evidence archive.

Owns:
- Run summary, timeline, pass/fail and severity breakdown.
- Key screenshots and evaluation outputs.
- Likely root causes clearly labelled as hypotheses, not facts.
- Recommended engineering follow-ups.
- HTML/PDF summary, ZIP evidence bundle, and artifact manifest.

Must not:
- Hide failed or missing checks.
- Invent root causes or telemetry.
- Replace the raw evidence with a model-written summary.

## Handoff contract

1. Orchestrator provides the Student Agent with the latest profile, scenario goal, and verified observation.
2. Student Agent returns one learner intention.
3. Orchestrator and observation layer derive the next allowed interaction; visual reasoning is called only when needed.
4. Validator approves or rejects the single action proposal.
5. Playwright executes and verifies the postcondition.
6. Evidence Collector records both success and failure outcomes.
7. Evaluators run at defined checkpoints or at session end using captured evidence.
8. Profile state is updated from verified learning evidence, separately from the raw conversation.
9. Report Builder packages the run without changing evaluator results.

## Design rule

Keep deterministic software in charge of control, permissions, persistence, and evidence. Use models for the narrow tasks that genuinely require language or visual interpretation. This system should remain understandable and debuggable even when every model provider is unavailable.
