# 🕵️ Undercover Party Game — Build Spec & Checklist

> Working title. A real-time, no-login, **in-person / on-a-call** social-deduction word game.
> Players talk out loud (or on a call); the app is the referee: rooms, roles, words, timers, votes, win checks.

**Legend:** `[ ]` todo · `[x]` done · 🔒 locked decision · ❓ open decision · 💡 my suggestion (change it if you disagree)

---

## 0. Scope

### In v1

- Create / join room (6-char code, link, QR), no accounts
- Avatar + name profile saved in the browser
- Host lobby with settings, approvals, kick, lock, host transfer
- Roles: Civilian, Undercover, Mr. White
- Discussion timer → voting → elimination → win check → rematch
- Mr. White's final guess
- Disconnect / reconnect handling, host migration
- Waiting room for late joiners
- Neo-brutalist mobile-first UI
- SEO pages (landing, how to play, roles, sample word pairs)

### Explicit non-goals (v1)

- ❌ Accounts / login
- ❌ In-app clue entry, chat, voice (players talk in person or on a call)
- ❌ Custom word pairs
- ❌ Sounds and vibration (a buzz or beep could reveal who is who if players share a room)
- ❌ Scores / leaderboard across games (parked for v2, see §14)
- ❌ Public rooms / matchmaking
- ❌ Extra roles (Detective etc.)

---

## 1. Locked decisions 🔒

| #   | Decision                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | Players talk out loud, so there is **no clue-entry phase**. The discussion phase is a timer.                                                                                |
| L2  | Minimum **4 players** to start.                                                                                                                                             |
| L3  | Room code: **6 characters**, alphanumeric, uppercase, no `0` and no `O` (see D1 about also removing `1`/`I`).                                                               |
| L4  | **Standard win rules** (see §3.4).                                                                                                                                          |
| L5  | A **tie = nobody is eliminated**; the next round starts and people discuss more (no formal runoff).                                                                         |
| L6  | "Show role" is a host setting. **Off by default.**                                                                                                                          |
| L7  | Mr. White always sees the "you are Mr. White" card, because they have no word.                                                                                              |
| L8  | Categories + difficulty for word pairs. **No custom pairs.**                                                                                                                |
| L9  | Lobby disconnect grace **15 s**. In game, a disconnected player stays until the **end of the current round**, when they are eliminated. Host can pause the timer.           |
| L10 | Host leaves or disconnects → another player becomes host automatically.                                                                                                     |
| L11 | Late joiners wait in a **waiting room** until the host accepts them; they play the next game.                                                                               |
| L12 | Server is **authoritative**. Clients never receive other players' words or roles.                                                                                           |
| L13 | Stack: Bun monorepo · Astro + React · Tailwind · Motion · Zustand · shadcn (neobrutalism) · Cloudflare Workers + Durable Objects · Vercel for the web app · Cloudflare DNS. |
| L14 | Name limit **16 chars**, sanitized.                                                                                                                                         |
| L15 | Inputs, QR code + link invite, auto-hide info on tab blur, rate limiting, empty-room cleanup: **all yes**.                                                                  |

---

## 2. Tech stack & repo

### 2.1 Stack

| Layer                             | Choice                                                                           | Notes                                                                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Package manager / scripts / tests | **Bun** workspaces                                                               | Bun is only the tool. The server runs on Cloudflare's runtime (workerd), **not** Bun. No `Bun.*` APIs in `server`, `engine`, `protocol`. |
| Language                          | TypeScript (strict) everywhere                                                   |                                                                                                                                          |
| Web framework                     | **Astro** (static output) + **React** islands                                    | Static HTML for SEO pages; the game is one React island                                                                                  |
| Styling                           | Tailwind CSS v4 + **shadcn** + neobrutalism component registry                   | See §12 for tokens                                                                                                                       |
| Animation                         | **Motion**                                                                       | Keep it snappy; respect `prefers-reduced-motion`                                                                                         |
| Client state                      | **Zustand**                                                                      | Holds the server `view`, connection status, local UI toggles                                                                             |
| Realtime client                   | **PartySocket**                                                                  | Auto-reconnect + buffering                                                                                                               |
| Realtime server                   | **Cloudflare Workers + Durable Objects** via **PartyServer**                     | One Durable Object per room code                                                                                                         |
| Persistence                       | Durable Object **SQLite storage**                                                | Snapshot the room after each state change                                                                                                |
| Validation                        | **Zod**                                                                          | Every message in both directions                                                                                                         |
| Avatars                           | **DiceBear** (client-side render)                                                | Store `{style, seed, options}`, never images                                                                                             |
| QR                                | client-side QR library                                                           | From the invite URL                                                                                                                      |
| Abuse protection                  | Cloudflare **Turnstile** + rate limiting                                         | Room creation + message rate limits                                                                                                      |
| Tests                             | `bun test` (engine), Vitest + Workers pool (server), Playwright (e2e)            |                                                                                                                                          |
| Hosting                           | **Vercel** (web) · **Cloudflare** (server + DNS)                                 |                                                                                                                                          |
| CI/CD                             | GitHub Actions (server) · Vercel Git integration (web)                           |                                                                                                                                          |
| Analytics                         | Privacy-friendly (Plausible / Umami / Cloudflare Web Analytics) + Search Console |                                                                                                                                          |

### 2.2 Repo layout

