import type { RoomView } from "../views/room-view";

export const ServerMessageType = {
  STATE: "state",
  ERROR: "error",
  DECLINED: "declined",
  KICKED: "kicked",
  REPLACED: "replaced",
  ROOM_CLOSED: "roomClosed",
  HEARTBEAT_ACK: "heartbeat_ack",
} as const;

export type ServerMessageType =
  (typeof ServerMessageType)[keyof typeof ServerMessageType];

export interface StatePayload {
  view: RoomView;
  token?: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface DeclinedPayload {
  reason?: string;
}

export type ServerMessage =
  | { type: "state"; payload: StatePayload }
  | { type: "error"; payload: ErrorPayload }
  | { type: "declined"; payload?: DeclinedPayload }
  | { type: "kicked" }
  | { type: "replaced" }
  | { type: "roomClosed" }
  | { type: "heartbeat_ack" };
