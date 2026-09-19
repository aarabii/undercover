import { Server, routePartykitRequest, type Connection, type ConnectionContext } from "partyserver";
import { ClientMessageSchema, type ClientMessage, type ServerMessage } from "@game/protocol";
import { MIN_PLAYERS } from "@game/engine";
import { getWordPair } from "@game/words";

export interface Env {
  Room: DurableObjectNamespace<Room>;
  ALLOWED_ORIGINS?: string;
  TURNSTILE_SECRET?: string;
  [key: string]: unknown;
}

export class Room extends Server<Env> {
  static options = {
    hibernate: true,
  };

  onConnect(conn: Connection, ctx: ConnectionContext) {
    // Basic connection handling, waiting for "hello" message
  }

  onMessage(conn: Connection, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;

    try {
      const raw = JSON.parse(message);
      const parsed = ClientMessageSchema.safeParse(raw);
      if (!parsed.success) {
        conn.send(
          JSON.stringify({
            type: "error",
            payload: { code: "INVALID_MESSAGE", message: "Message validation failed" },
          } satisfies ServerMessage)
        );
        return;
      }

      // Action handling will dispatch to engine reduce()
    } catch {
      conn.send(
        JSON.stringify({
          type: "error",
          payload: { code: "BAD_JSON", message: "Malformed JSON payload" },
        } satisfies ServerMessage)
      );
    }
  }

  onClose(conn: Connection) {
    // Disconnect handling
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }

    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Undercover Game Server", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      })
    );
  },
};
