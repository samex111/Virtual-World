const SENSITIVE_KEY = /(password|passwd|secret|token|cookie|authorization|api[_-]?key|access[_-]?key)/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const JWT = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;

export function redactText(value) {
  return String(value)
    .replace(BEARER, "Bearer [REDACTED]")
    .replace(JWT, "[REDACTED_JWT]")
    .replace(EMAIL, "[REDACTED_EMAIL]")
    .replace(/<input\b[^>]*>/gi, (tag) => /type=["']password["']/i.test(tag)
      ? tag.replace(/\bvalue=(["'])[^"']*\1/i, 'value="[REDACTED]"')
      : tag);
}

export function redactSensitive(value, key = "") {
  if (SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [
      childKey,
      redactSensitive(childValue, childKey),
    ]));
  }
  return value;
}
