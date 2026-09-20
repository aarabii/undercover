import type { Settings } from "./settings";
import type { Player } from "./player";
import type { Phase } from "../enums/phase";
import type { ElimReason } from "../enums/status";
import type { EliminationResult, GameOverSummary } from "../views/room-view";

export interface GameData {
  civilianWord: string;
  undercoverWord: string;
  pairId: string;
  votes: Record<string, string>; // voterId -> targetPlayerId
  lastResult?: {
    eliminatedId?: string;
    reason: ElimReason;
    isTie: boolean;
  };
  lastElimination?: EliminationResult;
  civilianAliases?: string[];
  gameOver?: GameOverSummary;
}

export interface Room {
  code: string;
  createdAt: number;
  hostId: string;
  locked: boolean;
  bannedTokenHashes: string[];
  settings: Settings;
  players: Player[];
  phase: Phase;
  round: number;
  endsAt: number | null;
  paused: { remainingMs: number } | null;
  game?: GameData;
  usedPairIds: string[];
}
