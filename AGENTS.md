# AGENTS.md — Virtual-World

These instructions apply to every coding agent and contributor working in this repository.

## Product intent
Build an AI-powered virtual student simulation and evidence-backed product-testing system. Aceraa is the first application under test. The first deliverable is one reproducible synthetic JEE student's Physics practice journey through the real Aceraa UI.

Read before implementation: [docs/vision.md](docs/vision.md), [docs/problem-statement.md](docs/problem-statement.md), [docs/architecture.md](docs/architecture.md), [docs/agents.md](docs/agents.md), [docs/roadmap.md](docs/roadmap.md), and [docs/implementation/README.md](docs/implementation/README.md).

## Non-negotiable principles
- Test the real product through its visible UI. API tests are supporting evidence, not a substitute for browser journeys.
- The student simulates learning; independent evaluators judge the product. The student agent never grades Aceraa.
- Use observe → decide → validate → act → verify → record. Every next decision uses the newly observed state.
- Playwright is the actuator. Models propose one constrained action; they never receive unrestricted browser, shell, JavaScript, or network execution.
- Prefer accessible locators (getByRole, getByLabel, stable test IDs). Coordinate clicks are a documented last resort.
- Use DOM/accessibility data first. Invoke vision only when visual layout/content cannot be reliably understood from structured browser data.
- Keep model providers behind adapters. Never assume a model name implies image input, tool calling, or a particular API schema.
- Persist student profiles and evidence-backed learning updates as structured, versioned state.
- Distinguish intentional student mistakes from product defects.
- Record model IDs, prompt versions, latency, token usage, structured outputs, and errors. Never log private chain-of-thought.
- Use synthetic accounts and a dedicated test environment. Do not use real student personal data in initial simulations.

## Safety boundaries
- Never place credentials, cookies, access tokens, or secrets in model prompts, screenshots, traces, reports, or committed files.
- Use scoped test credentials from environment configuration and redact sensitive values from artifacts.
- Allowlist browser actions and targets. Enforce action-count, wall-clock, retry, token, concurrency, and artifact-size budgets.
- Reject ambiguous locators; never guess which control the model intended.
- Add loop/no-progress detection and stop safely when a journey cannot proceed.
- Never execute arbitrary code suggested by a model.
- Do not perform purchases, send real messages, or trigger irreversible actions. Only run against an explicitly configured test environment.

## Engineering workflow
- Inspect the existing code and package scripts before changing architecture or adding dependencies.
- Prefer small, testable modules with typed contracts and explicit error handling.
- Test success, failure, malformed model output, ambiguous targets, timeouts, retries, and no-progress loops.
- Keep provider-specific behavior inside adapters.
- Keep docs and implementation aligned. Record material architecture changes under docs/implementation/decisions/.
- Keep action/event contracts aligned with docs/implementation/action-and-event-contracts.md.
- Do not claim a phase is complete until its exit criteria are met with reproducible evidence.
- Until Phase 1 exits, keep scope to one student, one browser, and one Physics journey.

## Definition of done
Relevant tests pass or the exact reason they could not run is documented; failure paths and safety limits are covered; artifacts are correlated and redacted; docs reflect actual behavior; no secrets or real student data are introduced.
