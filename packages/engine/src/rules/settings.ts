import type { Settings } from "@game/types";
import { MIN_PLAYERS, MAX_PLAYERS } from "../constants";

export type SettingsValidationResult =
  | { valid: true; settings: Settings }
  | { valid: false; error: { code: string; message: string } };

export function validateSettingsPatch(
  current: Settings,
  patch: Partial<Settings>
): SettingsValidationResult {
  const merged: Settings = {
    ...current,
    ...patch,
  };

  if (merged.undercoverCount < 1) {
    return {
      valid: false,
      error: { code: "INVALID_SETTINGS", message: "Undercover count must be at least 1" },
    };
  }

  if (merged.mrWhiteCount < 0) {
    return {
      valid: false,
      error: { code: "INVALID_SETTINGS", message: "Mr. White count cannot be negative" },
    };
  }

  if (merged.maxPlayers < MIN_PLAYERS || merged.maxPlayers > MAX_PLAYERS) {
    return {
      valid: false,
      error: {
        code: "INVALID_SETTINGS",
        message: `Max players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`,
      },
    };
  }

  const maxInfiltrators = Math.floor((merged.maxPlayers - 1) / 2);
  const totalInfiltrators = merged.undercoverCount + merged.mrWhiteCount;
  if (totalInfiltrators > maxInfiltrators) {
    return {
      valid: false,
      error: {
        code: "INVALID_SETTINGS",
        message: `Total infiltrators (${totalInfiltrators}) exceeds maximum allowed (${maxInfiltrators}) for ${merged.maxPlayers} players`,
      },
    };
  }

  if (merged.discussionSeconds < 10 || merged.discussionSeconds > 600) {
    return {
      valid: false,
      error: {
        code: "INVALID_SETTINGS",
        message: "Discussion seconds must be between 10 and 600",
      },
    };
  }

  if (merged.votingSeconds < 10 || merged.votingSeconds > 300) {
    return {
      valid: false,
      error: {
        code: "INVALID_SETTINGS",
        message: "Voting seconds must be between 10 and 300",
      },
    };
  }

  if (merged.mrWhiteGuessSeconds < 10 || merged.mrWhiteGuessSeconds > 120) {
    return {
      valid: false,
      error: {
        code: "INVALID_SETTINGS",
        message: "Mr. White guess seconds must be between 10 and 120",
      },
    };
  }

  return { valid: true, settings: merged };
}
