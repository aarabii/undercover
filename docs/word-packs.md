# Contributing Word Packs & Pairs

The `@game/words` package (`packages/words`) stores the secret word pairs used by the server. Adding new word pairs is a data-only change that requires no knowledge of the game engine or server internals.

> [!IMPORTANT]
> `packages/words` is strictly server-only. It is never imported by `apps/web` so players cannot inspect the client bundle to deduce their role or the opposing word.

---

## 1. How Word Pairs Are Stored

Word pairs are organized by difficulty tier under `packages/words/src/data/`:

| File                                      | Export               | Difficulty Tier | Role in Game Selection                                      |
| :---------------------------------------- | :------------------- | :-------------- | :---------------------------------------------------------- |
| `packages/words/src/data/easy.ts`         | `EASY_WORDS`         | `easy`          | Selected when room difficulty is `easy` or `mixed`.         |
| `packages/words/src/data/medium.ts`       | `MEDIUM_WORDS`       | `medium`        | Selected when room difficulty is `medium` or `mixed`.       |
| `packages/words/src/data/hard.ts`         | `HARD_WORDS`         | `hard`          | Selected when room difficulty is `hard` or `mixed`.         |
| `packages/words/src/data/fan_fav.ts`      | `FAN_FAVORITE_WORDS` | `fan_fav`       | Included in `medium`, `hard`, and `mixed` difficulty pools. |

Each file exports an object keyed by category name, mapping to an array of `{ word1, word2 }` pairs:

```ts
export const EASY_WORDS = {
  Food: [
    { word1: "Pancake", word2: "Waffle" },
    { word1: "Espresso", word2: "Cappuccino" },
  ],
  Animals: [
    { word1: "Crocodile", word2: "Alligator" },
  ],
  // ...
};
```

A machine-readable JSON Schema for this structure is available at [`packages/words/word-pack.schema.json`](../packages/words/word-pack.schema.json).

### Compiled `WordPair` Model

At load time, `packages/words/src/data/words.ts` compiles the raw tier maps into `WordPair` objects (`EASY_PAIRS`, `MEDIUM_PAIRS`, `HARD_PAIRS`, `FAN_FAV_PAIRS`, and `WORD_PAIRS`) with auto-generated IDs (`<prefix>-<category-slug>-<index>`).

When a round starts, the engine flips a fair 50/50 coin using its seeded PRNG:
- Heads: Civilians receive `a` (`word1`) and Undercovers receive `b` (`word2`).
- Tails: Civilians receive `b` (`word2`) and Undercovers receive `a` (`word1`).

Because `word1` and `word2` are swapped randomly every round, the order of `word1` and `word2` in the data file does not favour either role.

### Recognized Categories

Every category key must match one of the 12 `Category` identifiers defined in [`packages/words/src/constants/categories.ts`](../packages/words/src/constants/categories.ts):

- `Food`
- `Animals`
- `Objects`
- `Places`
- `Entertainment`
- `Companies`
- `Technology`
- `Sports`
- `PopCulture`
- `TravelAndNature`
- `JobsAndRoles`
- `Funny`

---

## 2. Quality Rules for a Good Word Pair

A strong Undercover word pair makes spoken clue rounds tense without feeling unfair:

1. **Related but distinguishable**: Both words should share a category, setting, or function so early clues ("I have this in the morning", "It has four legs") apply to both, while specific traits eventually separate them.
   - *Good*: `Pancake` / `Waffle`, `Library` / `Bookstore`, `Bluetooth` / `Wi-Fi`
   - *Too distant*: `Pancake` / `Helicopter` (the Undercover is exposed on the first clue)
   - *Too identical*: `Couch` / `Sofa` (players give identical clues forever and Mr. White automatically guesses the synonym)
2. **Symmetric specificity**: Both words should sit at the same level of generality. Avoid pairing a broad category with a single subtype (for example, `Bird` / `Penguin`).
3. **Spoken-clue friendly**: Words should be concise (1–2 words) and natural to describe out loud without spelling or gestures.
4. **Culturally clear**: Avoid obscure local slang or niche brand names in the default pack unless they are widely recognized by general players. Region-specific or language-specific references belong in dedicated language/regional packs.
5. **No offensive or NSFW content**: Keep the default word bank welcoming for friends, families, classrooms, and workplaces.

### Difficulty Guidelines

- **`easy`**: Distinct physical or functional differences once players narrow down the topic (e.g. `Umbrella` / `Raincoat`).
- **`medium`**: Close siblings that share many everyday clues (e.g. `Burger` / `Sandwich`, `Wolf` / `Fox`).
- **`hard`**: Subtle distinctions that require careful, precise clues to tell apart (e.g. `Broth` / `Stock`, `Encryption` / `Hashing`).
- **`fan_fav`**: Crowd-pleasing pairs across `Sports`, `PopCulture`, `TravelAndNature`, `JobsAndRoles`, and `Funny` that appear in both `medium` and `hard` games.

---

## 3. Adding a New Word Pair

1. Open the appropriate tier file in `packages/words/src/data/` (`easy.ts`, `medium.ts`, `hard.ts`, or `fan_fav.ts`).
2. Append your `{ word1: "...", word2: "..." }` object to the matching category array. Do not remove or reorder existing pairs so existing IDs and tests stay stable.
3. Run the word validator and unit tests:
   ```bash
   bun run validate:words
   bun run test
   ```

What `bun run validate:words` checks:
- Valid category names against `CATEGORIES`.
- Non-empty string values with no leading or trailing whitespace.
- No self-symmetric pairs (`word1` equal to `word2`).
- No duplicate or reversed pairs (`(A, B)` vs `(B, A)`) within a difficulty tier.
- Unique generated pair IDs and minimum tier/category counts.

---

## 4. Adding a New Language or Regional Pack

To propose or add a new language pack (such as Hindi, Hinglish, Spanish, or French):

1. Create a subdirectory or data module under `packages/words/src/data/<locale>/` (for example, `packages/words/src/data/hi/` or `packages/words/src/data/hinglish/`) following the same category-keyed structure validated by [`packages/words/word-pack.schema.json`](../packages/words/word-pack.schema.json).
2. Keep each pair's `word1` and `word2` in the same script and register (for example, Devanagari for Hindi or consistent Romanized spelling for Hinglish). Where helpful for Mr. White's final guess, include common transliteration variants in `accept`.
3. Update `scripts/validate-words.ts` and `tests/words/words.test.ts` to validate the new pack alongside the default pack.
4. Open an issue using the **Suggest Word Pairs** template (`.github/ISSUE_TEMPLATE/word_pair_suggestion.yml`) or submit a pull request referencing [`CONTRIBUTING.md`](../CONTRIBUTING.md).
