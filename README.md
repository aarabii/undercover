# Undercover

Real-time, zero-login, in-person social deduction word game for 4–20 players.

[![CI](https://github.com/aarabii/undercover/actions/workflows/ci.yml/badge.svg)](https://github.com/aarabii/undercover/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/aarabii/undercover?style=flat)](https://github.com/aarabii/undercover/stargazers)

**Play now:** [https://undercover.aarab.me](https://undercover.aarab.me)

<!-- TODO: Replace placeholder below with recorded demo GIF (docs/assets/demo.gif) and screenshots (docs/assets/lobby.png, docs/assets/role-card.png, docs/assets/voting.png) -->
> **TODO:** Add demo GIF at `docs/assets/demo.gif` and gameplay screenshots under `docs/assets/`.

## Why This Is Different

Undercover is built for groups sitting in the same room or talking on a voice call:

- **Zero login:** Create or join a 6-character room code in seconds without accounts, passwords, or app downloads.
- **In-person referee:** The app distributes secret words, runs synchronized timers, tallies anonymous votes, and checks win conditions while players talk out loud.
- **No chat feed:** Clues and accusations happen face-to-face or over voice, not in a text box.
- **No sound or vibration:** Zero audio cues or haptics that could leak a player's role to someone sitting next to them.
- **Privacy card auto-hide:** The secret word card closes automatically whenever a player switches tabs, blurs the window, or locks their phone.

## Roles

| Role                           | Given Content                            | Objective                                                                                       |
| :----------------------------- | :--------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Civilian** _(majority)_      | The civilian secret word (e.g. _Coffee_) | Give subtle clues to expose infiltrators without tipping off Mr. White to the exact word.       |
| **Undercover** _(infiltrator)_ | A closely related word (e.g. _Tea_)      | Blend in, deduce the civilian word, and survive until infiltrators reach parity with civilians. |
| **Mr. White** _(infiltrator)_  | No word at all (blank card)              | Bluff through the rounds and guess the civilian word if voted out.                              |

> [!NOTE]
> Civilians and Undercovers both only see a word on their screen — neither knows their own role for certain.

## Quickstart

Requires [Bun](https://bun.sh) v1.3+ and [Node.js](https://nodejs.org) v22 LTS+.

```bash
git clone https://github.com/aarabii/undercover.git && cd undercover
cp apps/web/.env.example apps/web/.env
cp apps/server/.dev.vars.example apps/server/.dev.vars
bun install
bun run dev
```

Open `http://localhost:4321` for the web client (connected to the local game server on `http://127.0.0.1:8787`).

## Tech Stack

Built as a Bun TypeScript monorepo with an Astro 7 and React 19 client (Zustand, Tailwind CSS v4), a Cloudflare Workers and PartyServer Durable Objects server backed by SQLite, Zod 4 protocol schemas, and a pure zero-I/O game engine reducer.

## Testing

```bash
bun run test              # Unit & simulation tests (engine, protocol, words)
bun run test:server       # Cloudflare Workers integration tests (workerd + SQLite)
bun run test:e2e          # Playwright multi-player end-to-end tests
bun run test:all          # All test suites in sequence
bun run validate:words    # Validate word pack schema, duplicates, and tier counts
bun run check:boundaries  # Verify web client never imports @game/words
bun run typecheck         # TypeScript checks across all workspaces
bun run build             # Astro static production build
```

## Documentation

- [Game Rules & Mechanics](./docs/game-rules.md) — Win conditions, timers, and Mr. White guess normalization.
- [Architecture & State Machine](./docs/architecture.md) — System diagram, monorepo layout, package boundaries, reducer design, phase state machine, and session lifecycle.
- [Real-Time Protocol & Messages](./docs/protocol.md) — Client and server WebSocket message tables.
- [Security, Anti-Cheat & Privacy](./docs/security.md) — Server-authoritative state projection, vote privacy, and bot mitigation.
- [Design System](./docs/design-system.md) — Neo-brutalist aesthetic, typography, motion, and color tokens.
- [Word Bank & Randomness Engine](./docs/word-bank.md) — Categories, difficulty tiers, 50/50 role word assignment, and seeded PRNG.
- [Adding Word Packs](./docs/word-packs.md) — Word pair format, quality guidelines, and validator usage.
- [Self-Hosting & Deployment](./docs/self-hosting.md) — Deploying to Cloudflare Workers and Vercel with custom domains and Turnstile keys.

## Contributing

Contributions are welcome — from adding word pairs in [`packages/words`](./packages/words) to improving accessibility or tackling items on the [Roadmap](./ROADMAP.md). Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for development setup, test commands, and pull request guidelines, and [`docs/word-packs.md`](./docs/word-packs.md) for adding or curating word pairs. Please follow our [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.
