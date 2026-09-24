import { describe, it, expect } from "bun:test";
import { deepFreeze, createMockContext } from "./test-utils";
import { reduce } from "./reduce";
import type { Room, Player, Role } from "@game/types";

function createPresenceTestRoom(phase: Room["phase"] = "DISCUSSION"): Room {
  const avatar = { style: "bottts", seed: "test" };
  const players: Player[] = [
    {
      id: "p1",
      tokenHash: "hash_p1",
      name: "Alice (Host)",
      avatar,
      status: "active",
      presence: "online",
      joinedAt: 100,
      lastSeenAt: 100,
      role: "CIVILIAN",
      word: "coffee",
    },
    {
      id: "p2",
      tokenHash: "hash_p2",
      name: "Bob",
      avatar,
      status: "active",
      presence: "online",
      joinedAt: 200,
      lastSeenAt: 200,
      role: "CIVILIAN",
      word: "coffee",
    },
    {
      id: "p3",
      tokenHash: "hash_p3",
      name: "Charlie",
      avatar,
      status: "active",
      presence: "online",
      joinedAt: 300,
      lastSeenAt: 300,
      role: "CIVILIAN",
      word: "coffee",
    },
    {
      id: "p4",
      tokenHash: "hash_p4",
      name: "Dave",
      avatar,
      status: "active",
      presence: "online",
      joinedAt: 400,
      lastSeenAt: 400,
      role: "UNDERCOVER",
      word: "tea",
    },
  ];

  return {
    code: "PRES01",
    createdAt: 1000,
    hostId: "p1",
    locked: false,
    bannedTokenHashes: [],
    phase,
    round: 1,
    endsAt: 50000,
    paused: null,
    settings: {
      maxPlayers: 10,
      undercoverCount: 1,
      mrWhiteCount: 0,
      discussionSeconds: 180,
      votingSeconds: 60,
      mrWhiteGuessSeconds: 30,
      category: "Drinks",
      difficulty: "easy",
      showRoles: true,
      requireApproval: false,
    },
    players,
    usedPairIds: ["pair_1"],
    game: {
      civilianWord: "coffee",
      undercoverWord: "tea",
      pairId: "pair_1",
      votes: {},
    },
  };
}

