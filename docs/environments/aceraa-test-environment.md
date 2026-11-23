# Aceraa test environment and account runbook

**Status: awaiting target-specific details.** The repository contains safe setup and inspection tooling, but no Aceraa URL, account, tenant, reset mechanism, or route map has been supplied yet. Do not substitute the public Aceraa site or a real student's account.

## Required environment contract

| Setting | Requirement | Why it exists |
|---|---|---|
| TARGET_ENVIRONMENT | test | Production is not a supported target. |
| TARGET_BASE_URL | Exact QA/staging application URL | The initial entry point for read-only discovery. |
| TARGET_ALLOWED_HOSTS | Comma-separated exact hostnames | Every initial request, redirect, and browser request must stay on an approved host. No wildcards. |
| TARGET_SAFETY_ACK | Exact confirmation string from .env.example | Prevents accidental runs with an unreviewed target configuration. |
| TEST_ACCOUNT_READY | true only after provisioning | Phase 0 cannot exit without a dedicated synthetic account. |
| TEST_ACCOUNT_KIND | synthetic | Real student accounts are not permitted. |
| TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD | Local-only credentials; both or neither | Reserved for the later authenticated browser journey. Phase 0 inspection does not use them. |

The current preflight deliberately sends no account credentials, cookies, or application-specific headers. It performs a GET request and accepts a successful page or an authentication gate (401/403). Redirects are followed only when the destination hostname is explicitly allowlisted.

## Provisioning checklist

The Aceraa owner must confirm all of the following before the environment is marked ready:

- [ ] A dedicated QA/staging tenant exists and is isolated from production data.
- [ ] The exact test application URL and every required first-party hostname are known.
- [ ] A synthetic JEE test account is provisioned; it does not belong to a real learner.
- [ ] The account has the minimum permission needed for Physics practice.
- [ ] A documented reset procedure restores a known starting state without affecting other tests.
- [ ] Test data, generated questions, and account activity are safe to retain or can be cleaned up.
- [ ] The first journey's expected question/answer reference has been reviewed by a Physics subject owner.
- [ ] The route map and visible controls have been inspected, including missing labels and test IDs.

Do not mark a checkbox complete based only on a configuration flag. The owner must verify the underlying environment/account.

## Local setup

1. Use Node.js 22 or newer.
2. Copy .env.example to .env.
3. Replace the placeholder URL and host with the exact approved QA/staging details.
4. Keep the synthetic account credentials in .env or a local secret manager. Never commit .env.
5. Install dependencies and the Chromium browser:

   ~~~bash
   npm install
   npx playwright install chromium
   ~~~

6. Run the environment check:

   ~~~bash
   npm run phase0:check
   ~~~

7. Once the URL is approved, generate a read-only landing-page inventory:

   ~~~bash
   npm run phase0:inspect
   ~~~

Generated files are written to artifacts/phase-0/ and are ignored by Git. Review them for internal route names or accidental sensitive content before sharing or promoting findings into committed documentation.

## What the tools do—and do not do

### phase0:check

- Validates the environment is explicitly test.
- Requires an exact host allowlist, HTTPS for remote targets, and a safety acknowledgement.
- Performs an unauthenticated GET and validates every redirect.
- Does not sign in, click controls, submit forms, or mutate application data.
- Exits with code 2 when the target is reachable but a synthetic account is not marked ready.

### phase0:inspect

- Uses a fresh unauthenticated Chromium context.
- Blocks browser requests to hosts not present in the exact allowlist.
- Collects the landing page title, headings, same-origin link paths, interactive controls, accessible-name/label gaps, test-ID coverage, a screenshot, and JSON inventory.
- Never enters credentials or performs clicks, form submissions, or writes.

The inventory is a discovery aid, not a full accessibility conformance report and not proof that the Physics journey works. It only describes the page that was actually inspected.

## Target-specific inventory (fill after inspection)

| Area | Confirmed route/state | Controls and selectors | Accessibility / test-ID gaps | Owner / notes |
|---|---|---|---|---|
| Entry / login | Pending | Pending | Pending | Do not store credentials here. |
| Authenticated home | Pending | Pending | Pending | Requires synthetic account. |
| Physics practice | Pending | Pending | Pending | Confirm exact navigation. |
| Question view | Pending | Pending | Pending | Verify rendered question and options. |
| Submitted feedback | Pending | Pending | Pending | Verify correctness and explanation states. |
| Follow-up interaction | Pending | Pending | Pending | Verify context is preserved. |

## Unresolved decisions

- Exact QA/staging URL and first-party host list.
- Test account provisioning owner and rotation procedure.
- Whether login can use a local test-only account/password flow or needs a dedicated test auth provider.
- How to restore a clean learner/session state between runs.
- Which Aceraa backend events can be correlated with a browser journey.
- Who signs off the initial Newton's laws question, answer key, and explanation rubric.
