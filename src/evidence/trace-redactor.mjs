import { redactText } from "./redaction.mjs";

function stripUrl(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return redactText(value);
  }
}

export function sanitizeTraceValue(value, key = "") {
  if (/(postData|requestBody|responseBody|body|cookie|authorization|headers)/i.test(key)) return "[REDACTED]";
  if (/(^|_)(url|uri)$/i.test(key) && typeof value === "string") return stripUrl(value);
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeTraceValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [
      childKey,
      sanitizeTraceValue(childValue, childKey),
    ]));
  }
  return value;
}

/** Remove auth headers, cookies, request/response bodies and URL query strings from Playwright trace data. */
export async function sanitizePlaywrightTrace(bytes) {
  const { unzipSync, zipSync, strFromU8, strToU8 } = await import("fflate");
  const entries = unzipSync(new Uint8Array(bytes));
  const cleaned = {};
  for (const [name, content] of Object.entries(entries)) {
    if (/\.(png|jpe?g|webp|woff2?|ttf|otf|webm|mp4)$/i.test(name)) {
      cleaned[name] = content;
      continue;
    }
    let text;
    try {
      text = strFromU8(content);
      if (new TextEncoder().encode(text).byteLength !== content.byteLength) throw new Error("not UTF-8");
    } catch {
      cleaned[name] = content;
      continue;
    }
    const sanitizedLines = text.split("\n").map((line) => {
      if (!line.trim()) return line;
      try {
        return JSON.stringify(sanitizeTraceValue(JSON.parse(line)));
      } catch {
        return redactText(line).replace(/(type=["']password["'][^>]*value=["'])[^"']*(["'])/gi, "$1[REDACTED]$2");
      }
    });
    cleaned[name] = strToU8(sanitizedLines.join("\n"));
  }
  return Buffer.from(zipSync(cleaned, { level: 6 }));
}
