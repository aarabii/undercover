import type { Room } from "@game/types";
import type { Action, EngineContext, ReduceResult } from "../types";
import { closeVotingAndEliminate } from "./elimination";

export function handleVoteCast(
  room: Room,
  action: Extract<Action, { type: "vote.cast" }>,
  ctx: EngineContext
): ReduceResult {
  if (room.phase !== "VOTING") {
    return {
      state: room,
      error: { code: "INVALID_PHASE", message: "Voting is only allowed during VOTING phase" },
    };
  }

  if (room.paused !== null) {
    return {
      state: room,
      error: { code: "PAUSED", message: "Cannot vote while paused" },
    };
  }

  const voter = room.players.find((p) => p.id === action.playerId);
  if (!voter || voter.status !== "active") {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only alive active players can vote" },
    };
  }

  if (action.payload.targetId === action.playerId) {
    return {
      state: room,
      error: { code: "INVALID_TARGET", message: "Cannot vote for yourself" },
    };
  }

  const target = room.players.find((p) => p.id === action.payload.targetId);
  if (!target || target.status !== "active") {
    return {
      state: room,
      error: { code: "INVALID_TARGET", message: "Can only vote for an alive active player" },
    };
  }

  const votes = {
    ...(room.game?.votes ?? {}),
    [action.playerId]: action.payload.targetId,
  };

  const nextRoom: Room = {
    ...room,
    game: room.game ? { ...room.game, votes } : undefined,
  };

  // Close condition (a): all alive active players have voted, and none are away
  const alivePlayers = nextRoom.players.filter((p) => p.status === "active");
  const allVoted =
    alivePlayers.every((p) => p.id in votes) &&
    !alivePlayers.some((p) => p.presence === "away");

  if (allVoted) {
    return {
      state: closeVotingAndEliminate(nextRoom, ctx.now),
    };
  }

  return { state: nextRoom };
}

export function handleEndVoting(
  room: Room,
  action: Extract<Action, { type: "host.endVoting" }>,
  ctx: EngineContext
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can end voting" },
    };
  }

  if (room.phase !== "VOTING") {
    return {
      state: room,
      error: { code: "INVALID_PHASE", message: "Can only end voting during VOTING phase" },
    };
  }

  return {
    state: closeVotingAndEliminate(room, ctx.now),
  };
}
