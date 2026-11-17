# Contributing to Undercover

Thank you for your interest in contributing to Undercover. This document covers local development setup, verification suites, architecture rules, and pull request conventions.

## Prerequisites

- **Bun**: v1.3 or higher
- **Node.js**: v22 LTS or higher (specified in `.nvmrc`)
- **Git**: Any recent version

Alternatively, you can launch a preconfigured environment with one click using GitHub Codespaces or a local Dev Container via `.devcontainer/devcontainer.json`.

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/aarabii/undercover.git
   cd undercover
   ```

2. Copy the local environment configuration files:
   ```bash
   cp apps/web/.env.example apps/web/.env
   cp apps/server/.dev.vars.example apps/server/.dev.vars
   ```
   Both `.example` files contain working `localhost` defaults and Cloudflare Turnstile always-pass test keys (`1x00000000000000000000AA` for the client site key and `1x0000000000000000000000000000000AA` for the server secret key), so no external account or secret setup is required for local development.

3. Install workspace dependencies:
   ```bash
   bun install
   ```

4. Start the local development servers:
   ```bash
   bun run dev
   ```
   This starts both workspaces concurrently:
   - **Web client (`apps/web`)**: `http://localhost:4321`
   - **Game server (`apps/server`)**: `http://127.0.0.1:8787`

## Verification and Test Suites

Run these commands from the repository root before submitting changes:

| Command | Description |
| --- | --- |
| `bun run test` | Runs unit and simulation tests for `@game/engine`, `@game/protocol`, and `@game/words`. |
| `bun run test:server` | Runs Cloudflare Workers and Durable Objects SQLite integration tests via Vitest and `workerd`. |
| `bun run test:e2e` | Runs Playwright multi-player browser end-to-end tests. |
| `bun run test:all` | Runs all test suites (`test`, `test:server`, `test:e2e`) in sequence. |
| `bun run validate:words` | Validates word pack JSON schema, duplicate entries, pair symmetry, and difficulty tier counts. |
| `bun run check:boundaries` | Verifies that `apps/web` never imports `@game/words`. |
| `bun run typecheck` | Runs TypeScript type checking (`tsc --noEmit`) across all workspaces. |
| `bun run build` | Runs the Astro static check and production build for `apps/web`. |

## Project Layout and Architecture

Undercover is a Bun workspace monorepo split into `apps/` (`apps/web`, `apps/server`) and `packages/` (`packages/types`, `packages/protocol`, `packages/words`, `packages/engine`).

For detailed architecture and state machine documentation, read:
- [`docs/architecture.md`](./docs/architecture.md) — Monorepo structure, data flow, Durable Object persistence, and network protocol.
- [`packages/engine/README.md`](./packages/engine/README.md) — Pure state machine phases, transitions, invariants, and projection rules.

### Package Boundary Rules

Strict boundaries keep game logic deterministic and prevent secret word pairs from leaking into the client bundle:

1. **`packages/words` (`@game/words`) is strictly server-only**:
   - It must never be imported by `apps/web` (neither runtime nor type imports).
   - This rule is enforced automatically in CI and locally by `bun run check:boundaries`.
2. **`packages/engine` (`@game/engine`) is a pure, deterministic state machine with zero I/O**:
   - Do not call `Date.now()`, `Math.random()`, timers, network APIs, or storage APIs inside `packages/engine`.
   - All non-determinism (timestamps, random number generation, secret word pair selection, IDs) must be injected by the caller through `EngineContext`.
3. **`packages/types` (`@game/types`) has zero runtime dependencies**:
   - Keep this package limited to shared TypeScript types, interfaces, and constants.

## How to Contribute

### What Contributions Are Wanted

- **Word pairs and language packs**: Adding balanced word pairs, difficulty tiers, or new language packs. Follow the guidelines in [`docs/word-packs.md`](./docs/word-packs.md) and run `bun run validate:words`.
- **Accessibility improvements**: Keyboard navigation, screen reader announcements, focus management, and contrast improvements.
- **UI polish and bug fixes**: Fixing layout issues, animation edge cases, or reconnection bugs.
- **Test coverage**: Expanding unit, Durable Object integration, or multi-player Playwright test scenarios.

See [`ROADMAP.md`](./ROADMAP.md) for planned features and current priorities.

### Proposing Larger Changes

Before writing code for major features, protocol changes, or architectural refactors, open a GitHub issue or discussion first to align on design and scope.

### Branch and Commit Conventions

Create a descriptive branch from `master` using one of the standard prefixes:
- `feat/<short-description>` — New features or word packs
- `fix/<short-description>` — Bug fixes
- `docs/<short-description>` — Documentation updates
- `chore/<short-description>` — Build, tooling, test, or dependency updates

Format commit messages and pull request titles using [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: ...`
- `fix: ...`
- `docs: ...`
- `test: ...`
- `refactor: ...`
- `chore: ...`

### Pull Request Checklist

Before opening or marking a pull request ready for review, verify that:

- [ ] `bun run typecheck` passes with zero errors.
- [ ] `bun run check:boundaries` passes.
- [ ] `bun run validate:words` passes (especially if any files under `packages/words` were modified).
- [ ] `bun run test` and `bun run test:server` pass (and `bun run test:e2e` if UI or server behavior changed).
- [ ] `bun run build` succeeds.
- [ ] Relevant documentation in `docs/` or package READMEs has been updated to reflect any behavior or protocol changes.
