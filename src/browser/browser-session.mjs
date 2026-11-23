import { mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { installTargetRequestGuard } from "./action-controller.mjs";

/**
 * Owns the one Chromium context for a run. Tracing starts only after the
 * adapter has authenticated, so the login form/request is not copied into a
 * trace. The test account must be synthetic and dedicated to the QA tenant.
 */
export async function createBrowserSession({ chromium, targetConfig, evidence, headless = true }) {
  const browser = await chromium.launch({ headless });
  const browserVersion = browser.version();
  const videoDir = join(tmpdir(), `virtual-world-video-${randomUUID()}`);
  let context;
  let page;
  try {
    await mkdir(videoDir, { recursive: true, mode: 0o700 });
    context = await browser.newContext({
      serviceWorkers: "block",
      recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
    });
    await installTargetRequestGuard(context, targetConfig);
    page = await context.newPage();
    page.setDefaultNavigationTimeout(20_000);
    page.setDefaultTimeout(8_000);
    await page.goto(targetConfig.targetUrl.toString(), { waitUntil: "domcontentloaded" });
  } catch (error) {
    await context?.close().catch(() => {});
    await browser.close().catch(() => {});
    await rm(videoDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }

  let tracingStarted = false;
  let closed = false;
  const video = page.video();

  return {
    browser,
    browserVersion,
    context,
    page,
    async startTrace() {
      if (tracingStarted) return;
      await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
      tracingStarted = true;
    },
    async close() {
      if (closed) return;
      closed = true;
      const traceTemp = join(tmpdir(), `virtual-world-trace-${randomUUID()}.zip`);
      const videoTemp = join(tmpdir(), `virtual-world-video-${randomUUID()}.webm`);
      const failures = [];
      try {
        if (tracingStarted) {
          try {
            await context.tracing.stop({ path: traceTemp });
            const rawTraceBytes = await readFile(traceTemp);
            const { sanitizePlaywrightTrace } = await import("../evidence/trace-redactor.mjs");
            const traceBytes = await sanitizePlaywrightTrace(rawTraceBytes);
            await evidence.writeArtifact("playwright-trace.zip", traceBytes, {
              contentType: "application/zip",
              description: "Playwright trace with network secrets and request/response bodies redacted",
            });
          } catch (error) {
            failures.push(`Trace finalization failed: ${error.message}`);
          }
        }
      } finally {
        await context.close().catch((error) => failures.push(`Context close failed: ${error.message}`));
        await browser.close().catch((error) => failures.push(`Browser close failed: ${error.message}`));
      }
      try {
        if (video) {
          await video.saveAs(videoTemp);
          const videoBytes = await readFile(videoTemp);
          await evidence.writeArtifact("browser-video.webm", videoBytes, {
            contentType: "video/webm",
            description: "Chromium video of the synthetic learner journey",
          });
        }
      } catch (error) {
        failures.push(`Video finalization failed: ${error.message}`);
      } finally {
        await rm(traceTemp, { force: true }).catch(() => {});
        await rm(videoTemp, { force: true }).catch(() => {});
        await rm(videoDir, { recursive: true, force: true }).catch(() => {});
      }
      if (failures.length) throw new Error(failures.join("; "));
    },
  };
}
