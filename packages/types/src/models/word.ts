import type { Difficulty } from "../enums/game";

export interface WordPair {
  id: string;
  category: string;
  difficulty: Difficulty;
  difficulties?: Difficulty[];
  a: string;
  b: string;
  accept?: string | string[];
}
