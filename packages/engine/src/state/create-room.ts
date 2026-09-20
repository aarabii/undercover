import type { Room, Settings, Player } from "@game/types";
import type { CreateRoomPayload } from "../types";
import {
  DEFAULT_MAX_PLAYERS,
  DEFAULT_DISCUSSION_SECONDS,
  DEFAULT_VOTING_SECONDS,
  DEFAULT_MRWHITE_GUESS_SECONDS,
} from "../constants";
import { sanitizeRawName } from "./sanitize";

export function createDefaultSettings(overrides?: Partial<Settings>): Settings {
  return {
    undercoverCount: overrides?.undercoverCount ?? 1,
    mrWhiteCount: overrides?.mrWhiteCount ?? 0,
    category: overrides?.category ?? "random",
    difficulty: overrides?.difficulty ?? "medium",
    showRoles: overrides?.showRoles ?? false,
    discussionSeconds: overrides?.discussionSeconds ?? DEFAULT_DISCUSSION_SECONDS,
    votingSeconds: overrides?.votingSeconds ?? DEFAULT_VOTING_SECONDS,
    mrWhiteGuessSeconds: overrides?.mrWhiteGuessSeconds ?? DEFAULT_MRWHITE_GUESS_SECONDS,
    requireApproval: overrides?.requireApproval ?? true,
    maxPlayers: overrides?.maxPlayers ?? DEFAULT_MAX_PLAYERS,
  };
}

export function createRoom(payload: CreateRoomPayload): Room {
  const createdAt = payload.createdAt ?? 0;
  const hostName = sanitizeRawName(payload.hostProfile.name);
  const hostPlayer: Player = {
    id: payload.hostId,
    tokenHash: payload.hostTokenHash,
    name: hostName,
    avatar: payload.hostProfile.avatar,
    status: "active",
    presence: "online",
    joinedAt: createdAt,
    lastSeenAt: createdAt,
  };

  return {
    code: payload.code.toUpperCase(),
    createdAt,
    hostId: payload.hostId,
    locked: false,
    bannedTokenHashes: [],
    settings: createDefaultSettings(payload.settings),
    players: [hostPlayer],
    phase: "LOBBY",
    round: 0,
    endsAt: null,
    paused: null,
    usedPairIds: [],
  };
}
