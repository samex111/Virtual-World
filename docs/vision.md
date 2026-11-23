# Product Vision

## One-line vision
Virtual-World creates persistent, realistic synthetic learners that use educational products through their real interfaces, while an independent system observes, evaluates, and explains the experience with reproducible evidence.

## What we are building
We are building a virtual student testing system—not a chatbot that generates random student messages and not a fixed script that fires API requests.

Each virtual student has persistent structured state:
- Exam goal, class/level, subject, and target topics.
- Current knowledge estimates, known misconceptions, and confidence.
- Preferences and interaction tendencies.
- Session history and evidence-backed learning-state updates.
- Current intention: ask a doubt, practise, guess, request a hint, stop, or revisit a weak topic.

The student interacts with the actual application. For Aceraa, the first journey navigates to Physics practice, requests a JEE-level question, reads the rendered question and options, selects and submits an answer, reads feedback, asks a follow-up, and responds to a recommendation.

The system records what the student intended, what the model proposed, what the browser executed, what the UI displayed, and what the product returned. Independent evaluators determine whether expected product behavior occurred.

## Why this matters
A learning product is more than its API responses. A correct backend response is useless if the question card is broken, the answer cannot be selected, feedback is missing, or the next step traps the learner. Testing must cover the visible journey and connect failures to evidence engineers can reproduce.

Synthetic students enable repeatable, diverse, high-volume test journeys without consuming real students' study time. They are controlled test instruments—not a claim that synthetic behavior statistically represents all real learners.

## Product principles
1. **Real interface first:** exercise the product as a learner experiences it.
2. **Persistent learner state:** identity, knowledge, and history survive across sessions.
3. **Separation of duties:** the student behaves; independent evaluators judge.
4. **Evidence over assertion:** a click is not success; verify the resulting state.
5. **Bounded autonomy:** models propose constrained actions; deterministic controllers validate and execute.
6. **Provider independence:** vision and reasoning models are replaceable adapters.
7. **Reproducibility:** version profiles, scenarios, prompts, evaluators, and model identifiers.
8. **Useful failure reports:** every failure points to observed behavior and supporting artifacts.

## What success looks like

| Dimension | Success signal |
|---|---|
| Learner realism | Intentions are coherent with profile, knowledge, confidence, and history. |
| UI interaction | The student completes the intended journey through visible controls without dead ends. |
| Academic correctness | Questions, answer keys, and explanations are correct for topic and level. |
| Consistency | The UI renders the response format required by the workflow. |
| Learning continuity | Earlier attempt evidence influences later behavior and state. |
| Reliability | Failures are reproducible and traceable across UI, backend, model, and content layers. |
| Evaluation quality | Seeded defects are detected without treating student mistakes as product failures. |
| Operational control | Runs respect time, action, token, retry, concurrency, and storage budgets. |

## First proving ground
Aceraa is the first application under test. Initial scope is one synthetic JEE Main student, one browser, and one Physics practice journey focused on Newton's laws. Prove the complete observe–act–verify–record–evaluate loop before adding many students, subjects, or parallel workers.

## Long-term direction
After the Aceraa workflow is reliable, Virtual-World can become a reusable testing engine for other web applications. Reuse should come from explicit application adapters, scenario definitions, test-account configuration, and evaluator contracts—not premature abstraction.
