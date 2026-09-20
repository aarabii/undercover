import {
  Server,
  routePartykitRequest,
  type Connection,
  type ConnectionContext,
} from "partyserver";
import {
  ClientMessageSchema,
  type ClientMessage,
  type ServerMessage,
} from "@game/protocol";

export interface Env {
  Room: DurableObjectNamespace<Room>;
  ALLOWED_ORIGINS?: string;
  TURNSTILE_SECRET?: string;
  [key: string]: unknown;
}

export interface ConnectionState {
  playerId: string;
}

const MAX_MESSAGE_BYTES = 2048; // 2 KB size limit

export class Room extends Server<Env> {
  static options = {
    hibernate: true,
  };

  /**
   * Loaded once when the Durable Object wakes up.
   * TODO: [server-shell phase] Load persisted room snapshot from SQLite storage (`this.ctx.storage.sql`)
   */
  async onStart(): Promise<void> {
    // Stored room state will be loaded here in the server-shell phase.
  }

  /**
   * Alarm handler for phase transitions and disconnect timers.
   * TODO: [server-shell phase] Process earliest scheduled room timer without using setTimeout
   */
  async onAlarm(): Promise<void> {
    // Durable Object alarm timer processing will be implemented here.
  }

  onConnect(conn: Connection<ConnectionState>, ctx: ConnectionContext) {
    // Basic connection handling, waiting for "hello" message
  }

  onMessage(conn: Connection<ConnectionState>, message: string | ArrayBuffer) {
    // 1. Enforce strict 2 KB size limit before processing/parsing
    const byteLength =
      typeof message === "string"
        ? new TextEncoder().encode(message).byteLength
        : message.byteLength;

    if (byteLength > MAX_MESSAGE_BYTES) {
      conn.send(
        JSON.stringify({
          type: "error",
          payload: {
            code: "MESSAGE_TOO_LARGE",
            message: "Incoming message exceeds 2 KB limit",
          },
        } satisfies ServerMessage)
      );
      return;
    }

    if (typeof message !== "string") {
      conn.send(
        JSON.stringify({
          type: "error",
          payload: {
            code: "INVALID_FORMAT",
            message: "Binary messages are not supported",
          },
        } satisfies ServerMessage)
      );
      return;
    }

    // 2. Parse JSON
    let raw: unknown;
    try {
      raw = JSON.parse(message);
    } catch {
      conn.send(
        JSON.stringify({
          type: "error",
          payload: { code: "BAD_JSON", message: "Malformed JSON payload" },
        } satisfies ServerMessage)
      );
      return;
    }

    // 3. Validate with Zod schema BEFORE touching state
    const parsed = ClientMessageSchema.safeParse(raw);
    if (!parsed.success) {
      conn.send(
        JSON.stringify({
          type: "error",
          payload: {
            code: "INVALID_MESSAGE",
            message: "Message validation failed",
          },
        } satisfies ServerMessage)
      );
      return;
    }

    const clientMsg: ClientMessage = parsed.data;

    // 4. Connection state size limit: store ONLY the playerId
    if (clientMsg.type === "hello" && clientMsg.payload.playerId) {
      conn.setState({ playerId: clientMsg.payload.playerId });
    }

    // Action dispatch to engine reduce() will be connected in server-shell phase
  }

  onClose(conn: Connection<ConnectionState>) {
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
      (await routePartykitRequest(request, env, {
        onBeforeConnect(req) {
          const origin = req.headers.get("Origin");
          const allowedOrigins = (env.ALLOWED_ORIGINS || "")
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean);

          if (allowedOrigins.length > 0 && origin && !allowedOrigins.includes(origin)) {
            return new Response("Forbidden: Origin not allowed", {
              status: 403,
              headers: { "Content-Type": "text/plain" },
            });
          }
        },
      })) ||
      new Response("Undercover Game Server", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      })
    );
  },
};
