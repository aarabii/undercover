# Open-Source Readiness Report

Branch: `oss-readiness`

---

## 1. Summary of Changes by Step

### Step 1: License and Legal Basics
- Added [`LICENSE`](../LICENSE) with the standard MIT License text (`Copyright (c) 2026 aarabii`).
- Added `"license": "MIT"`, `"homepage": "https://undercover.aarab.me"`, `"repository"`, and `"bugs"` fields to the root [`package.json`](../package.json).

### Step 2: README Rewrite and Documentation Extraction
- Rewrote [`README.md`](../README.md) as a concise project pitch and 5-line quickstart containing:
  - Title, one-line description, and 3 badges (CI workflow status, MIT license, GitHub stars).
  - "Play now" link (`https://undercover.aarab.me`) and a clearly marked `TODO` placeholder block for `docs/assets/demo.gif` and gameplay screenshots.
  - "Why This Is Different" section (zero login, in-person referee, no chat feed, zero sound or vibration, privacy card auto-hide).
  - Roles & Objectives table (`Civilian`, `Undercover`, `Mr. White`).
  - 5-line quickstart, single-sentence tech stack summary, testing command list, documentation index, contributing pointer, and license section.
- Extracted all detailed technical and specification sections from the original README into dedicated files under `docs/` without losing content or Mermaid diagrams:
  - [`docs/game-rules.md`](./game-rules.md) — Roles, in-person referee model, win conditions table, timer configuration table, and Mr. White final guess normalization pipeline.
  - [`docs/architecture.md`](./architecture.md) — System architecture `flowchart TD` Mermaid diagram, monorepo directory map, package dependency boundaries, pure `reduce()` design, `stateDiagram-v2` phase state machine Mermaid diagram, and session lifecycle.
  - [`docs/protocol.md`](./protocol.md) — Zod 4 `@game/protocol` overview, all 18 client message types, all 6 server message types, and PartySocket reconnection behavior.
  - [`docs/security.md`](./security.md) — Server-authoritative state projection (`viewFor`), vote privacy, `WORD_ONLY` hidden role cards, tab-blur auto-hide, Cloudflare Turnstile + IP rate limiting, and `check:boundaries` enforcement.
  - [`docs/design-system.md`](./design-system.md) — Neo-brutalist dossier aesthetic, dual-coded status indicators, typography (`Archivo Black`, `Inter`, `IBM Plex Mono`), reduced-motion rules, and Tailwind v4 `@theme` tokens in `apps/web/src/styles/global.css`.
  - [`docs/word-bank.md`](./word-bank.md) — 260 curated pairs across 12 categories, 4 difficulty tiers (`easy`, `medium`, `hard`, `fan_fav`), 50/50 Civilian/Undercover coin flip, seeded Mulberry32 PRNG, and exact `@game/words` `Category` identifiers.

### Step 3: Removal of Hardcoded Personal Setup & Self-Hosting Guide
- Removed hardcoded `aarab.me` / `ws.aarab.me` / `undercover.aarab.me` defaults from source and configuration files:
  - [`apps/server/wrangler.jsonc`](../apps/server/wrangler.jsonc) — Commented out the owner-specific `"routes"` block (`ws.aarab.me`) as an example placeholder and changed default `vars.ALLOWED_ORIGINS` to `"http://localhost:4321"`.
  - [`apps/server/worker-configuration.d.ts`](../apps/server/worker-configuration.d.ts) — Widened `ALLOWED_ORIGINS` type from a hardcoded domain literal to `string`.
  - [`apps/web/astro.config.mjs`](../apps/web/astro.config.mjs) — Changed fallback `siteUrl` from `'https://undercover.aarab.me'` to `'http://localhost:4321'` when `PUBLIC_SITE_URL` is unset.
  - [`apps/web/src/pages/index.astro`](../apps/web/src/pages/index.astro) and [`apps/web/src/pages/play.astro`](../apps/web/src/pages/play.astro) — Derived `og:image` and `twitter:image` URLs dynamically from `Astro.site` (`PUBLIC_SITE_URL`) instead of hardcoding `https://undercover.aarab.me/og-image.png`.
  - [`apps/web/src/components/room/RoomCodeShare.tsx`](../apps/web/src/components/room/RoomCodeShare.tsx) — Replaced the SSR fallback URL with `import.meta.env.PUBLIC_SITE_URL || "http://localhost:4321"`.
  - [`apps/web/src/components/common/AppFooter.tsx`](../apps/web/src/components/common/AppFooter.tsx) and [`apps/web/src/env.d.ts`](../apps/web/src/env.d.ts) — Made Privacy (`PUBLIC_PRIVACY_URL`), Terms (`PUBLIC_TERMS_URL`), and Author (`PUBLIC_AUTHOR_URL`, defaulting to `https://github.com/aarabii`) links configurable via environment variables.
  - [`apps/web/vercel.json`](../apps/web/vercel.json) — Replaced `wss://ws.aarab.me wss://*.aarab.me https://*.aarab.me` in `Content-Security-Policy` `connect-src` with `https: wss: ws://localhost:8787 http://localhost:8787` so self-hosted deployments work out of the box.
  - [`apps/web/public/robots.txt`](../apps/web/public/robots.txt) — Replaced the hardcoded `Sitemap:` domain with a commented placeholder.