describe("Phase 6: Presence and host migration", () => {
  describe("connect action", () => {
    it("reconnects an away player in lobby: becomes active and clears disconnectedAt", () => {
      const room = createPresenceTestRoom("LOBBY");
      room.players[1]!.presence = "away";
      room.players[1]!.disconnectedAt = 5000;
      deepFreeze(room);

      const ctx = createMockContext({ now: 10000 });
      const result = reduce(room, { type: "connect", playerId: "p2" }, ctx);

      expect(result.error).toBeUndefined();
      const p2 = result.state.players.find((p) => p.id === "p2")!;
      expect(p2.presence).toBe("online");
      expect(p2.status).toBe("active");
      expect(p2.disconnectedAt).toBeUndefined();
      expect(p2.lastSeenAt).toBe(10000);
    });

    it("reconnects an away player in game: remains active and clears disconnectedAt", () => {
      const room = createPresenceTestRoom("DISCUSSION");
      room.players[2]!.presence = "away";
      room.players[2]!.disconnectedAt = 5000;
      deepFreeze(room);

      const ctx = createMockContext({ now: 10000 });
      const result = reduce(room, { type: "connect", playerId: "p3" }, ctx);

      expect(result.error).toBeUndefined();
      const p3 = result.state.players.find((p) => p.id === "p3")!;
      expect(p3.presence).toBe("online");
      expect(p3.status).toBe("active");
      expect(p3.disconnectedAt).toBeUndefined();
    });

    it("does not restore host status to old host upon reconnecting (Spec §10.2)", () => {
      const room = createPresenceTestRoom("DISCUSSION");
      room.hostId = "p2"; // Host migrated to p2
      room.players[0]!.presence = "away"; // Old host p1 was away
      room.players[0]!.disconnectedAt = 1000;
      deepFreeze(room);

      const ctx = createMockContext({ now: 20000 });
      const result = reduce(room, { type: "connect", playerId: "p1" }, ctx);

      expect(result.error).toBeUndefined();
      expect(result.state.hostId).toBe("p2"); // Remains p2
      const p1 = result.state.players.find((p) => p.id === "p1")!;
      expect(p1.presence).toBe("online");
    });

    it("is idempotent when player is already online", () => {
      const room = createPresenceTestRoom("LOBBY");
      deepFreeze(room);

      const ctx = createMockContext();
      const result = reduce(room, { type: "connect", playerId: "p1" }, ctx);

      expect(result.error).toBeUndefined();
      expect(result.state).toBe(room);
    });
  });

  describe("disconnect action", () => {
    it("marks player away and keeps active status in lobby", () => {
      const room = createPresenceTestRoom("LOBBY");
      deepFreeze(room);

      const ctx = createMockContext({ now: 15000 });
      const result = reduce(room, { type: "disconnect", playerId: "p2" }, ctx);

      expect(result.error).toBeUndefined();
      const p2 = result.state.players.find((p) => p.id === "p2")!;
      expect(p2.presence).toBe("away");
      expect(p2.status).toBe("active");
      expect(p2.disconnectedAt).toBe(15000);
    });

    it("marks player away but keeps active status in game", () => {
      const room = createPresenceTestRoom("DISCUSSION");
      deepFreeze(room);

      const ctx = createMockContext({ now: 15000 });
      const result = reduce(room, { type: "disconnect", playerId: "p3" }, ctx);

      expect(result.error).toBeUndefined();
      const p3 = result.state.players.find((p) => p.id === "p3")!;
      expect(p3.presence).toBe("away");
      expect(p3.status).toBe("active"); // Stays active in game until round ends
      expect(p3.disconnectedAt).toBe(15000);
    });

    it("is idempotent when player is already away", () => {
      const room = createPresenceTestRoom("DISCUSSION");
      room.players[1]!.presence = "away";
      room.players[1]!.disconnectedAt = 1000;
      deepFreeze(room);

      const ctx = createMockContext({ now: 2000 });
      const result = reduce(room, { type: "disconnect", playerId: "p2" }, ctx);

      expect(result.error).toBeUndefined();
      expect(result.state).toBe(room);
    });
  });

  describe("Host migration (Spec §10.2)", () => {
    it("migrates host to earliest-joined connected admitted player after 15s away", () => {
      const room = createPresenceTestRoom("DISCUSSION");
      room.players[0]!.presence = "away";
      room.players[0]!.disconnectedAt = 10000;
      deepFreeze(room);

      // At 10000 + 14999 ms: not yet migrated
      const ctxEarly = createMockContext({ now: 24999 });
      const resEarly = reduce(room, { type: "tick" }, ctxEarly);
      expect(resEarly.state.hostId).toBe("p1");

      // At 10000 + 15000 ms: migrates to p2 (earliest joined connected alive player)
      const ctxDue = createMockContext({ now: 25000 });
      const resDue = reduce(room, { type: "tick" }, ctxDue);
      expect(resDue.state.hostId).toBe("p2");
    });

    it("prefers alive player over eliminated player, even if eliminated joined earlier", () => {
      const room = createPresenceTestRoom("DISCUSSION");
      room.players[0]!.presence = "away";
      room.players[0]!.disconnectedAt = 10000;
      // p2 joined at 200, but is eliminated
      room.players[1]!.status = "eliminated";
      // p3 joined at 300, is active
      room.players[2]!.status = "active";
      deepFreeze(room);

      const ctx = createMockContext({ now: 25000 });
      const result = reduce(room, { type: "tick" }, ctx);

      expect(result.state.hostId).toBe("p3"); // Alive preferred over p2
    });

    it("never selects pending player for host", () => {
      const room = createPresenceTestRoom("DISCUSSION");
      room.players[0]!.presence = "away";
      room.players[0]!.disconnectedAt = 10000;
      // p2 is pending
      room.players[1]!.status = "pending";
      // p3 is away
      room.players[2]!.presence = "away";
      // p4 is active and online
      deepFreeze(room);

      const ctx = createMockContext({ now: 25000 });
      const result = reduce(room, { type: "tick" }, ctx);

      expect(result.state.hostId).toBe("p4"); // p4 selected, not pending p2 or away p3
    });

    it("removes away player from lobby after 15s disconnect grace (Spec §10.2)", () => {
      const room = createPresenceTestRoom("LOBBY");
      room.players[1]!.presence = "away";
      room.players[1]!.disconnectedAt = 10000;
      deepFreeze(room);

      // At 10000 + 14999 ms: player still in lobby
      const ctxBefore = createMockContext({ now: 24999 });
      const resBefore = reduce(room, { type: "tick" }, ctxBefore);
      expect(resBefore.state.players.some((p) => p.id === "p2")).toBe(true);

      // At 10000 + 15000 ms: player removed from roster
      const ctxAfter = createMockContext({ now: 25000 });
      const resAfter = reduce(room, { type: "tick" }, ctxAfter);
      expect(resAfter.state.players.some((p) => p.id === "p2")).toBe(false);
    });
  });

  describe("Voluntary leave action", () => {
    it("removes player from room in lobby", () => {
      const room = createPresenceTestRoom("LOBBY");
      deepFreeze(room);

      const ctx = createMockContext();
      const result = reduce(room, { type: "leave", playerId: "p2" }, ctx);

      expect(result.error).toBeUndefined();
      expect(result.state.players.some((p) => p.id === "p2")).toBe(false);
      expect(result.effects).toEqual([
        { type: "close", playerId: "p2", reason: "left" },
      ]);
    });

    it("migrates host immediately if host leaves in lobby", () => {
      const room = createPresenceTestRoom("LOBBY");
      deepFreeze(room);

      const ctx = createMockContext();
      const result = reduce(room, { type: "leave", playerId: "p1" }, ctx);

      expect(result.error).toBeUndefined();
      expect(result.state.hostId).toBe("p2");
      expect(result.state.players.some((p) => p.id === "p1")).toBe(false);
    });

    it("migrates to oldest admitted player if host leaves and literally everyone else is away (Spec §10.3)", () => {
      const room = createPresenceTestRoom("LOBBY");
      room.players[1]!.presence = "away"; // p2 joined at 200
      room.players[2]!.presence = "away"; // p3 joined at 300
      room.players[3]!.presence = "away"; // p4 joined at 400
      deepFreeze(room);

      const ctx = createMockContext();
      const result = reduce(room, { type: "leave", playerId: "p1" }, ctx);

      expect(result.error).toBeUndefined();
      // Should pick p2 (oldest admitted player) even though p2 is away
      expect(result.state.hostId).toBe("p2");
    });

    it("eliminates active player immediately with LEFT and runs win check in game", () => {
      const room = createPresenceTestRoom("DISCUSSION");
      deepFreeze(room);

      const ctx = createMockContext();
      // Dave (p4, only Undercover) leaves
      const result = reduce(room, { type: "leave", playerId: "p4" }, ctx);

      expect(result.error).toBeUndefined();
      const p4 = result.state.players.find((p) => p.id === "p4")!;
      expect(p4.status).toBe("eliminated");
      expect(p4.eliminated?.reason).toBe("LEFT");

      // Dave was the only infiltrator -> Civilians win immediately!
      expect(result.state.phase).toBe("GAME_OVER");
      expect(result.state.game?.gameOver?.winner).toBe("CIVILIANS");
      expect(result.state.game?.gameOver?.reason).toBe(
        "ALL_INFILTRATORS_ELIMINATED"
      );
    });

    it("triggers Infiltrators win if civilian leave causes infiltrators >= civilians", () => {
      const room = createPresenceTestRoom("DISCUSSION");
      // 3 Civilians (p1, p2, p3), 1 Undercover (p4)
      // If p2 was already eliminated, alive: 2 Civ (p1, p3), 1 Inf (p4)
      room.players[1]!.status = "eliminated";
      deepFreeze(room);

      const ctx = createMockContext();
      // p3 leaves -> alive: 1 Civ (p1), 1 Inf (p4) -> 1 >= 1 -> Infiltrators win!
      const result = reduce(room, { type: "leave", playerId: "p3" }, ctx);

      expect(result.error).toBeUndefined();
      expect(result.state.phase).toBe("GAME_OVER");
      expect(result.state.game?.gameOver?.winner).toBe("INFILTRATORS");
      expect(result.state.game?.gameOver?.reason).toBe(
        "INFILTRATORS_EQUAL_OR_GREATER"
      );
    });

    it("voids votes cast by and for the leaving player during VOTING", () => {
      const room = createPresenceTestRoom("VOTING");
      room.game!.votes = {
        p1: "p2",
        p2: "p1",
        p3: "p2",
      };
      deepFreeze(room);

      const ctx = createMockContext();
      const result = reduce(room, { type: "leave", playerId: "p2" }, ctx);

      expect(result.error).toBeUndefined();
      // p2's vote is voided, and votes FOR p2 (from p1 and p3) are voided
      expect(result.state.game?.votes).toEqual({});
    });
  });

  describe("Host kick in game with immediate win check", () => {
    it("eliminates kicked player with KICKED and triggers win check", () => {
      const room = createPresenceTestRoom("DISCUSSION");
      deepFreeze(room);

      const ctx = createMockContext();
      // Host p1 kicks the only Undercover p4
      const result = reduce(
        room,
        { type: "host.kick", playerId: "p1", payload: { playerId: "p4" } },
        ctx
      );

      expect(result.error).toBeUndefined();
      const p4 = result.state.players.find((p) => p.id === "p4")!;
      expect(p4.status).toBe("eliminated");
      expect(p4.eliminated?.reason).toBe("KICKED");
      expect(result.state.bannedTokenHashes).toContain("hash_p4");

      // Dave was the only infiltrator -> Civilians win immediately!
      expect(result.state.phase).toBe("GAME_OVER");
      expect(result.state.game?.gameOver?.winner).toBe("CIVILIANS");
    });
  });
});
