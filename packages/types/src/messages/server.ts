import type { RoomView } from "../views/room-view";

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
  | { type: "roomClosed" };
