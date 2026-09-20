import type { AvatarConfig } from "../models/avatar";
import type { PlayerStatus, Presence, ElimReason } from "../enums/status";
import type { Role } from "../enums/role";
import type { CardVariant } from "../enums/game";

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
  variant: CardVariant;
  word: string | null;
  role?: Role;
}
