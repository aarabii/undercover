# Security, Anti-Cheat & Privacy

- **Server-authoritative state** — clients send intents only; the server determines validity and projects a sanitized, per-player `RoomView` (`viewFor`). Opponents' words, unrevealed roles, and pending votes are never sent to the client.
- **Vote privacy** — only participation counts (e.g. `5/8 voted`) are broadcast during voting; identities stay hidden until tally.
- **Hidden roles by default** — Civilians and Undercovers get identical `WORD_ONLY` card views with no role metadata.
- **Tab-blur protection** — secret word cards auto-hide on `visibilitychange`/`blur`.
- **Bot & abuse mitigation** — Cloudflare Turnstile on room creation, rate limiting (10 requests/min/IP), 2 KB WebSocket message cap with strict Zod validation, ambiguity-free room codes (no `0`, `O`, `1`, `I`), and SHA-256-hashed reconnect tokens.
- **Package boundary enforcement** — `packages/words` is strictly server-only. Word lists and pairings are never imported into `apps/web`; clients only ever receive their single assigned word. `bun run check:boundaries` scans client code to guarantee no accidental `@game/words` imports.

## Related Documentation

- [Architecture & State Machine](./architecture.md)
- [Real-Time Protocol & Messages](./protocol.md)
- [Security Policy](../SECURITY.md)
