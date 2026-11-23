# Phase 0 — Product and environment foundation

**Implementation status: tooling implemented; Aceraa-specific readiness is blocked on environment and account provisioning.**

## Objective

Make the first target, test conditions, safety boundaries, synthetic account, and initial learner journey explicit before building an autonomous simulator.

## Implemented in this repository

- Node.js ESM project scaffold with one Phase 0 dependency: Playwright, pinned to 1.65.1.
- Strict environment parser: test-only mode, explicit safety acknowledgement, exact host allowlist, HTTPS for remote targets, no URL-embedded credentials/query/fragment, and synthetic-account readiness checks.
- Unauthenticated HTTP preflight with manual, allowlist-checked redirects and bounded requests.
- Read-only Chromium inventory script using a fresh context; it collects headings, same-origin routes, visible interactive elements, accessible-name/label gaps, test-ID coverage, a screenshot, and JSON inventory.
- Automated unit tests for test-mode enforcement, unsafe URLs, exact host allowlisting, synthetic account requirements, redirect policy, authentication gates, and unhealthy targets.
- Environment runbook and first Newton's laws journey contract.

## Not yet verified

These items require information or access that is not present in this repository and must not be guessed:

- [ ] Exact Aceraa QA/staging URL and first-party hostnames.
- [ ] Dedicated isolated test tenant confirmed by the Aceraa owner.
- [ ] Synthetic JEE account provisioned and verified.
- [ ] Clean reset procedure documented and tested.
- [ ] Live target preflight succeeds.
- [ ] Landing-page inventory generated and reviewed.
- [ ] Physics practice route, controls, and accessibility/test-ID gaps documented from the actual UI.
- [ ] Newton's laws question, answer key, and explanation criteria approved by a Physics subject owner.

## Commands

~~~bash
npm install
npx playwright install chromium
cp .env.example .env
# Edit .env with approved QA/staging details and local synthetic credentials.
npm test
npm run phase0:check
npm run phase0:inspect
~~~

phase0:check is unauthenticated and read-only. It returns exit code 2 when the URL is reachable but the synthetic account is not marked ready. phase0:inspect does not log in or mutate the application; it writes local artifacts to the configured artifacts directory.

## Exit criteria

Phase 0 is complete only when the test environment and synthetic account have been independently confirmed, the read-only tools succeed against the approved target, the route/control inventory is reviewed, the clean reset process is known, and the first journey's academic reference has an owner-approved source.

Do not start authenticated Phase 1 browser automation until these conditions are met.
