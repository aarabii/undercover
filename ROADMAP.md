# Roadmap

This document outlines planned, incremental improvements for Undercover. Items listed here represent practical next steps rather than speculative rewrites.

## Planned Work

### Word Packs & Localization

- Additional curated word packs, including Hindi and Hinglish word packs.
- Multi-language word pack loader in `@game/words`.
- Translated UI strings for localized room interfaces.

### Accessibility

- Screen-reader and ARIA audit for the secret role card and voting screens.
- Full keyboard navigation across the voting player grid.
- Automated `prefers-reduced-motion` end-to-end assertions in Playwright.

### Themes & Visuals

- Dark mode token set in `apps/web/src/styles/global.css`, preserving high-contrast Neo-brutalist borders and dual-coded status indicators.

### Player Onboarding

- In-app "How to Play" modal or reference sheet accessible from the landing page and lobby without leaving the room.

### Optional Game Modes

- Configurable multi-round score tracking across rematches.
- Optional custom category selection presets.

## Contributing

If you want to work on any of these items, read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for development setup and pull request guidelines. For word pack additions or localization work, see [`docs/word-packs.md`](./docs/word-packs.md).
