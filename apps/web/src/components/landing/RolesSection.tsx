import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RulesDialog from "@/components/modals/RulesDialog";
import {
  GiSpy,
  GiHoodedFigure,
  GiGhost,
  GiSecretBook,
  GiDiscussion,
  GiVote,
  GiMagnifyingGlass,
} from "react-icons/gi";
import { Eye, EyeOff, Sparkles, RefreshCw } from "lucide-react";

const SAMPLE_PAIRS = [
  { civilian: "COFFEE", undercover: "TEA", topic: "Morning Caffeine" },
  { civilian: "SUNGLASSES", undercover: "GOGGLES", topic: "Eyewear" },
  { civilian: "INSTAGRAM", undercover: "TIKTOK", topic: "Social Feeds" },
];

export const RolesSection: React.FC = () => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [pairIndex, setPairIndex] = useState(0);
  const [revealed, setRevealed] = useState(true);

  const activePair = SAMPLE_PAIRS[pairIndex];

  const handleNextPair = () => {
    setPairIndex((prev) => (prev + 1) % SAMPLE_PAIRS.length);
  };

  return (
    <div className="w-full space-y-16">
      {/* 1. Roles Grid */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <Badge variant="primary" className="shadow-brutal-sm px-3 py-0.5 text-[11px] bg-amber-base text-ink">
            THE USUAL SUSPECTS
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-ink font-heading uppercase">
            Three roles. Infinite paranoia.
          </h2>
          <p className="text-sm font-medium text-ink-muted">
            Privately dealt at round start. Assume everyone is looking at you weird.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Civilian (Lime) */}
          <Card className="bg-lime-fade border-[3px] border-black shadow-brutal flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-brutal-lg">
            <CardHeader className="border-b-2 border-black/15 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="size-12 rounded-base border-2 border-black bg-lime-base flex items-center justify-center shadow-brutal-sm">
                  <GiSpy className="size-7 text-ink" />
                </div>
                <Badge variant="lime" className="font-black bg-lime-base text-ink border-black">
                  The Majority
                </Badge>
              </div>
              <CardTitle className="text-2xl font-black text-ink font-heading">Civilian</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm font-medium text-ink leading-relaxed">
                You share the secret word with the majority. Give clues subtle enough to prove you belong, without handing the answer to Mr. White on a silver platter.
              </p>
              <div className="rounded-base border-2 border-black bg-paper p-3 text-xs font-bold text-ink border-l-4 border-l-lime-shade shadow-brutal-sm">
                Victory: Vote out every impostor before your numbers dwindle.
              </div>
            </CardContent>
          </Card>

          {/* Undercover (Sky) */}
          <Card className="bg-sky-fade border-[3px] border-black shadow-brutal flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-brutal-lg">
            <CardHeader className="border-b-2 border-black/15 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="size-12 rounded-base border-2 border-black bg-sky-base flex items-center justify-center shadow-brutal-sm">
                  <GiHoodedFigure className="size-7 text-ink" />
                </div>
                <Badge variant="secondary" className="font-black bg-sky-base text-ink border-black">
                  The Impostor
                </Badge>
              </div>
              <CardTitle className="text-2xl font-black text-ink font-heading">Undercover</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm font-medium text-ink leading-relaxed">
                Your word is slightly off from everyone else's. Sweat quietly, echo what you hear, and aggressively accuse someone innocent.
              </p>
              <div className="rounded-base border-2 border-black bg-paper p-3 text-xs font-bold text-ink border-l-4 border-l-sky-shade shadow-brutal-sm">
                Victory: Survive until the civilians panic and do your job for you.
              </div>
            </CardContent>
          </Card>

          {/* Mr. White (Crisp Paper with Dashed Border) */}
          <Card className="bg-paper border-[3px] border-dashed border-black shadow-brutal flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-brutal-lg">
            <CardHeader className="border-b-2 border-dashed border-black/30 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="size-12 rounded-base border-2 border-dashed border-black bg-canvas-fade flex items-center justify-center shadow-none">
                  <GiGhost className="size-7 text-ink" />
                </div>
                <Badge variant="outline" className="font-black border-dashed border-black bg-canvas-fade text-ink">
                  Zero Intel
                </Badge>
              </div>
              <CardTitle className="text-2xl font-black text-ink font-heading">Mr. White</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm font-medium text-ink leading-relaxed">
                You got no word. Zero. Nod along, drop the vaguest clue humanly possible, and if caught, guess their word to steal the win.
              </p>
              <div className="rounded-base border-2 border-dashed border-black bg-canvas-fade p-3 text-xs font-bold text-ink shadow-none">
                Victory: Stay alive, or steal the match with a lucky guess on your way out.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Interactive Word-Pair Evidence Preview (NEW THEMATIC UI ELEMENT) */}
      <div className="rounded-base border-[3px] border-black bg-paper p-6 sm:p-8 shadow-brutal space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="size-4 text-amber-shade" />
              <span className="text-[11px] font-mono font-black uppercase tracking-widest text-ink-muted">
                EXHIBIT A • SECRET INTEL PEEK
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-ink font-heading">
              What Each Player Actually Sees
            </h3>
            <p className="text-xs sm:text-sm font-medium text-ink-muted">
              Category: <span className="font-bold text-ink">{activePair.topic}</span>. Watch how subtle the discrepancy is.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRevealed(!revealed)}
              className="bg-paper hover:bg-canvas-fade border-2 border-black shadow-brutal-sm font-bold text-xs"
            >
              {revealed ? <EyeOff className="size-3.5 mr-1.5" /> : <Eye className="size-3.5 mr-1.5" />}
              <span>{revealed ? "Hide Words" : "Reveal Words"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNextPair}
              className="bg-amber-tint hover:bg-amber-base border-2 border-black shadow-brutal-sm font-bold text-xs text-ink"
              title="Next sample word pair"
            >
              <RefreshCw className="size-3.5 mr-1.5" /> Next Example
            </Button>
          </div>
        </div>

        {/* 3 Simulative Screens */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {/* Civilian Screen */}
          <div className="p-4 rounded-base border-2 border-black bg-lime-fade shadow-brutal-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-black uppercase text-ink-muted">CIVILIAN SCREEN</span>
                <Badge variant="lime" className="text-[9px] bg-lime-base">Majority (3+)</Badge>
              </div>
              <div className="py-3 px-2 rounded-base border-2 border-black bg-paper shadow-brutal-sm font-mono font-black text-xl text-ink">
                {revealed ? activePair.civilian : "••••••••"}
              </div>
            </div>
            <p className="text-[11px] font-medium text-ink-muted">
              Gives clues to confirm fellow civilians without spilling it to Mr. White.
            </p>
          </div>

          {/* Undercover Screen */}
          <div className="p-4 rounded-base border-2 border-black bg-sky-fade shadow-brutal-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-black uppercase text-ink-muted">UNDERCOVER SCREEN</span>
                <Badge variant="secondary" className="text-[9px] bg-sky-base">Cousin Word</Badge>
              </div>
              <div className="py-3 px-2 rounded-base border-2 border-black bg-paper shadow-brutal-sm font-mono font-black text-xl text-ink">
                {revealed ? activePair.undercover : "••••••••"}
              </div>
            </div>
            <p className="text-[11px] font-medium text-ink-muted">
              Thinks they are normal until someone gives a clue that makes no sense.
            </p>
          </div>

          {/* Mr. White Screen */}
          <div className="p-4 rounded-base border-2 border-dashed border-black bg-canvas-fade shadow-none flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-black uppercase text-ink-muted">MR. WHITE SCREEN</span>
                <Badge variant="outline" className="text-[9px] border-dashed bg-paper">Blank</Badge>
              </div>
              <div className="py-3 px-2 rounded-base border-2 border-dashed border-black bg-paper text-ink font-mono font-bold text-sm flex items-center justify-center min-h-[52px]">
                {revealed ? "[ NO WORD • WING IT ]" : "••••••••"}
              </div>
            </div>
            <p className="text-[11px] font-medium text-ink-muted">
              Zero clues. Pure theater. Can steal the game at the end by guessing the civilian word.
            </p>
          </div>
        </div>
      </div>

      {/* 3. How a Round Works Bento */}
      <div className="rounded-base border-[3px] border-black bg-paper p-6 sm:p-8 shadow-brutal">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b-2 border-black pb-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight uppercase text-ink font-heading">
              Anatomy of a Betrayal
            </h3>
            <p className="text-xs sm:text-sm font-medium text-ink-muted">
              Four quick steps. 5-10 minutes per round. Weeks of trust issues.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRulesOpen(true)}
            className="border-2 border-black shadow-brutal-sm hover:bg-amber-tint font-bold text-xs"
          >
            <GiSecretBook className="mr-1.5 size-4" /> Official Rulebook
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-base border-2 border-black bg-canvas shadow-brutal-sm flex flex-col justify-between">
            <div>
              <div className="size-8 rounded-base border-2 border-black bg-lime-base flex items-center justify-center font-black text-sm mb-3 shadow-brutal-sm">
                1
              </div>
              <h4 className="font-black text-base text-ink mb-1 flex items-center gap-1.5 font-heading">
                <GiSecretBook className="size-4" /> Private Intel
              </h4>
              <p className="text-xs font-medium text-ink-muted">
                Check your screen privately. Try not to make the 'oh no' face immediately.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-base border-2 border-black bg-canvas shadow-brutal-sm flex flex-col justify-between">
            <div>
              <div className="size-8 rounded-base border-2 border-black bg-amber-base flex items-center justify-center font-black text-sm mb-3 shadow-brutal-sm">
                2
              </div>
              <h4 className="font-black text-base text-ink mb-1 flex items-center gap-1.5 font-heading">
                <GiDiscussion className="size-4" /> Drop a Clue
              </h4>
              <p className="text-xs font-medium text-ink-muted">
                Say one word or short phrase. Too vague and you look guilty; too specific and Mr. White thanks you.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-base border-2 border-black bg-canvas shadow-brutal-sm flex flex-col justify-between">
            <div>
              <div className="size-8 rounded-base border-2 border-black bg-sky-base flex items-center justify-center font-black text-sm mb-3 shadow-brutal-sm">
                3
              </div>
              <h4 className="font-black text-base text-ink mb-1 flex items-center gap-1.5 font-heading">
                <GiMagnifyingGlass className="size-4" /> Interrogation
              </h4>
              <p className="text-xs font-medium text-ink-muted">
                Analyze who paused too long, who blinked weirdly, and who is defending the wrong person.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-base border-2 border-black bg-canvas shadow-brutal-sm flex flex-col justify-between">
            <div>
              <div className="size-8 rounded-base border-2 border-black bg-rose-base flex items-center justify-center font-black text-sm mb-3 shadow-brutal-sm">
                4
              </div>
              <h4 className="font-black text-base text-ink mb-1 flex items-center gap-1.5 font-heading">
                <GiVote className="size-4" /> Cast Out
              </h4>
              <p className="text-xs font-medium text-ink-muted">
                Point fingers simultaneously. The player with the most votes gets eliminated. No refunds.
              </p>
            </div>
          </div>
        </div>
      </div>

      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  );
};

export default RolesSection;
