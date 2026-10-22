import { useMemo } from "react";
import type { AvatarConfig, Role, ElimReason } from "@game/types";
import { getAvatarDataUri } from "@/lib/avatar";
import { Crown, Skull, Check, Pencil } from "lucide-react";

export interface AvatarTileProps {
  avatar: AvatarConfig;
  name: string;
  isHost?: boolean;
  isMe?: boolean;
  isEliminated?: boolean;
  eliminatedInfo?: {
    reason: ElimReason;
    role?: Role;
  };
  isAway?: boolean;
  isSelected?: boolean;
  isVotedForMe?: boolean; // Kept for backward compatibility
  voteCount?: number;
  canEdit?: boolean;
  onEdit?: () => void;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function AvatarTile({
  avatar,
  name,
  isHost = false,
  isMe = false,
  isEliminated = false,
  eliminatedInfo,
  isAway = false,
  isSelected = false,
  isVotedForMe = false,
  voteCount,
  canEdit = false,
  onEdit,
  onClick,
  size = "md",
  className = "",
}: AvatarTileProps) {
  const dataUri = useMemo(() => getAvatarDataUri(avatar), [avatar]);
  const isVoted = isSelected || isVotedForMe;

  const sizeClasses = {
    sm: "size-14 text-xs",
    md: "size-20 text-sm",
    lg: "size-28 text-base",
  }[size];

  const ringClasses = useMemo(() => {
    if (isEliminated) {
      return "border-2 border-black opacity-75 grayscale";
    }
    if (isAway) {
      return "border-2 border-dashed border-black opacity-60";
    }
    if (isVoted) {
      return "border-[3px] border-black bg-sky-tint shadow-[3px_3px_0px_#000] scale-105";
    }
    if (isMe) {
      return "border-[3px] border-black bg-mint-fade shadow-[2px_2px_0px_#10B981]";
    }
    return "border-2 border-black bg-paper shadow-[2px_2px_0px_#000]";
  }, [isEliminated, isAway, isVoted, isMe]);

  const isClickable = Boolean(onClick && !isEliminated);

  return (
    <div
      className={`relative flex flex-col items-center select-none group min-w-[56px] min-h-[56px] ${
        isClickable ? "cursor-pointer transition-transform active:translate-y-0.5" : ""
      } ${className}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && isClickable && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${name}${isMe ? ", You" : ""}${isHost ? ", Host" : ""}${isEliminated ? ", Eliminated" : ""}${isAway ? ", Away" : ""}`}
    >
      {/* Main Avatar Circle */}
      <div
        className={`relative ${sizeClasses} rounded-full p-1.5 flex items-center justify-center transition-all ${ringClasses}`}
      >
        {/* Inner container to prevent avatar image overflow */}
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
          <img
            src={dataUri}
            alt={name}
            className={`w-full h-full object-contain pointer-events-none ${
              isEliminated ? "grayscale contrast-125" : ""
            }`}
          />
        </div>

        {/* Host Crown Badge */}
        {isHost && (
          <div
            className="absolute -top-1.5 -right-1.5 size-6 rounded-full border-2 border-black bg-amber-base flex items-center justify-center shadow-[1px_1px_0px_#000] z-10"
            title="Host"
          >
            <Crown className="size-3.5 text-black fill-black" />
          </div>
        )}

        {/* Voted checkmark badge (shows on the player user voted for) */}
        {isVoted && !isEliminated && !isMe && (
          <div
            className="absolute -top-1.5 -left-1.5 size-6 rounded-full border-2 border-black bg-lime-base flex items-center justify-center shadow-[1px_1px_0px_#000] z-10"
            title="Your vote"
          >
            <Check className="size-3.5 text-black stroke-[3]" />
          </div>
        )}

        {/* Eliminated Skull Stamp */}
        {isEliminated && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full"
            title="Eliminated"
          >
            <div className="bg-crimson-base border-2 border-black p-1.5 rounded-full rotate-[-8deg] shadow-[2px_2px_0px_#000]">
              <Skull className="size-5 text-white" />
            </div>
          </div>
        )}

        {/* Editable Pencil Badge */}
        {canEdit && onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-black bg-amber-base hover:bg-amber-tint active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#000] cursor-pointer z-10"
            title="Edit avatar"
            aria-label="Edit avatar"
          >
            <Pencil className="size-3.5 text-black" />
          </button>
        )}
      </div>

      {/* Name and Tags */}
      <div className="mt-1 text-center max-w-[100px] flex flex-col items-center">
        <span
          className={`block text-xs font-black truncate max-w-full ${
            isEliminated
              ? "line-through text-ink-muted"
              : isMe
              ? "text-mint-shade"
              : "text-ink"
          }`}
        >
          {name}
        </span>

        {/* You badge */}
        {isMe && !isEliminated && (
          <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase rounded-tight bg-mint-tint text-ink border border-black shadow-[1px_1px_0px_#000] mt-0.5">
            YOU
          </span>
        )}

        {/* Away Badge */}
        {isAway && !isEliminated && (
          <span className="inline-block text-[10px] font-bold text-ink-muted uppercase">
            away
          </span>
        )}

        {/* Revealed Role after elimination */}
        {isEliminated && eliminatedInfo?.role && (
          <span
            className={`inline-block px-1.5 py-0.5 text-[9px] font-black uppercase rounded-tight border border-black mt-0.5 ${
              eliminatedInfo.role === "CIVILIAN"
                ? "bg-lime-base text-ink"
                : eliminatedInfo.role === "UNDERCOVER"
                ? "bg-sky-base text-ink"
                : "bg-paper text-ink border-dashed"
            }`}
          >
            {eliminatedInfo.role === "MR_WHITE" ? "Mr. White" : eliminatedInfo.role}
          </span>
        )}

        {/* Tally count badge during / after voting */}
        {typeof voteCount === "number" && voteCount > 0 && (
          <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-crimson-base text-ink border border-black rounded-tight mt-0.5 shadow-[1px_1px_0px_#000]">
            {voteCount} {voteCount === 1 ? "vote" : "votes"}
          </span>
        )}
      </div>
    </div>
  );
}
