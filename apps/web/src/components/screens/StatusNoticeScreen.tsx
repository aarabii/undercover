import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/button";
import { AlertTriangle, UserX, CopyX, DoorClosed } from "lucide-react";

interface StatusNoticeScreenProps {
  onHome: () => void;
}

export default function StatusNoticeScreen({ onHome }: StatusNoticeScreenProps) {
  const { declined, kicked, replaced, roomClosed, resetGame } = useGameStore();

  const handleReturn = () => {
    resetGame();
    onHome();
  };

  let title = "Disconnected";
  let description = "You have been disconnected from the session.";
  let icon = <AlertTriangle className="size-10 text-black" />;
  let color = "bg-yellow-300";

  if (declined) {
    title = "Join Request Declined";
    description = declined.reason
      ? `Host declined your request: ${declined.reason}`
      : "The room host declined your request to join.";
    icon = <UserX className="size-10 text-black" />;
    color = "bg-red-400";
  } else if (kicked) {
    title = "Removed from Room";
    description = "You have been removed from the room by the host.";
    icon = <UserX className="size-10 text-black" />;
    color = "bg-red-400";
  } else if (replaced) {
    title = "Opened in Another Tab";
    description = "This room was opened in another window or tab. Only one session is allowed at a time.";
    icon = <CopyX className="size-10 text-black" />;
    color = "bg-sky-300";
  } else if (roomClosed) {
    title = "Room Closed";
    description = "This game room has been closed or expired.";
    icon = <DoorClosed className="size-10 text-black" />;
    color = "bg-gray-300";
  }

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6">
      <div className="bg-white border-[3px] border-black rounded-base p-8 shadow-[4px_4px_0px_#000] space-y-6">
        <div className={`size-20 rounded-full border-[3px] border-black ${color} mx-auto flex items-center justify-center shadow-[3px_3px_0px_#000]`}>
          {icon}
        </div>

        <div className="space-y-2">
          <span className="font-heading font-black text-2xl text-black">
            {title}
          </span>
          <p className="text-sm font-bold text-gray-700">
            {description}
          </p>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={handleReturn}
          className="w-full h-12 text-base font-black bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
