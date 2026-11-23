# Implementation Decision Records

Use this directory for decisions that materially affect architecture, safety, cost, or product behavior. Each record should include status, context, decision, alternatives, consequences, and conditions for revisiting.

## ADR-0001 — Prove one end-to-end journey before scaling
- **Status:** accepted.
- **Decision:** Phase 1 is one synthetic JEE student, one Chromium browser, and one Aceraa Physics Newton's laws journey.
- **Why:** Isolate observe/action/verify/evidence failures before adding complexity.
- **Revisit when:** Phase 1 exit criteria are repeatedly met with useful evidence bundles.

## ADR-0002 — Models propose; deterministic code executes
- **Status:** accepted.
- **Decision:** Models return one constrained intention/action proposal. A validator checks it; Playwright executes only allowlisted actions.
- **Why:** Model output can be malformed, ambiguous, or unsafe.
- **Revisit when:** A required interaction cannot be safely represented by the action contract.

## ADR-0003 — DOM-first perception with optional vision
- **Status:** accepted.
- **Decision:** Use DOM/accessibility observations by default and a verified vision-capable provider only for visual ambiguity.
- **Why:** Structured UI data is usually more reliable and cheaper for ordinary controls.

## ADR-0004 — Phase 0 environment safety
- **Status:** accepted.
- **Decision:** Require explicit test mode, exact-host allowlisting, HTTPS for remote targets, no URL credentials, unauthenticated preflight, and read-only Chromium discovery.
- **Record:** [ADR-0004](ADR-0004-phase0-environment-safety.md).

## ADR-0005 — Phase 1 runtime boundaries and evidence lifecycle
- **Status:** accepted.
- **Decision:** Separate learner intention from action planning; keep orchestration, policy, profile persistence, and evidence deterministic; require reviewed provenance for student-state updates; sanitize traces; keep Aceraa-specific routes and selectors in a local adapter.
- **Why:** Core behavior must be testable before QA routes and a reviewed academic reference are available.
- **Record:** [ADR-0005](ADR-0005-phase1-runtime-boundaries.md).
