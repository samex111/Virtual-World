# Problem, users, and goals

## The problem

Testing an adaptive learning product requires more than checking whether an endpoint returns a successful response. A real learner moves through a sequence of visible states: enters a subject area, requests or opens practice, interprets a question, selects an answer, submits it, reads feedback, asks a follow-up, and decides what to do next.

Failures can occur between any two of those states. Some are visual, some are interaction bugs, some are backend or model failures, and some are educational-content errors. A backend-only test may miss a broken control or misleading screen; a scripted UI test may click through a fixed path without representing different learner intentions or persistent knowledge.

The team needs a repeatable way to exercise the full journey and retain evidence that explains what happened.

## Who this is for

- **Aceraa engineers:** reproduce UI, workflow, API, model/tool, and content defects.
- **Product and QA owners:** understand which student journeys work, fail, or become confusing.
- **Learning/content reviewers:** inspect question correctness, answer keys, explanations, and misconception handling.
- **Future platform maintainers:** reuse the runner without coupling its core to one model provider or one product's page structure.

## Goals

1. Simulate a learner with a persistent, structured profile and learning history.
2. Exercise Aceraa through the real browser interface.
3. Support realistic correct, incorrect, uncertain, hint-seeking, follow-up, and recommendation-response behavior.
4. Validate every proposed browser action before execution and verify the visible result afterward.
5. Capture correlated browser and application evidence for meaningful state transitions and failures.
6. Evaluate UI, workflow, conversation, subject correctness, and learning behavior independently from the student agent.
7. Produce a readable run summary and a raw evidence bundle.
8. Make a run repeatable from a clean synthetic test state.

## Non-goals for the first release

- Testing every Aceraa subject, course, feature, or user journey.
- Replacing unit tests, API tests, security testing, accessibility audits, or human academic review.
- Generating statistically representative student populations.
- Training or fine-tuning a student model.
- Giving an LLM unrestricted browser, shell, JavaScript, database, or network access.
- Building a distributed execution platform, dashboard, or cross-product SaaS before the first journey is proven.
- Using real student data or production accounts.

## Initial scenario boundary

| Item | Initial target |
|---|---|
| Application | Aceraa |
| Learner | One synthetic JEE Main student |
| Subject | Physics |
| Topic | Newton's laws of motion |
| Journey | Enter practice → request question → inspect question/options → choose and submit → read feedback → ask one follow-up → finish |
| Browser | One Playwright-controlled Chromium browser |
| Model role | Learner intention generation and optional visual interpretation through provider adapters |
| Evidence | Screenshots at meaningful transitions, video, Playwright trace, DOM/accessibility snapshots, structured events, and available correlated application traces |
| Output | Machine-readable evaluation plus human-readable report and evidence archive |

This boundary is intentionally small. The actual route, UI labels, authentication mechanism, and test-account setup must be confirmed against the Aceraa test environment before browser implementation.

## How we know the system is useful

A useful first version can repeatedly execute the scenario and answer:

- What did the synthetic learner intend to do?
- What did the agent propose?
- Which validated action did Playwright execute?
- What did the browser actually display afterward?
- Did the expected workflow transition happen?
- What did the application/backend/model process, where trace data is available?
- Was the observed failure caused by the learner's intentional behavior or by Aceraa?
- Can another engineer reproduce the failure using the saved run artifacts?

## Quality attributes

- **Reproducibility:** profiles, scenarios, prompts, model identifiers, and evaluator versions are versioned.
- **Diagnosability:** evidence is correlated by stable IDs and includes failure context.
- **Safety:** only synthetic accounts and bounded actions are used.
- **Replaceability:** model provider changes do not require rewriting browser orchestration.
- **Cost awareness:** DOM-first observation, selective screenshots, bounded model calls, and per-run budgets.
- **Honest reporting:** missing telemetry is marked unavailable; it is never fabricated or inferred as observed fact.
