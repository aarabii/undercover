import { MAX_NAME_LENGTH } from "../constants";

const UNSAFE_CHARS_REGEX = /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/g;

export function sanitizeRawName(raw: string): string {
  const stripped = raw.replace(UNSAFE_CHARS_REGEX, "");
  const collapsed = stripped.replace(/\s+/g, " ").trim();
  if (collapsed.length === 0) {
    return "Player";
  }
  return collapsed.slice(0, MAX_NAME_LENGTH);
}

export function generateUniqueName(rawName: string, existingNames: string[]): string {
  const baseClean = sanitizeRawName(rawName);
  const existingSet = new Set(existingNames);

  if (!existingSet.has(baseClean)) {
    return baseClean;
  }

  // Find lowest suffix starting at 2
  for (let suffixNum = 2; suffixNum < 1000; suffixNum++) {
    const suffix = ` ${suffixNum}`;
    const maxBaseLen = MAX_NAME_LENGTH - suffix.length;
    const base = maxBaseLen > 0 ? baseClean.slice(0, maxBaseLen).trimEnd() : "P";
    const candidate = `${base}${suffix}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  return baseClean.slice(0, 12) + " ...";
}
