import { describe, expect, test } from "bun:test";
import {
  createRoom,
  reduce,
  matchesTarget,
  evaluateMrWhiteGuess,
} from "@game/engine";
import { createMockContext } from "./test-utils";
import type { Room, Role, WordPair } from "@game/types";

describe("Role Randomness and Civilian Word Assignment Verification", () => {
  const avatarFixture = { style: "bottts", seed: "test" };

  function buildLobbyRoom(): Room {
    const ctx = createMockContext({ now: 1000 });
    let room = createRoom({
      code: "TEST99",
      hostId: "p1",
      hostTokenHash: "h1",
      hostProfile: { name: "Alice", avatar: avatarFixture },
      createdAt: 1000,
    });
    room = {
      ...room,
      settings: { ...room.settings, requireApproval: false },
    };
    const p2Res = reduce(room, {
      type: "hello",
      tokenHash: "h2",
      payload: { code: "TEST99", profile: { name: "Bob", avatar: avatarFixture } },
    }, ctx);
    room = p2Res.state;

    const p3Res = reduce(room, {
      type: "hello",
      tokenHash: "h3",
      payload: { code: "TEST99", profile: { name: "Charlie", avatar: avatarFixture } },
    }, ctx);
    room = p3Res.state;

    const p4Res = reduce(room, {
      type: "hello",
      tokenHash: "h4",
      payload: { code: "TEST99", profile: { name: "Dave", avatar: avatarFixture } },
    }, ctx);
    room = p4Res.state;

    const p5Res = reduce(room, {
      type: "hello",
      tokenHash: "h5",
      payload: { code: "TEST99", profile: { name: "Eve", avatar: avatarFixture } },
    }, ctx);
    room = p5Res.state;

    return room;
  }

  test("50/50 coin flip randomly distributes word a and word b to Civilian and Undercover", () => {
    const room = buildLobbyRoom();
    const mockWordPair: WordPair = {
      id: "pair-food-1",
      category: "Food",
      difficulty: "easy",
      a: "Coffee",
      b: "Tea",
    };

    let wordAAsCivCount = 0;
    let wordBAsCivCount = 0;
    const trials = 100;

    for (let i = 0; i < trials; i++) {
      const ctx = createMockContext({
        now: 1000,
        rng: Math.random, // independent random
        words: { getWordPair: () => mockWordPair },
      });

      const res = reduce(room, { type: "host.start", playerId: "p1" }, ctx);
      expect(res.error).toBeUndefined();
      const civWord = res.state.game?.civilianWord;
      const ucWord = res.state.game?.undercoverWord;

      // Ensure one is Coffee and one is Tea
      expect([civWord, ucWord].sort()).toEqual(["Coffee", "Tea"]);

      // Ensure civilianAliases strictly matches civilianWord
      expect(res.state.game?.civilianAliases).toEqual([civWord!]);

      if (civWord === "Coffee") {
        wordAAsCivCount++;
      } else {
        wordBAsCivCount++;
      }
    }

    // Both words should be assigned to civilian roughly 50% of the time (between 25 and 75 out of 100)
    expect(wordAAsCivCount).toBeGreaterThan(25);
    expect(wordBAsCivCount).toBeGreaterThan(25);
  });

  test("Mr. White guess only matches the civilian word (and never the undercover word or typos)", () => {
    const civilianWord = "Coffee";
    const undercoverWord = "Tea";
    const aliases = [civilianWord];

    // Correct civilian guess
    expect(evaluateMrWhiteGuess("Coffee", civilianWord, aliases)).toBe(true);
    expect(evaluateMrWhiteGuess("coffee", civilianWord, aliases)).toBe(true);
    expect(evaluateMrWhiteGuess("  the COFFEE! ", civilianWord, aliases)).toBe(true);

    // Undercover word must NEVER win for Mr. White
    expect(evaluateMrWhiteGuess(undercoverWord, civilianWord, aliases)).toBe(false);
    expect(evaluateMrWhiteGuess("tea", civilianWord, aliases)).toBe(false);

    // Typos must be rejected (exact normalized match required)
    expect(evaluateMrWhiteGuess("coffe", civilianWord, aliases)).toBe(false);
    expect(evaluateMrWhiteGuess("cofffee", civilianWord, aliases)).toBe(false);
    expect(evaluateMrWhiteGuess("coffie", civilianWord, aliases)).toBe(false);
  });

  test("Roles are distributed across different players with random RNG", () => {
    const room = buildLobbyRoom();
    const mockWordPair: WordPair = {
      id: "pair-food-1",
      category: "Food",
      difficulty: "easy",
      a: "Coffee",
      b: "Tea",
    };

    const undercoverAssignedPlayers = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const ctx = createMockContext({
        now: 1000,
        rng: Math.random,
        words: { getWordPair: () => mockWordPair },
      });

      const res = reduce(room, { type: "host.start", playerId: "p1" }, ctx);
      const ucPlayer = res.state.players.find((p) => p.role === "UNDERCOVER");
      if (ucPlayer) {
        undercoverAssignedPlayers.add(ucPlayer.id);
      }
    }

    // Across 50 games, multiple players should have been Undercover, not just a single player
    expect(undercoverAssignedPlayers.size).toBeGreaterThanOrEqual(4);
  });
});
