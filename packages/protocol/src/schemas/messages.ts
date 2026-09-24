import { z } from "zod";
import { MAX_NAME_LENGTH } from "@game/types";
import { AvatarConfigSchema, SettingsSchema, SettingsPatchSchema } from "./models";
import { RoomViewSchema } from "./views";

// --- Client -> Server Message Schemas ---

export const HelloPayloadSchema = z.object({
  code: z.string().toUpperCase(),
  playerId: z.string().optional(),
  token: z.string().optional(),
  profile: z.object({
    name: z.string().min(1).max(MAX_NAME_LENGTH),
    avatar: AvatarConfigSchema,
  }),
});

export const ProfileUpdatePayloadSchema = z.object({
  name: z.string().min(1).max(MAX_NAME_LENGTH).optional(),
  avatar: AvatarConfigSchema.optional(),
});

export const VoteCastPayloadSchema = z.object({
  targetId: z.string(),
});

export const MrWhiteGuessPayloadSchema = z.object({
  text: z.string().min(1).max(50),
});

export const ClientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hello"), payload: HelloPayloadSchema }),
  z.object({ type: z.literal("profile.update"), payload: ProfileUpdatePayloadSchema }),
  z.object({ type: z.literal("vote.cast"), payload: VoteCastPayloadSchema }),
  z.object({ type: z.literal("mrwhite.guess"), payload: MrWhiteGuessPayloadSchema }),
  z.object({ type: z.literal("leave") }),
  z.object({ type: z.literal("host.settings.update"), payload: SettingsPatchSchema }),
  z.object({ type: z.literal("host.approve"), payload: z.object({ playerId: z.string() }) }),
  z.object({ type: z.literal("host.decline"), payload: z.object({ playerId: z.string() }) }),
  z.object({ type: z.literal("host.kick"), payload: z.object({ playerId: z.string() }) }),
  z.object({ type: z.literal("host.lock"), payload: z.object({ locked: z.boolean() }) }),
  z.object({ type: z.literal("host.transfer"), payload: z.object({ playerId: z.string() }) }),
  z.object({ type: z.literal("host.start") }),
  z.object({ type: z.literal("host.pause") }),
  z.object({ type: z.literal("host.resume") }),
  z.object({ type: z.literal("host.skip") }),
  z.object({ type: z.literal("host.endVoting") }),
  z.object({ type: z.literal("host.endGame") }),
  z.object({ type: z.literal("host.playAgain") }),
]);

// --- Server -> Client Message Schemas ---

export const StatePayloadSchema = z.object({
  view: RoomViewSchema,
  token: z.string().optional(),
});

export const ErrorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const DeclinedPayloadSchema = z.object({
  reason: z.string().optional(),
});

export const ServerMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("state"), payload: StatePayloadSchema }),
  z.object({ type: z.literal("error"), payload: ErrorPayloadSchema }),
  z.object({ type: z.literal("declined"), payload: DeclinedPayloadSchema.optional() }),
  z.object({ type: z.literal("kicked") }),
  z.object({ type: z.literal("replaced") }),
  z.object({ type: z.literal("roomClosed") }),
]);
