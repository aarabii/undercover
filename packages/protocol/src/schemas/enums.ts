import { z } from "zod";

export const PhaseSchema = z.enum([
  "LOBBY",
  "ROLE_REVEAL",
  "DISCUSSION",
  "VOTING",
  "ELIMINATION",
  "MRWHITE_GUESS",
  "GAME_OVER",
]);

export const RoleSchema = z.enum(["CIVILIAN", "UNDERCOVER", "MR_WHITE"]);
export const PlayerStatusSchema = z.enum(["pending", "waiting", "active", "eliminated"]);
export const PresenceSchema = z.enum(["online", "away"]);
export const ElimReasonSchema = z.enum(["VOTED", "DISCONNECTED", "LEFT", "KICKED"]);
export const WinnerSchema = z.enum(["CIVILIANS", "INFILTRATORS"]);
export const WinReasonSchema = z.enum([
  "ALL_INFILTRATORS_ELIMINATED",
  "INFILTRATORS_EQUAL_OR_GREATER",
  "MR_WHITE_GUESSED",
]);
export const CardVariantSchema = z.enum([
  "MR_WHITE",
  "CIVILIAN",
  "UNDERCOVER",
  "WORD_ONLY",
]);
export const DifficultySchema = z.enum(["easy", "medium", "hard", "mixed"]);
