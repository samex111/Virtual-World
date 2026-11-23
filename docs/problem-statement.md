# Problem Statement

## The gap
Unit, API, and scripted browser tests are valuable, but they do not fully answer: **Can a learner with a particular goal, knowledge state, and misconception successfully use the product from beginning to end—and did the product help correctly?**

An API may return a valid question while the UI renders it incorrectly. A submit request may succeed while the selected option never visibly changes. An answer may be graded incorrectly; an explanation may contradict the answer key; a recommendation may ignore demonstrated weakness; or a conversation may lose context after navigation.

Fixed scripts are limited too: they follow predetermined paths and do not adapt their next learner intention to what was just observed.

## Problems addressed

### UI and workflow blind spots
- Broken or missing question cards, unreadable options, inaccessible controls, or unresponsive buttons.
- Incorrect loading, navigation, or empty states.
- Submission and feedback transitions that fail.
- Follow-up flows that lose context or lead to dead ends.

### Learner-context blind spots
- Test inputs do not reflect different ability or confidence.
- Prior mistakes and misconceptions do not influence later actions.
- Preferences, hint usage, and confidence are not represented.
- Recommendations are not evaluated against observed learner state.

### Academic and response-quality blind spots
- Incorrect answer keys or inconsistent explanations.
- Responses that do not address the learner's actual doubt.
- Wrong difficulty or topic for the requested level.
- Expected interactive response formats are not rendered.

### Diagnosis and reproducibility blind spots
- Screenshots, UI actions, API events, and model outputs are disconnected.
- Reports identify failure but not reproduction steps.
- Logs cannot connect student, session, action, and trace.
- Student mistakes are confused with product defects.

## What changes
Virtual-World runs persistent synthetic learners through real UI journeys. It captures browser evidence and correlates it with available backend and model events. Independent evaluators compare expected and observed behavior and produce findings with severity, evidence references, and investigation hints.

## Who benefits
- **Product engineers:** reproducible UI/workflow defects with linked evidence.
- **AI/ML engineers:** visibility into model responses, tool behavior, latency, and output-format failures.
- **Learning/product teams:** insight into explanations, feedback, and recommendations.
- **QA teams:** reusable profiles and scenarios for regression testing.

## Non-goals
- Replacing human QA, subject experts, or real-student research.
- Claiming synthetic students statistically represent actual learners.
- Letting the virtual student grade the application.
- Starting as a general-purpose autonomous computer-use agent.
- Executing arbitrary model-generated code or unrestricted browser actions.
- Replacing Aceraa's product, APIs, database, or learning engine.
- Generating thousands of low-value conversations before one reliable journey exists.
- Using real student personal data in the initial system.

## Student error vs product defect
A student intentionally choosing a wrong option is normal simulated behavior, not automatically a product failure. A defect occurs if the UI records a different option, Aceraa grades against a verified key incorrectly, feedback is absent/contradictory/academically incorrect, or a required workflow cannot be completed. Independent evaluators must make this distinction from evidence.
