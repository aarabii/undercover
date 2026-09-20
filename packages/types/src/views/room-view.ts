import type { Phase } from "../enums/phase";
import type { Winner, WinReason } from "../enums/game";
import type { Role } from "../enums/role";
import type { PlayerStatus } from "../enums/status";
import type { Settings } from "../models/settings";
import type { PlayerPublicView, CardView } from "./player-view";

export interface GameOverSummary {
  winner: Winner;
  reason: WinReason;
  civilianWord: string;
  undercoverWord: string;
  playerRoles: Record<
    string,
    {
      role: Role;
      word: string | null;
    }
  >;
}

export interface RoomView {
  code: string;
  phase: Phase;
  round: number;
  endsAt: number | null;
  paused: { remainingMs: number } | null;
  locked: boolean;
  serverNow: number;
  settings: Settings;
  players: PlayerPublicView[];
  me: {
    id: string;
    status: PlayerStatus;
    card?: CardView;
    myVote?: string | null;
  };
  votedCount?: number;
  totalVoters?: number;
  pendingRequests?: PlayerPublicView[];
  gameOver?: GameOverSummary;
}
