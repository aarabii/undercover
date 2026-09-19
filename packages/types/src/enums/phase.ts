export const Phase = {
  LOBBY: "LOBBY",
  ROLE_REVEAL: "ROLE_REVEAL",
  DISCUSSION: "DISCUSSION",
  VOTING: "VOTING",
  ELIMINATION: "ELIMINATION",
  MRWHITE_GUESS: "MRWHITE_GUESS",
  GAME_OVER: "GAME_OVER",
} as const;

export type Phase = (typeof Phase)[keyof typeof Phase];
