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
          bg-paper
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
              text-ink
              wrap-break-word
              [overflow-wrap:anywhere]
            "
          >
            Suspect Actions: {player.name}
          </DialogTitle>

          <DialogDescription className="text-xs font-bold text-ink-muted">
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
            variant="primary"
            size="default"
            onClick={handleTransfer}
            title="Transfer host"
            aria-label="Transfer host"
            className="w-full flex items-center justify-center gap-2"
          >
            <Crown className="size-4 shrink-0" />
            <span>Pass the Crown</span>
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="default"
            onClick={handleKick}
            title="Kick player"
            aria-label="Kick player"
            className="w-full flex items-center justify-center gap-2"
          >
            <UserMinus className="size-4 shrink-0" />
            <span>Kick From Room</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
