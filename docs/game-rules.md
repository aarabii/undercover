# Game Rules

**Undercover** is a party game of deduction, deception, and bluffing for 4–20 players.

## Roles & Objectives

| Role                           | Given Content                            | Objective                                                                                       |
| :----------------------------- | :--------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Civilian** _(majority)_      | The civilian secret word (e.g. _Coffee_) | Give subtle clues to expose infiltrators without tipping off Mr. White to the exact word.       |
| **Undercover** _(infiltrator)_ | A closely related word (e.g. _Tea_)      | Blend in, deduce the civilian word, and survive until infiltrators reach parity with civilians. |
| **Mr. White** _(infiltrator)_  | No word at all (blank card)              | Bluff through the rounds and guess the civilian word if voted out.                              |

> [!NOTE]
> Civilians and Undercovers both just see a word on their screen — neither knows their own role for certain. That doubt is the core tension of the game.

## In-Person Referee Concept

Undercover is designed for in-person groups and voice calls, not in-app chat:

- **Players speak out loud** — there's no clue-entry text box or chat feed.
- **The app is the impartial referee** — it manages rooms, distributes words, runs timers, tallies anonymous votes, and enforces win conditions.
- **Zero sound or vibration** — no tells that could give away a player's role to neighbors in a shared room.
- **Privacy card auto-hide** — the secret word card closes automatically when a player switches tabs or locks their phone.

## Win Conditions

Evaluated after every elimination (vote, disconnection, voluntary leave, or kick):

|         Alive Civilians          | Alive Infiltrators | Outcome                                                     |
| :------------------------------: | :----------------: | :---------------------------------------------------------- |
|               Any                |         0          | Civilians win — all infiltrators eliminated.                |
|               Any                |    ≥ Civilians     | Infiltrators win — parity reached.                          |
| More civilians than infiltrators |        ≥ 1         | Game continues to the next discussion round.                |
|                —                 |         —          | Mr. White guesses correctly → infiltrators win immediately. |

Vote ties (or nobody voting) mean nobody is eliminated. Eliminated players' identities are always revealed.

## Timer Configuration

All timers use absolute server timestamps (`endsAt`); clients render the countdown against `serverNow`.

| Phase / Event          | Default Duration | Host Configurable  |
| :--------------------- | :--------------: | :----------------: |
| Role Reveal            |       10 s       |         No         |
| Discussion             |     3:00 min     | Yes (0:30 – 10:00) |
| Voting                 |     1:00 min     | Yes (0:20 – 3:00)  |
| Elimination Screen     |       6 s        |         No         |
| Mr. White Guess        |       30 s       | Yes (0:15 – 1:00)  |
| Lobby Disconnect Grace |       15 s       |         No         |
| Host Migration Delay   |       15 s       |         No         |
| Idle Room Cleanup      |      30 min      |         No         |

## Mr. White Final Guess Normalization

When Mr. White is eliminated, the server checks their guess against the civilian word through a forgiving pipeline: lowercase/trim/strip-diacritics → strip punctuation and leading articles → normalize simple plurals → check curated aliases (`accept[]`) → allow Levenshtein distance ≤ 1 for words of 5+ characters.

## Related Documentation

- [Architecture & State Machine](./architecture.md)
- [Real-Time Protocol & Messages](./protocol.md)
- [Word Bank & Randomness Engine](./word-bank.md)
