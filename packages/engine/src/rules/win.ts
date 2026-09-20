import type { Room, Winner, WinReason, Role, GameOverSummary } from "@game/types";

export interface WinResult {
  winner: Winner;
  reason: WinReason;
}

export function checkWinCondition(room: Room): WinResult | null {
  const aliveCivilians = room.players.filter(
    (p) => p.status === "active" && p.role === "CIVILIAN"
  ).length;

  const aliveInfiltrators = room.players.filter(
    (p) =>
      p.status === "active" &&
      (p.role === "UNDERCOVER" || p.role === "MR_WHITE")
  ).length;

  // 1. All infiltrators eliminated -> Civilians win
  if (aliveInfiltrators === 0) {
    return {
      winner: "CIVILIANS",
      reason: "ALL_INFILTRATORS_ELIMINATED",
    };
  }

  // 2. Infiltrators >= Civilians -> Infiltrators win
  if (aliveInfiltrators >= aliveCivilians) {
    return {
      winner: "INFILTRATORS",
      reason: "INFILTRATORS_EQUAL_OR_GREATER",
    };
  }

  // 3. Civilians > Infiltrators > 0 -> Game continues
  return null;
}

export function createGameOverSummary(room: Room, win: WinResult): GameOverSummary {
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
