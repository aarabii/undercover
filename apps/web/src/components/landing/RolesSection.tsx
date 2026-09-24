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

export const RolesSection: React.FC = () => {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className="w-full space-y-12">
      {/* Roles Grid */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <Badge variant="primary" className="shadow-brutal-sm px-3 py-0.5 text-[11px]">
            THE USUAL SUSPECTS
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-black uppercase">
            Three roles. Infinite paranoia.
          </h2>
          <p className="text-sm font-medium text-gray-700">
            Privately dealt at round start. Assume everyone is looking at you weird.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Civilian */}
          <Card className="bg-white border-[3px] border-black shadow-brutal flex flex-col justify-between transition-transform hover:translate-y-[-2px]">
            <CardHeader className="border-b-2 border-black/10 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="size-12 rounded-base border-2 border-black bg-sky-200 flex items-center justify-center shadow-brutal-sm">
                  <GiSpy className="size-7 text-black" />
                </div>
                <Badge variant="secondary" className="font-black">The Clueless Majority</Badge>
              </div>
              <CardTitle className="text-2xl font-black text-black">Civilian</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                You share the secret word with the majority. Give clues subtle enough to prove you belong, without handing the answer to Mr. White on a silver platter.
              </p>
              <div className="rounded-base border border-black/20 bg-sky-50 p-2.5 text-xs font-bold text-sky-900">
                Victory: Vote out every impostor before your numbers dwindle.
              </div>
            </CardContent>
          </Card>

          {/* Undercover */}
          <Card className="bg-[#fef08a] border-[3px] border-black shadow-brutal flex flex-col justify-between transition-transform hover:translate-y-[-2px]">
            <CardHeader className="border-b-2 border-black/10 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="size-12 rounded-base border-2 border-black bg-yellow-300 flex items-center justify-center shadow-brutal-sm">
                  <GiHoodedFigure className="size-7 text-black" />
                </div>
                <Badge variant="primary" className="font-black">The Gaslighter</Badge>
              </div>
              <CardTitle className="text-2xl font-black text-black">Undercover</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                Your word is slightly off from everyone else's. Sweat quietly, echo what you hear, and aggressively accuse someone innocent.
              </p>
              <div className="rounded-base border border-black/20 bg-yellow-100 p-2.5 text-xs font-bold text-yellow-900">
                Victory: Survive until the civilians panic and do your job for you.
              </div>
            </CardContent>
          </Card>

          {/* Mr. White */}
          <Card className="bg-[#fbcfe8] border-[3px] border-black shadow-brutal flex flex-col justify-between transition-transform hover:translate-y-[-2px]">
            <CardHeader className="border-b-2 border-black/10 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="size-12 rounded-base border-2 border-black bg-pink-300 flex items-center justify-center shadow-brutal-sm">
                  <GiGhost className="size-7 text-black" />
                </div>
                <Badge variant="destructive" className="font-black">Completely Winging It</Badge>
              </div>
              <CardTitle className="text-2xl font-black text-black">Mr. White</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                You got no word. Zero. Nod along, drop the vaguest clue humanly possible, and if caught, guess their word to steal the win.
              </p>
              <div className="rounded-base border border-black/20 bg-pink-100 p-2.5 text-xs font-bold text-pink-900">
                Victory: Stay alive, or steal the match with a lucky guess on your way out.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How a Round Works Bento */}
      <div className="rounded-base border-[3px] border-black bg-white p-6 sm:p-8 shadow-brutal">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b-2 border-black pb-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight uppercase text-black">
              Anatomy of a Betrayal
            </h3>
            <p className="text-xs sm:text-sm font-medium text-gray-700">
              Four quick steps. 5-10 minutes per round. Weeks of trust issues.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRulesOpen(true)}
            className="border-2 border-black shadow-brutal-sm hover:bg-yellow-200 font-bold text-xs"
          >
            <GiSecretBook className="mr-1.5 size-4" /> Official Rulebook
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-base border-2 border-black bg-[#fdfbf7] shadow-brutal-sm">
            <div className="size-8 rounded-base border-2 border-black bg-lime-300 flex items-center justify-center font-black text-sm mb-3">
              1
            </div>
            <h4 className="font-black text-base text-black mb-1 flex items-center gap-1.5">
              <GiSecretBook className="size-4" /> Private Intel
            </h4>
            <p className="text-xs font-medium text-gray-700">
              Check your screen privately. Try not to make the 'oh no' face immediately.
            </p>
          </div>

          <div className="p-4 rounded-base border-2 border-black bg-[#fdfbf7] shadow-brutal-sm">
            <div className="size-8 rounded-base border-2 border-black bg-yellow-300 flex items-center justify-center font-black text-sm mb-3">
              2
            </div>
            <h4 className="font-black text-base text-black mb-1 flex items-center gap-1.5">
              <GiDiscussion className="size-4" /> Drop a Clue
            </h4>
            <p className="text-xs font-medium text-gray-700">
              Say one word or short phrase. Too vague and you look guilty; too specific and Mr. White thanks you.
            </p>
          </div>

          <div className="p-4 rounded-base border-2 border-black bg-[#fdfbf7] shadow-brutal-sm">
            <div className="size-8 rounded-base border-2 border-black bg-sky-300 flex items-center justify-center font-black text-sm mb-3">
              3
            </div>
            <h4 className="font-black text-base text-black mb-1 flex items-center gap-1.5">
              <GiMagnifyingGlass className="size-4" /> Interrogation
            </h4>
            <p className="text-xs font-medium text-gray-700">
              Analyze who paused too long, who blinked weirdly, and who is defending the wrong person.
            </p>
          </div>

          <div className="p-4 rounded-base border-2 border-black bg-[#fdfbf7] shadow-brutal-sm">
            <div className="size-8 rounded-base border-2 border-black bg-pink-300 flex items-center justify-center font-black text-sm mb-3">
              4
            </div>
            <h4 className="font-black text-base text-black mb-1 flex items-center gap-1.5">
              <GiVote className="size-4" /> Cast Out
            </h4>
            <p className="text-xs font-medium text-gray-700">
              Point fingers simultaneously. The player with the most votes gets eliminated. No refunds.
            </p>
          </div>
        </div>
      </div>

      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  );
};

export default RolesSection;
