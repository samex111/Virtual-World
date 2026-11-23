export const TARGET_SAFETY_ACK = "I_CONFIRM_THIS_IS_A_DEDICATED_TEST_ENVIRONMENT";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function isLocalHost(hostname) {
  return LOCAL_HOSTS.has(hostname.toLowerCase()) || hostname.toLowerCase().endsWith(".localhost");
}

function parseBoolean(value, name, errors) {
  if (value === "true") return true;
  if (value === "false") return false;
  errors.push(name + " must be either 'true' or 'false'.");
  return false;
}

function parseAllowedHosts(value, errors) {
  const hosts = String(value ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (hosts.length === 0) {
    errors.push("TARGET_ALLOWED_HOSTS must contain at least one exact hostname.");
  }

  for (const host of hosts) {
    if (host === "*" || host.includes("*") || host.includes("/") || host.includes(":")) {
      errors.push("Invalid allowlist entry '" + host + "'. Use exact hostnames without wildcards, schemes, or ports.");
    }
  }

  return [...new Set(hosts)];
}

/**
 * Parse the Phase 0 environment without returning secret values to callers.
 * The test account credentials are only checked for presence and are never
 * needed by the Phase 0 read-only tools.
 */
export function parseTargetConfig(env = process.env) {
  const errors = [];

  if (env.TARGET_ENVIRONMENT !== "test") {
    errors.push("TARGET_ENVIRONMENT must be 'test'. Production and unspecified environments are not supported.");
  }

  if (env.TARGET_SAFETY_ACK !== TARGET_SAFETY_ACK) {
    errors.push("TARGET_SAFETY_ACK must exactly equal '" + TARGET_SAFETY_ACK + "'.");
  }

  const allowedHosts = parseAllowedHosts(env.TARGET_ALLOWED_HOSTS, errors);
  let targetUrl;

  if (!env.TARGET_BASE_URL?.trim()) {
    errors.push("TARGET_BASE_URL is required.");
  } else {
    try {
      targetUrl = new URL(env.TARGET_BASE_URL);
    } catch {
      errors.push("TARGET_BASE_URL must be an absolute HTTP(S) URL.");
    }
  }

  if (targetUrl) {
    if (!["https:", "http:"].includes(targetUrl.protocol)) {
      errors.push("TARGET_BASE_URL must use HTTPS (HTTP is allowed only for localhost). ");
    }
    if (targetUrl.username || targetUrl.password) {
      errors.push("TARGET_BASE_URL must not contain embedded credentials.");
    }
    if (targetUrl.search || targetUrl.hash) {
      errors.push("TARGET_BASE_URL must not contain a query string or fragment.");
    }
    if (targetUrl.protocol === "http:" && !isLocalHost(targetUrl.hostname)) {
      errors.push("Remote targets must use HTTPS. HTTP is allowed only for localhost/loopback development.");
    }
    if (targetUrl.port && targetUrl.port !== "443" && !isLocalHost(targetUrl.hostname)) {
      errors.push("Remote targets must use the standard HTTPS port (443).");
    }
    if (!allowedHosts.includes(targetUrl.hostname.toLowerCase())) {
      errors.push("TARGET_BASE_URL hostname must exactly match an entry in TARGET_ALLOWED_HOSTS.");
    }
  }

  const accountReady = parseBoolean(env.TEST_ACCOUNT_READY ?? "false", "TEST_ACCOUNT_READY", errors);
  const accountKind = env.TEST_ACCOUNT_KIND?.trim() || "";
  const accountEmail = env.TEST_ACCOUNT_EMAIL?.trim() || "";
  const accountPassword = env.TEST_ACCOUNT_PASSWORD || "";

  if (accountKind && accountKind !== "synthetic") {
    errors.push("TEST_ACCOUNT_KIND must be 'synthetic'. Real student accounts are not supported.");
  }
  if (Boolean(accountEmail) !== Boolean(accountPassword)) {
    errors.push("TEST_ACCOUNT_EMAIL and TEST_ACCOUNT_PASSWORD must either both be set or both be empty.");
  }
  if ((accountEmail || accountPassword) && accountKind !== "synthetic") {
    errors.push("Credentials may only be configured for TEST_ACCOUNT_KIND=synthetic.");
  }
  if (accountEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)) {
    errors.push("TEST_ACCOUNT_EMAIL must be a valid email address.");
  }
  if (accountReady && (accountKind !== "synthetic" || !accountEmail || !accountPassword)) {
    errors.push("A ready test account requires TEST_ACCOUNT_KIND=synthetic and both account credentials.");
  }

  if (errors.length > 0) {
    const error = new Error("Phase 0 configuration is invalid:\n- " + errors.join("\n- "));
    error.name = "TargetConfigError";
    error.issues = errors;
    throw error;
  }

  return Object.freeze({
    environment: "test",
    targetUrl,
    allowedHosts,
    accountReady,
    artifactsDir: env.VIRTUAL_WORLD_ARTIFACTS_DIR?.trim() || "artifacts/phase-0",
  });
}

export function isLocalHostname(hostname) {
  return isLocalHost(hostname);
}
