# Documentation

This folder is the source of truth for product intent, architecture, agent boundaries, delivery sequence, and implementation rationale.

## Reading order

1. [Vision](vision.md) — what Virtual World is and what success means.
2. [Problem statement](problem-statement.md) — testing gaps and non-goals.
3. [Architecture](architecture.md) — component boundaries, action loop, evidence, and evaluation.
4. [Agent responsibilities](agents.md) — which parts are agents, what each owns, and what each must never do.
5. [Roadmap](roadmap.md) — phases, deliverables, and exit criteria.
6. [Implementation rationale](implementation/README.md) — why the system is being built this way.
7. [Phase 1 proof of concept](implementation/phase-1-poc.md) — first implementation slice and definition of done.
8. [Action and event contracts](implementation/action-and-event-contracts.md) — proposed IDs, action schema, and evidence records.
9. [Architecture decisions](implementation/decisions/README.md) — durable technical choices.

## Documentation rules

- Separate current behavior from planned behavior.
- A proposed component is not an implemented component.
- Every phase needs measurable exit criteria.
- Keep action/event contracts aligned with the runtime code.
- Record meaningful architectural changes in implementation/decisions/.
- Keep root [AGENTS.md](../AGENTS.md) aligned with these documents.
