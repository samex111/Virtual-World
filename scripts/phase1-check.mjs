import { access } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { parseTargetConfig } from "../src/config/target-config.mjs";
import { checkTargetReachability } from "../src/phase0/target-policy.mjs";

function fail(message) {
  console.error(`[BLOCKED] ${message}`);
  process.exitCode = 2;
}

try {
  const config = parseTargetConfig();
  console.log("Virtual-World · Phase 1 readiness check\n");
  console.log(`Environment: ${config.environment}`);
  console.log(`Target origin: ${config.targetUrl.origin}`);
  console.log("Network policy: exact host allowlist; redirects checked; no third-party browser requests.");

  const reachable = await checkTargetReachability(config);
  console.log(`Target preflight: HTTP ${reachable.status} at ${reachable.finalOrigin}${reachable.finalPath}`);

  if (!config.accountReady) fail("A dedicated synthetic test account is not verified. Set TEST_ACCOUNT_READY=true only after owner provisioning.");
  else console.log("Synthetic test account: configuration is marked ready (owner verification is still required).");

  const adapterPath = process.env.PHASE1_ADAPTER_MODULE?.trim();
  if (!adapterPath) fail("PHASE1_ADAPTER_MODULE is not configured. Add a local adapter after inspecting the authenticated QA UI; do not guess selectors.");
  else {
    const absolutePath = resolve(process.cwd(), adapterPath);
    const adapterRelativePath = relative(process.cwd(), absolutePath);
    if (isAbsolute(adapterRelativePath) || adapterRelativePath === ".." || adapterRelativePath.startsWith(`..${sep}`)) {
      fail("PHASE1_ADAPTER_MODULE must be inside this repository.");
    }
    try {
      await access(absolutePath);
      console.log("Aceraa adapter: local module found; implementation contract is validated during phase1:run.");
    } catch {
      fail(`Configured local adapter was not found at '${adapterPath}'.`);
    }
  }

  if (process.exitCode === 2) {
    console.error("\nPhase 1 is safely gated. Provision the isolated QA tenant/account, complete the read-only route inventory, approve the Physics reference, and provide the local UI adapter.");
  } else {
    console.log("\n[READY FOR ADAPTER VALIDATION] This check does not prove that the complete learner journey works.");
  }
} catch (error) {
  fail(error.message);
}
