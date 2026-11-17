# Security Policy

## Supported Versions

Only the latest code on the `master` branch and the current `0.1.x` release line receive security updates.

| Version | Supported |
| --- | --- |
| `0.1.x` (`master`) | Yes |
| `< 0.1.0` | No |

## Reporting a Vulnerability

Do not open a public GitHub issue or pull request for suspected security vulnerabilities or anti-cheat bypasses.

Please report vulnerabilities privately through [GitHub Private Vulnerability Reporting](https://github.com/aarabii/undercover/security/advisories/new) on this repository. If you cannot use GitHub Security Advisories, contact `[TODO: add security contact email]`.

When reporting an issue, please include:
- A description of the vulnerability and its potential impact (for example, role leakage, word leakage, session hijacking, or denial of service).
- Clear steps, payloads, or a minimal script to reproduce the issue.
- Which package or application (`apps/server`, `apps/web`, `packages/engine`, `packages/protocol`, `packages/words`) is affected.

### Response Timeline

- **Initial acknowledgment**: Within 72 hours of receiving the report.
- **Triage and assessment**: Within 7 days, including confirmation of severity and reproduction.
- **Remediation and disclosure**: Fixes for confirmed vulnerabilities are prioritized and released before public disclosure is coordinated with the reporter.

## Security and Anti-Cheat Model Overview

Undercover is a hidden-role social deduction game where information asymmetry is critical. The security architecture is documented in detail in [`docs/security.md`](./docs/security.md) and relies on the following core controls:

- **Server-authoritative state reducer**: All game state transitions occur inside the Cloudflare Durable Object (`Room`) via the pure `@game/engine` state machine. Clients only submit intent commands (`ClientMessage`) and cannot mutate state directly.
- **Per-player sanitized state projection (`viewFor`)**: The server never broadcasts raw `Room` state. Every outbound WebSocket state update is projected through `viewFor(state, playerId)` into a tailored `RoomView` that strips other players' roles, secret words, Mr. White guesses, and live vote targets (until reveal).
- **Server-only word pack boundary (`@game/words`)**: Word packs live exclusively in `packages/words` and are loaded only on the server. The static client bundle (`apps/web`) is forbidden from importing `@game/words`, enforced automatically by `bun run check:boundaries`.
- **SHA-256 hashed reconnect tokens**: On joining a room, each player receives a 256-bit cryptographically random reconnect token. The server stores only the SHA-256 hash (`tokenHash`) in Durable Object SQLite storage and never logs or broadcasts raw tokens.
- **WebSocket payload size and schema validation**: Incoming WebSocket frames exceeding 2 KB (2,048 bytes) are rejected before JSON parsing, and all parsed payloads are validated against strict Zod 4 discriminated union schemas in `@game/protocol`.
- **Room creation protection and IP rate limiting**: `POST /rooms` verifies a Cloudflare Turnstile token in production and enforces per-IP rate limits (up to 10 room creations per 60 seconds per IP).
