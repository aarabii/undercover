export const Role = {
  CIVILIAN: "CIVILIAN",
  UNDERCOVER: "UNDERCOVER",
  MR_WHITE: "MR_WHITE",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
