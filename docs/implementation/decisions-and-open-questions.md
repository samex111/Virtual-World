# Decisions and open questions

This page separates decisions already established by the product direction from questions that still require verification. An item must not be treated as settled merely because it appears in an example.

## Design decisions

| Decision | Current position | Reason |
|---|---|---|
| First product under test | Aceraa | It is the initial target and provides the concrete Physics learning journey. |
| First learner | One synthetic JEE Main student | Keeps the first loop focused and reproducible. |
| First journey | Physics practice around Newton's laws | Exercises question rendering, answers, feedback, and follow-up. |
| Interaction surface | Real browser UI | Detects failures that API-only tests cannot observe. |
| Browser automation | Playwright + Chromium | Practical starting point with semantic locators, trace, and video. |
| Browser control | Allowlisted, schema-validated actions | Keeps model proposals bounded and auditable. |
| Observation strategy | DOM/accessibility first; vision as fallback | Structured browser data is usually more reliable for controls and text. |
| Model integration | Provider-neutral adapter | Prevents coupling the system to a specific hosted model. |
| Student state | Structured and versioned profile data | Makes behavior persistent and auditable beyond a single prompt. |
| Evidence format | Structured events plus browser artifacts | Connects intent, UI action, outcome, and debugging evidence. |
| Initial execution | One browser, sequential journey | Avoids premature concurrency and infrastructure. |
| Initial artifact storage | Local files are sufficient for the proof of concept | Object storage can be selected when scale requires it. |

These are architecture starting points. They do not imply that the corresponding implementation exists.

## Open questions to resolve before or during Phase 1

| Question | Why it matters | Required resolution |
|---|---|---|
| What is the approved Aceraa test URL? | Browser journeys must not run against production by accident. | Confirm environment and base URL. |
| How is a synthetic test account provisioned and authenticated? | The run must be repeatable without exposing credentials. | Confirm account setup and secret injection mechanism. |
| What is the exact Physics practice route and navigation flow? | Locators and postconditions must match the real UI. | Inspect the current test environment and record verified route/control names. |
| Which UI elements have stable test IDs or accessible names? | Reduces brittle selectors and ambiguous target resolution. | Audit the initial journey and request test IDs where needed. |
| What is the canonical Newton's laws question/answer reference? | Subject evaluation needs a trusted answer key. | Select reviewed reference content or a verified fixture. |
| Can the frontend propagate a run trace_id to backend logs? | Enables browser-to-backend correlation. | Inspect Aceraa instrumentation; make this best-effort for Phase 1. |
| Which exact Nemotron model ID and endpoint are available? | Model names do not guarantee image input or tool calling. | Verify official API schema, image payload support, rate limits, context, and cost. |
| Is a separate vision provider required? | A text-only reasoning endpoint cannot interpret screenshots. | Decide after checking the exact selected endpoint. |
| Where should structured student profiles live? | The profile must persist, but the target application/database is not yet integrated. | Choose the smallest storage option that supports versioned state and clean test resets. |
| Which report format/library should Phase 2 use? | PDF export has dependency and rendering implications. | Defer until Phase 2; HTML can be the first readable report. |
| What are acceptable artifact retention limits? | Video and trace storage can grow quickly. | Set local size/retention limits for PoC; choose object storage later if needed. |

## Model verification checklist

Before configuring a provider, verify the exact model and endpoint—not just the model-family name:

- Exact model identifier and version.
- Whether the endpoint accepts image input.
- Image encoding and payload-size requirements.
- Context/token limits.
- Tool/function calling and constrained structured-output support.
- Rate limits, latency expectations, and cost.
- Data retention and privacy terms appropriate for synthetic test evidence.

If the chosen Nemotron endpoint is text-only, use it only for text reasoning or connect a separate image-capable provider. The rest of the architecture must remain unchanged.

## Decision log maintenance

When an open question is resolved, record the decision, date, evidence/source, and affected docs or code. When an accepted decision changes, document why and update the architecture and implementation plan in the same change.
