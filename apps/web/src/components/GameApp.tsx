import { useState, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import CreateFlow from "@/components/room/CreateFlow";
import JoinFlow from "@/components/room/JoinFlow";
import PendingScreen from "@/components/screens/PendingScreen";
import StatusNoticeScreen from "@/components/screens/StatusNoticeScreen";
import LobbyScreen from "@/components/lobby/LobbyScreen";
import WaitingScreen from "@/components/screens/WaitingScreen";
import InGameScreen from "@/components/game/InGameScreen";
import { ROOM_CODE_LENGTH } from "@game/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/common/BrandLogo";
import { GiPadlock, GiEntryDoor } from "react-icons/gi";

type FlowMode = "menu" | "create" | "join";

export default function GameApp() {
  const {
    roomView,
    declined,
    kicked,
    replaced,
    roomClosed,
    profile,
    setProfile,
  } = useGameStore();

  const [mode, setMode] = useState<FlowMode>("menu");
  const [initialCode, setInitialCode] = useState("");
  const [isLockedCode, setIsLockedCode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const pathMatch = pathname.match(/\/r\/([23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6})/i);

      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code");
      const urlAction = params.get("action");
      const urlName = params.get("name");

      if (urlName) {
        setProfile({ ...profile, name: urlName.slice(0, 16) });
      }

      if (pathMatch) {
        setInitialCode(pathMatch[1].toUpperCase());
        setIsLockedCode(true);
        setMode("join");
      } else if (urlCode) {
        setInitialCode(urlCode.toUpperCase().slice(0, ROOM_CODE_LENGTH));
        setIsLockedCode(true);
        setMode("join");
      } else if (urlAction === "create") {
        setMode("create");
      } else if (urlAction === "join") {
        setMode("join");
      }
    }
  }, []);

  // 1. Terminal / Disconnected / Notice states
  if (declined || kicked || replaced || roomClosed) {
    return (
      <StatusNoticeScreen
        onHome={() => {
          setMode("menu");
          if (typeof window !== "undefined" && window.location.pathname !== "/play") {
            window.location.href = "/";
          }
        }}
      />
    );
  }

  // 2. Connected Room View handling
  if (roomView) {
    // If pending host approval
    if (roomView.me.status === "pending") {
      return <PendingScreen />;
    }

    // If waiting spectator
    if (roomView.me.status === "waiting") {
      return <WaitingScreen roomView={roomView} />;
    }

    // Lobby Phase
    if (roomView.phase === "LOBBY") {
      return <LobbyScreen roomView={roomView} />;
    }

    // In-game Phases (ROLE_REVEAL, DISCUSSION, VOTING, ELIMINATION, MRWHITE_GUESS, GAME_OVER)
    return <InGameScreen roomView={roomView} />;
  }

  // 3. Pre-connection Flow States
  if (mode === "create") {
    return <CreateFlow initialCode={initialCode} onBack={() => setMode("menu")} />;
  }

  if (mode === "join") {
    return (
      <JoinFlow
        initialCode={initialCode}
        isLockedCode={isLockedCode}
        onBack={() => setMode("menu")}
      />
    );
  }

  // 4. Default Menu Mode
  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] py-6 text-center font-para w-full max-w-md mx-auto">
      <Card className="w-full text-left bg-white border-[3px] border-black shadow-[6px_6px_0px_#000]">
        <CardHeader className="border-b-2 border-black pb-4">
          <div className="flex items-center justify-between">
            <BrandLogo size="sm" showTagline={false} />
            <Badge variant="primary">No Login</Badge>
          </div>
          <CardDescription className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-1">
            A game of trust, betrayal, and looking guilty for blinking.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <Button
            type="button"
            size="lg"
            variant="default"
            onClick={() => setMode("create")}
            className="w-full h-14 text-base font-black bg-yellow-400 hover:bg-yellow-300 text-black border-[3px] border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <GiPadlock className="size-5 shrink-0" />
            <span>Host a Room</span>
          </Button>

          <Button
            type="button"
            size="lg"
            variant="secondary"
            onClick={() => setMode("join")}
            className="w-full h-14 text-base font-black bg-sky-300 hover:bg-sky-200 text-black border-[3px] border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <GiEntryDoor className="size-5 shrink-0" />
            <span>Join Room by Code</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
