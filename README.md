# Virtual-World

**AI-powered virtual student simulation and evidence-backed product testing.**

Virtual-World creates persistent synthetic learners that use an educational product through its real user interface. It observes complete learning journeys, captures synchronized evidence, and independently evaluates whether the product behaved correctly.

Aceraa is the first target application. The initial scope is one synthetic JEE student completing one Physics practice journey.

## Why this exists

Traditional API tests can prove that endpoints respond while missing broken question cards, unusable controls, confusing transitions, incorrect feedback, and failures across a learner's complete journey. Virtual-World tests the experience as a student sees it and preserves enough evidence to reproduce failures.

## Start here

- [Product vision](docs/vision.md)
- [Problem statement](docs/problem-statement.md)
- [System architecture](docs/architecture.md)
- [Roadmap and phases](docs/roadmap.md)
- [Implementation rationale](docs/implementation/README.md)
- [Agent instructions](AGENTS.md)

## Current status

Documentation foundation / pre-implementation. No simulator, browser runner, model adapter, evaluator, or report pipeline is claimed to exist yet. See the roadmap for phase exit criteria.

## Core principle

**The student simulates learning; the evaluator judges the product.** The model proposes bounded actions, Playwright executes validated actions, and evidence—not model confidence—determines what happened.
