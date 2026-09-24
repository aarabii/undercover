import { useMemo } from "react";
import type { AvatarConfig, Role, ElimReason } from "@game/types";
import { getAvatarDataUri } from "@/lib/avatar";
import { Crown, Skull, Check, Pencil, User } from "lucide-react";

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
  isVotedForMe?: boolean;
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
    if (isSelected) {
      return "border-[3px] border-black bg-sky-100 shadow-[3px_3px_0px_#000] scale-105";
    }
    if (isMe) {
      return "border-[3px] border-black bg-emerald-50 shadow-[2px_2px_0px_#059669]";
    }
    return "border-2 border-black bg-[#fdfbf7] shadow-[2px_2px_0px_#000]";
  }, [isEliminated, isAway, isSelected, isMe]);

  return (
    <div
      className={`relative flex flex-col items-center select-none group min-w-[56px] min-h-[56px] ${
        onClick && !isEliminated ? "cursor-pointer" : ""
      } ${className}`}
      onClick={!isEliminated && onClick ? onClick : undefined}
      role={onClick && !isEliminated ? "button" : undefined}
      tabIndex={onClick && !isEliminated ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick && !isEliminated) {
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

        {/* Self Identification Badge */}
        {isMe && (
          <div
            className="absolute -top-1.5 -left-1.5 size-6 rounded-full border-2 border-black bg-emerald-400 flex items-center justify-center shadow-[1px_1px_0px_#000] z-10"
            title="You"
          >
            <User className="size-3.5 text-black stroke-[3]" />
          </div>
        )}

        {/* Host Crown Badge */}
        {isHost && (
          <div
            className="absolute -top-1.5 -right-1.5 size-6 rounded-full border-2 border-black bg-yellow-300 flex items-center justify-center shadow-[1px_1px_0px_#000] z-10"
            title="Host"
          >
            <Crown className="size-3.5 text-black fill-black" />
          </div>
        )}

        {/* Voted checkmark badge (only on other players that user voted for) */}
        {isVotedForMe && !isEliminated && !isMe && (
          <div
            className="absolute -top-1.5 -left-1.5 size-6 rounded-full border-2 border-black bg-lime-400 flex items-center justify-center shadow-[1px_1px_0px_#000] z-10"
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
            <div className="bg-red-500 border-2 border-black p-1.5 rounded-full rotate-[-8deg] shadow-[2px_2px_0px_#000]">
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
            className="absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-black bg-yellow-300 hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#000] cursor-pointer z-10"
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
              ? "line-through text-gray-500"
              : isMe
              ? "text-emerald-700"
              : "text-black"
          }`}
        >
          {name}
        </span>

        {/* You badge */}
        {isMe && !isEliminated && (
          <span className="inline-block px-1.5 py-0.2 text-[9px] font-black uppercase rounded-tight bg-emerald-300 text-black border border-black shadow-[1px_1px_0px_#000] mt-0.5">
            YOU
          </span>
        )}

        {/* Away Badge */}
        {isAway && !isEliminated && (
          <span className="inline-block text-[10px] font-bold text-gray-500 uppercase">
            away
          </span>
        )}

        {/* Revealed Role after elimination */}
        {isEliminated && eliminatedInfo?.role && (
          <span
            className={`inline-block px-1.5 py-0.5 text-[9px] font-black uppercase rounded-tight border border-black mt-0.5 ${
              eliminatedInfo.role === "CIVILIAN"
                ? "bg-lime-300"
                : eliminatedInfo.role === "UNDERCOVER"
                ? "bg-sky-300"
                : "bg-white border-dashed"
            }`}
          >
            {eliminatedInfo.role === "MR_WHITE" ? "Mr. White" : eliminatedInfo.role}
          </span>
        )}

        {/* Tally count badge during / after voting */}
        {typeof voteCount === "number" && voteCount > 0 && (
          <span className="inline-block px-1.5 py-0.2 text-[10px] font-mono font-bold bg-red-400 text-black border border-black rounded-tight mt-0.5 shadow-[1px_1px_0px_#000]">
            {voteCount} {voteCount === 1 ? "vote" : "votes"}
          </span>
        )}
      </div>
    </div>
  );
}
