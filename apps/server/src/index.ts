import { routePartykitRequest } from "partyserver";
import { Room, type Env, type ConnectionState } from "./room/room-server";
import {
  getCorsHeaders,
  handleCreateRoom,
  handleGetRoomStatus,
} from "./routes/rooms";

export { Room, type Env, type ConnectionState };

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
      return handleCreateRoom(request, env, corsHeaders);
    }

    // 3. REST: GET /rooms/:code (Pre-join room status check)
    if (url.pathname.startsWith("/rooms/") && request.method === "GET") {
      return handleGetRoomStatus(request, env, corsHeaders);
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
