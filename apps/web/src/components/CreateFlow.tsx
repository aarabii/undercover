import { useState, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { connection } from "@/lib/connection";
import { createRoom } from "@/lib/api";
import RoomCodeShare from "@/components/RoomCodeShare";
import ProfileEditor from "@/components/ProfileEditor";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, ArrowLeft } from "lucide-react";

interface CreateFlowProps {
  initialCode?: string;
  onBack: () => void;
}

export default function CreateFlow({ initialCode, onBack }: CreateFlowProps) {
  const { profile, connectionStatus, error } = useGameStore();
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
    connection.connect(code);
  };

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

      {isCreating ? (
        <div className="p-8 text-center bg-white border-[3px] border-black rounded-base shadow-[4px_4px_0px_#000] space-y-3">
          <Loader2 className="size-8 animate-spin mx-auto text-black" />
          <p className="font-heading font-black text-lg">Reserving room code...</p>
        </div>
      ) : createError ? (
        <div className="p-6 text-center bg-red-100 border-[3px] border-black rounded-base shadow-[4px_4px_0px_#000] space-y-3">
          <p className="font-heading font-black text-red-700 text-lg">Creation Failed</p>
          <p className="text-xs font-bold text-black">{createError}</p>
          <Button
            type="button"
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
            className="bg-yellow-400 font-bold border-2 border-black"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Room Code & Share/QR strip */}
          <RoomCodeShare code={code} />

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

          {/* Go to the Room CTA Button */}
          <Button
            type="button"
            size="lg"
            disabled={!name.trim() || connectionStatus === "connecting"}
            onClick={handleGoToRoom}
            className="w-full h-14 text-lg font-black tracking-wide bg-yellow-400 hover:bg-yellow-300 text-black border-[3px] border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {connectionStatus === "connecting" ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Entering Room...</span>
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
