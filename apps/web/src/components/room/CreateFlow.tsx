import { useState, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { connection } from "@/lib/connection";
import { createRoom } from "@/lib/api";
import RoomCodeShare from "@/components/room/RoomCodeShare";
import ProfileEditor from "@/components/modals/ProfileEditor";
import StatusBanner from "@/components/common/StatusBanner";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, ArrowLeft } from "lucide-react";

interface CreateFlowProps {
  initialCode?: string;
  onBack: () => void;
}

export default function CreateFlow({ initialCode, onBack }: CreateFlowProps) {
  const { profile, setProfile, connectionStatus, error } = useGameStore();
  const [code, setCode] = useState(initialCode || "");
  const [name, setName] = useState(profile.name || "Host");
  const [isCreating, setIsCreating] = useState(!initialCode);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialCode && !code) {
      let isMounted = true;
      setIsCreating(true);
      createRoom()
        .then((res) => {
          if (isMounted) {
            setCode(res.code);
            setIsCreating(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setCreateError(err.message || "Failed to create room");
            setIsCreating(false);
          }
        });
      return () => {
        isMounted = false;
      };
    }
  }, [initialCode]);

  const handleGoToRoom = () => {
    if (!code) return;
    const trimmed = name.trim() || profile.name || "Host";
    setProfile({ ...profile, name: trimmed });
    connection.connect(code);
  };

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

      {isCreating ? (
        <div className="p-8 text-center bg-paper border-[3px] border-black rounded-base shadow-brutal space-y-3">
          <Loader2 className="size-8 animate-spin mx-auto text-ink" />
          <p className="font-heading font-black text-lg text-ink">
            Securing a room code. Sabotaging trust...
          </p>
        </div>
      ) : createError ? (
        <div className="p-6 text-center bg-crimson-fade border-[3px] border-black rounded-base shadow-brutal space-y-4">
          <p className="font-heading font-black text-crimson-shade text-lg">Room Creation Failed</p>
          <p className="text-xs font-bold text-ink">{createError}</p>
          <Button
            type="button"
            variant="primary"
            size="default"
            onClick={() => {
              setCreateError(null);
              setIsCreating(true);
              createRoom()
                .then((res) => {
                  setCode(res.code);
                  setIsCreating(false);
                })
                .catch((err) => {
                  setCreateError(err.message);
                  setIsCreating(false);
                });
            }}
          >
            Give It Another Shot
          </Button>
        </div>
      ) : (
        <>
          {/* Room Code & Share/QR strip */}
          <RoomCodeShare code={code} variant="full" />

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

          {/* Go to the Room CTA Button */}
          <Button
            type="button"
            size="lg"
            variant="primary"
            disabled={!name.trim() || connectionStatus === "connecting"}
            onClick={handleGoToRoom}
            className="w-full flex items-center justify-center gap-2"
          >
            {connectionStatus === "connecting" ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Taking Your Seat...</span>
              </>
            ) : (
              <>
                <span>Go to the Room</span>
                <ArrowRight className="size-5" />
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
