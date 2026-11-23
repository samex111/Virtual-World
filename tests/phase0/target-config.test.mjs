import test from "node:test";
import assert from "node:assert/strict";
import { parseTargetConfig, TARGET_SAFETY_ACK } from "../../src/config/target-config.mjs";

const validEnv = (overrides = {}) => ({
  TARGET_ENVIRONMENT: "test",
  TARGET_BASE_URL: "https://qa.aceraa.example",
  TARGET_ALLOWED_HOSTS: "qa.aceraa.example",
  TARGET_SAFETY_ACK,
  TEST_ACCOUNT_READY: "false",
  TEST_ACCOUNT_KIND: "synthetic",
  TEST_ACCOUNT_EMAIL: "",
  TEST_ACCOUNT_PASSWORD: "",
  ...overrides,
});

test("accepts an explicitly allowlisted HTTPS test target", () => {
  const config = parseTargetConfig(validEnv());
  assert.equal(config.environment, "test");
  assert.equal(config.targetUrl.hostname, "qa.aceraa.example");
  assert.equal(config.accountReady, false);
});

test("rejects production or unspecified environments", () => {
  assert.throws(() => parseTargetConfig(validEnv({ TARGET_ENVIRONMENT: "production" })), /must be 'test'/);
  assert.throws(() => parseTargetConfig(validEnv({ TARGET_ENVIRONMENT: "" })), /must be 'test'/);
});

test("requires explicit dedicated-test confirmation", () => {
  assert.throws(() => parseTargetConfig(validEnv({ TARGET_SAFETY_ACK: "yes" })), /TARGET_SAFETY_ACK/);
});

test("requires exact host allowlisting and rejects wildcards", () => {
  assert.throws(() => parseTargetConfig(validEnv({ TARGET_ALLOWED_HOSTS: "other.example" })), /exactly match/);
  assert.throws(() => parseTargetConfig(validEnv({ TARGET_ALLOWED_HOSTS: "*.example" })), /wildcards/);
});

test("rejects credentials, query strings, and fragments in target URLs", () => {
  assert.throws(() => parseTargetConfig(validEnv({ TARGET_BASE_URL: "https://user:pass@qa.aceraa.example" })), /embedded credentials/);
  assert.throws(() => parseTargetConfig(validEnv({ TARGET_BASE_URL: "https://qa.aceraa.example/?token=secret" })), /query string/);
  assert.throws(() => parseTargetConfig(validEnv({ TARGET_BASE_URL: "https://qa.aceraa.example/#section" })), /fragment/);
});

test("allows HTTP only for localhost development", () => {
  const config = parseTargetConfig(validEnv({
    TARGET_BASE_URL: "http://localhost:4173",
    TARGET_ALLOWED_HOSTS: "localhost",
  }));
  assert.equal(config.targetUrl.protocol, "http:");
  assert.throws(() => parseTargetConfig(validEnv({ TARGET_BASE_URL: "http://qa.aceraa.example" })), /must use HTTPS/);
});

test("requires a synthetic account when marked ready and validates credential pairs", () => {
  assert.throws(() => parseTargetConfig(validEnv({ TEST_ACCOUNT_READY: "true" })), /ready test account requires/);
  assert.throws(() => parseTargetConfig(validEnv({ TEST_ACCOUNT_EMAIL: "qa@example.test" })), /must either both/);
  const config = parseTargetConfig(validEnv({
    TEST_ACCOUNT_READY: "true",
    TEST_ACCOUNT_EMAIL: "qa-student@example.test",
    TEST_ACCOUNT_PASSWORD: "not-printed-by-the-tool",
  }));
  assert.equal(config.accountReady, true);
  assert.equal("accountPassword" in config, false);
});
