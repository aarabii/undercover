import { verifyTurnstile } from "../turnstile";
import { generateRoomCode } from "../utils";

export type Env = Cloudflare.Env & {
  RATE_LIMITER?: RateLimit;
  [key: string]: unknown;
};

/**
 * Returns standard CORS headers based on request Origin and env.ALLOWED_ORIGINS.
 */
export function getCorsHeaders(request: Request, allowedOriginsStr?: string): HeadersInit {
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

/**
 * Handles POST /rooms (Create room with Turnstile verification & rate limiting).
 */
export async function handleCreateRoom(
  request: Request,
  env: Env,
  corsHeaders: HeadersInit
): Promise<Response> {
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

/**
 * Handles GET /rooms/:code (Pre-join room status check).
 */
export async function handleGetRoomStatus(
  request: Request,
  env: Env,
  corsHeaders: HeadersInit
): Promise<Response> {
  const url = new URL(request.url);
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
