import type { AvatarConfig } from "../models/avatar";
import type { Settings } from "../models/settings";

export interface HelloPayload {
  code: string;
  playerId?: string;
  token?: string;
  profile: {
    name: string;
    avatar: AvatarConfig;
  };
}

export interface ProfileUpdatePayload {
  name?: string;
  avatar?: AvatarConfig;
}

export interface VoteCastPayload {
  targetId: string;
}

export interface MrWhiteGuessPayload {
  text: string;
}

export type ClientMessage =
  | { type: "hello"; payload: HelloPayload }
  | { type: "profile.update"; payload: ProfileUpdatePayload }
  | { type: "vote.cast"; payload: VoteCastPayload }
  | { type: "mrwhite.guess"; payload: MrWhiteGuessPayload }
  | { type: "leave" }
  | { type: "host.settings.update"; payload: Partial<Settings> }
  | { type: "host.approve"; payload: { playerId: string } }
  | { type: "host.decline"; payload: { playerId: string } }
  | { type: "host.kick"; payload: { playerId: string } }
  | { type: "host.lock"; payload: { locked: boolean } }
  | { type: "host.transfer"; payload: { playerId: string } }
  | { type: "host.start" }
  | { type: "host.pause" }
  | { type: "host.resume" }
  | { type: "host.skip" }
  | { type: "host.endVoting" }
  | { type: "host.endGame" }
  | { type: "host.playAgain" };
