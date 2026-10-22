import { useGameStore } from "@/stores/gameStore";
import { connection } from "@/lib/connection";
import AvatarTile from "@/components/common/AvatarTile";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

export default function PendingScreen() {
  const { profile, roomView } = useGameStore();

  const handleCancel = () => {
    connection.leave();
  };

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6 font-para">
      <div className="bg-paper border-[3px] border-black rounded-base p-6 sm:p-8 shadow-brutal space-y-6">
        <div className="flex flex-col items-center gap-3">
          <AvatarTile avatar={profile.avatar} name={profile.name} size="lg" />
          <div className="space-y-1">
            <span className="font-heading font-black text-2xl text-ink">
              Waiting for the host...
            </span>
            <p className="text-xs font-bold text-ink-muted">
              You knocked on the door. Now we wait to see if the host trusts you.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-3 px-4 bg-canvas border-2 border-black rounded-base shadow-[2px_2px_0px_#000]">
          <Loader2 className="size-4 animate-spin text-ink" />
          <span className="font-mono font-bold text-sm text-ink">
            ROOM: {roomView?.code || "------"}
          </span>
        </div>

        <Button
          type="button"
          variant="destructive"
          size="default"
          onClick={handleCancel}
          className="w-full flex items-center justify-center gap-2"
        >
          <X className="size-4" />
          <span>Cancel Join Request</span>
        </Button>
      </div>
    </div>
  );
}
