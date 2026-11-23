import { randomUUID } from "node:crypto";

export const PHASE1_SCHEMA_VERSION = "1";

export const EVENT_TYPES = Object.freeze([
  "simulation_started",
  "student_intention_selected",
  "observation_captured",
  "action_proposed",
  "action_rejected",
  "browser_action_started",
  "browser_action_completed",
  "browser_action_failed",
  "postcondition_verified",
  "checkpoint_evaluated",
  "student_state_updated",
  "issue_reported",
  "model_call_completed",
  "simulation_finished",
  "simulation_failed",
]);

export const ACTION_TYPES = Object.freeze([
  "click",
  "fill",
  "check",
  "uncheck",
  "selectOption",
  "press",
]);

const TARGET_KEYS = Object.freeze({
  role: ["strategy", "role", "name"],
  label: ["strategy", "value"],
  placeholder: ["strategy", "value"],
  testId: ["strategy", "value"],
  text: ["strategy", "value", "exact"],
});

const MAX_TEXT = 500;
const MAX_TIMEOUT_MS = 10_000;

function requireString(value, label, max = MAX_TEXT) {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new TypeError(`${label} must be a non-empty string of at most ${max} characters.`);
  }
  return value;
}

export function validateTarget(target) {
  if (!target || typeof target !== "object" || Array.isArray(target)) {
    throw new TypeError("Action target must be an object.");
  }
  const strategy = target.strategy;
  const allowed = TARGET_KEYS[strategy];
  if (!allowed) {
    throw new TypeError("Unsupported target strategy. Use role, label, placeholder, testId, or text.");
  }
  for (const key of Object.keys(target)) {
    if (!allowed.includes(key)) throw new TypeError(`Unsupported target property: ${key}.`);
  }
  if (strategy === "role") {
    requireString(target.role, "target.role", 40);
    requireString(target.name, "target.name", 160);
    const supportedRoles = new Set(["button", "link", "textbox", "checkbox", "radio", "combobox", "option", "menuitem", "tab", "switch"]);
    if (!supportedRoles.has(target.role)) throw new TypeError(`Role '${target.role}' is not in the supported locator allowlist.`);
  } else {
    requireString(target.value, `target.${strategy}`, 200);
  }
  if (strategy === "text" && target.exact !== undefined && typeof target.exact !== "boolean") {
    throw new TypeError("target.exact must be a boolean.");
  }
  const descriptor = strategy === "role" ? `${target.name} ${target.role}` : target.value;
  if (["role", "label", "placeholder", "testId"].includes(strategy) && /password|email|user(name)?|credential/i.test(descriptor)) {
    throw new Error("Authentication fields cannot be targeted by model-proposed actions.");
  }
  if (["role", "label", "placeholder", "testId"].includes(strategy) && /delete|remove account|purchase|buy now|payment|pay now|send message|invite|refund|log ?out|checkout|place order|subscribe/i.test(descriptor)) {
    throw new Error("Destructive, financial, or external-communication controls are blocked by the browser policy.");
  }
  return target;
}

export function validateExpected(expected) {
  if (!expected || typeof expected !== "object" || Array.isArray(expected)) {
    throw new TypeError("An explicit postcondition is required for every browser action.");
  }
  const supported = new Set(["visible", "hidden", "text", "checked", "value", "url"]);
  if (!supported.has(expected.kind)) throw new TypeError("Unsupported postcondition kind.");
  if (["visible", "hidden", "checked", "value"].includes(expected.kind)) validateTarget(expected.target);
  if (["text", "value", "url"].includes(expected.kind)) requireString(expected.value, `expected.${expected.kind}`);
  return expected;
}

/** Validate one narrow, auditable browser action. Never accepts CSS, XPath, JS, or coordinates. */
export function validateActionProposal(proposal, { maxTimeoutMs = MAX_TIMEOUT_MS } = {}) {
  if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) {
    throw new TypeError("Action proposal must be an object.");
  }
  if (proposal.schemaVersion !== PHASE1_SCHEMA_VERSION) {
    throw new TypeError(`schemaVersion must be '${PHASE1_SCHEMA_VERSION}'.`);
  }
  requireString(proposal.actionId, "actionId", 100);
  requireString(proposal.intention, "intention", 200);
  if (!ACTION_TYPES.includes(proposal.action)) throw new TypeError("Action is not in the browser action allowlist.");
  validateTarget(proposal.target);
  validateExpected(proposal.expected);

  const timeoutMs = proposal.timeoutMs ?? 5_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > Math.min(MAX_TIMEOUT_MS, maxTimeoutMs)) {
    throw new RangeError(`timeoutMs must be an integer between 100 and ${Math.min(MAX_TIMEOUT_MS, maxTimeoutMs)}.`);
  }

  if (["fill", "selectOption", "press"].includes(proposal.action)) {
    requireString(proposal.value, "value", 2_000);
  } else if (proposal.value !== undefined) {
    throw new TypeError(`Action '${proposal.action}' does not accept a value.`);
  }

  if (proposal.action === "fill" && proposal.target.strategy === "role" && proposal.target.role !== "textbox") {
    throw new TypeError("fill is allowed only for an explicitly named textbox target.");
  }
  if (proposal.action === "fill" && !["role", "label", "placeholder", "testId"].includes(proposal.target.strategy)) {
    throw new TypeError("fill requires a semantic editable-field locator.");
  }
  if (proposal.action === "press" && !/^(Enter|Tab|Escape|Arrow(Up|Down|Left|Right)|Space|Backspace)$/.test(proposal.value)) {
    throw new TypeError("press value is not in the keyboard-key allowlist.");
  }
  if (["check", "uncheck"].includes(proposal.action) && proposal.target.strategy === "role" && !["checkbox", "radio"].includes(proposal.target.role)) {
    throw new TypeError(`${proposal.action} is allowed only for checkbox or radio targets.`);
  }
  if (proposal.action === "selectOption" && proposal.target.strategy === "role" && proposal.target.role !== "combobox") {
    throw new TypeError("selectOption is allowed only for an explicitly named combobox target.");
  }
  return Object.freeze({ ...proposal, timeoutMs });
}

export function createRunIds({ simulationId, studentId, sessionId } = {}) {
  const suffix = () => randomUUID();
  return Object.freeze({
    simulationId: simulationId ?? `SIM-${suffix()}`,
    studentId: (() => {
      const value = requireString(studentId, "studentId", 100);
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw new TypeError("studentId must contain only letters, numbers, underscores, or hyphens.");
      return value;
    })(),
    sessionId: sessionId ?? `SESSION-${suffix()}`,
  });
}
