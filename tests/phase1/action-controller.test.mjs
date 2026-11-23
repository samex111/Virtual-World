import test from "node:test";
import assert from "node:assert/strict";
import { BrowserActionController, installTargetRequestGuard } from "../../src/browser/action-controller.mjs";

class FakeLocator {
  constructor(page, count = 1) { this.page = page; this.matches = count; }
  async count() { return this.matches; }
  async isVisible() { return true; }
  async isDisabled() { return false; }
  async isChecked() { return Boolean(this.page.checked); }
  async inputValue() { return this.page.value ?? ""; }
  async click() { this.page.clicked = true; }
  async fill(value) { this.page.value = value; }
  async check() { this.page.checked = true; }
  async uncheck() { this.page.checked = false; }
  async selectOption(value) { this.page.value = value; }
  async press(key) { this.page.key = key; }
  first() { return this; }
}

function fakePage({ count = 1 } = {}) {
  const page = {
    currentUrl: "https://qa.aceraa.test/practice",
    clicked: false,
    value: "",
    checked: false,
    url() { return this.currentUrl; },
    evaluate: async (_fn, _args) => ({ url: page.currentUrl, title: "Practice", bodyText: "Practice Next", controls: [], capturedAt: new Date().toISOString() }),
    screenshot: async () => Buffer.from("image"),
    getByRole: () => new FakeLocator(page, count),
    getByLabel: () => new FakeLocator(page, count),
    getByPlaceholder: () => new FakeLocator(page, count),
    getByTestId: () => new FakeLocator(page, count),
    getByText: () => new FakeLocator(page, count),
  };
  return page;
}

function fakeEvidence() {
  const records = [];
  return {
    records,
    append: async (type, payload) => records.push({ type, payload }),
    captureObservation: async (_value, path) => ({ path }),
    captureScreenshot: async (_page, path) => ({ path }),
  };
}

const proposal = {
  schemaVersion: "1", actionId: "ACT-001", intention: "Open the next step", action: "click",
  target: { strategy: "role", role: "button", name: "Continue" },
  expected: { kind: "visible", target: { strategy: "text", value: "Next" } },
};

test("executes one semantic click and verifies its postcondition", async () => {
  const page = fakePage();
  const evidence = fakeEvidence();
  const controller = new BrowserActionController({ page, evidence, targetPolicy: { allowedHosts: ["qa.aceraa.test"] }, maxActions: 1 });
  const result = await controller.execute(proposal);
  assert.equal(page.clicked, true);
  assert.equal(result.status, "verified");
  assert.ok(evidence.records.some((item) => item.type === "postcondition_verified"));
});

test("rejects ambiguous locators without clicking either match", async () => {
  const page = fakePage({ count: 2 });
  const evidence = fakeEvidence();
  const controller = new BrowserActionController({ page, evidence, targetPolicy: { allowedHosts: ["qa.aceraa.test"] } });
  await assert.rejects(() => controller.execute(proposal), /exactly one element/);
  assert.equal(page.clicked, false);
  assert.ok(evidence.records.some((item) => item.type === "action_rejected"));
});

test("blocks unapproved target hosts", async () => {
  const page = fakePage();
  page.currentUrl = "https://attacker.example/";
  const controller = new BrowserActionController({ page, evidence: fakeEvidence(), targetPolicy: { allowedHosts: ["qa.aceraa.test"] } });
  await assert.rejects(() => controller.observe(), /non-allowlisted/);
});

test("aborts browser requests to hosts outside the exact allowlist", async () => {
  let outcome = null;
  const context = { route: async (_pattern, callback) => {
    await callback({ request: () => ({ url: () => "https://attacker.example/steal" }), abort: async () => { outcome = "aborted"; }, continue: async () => { outcome = "continued"; } });
  } };
  await installTargetRequestGuard(context, { allowedHosts: ["qa.aceraa.test"] });
  assert.equal(outcome, "aborted");
});


test("blocks WebSocket connections to hosts outside the exact allowlist", async () => {
  let outcome = null;
  const context = {
    route: async () => {},
    routeWebSocket: async (_pattern, callback) => callback({
      url: () => "wss://socket.attacker.example/connect",
      connect: async () => { outcome = "connected"; },
      close: async () => { outcome = "closed"; },
    }),
  };
  await installTargetRequestGuard(context, { allowedHosts: ["qa.aceraa.test"] });
  assert.equal(outcome, "closed");
});
