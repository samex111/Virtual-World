import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseTargetConfig } from "../src/config/target-config.mjs";
import { assertAllowedTargetUrl } from "../src/phase0/target-policy.mjs";

const config = parseTargetConfig();
const target = assertAllowedTargetUrl(config.targetUrl, config);

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("Playwright is not installed. Run 'npm install' and 'npx playwright install chromium'.");
  process.exit(1);
}

const outputDir = resolve(config.artifactsDir);
const inventoryPath = resolve(outputDir, "target-inventory.json");
const screenshotPath = resolve(outputDir, "landing-page.png");
let browser;

try {
  await mkdir(outputDir, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(20_000);

  // The discovery browser is read-only and can contact only exact allowlisted hosts.
  await page.route("**/*", async (route) => {
    try {
      const requestUrl = new URL(route.request().url());
      const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(requestUrl.hostname.toLowerCase()) || requestUrl.hostname.toLowerCase().endsWith(".localhost");
      const approvedHost = config.allowedHosts.includes(requestUrl.hostname.toLowerCase());
      const approvedTransport = requestUrl.protocol === "https:" || (requestUrl.protocol === "http:" && isLocal);
      const approvedPort = !requestUrl.port || requestUrl.port === "443" || isLocal;
      if (["data:", "blob:", "about:"].includes(requestUrl.protocol) || (approvedHost && approvedTransport && approvedPort && !requestUrl.username && !requestUrl.password)) {
        await route.continue();
      } else {
        await route.abort("blockedbyclient");
      }
    } catch {
      await route.abort("blockedbyclient");
    }
  });

  const response = await page.goto(target.toString(), { waitUntil: "domcontentloaded" });
  const pageInventory = await page.evaluate(() => {
    const cleanText = (value, max = 120) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
    const accessibleName = (element) => cleanText(
      element.getAttribute("aria-label") ||
      (element.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ") ||
      ("labels" in element ? [...(element.labels || [])].map((label) => label.textContent || "").join(" ") : "") ||
      element.getAttribute("title") ||
      element.innerText ||
      element.textContent ||
      (element instanceof HTMLInputElement && !["password", "hidden"].includes(element.type) ? element.value : ""),
      120,
    );
    const sameOriginPath = (href) => {
      try {
        const url = new URL(href, window.location.href);
        return url.origin === window.location.origin ? url.pathname : null;
      } catch {
        return null;
      }
    };
    const controls = [...document.querySelectorAll("button, [role='button'], a[href], input, select, textarea")];
    const interactive = controls.map((element) => {
      const name = accessibleName(element);
      const testId = element.getAttribute("data-testid");
      const tag = element.tagName.toLowerCase();
      const role = element.getAttribute("role") || (tag === "a" ? "link" : tag === "button" ? "button" : tag);
      let hasLabel = Boolean(element.getAttribute("aria-label") || element.getAttribute("aria-labelledby"));
      if (!hasLabel && element instanceof HTMLInputElement && element.id) {
        hasLabel = Boolean(document.querySelector("label[for='" + CSS.escape(element.id) + "']"));
      }
      if (!hasLabel && element.closest("label")) hasLabel = true;
      if (!hasLabel && (tag === "button" || role === "button" || tag === "a")) hasLabel = Boolean(name);
      return {
        tag,
        role,
        name,
        path: tag === "a" ? sameOriginPath(element.href) : null,
        inputType: element instanceof HTMLInputElement ? element.type : null,
        disabled: "disabled" in element ? Boolean(element.disabled) : false,
        testId,
        hasAccessibleName: Boolean(name),
        hasAssociatedLabel: hasLabel,
      };
    });
    const headings = [...document.querySelectorAll("h1, h2, h3")].map((element) => ({
      level: Number(element.tagName.slice(1)),
      text: cleanText(element.innerText || element.textContent, 180),
    })).filter((heading) => heading.text);
    const links = [...new Set(interactive.map((item) => item.path).filter(Boolean))].sort();
    const controlsWithoutTestIds = interactive.filter((item) => !item.testId).length;
    const unnamedControls = interactive.filter((item) => !item.hasAccessibleName && ["button", "link"].includes(item.role)).length;
    const unlabeledFields = interactive.filter((item) => ["input", "select", "textarea"].includes(item.tag) && !item.hasAssociatedLabel).length;

    return {
      title: cleanText(document.title, 180),
      finalPath: window.location.pathname,
      headings,
      sameOriginRoutes: links,
      controls: interactive,
      accessibilitySummary: {
        interactiveElementCount: interactive.length,
        controlsWithoutTestIds,
        unnamedButtonsOrLinks: unnamedControls,
        unlabeledFormFields: unlabeledFields,
      },
    };
  });

  const status = response?.status() ?? null;
  const inventory = {
    schemaVersion: "1",
    inspectedAt: new Date().toISOString(),
    mode: "unauthenticated-read-only",
    targetOrigin: target.origin,
    httpStatus: status,
    ...pageInventory,
    limitations: [
      "No login, clicks, form submissions, or application writes were performed.",
      "Only links on the inspected origin are included; blocked third-party requests may affect rendering.",
      "This is a landing-page inventory, not proof that the complete Physics journey works.",
    ],
  };

  await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
  await writeFile(inventoryPath, JSON.stringify(inventory, null, 2) + "\n", { mode: 0o600 });

  console.log("Virtual-World · Phase 0 read-only UI inventory\n");
  console.log("HTTP status: " + (status ?? "unknown"));
  console.log("Page title: " + (pageInventory.title || "(empty)"));
  console.log("Headings: " + pageInventory.headings.length);
  console.log("Same-origin routes: " + pageInventory.sameOriginRoutes.length);
  console.log("Interactive elements: " + pageInventory.accessibilitySummary.interactiveElementCount);
  console.log("Missing test IDs: " + pageInventory.accessibilitySummary.controlsWithoutTestIds);
  console.log("Unnamed buttons/links: " + pageInventory.accessibilitySummary.unnamedButtonsOrLinks);
  console.log("Unlabeled form fields: " + pageInventory.accessibilitySummary.unlabeledFormFields);
  console.log("Inventory: " + inventoryPath);
  console.log("Screenshot: " + screenshotPath);
  console.log("\nReview the generated files before copying any findings into committed documentation.");
} catch (error) {
  console.error("\n[BLOCKED] UI inventory failed: " + error.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