```
undercover/
├─ package.json            # "workspaces": ["apps/*", "packages/*"]
├─ bun.lock
├─ apps/
│  ├─ web/                 # Astro + React + Tailwind + shadcn → Vercel
│  └─ server/              # Worker + Room Durable Object → wrangler deploy
└─ packages/
   ├─ engine/              # PURE game logic (no I/O, no Date.now, no Math.random)
   ├─ protocol/            # Zod schemas + types + shared constants
   └─ words/               # word bank (SERVER ONLY, never import from web)
```

- [x] Init monorepo with Bun workspaces
- [x] `engine` has zero dependencies on Cloudflare, DOM, or Bun
- [x] `web` must never import `words` (add a lint rule or dependency-boundary check)
- [ ] Shared `tsconfig.base.json`, ESLint, Prettier
- [x] Root scripts: `dev` (web + server together), `test`, `typecheck`, `build`, `check:boundaries`

### 2.3 Engine design (keep transport-independent)

```ts
reduce(state, action, ctx: { now: number; rng: () => number; words: WordBank })
  → { state, effects }          // effects: schedule timer, send to player, broadcast, persist
viewFor(state, playerId) → RoomView   // sanitized snapshot for ONE player
```

- [x] The Durable Object is a thin shell: parse message → `reduce` → apply effects
- [x] Time and randomness are injected, so tests are deterministic
- [ ] If you ever leave Cloudflare, only `apps/server` is rewritten

---

## 3. Game rules spec

### 3.1 Roles

| Role       | Gets                         | Goal                                               |
| ---------- | ---------------------------- | -------------------------------------------------- |
| Civilian   | Civilian word                | Eliminate every Undercover and Mr. White           |
| Undercover | A similar but different word | Survive until infiltrators ≥ civilians             |
| Mr. White  | **No word**                  | Survive, or guess the Civilian word when voted out |

- Undercover and Mr. White are together called **infiltrators**.
- Players normally **do not know their own role**. They only see a word, and the Undercover doesn't know their word is different. That uncertainty is the game.
- Mr. White knows because their card is blank.

### 3.2 Role distribution

- [x] Hard validation at start: `infiltrators ≥ 1` and `civilians ≥ infiltrators + 1`
- [x] Hard cap: `undercover + mrWhite ≤ floor((n − 1) / 2)`
- [ ] 💡 Suggested defaults: `floor(n / 3)` infiltrators (min 1): 4–5 → 1, 6–8 → 2, 9–11 → 3, 12–14 → 4
- [ ] 💡 Default mix: 1 Undercover only for n ≤ 5; add 1 Mr. White from n ≥ 6
- [ ] Show a warning (not an error) when infiltrators > `n / 3` ("very hard for civilians")
- [x] Assign roles with a server-side shuffle (Fisher–Yates using injected `rng`)

### 3.3 Words

- [ ] Word bank record: `{ id, category, difficulty, a, b, accept?: string[] }`
- [ ] Difficulty = how close the two words are (easy = clearly different, hard = very similar)
- [x] Each game randomly decides which of `a` / `b` is the Civilian word (so pair order never leaks)
- [x] Track `usedPairIds` per room; don't repeat until the pool is exhausted
- [ ] Host picks `category` (or Random) and `difficulty` (or Mixed)
- [x] Words live **only on the server**. Never ship the bank in the web bundle
- [ ] 💡 SEO pages show only a **sample** (30–50 pairs), not the full bank. A public full list lets players look up their word's partner

### 3.4 Win conditions (standard rules) 🔒

After **every** elimination (vote, disconnect, leave, kick) compute:

| Alive civilians (C) | Alive infiltrators (I) | Result                                                             |
| ------------------- | ---------------------- | ------------------------------------------------------------------ |
| any                 | `I = 0`                | **Civilians win**                                                  |
| any                 | `I ≥ C`                | **Infiltrators win**                                               |
| `C > I > 0`         |                        | Game continues                                                     |
| —                   | —                      | **Also:** a correct Mr. White guess → Infiltrators win immediately |

- [x] Unit-test this table exhaustively for n = 4…20
- [x] If nobody is left alive/connected: abort game → back to lobby (no winner)

### 3.5 Voting

- [x] One vote per alive player per round; can **change** the vote until voting closes
- [x] Cannot vote for: yourself, eliminated players, waiting/pending players
- [x] Eliminated, waiting and pending players cannot vote
- [x] Voting closes when: **(a)** every alive player (including `away` ones) has voted, **(b)** the vote timer ends, or **(c)** host taps "End voting"
- [x] 💡 `away` players count as "not voted", so a brief blip never triggers an early close and eliminates someone
- [x] Most votes → eliminated
- [x] **Tie for the top** → nobody eliminated (L5)
- [x] **Nobody voted** → nobody eliminated (treated as a tie)
- [x] Votes are hidden until the tally. After the tally show **vote counts per player** (not who voted for whom) ❓ D5

### 3.6 Elimination

- [ ] Eliminated player's role is **revealed to everyone** (that's how everyone tracks the counts)
- [ ] Eliminated avatar: greyscale + skull icon overlay
- [ ] Eliminated players stay in the room and can watch, but cannot vote
- [ ] Elimination reasons: `VOTED` · `DISCONNECTED` · `LEFT` · `KICKED`
- [ ] Order inside one round-end: **(1)** eliminate still-`away` players → **(2)** void votes cast for them → **(3)** tally remaining votes → **(4)** eliminate top target (if any) → **(5)** if a Mr. White was voted out, run the guess → **(6)** win check
- [ ] Two eliminations in one round are possible (one disconnect + one vote)

