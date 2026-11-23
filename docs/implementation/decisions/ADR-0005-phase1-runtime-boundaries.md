# ADR-0005: Phase 1 runtime boundaries and evidence lifecycle

- **Status:** Accepted
- **Date:** 2026-11-23
- **Scope:** Phase 1 proof of concept

## Context

Phase 1 connects a persistent synthetic learner to a real browser journey without giving model output unrestricted browser control. Aceraa's QA routes and academic reference are not available yet, so the runtime must be testable without inventing selectors or product behavior.

## Decision

1. Keep the Student Agent (learner intention) separate from the action planner (one proposed UI action).
2. Validate proposals against a narrow semantic action/locator allowlist, require unique target resolution, and require a postcondition.
3. Keep orchestration, budgets, profile versioning, evidence, and target allowlisting deterministic.
4. Persist one synthetic profile as versioned JSON; knowledge updates require reviewed provenance tied to evidence from the verified action.
5. Record append-only correlated JSONL events and an artifact manifest with SHA-256 checksums.
6. Use one Chromium context. Block non-allowlisted HTTP and WebSocket traffic. Do not retry browser actions automatically because a delayed submission might already have succeeded.
7. Start tracing after synthetic-account authentication; sanitize headers, cookies, URL query strings, and request/response bodies before retention.
8. Keep Aceraa-specific login, selectors, route mapping, and approved reference in a local adapter until QA inspection and review.

## Alternatives considered

- **Student Agent calls Playwright directly:** rejected; it could bypass policy, budgets, and verification.
- **One autonomous browser agent:** rejected; it couples learner behavior, target selection, execution, and evaluation.
- **Assumed Aceraa routes/selectors:** rejected; actual QA UI is not available.
- **Product correctness badge as academic ground truth:** rejected; the app under test is not the independent answer-key source.
- **Automatic action retry:** rejected; a delayed click/submit may have succeeded already.

## Consequences

The core engine and safety properties can be tested before QA provisioning. The local adapter is a deliberate integration seam. Phase 1 remains incomplete until the actual Aceraa journey and subject-reviewed reference pass repeatedly. The trace retains browser diagnosis data but not raw network bodies or auth headers.

## Revisit when

The QA environment is provisioned, authenticated UI inventory is reviewed, and a real run reveals concrete adapter or evidence requirements that cannot be represented here.