- Populated [`apps/web/.env.example`](../apps/web/.env.example) and [`apps/server/.dev.vars.example`](../apps/server/.dev.vars.example) with working `localhost` defaults and Cloudflare's official always-pass Turnstile test keys (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`).
- Updated [`.gitignore`](../.gitignore) to ignore `.env.*` and `.dev.vars.*` while keeping `!.env.example` and `!.dev.vars.example` tracked.
- Added [`docs/self-hosting.md`](./self-hosting.md) documenting Cloudflare Workers + Durable Objects deployment, Vercel deployment, all environment variables (using `undercover.aarab.me` and `ws.aarab.me` as the reference production example), and a troubleshooting guide for CORS, WebSockets, and Turnstile.

### Step 4: Contributor Onboarding and Governance Files
- Added [`CONTRIBUTING.md`](../CONTRIBUTING.md) covering prerequisites, local setup, all test/verification commands, architecture pointers, package boundary rules (`@game/words` server-only, `@game/engine` zero I/O, `@game/types` zero dependencies), branch/commit conventions, and PR checklist.
- Added [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) (Contributor Covenant v2.1 with a clearly marked `[TODO: add maintainer contact email, e.g. conduct@example.com]` placeholder).
- Added [`SECURITY.md`](../SECURITY.md) covering supported versions, GitHub Private Vulnerability Reporting, response timelines, and the anti-cheat security model.
- Extended and added GitHub issue forms and templates under `.github/`:
  - [`.github/ISSUE_TEMPLATE/bug_report.yml`](../.github/ISSUE_TEMPLATE/bug_report.yml)
  - [`.github/ISSUE_TEMPLATE/feature_request.yml`](../.github/ISSUE_TEMPLATE/feature_request.yml)
  - [`.github/ISSUE_TEMPLATE/word_pair_suggestion.yml`](../.github/ISSUE_TEMPLATE/word_pair_suggestion.yml)
  - [`.github/ISSUE_TEMPLATE/config.yml`](../.github/ISSUE_TEMPLATE/config.yml) (disables blank issues and links to Discussions and Security Advisories)
  - [`.github/pull_request_template.md`](../.github/pull_request_template.md)
- Added [`ROADMAP.md`](../ROADMAP.md) and [`CHANGELOG.md`](../CHANGELOG.md) (Keep a Changelog 1.1.0 format with an initial `0.1.0` entry).

### Step 5: CI and Repository Automation
- Added [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) running on push and pull requests to `master` using `oven-sh/setup-bun@v2` (`1.3.14`) and `actions/setup-node@v4` (`node-version-file: ".nvmrc"` -> Node 22) with dependency caching and three parallel jobs:
  1. `Typecheck, Unit Tests & Build` (`typecheck`, `check:boundaries`, `validate:words`, `test`, `build`)
  2. `Server Integration Tests` (`test:server`)
  3. `E2E Tests (Playwright)` (`test:e2e`, uploading `playwright-report/` and `test-results/` on failure)
- Added [`.github/dependabot.yml`](../.github/dependabot.yml) for weekly grouped minor/patch updates across `npm` and `github-actions`.
- Added [`.devcontainer/devcontainer.json`](../.devcontainer/devcontainer.json) (Node 22 + Bun, ports `4321` and `8787`, auto-copies `.env.example` and `.dev.vars.example` and runs `bun install`).
- Added [`.editorconfig`](../.editorconfig).

