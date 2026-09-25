import type { PlayerPublicView } from "@game/types";
import { connection } from "@/lib/connection";
import AvatarTile from "@/components/common/AvatarTile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, UserMinus } from "lucide-react";

interface PlayerManageModalProps {
  player: PlayerPublicView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PlayerManageModal({
  player,
  open,
  onOpenChange,
}: PlayerManageModalProps) {
  if (!player) return null;

  const handleTransfer = () => {
    connection.hostTransfer(player.id);
    onOpenChange(false);
  };

  const handleKick = () => {
    connection.hostKick(player.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[calc(100%-2rem)]
          max-w-md
          max-h-[calc(100dvh-2rem)]
          overflow-hidden
          bg-white
          border-[3px]
          border-black
          shadow-[6px_6px_0px_#000]
          p-4 sm:p-6
          text-center
        "
      >
        <DialogHeader className="min-w-0 border-b-2 border-black pb-3">
          <DialogTitle
            className="
              min-w-0
              font-heading
              font-black
              text-lg
              leading-tight
              warp-break-word
              wrap-anywhere
            "
          >
            Suspect Actions: {player.name}
          </DialogTitle>

          <DialogDescription className="text-xs font-bold text-gray-700">
            Decide what to do with this suspect.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-col items-center gap-3 py-4">
          <AvatarTile avatar={player.avatar} name={player.name} size="lg" />
        </div>

        <DialogFooter
          className="
            grid
            w-full
            grid-cols-1
            gap-2
            pt-2
            sm:grid-cols-2
          "
        >
          <Button
            type="button"
            variant="secondary"
            onClick={handleTransfer}
            title="Transfer host"
            aria-label="Transfer host"
            className="
              min-w-0
              w-full
              bg-yellow-300
              hover:bg-yellow-200
              text-black
              border-2
              border-black
              shadow-[2px_2px_0px_#000]
              active:translate-x-0.5
              active:translate-y-0.5
              font-black
              flex
              items-center
              justify-center
              gap-2
              whitespace-normal
              wrap-break-word
            "
          >
            <Crown className="size-4 shrink-0" />
            <span className="min-w-0">Pass the Crown</span>
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={handleKick}
            title="Kick player"
            aria-label="Kick player"
            className="
              min-w-0
              w-full
              bg-red-400
              hover:bg-red-300
              text-black
              border-2
              border-black
              shadow-[2px_2px_0px_#000]
              active:translate-x-0.5
              active:translate-y-0.5
              font-black
              flex
              items-center
              justify-center
              gap-2
              whitespace-normal
              wrap-break-word
            "
          >
            <UserMinus className="size-4 shrink-0" />
            <span className="min-w-0">Kick From Room</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
