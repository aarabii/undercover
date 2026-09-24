import { describe, expect, test } from "bun:test";
import {
  WORD_PAIRS,
  EASY_PAIRS,
  MEDIUM_PAIRS,
  HARD_PAIRS,
  FAN_FAV_PAIRS,
  getWordPairsForDifficulty,
  getWordPair,
  CATEGORIES,
} from "@game/words";

describe("Word Bank Data Integrity", () => {
  test("loads all 4 word categories with expected counts", () => {
    expect(EASY_PAIRS.length).toBe(70);
    expect(MEDIUM_PAIRS.length).toBe(70);
    expect(HARD_PAIRS.length).toBe(70);
    expect(FAN_FAV_PAIRS.length).toBe(50);
    expect(WORD_PAIRS.length).toBe(260);
  });

  test("all 260 word pairs have unique IDs", () => {
    const ids = new Set(WORD_PAIRS.map((p) => p.id));
    expect(ids.size).toBe(260);
  });

  test("all 12 categories are present in CATEGORIES", () => {
    expect(CATEGORIES.length).toBe(12);
    expect(CATEGORIES).toContain("Food");
    expect(CATEGORIES).toContain("Animals");
    expect(CATEGORIES).toContain("Sports");
    expect(CATEGORIES).toContain("PopCulture");
    expect(CATEGORIES).toContain("Funny");
    expect(CATEGORIES).toContain("JobsAndRoles");
    expect(CATEGORIES).toContain("TravelAndNature");
  });

  test("every pair belongs to a recognized category and has non-empty words", () => {
    for (const pair of WORD_PAIRS) {
      expect(CATEGORIES).toContain(pair.category as any);
      expect(pair.a.trim().length).toBeGreaterThan(0);
      expect(pair.b.trim().length).toBeGreaterThan(0);
      expect(pair.a).not.toBe(pair.b);
    }
  });

  test("fan favorites belong to both medium and hard difficulties", () => {
    for (const pair of FAN_FAV_PAIRS) {
      expect(pair.difficulties).toEqual(["medium", "hard"]);
    }
  });

  test("difficulty querying returns expected totals", () => {
    const easy = getWordPairsForDifficulty("easy");
    const medium = getWordPairsForDifficulty("medium");
    const hard = getWordPairsForDifficulty("hard");
    const mixed = getWordPairsForDifficulty("mixed");

    expect(easy.length).toBe(70);
    // Medium includes 70 medium + 50 fan_fav = 120
    expect(medium.length).toBe(120);
    // Hard includes 70 hard + 50 fan_fav = 120
    expect(hard.length).toBe(120);
    // Mixed includes all 260 unique pairs
    expect(mixed.length).toBe(260);

    // Verify fan favorites are in both medium and hard query sets
    const fanFavId = FAN_FAV_PAIRS[0].id;
    expect(medium.some((p) => p.id === fanFavId)).toBe(true);
    expect(hard.some((p) => p.id === fanFavId)).toBe(true);
    expect(easy.some((p) => p.id === fanFavId)).toBe(false);
  });
});

describe("Word Assignment & Random 50/50 Distribution", () => {
  test("getWordPair assigns dynamic accept equal to civilian word (a)", () => {
    const pair = getWordPair("Food", "easy");
    expect(pair).toBeDefined();
    expect(pair.accept).toBe(pair.a);
  });

  test("getWordPair randomly flips words so pair order is not deterministic", () => {
    // Pick the same category and difficulty 200 times and observe the distribution of flipped order
    let word1FirstCount = 0;
    let word2FirstCount = 0;
    const trials = 200;

    // Fixed mock pair data to isolate flip behavior
    for (let i = 0; i < trials; i++) {
      const pair = getWordPair("Animals", "easy", [], Math.random);
      // Look up raw pair
      const raw = EASY_PAIRS.find((p) => p.id === pair.id)!;
      if (pair.a === raw.a) {
        word1FirstCount++;
      } else {
        word2FirstCount++;
      }
    }

    // Over 200 trials with p = 0.5, each should easily be between 25% and 75%
    expect(word1FirstCount).toBeGreaterThan(50);
    expect(word2FirstCount).toBeGreaterThan(50);
  });

  test("respects deterministic injected RNG", () => {
    // When rng always returns < 0.5 for flip
    const rng1 = () => 0.1;
    const pair1 = getWordPair("Animals", "easy", [], rng1);
    const raw = EASY_PAIRS.find((p) => p.id === pair1.id)!;
    expect(pair1.a).toBe(raw.a);
    expect(pair1.b).toBe(raw.b);

    // When rng returns >= 0.5 for flip
    let callCount = 0;
    const rng2 = () => {
      callCount++;
      return callCount === 1 ? 0.0 : 0.9; // 0.0 picks first element, 0.9 causes flip
    };
    const pair2 = getWordPair("Animals", "easy", [], rng2);
    const raw2 = EASY_PAIRS.find((p) => p.id === pair2.id)!;
    expect(pair2.a).toBe(raw2.b);
    expect(pair2.b).toBe(raw2.a);
  });
});
