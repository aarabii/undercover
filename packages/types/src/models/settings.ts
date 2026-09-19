import type { Difficulty } from "../enums/game";

export interface Settings {
  undercoverCount: number;
  mrWhiteCount: number;
  category: string;
  difficulty: Difficulty;
  showRoles: boolean;
  discussionSeconds: number;
  votingSeconds: number;
  mrWhiteGuessSeconds: number;
  requireApproval: boolean;
  maxPlayers: number;
}
