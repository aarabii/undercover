import type { ServerMessage } from "../messages/server";

export type EngineEffect =
  | { type: "send"; to: string; message: ServerMessage }
  | { type: "close"; playerId: string; reason?: string };
