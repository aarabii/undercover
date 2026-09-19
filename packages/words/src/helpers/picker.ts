import type { WordPair, Difficulty } from "@game/types";
import { WORD_PAIRS } from "../data/words";

export function getWordPair(
  category: string = "random",
  difficulty: Difficulty = "mixed",
  usedPairIds: string[] = []
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
    const byDifficulty = candidates.filter((p) => p.difficulty === difficulty);
    if (byDifficulty.length > 0) {
      candidates = byDifficulty;
    }
  }

  const selectedIndex = Math.floor(Math.random() * candidates.length);
  return candidates[selectedIndex];
}
