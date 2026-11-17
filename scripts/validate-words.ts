import {
  CATEGORIES,
  EASY_PAIRS,
  MEDIUM_PAIRS,
  HARD_PAIRS,
  EXPERT_PAIRS,
  PARTY_PAIRS,
  FAN_FAV_PAIRS,
  WORD_PAIRS,
} from "../packages/words/src/index";
import { EASY_WORDS } from "../packages/words/src/data/easy";
import { MEDIUM_WORDS } from "../packages/words/src/data/medium";
import { HARD_WORDS } from "../packages/words/src/data/hard";
import { EXPERT_WORDS } from "../packages/words/src/data/expert";
import { PARTY_WORDS } from "../packages/words/src/data/party";
import { FAN_FAVORITE_WORDS } from "../packages/words/src/data/fan_fav";

type RawEntry = {
  word1?: unknown;
  word2?: unknown;
  accept?: unknown;
  [key: string]: unknown;
};

interface TierSpec {
  name: string;
  file: string;
  raw: Record<string, unknown>;
  minTotal: number;
  minPerCategory: number;
}

const TIERS: TierSpec[] = [
  {
    name: "easy",
    file: "packages/words/src/data/easy.ts",
    raw: EASY_WORDS as Record<string, unknown>,
    minTotal: 150,
    minPerCategory: 10,
  },
  {
    name: "medium",
    file: "packages/words/src/data/medium.ts",
    raw: MEDIUM_WORDS as Record<string, unknown>,
    minTotal: 150,
    minPerCategory: 10,
  },
  {
    name: "hard",
    file: "packages/words/src/data/hard.ts",
    raw: HARD_WORDS as Record<string, unknown>,
    minTotal: 150,
    minPerCategory: 10,
  },
  {
    name: "expert",
    file: "packages/words/src/data/expert.ts",
    raw: EXPERT_WORDS as Record<string, unknown>,
    minTotal: 150,
    minPerCategory: 10,
  },
  {
    name: "party",
    file: "packages/words/src/data/party.ts",
    raw: PARTY_WORDS as Record<string, unknown>,
    minTotal: 150,
    minPerCategory: 10,
  },
  {
    name: "fan_fav",
    file: "packages/words/src/data/fan_fav.ts",
    raw: FAN_FAVORITE_WORDS as Record<string, unknown>,
    minTotal: 80,
    minPerCategory: 10,
  },
];

const validCategories = new Set<string>(CATEGORIES);
const populatedCategories = new Set<string>();
const errors: string[] = [];

function normalizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

