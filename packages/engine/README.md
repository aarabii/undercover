# @game/engine

The pure game state machine for **Undercover / Mr. White**.

## Core Principles

1. **Strict Purity**: Zero I/O, no `Date.now()`, no `Math.random()`, no Cloudflare/DOM/Bun APIs.
2. **Zero Runtime Dependencies**: Depends strictly on `@game/types`. All validation is internal; serialization and network schemas live in `@game/protocol`.
3. **Injected Context**: All non-deterministic dependencies (time, random numbers, ID generation, word bank) are injected via `EngineContext`.
4. **Immutability**: Input states are never mutated. Tested under deep freeze.
5. **Safe Failures**: Invalid actions return `{ state, error: { code, message } }` rather than throwing exceptions.
6. **Deterministic Replay**: Given an initial state, a sequence of timestamped actions, and seeded context functions, replay produces an identical final room state.

---

## Architecture & API

### Injected Context (`EngineContext`)

```ts
export interface EngineContext {
  now: number;               // Current UNIX epoch timestamp (ms)
  rng: () => number;         // Pseudo-random float [0, 1)
  newId: () => string;       // Unique ID generator for players/resources
  words: WordBank;           // Injected word bank interface
}

export interface WordBank {
  getWordPair(
    category: string,
    difficulty: Difficulty,
    usedPairIds: string[],
    rng?: () => number
  ): WordPair | null;
}
```

### Core Functions

#### 1. `createRoom(params): Room`
Creates a fresh room in the `LOBBY` phase with default settings and the creator registered as the initial host.

#### 2. `reduce(state: Room, action: Action, ctx: EngineContext): ReduceResult`
Executes an action against the given room state and returns:
- `state`: The updated room state (or identical state if an error occurred).
- `error?`: An error object `{ code: string; message: string }` if the action was invalid or forbidden.
- `effects?`: Outbound effects for the server transport (`send`, `close`).
- `alarmAt?`: Next timestamp (ms) when the server should schedule an alarm, or `null` to cancel.

```ts
export interface ReduceResult {
  state: Room;
  error?: { code: string; message: string };
  effects?: EngineEffect[];
  alarmAt?: number | null;
}
```

#### 3. `viewFor(state: Room, playerId: string, now?: number): RoomView`
Projects a secure, player-specific snapshot (`RoomView`) guaranteed never to leak:
- Opposing or foreign words.
- Infiltrator roles to Civilians or active players when `showRoles = false`.
- Secret token hashes or private connection metadata.
- Other players' cast votes during active voting (only voter counts are shown until tally).

#### 4. `nextAlarm(state: Room): number | null`
Calculates the next earliest timestamp requiring a timer wake-up (phase timers or host migration grace alarms).

---

## Action Reference

| Action | Phase | Description |
| --- | --- | --- |
| `hello` | ANY | Player enters or reconnects to the room with token hash & profile. |
| `profile.update` | LOBBY | Updates name (sanitized, auto-suffixed if duplicate) or avatar. |
| `leave` | ANY | Player voluntarily leaves. In game, eliminated immediately with role revealed. |
| `disconnect` | ANY | Connection drops; player marked as `presence: away`. |
| `connect` | ANY | Connection restored; player marked as `presence: online`. |
| `tick` | ANY | Timer alarm fired at timestamp `now`. Progresses phases or executes migrations. |
| `host.settings.update` | LOBBY | Host adjusts game settings (player ratios, timer durations, categories). |
| `host.approve` / `host.decline` | ANY | Host admits or rejects a pending player. |
| `host.kick` | ANY | Host kicks and bans a player. In game, eliminates player and voids votes. |
| `host.lock` | ANY | Host toggles room lock preventing new entrants. |
| `host.transfer` | ANY | Host transfers lobby ownership to another player. |
| `host.start` | LOBBY | Validates player counts, shuffles roles via Fisher-Yates, picks word pair, starts game. |
| `host.pause` / `host.resume` | In-Game | Freezes/resumes phase timer while keeping disconnect alarms active. |
| `host.skip` | In-Game | Skips remaining discussion or role reveal time directly into next phase. |
| `host.endVoting` | VOTING | Immediately closes voting and executes tally. |
| `host.endGame` | In-Game | Host terminates active game and returns room to lobby. |
| `host.playAgain` | GAME_OVER | Host restarts game into lobby, resetting state while retaining settings & pair history. |
| `vote.cast` | VOTING | Active player votes for another active player. Closes early if all alive online players vote. |
| `mrwhite.guess` | MRWHITE_GUESS | Voted-out Mr. White guesses civilian word (with fuzzy normalization). |

---

## Phase Lifecycle

```
[LOBBY]
   │ host.start (Fisher-Yates shuffle, word pair selection)
   ▼
[ROLE_REVEAL] (endsAt timer or host.skip)
   │
   ▼
[DISCUSSION] ◄──────────────────────────────────────────────┐
   │ (endsAt timer or host.skip; host.pause supported)      │
   ▼                                                        │
[VOTING]                                                    │
   │ (endsAt timer, all voted, or host.endVoting)           │ Tie or game
   ▼                                                        │ continues
[ELIMINATION] (6s reveal screen)                            │
   │                                                        │
   ├──► [MRWHITE_GUESS] (if Mr. White voted out)            │
   │        │ mrwhite.guess or timer expires                │
   │        ├── Correct guess: Infiltrators Win ──► [GAME_OVER]
   │        └── Wrong / Timeout: Win check ─────────┼───────┤
   │                                                ▼       │
   └──► Win check ────────────────────────────► [GAME_OVER] │
           │                                                │
           └────────────────────────────────────────────────┘
```

---

## Testing & Verification

Run tests:
```bash
bun test packages/engine
```

Run test coverage:
```bash
bun test --coverage packages/engine
```

- **Test Coverage**: $\ge 96.6\%$ line coverage.
- **Edge-Case Matrix**: Complete Spec §17 test matrix implemented and verified.
- **Random Simulation**: 50-game seeded Monte Carlo simulation verifying schema compliance, anti-leak guarantees, and 100% deterministic replayability.