### 3.7 Mr. White's final guess (in-person friendly)

Because everyone is in the same room or call, Mr. White does **not** need to speak the guess for a human to judge. The server already knows the word, so nobody has to judge.

- [ ] Triggered only when Mr. White is eliminated by **vote**. A disconnected / left / kicked Mr. White gets **no** guess
- [ ] Phase `MRWHITE_GUESS`: Mr. White's screen shows a text input + timer (default 30 s). Everyone else sees "Mr. White is making a final guess…"
- [ ] Mr. White types the guess. The server compares it to the Civilian word after normalization
- [ ] **Correct** → Infiltrators win immediately (reveal the word)
- [ ] **Wrong or time runs out** → reveal the guess and continue to the win check
- [ ] Multiple Mr. Whites: each gets their own guess when eliminated
- [ ] Normalization: lowercase · trim · collapse spaces · strip accents · strip punctuation · drop leading articles (`the`, `a`, `an`) · treat simple plurals as equal
- [ ] Also accept: entries in the pair's `accept[]` aliases · edit distance ≤ 1 when the word has ≥ 5 letters
- [ ] ❓ D6 optional: host "Accept anyway" button for near-misses (allowed to override wrong → correct only)

### 3.8 Ties and stalls

- [ ] Show "TIE — nobody eliminated". Highlight the tied players; the next round's discussion starts
- [ ] Round counter increments; votes reset
- [ ] Host has an **End game** button (returns everyone to the lobby) in case of endless stalemates

---

## 4. Phase state machine

```
LOBBY ──host start (valid)──▶ ROLE_REVEAL (10s, host can skip)
   ▲                              │
   │                              ▼
   │                          DISCUSSION  (timer; host may PAUSE / SKIP)
   │                              │
   │                              ▼
   │                           VOTING     (timer; host may PAUSE / END NOW)
   │                              │
   │                              ▼
   │                         ELIMINATION  (result screen ~6s)
   │                   ┌──────────┴───────────┐
   │        Mr. White voted out?             otherwise
   │                   ▼                       │
   │             MRWHITE_GUESS ── correct ──▶ GAME_OVER
   │                   │ wrong / timeout       │
   │                   └──────▶ WIN CHECK ◀────┘
   │                               │
   │              not over ────────┴──────── over
   │                 ▼                          ▼
   │            DISCUSSION (round+1)        GAME_OVER
   └──────────── host "Play again" ◀───────────┘
```

- [x] Every phase change stores `endsAt` (absolute server time) and persists a snapshot
- [ ] 💡 `ROLE_REVEAL` (10 s) stops the discussion clock burning while people read their cards. Drop it if you dislike it
- [x] Phase guards: every incoming message is rejected unless valid for the current phase and sender

### 4.1 Timers

| Timer                             | Default                         | Host-configurable |
| --------------------------------- | ------------------------------- | ----------------- |
| Role reveal                       | 10 s                            | no                |
| Discussion                        | 3:00                            | yes (0:30–10:00)  |
| Voting                            | 1:00                            | yes (0:20–3:00)   |
| Elimination result                | 6 s                             | no                |
| Mr. White guess                   | 0:30                            | yes (0:15–1:00)   |
| Lobby disconnect grace            | 15 s                            | no                |
| Host reassignment delay (in game) | 15 s                            | no                |
| Empty-room cleanup                | 30 min after last socket closes | no                |
| Reserved-code expiry              | 10 min if host never connects   | no                |

- [x] All timers use **absolute `endsAt` timestamps** from the server. Clients only render a countdown (sync offset using the `serverNow` in each snapshot)
- [x] Use **Durable Object alarms**, not `setTimeout` (timers must survive hibernation). One alarm per object, so keep a sorted timer list and set the alarm to the earliest
- [x] **Pause** (host): store `remainingMs`, cancel alarm, show "PAUSED" overlay to everyone. Resume sets `endsAt = now + remainingMs`
- [x] While paused: no votes accepted, no phase advancing; reconnects still work
- [x] **Skip** (host): Discussion → Voting immediately. Role reveal → Discussion

---

## 5. Data model

```ts
type Phase = 'LOBBY' | 'ROLE_REVEAL' | 'DISCUSSION' | 'VOTING'
           | 'ELIMINATION' | 'MRWHITE_GUESS' | 'GAME_OVER'

type Status   = 'pending' | 'waiting' | 'active' | 'eliminated'
type Presence = 'online' | 'away'
type Role     = 'CIVILIAN' | 'UNDERCOVER' | 'MR_WHITE'
type ElimReason = 'VOTED' | 'DISCONNECTED' | 'LEFT' | 'KICKED'

interface AvatarConfig { style: AllowedStyle; seed: string; options?: Record<string, string | number | boolean> }

interface Player {
  id: string                 // public id
  tokenHash: string          // hash of the private reconnect token
  name: string               // ≤ 16 chars, sanitized, unique in room
  avatar: AvatarConfig
  status: Status
  presence: Presence
  joinedAt: number
  lastSeenAt: number
  disconnectedAt?: number    // timestamp ms when disconnected
  role?: Role                // server-only during a game
  word?: string | null       // server-only (Mr. White = null)
  eliminated?: { reason: ElimReason; round: number }
}

interface Settings {
  undercoverCount: number
  mrWhiteCount: number
  category: string | 'random'
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  showRoles: boolean         // default false
  discussionSeconds: number
  votingSeconds: number
  mrWhiteGuessSeconds: number
  requireApproval: boolean   // default true
  maxPlayers: number         // default 12, hard cap 20
}

interface Room {
  code: string
  createdAt: number
  hostId: string
  locked: boolean
  bannedTokenHashes: string[]
  settings: Settings
  players: Player[]
  phase: Phase
  round: number
  endsAt: number | null
  paused: { remainingMs: number } | null
  game?: { civilianWord: string; undercoverWord: string; pairId: string; votes: Record<string,string>; lastResult?: ... }
  usedPairIds: string[]
  timers: Timer[]
}
```

