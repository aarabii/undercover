import type { Room, Player } from "@game/types";
import type { Action, EngineContext, ReduceResult, EngineEffect } from "../types";
import { generateUniqueName } from "../state/sanitize";
import { validateSettingsPatch } from "./settings";
import {
  checkWinCondition,
  createGameOverSummary,
  abortGameToLobby,
} from "./win";
import { closeVotingAndEliminate } from "./elimination";

export function handleHello(
  room: Room,
  action: Extract<Action, { type: "hello" }>,
  ctx: EngineContext
): ReduceResult {
  if (room.bannedTokenHashes.includes(action.tokenHash)) {
    const targetId = action.playerId ?? "anon";
    return {
      state: room,
      error: { code: "BANNED", message: "You are banned from this room" },
      effects: [
        {
          type: "send",
          to: targetId,
          message: { type: "declined", payload: { reason: "Banned from room" } },
        },
        { type: "close", playerId: targetId, reason: "banned" },
      ],
    };
  }

  // Check for reconnecting player (by matching tokenHash, prioritizing matching playerId)
  const existingIndex = room.players.findIndex(
    (p) =>
      (action.playerId && p.id === action.playerId && p.tokenHash === action.tokenHash) ||
      (!action.playerId && p.tokenHash === action.tokenHash)
  );

  if (existingIndex !== -1) {
    const existing = room.players[existingIndex];
    const updatedPlayers = room.players.map((p, idx) =>
      idx === existingIndex
        ? {
            ...p,
            presence: "online" as const,
            lastSeenAt: ctx.now,
            disconnectedAt: undefined,
          }
        : p
    );

    const effects: EngineEffect[] = [];
    if (existing.presence === "online") {
      effects.push(
        { type: "send", to: existing.id, message: { type: "replaced" } },
        { type: "close", playerId: existing.id, reason: "replaced" }
      );
    }

    return {
      state: {
        ...room,
        players: updatedPlayers,
      },
      effects,
    };
  }

  // New player joining
  if (room.locked) {
    return {
      state: room,
      error: { code: "ROOM_LOCKED", message: "Room is locked" },
    };
  }

  const admittedCount = room.players.filter((p) => p.status !== "pending").length;
  if (admittedCount >= room.settings.maxPlayers) {
    return {
      state: room,
      error: { code: "ROOM_FULL", message: "Room is full" },
    };
  }

  const newPlayerId = ctx.newId();
  const existingNames = room.players.map((p) => p.name);
  const uniqueName = generateUniqueName(action.payload.profile.name, existingNames);

  let initialStatus: Player["status"] = "pending";
  if (!room.settings.requireApproval) {
    initialStatus = room.phase === "LOBBY" ? "active" : "waiting";
  }

  const newPlayer: Player = {
    id: newPlayerId,
    tokenHash: action.tokenHash,
    name: uniqueName,
    avatar: action.payload.profile.avatar,
    status: initialStatus,
    presence: "online",
    joinedAt: ctx.now,
    lastSeenAt: ctx.now,
  };

  return {
    state: {
      ...room,
      players: [...room.players, newPlayer],
    },
  };
}

export function handleApprove(
  room: Room,
  action: Extract<Action, { type: "host.approve" }>
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can approve players" },
    };
  }

  const target = room.players.find((p) => p.id === action.payload.playerId);
  if (!target || target.status !== "pending") {
    return {
      state: room,
      error: { code: "INVALID_TARGET", message: "Player is not pending approval" },
    };
  }

  const admittedCount = room.players.filter((p) => p.status !== "pending").length;
  if (admittedCount >= room.settings.maxPlayers) {
    return {
      state: room,
      error: { code: "ROOM_FULL", message: "Room is full" },
    };
  }

  const newStatus: Player["status"] = room.phase === "LOBBY" ? "active" : "waiting";
  const updatedPlayers = room.players.map((p) =>
    p.id === target.id ? { ...p, status: newStatus } : p
  );

  return {
    state: {
      ...room,
      players: updatedPlayers,
    },
  };
}

export function handleDecline(
  room: Room,
  action: Extract<Action, { type: "host.decline" }>
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can decline players" },
    };
  }

  const target = room.players.find((p) => p.id === action.payload.playerId);
  if (!target || target.status !== "pending") {
    return {
      state: room,
      error: { code: "INVALID_TARGET", message: "Player is not pending approval" },
    };
  }

  const updatedPlayers = room.players.filter((p) => p.id !== target.id);
  const effects: EngineEffect[] = [
    {
      type: "send",
      to: target.id,
      message: { type: "declined", payload: { reason: "Host declined request" } },
    },
    { type: "close", playerId: target.id, reason: "declined" },
  ];

  return {
    state: {
      ...room,
      players: updatedPlayers,
    },
    effects,
  };
}

