import type { WordPair, Difficulty } from "@game/types";
import { WORD_PAIRS } from "../data/words";

export function getWordPair(
  category: string = "random",
  difficulty: Difficulty = "mixed",
  usedPairIds: string[] = [],
  rng: () => number = Math.random
): WordPair {
  let candidates = WORD_PAIRS.filter((p) => !usedPairIds.includes(p.id));

  // Reset candidates if pool is exhausted
  if (candidates.length === 0) {
    candidates = [...WORD_PAIRS];
  }

  if (category !== "random") {
    const byCategory = candidates.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
    if (byCategory.length > 0) {
      candidates = byCategory;
    }
  }

  if (difficulty !== "mixed") {
    const byDifficulty = candidates.filter(
      (p) => p.difficulty === difficulty || p.difficulties?.includes(difficulty)
    );
    if (byDifficulty.length > 0) {
      candidates = byDifficulty;
    }
  }

  const selectedIndex = Math.floor(rng() * candidates.length);
  const selected = candidates[selectedIndex];

  // 50/50 random coin flip so word1 and word2 have equal probability of being Civilian
  const flip = rng() < 0.5;
  const a = flip ? selected.a : selected.b;
  const b = flip ? selected.b : selected.a;

  return {
    ...selected,
    a,
    b,
    accept: a,
  };
}
