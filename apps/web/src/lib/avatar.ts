import { createAvatar } from "@dicebear/core";
import {
  lorelei,
  thumbs,
  shapes,
  identicon,
  pixelArt,
  rings,
} from "@dicebear/collection";
import type { AvatarConfig } from "@game/types";

export const ALLOWED_AVATAR_STYLES = [
  { id: "lorelei", label: "Lorelei" },
  { id: "thumbs", label: "Thumbs" },
  { id: "shapes", label: "Shapes" },
  { id: "identicon", label: "Identicon" },
  { id: "pixelArt", label: "Pixel" },
  { id: "rings", label: "Rings" },
] as const;

export type AllowedAvatarStyleId = (typeof ALLOWED_AVATAR_STYLES)[number]["id"];

const STYLE_MAP: Record<string, any> = {
  lorelei,
  bottts: lorelei, // Graceful fallback for legacy stored avatars
  thumbs,
  shapes,
  identicon,
  pixelArt,
  "pixel-art": pixelArt,
  rings,
};

const avatarUriCache = new Map<string, string>();

/**
 * Renders an SVG data URI safely for use in <img> tags.
 * Result is cached in-memory by style, seed, and options.
 */
export function getAvatarDataUri(avatar: AvatarConfig): string {
  const styleKey = avatar.style || "lorelei";
  const seedKey = avatar.seed || "agent";
  const optionsKey = avatar.options ? JSON.stringify(avatar.options) : "";
  const cacheKey = `${styleKey}:${seedKey}:${optionsKey}`;

  const cached = avatarUriCache.get(cacheKey);
  if (cached) return cached;

  const styleDefinition = STYLE_MAP[styleKey] || lorelei;

  try {
    const avatarInstance = createAvatar(styleDefinition, {
      seed: seedKey,
      ...avatar.options,
    });
    const uri = avatarInstance.toDataUri();
    avatarUriCache.set(cacheKey, uri);
    return uri;
  } catch (err) {
    console.error("Failed to render avatar:", err);
    // Fallback simple SVG data URI
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23facc15"/></svg>`;
  }
}

/**
 * Generates a random alphanumeric seed (up to 12 chars).
 */
export function generateRandomSeed(): string {
  return Math.random().toString(36).substring(2, 10);
}
