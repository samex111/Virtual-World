import { validateActionProposal } from "../contracts/phase1.mjs";
import { observePage } from "./observation.mjs";

function assertAllowedUrl(candidate, { allowedHosts }) {
  const url = new URL(candidate);
  const host = url.hostname.toLowerCase();
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(host) || host.endsWith(".localhost");
  if (!allowedHosts.includes(host)) throw new Error(`Blocked browser navigation to non-allowlisted host '${host}'.`);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) throw new Error("Blocked insecure browser navigation.");
  if (url.username || url.password) throw new Error("Blocked URL containing embedded credentials.");
  if (url.port && url.port !== "443" && !local) throw new Error("Blocked non-standard remote port.");
  return url;
}

function locatorFor(page, target) {
  switch (target.strategy) {
    case "role": return page.getByRole(target.role, { name: target.name, exact: true });
    case "label": return page.getByLabel(target.value, { exact: true });
    case "placeholder": return page.getByPlaceholder(target.value, { exact: true });
    case "testId": return page.getByTestId(target.value);
    case "text": return page.getByText(target.value, { exact: target.exact ?? true });
    default: throw new Error("Unsupported locator strategy.");
  }
}

async function verifyExpected(page, expected, timeoutMs) {
  if (expected.kind === "url") {
    const current = new URL(page.url());
    if (!current.pathname.includes(expected.value)) throw new Error(`Postcondition failed: URL path did not include '${expected.value}'.`);
    return { kind: "url", observed: current.pathname };
  }
  if (expected.kind === "text") {
    const locator = page.getByText(expected.value, { exact: true });
    if (await locator.count() < 1) throw new Error(`Postcondition failed: expected visible text '${expected.value}' was absent.`);
    if (!(await locator.first().isVisible({ timeout: timeoutMs }))) throw new Error(`Postcondition failed: expected text '${expected.value}' was not visible.`);
    return { kind: "text", observed: expected.value };
  }
  const locator = locatorFor(page, expected.target);
  const count = await locator.count();
  if (expected.kind === "hidden" && count === 0) return { kind: "hidden", observed: "absent" };
  if (count !== 1) throw new Error(`Postcondition target must resolve to exactly one element; found ${count}.`);
  const element = locator;
  if (expected.kind === "visible" && !(await element.isVisible({ timeout: timeoutMs }))) throw new Error("Postcondition failed: target is not visible.");
  if (expected.kind === "hidden" && await element.isVisible().catch(() => false)) throw new Error("Postcondition failed: target is still visible.");
  if (expected.kind === "checked" && !(await element.isChecked())) throw new Error("Postcondition failed: target is not checked.");
  if (expected.kind === "value" && (await element.inputValue()) !== expected.value) throw new Error("Postcondition failed: field value did not match expected value.");
  return { kind: expected.kind, observed: "verified" };
}

export class BrowserActionController {
  constructor({ page, evidence, targetPolicy, maxActions = 20, maxTimeoutMs = 10_000 }) {
    this.page = page;
    this.evidence = evidence;
    this.targetPolicy = targetPolicy;
    this.maxActions = maxActions;
    this.maxTimeoutMs = maxTimeoutMs;
    this.actionsExecuted = 0;
  }

  async observe() {
    assertAllowedUrl(this.page.url(), this.targetPolicy);
    return observePage(this.page);
  }

