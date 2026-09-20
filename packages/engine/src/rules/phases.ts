import type { Room } from "@game/types";
import type { Action, EngineContext, ReduceResult } from "../types";
import { LOBBY_DISCONNECT_GRACE_SECONDS } from "../constants";
import { checkHostMigration } from "./presence";
import { closeVotingAndEliminate } from "./elimination";
import { checkWinCondition } from "./win";

export function handleTick(
  room: Room,
  action: Extract<Action, { type: "tick" }>,
  ctx: EngineContext
): ReduceResult {
  const now = action.now ?? ctx.now;

  // 1. Host migration check (runs even while paused per amendment 5)
  let currentRoom = checkHostMigration(room, now);

  // 2. Lobby disconnect grace: remove away players who disconnected >= 15s ago
  if (currentRoom.phase === "LOBBY") {
    const activeDeadline = LOBBY_DISCONNECT_GRACE_SECONDS * 1000;
    const remainingPlayers = currentRoom.players.filter(
      (p) =>
        !(
          p.presence === "away" &&
          typeof p.disconnectedAt === "number" &&
          now >= p.disconnectedAt + activeDeadline
        )
    );
    currentRoom = {
      ...currentRoom,
      players: remainingPlayers,
    };
  }

  // 3. If paused, phase deadlines are frozen
  if (currentRoom.paused !== null) {
    return { state: currentRoom };
  }

  // 4. Phase transitions on timer expiry
  if (currentRoom.endsAt !== null && now >= currentRoom.endsAt) {
    if (currentRoom.phase === "ROLE_REVEAL") {
      return {
        state: {
          ...currentRoom,
          phase: "DISCUSSION",
          endsAt: now + currentRoom.settings.discussionSeconds * 1000,
        },
      };
    }

    if (currentRoom.phase === "DISCUSSION") {
      return {
        state: {
          ...currentRoom,
          phase: "VOTING",
          endsAt: now + currentRoom.settings.votingSeconds * 1000,
          game: currentRoom.game ? { ...currentRoom.game, votes: {} } : undefined,
        },
      };
    }

    if (currentRoom.phase === "VOTING") {
      return {
        state: closeVotingAndEliminate(currentRoom, now),
      };
    }

    if (currentRoom.phase === "ELIMINATION") {
      const mrWhiteVotedOut = currentRoom.game?.lastElimination?.eliminations.some(
        (e) => e.reason === "VOTED" && e.role === "MR_WHITE"
      );

      if (mrWhiteVotedOut) {
        return {
          state: {
            ...currentRoom,
            phase: "MRWHITE_GUESS",
            endsAt: now + currentRoom.settings.mrWhiteGuessSeconds * 1000,
          },
        };
      }

      // Step 6: Win check runs after round eliminations (Spec §3.6)
      const win = checkWinCondition(currentRoom);
      if (win) {
        return {
          state: {
            ...currentRoom,
            phase: "GAME_OVER",
            endsAt: null,
            paused: null,
          },
        };
      }

      return {
        state: {
          ...currentRoom,
          round: currentRoom.round + 1,
          phase: "DISCUSSION",
          endsAt: now + currentRoom.settings.discussionSeconds * 1000,
          game: currentRoom.game ? { ...currentRoom.game, votes: {} } : undefined,
        },
      };
    }
  }

  return { state: currentRoom };
}

export function handlePause(
  room: Room,
  action: Extract<Action, { type: "host.pause" }>,
  ctx: EngineContext
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can pause" },
    };
  }

  const pausablePhases = ["DISCUSSION", "VOTING", "MRWHITE_GUESS"];
  if (!pausablePhases.includes(room.phase)) {
    return {
      state: room,
      error: {
        code: "INVALID_PHASE",
        message: `Cannot pause during ${room.phase}`,
      },
    };
  }

  if (room.paused !== null) {
    return {
      state: room,
      error: { code: "ALREADY_PAUSED", message: "Game is already paused" },
    };
  }

  const remainingMs = Math.max(0, (room.endsAt ?? ctx.now) - ctx.now);

  return {
    state: {
      ...room,
      paused: { remainingMs },
      endsAt: null,
    },
  };
}

export function handleResume(
  room: Room,
  action: Extract<Action, { type: "host.resume" }>,
  ctx: EngineContext
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can resume" },
    };
  }

  if (room.paused === null) {
    return {
      state: room,
      error: { code: "NOT_PAUSED", message: "Game is not paused" },
    };
  }

  return {
    state: {
      ...room,
      endsAt: ctx.now + room.paused.remainingMs,
      paused: null,
    },
  };
}

export function handleSkip(
  room: Room,
  action: Extract<Action, { type: "host.skip" }>,
  ctx: EngineContext
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can skip" },
    };
  }

  if (room.phase === "ROLE_REVEAL") {
    return {
      state: {
        ...room,
        phase: "DISCUSSION",
        paused: null,
        endsAt: ctx.now + room.settings.discussionSeconds * 1000,
      },
    };
  }

  if (room.phase === "DISCUSSION") {
    return {
      state: {
        ...room,
        phase: "VOTING",
        paused: null,
        endsAt: ctx.now + room.settings.votingSeconds * 1000,
        game: room.game ? { ...room.game, votes: {} } : undefined,
      },
    };
  }

  return {
    state: room,
    error: {
      code: "INVALID_PHASE",
      message: `Cannot skip during ${room.phase}`,
    },
  };
}

export function handleEndGame(
  room: Room,
  action: Extract<Action, { type: "host.endGame" }>,
  _ctx: EngineContext
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can end game" },
    };
  }

  if (room.phase === "LOBBY") {
    return {
      state: room,
      error: { code: "INVALID_PHASE", message: "Game is already in lobby" },
    };
  }

  const resetPlayers = room.players.map((p) => ({
    ...p,
    status: p.status === "pending" ? ("pending" as const) : ("active" as const),
    role: undefined,
    word: undefined,
    eliminated: undefined,
  }));

  return {
    state: {
      ...room,
      phase: "LOBBY",
      endsAt: null,
      paused: null,
      game: undefined,
      players: resetPlayers,
    },
  };
}
