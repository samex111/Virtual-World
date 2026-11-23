import { access, mkdir } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { parseTargetConfig } from "../src/config/target-config.mjs";
import { createRunIds } from "../src/contracts/phase1.mjs";
import { ProfileStore, createInitialJeePhysicsProfile } from "../src/profiles/profile-store.mjs";
import { EvidenceStore } from "../src/evidence/evidence-store.mjs";
import { createBrowserSession } from "../src/browser/browser-session.mjs";
import { BrowserActionController } from "../src/browser/action-controller.mjs";
import { JourneyRunner } from "../src/orchestration/journey-runner.mjs";
import { physicsNewtonsLawsScenario, createScenarioAdapter } from "../src/scenarios/physics-newtons-laws.mjs";

function integerEnv(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  if (!/^\d+$/.test(value)) throw new TypeError(`${name} must be a positive integer.`);
  return Number(value);
}

let runError = null;
let session = null;
let evidence = null;
let profile = null;
let ids = null;
let status = "failed";
let result = null;
let runnerStarted = false;
const profileStore = new ProfileStore(resolve("data/profiles"));

try {
  const targetConfig = parseTargetConfig();
  if (!targetConfig.accountReady || !process.env.TEST_ACCOUNT_EMAIL || !process.env.TEST_ACCOUNT_PASSWORD) {
    throw new Error("Phase 1 requires a verified synthetic account. Credentials must remain in the local environment and are never passed to the Student Agent.");
  }
  const adapterPath = process.env.PHASE1_ADAPTER_MODULE?.trim();
  if (!adapterPath) throw new Error("PHASE1_ADAPTER_MODULE must point to the locally authored Aceraa adapter.");
  const absoluteAdapterPath = resolve(process.cwd(), adapterPath);
  const adapterRelativePath = relative(process.cwd(), absoluteAdapterPath);
  if (isAbsolute(adapterRelativePath) || adapterRelativePath === ".." || adapterRelativePath.startsWith(`..${sep}`)) {
    throw new Error("PHASE1_ADAPTER_MODULE must be inside this repository.");
  }
  await access(absoluteAdapterPath);
  const adapterModule = await import(pathToFileURL(absoluteAdapterPath).href);
  if (typeof adapterModule.createAceraaAdapter !== "function") {
    throw new TypeError("The Aceraa adapter must export createAceraaAdapter({ targetConfig, scenarioDefinition }).");
  }

  const studentId = process.env.PHASE1_STUDENT_ID || "student_jee_physics_001";
  ids = createRunIds({ studentId });
  const artifactsRoot = resolve(process.env.PHASE1_ARTIFACTS_DIR || "artifacts/phase-1");
  const runDir = resolve(artifactsRoot, ids.simulationId);
  await mkdir(runDir, { recursive: true, mode: 0o700 });
  profile = await profileStore.load(studentId);
  if (!profile) profile = await profileStore.create(createInitialJeePhysicsProfile({ studentId }));
  evidence = new EvidenceStore({
    rootDir: runDir,
    ids,
    scenarioId: physicsNewtonsLawsScenario.id,
    scenarioVersion: physicsNewtonsLawsScenario.version,
    profileVersion: profile.version,
  });
  await evidence.initialize();

  session = await createBrowserSession({ chromium, targetConfig, evidence });
  const adapter = await adapterModule.createAceraaAdapter({ targetConfig, scenarioDefinition: physicsNewtonsLawsScenario });
  for (const method of ["authenticate", "verifyAuthenticated", "createStudentAgent", "createActionPlanner", "createScenario"]) {
    if (typeof adapter?.[method] !== "function") throw new TypeError(`Aceraa adapter is missing required method '${method}'.`);
  }

  // Credentials are passed only to the trusted local authentication adapter, never to an agent or planner.
  let credentials = { email: process.env.TEST_ACCOUNT_EMAIL, password: process.env.TEST_ACCOUNT_PASSWORD };
  try {
    await adapter.authenticate({ page: session.page, credentials });
  } catch {
    throw new Error("Synthetic-account authentication failed; details are suppressed to avoid leaking credentials.");
  } finally {
    credentials.email = "";
    credentials.password = "";
    credentials = null;
    delete process.env.TEST_ACCOUNT_EMAIL;
    delete process.env.TEST_ACCOUNT_PASSWORD;
  }
  if (!await adapter.verifyAuthenticated({ page: session.page })) {
    throw new Error("Authentication did not reach the adapter-confirmed signed-in state.");
  }
  await session.startTrace();

  const scenarioParts = await adapter.createScenario({ page: session.page, profile, scenarioDefinition: physicsNewtonsLawsScenario });
  const scenario = createScenarioAdapter({ checkpoints: scenarioParts?.checkpoints, academicReference: scenarioParts?.academicReference });
  const agent = await adapter.createStudentAgent({ profile, scenario: scenario.publicView });
  const actionPlanner = await adapter.createActionPlanner({ scenario: scenario.publicView });
  const budget = {
    maxActions: integerEnv("PHASE1_MAX_ACTIONS", 20),
    maxDurationMs: integerEnv("PHASE1_MAX_DURATION_MS", 180_000),
    maxDecisionCalls: integerEnv("PHASE1_MAX_DECISION_CALLS", 20),
    maxRetries: integerEnv("PHASE1_MAX_RETRIES", 0),
    maxActionTimeoutMs: integerEnv("PHASE1_MAX_ACTION_TIMEOUT_MS", 8_000),
    maxDecisionCallMs: integerEnv("PHASE1_MAX_DECISION_CALL_MS", 15_000),
  };
  const controller = new BrowserActionController({
    page: session.page,
    evidence,
    targetPolicy: targetConfig,
    maxActions: budget.maxActions,
    maxTimeoutMs: budget.maxActionTimeoutMs,
  });
  const runner = new JourneyRunner({ agent, actionPlanner, controller, evidence, profileStore, profile, scenario, budget });
  runnerStarted = true;
  result = await runner.run(await controller.observe());
  profile = result.profile;
  status = "completed";
  console.log(`[PASS] Phase 1 journey completed for ${ids.simulationId}.`);
} catch (error) {
  runError = error;
  console.error(`[FAILED] ${error.message}`);
  if (evidence && !runnerStarted) {
    await evidence.append("simulation_failed", { reason: error.message }).catch(() => {});
  }
} finally {
  if (session) {
    await session.close().catch((error) => {
      runError ??= error;
      status = "failed";
      console.error(`[ARTIFACT WARNING] Browser evidence finalization failed: ${error.message}`);
    });
  }
  if (evidence) {
    await evidence.finalize({
      status,
      reason: runError?.message ?? null,
      browser: { engine: "chromium", version: session?.browserVersion ?? "unknown" },
      profile: { version: profile?.version ?? 1, kind: "synthetic_student" },
    }).catch((error) => {
      runError ??= error;
      status = "failed";
      console.error(`[ARTIFACT WARNING] Manifest finalization failed: ${error.message}`);
    });
    console.log(`Run artifacts: ${evidence.rootDir}`);
  }
}

if (runError || status !== "completed") process.exitCode = 1;
