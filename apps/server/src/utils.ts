/**
 * Hashes a private reconnect token using SHA-256 to compare with stored tokenHash.
 */
export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 6-character room code alphabet.
 * Uppercase alphanumeric, excluding 0, O, 1, I per Spec §1 L3 & D1.
 */
const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateRoomCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_ALPHABET[bytes[i] % ROOM_CODE_ALPHABET.length];
  }
  return code;
}

/**
 * Generates an 8-character random ID for players or resources,
 * ensuring no collision with existing player IDs in the room.
 */
export function generateShortId(existingIds: Iterable<string>): string {
  const existingSet = existingIds instanceof Set ? existingIds : new Set(existingIds);
  const alphabet = "23456789abcdefghijkmnopqrstuvwxyz";
  let id = "";
  do {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    id = "";
    for (let i = 0; i < 8; i++) {
      id += alphabet[bytes[i] % alphabet.length];
    }
  } while (existingSet.has(id));
  return id;
}
