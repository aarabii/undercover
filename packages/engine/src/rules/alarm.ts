import type { Room } from "@game/types";
import { LOBBY_DISCONNECT_GRACE_SECONDS, HOST_DISCONNECT_GRACE_SECONDS } from "../constants";

export function nextAlarm(room: Room): number | null {
  const candidates: number[] = [];

  // 1. Current active phase timer (only if not paused and not in LOBBY or GAME_OVER)
  if (
    room.paused === null &&
    room.endsAt !== null &&
    room.phase !== "LOBBY" &&
    room.phase !== "GAME_OVER"
  ) {
    candidates.push(room.endsAt);
  }

  // 2. In LOBBY: 15s disconnect grace removal for away players
  if (room.phase === "LOBBY") {
    for (const player of room.players) {
      if (player.presence === "away" && typeof player.disconnectedAt === "number") {
        candidates.push(player.disconnectedAt + LOBBY_DISCONNECT_GRACE_SECONDS * 1000);
      }
    }
  }

  // 3. Host reassignment: if host is away, triggers after 15s (runs even while paused)
  const host = room.players.find((p) => p.id === room.hostId);
  if (host && host.presence === "away" && typeof host.disconnectedAt === "number") {
    candidates.push(host.disconnectedAt + HOST_DISCONNECT_GRACE_SECONDS * 1000);
  }

  if (candidates.length === 0) {
    return null;
  }

  return Math.min(...candidates);
}
