import { useState, useEffect } from "react";

interface GameCountdownProps {
  endsAt: number | null;
  serverNow: number;
  paused: { remainingMs: number } | null;
}

export default function GameCountdown({
  endsAt,
  serverNow,
  paused,
}: GameCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (paused) {
      setTimeLeft(Math.max(0, Math.ceil(paused.remainingMs / 1000)));
      return;
    }

    if (!endsAt) {
      setTimeLeft(0);
      return;
    }

    const clockOffset = serverNow - Date.now();

    const update = () => {
      const currentServerTime = Date.now() + clockOffset;
      const remainingMs = Math.max(0, endsAt - currentServerTime);
      setTimeLeft(Math.ceil(remainingMs / 1000));
    };

    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [endsAt, serverNow, paused]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const isCritical = timeLeft <= 10 && !paused && timeLeft > 0;

  return (
    <div className="relative inline-flex flex-col items-center">
      {paused && (
        <span className="absolute -top-3.5 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-red-500 text-white border-2 border-black rounded-tight shadow-[1px_1px_0px_#000] animate-pulse z-10">
          PAUSED
        </span>
      )}

      <div
        className={`font-mono text-4xl sm:text-5xl font-black tabular-nums tracking-tight px-5 py-2 rounded-base border-[3px] border-black bg-white shadow-[4px_4px_0px_#000] select-none transition-colors ${
          paused
            ? "text-gray-400 bg-gray-100"
            : isCritical
            ? "text-[#FF4B3E] animate-pulse"
            : "text-black"
        }`}
      >
        {formatted}
      </div>
    </div>
  );
}
