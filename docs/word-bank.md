# Word Bank & Randomness Engine

- **260 curated pairs** across 12 categories (Food & Drinks, Animals, Everyday Objects, Places & Travel, Pop Culture, Nature, Science & Tech, Sports, Fashion, Jobs, Body & Health, Fantasy & Mystery).
- **4 difficulty tiers**: `easy` (70), `medium` (70), `hard` (70), `fan_fav` (50, pulled from medium/hard).
- **50/50 coin-flip assignment** of Civilian vs. Undercover word per round, preventing pattern recognition across replays.
- **Seeded Mulberry32 PRNG** for deterministic, reproducible shuffles and test coverage.

## Category Identifiers (`@game/words`)

The `@game/words` package defines the 12 categories using the following exact `Category` identifiers:

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

## Contributing Word Pairs

See [Adding Custom Word Packs](./word-packs.md) for instructions on adding or updating word pairs and aliases in `@game/words`.
