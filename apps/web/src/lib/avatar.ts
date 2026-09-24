import { Avatar, Style } from "@dicebear/core";
import loreleiJson from "@dicebear/styles/lorelei.json";
import micahJson from "@dicebear/styles/micah.json";
import openPeepsJson from "@dicebear/styles/open-peeps.json";
import voxelArtJson from "@dicebear/styles/voxel-art.json";
import adventurerJson from "@dicebear/styles/adventurer.json";
import toonHeadJson from "@dicebear/styles/toon-head.json";
import type { AvatarConfig } from "@game/types";

export const ALLOWED_AVATAR_STYLES = [
  { id: "lorelei", label: "Lorelei" },
  { id: "micah", label: "Micah" },
  { id: "openPeeps", label: "Open peeps" },
  { id: "voxelArt", label: "Voxel Art" },
  { id: "adventurer", label: "Adventurer" },
  { id: "toonHead", label: "Toon Head" },
] as const;

export type AllowedAvatarStyleId = (typeof ALLOWED_AVATAR_STYLES)[number]["id"];

const styleLorelei = new Style(loreleiJson as any);
const styleMicah = new Style(micahJson as any);
const styleOpenPeeps = new Style(openPeepsJson as any);
const styleVoxelArt = new Style(voxelArtJson as any);
const styleAdventurer = new Style(adventurerJson as any);
const styleToonHead = new Style(toonHeadJson as any);

const STYLE_MAP: Record<string, Style> = {
  lorelei: styleLorelei,
  micah: styleMicah,
  openPeeps: styleOpenPeeps,
  "open-peeps": styleOpenPeeps,
  voxelArt: styleVoxelArt,
  "voxel-art": styleVoxelArt,
  adventurer: styleAdventurer,
  toonHead: styleToonHead,
  "toon-head": styleToonHead,
  // Graceful fallbacks for legacy stored avatars
  bottts: styleLorelei,
  thumbs: styleLorelei,
  shapes: styleLorelei,
  identicon: styleLorelei,
  pixelArt: styleVoxelArt,
  "pixel-art": styleVoxelArt,
  rings: styleLorelei,
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

  const styleDefinition = STYLE_MAP[styleKey] || styleLorelei;

  try {
    const avatarInstance = new Avatar(styleDefinition, {
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
