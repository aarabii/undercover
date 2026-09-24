export function getApiBaseUrl(): string {
  const rawHost =
    (import.meta.env.PUBLIC_WS_HOST as string | undefined)?.trim() ||
    (typeof window !== "undefined" ? window.location.host : "localhost:8787");
  const cleanHost = rawHost.replace(/^(https?|wss?):\/\//, "").replace(/\/+$/, "");
  const isLocal =
    cleanHost.startsWith("localhost:") ||
    cleanHost.startsWith("127.0.0.1:") ||
    cleanHost.startsWith("192.168.") ||
    cleanHost.startsWith("10.");
  const protocol = isLocal ? "http" : "https";
  return `${protocol}://${cleanHost}`;
}

export interface RoomStatus {
  exists: boolean;
  locked?: boolean;
  full?: boolean;
  inGame?: boolean;
  error?: string;
}

export async function createRoom(turnstileToken?: string): Promise<{ code: string }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ turnstileToken: turnstileToken || "test-turnstile-token" }),
  });

  if (!res.ok) {
    let errMessage = "Failed to create room";
    try {
      const data = await res.json();
      if (data?.error) errMessage = data.error;
    } catch {
      // Ignore json parse error
    }
    throw new Error(errMessage);
  }

  const data = (await res.json()) as { code: string };
  return data;
}

export async function checkRoom(code: string): Promise<RoomStatus> {
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode.length !== 6) {
    return { exists: false, error: "Room code must be 6 characters" };
  }

  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/rooms/${cleanCode}`);
    if (!res.ok) {
      return { exists: false, error: "Failed to check room status" };
    }
    const data = (await res.json()) as RoomStatus;
    return data;
  } catch (err) {
    return { exists: false, error: "Network error checking room" };
  }
}
