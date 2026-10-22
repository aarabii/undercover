import { useState, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { connection } from "@/lib/connection";
import { checkRoom, type RoomStatus } from "@/lib/api";
import ProfileEditor from "@/components/modals/ProfileEditor";
import StatusBanner from "@/components/common/StatusBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, ArrowLeft } from "lucide-react";

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
  const { profile, setProfile, connectionStatus, error } = useGameStore();
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
    const trimmed = name.trim() || profile.name || "Player";
    setProfile({ ...profile, name: trimmed });
    connection.connect(code);
  };

  const isJoinDisabled =
    code.length !== 6 ||
    !name.trim() ||
    connectionStatus === "connecting" ||
    Boolean(roomStatus && (!roomStatus.exists || roomStatus.locked || roomStatus.full));

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Menu</span>
        </Button>
      </div>

      {/* Code Input Card */}
      <div className="bg-paper border-[3px] border-black rounded-base p-5 sm:p-6 shadow-brutal space-y-3">
        <label
          htmlFor="room-code-input"
          className="block text-xs font-black uppercase tracking-wider text-ink text-center font-mono"
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
            className="font-mono text-center tracking-widest text-3xl font-black uppercase h-14 bg-canvas-fade border-[3px] border-black text-ink"
          />
          {isChecking && (
            <div className="absolute right-3 top-4">
              <Loader2 className="size-6 animate-spin text-ink-muted" />
            </div>
          )}
        </div>

        {/* 6-Slot Character Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i < code.length
                  ? "w-5 bg-sky-base border border-black"
                  : "w-2.5 bg-line border border-black/30"
              }`}
            />
          ))}
        </div>

        {/* Room status feedback using StatusBanner */}
        {code.length === 6 && !isChecking && roomStatus && (
          <div className="pt-1">
            {!roomStatus.exists ? (
              <StatusBanner variant="danger">
                No room with that code. Check your spelling or host your own.
              </StatusBanner>
            ) : roomStatus.locked ? (
              <StatusBanner variant="danger">
                Room is locked. The host is having trust issues.
              </StatusBanner>
            ) : roomStatus.full ? (
              <StatusBanner variant="warning">
                Room at capacity. No more seats at this interrogation table.
              </StatusBanner>
            ) : roomStatus.inGame ? (
              <StatusBanner variant="info">
                Game already started. You'll spectate until the current round finishes.
              </StatusBanner>
            ) : (
              <StatusBanner variant="success">
                Room found. Proceed at your own risk.
              </StatusBanner>
            )}
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="bg-paper border-[3px] border-black rounded-base p-5 sm:p-6 shadow-brutal">
        <ProfileEditor name={name} onNameChange={setName} />
      </div>

      {/* Error Message banner */}
      {error && (
        <StatusBanner variant="danger">
          {error.message}
        </StatusBanner>
      )}

      {/* Enter Room CTA Button */}
      <Button
        type="button"
        size="lg"
        variant="secondary"
        disabled={isJoinDisabled}
        onClick={handleJoin}
        className="w-full flex items-center justify-center gap-2"
      >
        {connectionStatus === "connecting" ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            <span>Sneaking In...</span>
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
