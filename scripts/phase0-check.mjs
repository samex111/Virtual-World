import { parseTargetConfig } from "../src/config/target-config.mjs";
import { checkTargetReachability } from "../src/phase0/target-policy.mjs";

function printFailure(error) {
  console.error("\n[BLOCKED] " + error.message);
  console.error("\nFix the local .env file using .env.example. Never commit .env or paste credentials into prompts.");
  process.exitCode = 1;
}

try {
  const config = parseTargetConfig();
  console.log("Virtual-World · Phase 0 environment preflight\n");
  console.log("Environment: test");
  console.log("Target origin: " + config.targetUrl.origin);
  console.log("Exact host allowlist: " + config.allowedHosts.join(", "));
  console.log("Request policy: unauthenticated GET only; no clicks, form submissions, or writes.");

  const reachability = await checkTargetReachability(config);
  console.log("Reachability: HTTP " + reachability.status + " at " + reachability.finalOrigin + reachability.finalPath);
  if (reachability.authenticationRequired) {
    console.log("Authentication gate: detected (expected for a protected test application).");
  }

  console.log("Synthetic account: " + (config.accountReady
    ? "marked ready; credential values remain local and were not sent or displayed"
    : "NOT READY — provision an isolated synthetic account and set TEST_ACCOUNT_READY=true"));
  if (!config.accountReady) {
    console.error("\n[INCOMPLETE] Network access is verified, but Phase 0 cannot exit until a synthetic test account is provisioned.");
    process.exitCode = 2;
  } else {
    console.log("\n[PASS] Environment configuration and target reachability checks passed.");
    console.log("Note: this does not prove login works or that the first journey has been exercised.");
  }
} catch (error) {
  printFailure(error);
}
