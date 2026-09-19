# undercover

> Real-time, zero-login social deduction word game for in-person groups and calls. Built with Astro, React, Cloudflare Workers, and PartyServer.

![Undercover Preview](/apps/web/public/favicon.svg)

---

## 🕵️ The Game

**Undercover** is a party game of deduction, deception, and bluffing for 3–20 players.

- **👥 Civilian (Majority)**: Everyone receives the same secret word. Give subtle clues to spot who doesn't belong without revealing the exact word to Mr. White.
- **🎭 Undercover (Infiltrator)**: You receive a subtly different word (e.g. *Coffee* vs *Tea*). Blend in, deduce what the civilians have, and deflect suspicion.
- **👻 Mr. White (Ghost)**: You receive NO word at all! Listen closely, bluff your way through, or guess the civilian word when caught to steal the victory.

---

## 🛠️ Architecture & Monorepo

This project is a TypeScript monorepo powered by **Bun workspaces**:

- **`apps/server`**: Cloudflare Workers backend powered by [PartyServer](https://github.com/partykit/partyserver) and Durable Objects for real-time WebSocket room state and synchronization.
- **`apps/web`**: Frontend built with [Astro](https://astro.build), [React](https://react.dev), and Tailwind CSS with a distinctive Neo-brutalist design system.
- **`packages/engine`**: Pure functional game state machine and reducer rules.
- **`packages/protocol`**: Shared WebSocket messaging protocol and Zod schemas.
- **`packages/types`**: Shared game state and player models.
- **`packages/words`**: Word pair datasets and generator algorithms.

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.3+ recommended)
- Node.js (v20+)

### Installation

```bash
bun install
```

### Local Development

Start both the Cloudflare Worker game server and the Astro web app concurrently:

```bash
bun run dev
```

- Web App: `http://localhost:4321`
- Game Server: `http://127.0.0.1:8787`

### Typecheck & Tests

```bash
# Typecheck all workspaces
bun run typecheck

# Run unit tests
bun test packages
```

---

## 📄 License

MIT © [aarabii](https://github.com/aarabii)
