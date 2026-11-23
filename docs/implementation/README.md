# Implementation record

## Why this folder exists

The product documents explain **what Virtual World is and why it should exist**. This folder explains **how we will build it, what has actually been completed, what remains blocked, and which assumptions still need verification**.

It is a living engineering record—not a second copy of the architecture document and not a place to mark plans as completed. Every implementation phase should leave behind runnable code, tests, evidence, and an updated status.

## Current repository state

**Status: documentation foundation only.**

The repository was inspected before this documentation change. It contained only a minimal root README and no simulator runtime or established implementation structure. This documentation change does not claim that Playwright orchestration, student agents, Nemotron integration, evaluators, report generation, or artifact storage already exist.

## Implementation status

| Area | Status | Notes |
|---|---|---|
| Product vision and problem definition | Documented | See ../vision.md and ../problem-and-goals.md. |
| Logical architecture and boundaries | Documented | See ../architecture.md and ../agents.md. |
| Phase roadmap and exit criteria | Documented | See ../roadmap.md. |
| Phase 1 runtime | Not started | First implementation target. |
| Browser automation | Not started | Playwright + Chromium are the proposed starting choice. |
| Student profile persistence | Not started | Storage technology is not selected yet. |
| Student Agent | Not started | Must return learner intentions, not browser commands. |
| Vision/model adapter | Not started | Exact provider/model and image support are unverified. |
| Evidence collection | Not started | Local artifacts are proposed for the proof of concept. |
| Independent evaluation | Not started | Reliable evaluation is the focus of Phase 2. |
| HTML/PDF report and ZIP export | Not started | Phase 2. |

## Build order

1. Confirm the Aceraa test environment, test account, and exact Physics practice journey.
2. Define the initial profile, scenario, action, event, and checkpoint contracts.
3. Build a deterministic Playwright journey for the confirmed path before adding autonomous decisions.
4. Add the Student Agent to choose learner intentions at controlled decision points.
5. Add strict action validation, postcondition checks, run budgets, and stop conditions.
6. Add correlated event/evidence capture and replay support.
7. Prove repeated clean runs and capture a useful failure bundle.
8. Only then implement the independent evaluation and report pipeline in Phase 2.

This order reduces debugging ambiguity: first prove the browser path, then introduce model-driven variation in small, inspectable steps.

## Documents in this folder

- [Phase 1 proof of concept](phase-1-poc.md): first engineering slice, journey, tasks, and definition of done.
- [Action and event contracts](event-and-action-contracts.md): proposed machine-readable interfaces and correlation fields.
- [Decisions and open questions](decisions-and-open-questions.md): accepted design choices, assumptions, and information required before implementation.

## Status vocabulary

- **Not started:** no implementation exists.
- **In progress:** implementation is actively underway but has not met its exit criteria.
- **Blocked:** progress depends on an unresolved external requirement or decision.
- **Implemented:** code exists and relevant tests pass.
- **Verified:** the phase exit criteria have been demonstrated with reproducible run evidence.

Do not mark an entire phase implemented merely because its files or interfaces exist.
