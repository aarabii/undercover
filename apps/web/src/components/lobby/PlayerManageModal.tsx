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
      <DialogContent className="max-w-xs bg-white border-[3px] border-black shadow-[6px_6px_0px_#000] p-6 text-center">
        <DialogHeader className="border-b-2 border-black pb-3">
          <DialogTitle className="font-heading font-black text-lg">
            Manage Player
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-gray-700">
            Host actions for {player.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-4">
          <AvatarTile avatar={player.avatar} name={player.name} size="lg" />
        </div>

        <DialogFooter className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleTransfer}
            className="w-full bg-yellow-300 hover:bg-yellow-200 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 font-black flex items-center justify-center gap-2"
          >
            <Crown className="size-4" /> Transfer Host
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={handleKick}
            className="w-full bg-red-400 hover:bg-red-300 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 font-black flex items-center justify-center gap-2"
          >
            <UserMinus className="size-4" /> Kick Player
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
