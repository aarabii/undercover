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
  nextAlarm,
  type Room as RoomState,
  type EngineContext,
  type EngineEffect,
  type Action,
} from "@game/engine";
import { ServerWordBank } from "./words";
import { createMulberry32, generateSeed } from "./prng";
import { initDatabase, loadRoom, saveRoom } from "./storage";
import { generateRoomCode, generateShortId, hashToken } from "./utils";
import { verifyTurnstile } from "./turnstile";

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
export const IDLE_CLEANUP_MS = 30 * 60 * 1000; // 30 min per Spec §4.1
export const RESERVED_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 min per Spec §4.1

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
   * Sends personalized, sanitized RoomViews to all connected players.
   * Views differ per player and guarantee zero leakage of secret words or roles.
   */
  broadcastViews(freshTokenRecipient?: { playerId: string; token: string }): void {
    if (!this.roomState) return;
    const now = Date.now();
    for (const conn of this.getConnections()) {
      const pid = conn.state?.playerId;
      if (!pid) continue;
      const view = viewFor(this.roomState, pid, now);
      const token =
        freshTokenRecipient && freshTokenRecipient.playerId === pid
          ? freshTokenRecipient.token
          : undefined;
      const msg: ServerMessage = {
        type: "state",
        payload: {
          view,
          token,
        },
      };
      conn.send(JSON.stringify(msg));
    }
  }

  /**
   * Executes engine effects (send, close).
   */
  executeEffects(effects?: EngineEffect[], excludeConnId?: string): void {
    if (!effects || effects.length === 0) return;
    for (const effect of effects) {
      if (effect.type === "send") {
        for (const conn of this.getConnections()) {
          if (conn.state?.playerId === effect.to && conn.id !== excludeConnId) {
            conn.send(JSON.stringify(effect.message));
          }
        }
      } else if (effect.type === "close") {
        for (const conn of this.getConnections()) {
          if (conn.state?.playerId === effect.playerId && conn.id !== excludeConnId) {
            conn.close(1000, effect.reason ?? "closed");
          }
        }
      }
    }
  }

  /**
   * Sets or updates the Durable Object alarm to the earliest scheduled deadline.
   */
  async updateAlarm(alarmAt?: number | null): Promise<void> {
    if (typeof alarmAt === "number") {
      await this.ctx.storage.setAlarm(alarmAt);
    } else if (alarmAt === null) {
      // Check if idle cleanup alarm is needed
      const hasConnections = Array.from(this.getConnections()).length > 0;
      if (!hasConnections && this.roomState) {
        const idleAt = Date.now() + IDLE_CLEANUP_MS;
        await this.ctx.storage.setAlarm(idleAt);
      } else if (this.reservedUntil && !this.roomState) {
        await this.ctx.storage.setAlarm(this.reservedUntil);
      } else {
        await this.ctx.storage.deleteAlarm();
      }
    }
  }

  /**
   * Alarm handler for phase transitions, disconnect timers, and cleanup.
   */
  async onAlarm(): Promise<void> {
    const now = Date.now();

    // 1. Reserved code expiry (host never connected within 10 min)
    if (!this.roomState && this.reservedUntil && now >= this.reservedUntil) {
      await this.ctx.storage.deleteAll();
      await this.ctx.storage.deleteAlarm();
      this.reservedUntil = undefined;
      return;
    }

    // 2. Idle room cleanup: 30 minutes after last connection closed
    const activeConnections = Array.from(this.getConnections());
    if (activeConnections.length === 0 && this.roomState) {
      const lastSeen = Math.max(...this.roomState.players.map((p) => p.lastSeenAt), this.roomState.createdAt);
      if (now >= lastSeen + IDLE_CLEANUP_MS) {
        await this.ctx.storage.deleteAll();
        await this.ctx.storage.deleteAlarm();
        this.roomState = null;
        return;
      }
    }

    // 3. Process engine tick for phase changes and disconnect grace
    if (!this.roomState) return;

    const ctx = this.getEngineContext();
    const result = reduce(this.roomState, { type: "tick", now }, ctx);

    this.roomState = result.state;
    this.persistState();
    await this.updateAlarm(result.alarmAt);
    this.executeEffects(result.effects);
    this.broadcastViews();
  }

  onConnect(_conn: Connection<ConnectionState>, _ctx: ConnectionContext) {
    // Protocol requires 'hello' carrying credentials before joining room
  }

  async onMessage(conn: Connection<ConnectionState>, message: string | ArrayBuffer): Promise<void> {
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

    // 4. Handle 'hello' message (room join / reconnect)
    if (clientMsg.type === "hello") {
      const { playerId, token, profile } = clientMsg.payload;

      let rawToken = token;
      let isFirstJoin = false;
      if (!rawToken) {
        rawToken = crypto.randomUUID();
        isFirstJoin = true;
      }
      const tokenHash = await hashToken(rawToken);

      // First player connecting initializes the room as host
      if (!this.roomState) {
        const hostId = playerId || generateShortId([]);
        const ctx = this.getEngineContext();
        const result = reduce(
          null as any,
          {
            type: "createRoom",
            payload: {
              code: this.name,
              hostId,
              hostTokenHash: tokenHash,
              hostProfile: profile,
              createdAt: ctx.now,
            },
          },
          ctx
        );

        this.roomState = result.state;
        this.reservedUntil = undefined;
        this.persistState();
        conn.setState({ playerId: hostId });
        await this.updateAlarm(result.alarmAt);
        this.broadcastViews(isFirstJoin ? { playerId: hostId, token: rawToken } : undefined);
        return;
      }

      // Existing room: dispatch hello to engine
      const ctx = this.getEngineContext();
      const existingPlayer = this.roomState.players.find(
        (p) =>
          (playerId && p.id === playerId && p.tokenHash === tokenHash) ||
          (!playerId && p.tokenHash === tokenHash)
      );

      const result = reduce(
        this.roomState,
        {
          type: "hello",
          playerId,
          tokenHash,
          payload: clientMsg.payload,
        },
        ctx
      );

      if (result.error) {
        conn.send(
          JSON.stringify({
            type: "error",
            payload: result.error,
          } satisfies ServerMessage)
        );
        this.executeEffects(result.effects, conn.id);
        return;
      }

      const joinedPlayer = result.state.players.find((p) => p.tokenHash === tokenHash);
      if (!existingPlayer && joinedPlayer) {
        isFirstJoin = true;
      }

      this.roomState = result.state;
      this.persistState();

      if (joinedPlayer) {
        conn.setState({ playerId: joinedPlayer.id });
      }

      await this.updateAlarm(result.alarmAt);
      // Close replaced previous connection if second tab connected
      this.executeEffects(result.effects, conn.id);

      this.broadcastViews(
        isFirstJoin && joinedPlayer ? { playerId: joinedPlayer.id, token: rawToken } : undefined
      );
      return;
    }

    // 5. All other actions require authenticated connection (with playerId)
    const senderPlayerId = conn.state?.playerId;
    if (!senderPlayerId) {
      conn.send(
        JSON.stringify({
          type: "error",
          payload: {
            code: "UNAUTHENTICATED",
            message: "Must send hello before executing actions",
          },
        } satisfies ServerMessage)
      );
      return;
    }

    if (!this.roomState) {
      conn.send(
        JSON.stringify({
          type: "error",
          payload: {
            code: "ROOM_NOT_FOUND",
            message: "Room not initialized",
          },
        } satisfies ServerMessage)
      );
      return;
    }

    // 6. Route action to engine with sender playerId injected
    let action: Action;
    if (clientMsg.type === "leave") {
      action = { type: "leave", playerId: senderPlayerId };
    } else {
      action = {
        ...clientMsg,
        playerId: senderPlayerId,
      } as Action;
    }

    const ctx = this.getEngineContext();
    const result = reduce(this.roomState, action, ctx);

    if (result.error) {
      conn.send(
        JSON.stringify({
          type: "error",
          payload: result.error,
        } satisfies ServerMessage)
      );
      this.executeEffects(result.effects);
      return;
    }

    this.roomState = result.state;
    this.persistState();
    await this.updateAlarm(result.alarmAt);
    this.executeEffects(result.effects);
    this.broadcastViews();
  }

  async onClose(conn: Connection<ConnectionState>): Promise<void> {
    const playerId = conn.state?.playerId;
    if (playerId && this.roomState) {
      // Check if player still has another active connection open (multi-tab)
      const otherConn = Array.from(this.getConnections()).find(
        (c) => c.id !== conn.id && c.state?.playerId === playerId
      );

      if (!otherConn) {
        const ctx = this.getEngineContext();
        const result = reduce(this.roomState, { type: "disconnect", playerId }, ctx);
        this.roomState = result.state;
        this.persistState();
        await this.updateAlarm(result.alarmAt);
        this.executeEffects(result.effects);
        this.broadcastViews();
      }
    }

    // Check if room is now empty of all connections
    const remaining = Array.from(this.getConnections()).filter((c) => c.id !== conn.id);
    if (remaining.length === 0) {
      const idleAt = Date.now() + IDLE_CLEANUP_MS;
      const next = this.roomState ? nextAlarm(this.roomState) : null;
      const earliest = next !== null ? Math.min(next, idleAt) : idleAt;
      await this.ctx.storage.setAlarm(earliest);
    }
  }

  /**
   * Internal HTTP router for reservation and status queries.
   */
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/reserve" && request.method === "POST") {
      this.reservedUntil = Date.now() + RESERVED_CODE_EXPIRY_MS;
      this.persistState();
      const currentAlarm = await this.ctx.storage.getAlarm();
      if (!currentAlarm || this.reservedUntil < currentAlarm) {
        await this.ctx.storage.setAlarm(this.reservedUntil);
      }
      return new Response(JSON.stringify({ reserved: true, code: this.name }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/status" && request.method === "GET") {
      const isReserved = this.reservedUntil && Date.now() < this.reservedUntil;
      if (!this.roomState && !isReserved) {
        return new Response(
          JSON.stringify({
            exists: false,
            locked: false,
            full: false,
            inGame: false,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!this.roomState && isReserved) {
        return new Response(
          JSON.stringify({
            exists: true,
            locked: false,
            full: false,
            inGame: false,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const admittedCount = this.roomState!.players.filter((p) => p.status !== "pending").length;
      return new Response(
        JSON.stringify({
          exists: true,
          locked: this.roomState!.locked,
          full: admittedCount >= this.roomState!.settings.maxPlayers,
          inGame: this.roomState!.phase !== "LOBBY",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response("Not Found", { status: 404 });
  }
}

/**
 * Returns standard CORS headers based on request Origin and env.ALLOWED_ORIGINS.
 */
function getCorsHeaders(request: Request, allowedOriginsStr?: string): HeadersInit {
  const origin = request.headers.get("Origin");
  const allowed = (allowedOriginsStr || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const matchedOrigin =
    origin && (allowed.length === 0 || allowed.includes(origin)) ? origin : "*";

  return {
    "Access-Control-Allow-Origin": matchedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(request, env.ALLOWED_ORIGINS);

    // 1. CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }

    // 2. REST: POST /rooms (Create room with Turnstile verification & rate limiting)
    if (url.pathname === "/rooms" && request.method === "POST") {
      const clientIp = request.headers.get("CF-Connecting-IP") || "127.0.0.1";

      // Rate limit check
      if (env.RATE_LIMITER) {
        const { success } = await env.RATE_LIMITER.limit({ key: clientIp });
        if (!success) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded" }),
            {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Turnstile verification (if secret configured)
      if (env.TURNSTILE_SECRET) {
        let token: string | undefined;
        try {
          const body = (await request.json()) as { turnstileToken?: string };
          token = body.turnstileToken;
        } catch {
          // No body or invalid JSON
        }

        if (!token) {
          return new Response(
            JSON.stringify({ error: "Missing Turnstile token" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const valid = await verifyTurnstile(token, env.TURNSTILE_SECRET, clientIp);
        if (!valid) {
          return new Response(
            JSON.stringify({ error: "Turnstile verification failed" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Generate 6-character room code and reserve it
      const code = generateRoomCode();
      const id = env.Room.idFromName(code);
      const stub = env.Room.get(id);
      await stub.fetch(new Request("http://internal/reserve", { method: "POST" }));

      return new Response(JSON.stringify({ code }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. REST: GET /rooms/:code (Pre-join room status check)
    if (url.pathname.startsWith("/rooms/") && request.method === "GET") {
      const code = url.pathname.slice("/rooms/".length).toUpperCase();
      if (!code || code.length !== 6) {
        return new Response(
          JSON.stringify({ error: "Invalid room code format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const id = env.Room.idFromName(code);
      const stub = env.Room.get(id);
      const statusRes = await stub.fetch(new Request("http://internal/status"));
      const data = await statusRes.text();

      return new Response(data, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. WebSocket Routing via PartyServer
    const partyResponse = await routePartykitRequest(request, env, {
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
    });

    if (partyResponse) {
      return partyResponse;
    }

    return new Response("Undercover Game Server", {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  },
};
