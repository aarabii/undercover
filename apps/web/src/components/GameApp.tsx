import { useState, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { MIN_PLAYERS, ROOM_CODE_LENGTH } from "@game/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/BrandLogo";
import { GiPadlock, GiEntryDoor, GiSpy } from "react-icons/gi";

export default function GameApp() {
  const { connectionStatus, roomView, profile, setProfile } = useGameStore();
  const [code, setCode] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code");
      const urlName = params.get("name");
      if (urlCode) {
        setCode(urlCode.toUpperCase().slice(0, ROOM_CODE_LENGTH));
      }
      if (urlName) {
        setProfile({ ...profile, name: urlName.slice(0, 16) });
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[75dvh] py-6 text-center font-para">
      <Card className="w-full max-w-md text-left bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000000]">
        <CardHeader className="border-b-2 border-black pb-4">
          <div className="flex items-center justify-between">
            <BrandLogo size="sm" showTagline={false} />
            <Badge variant="primary">v1.0</Badge>
          </div>
          <CardDescription className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-1">
            Real-time, no-login social deduction word game.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {roomView ? (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-200 border-[3px] border-black rounded-base shadow-brutal text-center font-mono text-2xl font-black tracking-widest">
                ROOM: {roomView.code}
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span>Phase:</span>
                <Badge variant="lime">{roomView.phase}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span>Players:</span>
                <span>
                  {roomView.players.length} / {roomView.settings.maxPlayers}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider">Your Name</label>
                <Input
                  type="text"
                  value={profile.name}
                  maxLength={16}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Enter your name"
                  className="font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider">Room Code</label>
                <Input
                  type="text"
                  value={code}
                  maxLength={ROOM_CODE_LENGTH}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono text-center tracking-widest text-lg uppercase font-black"
                  placeholder="6-LETTER CODE"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => alert("Creating room...")}
                  className="w-full font-black bg-lime-400 hover:bg-lime-300 text-black border-[3px] border-black shadow-brutal flex items-center justify-center gap-1.5"
                >
                  <GiPadlock className="size-4 shrink-0" />
                  <span>Create Room</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={code.length !== ROOM_CODE_LENGTH}
                  onClick={() => alert(`Joining room ${code}...`)}
                  className="w-full font-black bg-sky-300 hover:bg-sky-200 text-black border-[3px] border-black shadow-brutal flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <GiEntryDoor className="size-4 shrink-0" />
                  <span>Join Room</span>
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t-2 border-black/10 text-xs font-mono text-gray-500">
            <span className="flex items-center gap-1">
              <GiSpy className="size-3.5" /> Min players: {MIN_PLAYERS}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`size-2.5 rounded-full border border-black ${
                  connectionStatus === "connected" ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              {connectionStatus}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
