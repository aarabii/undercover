import { useGameStore } from "@/stores/gameStore";
import { connection } from "@/lib/connection";
import AvatarTile from "@/components/AvatarTile";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

export default function PendingScreen() {
  const { profile, roomView } = useGameStore();

  const handleCancel = () => {
    connection.leave();
  };

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6">
      <div className="bg-white border-[3px] border-black rounded-base p-8 shadow-[4px_4px_0px_#000] space-y-6">
        <div className="flex flex-col items-center gap-3">
          <AvatarTile avatar={profile.avatar} name={profile.name} size="lg" />
          <div className="space-y-1">
            <span className="font-heading font-black text-2xl text-black">
              Waiting for the host...
            </span>
            <p className="text-xs font-bold text-gray-600">
              The room host has been notified of your request to join.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-3 bg-[#fdfbf7] border-2 border-black rounded-base shadow-[2px_2px_0px_#000]">
          <Loader2 className="size-5 animate-spin text-black" />
          <span className="font-mono font-bold text-sm">
            ROOM: {roomView?.code || "------"}
          </span>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleCancel}
          className="w-full bg-red-400 hover:bg-red-300 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 font-black flex items-center justify-center gap-2"
        >
          <X className="size-4" /> Cancel Request
        </Button>
      </div>
    </div>
  );
}
