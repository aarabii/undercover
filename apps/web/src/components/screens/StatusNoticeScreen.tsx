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

  let title = "Connection Dropped";
  let description = "You vanished from the room. Either Wi-Fi gave up or your phone did.";
  let icon = <AlertTriangle className="size-10 text-ink" />;
  let color = "bg-amber-base";

  if (declined) {
    title = "Access Denied";
    description = declined.reason
      ? `Host rejected your request: "${declined.reason}"`
      : "The host looked at your alias and said 'absolutely not.'";
    icon = <UserX className="size-10 text-ink" />;
    color = "bg-crimson-base";
  } else if (kicked) {
    title = "Kicked from the Room";
    description = "The host threw you out. Whatever you said, they took it personally.";
    icon = <UserX className="size-10 text-ink" />;
    color = "bg-crimson-base";
  } else if (replaced) {
    title = "Replaced by Your Evil Twin";
    description = "This game was opened in another tab. You cannot interrogate yourself from two windows.";
    icon = <CopyX className="size-10 text-ink" />;
    color = "bg-sky-base";
  } else if (roomClosed) {
    title = "Room Dissolved";
    description = "The host bailed. Case closed.";
    icon = <DoorClosed className="size-10 text-ink" />;
    color = "bg-canvas-fade";
  }

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6 font-para">
      <div className="bg-paper border-[3px] border-black rounded-base p-8 shadow-brutal space-y-6">
        <div className={`size-20 rounded-full border-[3px] border-black ${color} mx-auto flex items-center justify-center shadow-brutal`}>
          {icon}
        </div>

        <div className="space-y-2">
          <span className="font-heading font-black text-2xl text-ink">
            {title}
          </span>
          <p className="text-sm font-bold text-ink-muted">
            {description}
          </p>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={handleReturn}
          className="w-full h-12 text-base font-black bg-amber-base hover:bg-amber-tint text-ink border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
        >
          Back to the Main Menu
        </Button>
      </div>
    </div>
  );
}
