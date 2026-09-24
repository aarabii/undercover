import { describe, it, expect } from "bun:test";
import { RoomViewSchema } from "@game/protocol";
import {
  reduce,
  viewFor,
  createRoom,
  type Action,
  type EngineContext,
  type WordBank,
} from "@game/engine";
import { deepFreeze, createMockContext } from "./test-utils";
import type { Room, Player, Role } from "@game/types";

function createSeededRng(initialSeed: number): () => number {
  let s = initialSeed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function setupLobbyRoom(playerCount = 5, showRoles = true): { room: Room; ctx: EngineContext } {
  let idCounter = 2;
  const ctx = createMockContext({
    now: 1000,
    newId: () => `p${idCounter++}`,
    words: {
      getWordPair: () => ({
        id: "pair-sim",
        category: "Food",
        difficulty: "easy",
        a: "Pizza",
        b: "Burger",
        accept: ["Pizzas"],
      }),
    },
  });

  let room = createRoom({
    code: "SIM01",
    hostId: "p1",
    hostTokenHash: "hash_p1",
    hostProfile: {
      name: "Player 1",
      avatar: { style: "bottts", seed: "p1" },
    },
    createdAt: 1000,
  });

  room.settings.requireApproval = false;

  for (let i = 2; i <= playerCount; i++) {
    const res = reduce(
      room,
      {
        type: "hello",
        playerId: `p${i}`,
        tokenHash: `hash_p${i}`,
        payload: {
          code: "SIM01",
          playerId: `p${i}`,
          profile: {
            name: `Player ${i}`,
            avatar: { style: "bottts", seed: `p${i}` },
          },
        },
      },
      ctx
    );
    room = res.state;
  }

  // Update showRoles setting if needed
  if (!showRoles) {
    const setRes = reduce(
      room,
      {
        type: "host.settings.update",
        playerId: "p1",
        payload: { showRoles: false },
      },
      ctx
    );
    room = setRes.state;
  }

  return { room, ctx };
}

describe("Phase 8: Edge-case matrix (Spec §17)", () => {
  it("Scenario 1: Start with < 4 players -> blocked with reason", () => {
    const { room, ctx } = setupLobbyRoom(3);
    deepFreeze(room);

    const res = reduce(room, { type: "host.start", playerId: "p1" }, ctx);
    expect(res.error?.code).toBe("NOT_ENOUGH_PLAYERS");
    expect(res.state).toBe(room);
  });

  it("Scenario 2: Start while a player is away -> blocked until return or removal", () => {
    const { room, ctx } = setupLobbyRoom(4);
    // Disconnect player 4
    const disRes = reduce(room, { type: "disconnect", playerId: "p4" }, ctx);
    const roomWithAway = disRes.state;
    deepFreeze(roomWithAway);

    const startRes = reduce(roomWithAway, { type: "host.start", playerId: "p1" }, ctx);
    expect(startRes.error?.code).toBe("PLAYER_AWAY");

    // After player returns -> start allowed
    const connRes = reduce(roomWithAway, { type: "connect", playerId: "p4" }, ctx);
    const startAfterReturn = reduce(connRes.state, { type: "host.start", playerId: "p1" }, ctx);
    expect(startAfterReturn.error).toBeUndefined();
    expect(startAfterReturn.state.phase).toBe("ROLE_REVEAL");
  });

  it("Scenario 3: Room full / locked -> friendly rejection message", () => {
    const { room, ctx } = setupLobbyRoom(4);
    // Lock room
    const lockRes = reduce(room, { type: "host.lock", playerId: "p1", payload: { locked: true } }, ctx);
    deepFreeze(lockRes.state);

    const joinRes = reduce(
      lockRes.state,
      {
        type: "hello",
        tokenHash: "new_hash",
        payload: {
          code: "SIM01",
          profile: { name: "LateGuy", avatar: { style: "bottts", seed: "lg" } },
        },
      },
      ctx
    );
    expect(joinRes.error?.code).toBe("ROOM_LOCKED");
  });

  it("Scenario 4: Same name as another player -> auto-suffix", () => {
    const { room, ctx } = setupLobbyRoom(4);
    deepFreeze(room);

    const joinRes = reduce(
      room,
      {
        type: "hello",
        tokenHash: "new_hash",
        payload: {
          code: "SIM01",
          profile: { name: "Player 1", avatar: { style: "bottts", seed: "dup" } },
        },
      },
      ctx
    );

    expect(joinRes.error).toBeUndefined();
    const newPlayer = joinRes.state.players.find((p) => p.tokenHash === "new_hash");
    expect(newPlayer?.name).toBe("Player 1 2");
  });

  it("Scenario 5: Refresh mid-game -> reconnect with token, same seat, same card", () => {
    const { room: lobbyRoom, ctx } = setupLobbyRoom(5);
    const startRes = reduce(lobbyRoom, { type: "host.start", playerId: "p1" }, ctx);
    let gameRoom = startRes.state;

    // Disconnect p2
    const disRes = reduce(gameRoom, { type: "disconnect", playerId: "p2" }, ctx);
    gameRoom = disRes.state;
    deepFreeze(gameRoom);

    // Refresh: hello with same tokenHash and playerId
    const helloRes = reduce(
      gameRoom,
      {
        type: "hello",
        playerId: "p2",
        tokenHash: "hash_p2",
        payload: {
          code: "SIM01",
          playerId: "p2",
          profile: { name: "Player 2", avatar: { style: "bottts", seed: "p2" } },
        },
      },
      ctx
    );

    expect(helloRes.error).toBeUndefined();
    const p2 = helloRes.state.players.find((p) => p.id === "p2")!;
    expect(p2.presence).toBe("online");
    expect(p2.status).toBe("active");

    // Card preserved
    const view = viewFor(helloRes.state, "p2");
    expect(view.me.card).toBeDefined();
    expect(view.me.card?.word).toBe(p2.word ?? null);
  });

  it("Scenario 7 & 8: Pending player when game starts stays pending; host can approve in GAME_OVER", () => {
    const { room: lobbyRoom, ctx } = setupLobbyRoom(4);
    // Add pending player
    lobbyRoom.settings.requireApproval = true;
    const knockRes = reduce(
      lobbyRoom,
      {
        type: "hello",
        tokenHash: "hash_pending",
        payload: {
          code: "SIM01",
          profile: { name: "Knocker", avatar: { style: "bottts", seed: "k" } },
        },
      },
      ctx
    );
    const knockerId = knockRes.state.players.find((p) => p.status === "pending")!.id;

    // Start game
    const startRes = reduce(knockRes.state, { type: "host.start", playerId: "p1" }, ctx);
    expect(startRes.error).toBeUndefined();

    // Knocker is still pending
    const knockerDuringGame = startRes.state.players.find((p) => p.id === knockerId)!;
    expect(knockerDuringGame.status).toBe("pending");

    // If accepted during game -> becomes waiting (Spec §755)
    const appRes = reduce(
      startRes.state,
      { type: "host.approve", playerId: "p1", payload: { playerId: knockerId } },
      ctx
    );
    expect(appRes.state.players.find((p) => p.id === knockerId)!.status).toBe("waiting");
  });

  it("Scenario 9: Player leaves voluntarily mid-game -> eliminated instantly, role revealed, win check", () => {
    const { room: lobbyRoom, ctx } = setupLobbyRoom(5);
    const startRes = reduce(lobbyRoom, { type: "host.start", playerId: "p1" }, ctx);
    const gameRoom = startRes.state;
    deepFreeze(gameRoom);

    // Player leaves voluntarily
    const leaveRes = reduce(gameRoom, { type: "leave", playerId: "p2" }, ctx);
    expect(leaveRes.error).toBeUndefined();
    const p2 = leaveRes.state.players.find((p) => p.id === "p2")!;
    expect(p2.status).toBe("eliminated");
    expect(p2.eliminated?.reason).toBe("LEFT");
    expect(p2.eliminated?.role).toBe(p2.role);
    expect(leaveRes.effects).toEqual([{ type: "close", playerId: "p2", reason: "left" }]);
  });

  it("Scenario 10 & 11: Top-voted player disconnected at vote close eliminated as DISCONNECTED first, votes voided", () => {
    const { room: lobbyRoom, ctx } = setupLobbyRoom(5);
    const startRes = reduce(lobbyRoom, { type: "host.start", playerId: "p1" }, ctx);
    // Skip to voting
    const discRes = reduce(startRes.state, { type: "host.skip", playerId: "p1" }, ctx);
    const voteRes = reduce(discRes.state, { type: "host.skip", playerId: "p1" }, ctx);
    let votingRoom = voteRes.state;

    // p2 is disconnected
    votingRoom = reduce(votingRoom, { type: "disconnect", playerId: "p2" }, ctx).state;
    // p1 votes for p3, p3 votes for p2
    votingRoom = reduce(votingRoom, { type: "vote.cast", playerId: "p1", payload: { targetId: "p3" } }, ctx).state;
    votingRoom = reduce(votingRoom, { type: "vote.cast", playerId: "p3", payload: { targetId: "p2" } }, ctx).state;
    deepFreeze(votingRoom);

    // Vote timer expires via TICK
    const endTick = reduce(
      votingRoom,
      { type: "tick", now: votingRoom.endsAt! + 1 },
      { ...ctx, now: votingRoom.endsAt! + 1 }
    );

    // p2 was eliminated for disconnect
    const p2Elim = endTick.state.game?.lastElimination?.eliminations.find((e) => e.id === "p2");
    expect(p2Elim?.reason).toBe("DISCONNECTED");
  });

  it("Scenario 12: All votes cast before timer closes voting early only if no player is away", () => {
    const { room: lobbyRoom, ctx } = setupLobbyRoom(4);
    const startRes = reduce(lobbyRoom, { type: "host.start", playerId: "p1" }, ctx);
    const discRes = reduce(startRes.state, { type: "host.skip", playerId: "p1" }, ctx);
    const voteRes = reduce(discRes.state, { type: "host.skip", playerId: "p1" }, ctx);
    let room = voteRes.state;

    // Disconnect p4
    room = reduce(room, { type: "disconnect", playerId: "p4" }, ctx).state;

    // p1, p2, p3 vote
    room = reduce(room, { type: "vote.cast", playerId: "p1", payload: { targetId: "p2" } }, ctx).state;
    room = reduce(room, { type: "vote.cast", playerId: "p2", payload: { targetId: "p1" } }, ctx).state;
    room = reduce(room, { type: "vote.cast", playerId: "p3", payload: { targetId: "p1" } }, ctx).state;

    // Voting does NOT close early because p4 is away
    expect(room.phase).toBe("VOTING");

    // p4 reconnects and votes
    room = reduce(room, { type: "connect", playerId: "p4" }, ctx).state;
    room = reduce(room, { type: "vote.cast", playerId: "p4", payload: { targetId: "p1" } }, ctx).state;

    // Now all alive online players voted -> voting closes early
    expect(room.phase).toBe("ELIMINATION");
  });

  it("Scenario 13: Host pauses during voting -> no votes accepted until resume", () => {
    const { room: lobbyRoom, ctx } = setupLobbyRoom(4);
    const startRes = reduce(lobbyRoom, { type: "host.start", playerId: "p1" }, ctx);
    const discRes = reduce(startRes.state, { type: "host.skip", playerId: "p1" }, ctx);
    const voteRes = reduce(discRes.state, { type: "host.skip", playerId: "p1" }, ctx);

    // Host pauses voting
    const pauseRes = reduce(voteRes.state, { type: "host.pause", playerId: "p1" }, ctx);
    expect(pauseRes.state.paused).not.toBeNull();
    deepFreeze(pauseRes.state);

    // Vote while paused is rejected
    const voteAttempt = reduce(
      pauseRes.state,
      { type: "vote.cast", playerId: "p2", payload: { targetId: "p1" } },
      ctx
    );
    expect(voteAttempt.error?.code).toBe("PAUSED");

    // Resume allows voting
    const resumeRes = reduce(pauseRes.state, { type: "host.resume", playerId: "p1" }, ctx);
    const voteAfterResume = reduce(
      resumeRes.state,
      { type: "vote.cast", playerId: "p2", payload: { targetId: "p1" } },
      ctx
    );
    expect(voteAfterResume.error).toBeUndefined();
  });

  it("Scenario 14 & 15: Host leaves during Mr. White guess reassigns host; late guess rejected", () => {
    const { room: initialRoom, ctx } = setupLobbyRoom(5);
    const setRes = reduce(
      initialRoom,
      {
        type: "host.settings.update",
        playerId: "p1",
        payload: { undercoverCount: 1, mrWhiteCount: 1 },
      },
      ctx
    );
    const lobbyRoom = setRes.state;

    const startRes = reduce(lobbyRoom, { type: "host.start", playerId: "p1" }, ctx);
    let room = startRes.state;

    // Identify Mr. White
    const mw = room.players.find((p) => p.role === "MR_WHITE")!;
    expect(mw).toBeDefined();

    // Advance to voting
    room = reduce(room, { type: "host.skip", playerId: "p1" }, ctx).state;
    room = reduce(room, { type: "host.skip", playerId: "p1" }, ctx).state;

    // All players vote (others vote for Mr. White; Mr. White votes for someone else)
    for (const p of room.players.filter((p) => p.status === "active")) {
      const targetId = p.id === mw.id ? (p.id === "p1" ? "p2" : "p1") : mw.id;
      room = reduce(room, { type: "vote.cast", playerId: p.id, payload: { targetId } }, ctx).state;
    }
    // Voting closes -> ELIMINATION
    expect(room.phase).toBe("ELIMINATION");

    // ELIMINATION timer expires -> MRWHITE_GUESS
    room = reduce(room, { type: "tick", now: room.endsAt! + 1 }, { ...ctx, now: room.endsAt! + 1 }).state;
    expect(room.phase).toBe("MRWHITE_GUESS");

    // Host (p1, assuming p1 is not Mr. White) leaves during guess
    if (room.hostId !== mw.id) {
      const oldHost = room.hostId;
      const leaveRes = reduce(room, { type: "leave", playerId: oldHost }, ctx);
      expect(leaveRes.state.hostId).not.toBe(oldHost);
      expect(leaveRes.state.phase).toBe("MRWHITE_GUESS");
      room = leaveRes.state;
    } else {
      // If p1 happened to be Mr. White, another player can leave
      const otherPlayer = room.players.find((p) => p.id !== mw.id && p.status === "active")!;
      const leaveRes = reduce(room, { type: "leave", playerId: otherPlayer.id }, ctx);
      expect(leaveRes.state.phase).toBe("MRWHITE_GUESS");
      room = leaveRes.state;
    }

    // Late guess after timer expires -> rejected
    const lateGuess = reduce(
      room,
      { type: "mrwhite.guess", playerId: mw.id, payload: { text: "Pizza" } },
      { ...ctx, now: room.endsAt! + 1000 }
    );
    expect(lateGuess.error?.code).toBe("TIMER_EXPIRED");
  });

  it("Scenario 16: Everyone eliminated / disconnected aborts game to lobby", () => {
    const { room: lobbyRoom, ctx } = setupLobbyRoom(4);
    const startRes = reduce(lobbyRoom, { type: "host.start", playerId: "p1" }, ctx);
    let room = startRes.state;

    // Advance to voting
    room = reduce(room, { type: "host.skip", playerId: "p1" }, ctx).state;
    room = reduce(room, { type: "host.skip", playerId: "p1" }, ctx).state;
    expect(room.phase).toBe("VOTING");

    // All players disconnect
    for (const p of ["p1", "p2", "p3", "p4"]) {
      room = reduce(room, { type: "disconnect", playerId: p }, ctx).state;
    }

    // Voting timer expires -> all players eliminated simultaneously for disconnect -> phase moves to ELIMINATION
    let tickRes = reduce(
      room,
      { type: "tick", now: room.endsAt! + 1 },
      { ...ctx, now: room.endsAt! + 1 }
    );
    expect(tickRes.state.phase).toBe("ELIMINATION");

    // Elimination timer expires -> win check runs -> all active players disconnected -> abort to lobby
    tickRes = reduce(
      tickRes.state,
      { type: "tick", now: tickRes.state.endsAt! + 1 },
      { ...ctx, now: tickRes.state.endsAt! + 1 }
    );

    // Game aborts back to lobby (no winner)
    expect(tickRes.state.phase).toBe("LOBBY");
    expect(tickRes.state.game).toBeUndefined();
    expect(tickRes.state.round).toBe(0);
  });

  it("Scenario 17: Two tabs same player -> older connection gets replaced", () => {
    const { room, ctx } = setupLobbyRoom(4);
    deepFreeze(room);

    // Second tab opens with same tokenHash
    const secondTabRes = reduce(
      room,
      {
        type: "hello",
        playerId: "p1",
        tokenHash: "hash_p1",
        payload: {
          code: "SIM01",
          playerId: "p1",
          profile: { name: "Player 1 NewTab", avatar: { style: "bottts", seed: "p1" } },
        },
      },
      ctx
    );

    expect(secondTabRes.effects).toContainEqual({
      type: "send",
      to: "p1",
      message: { type: "replaced" },
    });
  });

  it("Scenario 18: Kicked player tries to rejoin -> rejected with BANNED", () => {
    const { room, ctx } = setupLobbyRoom(4);
    // Host kicks p2
    const kickRes = reduce(
      room,
      { type: "host.kick", playerId: "p1", payload: { playerId: "p2" } },
      ctx
    );
    deepFreeze(kickRes.state);

    // p2 tries to rejoin
    const rejoinRes = reduce(
      kickRes.state,
      {
        type: "hello",
        tokenHash: "hash_p2",
        payload: {
          code: "SIM01",
          profile: { name: "SneakyP2", avatar: { style: "bottts", seed: "p2" } },
        },
      },
      ctx
    );

    expect(rejoinRes.error?.code).toBe("BANNED");
  });
});

describe("Phase 8: Seeded random-play simulation (50 Games)", () => {
  it("maintains all engine invariants across 50 complete simulated games", () => {
    const SIM_GAMES = 50;

    for (let simIdx = 0; simIdx < SIM_GAMES; simIdx++) {
      const seed = 100000 + simIdx * 7919;
      const engineRng = createSeededRng(seed);
      const simRng = createSeededRng(seed + 1);

      const playerCount = 4 + Math.floor(simRng() * 4); // 4 to 7 players
      const showRoles = simRng() > 0.5;

      const words: WordBank = {
        getWordPair: (_cat: string, _diff: string, used: string[], _rng?: () => number) => ({
          id: `pair_${used.length + 1}`,
          category: "General",
          difficulty: "easy",
          a: `CivWord_${used.length + 1}`,
          b: `InfWord_${used.length + 1}`,
          accept: [`CivAlias_${used.length + 1}`],
        }),
      };

      let now = 10000;
      const ctx: EngineContext = {
        now,
        rng: engineRng,
        newId: () => `id_${Math.floor(engineRng() * 1000000)}`,
        words,
      };

      // 1. Create Room
      let room = createRoom({
        code: `R${simIdx}`,
        hostId: "p1",
        hostTokenHash: "hash_p1",
        hostProfile: { name: "Host1", avatar: { style: "bottts", seed: "h1" } },
        createdAt: now,
      });

      // Record actions for replay verification
      const actionHistory: { action: Action; at: number }[] = [];

      function dispatch(action: Action) {
        deepFreeze(room);
        actionHistory.push({ action, at: now });
        const res = reduce(room, action, { ...ctx, now });
        room = res.state;

        // Invariant Check: viewFor validates schema & leaks for all players
        for (const p of room.players) {
          const view = viewFor(room, p.id, now);
          expect(() => RoomViewSchema.parse(view)).not.toThrow();

          const json = JSON.stringify(view);
          expect(json.includes("hash_p")).toBe(false);

          if (room.phase !== "GAME_OVER" && room.game) {
            if (p.role === "CIVILIAN") {
              expect(json.includes(room.game.undercoverWord)).toBe(false);
            }
            if (!showRoles && p.status === "active") {
              expect(view.me.card?.role).toBeUndefined();
              if (p.role !== "MR_WHITE") {
                expect(view.me.card?.variant).toBe("WORD_ONLY");
              }
            }
          }
        }
        return res;
      }

      // Update showRoles and requireApproval
      dispatch({
        type: "host.settings.update",
        playerId: "p1",
        payload: { showRoles, requireApproval: false },
      });

      // Add players
      for (let pIdx = 2; pIdx <= playerCount; pIdx++) {
        dispatch({
          type: "hello",
          playerId: `p${pIdx}`,
          tokenHash: `hash_p${pIdx}`,
          payload: {
            code: `R${simIdx}`,
            playerId: `p${pIdx}`,
            profile: { name: `P${pIdx}`, avatar: { style: "bottts", seed: `p${pIdx}` } },
          },
        });
      }

      // Start game
      dispatch({ type: "host.start", playerId: room.hostId });
      expect(room.phase).toBe("ROLE_REVEAL");

      let steps = 0;
      const MAX_STEPS = 100;

      while (room.phase !== "GAME_OVER" && room.phase !== "LOBBY" && steps < MAX_STEPS) {
        steps++;

        if (room.phase === "ROLE_REVEAL") {
          // 50% skip, 50% wait for timer
          if (simRng() > 0.5) {
            dispatch({ type: "host.skip", playerId: room.hostId });
          } else {
            now = (room.endsAt ?? now) + 1;
            dispatch({ type: "tick", now });
          }
        } else if (room.phase === "DISCUSSION") {
          // Occasional pause/resume or skip or timer expiry
          const actionChoice = simRng();
          if (actionChoice < 0.2) {
            // Pause and resume
            dispatch({ type: "host.pause", playerId: room.hostId });
            now += 5000;
            dispatch({ type: "host.resume", playerId: room.hostId });
          } else if (actionChoice < 0.5) {
            dispatch({ type: "host.skip", playerId: room.hostId });
          } else {
            now = (room.endsAt ?? now) + 1;
            dispatch({ type: "tick", now });
          }
        } else if (room.phase === "VOTING") {
          // Active players vote
          const alive = room.players.filter((p) => p.status === "active");
          for (const voter of alive) {
            const targets = alive.filter((t) => t.id !== voter.id);
            if (targets.length > 0 && simRng() > 0.3) {
              const target = targets[Math.floor(simRng() * targets.length)]!;
              dispatch({ type: "vote.cast", playerId: voter.id, payload: { targetId: target.id } });
            }
          }

          // Advance voting timer if still in voting
          if (room.phase === "VOTING") {
            now = (room.endsAt ?? now) + 1;
            dispatch({ type: "tick", now });
          }
        } else if (room.phase === "ELIMINATION") {
          // Wait for elimination screen
          now = (room.endsAt ?? now) + 1;
          dispatch({ type: "tick", now });
        } else if (room.phase === "MRWHITE_GUESS") {
          // Mr. White makes a guess or times out
          const votedMrWhite = room.game?.lastElimination?.eliminations.find(
            (e) => e.reason === "VOTED" && e.role === "MR_WHITE"
          );
          if (votedMrWhite && simRng() > 0.5) {
            const guess = simRng() > 0.5 ? room.game!.civilianWord : "WrongGuess";
            dispatch({ type: "mrwhite.guess", playerId: votedMrWhite.id, payload: { text: guess } });
          } else {
            now = (room.endsAt ?? now) + 1;
            dispatch({ type: "tick", now });
          }
        }
      }

      // Invariant 3: Game terminates properly
      expect(steps).toBeLessThan(MAX_STEPS);
      expect(["GAME_OVER", "LOBBY"]).toContain(room.phase);

      // Invariant 1: Deterministic Replay
      // Re-run the exact same sequence of actions on a clean initial room
      let replayRoom = createRoom({
        code: `R${simIdx}`,
        hostId: "p1",
        hostTokenHash: "hash_p1",
        hostProfile: { name: "Host1", avatar: { style: "bottts", seed: "h1" } },
        createdAt: 10000,
      });

      // Reset RNG to initial state for replay
      const replayRng = createSeededRng(seed);
      const replayCtx: EngineContext = {
        now: 10000,
        rng: replayRng,
        newId: () => `id_${Math.floor(replayRng() * 1000000)}`,
        words,
      };

      for (const item of actionHistory) {
        const replayRes = reduce(replayRoom, item.action, {
          ...replayCtx,
          now: item.at,
        });
        replayRoom = replayRes.state;
      }

      // Assert identical final state
      expect(replayRoom.phase).toBe(room.phase);
      expect(replayRoom.round).toBe(room.round);
      expect(replayRoom.hostId).toBe(room.hostId);
      expect(replayRoom.players.length).toBe(room.players.length);
      expect(replayRoom.game?.gameOver?.winner).toBe(room.game?.gameOver?.winner);
    }
  });
});
