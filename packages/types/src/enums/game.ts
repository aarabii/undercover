export const Winner = {
  CIVILIANS: "CIVILIANS",
  INFILTRATORS: "INFILTRATORS",
} as const;

export type Winner = (typeof Winner)[keyof typeof Winner];

export const WinReason = {
  ALL_INFILTRATORS_ELIMINATED: "ALL_INFILTRATORS_ELIMINATED",
  INFILTRATORS_EQUAL_OR_GREATER: "INFILTRATORS_EQUAL_OR_GREATER",
  MR_WHITE_GUESSED: "MR_WHITE_GUESSED",
} as const;

export type WinReason = (typeof WinReason)[keyof typeof WinReason];

export const CardVariant = {
  MR_WHITE: "MR_WHITE",
  CIVILIAN: "CIVILIAN",
  UNDERCOVER: "UNDERCOVER",
  WORD_ONLY: "WORD_ONLY",
} as const;

export type CardVariant = (typeof CardVariant)[keyof typeof CardVariant];

export const Difficulty = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
  MIXED: "mixed",
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export type ConnectionStatus =
  "disconnected" | "connecting" | "connected" | "reconnecting" | "error";
