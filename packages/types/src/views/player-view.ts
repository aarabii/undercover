import type { AvatarConfig } from "../models/avatar";
import type { PlayerStatus, Presence, ElimReason } from "../enums/status";
import type { Role } from "../enums/role";

export interface PlayerPublicView {
  id: string;
  name: string;
  avatar: AvatarConfig;
  status: PlayerStatus;
  presence: Presence;
  isHost: boolean;
  eliminated?: {
    reason: ElimReason;
    round: number;
    role?: Role;
  };
}

export interface CardView {
  word: string | null;
  role?: Role;
  instruction?: string;
}
