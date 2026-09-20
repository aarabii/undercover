import type {
  Room,
  Settings,
  Difficulty,
  WordPair,
  EngineEffect,
  ServerMessage,
  HelloPayload,
  ProfileUpdatePayload,
  VoteCastPayload,
  MrWhiteGuessPayload,
} from "@game/types";

export interface WordBank {
  getWordPair(
    category: string,
    difficulty: Difficulty,
    usedPairIds: string[],
    rng: () => number
  ): WordPair | null;
}

export interface EngineContext {
  now: number;
  rng: () => number;
  newId: () => string;
  words: WordBank;
}

export type Action =
  // Lifecycle / Server Events
  | { type: "createRoom"; payload: CreateRoomPayload }
  | { type: "connect"; playerId: string }
  | { type: "disconnect"; playerId: string }
  | { type: "tick"; now?: number }
  // Client Messages (tagged with authenticated sender playerId, plus tokenHash for hello)
  | { type: "hello"; playerId?: string; tokenHash: string; payload: HelloPayload }
  | { type: "profile.update"; playerId: string; payload: ProfileUpdatePayload }
  | { type: "vote.cast"; playerId: string; payload: VoteCastPayload }
  | { type: "mrwhite.guess"; playerId: string; payload: MrWhiteGuessPayload }
  | { type: "leave"; playerId: string }
  | { type: "host.settings.update"; playerId: string; payload: Partial<Settings> }
  | { type: "host.approve"; playerId: string; payload: { playerId: string } }
  | { type: "host.decline"; playerId: string; payload: { playerId: string } }
  | { type: "host.kick"; playerId: string; payload: { playerId: string } }
  | { type: "host.lock"; playerId: string; payload: { locked: boolean } }
  | { type: "host.transfer"; playerId: string; payload: { playerId: string } }
  | { type: "host.start"; playerId: string }
  | { type: "host.pause"; playerId: string }
  | { type: "host.resume"; playerId: string }
  | { type: "host.skip"; playerId: string }
  | { type: "host.endVoting"; playerId: string }
  | { type: "host.endGame"; playerId: string }
  | { type: "host.playAgain"; playerId: string };

export interface CreateRoomPayload {
  code: string;
  hostId: string;
  hostTokenHash: string;
  hostProfile: {
    name: string;
    avatar: {
      style: string;
      seed: string;
      options?: Record<string, string | number | boolean>;
    };
  };
  createdAt?: number;
  settings?: Partial<Settings>;
}

export interface ReduceResult {
  state: Room;
  error?: {
    code: string;
    message: string;
  };
  effects?: EngineEffect[];
  alarmAt?: number | null;
}

export { type EngineEffect };
