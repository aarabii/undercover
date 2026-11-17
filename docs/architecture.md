# Architecture & Monorepo Map

## System Architecture

```mermaid
flowchart TD
    subgraph UI ["Client Layer (apps/web)"]
        Pages["Astro Shell (index.astro, play.astro)"]
        GameApp["GameApp (React Island Coordinator)"]
        Store["Zustand Game Store (gameStore.ts)"]
        Socket["PartySocket (Auto-Reconnect Client)"]
        CompRoom["components/room/ (Create, Join, Share)"]
        CompLobby["components/lobby/ (Roster, Settings, Modals)"]
        CompGame["components/game/ (Grid, Timers, RoleCard, MrWhite)"]
        CompScreens["components/screens/ (Waiting, Pending, Status)"]
        CompUI["components/ui/ (Neo-brutalist Primitives)"]
    end

    subgraph Server ["Server Layer (apps/server)"]
        WorkerEntry["index.ts (Cloudflare Worker Entry)"]
        RoomDO["room/room-server.ts (Room Durable Object)"]
        SQLite["SQLite Storage (room_state snapshot)"]
        Routes["routes/rooms.ts (REST: /rooms, CORS)"]
        Turnstile["turnstile.ts (Bot Verification)"]
        ServerWords["words.ts (ServerWordBank Service)"]
        PRNG["prng.ts (Seeded Mulberry32 RNG)"]
    end

    subgraph CorePackages ["Core Shared Packages (packages/)"]
        Protocol["@game/protocol (Zod 4 Schemas)"]
        Engine["@game/engine (Pure Reducer State Machine)"]
        Words["@game/words (Word Bank & 50/50 Picker)"]
        Types["@game/types (Zero-dependency TypeScript Models)"]
    end

    Pages --> GameApp
    GameApp --> Store
    Store --> Socket
    GameApp --> CompRoom
    GameApp --> CompLobby
    GameApp --> CompGame
    GameApp --> CompScreens
    CompGame --> CompUI

    Socket <-->|WebSocket wss://| RoomDO
    Pages <-->|REST POST/GET| Routes
    Routes --> Turnstile
    RoomDO --> SQLite
    RoomDO --> Engine
    RoomDO --> ServerWords
    RoomDO --> PRNG

    ServerWords --> Words
    UI --> Protocol
    UI --> Types
    Server --> Protocol
    Server --> Types
    Engine --> Types
    Protocol --> Types
    Words --> Types
```

## Monorepo Directory Structure

```
undercover/
├── apps/
│   ├── web/                          # Astro 7 + React 19 client island
│   │   ├── src/
│   │   │   ├── components/           # room/, lobby/, game/, screens/, ui/, GameApp.tsx
│   │   │   ├── lib/                  # REST API helpers, avatar renderer, storage
│   │   │   ├── pages/                # index.astro (landing/SEO), play.astro (SPA shell)
│   │   │   ├── stores/               # gameStore.ts (Zustand reactive game state)
│   │   │   └── styles/               # global.css (Tailwind v4 design tokens)
│   │   ├── astro.config.mjs
│   │   ├── vercel.json               # /r/:code rewrite to /play, CSP & headers
│   │   └── package.json
│   │
│   └── server/                       # Cloudflare Workers + PartyServer Durable Objects
│       ├── src/
│       │   ├── room/                 # room-server.ts (Room Durable Object with SQLite)
│       │   ├── routes/               # rooms.ts (POST /rooms, GET /rooms/:code, CORS)
│       │   ├── index.ts              # Worker fetch handler & PartyServer request router
│       │   ├── prng.ts               # Seeded Mulberry32 PRNG
│       │   ├── storage.ts            # SQLite state snapshot adapter
│       │   ├── turnstile.ts          # Cloudflare Turnstile validation
│       │   ├── utils.ts              # Room codes, token hashing, ID generators
│       │   └── words.ts              # ServerWordBank service
│       ├── wrangler.jsonc
│       └── package.json
│
├── packages/
│   ├── engine/                       # Pure game state machine (zero I/O, deterministic)
│   │   └── src/                      # rules/, state/, view/, reduce.ts
│   ├── protocol/                     # Zod 4 schemas for messages, models, and views
│   ├── types/                        # TypeScript types, enums, models, views
│   └── words/                        # Curated word pairs (server only, never sent to web)
│
├── tests/                            # e2e/, engine/, protocol/, server/, words/
├── scripts/
│   └── check-boundaries.ts           # Verifies web never imports @game/words
├── package.json                      # Monorepo workspaces and root scripts
└── tsconfig.base.json
```

## Package Dependency Boundaries

- **`packages/words` is strictly server-only.** Word lists and pairings are never imported into `apps/web`; clients only ever receive their single assigned word.
- **`bun run check:boundaries`** scans client code to guarantee no accidental `@game/words` imports.
- **`packages/engine` is zero I/O.** No `Date.now()`, `Math.random()`, or network/database calls — timestamps, PRNGs, IDs, and the word bank are injected via `EngineContext`.

## Core Game Engine & State Machine

### Pure Reducer Design

```ts
reduce(
  state: Room,
  action: ReducerAction,
  ctx: EngineContext // { now: number, rng: () => number, words: WordBank, newId: () => string }
): {
  state: Room;
  error?: string;
  effects: EngineEffect[];
  alarmAt: number | null;
}
```

The server hydrates state from SQLite, passes the incoming action into `reduce()`, saves the result, runs any side effects, and schedules the next deadline via the Durable Object alarm system (`alarmAt`).

### Phase State Machine

```mermaid
stateDiagram-v2
    [*] --> LOBBY
    LOBBY --> ROLE_REVEAL: Host clicks Start Game (Valid Setup)
    ROLE_REVEAL --> DISCUSSION: 10s Timer Ends or Host Skips
    DISCUSSION --> VOTING: Discussion Timer Ends or Host Skips
    VOTING --> ELIMINATION: All Voted, Timer Ends, or Host Ends Voting

    state ELIMINATION {
        [*] --> RevealResult: Display 6s Result Card
        RevealResult --> CheckOutcome
    }

    ELIMINATION --> MRWHITE_GUESS: Mr. White Voted Out (30s)
    ELIMINATION --> DISCUSSION: Tie / Nobody Voted / No Win Yet (Round+1)
    ELIMINATION --> GAME_OVER: Win Condition Met

    MRWHITE_GUESS --> GAME_OVER: Correct Guess (Infiltrators Win)
    MRWHITE_GUESS --> DISCUSSION: Wrong Guess / Timeout (Round+1)
    MRWHITE_GUESS --> GAME_OVER: Wrong Guess but Win Condition Met

    GAME_OVER --> LOBBY: Host clicks Rematch / Play Again
```

## Session Lifecycle & Reconnection

PartySocket auto-reconnects with exponential backoff and probes immediately on tab foreground. Lobby disconnects are held for 15 s; in-game disconnects are marked `away` and keep their seat until the round's vote concludes. If the host disconnects, host authority transfers to the earliest-joined connected player after 15 s.

## Related Documentation

- [`@game/engine` Package Documentation](../packages/engine/README.md)
- [Real-Time Protocol & Messages](./protocol.md)
- [Security, Anti-Cheat & Privacy](./security.md)
