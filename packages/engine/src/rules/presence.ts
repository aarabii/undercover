import type { Room, Player, EngineEffect } from "@game/types";
import type { Action, EngineContext, ReduceResult } from "../types";
import { HOST_DISCONNECT_GRACE_SECONDS } from "../constants";
import {
  checkWinCondition,
  createGameOverSummary,
  abortGameToLobby,
} from "./win";
import { closeVotingAndEliminate } from "./elimination";

export function selectNewHost(room: Room, excludePlayerId?: string): string {
  const eligible = room.players.filter(
    (p) => p.id !== excludePlayerId && p.presence === "online" && p.status !== "pending"
  );

  if (eligible.length === 0) {
    return room.hostId === excludePlayerId ? "" : room.hostId;
  }

  eligible.sort((a, b) => {
    const aAlive = a.status === "active" ? 1 : 0;
    const bAlive = b.status === "active" ? 1 : 0;
    if (aAlive !== bAlive) {
      return bAlive - aAlive; // Alive preferred
    }
    return a.joinedAt - b.joinedAt; // Earliest-joined first
  });

  return eligible[0].id;
}

export function checkHostMigration(room: Room, now: number): Room {
  const host = room.players.find((p) => p.id === room.hostId);
  if (!host || host.presence !== "away" || typeof host.disconnectedAt !== "number") {
    return room;
  }

  const deadline = host.disconnectedAt + HOST_DISCONNECT_GRACE_SECONDS * 1000;
  if (now >= deadline) {
    const newHostId = selectNewHost(room, host.id);
    if (newHostId && newHostId !== room.hostId) {
      return {
        ...room,
        hostId: newHostId,
      };
    }
  }

  return room;
}

export function handleConnect(
  room: Room,
  action: Extract<Action, { type: "connect" }>,
  ctx: EngineContext
): ReduceResult {
  const player = room.players.find((p) => p.id === action.playerId);
  if (!player) {
    return {
      state: room,
      error: { code: "PLAYER_NOT_FOUND", message: "Player not found" },
    };
  }

  if (player.presence === "online") {
    return { state: room };
  }

  const updatedPlayers = room.players.map((p) => {
    if (p.id !== action.playerId) return p;
    return {
      ...p,
      presence: "online" as const,
      lastSeenAt: ctx.now,
      disconnectedAt: undefined,
    };
  });

  return {
    state: {
      ...room,
      players: updatedPlayers,
    },
  };
}

export function handleDisconnect(
  room: Room,
  action: Extract<Action, { type: "disconnect" }>,
  ctx: EngineContext
): ReduceResult {
  const player = room.players.find((p) => p.id === action.playerId);
  if (!player) {
    return {
      state: room,
      error: { code: "PLAYER_NOT_FOUND", message: "Player not found" },
    };
  }

  if (player.presence === "away") {
    return { state: room };
  }

  const updatedPlayers = room.players.map((p) => {
    if (p.id !== action.playerId) return p;
    return {
      ...p,
      presence: "away" as const,
      disconnectedAt: ctx.now,
    };
  });

  return {
    state: {
      ...room,
      players: updatedPlayers,
    },
  };
}

export function handleLeave(
  room: Room,
  action: Extract<Action, { type: "leave" }>,
  ctx: EngineContext
): ReduceResult {
  const player = room.players.find((p) => p.id === action.playerId);
  if (!player) {
    return {
      state: room,
      error: { code: "PLAYER_NOT_FOUND", message: "Player not found" },
    };
  }

  const effects: EngineEffect[] = [
    { type: "close", playerId: action.playerId, reason: "left" },
  ];

  if (room.phase === "LOBBY" || room.phase === "GAME_OVER") {
    const remainingPlayers = room.players.filter((p) => p.id !== action.playerId);
    let hostId = room.hostId;
    if (action.playerId === room.hostId) {
      hostId = selectNewHost({ ...room, players: remainingPlayers }, action.playerId);
    }
    return {
      state: {
        ...room,
        hostId,
        players: remainingPlayers,
      },
      effects,
    };
  }

  // In-game phase: eliminated immediately (LEFT) -> win check (Spec §10.2)
  let hostId = room.hostId;
  if (action.playerId === room.hostId) {
    hostId = selectNewHost(room, action.playerId);
  }

  const updatedPlayers = room.players.map((p) => {
    if (p.id !== action.playerId) return p;
    return {
      ...p,
      status: "eliminated" as const,
      presence: "away" as const,
      disconnectedAt: ctx.now,
      eliminated: {
        reason: "LEFT" as const,
        round: room.round,
        role: p.role,
      },
    };
  });

  // Void votes cast by leaving player and votes cast for leaving player
  const votes = { ...(room.game?.votes ?? {}) };
  delete votes[action.playerId];
  for (const [voter, target] of Object.entries(votes)) {
    if (target === action.playerId) {
      delete votes[voter];
    }
  }

  const roomAfterLeave: Room = {
    ...room,
    hostId,
    players: updatedPlayers,
    game: room.game ? { ...room.game, votes } : undefined,
  };

  // Immediate win check (unless in MRWHITE_GUESS and leaver is not the guessing Mr. White)
  const isGuessingMrWhite =
    roomAfterLeave.phase === "MRWHITE_GUESS" &&
    roomAfterLeave.game?.lastElimination?.eliminations.some(
      (e) => e.reason === "VOTED" && e.role === "MR_WHITE" && e.id === action.playerId
    );

  if (roomAfterLeave.phase !== "MRWHITE_GUESS" || isGuessingMrWhite) {
    const win = checkWinCondition(roomAfterLeave);
    if (win?.type === "win") {
      const gameOver = createGameOverSummary(roomAfterLeave, win);
      return {
        state: {
          ...roomAfterLeave,
          phase: "GAME_OVER",
          endsAt: null,
          paused: null,
          game: roomAfterLeave.game
            ? { ...roomAfterLeave.game, gameOver }
            : undefined,
        },
        effects,
      };
    }

    if (win?.type === "abort") {
      return {
        state: abortGameToLobby(roomAfterLeave),
        effects,
      };
    }
  }

  // If in VOTING phase, check if all alive online players have now voted
  if (roomAfterLeave.phase === "VOTING") {
    const alivePlayers = roomAfterLeave.players.filter((p) => p.status === "active");
    const allVoted =
      alivePlayers.every((p) => p.id in votes) &&
      !alivePlayers.some((p) => p.presence === "away");
    if (allVoted && alivePlayers.length > 0) {
      return {
        state: closeVotingAndEliminate(roomAfterLeave, ctx.now),
        effects,
      };
    }
  }

  return {
    state: roomAfterLeave,
    effects,
  };
}
