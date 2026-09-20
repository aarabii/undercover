import { z } from "zod";
import { MAX_NAME_LENGTH } from "@game/types";
import {
  PhaseSchema,
  RoleSchema,
  PlayerStatusSchema,
  PresenceSchema,
  ElimReasonSchema,
  WinnerSchema,
  WinReasonSchema,
  CardVariantSchema,
} from "./enums";
import { AvatarConfigSchema, SettingsSchema } from "./models";

export const PlayerPublicViewSchema = z.object({
  id: z.string(),
  name: z.string().max(MAX_NAME_LENGTH),
  avatar: AvatarConfigSchema,
  status: PlayerStatusSchema,
  presence: PresenceSchema,
  isHost: z.boolean(),
  eliminated: z
    .object({
      reason: ElimReasonSchema,
      round: z.number(),
      role: RoleSchema.optional(),
    })
    .optional(),
});

export const CardViewSchema = z
  .object({
    variant: CardVariantSchema,
    word: z.string().nullable(),
    role: RoleSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.variant === "WORD_ONLY" && val.role !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Role must not be present when variant is WORD_ONLY",
        path: ["role"],
      });
    }
    if (val.variant === "MR_WHITE" && val.word !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Word must be null when variant is MR_WHITE",
        path: ["word"],
      });
    }
  });

export const EliminationResultSchema = z.object({
  eliminatedId: z.string().optional(),
  role: RoleSchema.optional(),
  reason: ElimReasonSchema.optional(),
  isTie: z.boolean(),
  voteCounts: z.record(z.string(), z.number()).optional(),
});

export const GameOverSummarySchema = z.object({
  winner: WinnerSchema,
  reason: WinReasonSchema,
  civilianWord: z.string(),
  undercoverWord: z.string(),
  playerRoles: z.record(
    z.string(),
    z.object({
      role: RoleSchema,
      word: z.string().nullable(),
    })
  ),
});

export const RoomViewSchema = z.object({
  code: z.string(),
  phase: PhaseSchema,
  round: z.number(),
  endsAt: z.number().nullable(),
  paused: z
    .object({
      remainingMs: z.number(),
    })
    .nullable(),
  locked: z.boolean(),
  serverNow: z.number(),
  settings: SettingsSchema,
  players: z.array(PlayerPublicViewSchema),
  me: z.object({
    id: z.string(),
    status: PlayerStatusSchema,
    card: CardViewSchema.optional(),
    myVote: z.string().nullable().optional(),
  }),
  votedCount: z.number().optional(),
  totalVoters: z.number().optional(),
  lastElimination: EliminationResultSchema.optional(),
  pendingRequests: z.array(PlayerPublicViewSchema).optional(),
  gameOver: GameOverSummarySchema.optional(),
});