### Step 6: Word Pack Contribution Path & Validator
- Preserved all 260 existing word pairs and public exports in `packages/words` unchanged.
- Added [`packages/words/word-pack.schema.json`](../packages/words/word-pack.schema.json) describing the category-keyed word pair structure.
- Added [`scripts/validate-words.ts`](../scripts/validate-words.ts) and wired `"validate:words": "bun run scripts/validate-words.ts"` in [`package.json`](../package.json) and `.github/workflows/ci.yml`.
- Added [`docs/word-packs.md`](./word-packs.md) documenting the word pack data structure, pair quality guidelines, validator checks, and steps to add a new language pack.

### Step 7: Starter Issues and Labels
- Created/updated all 8 labels on `aarabii/undercover` via `gh`: `good first issue`, `help wanted`, `word-pack`, `localization`, `accessibility`, `docs`, `bug`, `enhancement`.
- Created all 10 starter issues on GitHub ([#3](https://github.com/aarabii/undercover/issues/3) through [#12](https://github.com/aarabii/undercover/issues/12)) and saved the full drafts in [`docs/starter-issues.md`](./starter-issues.md).

---

## 2. Test and Check Results (Before vs. After)

| Check / Suite | Baseline (`master`) | Final (`oss-readiness`) | Details |
| :--- | :--- | :--- | :--- |
| `bun install` | Pass | Pass | 603 packages resolved across 6 workspaces |
| `bun run typecheck` | Pass | Pass | Zero TypeScript errors across `@game/types`, `@game/protocol`, `@game/words`, `@game/engine`, `@game/server`, `@game/web` |
| `bun run test` | Pass (174 pass, 0 fail) | Pass (174 pass, 0 fail) | 12 unit & simulation test files (41,417 `expect()` assertions) |
| `bun run test:server` | Pass (17 pass, 0 fail) | Pass (17 pass, 0 fail) | Cloudflare Workers + Durable Object SQLite integration tests (`vitest` + `workerd`) |
| `bun run check:boundaries` | Pass | Pass | Verified `apps/web` never depends on or imports `@game/words` |
| `bun run validate:words` | *(Did not exist)* | Pass | Validated 260 pairs across 12 categories (`easy`: 70, `medium`: 70, `hard`: 70, `fan_fav`: 50) |
| `bun run build` | Pass (0 errors, 0 warnings) | Pass (0 errors, 0 warnings) | `astro check && astro build` built `/index.html`, `/play/index.html`, and `sitemap-index.xml` |
| `bun run test:e2e` | Listed 5 tests (`--list`) | Configured in CI | Playwright Chromium download is blocked by the sandboxed VM proxy; verified test discovery (`playwright test --list`: 5 tests) and wired full Chromium installation and execution into `.github/workflows/ci.yml` |
| Relative Markdown Links | — | Pass | Checked all 17 Markdown files across the repository: 0 broken relative links |
| Hardcoded Domain Audit | 18 occurrences of `aarab.me` across source/configs | Pass | Zero occurrences outside `docs/self-hosting.md` and the intentional "Play now" / `homepage` URL |

---

## 3. Items Skipped and Rationale

1. **No new linter/formatter toolchain added (Step 5)**: The repository already enforces TypeScript checks (`bun run typecheck`), Astro diagnostics (`astro check`), and package boundaries (`bun run check:boundaries`). Per the instructions, we skipped adding Biome/ESLint/Prettier so we did not introduce a new dependency or noisy formatting diffs across existing source files, and added `.editorconfig` for editor consistency.
2. **Local execution of `bun run test:e2e` (Step 8)**: While `/usr/bin/chromium` is installed on the host OS, Playwright expects its own bundled Chromium revision in `~/.cache/ms-playwright`, which cannot be downloaded inside this restricted proxy sandbox. We verified `bun run test:e2e --list` parses and lists all 5 multi-player E2E tests cleanly and configured `.github/workflows/ci.yml` to run `bunx playwright install --with-deps chromium` and `bun run test:e2e` on every push and PR.

---

## 4. Manual Owner Checklist (Human-Only Actions)

### A. Production Environment Settings Required Before Next Deploy (from Step 3)

Because hardcoded `aarab.me` domains were removed from `apps/server/wrangler.jsonc`, `apps/web/astro.config.mjs`, `apps/web/src/pages/*.astro`, and `apps/web/src/components/common/AppFooter.tsx`, configure the following in your production dashboards so the live deployment at `https://undercover.aarab.me` and `wss://ws.aarab.me` continues working identically:

1. **Cloudflare Dashboard (`Workers & Pages` -> `undercover-server`)**:
   - **Settings -> Domains & Routes**: Ensure the Custom Domain route `ws.aarab.me` is attached (or uncomment `"routes": [{ "pattern": "ws.aarab.me", "custom_domain": true }]` in `apps/server/wrangler.jsonc` if deploying from CLI without dashboard routes).
   - **Settings -> Variables and Secrets**:
     - `ALLOWED_ORIGINS` = `https://undercover.aarab.me` (or `https://undercover.aarab.me,http://localhost:4321`)
     - `TURNSTILE_SECRET` = `<your-production-turnstile-secret-key>`
2. **Vercel Dashboard (`undercover` web project -> `Settings` -> `Environment Variables`)**:
   - `PUBLIC_WS_HOST` = `ws.aarab.me`
   - `PUBLIC_SITE_URL` = `https://undercover.aarab.me`
   - `PUBLIC_TURNSTILE_SITEKEY` = `<your-production-turnstile-site-key>`
   - `PUBLIC_PRIVACY_URL` = `https://www.aarab.me/privacy`
   - `PUBLIC_TERMS_URL` = `https://www.aarab.me/terms`
   - `PUBLIC_AUTHOR_URL` = `https://aarab.me`

### B. GitHub Repository & Launch Checklist

- [ ] **Push `oss-readiness` and merge to `master`**: Push the `oss-readiness` branch (`git push -u origin oss-readiness`), open a PR or merge into `master`, and delete `docs/oss-readiness-report.md` when no longer needed.
- [ ] **Add contact emails**: Replace `[TODO: add maintainer contact email, e.g. conduct@example.com]` in [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) and `[TODO: add security contact email]` in [`SECURITY.md`](../SECURITY.md).
- [ ] **Record demo GIF and screenshots** ([Issue #11](https://github.com/aarabii/undercover/issues/11)): Capture `docs/assets/demo.gif`, `docs/assets/lobby.png`, `docs/assets/role-card.png`, and `docs/assets/voting.png`, and replace the `TODO` block in [`README.md`](../README.md).
- [ ] **Set GitHub About description, website, and topics**:
  - Website: `https://undercover.aarab.me`
  - Description: `Real-time, zero-login, in-person social deduction word game for 4–20 players (Astro, React, Cloudflare Workers, Durable Objects).`
  - Topics: `social-deduction`, `party-game`, `word-game`, `multiplayer-game`, `cloudflare-workers`, `durable-objects`, `partyserver`, `astro`, `react`, `typescript`, `bun`, `neo-brutalism`
- [ ] **Upload a social preview image**: In GitHub **Settings -> General -> Social preview**, upload `apps/web/public/og-image.png` (or a custom 1280x640 banner).
- [ ] **Enable GitHub Discussions and Private Vulnerability Reporting**:
  - **Settings -> General -> Features**: Check **Discussions**.
  - **Settings -> Code security -> Private vulnerability reporting**: Click **Enable**.
- [ ] **Configure branch protection on `master`**:
  - **Settings -> Branches -> Add branch ruleset / protection rule** for `master`.
  - Require pull requests before merging and require status checks to pass:
    - `Typecheck, Unit Tests & Build`
    - `Server Integration Tests`
    - `E2E Tests (Playwright)`
- [ ] **Tag `v0.1.0` and publish the initial GitHub Release**:
  - `git tag -a v0.1.0 -m "v0.1.0"` and `git push origin v0.1.0`
  - Create a GitHub Release for `v0.1.0` using the `[0.1.0]` notes from [`CHANGELOG.md`](../CHANGELOG.md).
- [ ] **Announce and launch**: Post on Show HN (`Show HN: Undercover – Zero-login in-person social deduction word game on Durable Objects`) and relevant Reddit communities (`r/webdev`, `r/reactjs`, `r/boardgames`, `r/opensource`).
