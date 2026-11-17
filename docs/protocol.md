# Real-Time Protocol & Messages

Messages are typed in `@game/types` and validated with Zod 4 schemas in `@game/protocol`.

## Client Messages

| Message Type                    | Allowed Phase                           | Description                                               |
| :------------------------------ | :-------------------------------------- | :-------------------------------------------------------- |
| `hello`                         | Any                                     | Handshake for joining or reconnecting with a saved token. |
| `profile.update`                | `LOBBY`, waiting, pending               | Updates nickname or avatar.                               |
| `vote.cast`                     | `VOTING`                                | Casts or updates a vote.                                  |
| `mrwhite.guess`                 | `MRWHITE_GUESS`                         | Submits Mr. White's word guess.                           |
| `leave`                         | Any                                     | Leaves the room (instant elimination if in-game).         |
| `host.settings.update`          | `LOBBY`                                 | Updates room settings.                                    |
| `host.approve` / `host.decline` | Any                                     | Approves or declines a join request.                      |
| `host.kick`                     | Any                                     | Kicks a player and bans their token.                      |
| `host.lock`                     | Any                                     | Locks the room against new joins.                         |
| `host.transfer`                 | Any                                     | Transfers host privileges.                                |
| `host.start`                    | `LOBBY`                                 | Validates config and starts the game.                     |
| `host.pause` / `host.resume`    | `DISCUSSION`, `VOTING`, `MRWHITE_GUESS` | Freezes/unfreezes the timer.                              |
| `host.skip`                     | `ROLE_REVEAL`, `DISCUSSION`             | Advances to the next phase early.                         |
| `host.endVoting`                | `VOTING`                                | Closes voting immediately.                                |
| `host.endGame`                  | In-game                                 | Aborts the game, returns to lobby.                        |
| `host.playAgain`                | `GAME_OVER`                             | Resets to lobby for a rematch.                            |

## Server Messages

| Message Type | Description                               |
| :----------- | :---------------------------------------- |
| `state`      | Individualized `RoomView` snapshot.       |
| `error`      | Structured error code + message.          |
| `declined`   | Join request rejected.                    |
| `kicked`     | Player kicked and banned.                 |
| `replaced`   | Same reconnect token opened in a new tab. |
| `roomClosed` | Room expired or was terminated.           |

## Session Lifecycle & Reconnection

PartySocket auto-reconnects with exponential backoff and probes immediately on tab foreground. Lobby disconnects are held for 15 s; in-game disconnects are marked `away` and keep their seat until the round's vote concludes. If the host disconnects, host authority transfers to the earliest-joined connected player after 15 s.

## Related Documentation

- [Architecture & State Machine](./architecture.md)
- [Security, Anti-Cheat & Privacy](./security.md)
