# Implementation Decision Records

Use this directory for decisions that materially affect architecture, safety, cost, or product behavior.

Each record should include status (proposed/accepted/superseded/deprecated), context, decision, alternatives, consequences, and conditions for revisiting. Keep records factual and link to the relevant phase/architecture section.

## ADR-0001 — Prove one end-to-end journey before scaling
- **Status:** accepted.
- **Context:** Multi-agent orchestration, multiple profiles, vision models, and parallel execution create complexity before the core testing loop is proven.
- **Decision:** Phase 1 is one synthetic JEE student, one Chromium browser, and one Aceraa Physics Newton's laws journey.
- **Alternatives:** Build multi-student platform immediately; start with API-only tests; build a generalized autonomous browser agent.
- **Consequences:** Early coverage is narrow, but core observe/action/verify/evidence failures can be isolated.
- **Revisit when:** Phase 1 exit criteria are repeatedly met and useful evidence bundles are produced.

## ADR-0002 — Models propose; deterministic code executes
- **Status:** accepted.
- **Context:** Model output can be malformed, ambiguous, or unsafe.
- **Decision:** Models return one constrained action proposal. A validator checks it; Playwright executes only allowlisted actions.
- **Alternatives:** Model-generated browser scripts; coordinate-only computer control.
- **Consequences:** More controller code, but execution is auditable, bounded, and testable.
- **Revisit when:** A required interaction cannot be safely represented by the action contract.

## ADR-0003 — DOM-first perception with optional vision
- **Status:** accepted.
- **Context:** DOM/accessibility facts are generally more reliable and cheaper than visual inference for ordinary controls.
- **Decision:** Use DOM/accessibility observations by default and a verified vision-capable provider only for visual ambiguity.
- **Alternatives:** Send every screenshot to vision; rely exclusively on DOM.
- **Consequences:** Requires a perception adapter combining structured and visual observations.
- **Revisit when:** Real journeys show recurring visual-only failures that DOM data cannot expose.