### 5.1 What each client receives (`RoomView`)

- [ ] Public roster: `id, name, avatar, status, presence, isHost`, plus `eliminated {reason}` and the **revealed role** only for eliminated players
- [ ] `phase, round, endsAt, paused, settings, serverNow, locked, code`
- [ ] `me`: own id/status + `card` (see §7). **No role field is ever sent when `showRoles` is off**
- [ ] `myVote` and `votedCount` (e.g., "5/8 voted"). Never other players' votes before the tally
- [ ] Host only: `pending[]` join requests
- [ ] At `GAME_OVER`: everyone's role + word and both words
- [ ] Send the **full snapshot** on every change (it's tiny). No patches, so reconnects are trivial

---

## 6. Message protocol

### 6.1 Client → Server

| Message                                               | Who                      | Allowed in                        |
| ----------------------------------------------------- | ------------------------ | --------------------------------- |
| `hello {code, playerId?, token?, profile}`            | anyone                   | any (join or reconnect)           |
| `profile.update {name?, avatar?}`                     | self                     | LOBBY, waiting, pending           |
| `vote.cast {targetId}`                                | active alive             | VOTING                            |
| `mrwhite.guess {text}`                                | the eliminated Mr. White | MRWHITE_GUESS                     |
| `leave`                                               | self                     | any                               |
| `host.settings.update {patch}`                        | host                     | LOBBY                             |
| `host.approve {playerId}` / `host.decline {playerId}` | host                     | any                               |
| `host.kick {playerId}`                                | host                     | any                               |
| `host.lock {locked}`                                  | host                     | any                               |
| `host.transfer {playerId}`                            | host                     | any                               |
| `host.start`                                          | host                     | LOBBY                             |
| `host.pause` / `host.resume`                          | host                     | DISCUSSION, VOTING, MRWHITE_GUESS |
| `host.skip`                                           | host                     | ROLE_REVEAL, DISCUSSION           |
| `host.endVoting`                                      | host                     | VOTING                            |
| `host.endGame`                                        | host                     | any in-game phase                 |
| `host.playAgain`                                      | host                     | GAME_OVER                         |

### 6.2 Server → Client

- `state {view}` (full sanitized snapshot)
- `error {code, message}`
- `declined` · `kicked` · `replaced` ("opened in another tab") · `roomClosed`

### 6.3 Rules

- [x] Every message validated with Zod; unknown types rejected
- [x] Host-only messages check `sender.id === room.hostId` **on the server**
- [x] Max message size (~2 KB) and per-connection rate limit (e.g., 20 msgs / 5 s → close with code 1008)
- [x] Idempotent handlers (a double-tapped vote is harmless)

---

## 7. Role / word card (the info button)

The top-of-screen button toggles a card the player can show or hide. The **server** decides what the card contains, so nothing leaks when roles are off.

| Situation                             | Card title          | Content | Body text (copy 💡)                                                                                                                |
| ------------------------------------- | ------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Mr. White** (always)                | `YOU ARE MR. WHITE` | no word | "You don't have a word. Play along, listen to everyone, and try to work out the word. If you're voted out you get one last guess." |
| **Civilian**, roles ON                | `CIVILIAN`          | word    | "This is your word. Play along: describe it without saying it, and spot who's different."                                          |
| **Undercover**, roles ON              | `UNDERCOVER`        | word    | "Your word is different from everyone else's. Play along and blend in."                                                            |
| **Civilian or Undercover**, roles OFF | `YOUR WORD`         | word    | "This is your word. Play along: describe it without saying it, and figure out who's different." _(identical for both roles)_       |

- [ ] Card starts **hidden** ("TAP TO SEE MY INFO"); button toggles Show / Hide
- [ ] **Auto-hide** when the tab loses focus / page is backgrounded
- [ ] 💡 Optional: auto-hide after ~10 s
- [ ] Payload uses a variant enum (`MR_WHITE | CIVILIAN | UNDERCOVER | WORD_ONLY`) plus `word`. The client maps variant → copy
- [ ] Roles OFF: the payload contains **no** `role` field at all for Civilians / Undercover
- [ ] Card is available in all in-game phases until the player is eliminated (then it shows their revealed role)

---

## 8. Identity, storage, avatars

### 8.1 Browser storage (localStorage only, no cookies)

| Key              | Value                                                  |
| ---------------- | ------------------------------------------------------ |
| `uc:profile`     | `{ name, avatar: {style, seed, options} }`             |
| `uc:room:{CODE}` | `{ playerId, token, savedAt }` (reconnect credentials) |

- [ ] Wrap every read/write in try/catch. Private mode can throw. The app must work with empty storage
- [x] Server stores only a **hash** of the reconnect token
- [x] A second tab with the same credentials **replaces** the first (first gets `replaced`)
- [ ] 💡 After the 15 s lobby removal, keep the token valid for ~10 min so returning players rejoin **without** re-approval (❓ D4)

### 8.2 Avatar (DiceBear)

- [ ] Pick 4–6 styles (start with CC0-licensed ones so no attribution is required. Check each style's license before adding it)
- [ ] Pen icon → modal: style tabs, 🎲 randomize seed, a few color options
- [ ] Only `{style, seed, options}` travels over the wire. Server validates against an allowlist (style ∈ list, seed ≤ 32 chars `[A-Za-z0-9-_]`, options ∈ allowlist)
- [ ] Render locally (bundled library, not the public API) as a `data:image/svg+xml` in an `<img>` so scripts can never execute
- [ ] Eliminated look: CSS `grayscale(1)` + skull overlay

### 8.3 Names

- [ ] 1–16 characters after trim; collapse repeated spaces
- [ ] Strip control, zero-width and bidi-override characters
- [ ] Light profanity filter
- [ ] Duplicate in room → auto-suffix (`Sam`, `Sam 2`)
- [ ] Rendered as text only (React escapes by default. Never use `dangerouslySetInnerHTML` for names)

---

## 9. Feature checklists (by screen)

### 9.1 Landing (`/`)

- [ ] Two big buttons: **Create room** / **Join room**
- [ ] Short "how it works" strip + link to How to play
- [ ] SEO content sections below the fold (see §13)

### 9.2 Create flow

- [ ] `POST /rooms` (with Turnstile token) → returns a **reserved** code (expires in 10 min if the host never connects)
- [ ] Screen: code at top + **Share** button (Web Share API → fallback copy link) + **QR**
- [ ] Avatar with ✏️ pen icon → edit modal
- [ ] Name input (16 max, live counter), prefilled from `uc:profile`
- [ ] **Go to the room** → open WebSocket → `hello` → become host

### 9.3 Join flow

- [ ] Same UI, but the top area is a **room code input** (6 chars, auto-uppercase, `0`/`O` never accepted)
- [ ] Opened via link `/r/ABC234` → code prefilled and locked
- [ ] Early check `GET /rooms/:code` → `{exists, locked, full, inGame}` for friendly errors (server re-checks on join)
- [ ] After **Go to the room** → status `pending` (or straight in if `requireApproval` is off / valid returning token)
- [ ] Pending screen: "Waiting for the host…" + Cancel
- [ ] Declined screen: "Host declined your request" + 30 s cooldown before another attempt

### 9.4 Lobby

- [ ] Everyone sees: room code, share/QR, all settings (read-only for non-hosts), roster with avatars
- [ ] Host: editable settings, Start, Lock room, Kick, Transfer host
- [ ] Host: **pending requests** panel with avatar, name, **Accept / Decline**
- [ ] Each player sees a ✏️ on **their own** card to edit name/avatar (lobby only)
- [ ] Presence dot per player (`away` shown subtly)
- [ ] Start button disabled with reason: "Need 4 players" / "Too many infiltrators" / "A player is away"
- [ ] Settings validation with live feedback (role counts vs player count)

### 9.5 Waiting room (joined mid-game)

- [ ] Shows "Game in progress. You'll join the next game."
- [ ] Sees the public roster only. **No** words, roles or votes
- [ ] On `GAME_OVER` → `play again` → they become `active`

### 9.6 In-game screen

- [ ] Top bar: **Show / Hide my info** button (see §7), round number, host controls (Pause / Skip / End voting / End game)
- [ ] Center: countdown (big, neo-brutalist) + phase label + "PAUSED" overlay
- [ ] Player grid: avatar + name; eliminated = greyscale + 💀; away = subtle badge
- [ ] Voting: tap an avatar to vote, selected state clear, tap another to change; "5/8 voted"
- [ ] Elimination screen: who was eliminated, their role (big reveal), vote counts; or "TIE — nobody eliminated"
- [ ] Mr. White guess screen (private input for Mr. White; waiting screen for others)
- [ ] 💡 Optional "Suggested speaking order" each round (random rotation of alive players), helpful in person

### 9.7 Game over

- [ ] Winner banner (Civilians / Infiltrators) + reason (all infiltrators out / infiltrators ≥ civilians / Mr. White guessed the word)
- [ ] Reveal everyone's role and word + both words of the pair
- [ ] Host: **Play again** → everyone back to the lobby, settings kept, `usedPairIds` kept
- [ ] Eliminated and waiting players become `active` again; disconnected ones stay `away` (removed after 15 s in lobby)

---

## 10. Connection, disconnect, host migration

Phones **suspend WebSockets** when the screen locks or the app is backgrounded, and iOS may kill a socket without firing a close event. Treat disconnects as normal.

### 10.1 Client

- [ ] PartySocket with auto-reconnect
- [ ] Force a reconnect on `visibilitychange` (visible), `pageshow` with `persisted === true` (iOS back/forward cache), and `online`
- [ ] Application heartbeat about every 25 s; treat ~3 missed replies as dead → reconnect
- [ ] On every (re)connect send `hello {playerId, token}`; the server replies with a full `state`
- [ ] Request a **Screen Wake Lock** during a game (feature-detect; re-acquire when the page becomes visible)
- [ ] Reconnecting banner + "connection lost" state (never a blank screen)

### 10.2 Server rules

| Situation                             | Behavior                                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Player socket closes in **LOBBY**     | Mark `away`. After **15 s** with no reconnect → remove from roster                                                                                            |
| Player socket closes **in game**      | Mark `away`. Stays in the game. Can reconnect any time. If still `away` when the round ends (voting closes) → eliminated (`DISCONNECTED`)                     |
| Player taps **Leave** in game         | Eliminated immediately (`LEFT`) → win check                                                                                                                   |
| Host **kicks** in game                | Eliminated (`KICKED`) → win check. Token banned from the room                                                                                                 |
| Disconnected **Mr. White** eliminated | No final guess                                                                                                                                                |
| **Host** disconnects/leaves           | After 15 s (lobby or game) → new host = earliest-joined **connected** admitted player (alive preferred). Old host returns as a normal player (no auto-regain) |
| Host paused the timer                 | Nobody is eliminated for disconnect until the host resumes and the round ends                                                                                 |
| All players disconnected              | Room idles; cleanup after 30 min                                                                                                                              |

- [ ] Show `away` vs `left` differently in the UI
- [ ] Toast for everyone: "X disconnected", "X reconnected", "Y is the new host"
- [ ] Host can **pause** to wait for someone to return

---

## 11. Security, abuse, privacy

### 11.1 Anti-cheat

- [x] Server-authoritative. Clients send _intents_, never results
- [x] Per-player sanitized snapshot. Never broadcast roles/words
- [x] Words bank lives only in server code; not in web bundle, not in public JSON
- [x] Vote privacy until tally
- [x] Reveal roles only on elimination and game over

### 11.2 Abuse

- [x] Origin check on WebSocket upgrade (allow your web domain + localhost in dev)
- [x] CORS on REST endpoints for the web domain only
- [x] Turnstile on `POST /rooms`
- [x] Rate limits: room creation per IP, join requests per IP/token, messages per connection
- [x] Room codes: random from the allowed alphabet, collision check, blocklist of offensive strings
- [x] Host approval is the real gate (guessing a code alone doesn't get you in)
- [x] Kick + ban token; lock room
- [x] Max players cap; max pending requests (e.g., 10) so a host isn't spammed
- [x] Idle-room cleanup deletes all storage for the room

### 11.3 Web security

- [ ] Security headers on Vercel: CSP (`connect-src` includes `wss://ws.yourdomain.com`), `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`
- [ ] No third-party scripts without a reason
- [ ] Never log names/words in analytics

### 11.4 Privacy / legal

- [ ] Privacy page: no accounts; name + avatar kept in your browser; room data deleted after the room expires
- [ ] If analytics use cookies, or you add ads later → consent banner as required for your audience
- [ ] Terms page (basic), contact email

---

## 12. UI / UX (Neo-brutalist, mobile-first)

### 12.1 Design tokens 💡

- [ ] Borders: 2–3 px solid near-black
- [ ] Shadows: hard offset, **no blur** (`4px 4px 0 #000`); on press, translate 2–4 px and collapse the shadow
- [ ] Radius: 0–6 px (pick one and stick to it)
- [ ] Type: heavy display face for headings + readable UI face; mono for room codes and timers
- [ ] Palette: warm off-white background + 4–5 saturated accents (one per role/state) with guaranteed contrast
- [ ] Use a neobrutalism shadcn registry (Base UI + Tailwind v4) and tune tokens once in a single theme file

### 12.2 Components to build/skin

- [ ] Button, Input, Dialog/Drawer, Switch, Slider/Stepper, Select, Tabs, Toast, Tooltip, Badge, Card
- [ ] `AvatarTile` (states: normal, selected, voted-for, eliminated, away, host crown)
- [ ] `Countdown` (tabular numbers, pulses under 10 s)
- [ ] `RoleCard` (hidden / shown, variants from §7)
- [ ] `RoomCodeBadge` + Share + QR sheet
- [ ] `PlayerGrid` (responsive, up to 20 tiles)

### 12.2b Motion

- [ ] Avatar grid layout transitions, elimination slam + greyscale, card flip, phase transitions
- [ ] All animation short (≤ 250 ms) and disabled for `prefers-reduced-motion`
- [ ] **No sound. No vibration.** 🔒

### 12.3 Mobile

- [ ] Design at 360 px width first
- [ ] Tap targets ≥ 44 px
- [ ] Inputs use ≥ 16 px font (prevents iOS zoom)
- [ ] `100dvh` layouts + safe-area insets
- [ ] Bottom-anchored primary actions (thumb reach)
- [ ] Test on iOS Safari, Android Chrome, desktop Chrome/Firefox

### 12.4 Accessibility

- [ ] Visible focus rings (thick outline fits the style)
- [ ] `aria-live` announcements for phase changes and eliminations
- [ ] Icons have labels. State is never conveyed by color alone (dead = greyscale **and** skull)
- [ ] Contrast ≥ 4.5:1 for text

---

## 13. SEO

- [ ] Astro **static** pages: `/` · `/how-to-play` · `/roles/civilian` · `/roles/undercover` · `/roles/mr-white` · `/tips` · `/words` (sample pairs only)
- [ ] `/play` is the app shell (Astro page with the React island loaded client-side); `noindex, follow`
- [ ] `/r/:code` served by a Vercel **rewrite** to `/play` (URL stays the same; the app reads the code from the path); `noindex`
- [ ] Open Graph + Twitter tags on the shell (invite links must preview nicely in WhatsApp/Discord; `noindex` doesn't stop previews)
- [ ] One OG image (neo-brutalist card)
- [ ] `sitemap.xml`, `robots.txt`, canonical URLs, unique titles/descriptions
- [ ] JSON-LD `WebApplication` (or `VideoGame`) on the landing page
- [ ] Core Web Vitals: ship no JS on content pages; hydrate only the app island
- [ ] Register in Google Search Console + Bing Webmaster
- [ ] Target long-tail queries: "undercover game online", "mr white game online", "undercover word pairs", "play undercover with friends"
- [ ] i18n later (fr, es, pt, de, id, hi) with `hreflang`
- [ ] ❓ Domain: dedicated brand domain, or a subdomain of an established site. Subdomains build authority separately from the parent site

---

## 14. Parked for v2

- Scoreboard across games in the same room (e.g., points per win: Civilian 2 / Mr. White 6 / Undercover 10, shown in the lobby)
- Host "Accept anyway" override for Mr. White guesses (if not in v1)
- Extra roles, custom pairs, translations, share-result image
- Optional in-app clue entry for remote play without a call

---

## 15. Deployment guide

### 15.1 One-time setup

- [ ] Domain's DNS is managed in Cloudflare
- [ ] `bunx wrangler login`
- [ ] Create GitHub repo, push monorepo
- [ ] Create a Cloudflare **API token** (Workers edit) and note the **Account ID**
- [ ] Create a Turnstile widget (site key + secret)

### 15.2 Server (Cloudflare Worker + Durable Object)

`apps/server/wrangler.jsonc`:

```jsonc
{
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "undercover-server",
    "main": "src/index.ts",
    "compatibility_date": "2026-09-19",
    "compatibility_flags": ["nodejs_compat"],
    "routes": [{ "pattern": "ws.yourdomain.com", "custom_domain": true }],
    "durable_objects": {
        "bindings": [{ "name": "Room", "class_name": "Room" }],
    },
    "migrations": [{ "tag": "v1", "new_sqlite_classes": ["Room"] }],
    "vars": {
        "ALLOWED_ORIGINS": "https://play.yourdomain.com,http://localhost:4321",
    },
    "observability": { "enabled": true },
}
```

- [ ] `bunx wrangler deploy` from `apps/server` (first deploy creates the DO class, the `ws.` DNS record and the certificate)
- [ ] `bunx wrangler secret put TURNSTILE_SECRET`
- [ ] PartyServer does **not** auto-generate bindings/migrations. Keep them in `wrangler.jsonc` by hand
- [ ] ⚠️ **Migrations:** never edit an applied migration tag. To rename/remove a DO class add a **new** tag. A delete migration **erases all stored data** for that class
- [ ] Enable WebSocket **hibernation** for the Room class (PartyServer option; verify the current option name in its README) and load state from SQLite in `onStart`
- [ ] Use WebSocket auto-response for ping/pong if supported so heartbeats don't wake the object
- [ ] Verify PartySocket's URL matches your routing (`/parties/room/<CODE>` by default with a binding named `Room`)

GitHub Actions (`.github/workflows/deploy-server.yml`):

```yaml
name: deploy-server
on:
    push:
        branches: [main]
        paths: ["apps/server/**", "packages/**"]
jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: oven-sh/setup-bun@v2
            - run: bun install --frozen-lockfile
            - run: bun test packages/engine
            - uses: cloudflare/wrangler-action@v3
              with:
                  apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
                  accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
                  workingDirectory: apps/server
                  command: deploy
```

### 15.3 Web (Vercel)

- [ ] Import the repo · **Root Directory:** `apps/web` · Framework: Astro
- [ ] Vercel auto-runs `bun install` when it finds `bun.lock`. If workspace packages don't resolve, enable "include source files outside the Root Directory" and set the install command to run from the repo root
- [ ] Env vars: `PUBLIC_WS_HOST=ws.yourdomain.com`, `PUBLIC_TURNSTILE_SITEKEY=...`
- [ ] `vercel.json`: rewrite `/r/:code` → `/play`, plus security headers
- [ ] Add domain (e.g., `play.yourdomain.com`) in Vercel → it shows the exact **CNAME** for your project → add it in Cloudflare DNS with the proxy **off (grey cloud / "DNS only")**
- [ ] `ws.yourdomain.com` is created by the Worker custom-domain config (leave it as Cloudflare manages it)

### 15.4 Local development

- [ ] `bun run dev` → `wrangler dev` (server on :8787) + `astro dev` (web on :4321)
- [ ] `PUBLIC_WS_HOST=localhost:8787` in `apps/web/.env`
- [ ] `ALLOWED_ORIGINS` includes `http://localhost:4321`

### 15.5 Costs and plan limits ⚠️

- [ ] **Cloudflare free plan**: Durable Objects allow 100,000 requests/day, and once a limit is hit further operations **fail**. Switch to the $5/mo Workers Paid plan **before** promoting the game. Incoming WebSocket messages count at a 20:1 ratio
- [ ] **Vercel Hobby is non-commercial only.** Ads (e.g., AdSense) count as commercial use; donations do not per Vercel's guidelines. If you plan to run ads, use Vercel Pro or host the Astro site on Cloudflare too
- [ ] Set Cloudflare usage alerts

---

## 16. Testing

### 16.1 Engine unit tests (`bun test`)

- [x] Role distribution validation for n = 4…20
- [x] Win-check table (every combination of C and I)
- [x] Vote tally: clear winner, 2-way tie, 3-way tie, nobody voted, votes for eliminated players void
- [x] Round-end ordering: disconnect elimination + vote elimination in one round
- [x] Mr. White: correct guess, wrong guess, timeout, disconnected (no guess), two Mr. Whites
- [x] Guess normalization: case, accents, articles, plurals, aliases, edit distance
- [x] Host migration choice; pause/resume math; pair rotation without repeats
- [x] View sanitization: assert **no** foreign role/word ever appears in `viewFor` output (property test)

### 16.2 Server tests (Vitest in the Workers runtime)

- [x] Join → pending → approve/decline → waiting → next game
- [x] Reconnect with token; wrong token rejected; second tab replaces first
- [x] Alarm-driven phase changes survive hibernation / restart
- [x] Origin check, message validation, rate limit, oversized message

### 16.3 E2E (Playwright, multiple browser contexts)

- [ ] Full game with 4 players, both win paths
- [ ] Tie round → next round
- [ ] Mr. White voted out and guesses right / wrong
- [ ] Simulated offline/online during discussion and at vote close
- [ ] Late joiner waiting room
- [ ] Host leaves → new host
- [ ] Mobile viewport screenshots of every screen

### 16.4 Manual

- [ ] Real phones: lock screen 20 s during a game, background the tab, switch apps
- [ ] Two people on one Wi-Fi, one on cellular
- [ ] Slow 3G throttling

---

## 17. Edge-case matrix (must all have a defined behavior)

| Scenario                                             | Expected                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| Start with < 4 players                               | Button disabled with reason                                                     |
| Start while a player is `away`                       | Blocked until they return or are removed (15 s)                                 |
| Room full / locked                                   | Friendly rejection message                                                      |
| Same name as another player                          | Auto-suffix                                                                     |
| Refresh mid-game                                     | Reconnect with token, same seat, same card                                      |
| Join link for a room that doesn't exist / expired    | "Room not found" + Create button                                                |
| Pending player when game starts                      | Stays pending; becomes `waiting` when accepted                                  |
| Host accepts request during `GAME_OVER`              | Player joins lobby normally when the room returns                               |
| Player leaves voluntarily mid-game                   | Eliminated instantly, role revealed, win check                                  |
| Top-voted player disconnected at vote close          | Eliminated as `DISCONNECTED` first; their votes voided; remaining votes tallied |
| Only `away` players remain undecided at vote timeout | They are eliminated                                                             |
| All votes cast before timer                          | Voting closes early (only if **no** player is `away`)                           |
| Host pauses during voting                            | No votes accepted until resume                                                  |
| Host leaves during Mr. White's guess                 | Host reassigned; guess timer continues                                          |
| Mr. White guess arrives after timer                  | Rejected                                                                        |
| Everyone eliminated / disconnected                   | Abort game → lobby (no winner)                                                  |
| Two tabs same player                                 | Older connection gets `replaced`                                                |
| Kicked player tries to rejoin                        | Rejected (banned token)                                                         |

---

## 18. Build order

1. [x] **Engine** + tests (roles, votes, win check, Mr. White, timers as pure data)
2. [ ] **Protocol** package (Zod schemas, constants)
3. [ ] **Server shell**: Worker routes, Room DO, hello/reconnect, persistence, alarms
4. [ ] **Web shell**: Astro + React island, Zustand store, PartySocket, profile/avatar, create/join screens
5. [ ] **Lobby**: settings, approvals, kick/lock/transfer, QR + link
6. [ ] **Game loop UI**: card, timers, voting, elimination, Mr. White guess, game over
7. [ ] **Resilience**: reconnect, disconnect rules, host migration, wake lock, pause
8. [ ] **Hardening**: rate limits, Turnstile, origin checks, message limits, headers
9. [ ] **Content + SEO pages**, OG image, sitemap, analytics
10. [ ] **Word bank** (start with ~150 pairs across a few categories and 3 difficulties)
11. [ ] **Testing pass** on real phones
12. [ ] **Launch**: upgrade Cloudflare plan, set alerts, submit to Search Console, soft-launch with friends

---

## 19. Open decisions ❓

| #   | Question                                                                              | My suggestion                                                                 |
| --- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| D1  | Room-code alphabet: also drop `1` and `I`?                                            | Yes, alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (32 chars ≈ 1 billion codes) |
| D2  | Timer defaults (discussion 3:00, voting 1:00, guess 0:30, reveal 10 s)?               | Keep, tune after playtests                                                    |
| D3  | Max players                                                                           | Default 12, hard cap 20                                                       |
| D4  | Keep the reconnect token valid ~10 min after lobby removal (rejoin without approval)? | Yes                                                                           |
| D5  | After a vote: show only counts, or who voted for whom?                                | Counts only                                                                   |
| D6  | Mr. White guess: auto-verify only, or add host "Accept anyway"?                       | Auto-verify in v1, override in v1.1                                           |
| D7  | Keep the 10 s `ROLE_REVEAL` phase?                                                    | Yes                                                                           |
| D8  | Vercel Hobby vs Pro (depends on ads/monetization)                                     | Pro before any ads                                                            |
| D9  | Brand name and domain/subdomain                                                       | Decide before building SEO pages; check for existing trademarks               |
| D10 | Which word categories to ship first?                                                  | Food, Animals, Objects, Places, Entertainment                                 |

---

## 20. Definition of done (v1)

- [ ] 4–12 people can finish a full game on phones without anyone seeing another player's role or word in network traffic
- [ ] A locked phone for 30 s during the game does **not** break that player's session
- [ ] Every row of §17 behaves as specified
- [ ] Lighthouse mobile ≥ 90 on landing and how-to-play pages
- [ ] Cloudflare paid plan active, alerts configured
- [ ] Privacy page live; Search Console sitemap submitted
