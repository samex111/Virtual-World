# ADR-0004 — Safe Phase 0 environment discovery

- **Status:** accepted.
- **Date:** 2026-11-23.
- **Context:** Phase 0 needs to verify a real Aceraa test target and inspect its UI without accidentally sending credentials or writes to production. No target URL or test account was available when the foundation was implemented.
- **Decision:** The Phase 0 tools require TARGET_ENVIRONMENT=test, an exact hostname allowlist, an explicit safety acknowledgement, HTTPS for remote targets, and synthetic-account-only configuration. Reachability uses an unauthenticated GET and manual redirect validation. Browser inspection uses a fresh unauthenticated context and blocks requests to non-allowlisted hosts. No login or state-changing action is included in Phase 0.
- **Alternatives considered:** Trust any URL passed to the script; use wildcard subdomain matching; reuse a developer's signed-in browser; perform login as part of preflight.
- **Consequences:** The first setup requires a few explicit environment values and may block on unknown API/asset hosts. That friction is intentional: every additional host must be reviewed and explicitly allowlisted. The tools verify configuration and reachability but do not prove the account's permissions or the complete student journey.
- **Revisit when:** The Aceraa QA environment and actual browser flow are verified. Any authenticated setup must use a dedicated synthetic account and a separate, narrowly scoped login/bootstrap design.
