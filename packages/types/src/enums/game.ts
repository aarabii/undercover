export const Winner = {
  CIVILIANS: "CIVILIANS",
  INFILTRATORS: "INFILTRATORS",
} as const;

export type Winner = (typeof Winner)[keyof typeof Winner];

export const Difficulty = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
  MIXED: "mixed",
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export type ConnectionStatus =
  "disconnected" | "connecting" | "connected" | "error";
