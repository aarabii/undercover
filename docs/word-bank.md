# Word Bank & Randomness Engine

- **830 curated pairs** across 15 categories (Food, Animals, Objects, Places, Entertainment, Companies, Technology, Sports, Pop Culture, Travel & Nature, Jobs & Roles, Funny, Gaming, Movies & Series, Famous Persons).
- **6 difficulty tiers**: `easy` (150), `medium` (150), `hard` (150), `expert` (150), `party` (150), `fan_fav` (80, pulled into medium/hard).
- **50/50 coin-flip assignment** of Civilian vs. Undercover word per round, preventing pattern recognition across replays.
- **Seeded Mulberry32 PRNG** for deterministic, reproducible shuffles and test coverage.

## Category Identifiers (`@game/words`)

The `@game/words` package defines the 15 categories using the following exact `Category` identifiers:

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
- `Gaming`
- `MoviesAndSeries`
- `FamousPersons`

## Contributing Word Pairs

See [Adding Custom Word Packs](./word-packs.md) for instructions on adding or updating word pairs and aliases in `@game/words`.
