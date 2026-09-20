import type { Room, Role, GameData } from "@game/types";
import type { Action, EngineContext, ReduceResult } from "../types";
import { MIN_PLAYERS, DEFAULT_ROLE_REVEAL_SECONDS } from "../constants";

export function handleStart(
  room: Room,
  action: Extract<Action, { type: "host.start" }>,
  ctx: EngineContext
): ReduceResult {
  if (action.playerId !== room.hostId) {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Only host can start the game" },
    };
  }

  if (room.phase !== "LOBBY") {
    return {
      state: room,
      error: { code: "FORBIDDEN", message: "Can only start game from lobby" },
    };
  }

  const admittedPlayers = room.players.filter((p) => p.status !== "pending");
  if (admittedPlayers.some((p) => p.presence === "away")) {
    return {
      state: room,
      error: {
        code: "PLAYER_AWAY",
        message: "Cannot start while an active player is away",
      },
    };
  }

  const activePlayers = room.players.filter((p) => p.status === "active");
  const n = activePlayers.length;

  if (n < MIN_PLAYERS) {
    return {
      state: room,
      error: {
        code: "NOT_ENOUGH_PLAYERS",
        message: `Need at least ${MIN_PLAYERS} active players to start (currently ${n})`,
      },
    };
  }

  const totalInfiltrators = room.settings.undercoverCount + room.settings.mrWhiteCount;
  const maxInfiltrators = Math.floor((n - 1) / 2);

  if (totalInfiltrators < 1 || totalInfiltrators > maxInfiltrators) {
    return {
      state: room,
      error: {
        code: "INVALID_ROLE_COUNTS",
        message: `Total infiltrators (${totalInfiltrators}) must be between 1 and ${maxInfiltrators} for ${n} players`,
      },
    };
  }

  const civilians = n - totalInfiltrators;
  if (civilians < totalInfiltrators + 1) {
    return {
      state: room,
      error: {
        code: "INVALID_ROLE_COUNTS",
        message: `Civilians (${civilians}) must be at least infiltrators + 1 (${totalInfiltrators + 1})`,
      },
    };
  }

  // Role distribution via Fisher-Yates shuffle
  const roles: Role[] = [
    ...Array(room.settings.undercoverCount).fill("UNDERCOVER" as Role),
    ...Array(room.settings.mrWhiteCount).fill("MR_WHITE" as Role),
    ...Array(civilians).fill("CIVILIAN" as Role),
  ];

  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(ctx.rng() * (i + 1));
    const temp = roles[i];
    roles[i] = roles[j];
    roles[j] = temp;
  }

  // Word pair selection
  let pair = ctx.words.getWordPair(
    room.settings.category,
    room.settings.difficulty,
    room.usedPairIds,
    ctx.rng
  );
  let usedPairIds = room.usedPairIds;

  if (!pair) {
    // Pool exhausted, reset usedPairIds per spec §3.3
    pair = ctx.words.getWordPair(
      room.settings.category,
      room.settings.difficulty,
      [],
      ctx.rng
    );
    usedPairIds = [];
  }

  if (!pair) {
    pair = {
      id: "fallback-pair-1",
      category: "General",
      difficulty: "medium",
      a: "Sun",
      b: "Moon",
      accept: ["Solar"],
    };
  }

  usedPairIds = [...usedPairIds, pair.id];

  // Random civilian/undercover flip so pair order never leaks
  const flip = ctx.rng() < 0.5;
  const civilianWord = flip ? pair.a : pair.b;
  const undercoverWord = flip ? pair.b : pair.a;

  let roleIdx = 0;
  const updatedPlayers = room.players.map((p) => {
    if (p.status === "active") {
      const role = roles[roleIdx++];
      const word =
        role === "CIVILIAN"
          ? civilianWord
          : role === "UNDERCOVER"
          ? undercoverWord
          : null;
      return {
        ...p,
        role,
        word,
        eliminated: undefined,
      };
    }
    return p;
  });

  const game: GameData = {
    civilianWord,
    undercoverWord,
    pairId: pair.id,
    votes: {},
    civilianAliases: pair.accept ?? [],
  };

  return {
    state: {
      ...room,
      phase: "ROLE_REVEAL",
      round: 1,
      endsAt: ctx.now + DEFAULT_ROLE_REVEAL_SECONDS * 1000,
      paused: null,
      usedPairIds,
      players: updatedPlayers,
      game,
    },
  };
}