// 1. Validate raw tier structures, category names, schema fields, empty values, and within-tier symmetry/duplicates
for (const tier of TIERS) {
  if (!tier.raw || typeof tier.raw !== "object" || Array.isArray(tier.raw)) {
    errors.push(`[${tier.file}] Root export must be a category-keyed object.`);
    continue;
  }

  let tierCount = 0;
  const seenInTier = new Map<string, string>();

  for (const [category, entries] of Object.entries(tier.raw)) {
    if (!validCategories.has(category)) {
      errors.push(
        `[${tier.file}] Unknown category "${category}". Allowed categories: ${CATEGORIES.join(", ")}`
      );
    } else {
      populatedCategories.add(category);
    }

    if (!Array.isArray(entries)) {
      errors.push(`[${tier.file}] Category "${category}" must map to an array of word pairs.`);
      continue;
    }

    if (entries.length < tier.minPerCategory) {
      errors.push(
        `[${tier.file}] Category "${category}" has ${entries.length} pairs (minimum expected: ${tier.minPerCategory}).`
      );
    }

    entries.forEach((item, index) => {
      const loc = `${tier.file} -> ${category}[${index}]`;
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        errors.push(`[${loc}] Pair entry must be an object.`);
        return;
      }

      const rawPair = item as RawEntry;
      const allowedKeys = new Set(["word1", "word2", "accept"]);
      for (const key of Object.keys(rawPair)) {
        if (!allowedKeys.has(key)) {
          errors.push(
            `[${loc}] Unexpected property "${key}". Allowed properties: word1, word2, accept.`
          );
        }
      }

      if (typeof rawPair.word1 !== "string" || rawPair.word1.trim().length === 0) {
        errors.push(`[${loc}] "word1" must be a non-empty string.`);
        return;
      }
      if (typeof rawPair.word2 !== "string" || rawPair.word2.trim().length === 0) {
        errors.push(`[${loc}] "word2" must be a non-empty string.`);
        return;
      }

      if (rawPair.word1 !== rawPair.word1.trim()) {
        errors.push(`[${loc}] "word1" ("${rawPair.word1}") has leading or trailing whitespace.`);
      }
      if (rawPair.word2 !== rawPair.word2.trim()) {
        errors.push(`[${loc}] "word2" ("${rawPair.word2}") has leading or trailing whitespace.`);
      }

      if (rawPair.accept !== undefined) {
        const acceptList = Array.isArray(rawPair.accept)
          ? rawPair.accept
          : [rawPair.accept];
        if (acceptList.length === 0) {
          errors.push(`[${loc}] "accept" must not be an empty array.`);
        }
        for (const alias of acceptList) {
          if (typeof alias !== "string" || alias.trim().length === 0) {
            errors.push(`[${loc}] Every "accept" alias must be a non-empty string.`);
          }
        }
      }

      const norm1 = normalizeWord(rawPair.word1);
      const norm2 = normalizeWord(rawPair.word2);

      // Self-symmetry check (word1 == word2)
      if (norm1 === norm2) {
        errors.push(
          `[${loc}] Pair symmetry error: word1 ("${rawPair.word1}") and word2 ("${rawPair.word2}") are identical.`
        );
      }

      // Within-tier duplicate and reversed-symmetry check ((A, B) vs (A, B) or (B, A))
      const canonicalKey = [norm1, norm2].sort().join(" <-> ");
      const existingLoc = seenInTier.get(canonicalKey);
      if (existingLoc) {
        errors.push(
          `[${loc}] Duplicate or reversed pair "${rawPair.word1}" / "${rawPair.word2}" within tier "${tier.name}" (already defined at ${existingLoc}).`
        );
      } else {
        seenInTier.set(canonicalKey, loc);
      }

      tierCount++;
    });
  }

  if (tierCount < tier.minTotal) {
    errors.push(
      `[${tier.file}] Tier "${tier.name}" has ${tierCount} total pairs (minimum expected: ${tier.minTotal}).`
    );
  }
}

// 2. Ensure all 12 categories in CATEGORIES are represented across the word bank
for (const category of CATEGORIES) {
  if (!populatedCategories.has(category)) {
    errors.push(`Category "${category}" in CATEGORIES has no word pairs in any tier.`);
  }
}

// 3. Validate compiled WORD_PAIRS exports and unique IDs
const seenIds = new Set<string>();
for (const pair of WORD_PAIRS) {
  if (!pair.id || typeof pair.id !== "string") {
    errors.push(`Compiled WordPair is missing a valid string id: ${JSON.stringify(pair)}`);
  } else if (seenIds.has(pair.id)) {
    errors.push(`Duplicate compiled WordPair id "${pair.id}".`);
  } else {
    seenIds.add(pair.id);
  }
}

for (const pair of FAN_FAV_PAIRS) {
  if (
    !pair.difficulties ||
    !pair.difficulties.includes("medium") ||
    !pair.difficulties.includes("hard")
  ) {
    errors.push(
      `Fan favorite pair "${pair.id}" must include ["medium", "hard"] in difficulties.`
    );
  }
}

if (errors.length > 0) {
  console.error(`❌ Word pack validation failed with ${errors.length} error(s):`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `✅ Word pack validation passed: ${WORD_PAIRS.length} pairs across ${populatedCategories.size} categories (easy: ${EASY_PAIRS.length}, medium: ${MEDIUM_PAIRS.length}, hard: ${HARD_PAIRS.length}, expert: ${EXPERT_PAIRS.length}, party: ${PARTY_PAIRS.length}, fan_fav: ${FAN_FAV_PAIRS.length}).`
);
