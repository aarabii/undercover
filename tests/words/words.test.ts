import { describe, expect, test } from "bun:test";
import {
  WORD_PAIRS,
  EASY_PAIRS,
  MEDIUM_PAIRS,
  HARD_PAIRS,
  EXPERT_PAIRS,
  PARTY_PAIRS,
  FAN_FAV_PAIRS,
  getWordPairsForDifficulty,
  getWordPair,
  CATEGORIES,
} from "@game/words";

describe("Word Bank Data Integrity", () => {
  test("loads all 6 word difficulty tiers with expected counts", () => {
    expect(EASY_PAIRS.length).toBe(150);
    expect(MEDIUM_PAIRS.length).toBe(150);
    expect(HARD_PAIRS.length).toBe(150);
    expect(EXPERT_PAIRS.length).toBe(150);
    expect(PARTY_PAIRS.length).toBe(150);
    expect(FAN_FAV_PAIRS.length).toBe(80);
    expect(WORD_PAIRS.length).toBe(830);
  });

  test("all 830 word pairs have unique IDs", () => {
    const ids = new Set(WORD_PAIRS.map((p) => p.id));
    expect(ids.size).toBe(830);
  });

  test("all 15 categories are present in CATEGORIES", () => {
    expect(CATEGORIES.length).toBe(15);
    expect(CATEGORIES).toContain("Food");
    expect(CATEGORIES).toContain("Animals");
    expect(CATEGORIES).toContain("Sports");
    expect(CATEGORIES).toContain("PopCulture");
    expect(CATEGORIES).toContain("Funny");
    expect(CATEGORIES).toContain("JobsAndRoles");
    expect(CATEGORIES).toContain("TravelAndNature");
    expect(CATEGORIES).toContain("Gaming");
    expect(CATEGORIES).toContain("MoviesAndSeries");
    expect(CATEGORIES).toContain("FamousPersons");
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
    const expert = getWordPairsForDifficulty("expert");
    const party = getWordPairsForDifficulty("party");
    const mixed = getWordPairsForDifficulty("mixed");

    expect(easy.length).toBe(150);
    // Medium includes 150 medium + 80 fan_fav = 230
    expect(medium.length).toBe(230);
    // Hard includes 150 hard + 80 fan_fav = 230
    expect(hard.length).toBe(230);
    expect(expert.length).toBe(150);
    expect(party.length).toBe(150);
    // Mixed includes all 830 unique pairs
    expect(mixed.length).toBe(830);

    // Verify fan favorites are in both medium and hard query sets
    const fanFavId = FAN_FAV_PAIRS[0].id;
    expect(medium.some((p) => p.id === fanFavId)).toBe(true);
    expect(hard.some((p) => p.id === fanFavId)).toBe(true);
    expect(easy.some((p) => p.id === fanFavId)).toBe(false);
    expect(expert.some((p) => p.id === fanFavId)).toBe(false);
    expect(party.some((p) => p.id === fanFavId)).toBe(false);
  });
});

describe("Word Bank Selection", () => {
  test("getWordPair selects a pair without accept property", () => {
    const pair = getWordPair("Food", "easy");
    expect(pair).toBeDefined();
    expect(pair.accept).toBeUndefined();
    expect(pair.a).toBeDefined();
    expect(pair.b).toBeDefined();
  });

  test("getWordPair respects category and difficulty filters including new categories and difficulties", () => {
    const pair = getWordPair("Animals", "easy");
    expect(pair.category).toBe("Animals");
    expect(pair.difficulty).toBe("easy");

    const gamingExpert = getWordPair("Gaming", "expert");
    expect(gamingExpert.category).toBe("Gaming");
    expect(gamingExpert.difficulty).toBe("expert");

    const moviesParty = getWordPair("MoviesAndSeries", "party");
    expect(moviesParty.category).toBe("MoviesAndSeries");
    expect(moviesParty.difficulty).toBe("party");

    const famousEasy = getWordPair("FamousPersons", "easy");
    expect(famousEasy.category).toBe("FamousPersons");
    expect(famousEasy.difficulty).toBe("easy");
  });

  test("respects deterministic injected RNG for pair selection", () => {
    const rng = () => 0.0;
    const pair = getWordPair("Animals", "easy", [], rng);
    const animalEasy = EASY_PAIRS.filter((p) => p.category === "Animals");
    expect(pair.id).toBe(animalEasy[0].id);
  });
});
