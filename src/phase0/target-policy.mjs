import { isLocalHostname } from "../config/target-config.mjs";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/**
 * Validate every destination before a preflight or browser request is made.
 * Only exact allowlisted hosts are accepted; wildcards are intentionally absent.
 */
export function assertAllowedTargetUrl(candidate, { allowedHosts }, { allowQuery = false } = {}) {
  const url = candidate instanceof URL ? new URL(candidate) : new URL(candidate);
  const host = url.hostname.toLowerCase();

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Blocked target protocol '" + url.protocol + "'.");
  }
  if (url.username || url.password || (!allowQuery && url.search) || url.hash) {
    throw new Error("Blocked target URL containing credentials, a disallowed query string, or a fragment.");
  }
  if (!allowedHosts.includes(host)) {
    throw new Error("Blocked host '" + host + "': it is not present in TARGET_ALLOWED_HOSTS.");
  }
  if (url.protocol === "http:" && !isLocalHostname(host)) {
    throw new Error("Blocked insecure HTTP request to a non-local target.");
  }
  if (url.port && url.port !== "443" && !isLocalHostname(host)) {
    throw new Error("Blocked non-standard port for a remote target.");
  }

  return url;
}

/**
 * Performs a side-effect-free GET and manually validates each redirect.
 * No cookies, account credentials, or application-specific headers are sent.
 */
export async function checkTargetReachability(config, { timeoutMs = 12_000, fetchImpl = fetch } = {}) {
  let currentUrl = assertAllowedTargetUrl(config.targetUrl, config);
  const maxRedirects = 3;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const response = await fetchImpl(currentUrl, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "Virtual-World-Phase0-Preflight/0.1" },
    });

    if (REDIRECT_STATUSES.has(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel().catch(() => {});
      if (!location) throw new Error("Target returned redirect " + response.status + " without a Location header.");
      if (redirectCount === maxRedirects) throw new Error("Target exceeded the maximum of three redirects.");
      currentUrl = assertAllowedTargetUrl(new URL(location, currentUrl), config, { allowQuery: true });
      continue;
    }

    await response.body?.cancel().catch(() => {});
    if (response.status >= 500) {
      throw new Error("Target returned HTTP " + response.status + "; the test environment is not healthy.");
    }
    if (response.status === 404) {
      throw new Error("Target returned HTTP 404. Check TARGET_BASE_URL; it must point to the Aceraa test application.");
    }
    if (response.status >= 400 && response.status !== 401 && response.status !== 403) {
      throw new Error("Target returned HTTP " + response.status + "; preflight expected a successful page or an authentication gate (401/403).");
    }

    return Object.freeze({
      status: response.status,
      finalOrigin: currentUrl.origin,
      finalPath: currentUrl.pathname,
      authenticationRequired: response.status === 401 || response.status === 403,
    });
  }

  throw new Error("Target reachability check did not complete.");
}
