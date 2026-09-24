import { describe, it, expect } from "bun:test";
import { RoomViewSchema } from "@game/protocol";
import { viewFor, reduce } from "@game/engine";
import { deepFreeze, createMockContext } from "./test-utils";
import type { Room, Player, Role } from "@game/types";

function createSeededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function createViewTestRoom(showRoles = true, phase: Room["phase"] = "DISCUSSION"): Room {
  const avatar = { style: "bottts", seed: "test" };
  const players: Player[] = [
    {
      id: "p1",
      tokenHash: "secret_hash_p1",
      name: "Alice",
      avatar,
      status: "active",
      presence: "online",
      joinedAt: 100,
      lastSeenAt: 100,
      role: "CIVILIAN",
      word: "Croissant",
    },
    {
      id: "p2",
      tokenHash: "secret_hash_p2",
      name: "Bob",
      avatar,
      status: "active",
      presence: "online",
      joinedAt: 200,
      lastSeenAt: 200,
      role: "CIVILIAN",
      word: "Croissant",
    },
    {
      id: "p3",
      tokenHash: "secret_hash_p3",
      name: "Charlie",
      avatar,
      status: "active",
      presence: "online",
      joinedAt: 300,
      lastSeenAt: 300,
      role: "UNDERCOVER",
      word: "Baguette",
    },
    {
      id: "p4",
      tokenHash: "secret_hash_p4",
      name: "Dave",
      avatar,
      status: "active",
      presence: "online",
      joinedAt: 400,
      lastSeenAt: 400,
      role: "MR_WHITE",
      word: null,
    },
    {
      id: "p7",
      tokenHash: "secret_hash_p7",
      name: "Grace",
      avatar,
      status: "active",
      presence: "online",
      joinedAt: 450,
      lastSeenAt: 450,
      role: "CIVILIAN",
      word: "Croissant",
    },
    {
      id: "p8",
      tokenHash: "secret_hash_p8",
      name: "Heidi",
      avatar,
      status: "active",
      presence: "online",
      joinedAt: 480,
      lastSeenAt: 480,
      role: "CIVILIAN",
      word: "Croissant",
    },
    {
      id: "p5",
      tokenHash: "secret_hash_p5",
      name: "Eve",
      avatar,
      status: "waiting",
      presence: "online",
      joinedAt: 500,
      lastSeenAt: 500,
    },
    {
      id: "p6",
      tokenHash: "secret_hash_p6",
      name: "Frank",
      avatar,
      status: "pending",
      presence: "online",
      joinedAt: 600,
      lastSeenAt: 600,
    },
  ];

  return {
    code: "VIEW01",
    createdAt: 1000,
    hostId: "p1",
    locked: false,
    bannedTokenHashes: ["banned_secret_hash"],
    phase,
    round: 1,
    endsAt: 50000,
    paused: null,
    settings: {
      maxPlayers: 10,
      undercoverCount: 1,
      mrWhiteCount: 1,
      discussionSeconds: 180,
      votingSeconds: 60,
      mrWhiteGuessSeconds: 30,
      category: "Bakery",
      difficulty: "easy",
      showRoles,
      requireApproval: true,
    },
    players,
    usedPairIds: ["pair_bakery_1"],
    game: {
      civilianWord: "Croissant",
      undercoverWord: "Baguette",
      pairId: "pair_bakery_1",
      votes: {
        p1: "p3",
        p2: "p3",
      },
    },
  };
}

