import { describe, expect, test } from "bun:test";
import {
  normalizeText,
  levenshteinDistance,
  evaluateMrWhiteGuess,
} from "./rules/mrwhite";
import { createRoom } from "./state/create-room";
import { reduce } from "./reduce";
import { deepFreeze, createMockContext } from "./test-utils";
import type { Room, Role, GameData } from "@game/types";

describe("Phase 4: Mr. White Guess and Normalization", () => {
  describe("Normalization & Matching (Table-Driven)", () => {
    const tableCases: Array<{
      desc: string;
      guess: string;
      target: string;
      aliases?: string[];
      expected: boolean;
    }> = [
      // Exact & Case
      { desc: "exact match", guess: "Coffee", target: "Coffee", expected: true },
      { desc: "case-insensitive", guess: "coffee", target: "Coffee", expected: true },
      { desc: "all uppercase", guess: "COFFEE", target: "coffee", expected: true },

      // Whitespace & Punctuation
      { desc: "leading and trailing whitespace", guess: "  coffee  ", target: "coffee", expected: true },
      { desc: "collapsed multiple spaces", guess: "ice   cream", target: "ice cream", expected: true },
      { desc: "hyphen and punctuation", guess: "ice-cream!", target: "ice cream", expected: true },
      { desc: "apostrophe and quotes", guess: "rock 'n' roll", target: "rock n roll", expected: true },

      // Accents & Diacritics
      { desc: "french accents (café -> cafe)", guess: "café", target: "cafe", expected: true },
      { desc: "complex accents (crème brûlée)", guess: "crème brûlée", target: "creme brulee", expected: true },
      { desc: "target with accent, guess without", guess: "cafe", target: "café", expected: true },

      // Leading Articles (the, a, an)
      { desc: "drop 'the'", guess: "the coffee", target: "coffee", expected: true },
      { desc: "drop 'a'", guess: "a banana", target: "banana", expected: true },
      { desc: "drop 'an'", guess: "an apple", target: "apple", expected: true },
      { desc: "target has article, guess does not", guess: "apple", target: "an apple", expected: true },

      // Simple Plurals
      { desc: "plural guess (apples -> apple)", guess: "apples", target: "apple", expected: true },
      { desc: "singular guess (apple -> apples)", guess: "apple", target: "apples", expected: true },
      { desc: "es plural (boxes -> box)", guess: "boxes", target: "box", expected: true },
      { desc: "es plural (tomatoes -> tomato)", guess: "tomatoes", target: "tomato", expected: true },

      // Aliases
      { desc: "match primary alias", guess: "espresso", target: "coffee", aliases: ["espresso", "latte"], expected: true },
      { desc: "match secondary alias with formatting", guess: "  The Latte! ", target: "coffee", aliases: ["espresso", "latte"], expected: true },

      // Edit distance <= 1 for words >= 5 letters
      { desc: "1 typo insertion on 6-letter word (bananna -> banana)", guess: "bananna", target: "banana", expected: true },
      { desc: "1 typo omission on 6-letter word (banan -> banana)", guess: "banan", target: "banana", expected: true },
      { desc: "1 typo substitution on 6-letter word (banama -> banana)", guess: "banama", target: "banana", expected: true },
      { desc: "2 typos on 6-letter word (bannnaa -> banana)", guess: "bannnaa", target: "banana", expected: false },

      // Edit distance NOT allowed for words < 5 letters
      { desc: "1 typo on 3-letter word rejected (cot -> cat)", guess: "cot", target: "cat", expected: false },
      { desc: "1 typo on 4-letter word rejected (dock -> duck)", guess: "dock", target: "duck", expected: false },

      // Non-matches
      { desc: "completely different word", guess: "tea", target: "coffee", expected: false },
      { desc: "empty guess", guess: "   ", target: "coffee", expected: false },
    ];

    for (const tc of tableCases) {
      test(tc.desc, () => {
        const result = evaluateMrWhiteGuess(tc.guess, tc.target, tc.aliases ?? []);
        expect(result).toBe(tc.expected);
      });
    }
  });

  describe("MRWHITE_GUESS Phase and Reducer", () => {
    const avatarFixture = { style: "bottts", seed: "test" };

    function setupMrWhiteGuessRoom(): { room: Room; ctx: ReturnType<typeof createMockContext> } {
      const ctx = createMockContext({ now: 20000 });
      const players = [
        { id: "p1", tokenHash: "h1", name: "Alice", avatar: avatarFixture, status: "active" as const, presence: "online" as const, joinedAt: 1, lastSeenAt: 1, role: "CIVILIAN" as Role, word: "Coffee" },
        { id: "p2", tokenHash: "h2", name: "Bob", avatar: avatarFixture, status: "active" as const, presence: "online" as const, joinedAt: 2, lastSeenAt: 2, role: "CIVILIAN" as Role, word: "Coffee" },
        { id: "p3", tokenHash: "h3", name: "Charlie", avatar: avatarFixture, status: "active" as const, presence: "online" as const, joinedAt: 3, lastSeenAt: 3, role: "CIVILIAN" as Role, word: "Coffee" },
        { id: "p4", tokenHash: "h4", name: "Dave", avatar: avatarFixture, status: "eliminated" as const, presence: "online" as const, joinedAt: 4, lastSeenAt: 4, role: "MR_WHITE" as Role, word: null, eliminated: { reason: "VOTED" as const, round: 1, role: "MR_WHITE" as Role } },
      ];

      const game: GameData = {
        civilianWord: "Coffee",
        undercoverWord: "Tea",
        pairId: "pair-1",
        votes: { p1: "p4", p2: "p4", p3: "p4" },
        civilianAliases: ["Espresso"],
        lastElimination: {
          eliminations: [{ id: "p4", role: "MR_WHITE", reason: "VOTED", voteCounts: { p4: 3 } }],
          isTie: false,
          voteCounts: { p4: 3 },
          eliminatedId: "p4",
          role: "MR_WHITE",
          reason: "VOTED",
        },
      };

      const room: Room = {
        code: "ABCDEF",
        createdAt: 1000,
        hostId: "p1",
        locked: false,
        bannedTokenHashes: [],
        settings: {
          requireApproval: false,
          undercoverCount: 0,
          mrWhiteCount: 1,
          category: "Food",
          difficulty: "medium",
          showRoles: false,
          discussionSeconds: 180,
          votingSeconds: 60,
          mrWhiteGuessSeconds: 30,
          maxPlayers: 12,
        },
        players,
        phase: "MRWHITE_GUESS",
        round: 1,
        endsAt: 20000 + 30000,
        paused: null,
        usedPairIds: ["pair-1"],
        game,
      };

      return { room, ctx };
    }

    test("correct guess -> Infiltrators win immediately with MR_WHITE_GUESSED", () => {
      const { room, ctx } = setupMrWhiteGuessRoom();
      deepFreeze(room);

      const res = reduce(
        room,
        { type: "mrwhite.guess", playerId: "p4", payload: { text: "coffee" } },
        ctx
      );

      expect(res.error).toBeUndefined();
      expect(res.state.phase).toBe("GAME_OVER");
      expect(res.state.endsAt).toBeNull();
      // Civilians eliminated Mr. White, but correct guess inverted the victory!
      expect(res.state.game?.lastElimination).toBeDefined();
    });

    test("correct guess via alias -> Infiltrators win", () => {
      const { room, ctx } = setupMrWhiteGuessRoom();
      deepFreeze(room);

      const res = reduce(
        room,
        { type: "mrwhite.guess", playerId: "p4", payload: { text: "Espresso" } },
        ctx
      );

      expect(res.error).toBeUndefined();
      expect(res.state.phase).toBe("GAME_OVER");
    });

    test("wrong guess -> continues to win check (Civilians win since infiltrator is eliminated)", () => {
      const { room, ctx } = setupMrWhiteGuessRoom();
      deepFreeze(room);

      const res = reduce(
        room,
        { type: "mrwhite.guess", playerId: "p4", payload: { text: "Banana" } },
        ctx
      );

      expect(res.error).toBeUndefined();
      // Dave was the only infiltrator, so after wrong guess, Civilians win!
      expect(res.state.phase).toBe("GAME_OVER");
    });

    test("wrong guess when other infiltrators remain alive -> advances to next DISCUSSION", () => {
      const { room, ctx } = setupMrWhiteGuessRoom();
      // Add an active Undercover player (p5) so infiltrators remain
      const roomWithUndercover: Room = {
        ...room,
        players: [
          ...room.players,
          { id: "p5", tokenHash: "h5", name: "Eve", avatar: avatarFixture, status: "active" as const, presence: "online" as const, joinedAt: 5, lastSeenAt: 5, role: "UNDERCOVER" as Role, word: "Tea" },
        ],
      };
      deepFreeze(roomWithUndercover);

      const res = reduce(
        roomWithUndercover,
        { type: "mrwhite.guess", playerId: "p4", payload: { text: "Water" } },
        ctx
      );

      expect(res.error).toBeUndefined();
      expect(res.state.phase).toBe("DISCUSSION");
      expect(res.state.round).toBe(2);
      expect(res.state.endsAt).toBe(ctx.now + 180000);
    });

    test("guess timeout on TICK -> continues to win check", () => {
      const { room, ctx } = setupMrWhiteGuessRoom();
      deepFreeze(room);

      // endsAt is 50000. TICK at 50000
      const res = reduce(
        room,
        { type: "tick", now: 50000 },
        createMockContext({ now: 50000 })
      );

      expect(res.error).toBeUndefined();
      // No guess was made in time, win check evaluated -> Civilians win
      expect(res.state.phase).toBe("GAME_OVER");
    });

    test("non-eliminated or non-MrWhite player cannot guess", () => {
      const { room, ctx } = setupMrWhiteGuessRoom();
      deepFreeze(room);

      const res = reduce(
        room,
        { type: "mrwhite.guess", playerId: "p1", payload: { text: "coffee" } },
        ctx
      );

      expect(res.error?.code).toBe("FORBIDDEN");
      expect(res.state.phase).toBe("MRWHITE_GUESS");
    });

    test("late guess after timer expiry rejected", () => {
      const { room } = setupMrWhiteGuessRoom();
      // now is 51000 > endsAt 50000
      const lateCtx = createMockContext({ now: 51000 });
      deepFreeze(room);

      const res = reduce(
        room,
        { type: "mrwhite.guess", playerId: "p4", payload: { text: "coffee" } },
        lateCtx
      );

      expect(res.error?.code).toBe("TIMER_EXPIRED");
    });
  });
});
