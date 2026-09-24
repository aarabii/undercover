import { describe, expect, test } from "bun:test";
import { createRoom, reduce } from "@game/engine";
import { deepFreeze, createMockContext } from "./test-utils";
import type { Room, Role, GameData } from "@game/types";

describe("Phase 3: Voting and Elimination", () => {
  const avatarFixture = { style: "bottts", seed: "test" };

  function setupVotingRoom(now = 20000): { room: Room; ctx: ReturnType<typeof createMockContext> } {
    const ctx = createMockContext({ now });
    const roles: Role[] = ["CIVILIAN", "CIVILIAN", "CIVILIAN", "UNDERCOVER"];

    const players = [
      { id: "p1", tokenHash: "h1", name: "Alice", avatar: avatarFixture, status: "active" as const, presence: "online" as const, joinedAt: 1, lastSeenAt: 1, role: roles[0], word: "Coffee" },
      { id: "p2", tokenHash: "h2", name: "Bob", avatar: avatarFixture, status: "active" as const, presence: "online" as const, joinedAt: 2, lastSeenAt: 2, role: roles[1], word: "Coffee" },
      { id: "p3", tokenHash: "h3", name: "Charlie", avatar: avatarFixture, status: "active" as const, presence: "online" as const, joinedAt: 3, lastSeenAt: 3, role: roles[2], word: "Coffee" },
      { id: "p4", tokenHash: "h4", name: "Dave", avatar: avatarFixture, status: "active" as const, presence: "online" as const, joinedAt: 4, lastSeenAt: 4, role: roles[3], word: "Tea" },
    ];

    const game: GameData = {
      civilianWord: "Coffee",
      undercoverWord: "Tea",
      pairId: "pair-1",
      votes: {},
      civilianAliases: ["Espresso"],
    };

    const room: Room = {
      code: "ABCDEF",
      createdAt: 1000,
      hostId: "p1",
      locked: false,
      bannedTokenHashes: [],
      settings: {
        requireApproval: false,
        undercoverCount: 1,
        mrWhiteCount: 0,
        category: "random",
        difficulty: "medium",
        showRoles: false,
        discussionSeconds: 180,
        votingSeconds: 60,
        mrWhiteGuessSeconds: 30,
        maxPlayers: 12,
      },
      players,
      phase: "VOTING",
      round: 1,
      endsAt: now + 60000,
      paused: null,
      usedPairIds: ["pair-1"],
      game,
    };

    return { room, ctx };
  }

  describe("vote.cast rules", () => {
    test("player can cast and change vote", () => {
      const { room, ctx } = setupVotingRoom();
      deepFreeze(room);

      // p1 votes for p4
      const res1 = reduce(
        room,
        { type: "vote.cast", playerId: "p1", payload: { targetId: "p4" } },
        ctx
      );
      expect(res1.error).toBeUndefined();
      expect(res1.state.game?.votes["p1"]).toBe("p4");

      // p1 changes vote to p2
      deepFreeze(res1.state);
      const res2 = reduce(
        res1.state,
        { type: "vote.cast", playerId: "p1", payload: { targetId: "p2" } },
        ctx
      );
      expect(res2.error).toBeUndefined();
      expect(res2.state.game?.votes["p1"]).toBe("p2");
    });

    test("cannot vote for self", () => {
      const { room, ctx } = setupVotingRoom();
      deepFreeze(room);

      const res = reduce(
        room,
        { type: "vote.cast", playerId: "p1", payload: { targetId: "p1" } },
        ctx
      );
      expect(res.error?.code).toBe("INVALID_TARGET");
      expect(res.state.game?.votes["p1"]).toBeUndefined();
    });

    test("cannot vote for eliminated player", () => {
      const { room, ctx } = setupVotingRoom();
      const roomWithElim: Room = {
        ...room,
        players: room.players.map((p) =>
          p.id === "p4"
            ? { ...p, status: "eliminated" as const, eliminated: { reason: "VOTED" as const, round: 1 } }
            : p
        ),
      };
      deepFreeze(roomWithElim);

      const res = reduce(
        roomWithElim,
        { type: "vote.cast", playerId: "p1", payload: { targetId: "p4" } },
        ctx
      );
      expect(res.error?.code).toBe("INVALID_TARGET");
    });

    test("eliminated player cannot vote", () => {
      const { room, ctx } = setupVotingRoom();
      const roomWithElim: Room = {
        ...room,
        players: room.players.map((p) =>
          p.id === "p1"
            ? { ...p, status: "eliminated" as const, eliminated: { reason: "VOTED" as const, round: 1 } }
            : p
        ),
      };
      deepFreeze(roomWithElim);

      const res = reduce(
        roomWithElim,
        { type: "vote.cast", playerId: "p1", payload: { targetId: "p2" } },
        ctx
      );
      expect(res.error?.code).toBe("FORBIDDEN");
    });

    test("cannot vote while game is paused", () => {
      const { room, ctx } = setupVotingRoom();
      const pausedRoom: Room = {
        ...room,
        paused: { remainingMs: 30000 },
        endsAt: null,
      };
      deepFreeze(pausedRoom);

      const res = reduce(
        pausedRoom,
        { type: "vote.cast", playerId: "p1", payload: { targetId: "p2" } },
        ctx
      );
      expect(res.error?.code).toBe("PAUSED");
    });
  });

  describe("voting close conditions and early close", () => {
    test("voting closes early when all alive online players have voted", () => {
      const { room, ctx } = setupVotingRoom(1000);
      let state = room;

      // 3 of 4 vote
      state = reduce(state, { type: "vote.cast", playerId: "p1", payload: { targetId: "p4" } }, ctx).state;
      state = reduce(state, { type: "vote.cast", playerId: "p2", payload: { targetId: "p4" } }, ctx).state;
      state = reduce(state, { type: "vote.cast", playerId: "p3", payload: { targetId: "p4" } }, ctx).state;
      expect(state.phase).toBe("VOTING"); // Not closed yet

      // 4th player votes -> all have voted! Closes early into ELIMINATION
      deepFreeze(state);
      const res = reduce(state, { type: "vote.cast", playerId: "p4", payload: { targetId: "p1" } }, ctx);
      expect(res.state.phase).toBe("ELIMINATION");
      expect(res.state.endsAt).toBe(1000 + 6000); // 6s elimination screen
      expect(res.state.game?.lastElimination).toBeDefined();
      expect(res.state.game?.lastElimination?.eliminations[0]?.id).toBe("p4");
    });

    test("voting does NOT close early if an alive player is away (even if others voted)", () => {
      const { room, ctx } = setupVotingRoom(1000);
      // Mark p4 away
      let state: Room = {
        ...room,
        players: room.players.map((p) => (p.id === "p4" ? { ...p, presence: "away" as const } : p)),
      };

      state = reduce(state, { type: "vote.cast", playerId: "p1", payload: { targetId: "p2" } }, ctx).state;
      state = reduce(state, { type: "vote.cast", playerId: "p2", payload: { targetId: "p3" } }, ctx).state;
      state = reduce(state, { type: "vote.cast", playerId: "p3", payload: { targetId: "p2" } }, ctx).state;

      // All 3 online players voted, but p4 is away and hasn't voted -> stay in VOTING
      expect(state.phase).toBe("VOTING");
    });

    test("host.endVoting closes voting immediately", () => {
      const { room, ctx } = setupVotingRoom(1000);
      let state = reduce(room, { type: "vote.cast", playerId: "p1", payload: { targetId: "p4" } }, ctx).state;
      deepFreeze(state);

      const res = reduce(
        state,
        { type: "host.endVoting", playerId: "p1" },
        ctx
      );

      expect(res.error).toBeUndefined();
      expect(res.state.phase).toBe("ELIMINATION");
    });

    test("voting closes on timer expiry via TICK", () => {
      const { room, ctx } = setupVotingRoom(1000);
      // endsAt is 1000 + 60000 = 61000
      let state = reduce(room, { type: "vote.cast", playerId: "p1", payload: { targetId: "p4" } }, ctx).state;
      deepFreeze(state);

      const res = reduce(
        state,
        { type: "tick", now: 61000 },
        createMockContext({ now: 61000 })
      );

      expect(res.state.phase).toBe("ELIMINATION");
    });
  });

  describe("round-end ordering (Spec §3.6) & multi-elimination", () => {
    test("round-end order: disconnect elimination, void votes, tally, eliminate voted, win check", () => {
      const { room } = setupVotingRoom(1000);
      // Scenario:
      // p3 is away (disconnected)
      // p1 votes for p3 (which will be voided!)
      // p2 votes for p4
      // p4 votes for p2
      const roomWithAway: Room = {
        ...room,
        players: room.players.map((p) =>
          p.id === "p3" ? { ...p, presence: "away" as const, disconnectedAt: 500 } : p
        ),
        game: {
          ...room.game!,
          votes: {
            p1: "p3",
            p2: "p4",
            p4: "p2",
          },
        },
      };
      deepFreeze(roomWithAway);

      // Close voting via host.endVoting at now = 2000
      const res = reduce(
        roomWithAway,
        { type: "host.endVoting", playerId: "p1" },
        createMockContext({ now: 2000 })
      );

      expect(res.state.phase).toBe("ELIMINATION");
      const lastElim = res.state.game?.lastElimination;
      expect(lastElim).toBeDefined();

      // Step 1: p3 eliminated as DISCONNECTED
      const p3 = res.state.players.find((p) => p.id === "p3");
      expect(p3?.status).toBe("eliminated");
      expect(p3?.eliminated?.reason).toBe("DISCONNECTED");

      // Step 2: vote for p3 was voided, so p4 and p2 each have 1 vote -> tie!
      expect(lastElim?.isTie).toBe(true);
      expect(lastElim?.eliminations).toHaveLength(1);
      expect(lastElim?.eliminations[0].id).toBe("p3");
      expect(lastElim?.eliminations[0].reason).toBe("DISCONNECTED");
    });

    test("two eliminations in one round: disconnect + vote elimination", () => {
      const { room } = setupVotingRoom(1000);
      // p2 is away (disconnected)
      // p1 and p3 vote for p4 (2 votes for p4)
      // p4 votes for p1 (1 vote for p1)
      const roomSetup: Room = {
        ...room,
        players: [
          ...room.players,
          { id: "p5", tokenHash: "h5", name: "Eve", avatar: avatarFixture, status: "active" as const, presence: "online" as const, joinedAt: 5, lastSeenAt: 5, role: "CIVILIAN" as Role, word: "Coffee" },
        ],
        game: {
          ...room.game!,
          votes: {
            p1: "p4",
            p3: "p4",
            p4: "p1",
            p5: "p4",
          },
        },
      };
      const roomWithAway: Room = {
        ...roomSetup,
        players: roomSetup.players.map((p) =>
          p.id === "p2" ? { ...p, presence: "away" as const, disconnectedAt: 500 } : p
        ),
      };
      deepFreeze(roomWithAway);

      const res = reduce(
        roomWithAway,
        { type: "host.endVoting", playerId: "p1" },
        createMockContext({ now: 2000 })
      );

      expect(res.state.phase).toBe("ELIMINATION");
      const lastElim = res.state.game?.lastElimination;
      expect(lastElim).toBeDefined();
      expect(lastElim?.isTie).toBe(false);
      expect(lastElim?.eliminations).toHaveLength(2);

      // Disconnect elimination first
      expect(lastElim?.eliminations[0].id).toBe("p2");
      expect(lastElim?.eliminations[0].reason).toBe("DISCONNECTED");

      // Voted elimination second
      expect(lastElim?.eliminations[1].id).toBe("p4");
      expect(lastElim?.eliminations[1].reason).toBe("VOTED");
      expect(lastElim?.eliminations[1].role).toBe("UNDERCOVER");
    });

    test("tie or nobody-voted results in no voted elimination (Spec L5)", () => {
      const { room } = setupVotingRoom(1000);
      // Nobody voted
      deepFreeze(room);

      const res = reduce(
        room,
        { type: "host.endVoting", playerId: "p1" },
        createMockContext({ now: 2000 })
      );

      expect(res.state.phase).toBe("ELIMINATION");
      expect(res.state.game?.lastElimination?.isTie).toBe(true);
      expect(res.state.game?.lastElimination?.eliminations).toHaveLength(0);
      expect(res.state.players.every((p) => p.status === "active")).toBe(true);
    });
  });

  describe("ELIMINATION timer and transition to MRWHITE_GUESS or next DISCUSSION", () => {
    test("transition to MRWHITE_GUESS when Mr. White is voted out", () => {
      const { room } = setupVotingRoom(1000);
      // Set p4 role to MR_WHITE
      const roomWithMW: Room = {
        ...room,
        players: room.players.map((p) =>
          p.id === "p4" ? { ...p, role: "MR_WHITE" as Role, word: null } : p
        ),
        game: {
          ...room.game!,
          votes: { p1: "p4", p2: "p4", p3: "p4" },
        },
      };
      deepFreeze(roomWithMW);

      // Close voting at 2000 -> enters ELIMINATION (endsAt 2000 + 6000 = 8000)
      const res1 = reduce(
        roomWithMW,
        { type: "host.endVoting", playerId: "p1" },
        createMockContext({ now: 2000 })
      );
      expect(res1.state.phase).toBe("ELIMINATION");
      expect(res1.state.endsAt).toBe(8000);

      // TICK at 8000 -> transitions to MRWHITE_GUESS because Mr. White was voted out
      deepFreeze(res1.state);
      const res2 = reduce(
        res1.state,
        { type: "tick", now: 8000 },
        createMockContext({ now: 8000 })
      );
      expect(res2.state.phase).toBe("MRWHITE_GUESS");
      expect(res2.state.endsAt).toBe(8000 + 30000); // 30s guess timer
    });

    test("does NOT grant Mr. White guess if eliminated by disconnect (Spec §3.7)", () => {
      const { room } = setupVotingRoom(1000);
      // p4 is Mr. White and is AWAY
      const roomWithAwayMW: Room = {
        ...room,
        players: room.players.map((p) =>
          p.id === "p4"
            ? { ...p, role: "MR_WHITE" as Role, word: null, presence: "away" as const, disconnectedAt: 500 }
            : p
        ),
        game: {
          ...room.game!,
          votes: {}, // nobody voted
        },
      };
      deepFreeze(roomWithAwayMW);

      // Close voting -> p4 eliminated by DISCONNECTED
      const res1 = reduce(
        roomWithAwayMW,
        { type: "host.endVoting", playerId: "p1" },
        createMockContext({ now: 2000 })
      );
      expect(res1.state.phase).toBe("ELIMINATION");
      expect(res1.state.game?.lastElimination?.eliminations[0].reason).toBe("DISCONNECTED");

      // TICK at 8000 -> win check: infiltrator out, Civilians win! (NOT MRWHITE_GUESS)
      deepFreeze(res1.state);
      const res2 = reduce(
        res1.state,
        { type: "tick", now: 8000 },
        createMockContext({ now: 8000 })
      );
      expect(res2.state.phase).toBe("GAME_OVER");
    });
  });
});
