# Virtual World

**Virtual World is an evidence-driven virtual student testing system for Aceraa.** It simulates persistent JEE/NEET learners using the real product through its browser interface, then produces reproducible evidence and independent evaluations.

The first target is deliberately narrow: **one synthetic JEE student completing one Aceraa Physics practice journey**. The longer-term direction is a reusable web-product testing engine, but Aceraa is the first application and the initial scope is not a general-purpose platform.

## Why this exists

API tests can verify service contracts, but they cannot prove that a student can see a question, select an option, submit it, understand the feedback, or continue the journey. Virtual World connects learner intent, the visible UI, browser actions, backend events, and objective evaluation into one debuggable run.

## Project status

This repository currently contains the product and implementation documentation. The simulator runtime has **not** been implemented yet. The roadmap starts with a single end-to-end proof of concept; later phases are gated on evidence that the earlier phase works.

## Start here

- [Documentation index](docs/README.md)
- [Product vision](docs/vision.md)
- [Problem and goals](docs/problem-and-goals.md)
- [System architecture](docs/architecture.md)
- [Agent responsibilities and boundaries](docs/agents.md)
- [Roadmap and phase exit criteria](docs/roadmap.md)
- [Implementation plan and current status](docs/implementation/README.md)
- [Repository guidance for coding agents](AGENTS.md)

## Core design principles

1. Test through the real browser UI, not only through API calls.
2. Keep student simulation, orchestration, visual reasoning, browser execution, evidence collection, and evaluation separate.
3. Prefer DOM and accessibility data; use screenshot vision only when visual interpretation adds value.
4. Let Playwright execute a small, validated action allowlist. Models propose; the controller validates and acts.
5. Keep the evaluator independent from the student agent.
6. Persist structured student state and run evidence; do not rely on a single prompt as memory.
7. Start with one repeatable journey before adding profiles, concurrency, or platform abstractions.

See the [vision](docs/vision.md) and [architecture](docs/architecture.md) for the full rationale.
