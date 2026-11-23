# Roadmap and Delivery Phases

The roadmap is sequential. Do not start scale or platform abstraction until one journey is reliable and diagnosable.

## Phase 0 — Product and environment foundation

**Goal:** Make the target and test conditions explicit.

**Repository status:** reusable preflight, read-only browser inventory, environment runbook, and scenario contract are implemented. Aceraa-specific readiness is blocked until the approved QA target and synthetic account are provisioned and verified. See [Phase 0 implementation status](implementation/phase-0-foundation.md).

Deliverables:
- Product/architecture docs and explicit safety boundaries.
- Test-only environment configuration with exact hostname allowlisting and no secrets in source control.
- Unauthenticated target reachability check with redirect validation.
- Read-only Chromium landing-page inventory for routes, controls, accessibility labels, and test-ID coverage.
- Dedicated synthetic Aceraa account and documented reset/bootstrap strategy.
- Initial Physics scenario with subject-reviewed expected outcomes.

Exit criteria: a dedicated test environment is confirmed; synthetic account and clean reset are verified; actual route/control inventory is reviewed; first journey has documented states and a subject-reviewed question/answer reference.

## Phase 1 — Proof of concept: one student, one journey

**Goal:** Prove the complete browser interaction and evidence loop.

**Repository status:** reusable Phase 1 runtime is implemented and unit-tested (profile persistence, bounded intention/action planning, allowlisted Playwright controller, correlated event log, artifact bundle, and redaction). The Aceraa-specific journey is not complete until the QA account, live route map, reset procedure, approved question, and local adapter are verified. See [Phase 1 implementation status](implementation/phase-1-poc.md).

Deliverables: one persistent synthetic JEE Main profile; one Chromium browser with Playwright; one Newton's laws Physics scenario; observe → decide → validate → act → verify → record loop; bounded action schema/controller; video, trace, screenshots, event log, run metadata; clean reset/replay procedure.

Journey: open Aceraa and navigate to Physics; request a Newton's laws question at JEE Main level; inspect the question/options; select and submit an option; read feedback and ask a follow-up; finish and persist the run.

Exit criteria:
- Journey completes end-to-end repeatedly from a clean state.
- Every action has input, result, timestamp, and evidence reference.
- Failed actions include enough evidence to diagnose.
- Model output cannot bypass the allowlisted controller.
- Product quality is not judged solely by student-agent opinion.

## Phase 2 — Reliable independent evaluation

**Goal:** Detect seeded product defects and classify them correctly.

Deliverables: deterministic UI/workflow assertions; independent conversation and Physics rubric; expected-vs-actual records; student-mistake vs product-defect classification; severity taxonomy; HTML report, PDF summary, ZIP bundle; golden scenarios with seeded defects.

Exit criteria: seeded UI/workflow/answer/explanation defects are detected; intentional wrong answers are not misreported; findings link to exact action and supporting evidence; repeated runs are comparable.

## Phase 3 — Student diversity and scenario library

**Goal:** Cover different learner journeys without state leakage.

Deliverables: multiple persistent profiles; topic/difficulty/hint/misconception/follow-up scenarios; profile isolation and state versioning; evidence-backed knowledge updates; coverage reporting.

## Phase 4 — Scale and regression operations

**Goal:** Run controlled suites repeatedly and efficiently.

Deliverables: queue-backed execution and parallel browser workers; concurrency/token/time/retry/storage budgets; artifact lifecycle and retention; scheduled regression suites and replay; run dashboard and trend reporting.

## Phase 5 — Reusable testing platform

**Goal:** Support additional web products without rewriting the simulator core.

Deliverables: app/environment adapters; reusable workflow/action definitions; test-account and secret-management integration; product knowledge and evaluator configuration; pluggable model/browser/storage/reporting adapters.

## Scope guard

Until Phase 1 exits, do not prioritize multi-student simulation, parallel workers, dashboards, generalized app onboarding, or elaborate agent hierarchies. The hardest risk is proving a trustworthy connection between learner intent, visible UI state, browser action, backend evidence, and independent evaluation.
