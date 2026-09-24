import type { WordPair, Difficulty } from "@game/types";
import { EASY_WORDS } from "./easy";
import { MEDIUM_WORDS } from "./medium";
import { HARD_WORDS } from "./hard";
import { FAN_FAVORITE_WORDS } from "./fan_fav";

type RawCategoryMap = Record<string, Array<{ word1: string; word2: string }>>;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function processPairs(
  data: RawCategoryMap,
  prefix: string,
  difficulty: Difficulty,
  difficulties?: Difficulty[]
): WordPair[] {
  const result: WordPair[] = [];
  for (const [category, pairs] of Object.entries(data)) {
    const catSlug = slugify(category);
    pairs.forEach((pair, idx) => {
      result.push({
        id: `${prefix}-${catSlug}-${idx + 1}`,
        category,
        difficulty,
        difficulties,
        a: pair.word1,
        b: pair.word2,
      });
    });
  }
  return result;
}

export const EASY_PAIRS = processPairs(EASY_WORDS, "easy", "easy");
export const MEDIUM_PAIRS = processPairs(MEDIUM_WORDS, "med", "medium");
export const HARD_PAIRS = processPairs(HARD_WORDS, "hard", "hard");
// Words in fan favorite belong to both medium and hard difficulties
export const FAN_FAV_PAIRS = processPairs(
  FAN_FAVORITE_WORDS,
  "fanfav",
  "medium",
  ["medium", "hard"]
);

/**
 * All unique word pairs across all difficulty tiers.
 * For 'mixed' difficulty, all 260 pairs are available without duplicates.
 */
export const WORD_PAIRS: WordPair[] = [
  ...EASY_PAIRS,
  ...MEDIUM_PAIRS,
  ...HARD_PAIRS,
  ...FAN_FAV_PAIRS,
];

/**
 * Helper to fetch all candidate word pairs for a given difficulty tier.
 * Fan favorites belong to both 'medium' and 'hard', and 'mixed' includes all pairs.
 */
export function getWordPairsForDifficulty(difficulty: Difficulty): WordPair[] {
  if (difficulty === "mixed") {
    return WORD_PAIRS;
  }
  return WORD_PAIRS.filter(
    (p) => p.difficulty === difficulty || p.difficulties?.includes(difficulty)
  );
}
