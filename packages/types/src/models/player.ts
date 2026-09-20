import type { AvatarConfig } from "./avatar";
import type { PlayerStatus, Presence, ElimReason } from "../enums/status";
import type { Role } from "../enums/role";

export interface Player {
  id: string;
  tokenHash: string;
  name: string;
  avatar: AvatarConfig;
  status: PlayerStatus;
  presence: Presence;
  joinedAt: number;
  lastSeenAt: number;
  disconnectedAt?: number;
  role?: Role;
  word?: string | null;
  eliminated?: {
    reason: ElimReason;
    round: number;
    role?: Role;
  };
}
