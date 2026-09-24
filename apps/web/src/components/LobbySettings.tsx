import type { Settings, Difficulty } from "@game/types";
import { connection } from "@/lib/connection";
import { Sliders, Eye, EyeOff, Clock, UserCheck } from "lucide-react";

interface LobbySettingsProps {
  settings: Settings;
  isHost: boolean;
  playerCount: number;
}

export default function LobbySettings({
  settings,
  isHost,
  playerCount,
}: LobbySettingsProps) {
  const maxInfiltrators = Math.floor(Math.max(0, playerCount - 1) / 2);
  const totalInfiltrators = settings.undercoverCount + settings.mrWhiteCount;

  const handleUpdate = (patch: Partial<Settings>) => {
    connection.hostUpdateSettings(patch);
  };

  if (!isHost) {
    // Read-only view for non-hosts
    return (
      <div className="w-full bg-white border-[3px] border-black rounded-base p-4 shadow-[4px_4px_0px_#000] space-y-3 text-left">
        <div className="flex items-center gap-2 border-b-2 border-black pb-2">
          <Sliders className="size-4 text-black" />
          <span className="font-heading font-black text-xs uppercase tracking-wider text-black">
            Game Rules & Settings
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-[#fdfbf7] border border-black rounded-tight">
            <span className="block text-[10px] font-bold text-gray-600 uppercase">Infiltrators</span>
            <span className="font-black text-black">
              {settings.undercoverCount} Undercover, {settings.mrWhiteCount} Mr. White
            </span>
          </div>

          <div className="p-2 bg-[#fdfbf7] border border-black rounded-tight">
            <span className="block text-[10px] font-bold text-gray-600 uppercase">Difficulty</span>
            <span className="font-black text-black capitalize">{settings.difficulty}</span>
          </div>

          <div className="p-2 bg-[#fdfbf7] border border-black rounded-tight">
            <span className="block text-[10px] font-bold text-gray-600 uppercase">Roles Reveal</span>
            <span className="font-black text-black">
              {settings.showRoles ? "Roles Shown" : "Roles Hidden"}
            </span>
          </div>

          <div className="p-2 bg-[#fdfbf7] border border-black rounded-tight">
            <span className="block text-[10px] font-bold text-gray-600 uppercase">Timers</span>
            <span className="font-black text-black font-mono">
              {Math.floor(settings.discussionSeconds / 60)}m discuss / {settings.votingSeconds}s vote
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Editable controls for Room Host
  return (
    <div className="w-full bg-white border-[3px] border-black rounded-base p-5 shadow-[4px_4px_0px_#000] space-y-4 text-left">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="size-5 text-black" />
          <span className="font-heading font-black text-sm uppercase tracking-wider text-black">
            Room Settings (Host)
          </span>
        </div>
        {totalInfiltrators > maxInfiltrators && playerCount >= 4 && (
          <span className="text-[11px] font-bold text-red-600">
            Too many infiltrators! (Max {maxInfiltrators})
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Role Counts */}
        <div className="grid grid-cols-2 gap-3">
          {/* Undercover Stepper */}
          <div className="p-3 bg-[#fdfbf7] border-2 border-black rounded-base space-y-1.5 shadow-[2px_2px_0px_#000]">
            <span className="block text-[11px] font-black uppercase text-black">
              Undercover
            </span>
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={settings.undercoverCount <= 1}
                onClick={() =>
                  handleUpdate({ undercoverCount: Math.max(1, settings.undercoverCount - 1) })
                }
                className="size-8 rounded-base border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-30 font-black text-lg flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000]"
              >
                -
              </button>
              <span className="font-mono text-xl font-black">{settings.undercoverCount}</span>
              <button
                type="button"
                onClick={() =>
                  handleUpdate({ undercoverCount: settings.undercoverCount + 1 })
                }
                className="size-8 rounded-base border-2 border-black bg-white hover:bg-gray-100 font-black text-lg flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000]"
              >
                +
              </button>
            </div>
          </div>

          {/* Mr. White Stepper */}
          <div className="p-3 bg-[#fdfbf7] border-2 border-black rounded-base space-y-1.5 shadow-[2px_2px_0px_#000]">
            <span className="block text-[11px] font-black uppercase text-black">
              Mr. White
            </span>
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={settings.mrWhiteCount <= 0}
                onClick={() =>
                  handleUpdate({ mrWhiteCount: Math.max(0, settings.mrWhiteCount - 1) })
                }
                className="size-8 rounded-base border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-30 font-black text-lg flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000]"
              >
                -
              </button>
              <span className="font-mono text-xl font-black">{settings.mrWhiteCount}</span>
              <button
                type="button"
                onClick={() =>
                  handleUpdate({ mrWhiteCount: settings.mrWhiteCount + 1 })
                }
                className="size-8 rounded-base border-2 border-black bg-white hover:bg-gray-100 font-black text-lg flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000]"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="space-y-1.5">
          <span className="block text-xs font-black uppercase tracking-wider text-black">
            Word Difficulty
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {(["easy", "medium", "hard", "mixed"] as Difficulty[]).map((d) => {
              const active = settings.difficulty === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleUpdate({ difficulty: d })}
                  className={`py-1.5 text-xs font-black capitalize rounded-base border-2 border-black transition-all cursor-pointer ${
                    active
                      ? "bg-yellow-300 shadow-[2px_2px_0px_#000]"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggles: Show Roles & Approval */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleUpdate({ showRoles: !settings.showRoles })}
            className={`p-2.5 rounded-base border-2 border-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
              settings.showRoles
                ? "bg-sky-200 shadow-[2px_2px_0px_#000]"
                : "bg-white hover:bg-gray-100 shadow-[1px_1px_0px_#000]"
            }`}
          >
            {settings.showRoles ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            <span className="text-xs font-black uppercase">
              {settings.showRoles ? "Roles Shown" : "Roles Hidden"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleUpdate({ requireApproval: !settings.requireApproval })}
            className={`p-2.5 rounded-base border-2 border-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
              settings.requireApproval
                ? "bg-lime-200 shadow-[2px_2px_0px_#000]"
                : "bg-white hover:bg-gray-100 shadow-[1px_1px_0px_#000]"
            }`}
          >
            <UserCheck className="size-4" />
            <span className="text-xs font-black uppercase">
              {settings.requireApproval ? "Approval ON" : "Instant Join"}
            </span>
          </button>
        </div>

        {/* Timers Stepper / Selector */}
        <div className="p-3 bg-[#fdfbf7] border-2 border-black rounded-base space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-black">
            <Clock className="size-4" />
            <span>Discussion Timer</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[60, 120, 180, 300].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleUpdate({ discussionSeconds: sec })}
                className={`py-1 text-xs font-mono font-bold rounded-tight border border-black cursor-pointer ${
                  settings.discussionSeconds === sec
                    ? "bg-yellow-300 font-black shadow-[1px_1px_0px_#000]"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {sec / 60}m
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
