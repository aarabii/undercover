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
import {
  reduce,
  viewFor,
  createRoom,
  type Room as RoomState,
  type EngineContext,
  type ReduceResult,
  type Action,
} from "@game/engine";
import { ServerWordBank } from "./words";
import { createMulberry32, generateSeed } from "./prng";
import { initDatabase, loadRoom, saveRoom } from "./storage";
import { generateShortId, hashToken } from "./utils";

export interface Env {
  Room: DurableObjectNamespace<Room>;
  ALLOWED_ORIGINS?: string;
  TURNSTILE_SECRET?: string;
  RATE_LIMITER?: RateLimit;
  [key: string]: unknown;
}

export interface ConnectionState {
  playerId: string;
}

export const MAX_MESSAGE_BYTES = 2048; // 2 KB size limit per Spec §6.3

export class Room extends Server<Env> {
  static options = {
    hibernate: true,
  };

  roomState: RoomState | null = null;
  rngSeed: number = 0;
  rng: () => number = Math.random;
  wordBank: ServerWordBank = new ServerWordBank();
  reservedUntil?: number;

  /**
   * Loaded once when the Durable Object starts or wakes from hibernation.
   */
  async onStart(): Promise<void> {
    initDatabase(this.ctx.storage.sql);
    const persisted = loadRoom(this.ctx.storage.sql);
    if (persisted) {
      this.roomState = persisted.room;
      this.rngSeed = persisted.rngSeed;
      this.reservedUntil = persisted.reservedUntil;
      this.rng = createMulberry32(this.rngSeed);
    } else {
      this.rngSeed = generateSeed();
      this.rng = createMulberry32(this.rngSeed);
      this.roomState = null;
    }
  }

  /**
   * Creates an EngineContext instance injecting deterministic PRNG,
   * fresh timestamp, collision-free ID generator, and WordBank.
   */
  getEngineContext(): EngineContext {
    return {
      now: Date.now(),
      rng: this.rng,
      newId: () =>
        generateShortId(this.roomState?.players.map((p) => p.id) ?? []),
      words: this.wordBank,
    };
  }

  /**
   * Persists current room snapshot to SQLite storage.
   */
  persistState(): void {
    saveRoom(
      this.ctx.storage.sql,
      this.name,
      this.roomState,
      this.rngSeed,
      this.reservedUntil
    );
  }

  /**
   * Alarm handler for phase transitions and disconnect timers.
   */
  async onAlarm(): Promise<void> {
    // Phase 3 implementation
  }

  onConnect(conn: Connection<ConnectionState>, ctx: ConnectionContext) {
    // Phase 2 implementation
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
  }

  onClose(conn: Connection<ConnectionState>) {
    // Phase 2 disconnect handling
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

          if (
            allowedOrigins.length > 0 &&
            origin &&
            !allowedOrigins.includes(origin)
          ) {
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
