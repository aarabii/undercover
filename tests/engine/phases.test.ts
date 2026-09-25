import { describe, expect, test } from "bun:test";
import { createRoom, reduce, nextAlarm } from "@game/engine";
import { deepFreeze, createMockContext } from "./test-utils";
import type { Room, Role, WordPair } from "@game/types";

describe("Phase 2: Start game and phases", () => {
  const avatarFixture = { style: "bottts", seed: "test" };

  function setup4PlayerLobby(now = 1000): { room: Room; ctx: ReturnType<typeof createMockContext> } {
    const ctx = createMockContext({ now });
    let room = createRoom({
      code: "ABCDEF",
      hostId: "p1",
      hostTokenHash: "h1",
      hostProfile: { name: "Alice", avatar: avatarFixture },
      createdAt: now,
      settings: {
        requireApproval: false,
        undercoverCount: 1,
        mrWhiteCount: 0,
        discussionSeconds: 180,
        votingSeconds: 60,
      },
    });

    for (let i = 2; i <= 4; i++) {
      room = {
        ...room,
        players: [
          ...room.players,
          {
            id: `p${i}`,
            tokenHash: `h${i}`,
            name: `Player${i}`,
            avatar: avatarFixture,
            status: "active",
            presence: "online",
            joinedAt: now + i,
            lastSeenAt: now + i,
          },
        ],
      };
    }
    return { room, ctx };
  }

  describe("host.start validation", () => {
    test("rejects start if fewer than 4 active players", () => {
      const ctx = createMockContext({ now: 1000 });
      const room = createRoom({
        code: "ABCDEF",
        hostId: "p1",
        hostTokenHash: "h1",
        hostProfile: { name: "Alice", avatar: avatarFixture },
        createdAt: 1000,
      });
      deepFreeze(room);

      const res = reduce(room, { type: "host.start", playerId: "p1" }, ctx);
      expect(res.error?.code).toBe("NOT_ENOUGH_PLAYERS");
      expect(res.state.phase).toBe("LOBBY");
    });

    test("rejects start if any active player is away", () => {
      const { room, ctx } = setup4PlayerLobby();
      const roomWithAway = {
        ...room,
        players: room.players.map((p, idx) => (idx === 2 ? { ...p, presence: "away" as const } : p)),
      };
      deepFreeze(roomWithAway);

      const res = reduce(roomWithAway, { type: "host.start", playerId: "p1" }, ctx);
      expect(res.error?.code).toBe("PLAYER_AWAY");
      expect(res.state.phase).toBe("LOBBY");
    });

    test("rejects start if non-host attempts to start", () => {
      const { room, ctx } = setup4PlayerLobby();
      deepFreeze(room);

      const res = reduce(room, { type: "host.start", playerId: "p2" }, ctx);
      expect(res.error?.code).toBe("FORBIDDEN");
      expect(res.state.phase).toBe("LOBBY");
    });

    test("rejects start if role counts exceed floor((n-1)/2)", () => {
      const { room, ctx } = setup4PlayerLobby();
      // 4 players -> max infiltrators = floor(3/2) = 1. If settings has 1 undercover + 1 mrWhite = 2 -> invalid
      const invalidRoom: Room = {
        ...room,
        settings: {
          ...room.settings,
          undercoverCount: 1,
          mrWhiteCount: 1,
        },
      };
      deepFreeze(invalidRoom);

      const res = reduce(invalidRoom, { type: "host.start", playerId: "p1" }, ctx);
      expect(res.error?.code).toBe("INVALID_ROLE_COUNTS");
      expect(res.state.phase).toBe("LOBBY");
    });
  });

  describe("game initialization & role assignment", () => {
    test("starts game with Fisher-Yates roles, word selection, and enters ROLE_REVEAL", () => {
      const { room } = setup4PlayerLobby(1000);
      deepFreeze(room);

      const mockWords: WordPair = {
        id: "pair-10",
        category: "Food",
        difficulty: "medium",
        a: "Apple",
        b: "Pear",
      };

      const customCtx = createMockContext({
        now: 1000,
        rng: () => 0.1, // Deterministic
        words: {
          getWordPair: () => mockWords,
        },
      });

      const res = reduce(room, { type: "host.start", playerId: "p1" }, customCtx);

      expect(res.error).toBeUndefined();
      expect(res.state.phase).toBe("ROLE_REVEAL");
      expect(res.state.round).toBe(1);
      expect(res.state.endsAt).toBe(1000 + 10000); // 10s role reveal
      expect(res.state.usedPairIds).toContain("pair-10");
      expect(res.state.game).toBeDefined();
      expect(res.state.game?.pairId).toBe("pair-10");
      expect(res.state.game?.civilianAliases).toEqual(["Apple"]);

      // Verify roles assigned: 3 civilians, 1 undercover
      const roles = res.state.players.map((p) => p.role);
      const civCount = roles.filter((r) => r === "CIVILIAN").length;
      const ucCount = roles.filter((r) => r === "UNDERCOVER").length;
      expect(civCount).toBe(3);
      expect(ucCount).toBe(1);

      // Verify words assigned
      const ucPlayer = res.state.players.find((p) => p.role === "UNDERCOVER");
      const civPlayer = res.state.players.find((p) => p.role === "CIVILIAN");
      expect(ucPlayer?.word).toBe(res.state.game?.undercoverWord);
      expect(civPlayer?.word).toBe(res.state.game?.civilianWord);
      expect(res.state.game?.civilianWord).not.toBe(res.state.game?.undercoverWord);
    });

    test("assigns null word to Mr. White", () => {
      const { room } = setup4PlayerLobby(1000);
      // Add 2 more players so n=6, allow 1 undercover + 1 mrWhite (floor(5/2) = 2)
      const room6: Room = {
        ...room,
        settings: {
          ...room.settings,
          undercoverCount: 1,
          mrWhiteCount: 1,
        },
        players: [
          ...room.players,
          { id: "p5", tokenHash: "h5", name: "P5", avatar: avatarFixture, status: "active", presence: "online", joinedAt: 1, lastSeenAt: 1 },
          { id: "p6", tokenHash: "h6", name: "P6", avatar: avatarFixture, status: "active", presence: "online", joinedAt: 1, lastSeenAt: 1 },
        ],
      };
      deepFreeze(room6);

      const ctx = createMockContext({ now: 1000 });
      const res = reduce(room6, { type: "host.start", playerId: "p1" }, ctx);

      expect(res.error).toBeUndefined();
      const mrWhite = res.state.players.find((p) => p.role === "MR_WHITE");
      expect(mrWhite).toBeDefined();
      expect(mrWhite?.word).toBeNull();
    });
  });

  describe("phase progression via TICK", () => {
    test("advances ROLE_REVEAL -> DISCUSSION -> VOTING on timer expiry", () => {
      const { room, ctx } = setup4PlayerLobby(1000);
      const started = reduce(room, { type: "host.start", playerId: "p1" }, ctx);
      expect(started.state.phase).toBe("ROLE_REVEAL");
      expect(started.state.endsAt).toBe(11000);

      // Tick before role reveal expires -> no change
      deepFreeze(started.state);
      const midReveal = reduce(started.state, { type: "tick", now: 10500 }, ctx);
      expect(midReveal.state.phase).toBe("ROLE_REVEAL");

      // Tick at/after role reveal expiry (11000) -> transitions to DISCUSSION
      deepFreeze(midReveal.state);
      const toDiscussion = reduce(midReveal.state, { type: "tick", now: 11000 }, ctx);
      expect(toDiscussion.state.phase).toBe("DISCUSSION");
      expect(toDiscussion.state.endsAt).toBe(11000 + 180000); // 180s discussion

      // Tick at discussion expiry -> transitions to VOTING
      deepFreeze(toDiscussion.state);
      const toVoting = reduce(toDiscussion.state, { type: "tick", now: 191000 }, ctx);
      expect(toVoting.state.phase).toBe("VOTING");
      expect(toVoting.state.endsAt).toBe(191000 + 60000); // 60s voting
    });
  });

  describe("pause and resume controls", () => {
    test("host can pause and resume discussion timer", () => {
      const { room, ctx } = setup4PlayerLobby(1000);
      const started = reduce(room, { type: "host.start", playerId: "p1" }, ctx);
      const inDiscussion = reduce(started.state, { type: "tick", now: 11000 }, ctx);
      deepFreeze(inDiscussion.state);

      // Pause at 50,000 (endsAt is 191,000 -> remaining is 141,000)
      const paused = reduce(
        inDiscussion.state,
        { type: "host.pause", playerId: "p1" },
        createMockContext({ now: 50000 })
      );

      expect(paused.error).toBeUndefined();
      expect(paused.state.paused).toEqual({ remainingMs: 141000 });
      expect(paused.state.endsAt).toBeNull();

      // Tick while paused does not advance phase
      deepFreeze(paused.state);
      const ticked = reduce(
        paused.state,
        { type: "tick", now: 250000 },
        createMockContext({ now: 250000 })
      );
      expect(ticked.state.phase).toBe("DISCUSSION");
      expect(ticked.state.paused?.remainingMs).toBe(141000);

      // Resume at 300,000 -> endsAt becomes 300,000 + 141,000 = 441,000
      deepFreeze(ticked.state);
      const resumed = reduce(
        ticked.state,
        { type: "host.resume", playerId: "p1" },
        createMockContext({ now: 300000 })
      );

      expect(resumed.error).toBeUndefined();
      expect(resumed.state.paused).toBeNull();
      expect(resumed.state.endsAt).toBe(441000);
    });

    test("Amendment 5: pause freezes phase deadlines only; host-reassignment timer keeps running", () => {
      const { room, ctx } = setup4PlayerLobby(1000);
      const started = reduce(room, { type: "host.start", playerId: "p1" }, ctx);
      const inDiscussion = reduce(started.state, { type: "tick", now: 11000 }, ctx);

      // Pause discussion
      const paused = reduce(
        inDiscussion.state,
        { type: "host.pause", playerId: "p1" },
        createMockContext({ now: 20000 })
      );
      expect(paused.state.paused).not.toBeNull();

      // Host disconnects while paused at now = 30000
      const hostAway = {
        ...paused.state,
        players: paused.state.players.map((p) =>
          p.id === "p1"
            ? { ...p, presence: "away" as const, disconnectedAt: 30000 }
            : p
        ),
      };
      deepFreeze(hostAway);

      // nextAlarm must return 30000 + 15000 = 45000 even though phase is paused!
      const alarm = nextAlarm(hostAway);
      expect(alarm).toBe(45000);

      // TICK at 45000 migrates host to p2, while game remains paused!
      const migrated = reduce(
        hostAway,
        { type: "tick", now: 45000 },
        createMockContext({ now: 45000 })
      );

      expect(migrated.state.hostId).toBe("p2");
      expect(migrated.state.paused).not.toBeNull();
      expect(migrated.state.phase).toBe("DISCUSSION");
    });
  });

  describe("host.skip", () => {
    test("host skip in ROLE_REVEAL moves immediately to DISCUSSION", () => {
      const { room, ctx } = setup4PlayerLobby(1000);
      const started = reduce(room, { type: "host.start", playerId: "p1" }, ctx);
      deepFreeze(started.state);

      const skipped = reduce(
        started.state,
        { type: "host.skip", playerId: "p1" },
        createMockContext({ now: 2000 })
      );

      expect(skipped.error).toBeUndefined();
      expect(skipped.state.phase).toBe("DISCUSSION");
      expect(skipped.state.endsAt).toBe(2000 + 180000);
    });

    test("host skip in DISCUSSION moves immediately to VOTING", () => {
      const { room, ctx } = setup4PlayerLobby(1000);
      const started = reduce(room, { type: "host.start", playerId: "p1" }, ctx);
      const inDiscussion = reduce(started.state, { type: "tick", now: 11000 }, ctx);
      deepFreeze(inDiscussion.state);

      const skipped = reduce(
        inDiscussion.state,
        { type: "host.skip", playerId: "p1" },
        createMockContext({ now: 15000 })
      );

      expect(skipped.error).toBeUndefined();
      expect(skipped.state.phase).toBe("VOTING");
      expect(skipped.state.endsAt).toBe(15000 + 60000);
    });
  });

  describe("host.endGame", () => {
    test("host endGame resets to LOBBY, keeps usedPairIds and settings", () => {
      const { room, ctx } = setup4PlayerLobby(1000);
      const started = reduce(room, { type: "host.start", playerId: "p1" }, ctx);
      deepFreeze(started.state);

      const ended = reduce(
        started.state,
        { type: "host.endGame", playerId: "p1" },
        createMockContext({ now: 5000 })
      );

      expect(ended.error).toBeUndefined();
      expect(ended.state.phase).toBe("LOBBY");
      expect(ended.state.endsAt).toBeNull();
      expect(ended.state.paused).toBeNull();
      expect(ended.state.game).toBeUndefined();
      expect(ended.state.usedPairIds.length).toBeGreaterThan(0);
      expect(ended.state.players.every((p) => p.status === "active")).toBe(true);
    });
  });
});
