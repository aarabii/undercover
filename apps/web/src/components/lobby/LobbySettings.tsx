import type { Settings, Difficulty } from "@game/types";
import { connection } from "@/lib/connection";
import { Sliders, Eye, EyeOff, Clock, UserCheck, Shield } from "lucide-react";

interface LobbySettingsProps {
  settings: Settings;
  isHost: boolean;
  playerCount: number;
}

// Shared Suspect Balance Breakdown Bar for Host and Non-Host views
function SuspectBalanceBar({
  playerCount,
  estimatedCivilians,
  undercoverCount,
  mrWhiteCount,
}: {
  playerCount: number;
  estimatedCivilians: number;
  undercoverCount: number;
  mrWhiteCount: number;
}) {
  if (playerCount < 4) return null;

  return (
    <div className="p-3 bg-canvas-fade border-2 border-black rounded-base space-y-2">
      <div className="flex items-center justify-between text-xs font-mono font-bold text-ink">
        <span className="flex items-center gap-1.5">
          <Shield className="size-3.5 text-ink-muted" /> SUSPECT RATIO
        </span>
        <span>{playerCount} Players Active</span>
      </div>
      <div className="flex h-6 w-full rounded-base border-2 border-black overflow-hidden bg-canvas shadow-brutal-sm">
        {estimatedCivilians > 0 && (
          <div
            style={{ width: `${(estimatedCivilians / playerCount) * 100}%` }}
            className="bg-lime-base border-r-2 border-black flex items-center justify-center text-[10px] font-mono font-black text-ink"
            title={`Civilians: ${estimatedCivilians}`}
          >
            {estimatedCivilians} Civilians
          </div>
        )}
        {undercoverCount > 0 && (
          <div
            style={{ width: `${(undercoverCount / playerCount) * 100}%` }}
            className="bg-sky-base border-r-2 border-black flex items-center justify-center text-[10px] font-mono font-black text-ink"
            title={`Undercover: ${undercoverCount}`}
          >
            {undercoverCount} Undercover
          </div>
        )}
        {mrWhiteCount > 0 && (
          <div
            style={{ width: `${(mrWhiteCount / playerCount) * 100}%` }}
            className="bg-paper flex items-center justify-center text-[10px] font-mono font-black text-ink"
            title={`Mr. White: ${mrWhiteCount}`}
          >
            {mrWhiteCount} White
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-ink-muted pt-0.5">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-lime-base border border-black inline-block" /> Civilians ({estimatedCivilians})
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-sky-base border border-black inline-block" /> Undercover ({undercoverCount})
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-paper border border-dashed border-black inline-block" /> Mr. White ({mrWhiteCount})
        </span>
      </div>
    </div>
  );
}

export default function LobbySettings({
  settings,
  isHost,
  playerCount,
}: LobbySettingsProps) {
  const maxInfiltrators = Math.floor(Math.max(0, playerCount - 1) / 2);
  const totalInfiltrators = settings.undercoverCount + settings.mrWhiteCount;
  const estimatedCivilians = Math.max(0, playerCount - totalInfiltrators);

  const handleUpdate = (patch: Partial<Settings>) => {
    connection.hostUpdateSettings(patch);
  };

  if (!isHost) {
    // Read-only view for non-hosts
    return (
      <div className="w-full bg-paper border-[3px] border-black rounded-base p-4 sm:p-5 shadow-brutal space-y-3.5 text-left">
        <div className="flex items-center gap-2 border-b-2 border-black pb-2">
          <Sliders className="size-4 text-ink" />
          <span className="font-heading font-black text-xs uppercase tracking-wider text-ink">
            House Rules
          </span>
        </div>

        {/* Live Ratio Bar for Spectators/Non-Hosts */}
        <SuspectBalanceBar
          playerCount={playerCount}
          estimatedCivilians={estimatedCivilians}
          undercoverCount={settings.undercoverCount}
          mrWhiteCount={settings.mrWhiteCount}
        />

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-canvas border-2 border-black rounded-base">
            <span className="block text-[10px] font-mono font-bold text-ink-muted uppercase">Infiltrators</span>
            <span className="font-black text-ink">
              {settings.undercoverCount} Undercover, {settings.mrWhiteCount} Mr. White
            </span>
          </div>

          <div className="p-2.5 bg-canvas border-2 border-black rounded-base">
            <span className="block text-[10px] font-mono font-bold text-ink-muted uppercase">Difficulty</span>
            <span className="font-black text-ink capitalize">{settings.difficulty}</span>
          </div>

          <div className="p-2.5 bg-canvas border-2 border-black rounded-base">
            <span className="block text-[10px] font-mono font-bold text-ink-muted uppercase">Roles Reveal</span>
            <span className="font-black text-ink">
              {settings.showRoles ? "Roles Shown" : "Roles Hidden"}
            </span>
          </div>

          <div className="p-2.5 bg-canvas border-2 border-black rounded-base">
            <span className="block text-[10px] font-mono font-bold text-ink-muted uppercase">Timers</span>
            <span className="font-black text-ink font-mono">
              {Math.floor(settings.discussionSeconds / 60)}m discuss / {settings.votingSeconds}s vote
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Editable controls for Room Host
  return (
    <div className="w-full bg-paper border-[3px] border-black rounded-base p-4 sm:p-5 shadow-brutal space-y-4 text-left">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="size-5 text-ink" />
          <span className="font-heading font-black text-sm uppercase tracking-wider text-ink">
            Game Rules (Host Controls)
          </span>
        </div>
        {totalInfiltrators > maxInfiltrators && playerCount >= 4 && (
          <span className="text-[11px] font-bold text-crimson-shade font-mono">
            Max {maxInfiltrators} Infiltrators allowed
          </span>
        )}
      </div>

      {/* Suspect Ratio Breakdown Bar */}
      <SuspectBalanceBar
        playerCount={playerCount}
        estimatedCivilians={estimatedCivilians}
        undercoverCount={settings.undercoverCount}
        mrWhiteCount={settings.mrWhiteCount}
      />

      <div className="space-y-4">
        {/* Role Counts */}
        <div className="grid grid-cols-2 gap-3">
          {/* Undercover Stepper */}
          <div
            data-testid="undercover-stepper"
            className="p-3 bg-canvas border-2 border-black rounded-base space-y-2 shadow-[2px_2px_0px_#000]"
          >
            <span className="block text-[11px] font-black uppercase text-ink font-mono">
              Undercover
            </span>
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Decrease Undercover count"
                disabled={settings.undercoverCount <= 1}
                onClick={() =>
                  handleUpdate({ undercoverCount: Math.max(1, settings.undercoverCount - 1) })
                }
                className="size-10 rounded-base border-2 border-black bg-paper hover:bg-canvas-fade disabled:opacity-30 font-black text-xl flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 text-ink"
              >
                -
              </button>
              <span data-testid="undercover-count" className="font-mono text-2xl font-black text-ink">
                {settings.undercoverCount}
              </span>
              <button
                type="button"
                aria-label="Increase Undercover count"
                onClick={() =>
                  handleUpdate({ undercoverCount: settings.undercoverCount + 1 })
                }
                className="size-10 rounded-base border-2 border-black bg-paper hover:bg-canvas-fade font-black text-xl flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 text-ink"
              >
                +
              </button>
            </div>
          </div>

          {/* Mr. White Stepper */}
          <div
            data-testid="mr-white-stepper"
            className="p-3 bg-canvas border-2 border-black rounded-base space-y-2 shadow-[2px_2px_0px_#000]"
          >
            <span className="block text-[11px] font-black uppercase text-ink font-mono">
              Mr. White
            </span>
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Decrease Mr. White count"
                disabled={settings.mrWhiteCount <= 0}
                onClick={() =>
                  handleUpdate({ mrWhiteCount: Math.max(0, settings.mrWhiteCount - 1) })
                }
                className="size-10 rounded-base border-2 border-black bg-paper hover:bg-canvas-fade disabled:opacity-30 font-black text-xl flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 text-ink"
              >
                -
              </button>
              <span data-testid="mr-white-count" className="font-mono text-2xl font-black text-ink">
                {settings.mrWhiteCount}
              </span>
              <button
                type="button"
                aria-label="Increase Mr. White count"
                onClick={() =>
                  handleUpdate({ mrWhiteCount: settings.mrWhiteCount + 1 })
                }
                className="size-10 rounded-base border-2 border-black bg-paper hover:bg-canvas-fade font-black text-xl flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 text-ink"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="space-y-1.5">
          <span className="block text-xs font-black uppercase tracking-wider text-ink font-mono">
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
                  className={`py-2 text-xs font-black capitalize rounded-base border-2 border-black transition-all cursor-pointer ${
                    active
                      ? "bg-amber-base text-ink shadow-[2px_2px_0px_#000]"
                      : "bg-paper text-ink hover:bg-canvas-fade"
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
                ? "bg-sky-tint text-ink shadow-[2px_2px_0px_#000]"
                : "bg-paper text-ink hover:bg-canvas-fade shadow-[1px_1px_0px_#000]"
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
                ? "bg-lime-tint text-ink shadow-[2px_2px_0px_#000]"
                : "bg-paper text-ink hover:bg-canvas-fade shadow-[1px_1px_0px_#000]"
            }`}
          >
            <UserCheck className="size-4" />
            <span className="text-xs font-black uppercase">
              {settings.requireApproval ? "Bouncer Mode" : "Open Door"}
            </span>
          </button>
        </div>

        {/* Timers Stepper / Selector */}
        <div className="p-3 bg-canvas border-2 border-black rounded-base space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-ink font-mono">
            <Clock className="size-4" />
            <span>Interrogation Timer</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[60, 120, 180, 300].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleUpdate({ discussionSeconds: sec })}
                className={`py-1.5 text-xs font-mono font-bold rounded-tight border border-black cursor-pointer ${
                  settings.discussionSeconds === sec
                    ? "bg-amber-base text-ink font-black shadow-[1px_1px_0px_#000]"
                    : "bg-paper text-ink hover:bg-canvas-fade"
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
