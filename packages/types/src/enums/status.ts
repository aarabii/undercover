export const PlayerStatus = {
  PENDING: "pending",
  WAITING: "waiting",
  ACTIVE: "active",
  ELIMINATED: "eliminated",
} as const;

export type PlayerStatus = (typeof PlayerStatus)[keyof typeof PlayerStatus];

export const Presence = {
  ONLINE: "online",
  AWAY: "away",
} as const;

export type Presence = (typeof Presence)[keyof typeof Presence];

export const ElimReason = {
  VOTED: "VOTED",
  DISCONNECTED: "DISCONNECTED",
  LEFT: "LEFT",
  KICKED: "KICKED",
} as const;

export type ElimReason = (typeof ElimReason)[keyof typeof ElimReason];
