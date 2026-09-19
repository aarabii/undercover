import { z } from "zod";
import { MIN_PLAYERS, MAX_PLAYERS, DEFAULT_MAX_PLAYERS } from "@game/types";
import { DifficultySchema } from "./enums";

export const AvatarConfigSchema = z.object({
  style: z.string(),
  seed: z.string(),
  options: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const SettingsSchema = z.object({
  undercoverCount: z.number().int().min(1).default(1),
  mrWhiteCount: z.number().int().min(0).default(0),
  category: z.string().default("random"),
  difficulty: DifficultySchema.default("medium"),
  showRoles: z.boolean().default(false),
  discussionSeconds: z.number().int().min(10).max(600).default(180),
  votingSeconds: z.number().int().min(10).max(300).default(60),
  mrWhiteGuessSeconds: z.number().int().min(10).max(120).default(30),
  requireApproval: z.boolean().default(true),
  maxPlayers: z.number().int().min(MIN_PLAYERS).max(MAX_PLAYERS).default(DEFAULT_MAX_PLAYERS),
});

export const WordPairSchema = z.object({
  id: z.string(),
  category: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  a: z.string(),
  b: z.string(),
  accept: z.array(z.string()).optional(),
});
