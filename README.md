# Virtual-World

**AI-powered virtual student simulation and evidence-backed product testing.**

Virtual-World creates persistent synthetic learners that use an educational product through its real user interface. It observes complete learning journeys, captures correlated evidence, and independently evaluates whether the product behaved correctly.

Aceraa is the first target application. The first proving journey is one synthetic JEE Main learner completing one Physics practice flow on Newton's laws.

## Why this exists

API tests can prove that endpoints respond while missing broken question cards, unusable controls, confusing transitions, incorrect feedback, and failures across a learner's complete journey. Virtual-World tests the experience as a learner sees it and preserves enough evidence to reproduce failures.

## Current status

Phase 0 tooling is implemented: a guarded test-environment preflight, read-only Chromium UI inventory, and safety/configuration tests. Phase 1's reusable runtime is now implemented: persistent synthetic profile, constrained Playwright actions, separate learner-intention/action-planner interfaces, bounded orchestration, correlated event log, and redacted evidence bundle. **The Aceraa-specific Phase 0 and Phase 1 exits are not complete** because the approved QA URL, synthetic test account, reset procedure, live route inventory, local adapter, and subject-reviewed reference question have not been provided or verified. See [Phase 0 status](docs/implementation/phase-0-foundation.md) and [Phase 1 status](docs/implementation/phase-1-poc.md).

## Quick start

Requirements: Node.js 22+ and an isolated Aceraa QA/staging environment.

~~~bash
npm install
npx playwright install chromium
cp .env.example .env
# Edit .env with the approved QA target and synthetic-account details.
npm test
npm run phase0:check
npm run phase0:inspect
npm run phase1:check
npm run phase1:run
~~~

Phase 0's preflight is unauthenticated and read-only. Its inspector uses a fresh browser context and does not log in, click controls, submit forms, or write application data. Phase 1 refuses to run until a trusted local Aceraa adapter verifies authentication and supplies an approved academic reference. Generated screenshots, video, traces, events, and manifests stay under `artifacts/` and are gitignored. Never use the public production URL or a real student's account.

## Start here

- [Product vision](docs/vision.md)
- [Problem statement](docs/problem-statement.md)
- [System architecture](docs/architecture.md)
- [Agent responsibilities](docs/agents.md)
- [Roadmap and phases](docs/roadmap.md)
- [Phase 0 environment runbook](docs/environments/aceraa-test-environment.md)
- [Phase 0 implementation status](docs/implementation/phase-0-foundation.md)
- [Initial Newton's laws scenario](docs/scenarios/physics-newtons-laws-jee-main-v1.md)
- [Phase 1 implementation plan and runtime contract](docs/implementation/phase-1-poc.md)
- [Action and event contracts](docs/implementation/action-and-event-contracts.md)
- [Implementation rationale and decisions](docs/implementation/README.md)
- [Contributor and coding-agent instructions](AGENTS.md)

## Core principle

**The student simulates learning; the evaluator judges the product.** Models may propose bounded actions, deterministic controllers validate them, Playwright executes them, and evidence—not model confidence—determines what happened.
