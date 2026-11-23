import { redactText } from "../evidence/redaction.mjs";

const MAX_BODY_TEXT = 12_000;
const MAX_CONTROLS = 150;

/** Capture only user-visible text and control metadata; never read form values. */
export async function observePage(page) {
  const raw = await page.evaluate(({ maxText, maxControls }) => {
    const clean = (value, max = 240) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
    const bodyText = clean(document.body?.innerText ?? "", maxText);
    const controls = [...document.querySelectorAll("button, a[href], input, textarea, select, [role='button'], [role='radio'], [role='checkbox']")]
      .slice(0, maxControls)
      .map((element) => {
        const tag = element.tagName.toLowerCase();
        const name = clean(element.getAttribute("aria-label") || element.getAttribute("title") || element.innerText || element.textContent || "", 160);
        return {
          tag,
          role: element.getAttribute("role") || (tag === "button" ? "button" : tag === "a" ? "link" : tag),
          name,
          testId: element.getAttribute("data-testid"),
          disabled: "disabled" in element ? Boolean(element.disabled) : false,
        };
      });
    return {
      url: window.location.href,
      title: clean(document.title, 240),
      bodyText,
      controls,
      capturedAt: new Date().toISOString(),
    };
  }, { maxText: MAX_BODY_TEXT, maxControls: MAX_CONTROLS });

  return {
    ...raw,
    url: stripUrlSecrets(raw.url),
    title: redactText(raw.title),
    bodyText: redactText(raw.bodyText),
    controls: raw.controls.map((control) => ({ ...control, name: redactText(control.name) })),
  };
}

function stripUrlSecrets(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "[INVALID_URL]";
  }
}
