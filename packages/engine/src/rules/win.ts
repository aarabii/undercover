import type { Room, Winner, WinReason, Role, GameOverSummary } from "@game/types";
import type { Action, EngineContext, ReduceResult } from "../types";

export type WinCheckResult =
  | { type: "win"; winner: Winner; reason: WinReason }
  | { type: "abort" }
  | null;

export function checkWinCondition(room: Room): WinCheckResult {
  const aliveCivilians = room.players.filter(
    (p) => p.status === "active" && p.role === "CIVILIAN"
  ).length;

  const aliveInfiltrators = room.players.filter(
    (p) =>
      p.status === "active" &&
      (p.role === "UNDERCOVER" || p.role === "MR_WHITE")
  ).length;

  // 0. If nobody is left alive: abort game -> back to lobby (no winner) (Spec §3.4)
  if (aliveCivilians === 0 && aliveInfiltrators === 0) {
    return { type: "abort" };
  }

  // 1. All infiltrators eliminated -> Civilians win (Spec §3.4)
  if (aliveInfiltrators === 0) {
    return {
      type: "win",
      winner: "CIVILIANS",
      reason: "ALL_INFILTRATORS_ELIMINATED",
    };
  }

  // 2. Infiltrators >= Civilians -> Infiltrators win (Spec §3.4)
  if (aliveInfiltrators >= aliveCivilians) {
    return {
      type: "win",
      winner: "INFILTRATORS",
      reason: "INFILTRATORS_EQUAL_OR_GREATER",
    };
  }

  // 3. Civilians > Infiltrators > 0 -> Game continues
  return null;
}

export function createGameOverSummary(
  room: Room,
  win: { winner: Winner; reason: WinReason }
): GameOverSummary {
  const playerRoles: Record<string, { role: Role; word: string | null }> = {};
  for (const p of room.players) {
    if (p.role) {
      playerRoles[p.id] = {
        role: p.role,
        word: p.word ?? null,
      };
    }
  }

  return {
    winner: win.winner,
    reason: win.reason,
    civilianWord: room.game?.civilianWord ?? "",
    undercoverWord: room.game?.undercoverWord ?? "",
    playerRoles,
  };
}

export function abortGameToLobby(room: Room): Room {
  return {
    ...room,
    phase: "LOBBY",
    round: 0,
    endsAt: null,
    paused: null,
    game: undefined,
    players: room.players.map((p) => {
      // Pending players remain pending
      if (p.status === "pending") {
        return {
          ...p,
          role: undefined,
          word: undefined,
        };
      }
      return {
        ...p,
        status: p.presence === "online" ? "active" : "away",
        role: undefined,
        word: undefined,
      };
    }),
  };
}

export function handlePlayAgain(
  room: Room,
  action: Extract<Action, { type: "host.playAgain" }>,
  ctx: EngineContext
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can restart the game" },
    };
  }

  if (room.phase !== "GAME_OVER") {
    return {
      state: room,
      error: {
        code: "INVALID_PHASE",
        message: `Cannot play again from ${room.phase}, must be GAME_OVER`,
      },
    };
  }

  return {
    state: abortGameToLobby(room),
  };
}