export function handleKick(
  room: Room,
  action: Extract<Action, { type: "host.kick" }>,
  ctx: EngineContext
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can kick players" },
    };
  }

  if (action.payload.playerId === room.hostId) {
    return {
      state: room,
      error: { code: "INVALID_ACTION", message: "Host cannot kick self" },
    };
  }

  const target = room.players.find((p) => p.id === action.payload.playerId);
  if (!target) {
    return {
      state: room,
      error: { code: "INVALID_TARGET", message: "Player not found" },
    };
  }

  const bannedTokenHashes = [...room.bannedTokenHashes, target.tokenHash];
  let updatedPlayers: Player[];

  if (room.phase === "LOBBY") {
    updatedPlayers = room.players.filter((p) => p.id !== target.id);
  } else {
    updatedPlayers = room.players.map((p) =>
      p.id === target.id
        ? {
            ...p,
            status: "eliminated" as const,
            presence: "away" as const,
            disconnectedAt: ctx.now,
            eliminated: {
              reason: "KICKED" as const,
              round: room.round,
              role: p.role,
            },
          }
        : p
    );
  }

  const effects: EngineEffect[] = [
    { type: "send", to: target.id, message: { type: "kicked" } },
    { type: "close", playerId: target.id, reason: "kicked" },
  ];

  if (room.phase === "LOBBY") {
    return {
      state: {
        ...room,
        bannedTokenHashes,
        players: updatedPlayers,
      },
      effects,
    };
  }

  // In-game kick: void votes and run win check (Spec §10.2)
  const votes = { ...(room.game?.votes ?? {}) };
  delete votes[target.id];
  for (const [voter, tgt] of Object.entries(votes)) {
    if (tgt === target.id) {
      delete votes[voter];
    }
  }

  const roomAfterKick: Room = {
    ...room,
    bannedTokenHashes,
    players: updatedPlayers,
    game: room.game ? { ...room.game, votes } : undefined,
  };

  // Immediate win check (unless in MRWHITE_GUESS and kicked player is not the guessing Mr. White)
  const isGuessingMrWhite =
    roomAfterKick.phase === "MRWHITE_GUESS" &&
    roomAfterKick.game?.lastElimination?.eliminations.some(
      (e) => e.reason === "VOTED" && e.role === "MR_WHITE" && e.id === target.id
    );

  if (roomAfterKick.phase !== "MRWHITE_GUESS" || isGuessingMrWhite) {
    const win = checkWinCondition(roomAfterKick);
    if (win?.type === "win") {
      const gameOver = createGameOverSummary(roomAfterKick, win);
      return {
        state: {
          ...roomAfterKick,
          phase: "GAME_OVER",
          endsAt: null,
          paused: null,
          game: roomAfterKick.game ? { ...roomAfterKick.game, gameOver } : undefined,
        },
        effects,
      };
    }

    if (win?.type === "abort") {
      return {
        state: abortGameToLobby(roomAfterKick),
        effects,
      };
    }
  }

  if (roomAfterKick.phase === "VOTING") {
    const alivePlayers = roomAfterKick.players.filter((p) => p.status === "active");
    const allVoted =
      alivePlayers.every((p) => p.id in votes) &&
      !alivePlayers.some((p) => p.presence === "away");
    if (allVoted && alivePlayers.length > 0) {
      return {
        state: closeVotingAndEliminate(roomAfterKick, ctx.now),
        effects,
      };
    }
  }

  return {
    state: roomAfterKick,
    effects,
  };
}

export function handleLock(
  room: Room,
  action: Extract<Action, { type: "host.lock" }>
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can lock room" },
    };
  }

  return {
    state: {
      ...room,
      locked: action.payload.locked,
    },
  };
}

export function handleTransfer(
  room: Room,
  action: Extract<Action, { type: "host.transfer" }>
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can transfer host" },
    };
  }

  const target = room.players.find((p) => p.id === action.payload.playerId);
  if (!target || target.status === "pending" || target.presence !== "online") {
    return {
      state: room,
      error: { code: "INVALID_TARGET", message: "Target must be an admitted online player" },
    };
  }

  return {
    state: {
      ...room,
      hostId: target.id,
    },
  };
}

export function handleProfileUpdate(
  room: Room,
  action: Extract<Action, { type: "profile.update" }>
): ReduceResult {
  const target = room.players.find((p) => p.id === action.playerId);
  if (!target) {
    return {
      state: room,
      error: { code: "NOT_FOUND", message: "Player not found" },
    };
  }

  if (room.phase !== "LOBBY" && target.status !== "waiting" && target.status !== "pending") {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Cannot update profile during game" },
    };
  }

  let name = target.name;
  if (action.payload.name) {
    const otherNames = room.players.filter((p) => p.id !== target.id).map((p) => p.name);
    name = generateUniqueName(action.payload.name, otherNames);
  }

  const avatar = action.payload.avatar ?? target.avatar;
  const updatedPlayers = room.players.map((p) =>
    p.id === target.id ? { ...p, name, avatar } : p
  );

  return {
    state: {
      ...room,
      players: updatedPlayers,
    },
  };
}

export function handleSettingsUpdate(
  room: Room,
  action: Extract<Action, { type: "host.settings.update" }>
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can update settings" },
    };
  }

  if (room.phase !== "LOBBY") {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Settings can only be changed in lobby" },
    };
  }

  const validation = validateSettingsPatch(room.settings, action.payload);
  if (!validation.valid) {
    return {
      state: room,
      error: validation.error,
    };
  }

  return {
    state: {
      ...room,
      settings: validation.settings,
    },
  };
}
