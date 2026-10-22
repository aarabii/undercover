import type { AvatarConfig } from "../models/avatar";
import type { Settings } from "../models/settings";

export const ClientMessageType = {
  HELLO: "hello",
  PROFILE_UPDATE: "profile.update",
  VOTE_CAST: "vote.cast",
  MRWHITE_GUESS: "mrwhite.guess",
  LEAVE: "leave",
  HOST_SETTINGS_UPDATE: "host.settings.update",
  HOST_APPROVE: "host.approve",
  HOST_DECLINE: "host.decline",
  HOST_KICK: "host.kick",
  HOST_LOCK: "host.lock",
  HOST_TRANSFER: "host.transfer",
  HOST_START: "host.start",
  HOST_PAUSE: "host.pause",
  HOST_RESUME: "host.resume",
  HOST_SKIP: "host.skip",
  HOST_END_VOTING: "host.endVoting",
  HOST_END_GAME: "host.endGame",
  HOST_PLAY_AGAIN: "host.playAgain",
  HEARTBEAT: "heartbeat",
} as const;

export type ClientMessageType =
  (typeof ClientMessageType)[keyof typeof ClientMessageType];

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
  | { type: "host.playAgain" }
  | { type: "heartbeat" };
