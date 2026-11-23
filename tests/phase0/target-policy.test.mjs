import test from "node:test";
import assert from "node:assert/strict";
import { assertAllowedTargetUrl, checkTargetReachability } from "../../src/phase0/target-policy.mjs";

const config = {
  targetUrl: new URL("https://qa.aceraa.example/start"),
  allowedHosts: ["qa.aceraa.example", "auth.qa.aceraa.example"],
};

test("rejects redirects to hosts outside the allowlist", () => {
  assert.throws(() => assertAllowedTargetUrl("https://evil.example/login", config), /not present in TARGET_ALLOWED_HOSTS/);
});

test("rejects insecure remote redirects", () => {
  assert.throws(() => assertAllowedTargetUrl("http://qa.aceraa.example/login", config), /insecure HTTP/);
});

test("follows redirects only when every destination is allowlisted", async () => {
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(url.toString());
    if (calls.length === 1) {
      return new Response(null, { status: 302, headers: { location: "https://auth.qa.aceraa.example/sign-in" } });
    }
    return new Response(null, { status: 200 });
  };
  const result = await checkTargetReachability(config, { fetchImpl: fakeFetch });
  assert.equal(result.status, 200);
  assert.equal(result.finalOrigin, "https://auth.qa.aceraa.example");
  assert.equal(calls.length, 2);
});

test("does not follow an unallowlisted redirect", async () => {
  const fakeFetch = async () => new Response(null, {
    status: 302,
    headers: { location: "https://evil.example/collect" },
  });
  await assert.rejects(() => checkTargetReachability(config, { fetchImpl: fakeFetch }), /not present in TARGET_ALLOWED_HOSTS/);
});

test("treats an authentication gate as reachable without logging in", async () => {
  const fakeFetch = async () => new Response(null, { status: 401 });
  const result = await checkTargetReachability(config, { fetchImpl: fakeFetch });
  assert.equal(result.authenticationRequired, true);
  assert.equal(result.status, 401);
});

test("rejects 404 and server failures", async () => {
  await assert.rejects(() => checkTargetReachability(config, { fetchImpl: async () => new Response(null, { status: 404 }) }), /HTTP 404/);
  await assert.rejects(() => checkTargetReachability(config, { fetchImpl: async () => new Response(null, { status: 503 }) }), /HTTP 503/);
});

test("allows query parameters on an allowlisted login redirect", async () => {
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(url.toString());
    if (calls.length === 1) {
      return new Response(null, { status: 302, headers: { location: "/login?next=%2Fphysics" } });
    }
    return new Response(null, { status: 200 });
  };
  const result = await checkTargetReachability(config, { fetchImpl: fakeFetch });
  assert.equal(result.status, 200);
  assert.equal(result.finalPath, "/login");
});
