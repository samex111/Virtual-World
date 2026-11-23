# Product vision

## One-line vision

**Build virtual students that use Aceraa like persistent learners, so the team can test the complete learning experience and diagnose product failures with evidence.**

Virtual World is the test system around the product. Aceraa remains the application being tested; Virtual World does not replace Aceraa, become its student-facing tutor, or judge itself.

## What we are building

A controlled simulation environment in which synthetic JEE/NEET learners have structured profiles, learning goals, knowledge state, confidence, preferences, and interaction history. A learner chooses realistic next intentions—ask a doubt, request practice, attempt a question, guess, make a mistake, request a hint, follow a recommendation, ignore it, or stop.

The learner interacts with the **real Aceraa application through its visible browser interface**. The system observes what is rendered, executes bounded browser actions, checks the resulting state, correlates the journey with backend/model events when possible, and preserves enough evidence to reproduce failures.

The first target is one synthetic JEE student completing a Physics practice journey around Newton's laws. This is a proof of the core loop, not a claim that one scenario covers the whole product.

## Why we are building it

A learning product can appear healthy at the API or unit-test level while a student still gets stuck in the actual experience. Examples include:

- A correct question is generated but the question card is missing, clipped, or unreadable.
- The options are present in the DOM but the visible controls do not respond.
- The student selects one option but the UI submits another.
- The backend evaluates an answer correctly but the UI displays the wrong status.
- Feedback appears but does not address the learner's question or misconception.
- A recommendation is shown but the next activity does not use the learner's updated state.
- A multi-step journey loses context or reaches a dead end.

Manual testing is valuable but hard to repeat at high volume. API-only testing cannot see many of these failures. Virtual World aims to create repeatable, diverse journeys without consuming real students' study time.

## North-star question

Can an engineer replay a virtual learner's journey from the learner's intention, through the visible UI and browser action, to the relevant product events—and determine whether a failure came from the student simulation, UI, workflow, backend, model/tool, or educational content?

## What success means

| Dimension | Evidence of success |
|---|---|
| Learning quality | Questions, answer keys, feedback, and explanations are correct for the specified topic and level. |
| Interaction quality | A learner can complete the expected journey through visible controls without dead ends. |
| Consistency | The application renders the response format and interaction component expected by the workflow. |
| Reliability | A failure can be replayed and traced to the relevant UI, backend, model/tool, or content evidence. |
| Longitudinal behavior | Structured student state persists across sessions and influences subsequent intentions and recommendations. |
| Evaluation integrity | Student mistakes are not confused with product defects; judgments use independent criteria and evidence. |

Success is not measured by how many messages an LLM generates. A smaller number of complete, reproducible journeys is more valuable than a large number of unverified chat turns.

## Product principles

1. **Real interface first.** Test the same browser experience a student sees. API checks may supplement, not replace, UI journeys.
2. **Persistent learners.** Store profiles and learning evidence as structured, versioned state—not only as conversation context.
3. **Observe, decide, act, verify.** Every browser action must be based on a current observation and followed by a postcondition check.
4. **Deterministic execution.** Models may interpret or propose; the controller owns permissions, validation, execution, and stopping.
5. **Independent evaluation.** The simulated student is not the judge of Aceraa.
6. **Evidence by default.** Every meaningful state transition has a timestamp and evidence references.
7. **Narrow before broad.** Prove one Physics journey before adding student populations, parallelism, or generic product adapters.

## What Virtual World is not

- Not a replacement for Aceraa's own unit, integration, API, or human QA.
- Not a benchmark claiming synthetic students represent real students statistically.
- Not a free-roaming computer-use agent with unrestricted browser or code execution.
- Not an autonomous grader that trusts its own generated answer or explanation.
- Not a multi-agent platform for its own sake.
- Not a system that uses real student accounts or real student personal data in its initial version.

## Long-term direction

After the Aceraa journey is reliable, the same core could support multiple student profiles, scenario libraries, scheduled regression runs, parallel browser workers, and eventually other web applications through configuration and adapters. Those are future capabilities, gated by the roadmap—not Phase 1 requirements.
