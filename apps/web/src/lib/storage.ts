import type { AvatarConfig } from "@game/types";

export interface StoredProfile {
  name: string;
  avatar: AvatarConfig;
}

export interface StoredRoomCredentials {
  playerId: string;
  token: string;
  savedAt: number;
}

const PROFILE_KEY = "uc:profile";
const ROOM_KEY_PREFIX = "uc:room:";

function isStorageAvailable(): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    const testKey = "__uc_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function getStoredProfile(): StoredProfile | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === "string" && parsed.avatar && typeof parsed.avatar.style === "string") {
      return {
        name: parsed.name.slice(0, 16),
        avatar: {
          style: parsed.avatar.style,
          seed: String(parsed.avatar.seed || "agent"),
          options: parsed.avatar.options || {},
        },
      };
    }
  } catch {
    // Graceful fallback for corrupted JSON or private browsing
  }
  return null;
}

export function setStoredProfile(profile: StoredProfile): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota or security errors
  }
}

export function getStoredRoomCredentials(code: string): StoredRoomCredentials | null {
  if (!isStorageAvailable() || !code) return null;
  try {
    const raw = window.localStorage.getItem(`${ROOM_KEY_PREFIX}${code.toUpperCase()}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.playerId === "string" && typeof parsed.token === "string") {
      return {
        playerId: parsed.playerId,
        token: parsed.token,
        savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
      };
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

export function setStoredRoomCredentials(code: string, credentials: StoredRoomCredentials): void {
  if (!isStorageAvailable() || !code) return;
  try {
    window.localStorage.setItem(`${ROOM_KEY_PREFIX}${code.toUpperCase()}`, JSON.stringify(credentials));
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredRoomCredentials(code: string): void {
  if (!isStorageAvailable() || !code) return;
  try {
    window.localStorage.removeItem(`${ROOM_KEY_PREFIX}${code.toUpperCase()}`);
  } catch {
    // Ignore storage errors
  }
}
