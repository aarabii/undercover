import type { WordBank } from "@game/engine";
import type { WordPair, Difficulty } from "@game/types";
import { WORD_PAIRS } from "@game/words";

/**
 * Server implementation of WordBank backed by @game/words WORD_PAIRS.
 * Adheres strictly to the pure engine interface, accepting an injected RNG function.
 */
export class ServerWordBank implements WordBank {
  getWordPair(
    category: string,
    difficulty: Difficulty,
    usedPairIds: string[],
    rng: () => number = Math.random
  ): WordPair | null {
    // 1. Exclude already used word pairs in the room
    let candidates = WORD_PAIRS.filter((p) => !usedPairIds.includes(p.id));

    // When pool is exhausted, return null so engine can recycle usedPairIds per Spec §3.3
    if (candidates.length === 0) {
      return null;
    }

    // 2. Filter by category if specified and not 'random'
    if (category && category.toLowerCase() !== "random") {
      const byCategory = candidates.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
      if (byCategory.length > 0) {
        candidates = byCategory;
      }
    }

    // 3. Filter by difficulty if specified and not 'mixed'
    if (difficulty && difficulty !== "mixed") {
      const byDifficulty = candidates.filter(
        (p) => p.difficulty === difficulty || p.difficulties?.includes(difficulty)
      );
      if (byDifficulty.length > 0) {
        candidates = byDifficulty;
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // 4. Select pair using injected RNG with 50/50 flip
    const index = Math.floor(rng() * candidates.length);
    const selected = candidates[index];
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
}