  async execute(untrustedProposal) {
    let proposal;
    try {
      proposal = validateActionProposal(untrustedProposal, { maxTimeoutMs: this.maxTimeoutMs });
    } catch (error) {
      await this.evidence.append("action_rejected", {
        actionId: typeof untrustedProposal?.actionId === "string" ? untrustedProposal.actionId : null,
        reason: error.message,
      });
      throw error;
    }
    if (this.actionsExecuted >= this.maxActions) throw new Error(`Action budget exhausted (${this.maxActions}).`);
    assertAllowedUrl(this.page.url(), this.targetPolicy);

    const locator = locatorFor(this.page, proposal.target);
    const count = await locator.count();
    if (count !== 1) {
      await this.evidence.append("action_rejected", { actionId: proposal.actionId, reason: "ambiguous_or_missing_target", targetCount: count });
      throw new Error(`Action target must resolve to exactly one element; found ${count}.`);
    }
    if (!(await locator.isVisible({ timeout: proposal.timeoutMs }))) {
      await this.evidence.append("action_rejected", { actionId: proposal.actionId, reason: "target_not_visible" });
      throw new Error("Action target is not visible.");
    }
    if (await locator.isDisabled()) {
      await this.evidence.append("action_rejected", { actionId: proposal.actionId, reason: "target_disabled" });
      throw new Error("Action target is disabled.");
    }

    const before = await this.observe();
    const beforeRef = await this.evidence.captureObservation(before, `observations/${proposal.actionId}-before.json`);
    await this.evidence.append("browser_action_started", {
      actionId: proposal.actionId,
      intention: proposal.intention,
      action: proposal.action,
      target: proposal.target,
      input: proposal.value ?? null,
      timeoutMs: proposal.timeoutMs,
      observationRef: beforeRef.path,
    });

    const startedAt = Date.now();
    this.actionsExecuted += 1;
    try {
      switch (proposal.action) {
        case "click": await locator.click({ timeout: proposal.timeoutMs }); break;
        case "fill": await locator.fill(proposal.value, { timeout: proposal.timeoutMs }); break;
        case "check": await locator.check({ timeout: proposal.timeoutMs }); break;
        case "uncheck": await locator.uncheck({ timeout: proposal.timeoutMs }); break;
        case "selectOption": await locator.selectOption(proposal.value, { timeout: proposal.timeoutMs }); break;
        case "press": await locator.press(proposal.value, { timeout: proposal.timeoutMs }); break;
        default: throw new Error("Action is not implemented by the controller.");
      }

      assertAllowedUrl(this.page.url(), this.targetPolicy);
      const verification = await verifyExpected(this.page, proposal.expected, proposal.timeoutMs);
      const after = await this.observe();
      const afterRef = await this.evidence.captureObservation(after, `observations/${proposal.actionId}-after.json`);
      const screenshotRef = await this.evidence.captureScreenshot(this.page, `screenshots/${proposal.actionId}.png`, `After action ${proposal.actionId}`);
      const result = {
        actionId: proposal.actionId,
        status: "verified",
        durationMs: Date.now() - startedAt,
        verification,
        before,
        after,
        evidenceRefs: [beforeRef.path, afterRef.path, screenshotRef.path],
      };
      await this.evidence.append("browser_action_completed", {
        actionId: proposal.actionId,
        action: proposal.action,
        durationMs: result.durationMs,
        verification,
        evidenceRefs: result.evidenceRefs,
      });
      await this.evidence.append("postcondition_verified", { actionId: proposal.actionId, verification, evidenceRefs: result.evidenceRefs });
      return result;
    } catch (error) {
      await this.evidence.append("browser_action_failed", {
        actionId: proposal.actionId,
        action: proposal.action,
        durationMs: Date.now() - startedAt,
        error: error.message,
      });
      throw error;
    }
  }
}

export async function installTargetRequestGuard(context, targetPolicy) {
  await context.route("**/*", async (route) => {
    try {
      const raw = route.request().url();
      if (["data:", "blob:", "about:"].some((scheme) => raw.startsWith(scheme))) return route.continue();
      assertAllowedUrl(raw, targetPolicy);
      return route.continue();
    } catch {
      return route.abort("blockedbyclient");
    }
  });

  if (typeof context.routeWebSocket === "function") {
    await context.routeWebSocket("**/*", async (socketRoute) => {
      try {
        const url = new URL(socketRoute.url());
        const protocol = url.protocol === "wss:" ? "https:" : url.protocol === "ws:" ? "http:" : url.protocol;
        assertAllowedUrl(new URL(`${protocol}//${url.host}${url.pathname}`), targetPolicy);
        await socketRoute.connect();
      } catch {
        await socketRoute.close({ code: 1008, reason: "Target is not allowlisted." });
      }
    });
  }
}
