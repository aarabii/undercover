import type { Room } from "@game/types";
import type { Action, EngineContext, ReduceResult } from "../types";
import { checkWinCondition } from "./win";

export function normalizeText(text: string): string {
  let s = text.toLowerCase().trim();
  // Strip accents / diacritics
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Strip punctuation and special characters, keeping alphanumeric and spaces
  s = s.replace(/[^\p{L}\p{N}\s]/gu, " ");
  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();

  // Drop leading articles
  if (s.startsWith("the ")) {
    s = s.slice(4).trim();
  } else if (s.startsWith("a ")) {
    s = s.slice(2).trim();
  } else if (s.startsWith("an ")) {
    s = s.slice(3).trim();
  }

  return s;
}

export function stemSimplePlural(w: string): string {
  if (w.endsWith("es") && w.length > 3) {
    return w.slice(0, -2);
  }
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 2) {
    return w.slice(0, -1);
  }
  return w;
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function matchesTarget(guess: string, target: string): boolean {
  const normGuess = normalizeText(guess);
  const normTarget = normalizeText(target);

  if (normGuess.length === 0 || normTarget.length === 0) {
    return false;
  }

  // 1. Direct equality after normalization
  if (normGuess === normTarget) {
    return true;
  }

  // 2. Simple plurals comparison
  const stemGuess = stemSimplePlural(normGuess);
  const stemTarget = stemSimplePlural(normTarget);
  if (stemGuess === stemTarget) {
    return true;
  }

  // 3. Edit distance <= 1 when target word has >= 5 letters (Spec §3.7)
  if (normTarget.length >= 5) {
    if (levenshteinDistance(normGuess, normTarget) <= 1) {
      return true;
    }
    if (levenshteinDistance(stemGuess, stemTarget) <= 1) {
      return true;
    }
  }

  return false;
}

export function evaluateMrWhiteGuess(
  guessText: string,
  civilianWord: string,
  aliases: string[] = []
): boolean {
  if (matchesTarget(guessText, civilianWord)) {
    return true;
  }

  for (const alias of aliases) {
    if (matchesTarget(guessText, alias)) {
      return true;
    }
  }

  return false;
}

export function handleMrWhiteGuess(
  room: Room,
  action: Extract<Action, { type: "mrwhite.guess" }>,
  ctx: EngineContext
): ReduceResult {
  if (room.phase !== "MRWHITE_GUESS") {
    return {
      state: room,
      error: { code: "INVALID_PHASE", message: "Not in MRWHITE_GUESS phase" },
    };
  }

  if (room.endsAt !== null && ctx.now > room.endsAt) {
    return {
      state: room,
      error: { code: "TIMER_EXPIRED", message: "Guess timer has expired" },
    };
  }

  const votedMrWhite = room.game?.lastElimination?.eliminations.find(
    (e) => e.reason === "VOTED" && e.role === "MR_WHITE"
  );

  if (!votedMrWhite || action.playerId !== votedMrWhite.id) {
    return {
      state: room,
      error: {
        code: "FORBIDDEN",
        message: "Only the voted-out Mr. White can make the final guess",
      },
    };
  }

  const isCorrect = evaluateMrWhiteGuess(
    action.payload.text,
    room.game?.civilianWord ?? "",
    room.game?.civilianAliases ?? []
  );

  if (isCorrect) {
    // Infiltrators win immediately on correct guess (Spec §3.7)
    return {
      state: {
        ...room,
        phase: "GAME_OVER",
        endsAt: null,
        paused: null,
      },
    };
  }

  // Wrong guess: continue to win check (Spec §3.7)
  const win = checkWinCondition(room);
  if (win) {
    return {
      state: {
        ...room,
        phase: "GAME_OVER",
        endsAt: null,
        paused: null,
      },
    };
  }

  // Game continues to next round
  return {
    state: {
      ...room,
      round: room.round + 1,
      phase: "DISCUSSION",
      endsAt: ctx.now + room.settings.discussionSeconds * 1000,
      game: room.game ? { ...room.game, votes: {} } : undefined,
    },
  };
}
