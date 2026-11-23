# Roadmap and phase gates

The roadmap is deliberately sequential. Each phase must prove its exit condition before the next phase expands the system. Do not use the future phases as a reason to overbuild the proof of concept.

## Phase 1 — Proof of concept

**Goal:** Prove one complete, repeatable virtual-student journey through Aceraa's real UI.

Build:
- One versioned synthetic JEE student profile.
- One Physics / Newton's laws practice scenario.
- One Playwright-controlled Chromium browser.
- A controlled observe → decide → validate → act → verify loop.
- DOM/accessibility-first observation and optional vision adapter seam.
- Meaningful screenshots, browser video, Playwright trace, and structured event records.
- A clean run lifecycle with stable IDs, limits, and stop conditions.

Exit criteria:
- The journey can be replayed from a clean synthetic test state.
- The student can navigate to practice, request a question, inspect it, select and submit an option, read feedback, ask one follow-up, and finish—or stop with a clear blocker.
- Every action has an input/proposal, execution result, timestamp, and evidence reference.
- Important transitions are verified with explicit postconditions.
- A failed run contains enough artifacts to help an engineer reproduce it.

Not in this phase: multiple profiles, parallel workers, a dashboard, generalized app adapters, or a large agent framework.

## Phase 2 — Reliable independent evaluation

**Goal:** Prove that Virtual World can detect and correctly classify known product defects.

Build:
- Deterministic UI and workflow assertions.
- Independent conversation and subject evaluators with versioned rubrics.
- Verified answer/reference data for the initial Physics scenario.
- Expected-versus-observed checkpoint results.
- Failure taxonomy and severity classification.
- HTML report, PDF export, ZIP evidence bundle, and manifest.
- Seeded defect cases to validate the evaluators.

Exit criteria:
- Known seeded defects are detected consistently.
- Intentional student mistakes are distinguished from product defects.
- Subject judgments use verified references or explicit human review; an unconstrained LLM score is not treated as ground truth.
- Reports point to the evidence supporting each finding.

## Phase 3 — Student diversity and scenario coverage

**Goal:** Expand behavioral coverage without state leakage.

Build:
- Multiple persistent synthetic learner profiles.
- Different topic knowledge, confidence, preferences, and interaction habits.
- Scenario library for correct, incorrect, hint-seeking, uncertain, follow-up, and recommendation-response behavior.
- Profile versioning and isolated run state.
- Coverage summaries across profile/scenario combinations.

Exit criteria:
- Runs cover meaningfully different learner journeys.
- One learner's profile or history cannot leak into another learner's run.
- Scenario outcomes remain reproducible and comparable.

## Phase 4 — Controlled scale

**Goal:** Run repeatable suites efficiently and safely.

Build:
- Queue-backed scheduling and bounded browser workers.
- Parallel execution with concurrency and resource limits.
- Artifact/object storage and retention policies.
- Run dashboard and comparison views.
- Regression replay and scheduled suites.
- Cost, latency, failure-rate, and resource metrics.

Exit criteria:
- Scheduled suites run within defined resource and cost budgets.
- Failed runs remain reproducible and artifacts are retained according to policy.
- Concurrency does not corrupt profiles, sessions, or evidence correlation.

## Phase 5 — Reusable testing platform

**Goal:** Separate the Virtual World engine from Aceraa-specific configuration.

Build:
- Application/environment adapters.
- Configurable test-account and authentication setup.
- Reusable workflow and scenario definitions.
- Product-specific knowledge/reference packs.
- Configurable evaluators and reporting.
- Documentation for onboarding another web application.

Exit criteria:
- A second web application can be configured and tested without rewriting the core orchestration, action validation, evidence, and evaluation pipeline.
- Product-specific assumptions are isolated behind explicit adapters and configuration.

## Cross-phase quality gates

Every phase must preserve these invariants:

- Test only approved environments and synthetic accounts.
- Do not expose unrestricted browser or code execution to models.
- Version prompts, profiles, scenarios, model IDs, and evaluator rubrics.
- Capture evidence and preserve stable correlation IDs.
- Enforce per-run limits and safe stop conditions.
- Make missing telemetry or unsupported model capability explicit.
- Update implementation status only after code and tests substantiate it.

## Current status

The repository currently contains documentation only. Phase 1 is the first planned implementation; no runtime phase is claimed complete.
