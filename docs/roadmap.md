# Roadmap and Delivery Phases

The roadmap is sequential. Do not start scale or platform abstraction until one journey is reliable and diagnosable.

## Phase 0 — Product and environment foundation

**Goal:** Make the target and test conditions explicit.

**Repository status:** the reusable preflight, read-only browser inventory, environment runbook, and initial scenario contract are implemented. Aceraa-specific readiness remains blocked until the approved QA target and synthetic account are provisioned and verified. See [Phase 0 implementation status](implementation/phase-0-foundation.md).

Deliverables:
- Product/architecture docs and explicit safety boundaries.
- Test-only environment configuration with exact hostname allowlisting and no secrets in source control.
- Unauthenticated target reachability check with redirect validation.
- Read-only Chromium landing-page inventory for routes, controls, accessibility labels, and test-ID coverage.
- Dedicated synthetic Aceraa account and a documented reset/bootstrap strategy.
- Initial Physics scenario with subject-reviewed expected outcomes.

Exit criteria:
- A dedicated test environment is independently confirmed and safely reachable.
- A synthetic test account is provisioned; no real student personal data or production credentials are needed.
- The clean reset procedure is documented and verified.
- The actual target route/control inventory is reviewed, including known accessibility/test-ID gaps.
- The first journey has documented start/completion states and a subject-reviewed question/answer reference.

## Phase 1 — Proof of concept: one student, one journey

**Goal:** Prove the complete browser interaction and evidence loop.

Deliverables: one persistent synthetic JEE Main profile; one Chromium browser with Playwright; one Newton's laws Physics scenario; observe → decide → validate → act → verify → record loop; bounded action schema/controller; video, trace, screenshots, event log, run metadata; clean reset/replay procedure.

Journey:
1. Open Aceraa and navigate to Physics practice.
2. Request a Newton's laws question at JEE Main level.
3. Inspect rendered question and options.
4. Select and submit an option.
5. Read feedback and ask one follow-up.
6. Finish and persist the run.

Exit criteria:
- Journey completes end-to-end repeatedly from a clean state.
- Every action has input, result, timestamp, and evidence reference.
- Failed actions include enough evidence to diagnose.
- Model output cannot bypass the allowlisted controller.
- Product quality is not judged solely by student-agent opinion.

## Phase 2 — Reliable independent evaluation

**Goal:** Detect seeded product defects and classify them correctly.

Deliverables: deterministic UI/workflow assertions; independent conversation and Physics rubric; expected-vs-actual records; student-mistake vs product-defect classification; severity taxonomy; HTML report, PDF summary, ZIP bundle; golden scenarios with seeded defects.

Exit criteria:
- Seeded UI, workflow, answer-evaluation, and explanation defects are detected.
- Intentional wrong answers are not incorrectly reported as product failures.
- Findings link to exact action and supporting evidence.
- Repeated runs are comparable using versioned evaluators.

## Phase 3 — Student diversity and scenario library

**Goal:** Cover different learner journeys without state leakage.

Deliverables: multiple persistent profiles; topic/difficulty/hint/misconception/follow-up scenarios; profile isolation and state versioning; evidence-backed knowledge updates; coverage reporting.

Exit criteria:
- Student state does not leak between profiles.
- Scenarios are distinguishable and reproducible.
- Knowledge updates trace back to observed attempt evidence.

## Phase 4 — Scale and regression operations

**Goal:** Run controlled suites repeatedly and efficiently.

Deliverables: queue-backed execution and parallel browser workers; concurrency/token/time/retry/storage budgets; artifact lifecycle and retention; scheduled regression suites and replay; run dashboard and trend reporting.

Exit criteria:
- Scheduled suites run within configured cost and concurrency limits.
- Failed runs can be replayed and compared.
- Worker crashes and partial runs leave consistent, diagnosable state.

## Phase 5 — Reusable testing platform

**Goal:** Support additional web products without rewriting the simulator core.

Deliverables: app/environment adapters; reusable workflow/action definitions; test-account and secret-management integration; product knowledge and evaluator configuration; pluggable model/browser/storage/reporting adapters.

Exit criteria:
- A second web application can be onboarded through documented adapters/configuration.
- Core orchestration and evidence contracts remain app-agnostic.
- Product-specific assumptions are isolated and tested.

## Scope guard

Until Phase 1 exits, do not prioritize multi-student simulation, parallel workers, dashboards, generalized app onboarding, or elaborate agent hierarchies. The hardest risk is proving a trustworthy connection between learner intent, visible UI state, browser action, backend evidence, and independent evaluation.
