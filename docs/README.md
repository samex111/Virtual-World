# Documentation

This directory is the product and engineering source of truth for Virtual World.

## Product definition

| Document | What it answers |
|---|---|
| [Vision](vision.md) | What are we building, why, and what does success mean? |
| [Problem and goals](problem-and-goals.md) | Which testing gaps are we solving, and what is in or out of scope? |
| [Architecture](architecture.md) | How do student simulation, browser control, evidence, and evaluation fit together? |
| [Agents](agents.md) | What each logical agent/component owns, and what it must never do |
| [Roadmap](roadmap.md) | What gets built in each phase and the exit gate for moving forward |

## Implementation record

The [implementation folder](implementation/README.md) is the living execution record. It explains why the project is being built, records the current state, and keeps the first implementation slice actionable.

- [Phase 1: proof of concept](implementation/phase-1-poc.md)
- [Action and event contracts](implementation/event-and-action-contracts.md)
- [Decisions and open questions](implementation/decisions-and-open-questions.md)

## How to maintain these docs

- Update product scope in the product documents, not only in issue descriptions or prompts.
- Update phase status only when evidence (code, tests, and a reproducible run) supports the status change.
- Keep unresolved assumptions visible. Do not convert them into implementation facts without verification.
- Prefer one canonical explanation and link to it rather than duplicating conflicting copies.
- Repository-wide coding-agent rules are in the root [AGENTS.md](../AGENTS.md).
