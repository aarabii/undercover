import { useState, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { connection } from "@/lib/connection";
import { checkRoom, type RoomStatus } from "@/lib/api";
import ProfileEditor from "@/components/modals/ProfileEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface JoinFlowProps {
  initialCode?: string;
  isLockedCode?: boolean;
  onBack: () => void;
}

export default function JoinFlow({
  initialCode = "",
  isLockedCode = false,
  onBack,
}: JoinFlowProps) {
  const { profile, connectionStatus, error } = useGameStore();
  const [code, setCode] = useState(initialCode.toUpperCase().slice(0, 6));
  const [name, setName] = useState(profile.name || "Player");
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Sanitize room code: alphanumeric uppercase, strip 0, O, 1, I
  const handleCodeChange = (raw: string) => {
    const sanitized = raw
      .toUpperCase()
      .replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, "")
      .slice(0, 6);
    setCode(sanitized);
  };

  useEffect(() => {
    if (code.length === 6) {
      let isMounted = true;
      setIsChecking(true);
      checkRoom(code)
        .then((status) => {
          if (isMounted) {
            setRoomStatus(status);
            setIsChecking(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setRoomStatus(null);
            setIsChecking(false);
          }
        });

      return () => {
        isMounted = false;
      };
    } else {
      setRoomStatus(null);
    }
  }, [code]);

  const handleJoin = () => {
    if (code.length !== 6) return;
    connection.connect(code);
  };

  const isJoinDisabled =
    code.length !== 6 ||
    !name.trim() ||
    connectionStatus === "connecting" ||
    Boolean(roomStatus && (!roomStatus.exists || roomStatus.locked || roomStatus.full));

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black hover:underline cursor-pointer"
      >
        <ArrowLeft className="size-4" /> Back to menu
      </button>

      {/* Code Input Card */}
      <div className="bg-white border-[3px] border-black rounded-base p-6 shadow-[4px_4px_0px_#000] space-y-3">
        <label
          htmlFor="room-code-input"
          className="block text-xs font-black uppercase tracking-wider text-black text-center"
        >
          Enter 6-Letter Room Code
        </label>

        <div className="relative">
          <Input
            id="room-code-input"
            type="text"
            disabled={isLockedCode}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="ABCXYZ"
            maxLength={6}
            className="font-mono text-center tracking-widest text-3xl font-black uppercase h-14 bg-[#fdfbf7] border-[3px] border-black rounded-base shadow-[2px_2px_0px_#000] focus-visible:ring-2 focus-visible:ring-black"
          />
          {isChecking && (
            <div className="absolute right-3 top-4">
              <Loader2 className="size-6 animate-spin text-gray-500" />
            </div>
          )}
        </div>

        {/* Room status feedback */}
        {code.length === 6 && !isChecking && roomStatus && (
          <div className="pt-1">
            {!roomStatus.exists ? (
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 p-2 border border-red-300 rounded-base">
                <XCircle className="size-4 shrink-0" />
                <span>Room not found. Check the code or create a room.</span>
              </div>
            ) : roomStatus.locked ? (
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 p-2 border border-red-300 rounded-base">
                <XCircle className="size-4 shrink-0" />
                <span>This room is locked by the host.</span>
              </div>
            ) : roomStatus.full ? (
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 p-2 border border-amber-300 rounded-base">
                <AlertTriangle className="size-4 shrink-0" />
                <span>This room is currently full.</span>
              </div>
            ) : roomStatus.inGame ? (
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 p-2 border border-blue-300 rounded-base">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Game in progress. You'll join as a waiting spectator.</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 p-2 border border-green-300 rounded-base">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Room ready to join!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="bg-white border-[3px] border-black rounded-base p-6 shadow-[4px_4px_0px_#000]">
        <ProfileEditor name={name} onNameChange={setName} />
      </div>

      {/* Error Message banner */}
      {error && (
        <div className="p-3 bg-red-100 border-2 border-black rounded-base text-xs font-bold text-red-900 text-center">
          {error.message}
        </div>
      )}

      {/* Enter Room CTA Button */}
      <Button
        type="button"
        size="lg"
        disabled={isJoinDisabled}
        onClick={handleJoin}
        className="w-full h-14 text-lg font-black tracking-wide bg-sky-300 hover:bg-sky-200 text-black border-[3px] border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {connectionStatus === "connecting" ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <span>Go to the Room</span>
            <ArrowRight className="size-5" />
          </>
        )}
      </Button>
    </div>
  );
}
