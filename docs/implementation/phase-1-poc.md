# Phase 1 — Proof of concept

**Implementation status: reusable Phase 1 runtime implemented and unit-tested; the Aceraa end-to-end run remains blocked on target-specific readiness.** Do not mark Phase 1 complete until the exit criteria are demonstrated against the approved Aceraa QA tenant.

## Objective and journey

Build one reliable journey in which a synthetic JEE Main learner uses Aceraa's real Physics practice UI. The learner enters the approved test environment, navigates to Physics, requests a Newton's laws question, reads the question/options, selects and submits one answer, verifies feedback, asks one follow-up, and ends the session with a replayable evidence bundle.

The student may intentionally answer incorrectly. That is valid learner behavior; it is a product defect only if Aceraa mishandles the chosen answer, result, feedback, or follow-up.

## Implemented runtime

| Slice | Implementation | Boundary |
|---|---|---|
| Browser baseline | One Chromium context, allowlisted HTTP/WebSocket traffic, semantic Playwright locators, unique-target checks, mandatory postconditions | Aceraa selectors/routes are not guessed |
| Run/event contracts | Correlated simulation/student/session/action IDs, append-only JSONL events, observations, screenshots and checksummed manifest | Backend trace correlation is optional and never fabricated |
| Persistent learner | Versioned synthetic JEE Physics profile stored as JSON, evidence history and atomic updates | Knowledge changes need approved-answer or reviewed-evaluator provenance |
| Controlled loop | Separate Student Agent intention and action planner, deterministic validate/act/verify/record orchestration | No provider SDK or model name is hard-coded |
| Safety/reliability | Action, duration, decision-call and timeout budgets; bounded retries; no-progress detection; ambiguous locator rejection; blocked auth/destructive controls | Browser actions are never retried automatically |
| Evidence | Redacted event data, Playwright trace sanitization, video, artifact size/path checks, SHA-256 manifest | Run only with a synthetic account in QA |
| Aceraa journey | Auth, Physics route mapping, reviewed question, feedback/follow-up checkpoints, reset | Still pending QA access and academic sign-off |

## Preconditions

- Dedicated Aceraa test URL and isolated tenant are confirmed.
- Synthetic test account is provisioned and verified.
- Authentication can be performed without putting secrets in prompts or artifacts.
- Actual Physics practice route and visible controls are mapped.
- A Physics owner approves the Newton's laws question, answer key, and explanation criteria.
- Available backend correlation fields are documented, or marked unavailable.

Do not guess route paths, selectors, credentials, reset steps, or backend trace fields.

## Commands

Requirements: Node.js 22+, installed dependencies, and Chromium.

~~~bash
npm install
npx playwright install chromium
cp .env.example .env
# Configure the approved QA URL, exact allowlist, and synthetic account locally.
npm test
npm run phase0:check
npm run phase0:inspect
npm run phase1:check
npm run phase1:run
~~~

`phase1:check` validates the target and local adapter presence; it does not independently prove owner provisioning. `phase1:run` refuses to start unless the account is marked ready, the local adapter authenticates, and the adapter supplies an approved Physics reference.

## Local Aceraa adapter contract

The target-specific adapter is deliberately not committed because the authenticated QA UI has not been inspected. Set `PHASE1_ADAPTER_MODULE=./local/aceraa-phase1-adapter.mjs`; `local/` is gitignored.

Export `createAceraaAdapter({ targetConfig, scenarioDefinition })`, returning:

- `authenticate({ page, credentials })`: trusted local QA-account login only. This is outside the model interface.
- `verifyAuthenticated({ page })`: return true only for a real observed signed-in state.
- `createScenario({ page, profile, scenarioDefinition })`: return `{ checkpoints, academicReference }`. `checkpoints.isComplete({ profile, observation, history })` checks actual UI state. `academicReference` must include `status: "approved"` and a named `reviewer`.
- `createStudentAgent({ profile, scenario })`: return an object with `decide(context)` producing one `{ intention, behavior, model? }`. It receives no credentials or browser object.
- `createActionPlanner({ scenario })`: return an object with `plan(context)` producing one proposal, optionally wrapped as `{ proposal, model }`.

Allowed actions are `click`, `fill`, `check`, `uncheck`, `selectOption`, and a small keyboard-key allowlist. Targets are exact role/name, label, placeholder, test ID, or text. CSS, XPath, coordinates, JavaScript, arbitrary network requests, and shell actions are not accepted. Every action needs an explicit postcondition; ambiguous targets fail closed.

The Student Agent/planner receive a synthetic profile, public scenario, latest redacted DOM-first observation, intention, and history. Credentials are passed only to `authenticate`, then removed from the process environment before agent creation. Tracing starts after authentication. Trace network headers, cookies, query strings, and request/response bodies are redacted before retention.

Knowledge updates returned by `checkpoints.onVerifiedAction` must include a `learningState` patch and provenance with `outcomeSource` equal to `approved_answer_key` or `reviewed_evaluator`, plus an `evidenceRef` belonging to that verified action. A guessed answer or unreviewed UI correctness label cannot become a confirmed misconception.

## Remaining blockers to a real Aceraa run

- [ ] Dedicated isolated QA tenant and exact URL confirmed.
- [ ] Synthetic JEE account provisioned and independently verified.
- [ ] Clean reset procedure documented and tested.
- [ ] Authenticated routes/controls inventoried from the live UI.
- [ ] Local adapter implemented using observed routes and accessible locators.
- [ ] Newton's laws question, answer, and explanation approved by a Physics owner.
- [ ] Backend correlation fields documented or explicitly marked unavailable.
- [ ] Repeated complete runs from a clean state produce complete evidence bundles.

## Definition of done

- [ ] Run starts from a documented clean synthetic state.
- [ ] Student reaches Physics practice, requests and inspects a Newton's laws question.
- [ ] Student selects/submits through visible UI, sees feedback, and asks one follow-up.
- [ ] Every action has input, result, timestamp, and evidence reference.
- [ ] Video, trace, screenshots, structured events, and manifest are retained.
- [ ] Action/time/retry/model-call limits are enforced.
- [ ] Failed runs preserve enough evidence to diagnose.
- [ ] The journey replays repeatedly from a clean state without hidden manual steps.

Phase 1 does not require a PDF report, multiple learners, parallel execution, or a dashboard; those belong to later phases.