describe("Phase 7: Player view projection (viewFor)", () => {
  describe("CardView variants and role hiding (Spec §5.1, §7)", () => {
    it("provides correct cards when showRoles is true", () => {
      const room = createViewTestRoom(true);
      deepFreeze(room);

      // Civilian (Alice)
      const vAlice = viewFor(room, "p1");
      expect(vAlice.me.card).toEqual({
        variant: "CIVILIAN",
        word: "Croissant",
        role: "CIVILIAN",
      });

      // Undercover (Charlie)
      const vCharlie = viewFor(room, "p3");
      expect(vCharlie.me.card).toEqual({
        variant: "UNDERCOVER",
        word: "Baguette",
        role: "UNDERCOVER",
      });

      // Mr. White (Dave)
      const vDave = viewFor(room, "p4");
      expect(vDave.me.card).toEqual({
        variant: "MR_WHITE",
        word: null,
        role: "MR_WHITE",
      });
    });

    it("provides WORD_ONLY with NO role field when showRoles is false (Spec §7)", () => {
      const room = createViewTestRoom(false);
      deepFreeze(room);

      // Civilian (Alice)
      const vAlice = viewFor(room, "p1");
      expect(vAlice.me.card).toEqual({
        variant: "WORD_ONLY",
        word: "Croissant",
      });
      expect(vAlice.me.card?.role).toBeUndefined();

      // Undercover (Charlie)
      const vCharlie = viewFor(room, "p3");
      expect(vCharlie.me.card).toEqual({
        variant: "WORD_ONLY",
        word: "Baguette",
      });
      expect(vCharlie.me.card?.role).toBeUndefined();

      // Mr. White (Dave)
      const vDave = viewFor(room, "p4");
      expect(vDave.me.card).toEqual({
        variant: "MR_WHITE",
        word: null,
      });
      expect(vDave.me.card?.role).toBeUndefined();
    });

    it("omits card for waiting, pending, and eliminated players", () => {
      const room = createViewTestRoom(true);
      // Mark Bob eliminated
      room.players[1]!.status = "eliminated";
      room.players[1]!.eliminated = {
        reason: "VOTED",
        round: 1,
        role: "CIVILIAN",
      };
      deepFreeze(room);

      expect(viewFor(room, "p2").me.card).toBeUndefined();
      expect(viewFor(room, "p5").me.card).toBeUndefined();
      expect(viewFor(room, "p6").me.card).toBeUndefined();
    });

    it("omits card in LOBBY phase", () => {
      const room = createViewTestRoom(true, "LOBBY");
      deepFreeze(room);

      expect(viewFor(room, "p1").me.card).toBeUndefined();
    });
  });

  describe("Voting privacy & host-only pendingRequests", () => {
    it("hides other players' votes during VOTING and shows myVote + counts", () => {
      const room = createViewTestRoom(true, "VOTING");
      deepFreeze(room);

      const vAlice = viewFor(room, "p1");
      expect(vAlice.me.myVote).toBe("p3");
      expect(vAlice.votedCount).toBe(2);
      expect(vAlice.totalVoters).toBe(6);

      // Verify other players' votes are NOT in the view
      const json = JSON.stringify(vAlice);
      expect(json.includes('"p2":"p3"')).toBe(false);
      expect(json.includes('"p1":"p3"')).toBe(false);

      const vDave = viewFor(room, "p4"); // Dave hasn't voted yet
      expect(vDave.me.myVote).toBeNull();
    });

    it("only sends pendingRequests to the host", () => {
      const room = createViewTestRoom(true);
      deepFreeze(room);

      // p1 is host
      const hostView = viewFor(room, "p1");
      expect(hostView.pendingRequests).toBeDefined();
      expect(hostView.pendingRequests!.length).toBe(1);
      expect(hostView.pendingRequests![0]!.id).toBe("p6");

      // p2 is not host
      const nonHostView = viewFor(room, "p2");
      expect(nonHostView.pendingRequests).toBeUndefined();
    });
  });

  describe("Property-based leak check and schema validation across simulated steps", () => {
    it("passes RoomViewSchema and guarantees zero secret leakage across multiple games", () => {
      const seeds = [42, 1337, 99999, 20260920];

      for (const seed of seeds) {
        for (const showRoles of [true, false]) {
          const rng = createSeededRng(seed);
          const words = {
            getWordPair: () => ({
              id: `pair_${seed}`,
              category: "Mystery",
              difficulty: "easy" as const,
              a: "SecretCivWord",
              b: "SecretUndercoverWord",
            }),
          };

          const ctx = createMockContext({
            now: 1000,
            rng,
            words,
          });

          // 1. Create room
          const p1Avatar = { style: "bottts", seed: "p1" };
          let room: Room = {
            ...createViewTestRoom(showRoles, "LOBBY"),
            settings: {
              ...createViewTestRoom(showRoles, "LOBBY").settings,
              showRoles,
            },
          };

          // 2. Start game
          const startRes = reduce(room, { type: "host.start", playerId: "p1" }, ctx);
          expect(startRes.error).toBeUndefined();
          room = startRes.state;

          const civilianWord = room.game!.civilianWord;
          const undercoverWord = room.game!.undercoverWord;

          // Check every player's view at ROLE_REVEAL
          for (const p of room.players) {
            const view = viewFor(room, p.id, ctx.now);
            expect(() => RoomViewSchema.parse(view)).not.toThrow();

            const json = JSON.stringify(view);

            // Secret token hashes should never leak
            expect(json.includes("secret_hash")).toBe(false);
            expect(json.includes("banned_secret_hash")).toBe(false);

            // Word leakage checks
            if (p.role === "CIVILIAN") {
              // Civilian must never see undercover word
              expect(json.includes(undercoverWord)).toBe(false);
            } else if (p.role === "UNDERCOVER") {
              // Undercover must never see civilian word
              expect(json.includes(civilianWord)).toBe(false);
            } else if (p.role === "MR_WHITE") {
              // Mr. White must see neither word
              expect(json.includes(civilianWord)).toBe(false);
              expect(json.includes(undercoverWord)).toBe(false);
            } else if (p.status === "waiting" || p.status === "pending") {
              // Spectators / waiting / pending see neither word
              expect(json.includes(civilianWord)).toBe(false);
              expect(json.includes(undercoverWord)).toBe(false);
            }

            // Role leakage check when showRoles is false
            if (!showRoles && p.status === "active") {
              // For living players, "CIVILIAN" and "UNDERCOVER" must never appear
              expect(json.includes('"CIVILIAN"')).toBe(false);
              expect(json.includes('"UNDERCOVER"')).toBe(false);
            }
          }

          // 3. Progress to DISCUSSION
          const tickRes = reduce(
            room,
            { type: "tick", now: room.endsAt! + 1 },
            { ...ctx, now: room.endsAt! + 1 }
          );
          room = tickRes.state;

          // Check views during DISCUSSION
          for (const p of room.players) {
            const view = viewFor(room, p.id, room.endsAt! + 1);
            expect(() => RoomViewSchema.parse(view)).not.toThrow();
          }

          // 4. Progress to VOTING
          const skipRes = reduce(
            room,
            { type: "host.skip", playerId: "p1" },
            { ...ctx, now: room.endsAt! + 2 }
          );
          room = skipRes.state;
          expect(room.phase).toBe("VOTING");

          // Cast a vote
          const voteRes = reduce(
            room,
            { type: "vote.cast", playerId: "p1", payload: { targetId: "p2" } },
            { ...ctx, now: room.endsAt! + 3 }
          );
          room = voteRes.state;

          // Check views during VOTING
          for (const p of room.players) {
            const view = viewFor(room, p.id, room.endsAt! + 3);
            expect(() => RoomViewSchema.parse(view)).not.toThrow();

            const json = JSON.stringify(view);
            // Non-voters must not see p1's target
            if (p.id === "p1") {
              expect(view.me.myVote).toBe("p2");
            } else if (p.status === "active") {
              expect(view.me.myVote).toBeNull();
            } else {
              expect(view.me.myVote).toBeUndefined();
            }
          }
        }
      }
    });
  });
});
