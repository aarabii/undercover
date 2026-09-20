import type { Room } from "@game/types";
import { HOST_DISCONNECT_GRACE_SECONDS } from "../constants";

export function checkHostMigration(room: Room, now: number): Room {
  const host = room.players.find((p) => p.id === room.hostId);
  if (!host || host.presence !== "away" || typeof host.disconnectedAt !== "number") {
    return room;
  }

  const deadline = host.disconnectedAt + HOST_DISCONNECT_GRACE_SECONDS * 1000;
  if (now >= deadline) {
    // Reassign host to earliest-joined connected admitted player (alive preferred)
    const eligible = room.players.filter(
      (p) => p.id !== host.id && p.presence === "online" && p.status !== "pending"
    );

    if (eligible.length === 0) {
      return room;
    }

    eligible.sort((a, b) => {
      const aAlive = a.status === "active" ? 1 : 0;
      const bAlive = b.status === "active" ? 1 : 0;
      if (aAlive !== bAlive) {
        return bAlive - aAlive; // Alive preferred
      }
      return a.joinedAt - b.joinedAt; // Earliest-joined first
    });

    return {
      ...room,
      hostId: eligible[0].id,
    };
  }

  return room;
}
