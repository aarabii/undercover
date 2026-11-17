# Starter Issues and Repository Labels

This document lists the standard issue labels and the initial 10 starter issues for contributors to **Undercover**. Each issue includes its title, GitHub issue link, labels, context, acceptance criteria, and the exact files to modify.

## Repository Labels

| Label | Color | Description |
| :--- | :--- | :--- |
| `good first issue` | `#7057ff` | Good for newcomers and first-time contributors |
| `help wanted` | `#008672` | Extra attention is welcome from the community |
| `word-pack` | `#d93f0b` | Additions, edits, or tooling for game word pairs |
| `localization` | `#1d76db` | Translations and multi-language support |
| `accessibility` | `#5319e7` | Keyboard navigation, ARIA roles, screen readers, and reduced motion |
| `docs` | `#0075ca` | Documentation, guides, and visual assets |
| `bug` | `#d73a4a` | Something is not working as expected |
| `enhancement` | `#a2eeef` | New feature or improvement to existing functionality |

---

## Starter Issues

### Issue 1: Add a curated Hindi (Devanagari) word pack

- **GitHub Issue:** [#3](https://github.com/aarabii/undercover/issues/3)
- **Title:** Add a curated Hindi (Devanagari) word pack
- **Labels:** `good first issue`, `help wanted`, `word-pack`, `localization`

#### Context
Undercover currently ships with English word pairs in `@game/words`. Adding a curated Hindi word pack written in Devanagari script allows native Hindi speakers to play the game in their primary script with culturally familiar concepts, everyday objects, food, and places.

#### Acceptance Criteria
- Create a Hindi (Devanagari) word pack containing at least 50 curated, family-friendly word pairs across multiple categories (such as food, everyday objects, places, cinema, and nature).
- Every pair must consist of two distinct but closely related nouns or noun phrases in Devanagari script so that clues remain ambiguous during rounds.
- All entries must conform to `packages/words/word-pack.schema.json` and pass the word validation script (`bun run validate:words`).
- No duplicate words within a pair or across pairs in the Hindi pack.
- Add unit test coverage in `tests/words/words.test.ts` verifying the Hindi word pack structure and non-empty categories.
- Document the Hindi word pack in `docs/word-packs.md`.

#### Exact Files to Touch
- `packages/words/src/data/hi/` (or `packages/words/src/data/`)
- `packages/words/word-pack.schema.json`
- `scripts/validate-words.ts`
- `tests/words/words.test.ts`
- `docs/word-packs.md`

---

### Issue 2: Add a curated Hinglish (Romanized Hindi-English) word pack

- **GitHub Issue:** [#4](https://github.com/aarabii/undercover/issues/4)
- **Title:** Add a curated Hinglish (Romanized Hindi-English) word pack
- **Labels:** `good first issue`, `help wanted`, `word-pack`, `localization`

#### Context
Many players in India and the diaspora communicate casually in Hinglish (Hindi written in the Latin alphabet mixed with common English terms). A dedicated Hinglish word pack makes the game immediately approachable for groups who prefer Romanized text over Devanagari.

#### Acceptance Criteria
- Create a Hinglish word pack containing at least 50 curated, family-friendly word pairs using consistent Romanized spelling (for example, `Chai` / `Coffee`, `Auto` / `Cab`, `Samosa` / `Kachori`).
- Ensure each pair is balanced in specificity so neither the Civilian word nor the Undercover word is obvious from a single generic clue.
- Validate all entries against `packages/words/word-pack.schema.json` and ensure `scripts/validate-words.ts` passes with zero errors.
- Add unit tests in `tests/words/words.test.ts` covering the Hinglish dataset.
- Update `docs/word-packs.md` with guidelines on Romanized spelling conventions and the new Hinglish pack.

#### Exact Files to Touch
- `packages/words/src/data/hinglish/`
- `packages/words/word-pack.schema.json`
- `scripts/validate-words.ts`
- `tests/words/words.test.ts`
- `docs/word-packs.md`

---

### Issue 3: Design and implement a multi-language word pack template and loader in `@game/words`

- **GitHub Issue:** [#5](https://github.com/aarabii/undercover/issues/5)
- **Title:** Design and implement a multi-language word pack template and loader in `@game/words`
- **Labels:** `help wanted`, `enhancement`, `word-pack`, `localization`

#### Context
Currently, `@game/words` loads a single default English word dataset and exposes helper functions (`getWordPair`, `getWordPairsForDifficulty`, `CATEGORIES`) that operate on that single list. To support Hindi, Hinglish, and future community language packs, `@game/words` needs a typed locale-aware registry and loader API while preserving backward compatibility for existing callers.

#### Acceptance Criteria
- Define a standard template structure and TypeScript types for language-keyed word packs (for example, `en`, `hi`, `hinglish`) in `packages/words`.
- Update `getWordPair` and `getWordPairsForDifficulty` in `packages/words` to accept an optional locale or pack identifier, defaulting to `en` when omitted.
- Export a helper to list available word pack locales and their metadata from `packages/words/src/index.ts`.
- Ensure `apps/server/src/words.ts` continues to work seamlessly with the updated API.
- Add unit tests in `tests/words/words.test.ts` testing default fallback behavior, locale selection, and category filtering per locale.
- Document the multi-language loader architecture and how to register a new locale in `docs/word-packs.md`.

#### Exact Files to Touch
- `packages/words/src/data/words.ts`
- `packages/words/src/helpers/picker.ts`
- `packages/words/src/index.ts`
- `apps/server/src/words.ts`
- `tests/words/words.test.ts`
- `docs/word-packs.md`

---

### Issue 4: Accessibility audit and ARIA improvements for RoleCard and voting screens

- **GitHub Issue:** [#6](https://github.com/aarabii/undercover/issues/6)
- **Title:** Accessibility audit and ARIA improvements for RoleCard and voting screens
- **Labels:** `help wanted`, `accessibility`, `enhancement`

#### Context
During active gameplay, players flip their secret `RoleCard` to view their assigned word and then use the voting screen (`InGameScreen`, `PlayerGrid`, and `EliminationResultCard`) to select and eliminate suspects. Screen reader users and assistive technologies need explicit ARIA attributes, live-region announcements for phase changes, and clear accessible labels without accidentally announcing hidden secret words when the card is face down.

#### Acceptance Criteria
- Audit `RoleCard.tsx` so the button exposes `aria-pressed` or `aria-expanded` state accurately, and ensure the secret word and role are hidden from assistive technology (`aria-hidden="true"` or conditional rendering) when the card is not revealed.
- Add appropriate `role`, `aria-label`, and `aria-checked` / `aria-selected` semantics to player selection cards in `PlayerGrid.tsx`.
- Add an `aria-live="polite"` region in `InGameScreen.tsx` and `EliminationResultCard.tsx` so round transitions and elimination outcomes are announced to screen readers.
- Verify that all interactive elements on the role reveal and voting screens have visible `:focus-visible` outlines that match the Neo-brutalist design system.

#### Exact Files to Touch
- `apps/web/src/components/game/RoleCard.tsx`
- `apps/web/src/components/game/InGameScreen.tsx`
- `apps/web/src/components/game/PlayerGrid.tsx`
- `apps/web/src/components/game/EliminationResultCard.tsx`

---

### Issue 5: Add full keyboard arrow-key navigation and focus management for the voting player grid

- **GitHub Issue:** [#7](https://github.com/aarabii/undercover/issues/7)
- **Title:** Add full keyboard arrow-key navigation and focus management for the voting player grid
- **Labels:** `good first issue`, `help wanted`, `accessibility`, `enhancement`

#### Context
Players navigating via keyboard should be able to move across candidate cards in `PlayerGrid` using arrow keys (`ArrowRight`, `ArrowLeft`, `ArrowDown`, `ArrowUp`, `Home`, `End`) and confirm or change their selection with `Enter` or `Space`, skipping eliminated players or their own card when self-voting is disallowed.

#### Acceptance Criteria
- Implement roving `tabIndex` or arrow-key focus movement across active, selectable player cards in `apps/web/src/components/game/PlayerGrid.tsx`.
- Disabled or eliminated player cards must not trap keyboard focus and should be skipped during arrow-key traversal.
- Pressing `Enter` or `Space` on a focused player card selects that player for voting; pressing `Tab` moves focus cleanly to the "Lock In Vote" action button in `InGameScreen.tsx`.
- Add a Playwright E2E test in `tests/e2e/undercover.spec.ts` verifying that a player can select a suspect and submit a vote using only keyboard inputs.

#### Exact Files to Touch
- `apps/web/src/components/game/PlayerGrid.tsx`
- `apps/web/src/components/game/InGameScreen.tsx`
- `tests/e2e/undercover.spec.ts`

---

### Issue 6: Expand the "How to Play" modal and reference view on landing and lobby screens

- **GitHub Issue:** [#8](https://github.com/aarabii/undercover/issues/8)
- **Title:** Expand the "How to Play" modal and reference view on landing and lobby screens
- **Labels:** `good first issue`, `help wanted`, `enhancement`

#### Context
New players joining a room often need a quick reference explaining the difference between Civilian, Undercover, and Mr. White, how clue rounds work, and what happens on a tie vote or when Mr. White is eliminated. Expanding `RulesDialog` and making it accessible from both the landing page and active lobby/game header helps groups onboard without leaving the room.

#### Acceptance Criteria
- Update `apps/web/src/components/modals/RulesDialog.tsx` to cover:
  - Role breakdown (Civilian, Undercover, Mr. White)
  - Turn order and clue-giving rules (no exact words, no translations, no spelling out)
  - Voting, tie-breaking, and win conditions for each faction
  - Mr. White's last-chance secret word guess mechanic
- Ensure the rules dialog can be opened from `AppHeader.tsx` (or the landing/lobby screens) and supports closing via `Escape` and backdrop click with proper focus restoration.
- Keep copy aligned with `apps/web/src/components/landing/RolesSection.tsx` and `docs/game-rules.md`.

#### Exact Files to Touch
- `apps/web/src/components/modals/RulesDialog.tsx`
- `apps/web/src/components/landing/RolesSection.tsx`
- `apps/web/src/components/common/AppHeader.tsx`
- `docs/game-rules.md`

---

### Issue 7: Add a Neo-brutalist dark mode design token set in `global.css`

- **GitHub Issue:** [#9](https://github.com/aarabii/undercover/issues/9)
- **Title:** Add a Neo-brutalist dark mode design token set in `global.css`
- **Labels:** `help wanted`, `enhancement`

#### Context
Undercover uses a high-contrast Neo-brutalist palette built on warm off-white surfaces (`--color-canvas`, `--color-paper`), deep ink borders (`--color-ink`), and hard offset shadows. Defining a cohesive dark mode token set in `global.css` (and an optional theme toggle in `AppHeader.tsx`) will make late-night party sessions comfortable on OLED and low-light screens while preserving the sharp brutalist aesthetic.

#### Acceptance Criteria
- Define dark-mode CSS custom properties in `apps/web/src/styles/global.css` (under `[data-theme="dark"]` and/or `@media (prefers-color-scheme: dark)`) for surfaces, text, borders, hard shadows, and role accent badges.
- Maintain WCAG AA contrast ratios for all body text, role badges, and button states in dark mode.
- Add a theme toggle control in `apps/web/src/components/common/AppHeader.tsx` that persists user preference in `localStorage`.
- Document the dark mode color tokens and contrast guidelines in `docs/design-system.md`.

#### Exact Files to Touch
- `apps/web/src/styles/global.css`
- `apps/web/src/components/common/AppHeader.tsx`
- `docs/design-system.md`

---

### Issue 8: Add a Playwright E2E test verifying `prefers-reduced-motion` behavior

- **GitHub Issue:** [#10](https://github.com/aarabii/undercover/issues/10)
- **Title:** Add a Playwright E2E test verifying `prefers-reduced-motion` behavior
- **Labels:** `good first issue`, `help wanted`, `accessibility`, `enhancement`

#### Context
The web client uses Motion and CSS transitions for page entrances, role card reveals, and modal dialogs, with `prefers-reduced-motion: reduce` guards to disable or shorten animations for motion-sensitive users. Automated E2E verification ensures future UI changes do not regress reduced-motion support.

#### Acceptance Criteria
- Audit `apps/web/src/styles/global.css` to ensure `@media (prefers-reduced-motion: reduce)` disables non-essential CSS transitions and keyframe animations across components.
- Add a Playwright E2E test in `tests/e2e/undercover.spec.ts` that emulates `reducedMotion: 'reduce'` (via `page.emulateMedia({ reducedMotion: 'reduce' })` or browser context options).
- Verify in the test that the landing page, lobby transition, and `RoleCard` reveal remain fully functional and immediately interactive without animation delays when reduced motion is enabled.

#### Exact Files to Touch
- `tests/e2e/undercover.spec.ts`
- `playwright.config.ts`
- `apps/web/src/styles/global.css`

---

### Issue 9: Capture and add gameplay screenshot set and demo GIF under `docs/assets/`

- **GitHub Issue:** [#11](https://github.com/aarabii/undercover/issues/11)
- **Title:** Capture and add gameplay screenshot set and demo GIF under `docs/assets/`
- **Labels:** `good first issue`, `help wanted`, `docs`

#### Context
Visitors evaluating the repository benefit from seeing the Neo-brutalist interface and multiplayer flow right in the README. Capturing a clean set of screenshots and a short demo GIF from a local multi-tab session will provide visual documentation for the lobby, role card reveal, and live voting screens.

#### Acceptance Criteria
- Run the app locally and capture high-resolution, clean screenshots with sample player names (no personal data):
  - `docs/assets/lobby.png`: Lobby screen with 4+ players and host settings visible
  - `docs/assets/role-card.png`: In-game secret role and word reveal card
  - `docs/assets/voting.png`: Live voting grid with suspect selection
  - `docs/assets/demo.gif`: Short walkthrough showing room creation, role reveal, and voting
- Optimize image file sizes so the repository remains lightweight.
- Embed the captured assets in `README.md` under a Screenshots / Demo section.

#### Exact Files to Touch
- `docs/assets/demo.gif`
- `docs/assets/lobby.png`
- `docs/assets/role-card.png`
- `docs/assets/voting.png`
- `README.md`

---

### Issue 10: Translate `README.md` into Hindi (`README.hi.md`)

- **GitHub Issue:** [#12](https://github.com/aarabii/undercover/issues/12)
- **Title:** Translate `README.md` into Hindi (`README.hi.md`)
- **Labels:** `good first issue`, `help wanted`, `localization`, `docs`

#### Context
To make the project welcoming to Hindi-speaking developers and players, we want a complete Hindi translation of the main project documentation in `README.hi.md`, linked from the top of `README.md`.

#### Acceptance Criteria
- Create `README.hi.md` at the repository root containing an accurate, natural Hindi translation of `README.md` (overview, game rules summary, architecture, local development setup, and contribution links).
- Keep code blocks, CLI commands, file paths, and environment variable names in their original English/code form.
- Add a language switcher link at the top of both `README.md` and `README.hi.md` so readers can switch between English and Hindi.

#### Exact Files to Touch
- `README.hi.md`
- `README.md`
