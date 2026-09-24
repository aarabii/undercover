import type { PlayerPublicView } from "@game/types";
import { connection } from "@/lib/connection";
import AvatarTile from "@/components/AvatarTile";
import { Button } from "@/components/ui/button";
import { Check, X, UserPlus } from "lucide-react";

interface PendingRequestsPanelProps {
  pendingRequests: PlayerPublicView[];
}

export default function PendingRequestsPanel({
  pendingRequests,
}: PendingRequestsPanelProps) {
  if (pendingRequests.length === 0) return null;

  return (
    <div className="w-full bg-pink-100 border-[3px] border-black rounded-base p-4 shadow-[4px_4px_0px_#000] space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-base border-2 border-black bg-pink-300 flex items-center justify-center">
          <UserPlus className="size-3.5 text-black" />
        </div>
        <span className="font-heading font-black text-sm uppercase tracking-wider text-black">
          Join Requests ({pendingRequests.length})
        </span>
      </div>

      <div className="space-y-2">
        {pendingRequests.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between p-2.5 bg-white border-2 border-black rounded-base shadow-[2px_2px_0px_#000]"
          >
            <div className="flex items-center gap-3">
              <AvatarTile avatar={req.avatar} name="" size="sm" />
              <span className="font-bold text-sm text-black truncate max-w-[120px] sm:max-w-[160px]">
                {req.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={() => connection.hostApprove(req.id)}
                className="bg-lime-400 hover:bg-lime-300 text-black border-2 border-black shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 font-bold h-9 px-3 flex items-center gap-1"
                title="Approve"
              >
                <Check className="size-4" />
                <span className="hidden sm:inline">Accept</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => connection.hostDecline(req.id)}
                className="bg-red-400 hover:bg-red-300 text-black border-2 border-black shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 font-bold h-9 px-3 flex items-center gap-1"
                title="Decline"
              >
                <X className="size-4" />
                <span className="hidden sm:inline">Decline</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
