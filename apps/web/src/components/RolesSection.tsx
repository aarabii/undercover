import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RulesDialog from "./RulesDialog";
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
            THE IDENTITIES
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-black uppercase">
            3 Secret Roles. 1 Winner.
          </h2>
          <p className="text-sm font-medium text-gray-700">
            Assigned secretly at the start of each round. Nobody knows who is who.
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
                <Badge variant="secondary" className="font-black">Majority Team</Badge>
              </div>
              <CardTitle className="text-2xl font-black text-black">Civilian</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                You share the same secret word with the civilian majority. Give clever clues to help allies spot you, without handing the word to Mr. White!
              </p>
              <div className="rounded-base border border-black/20 bg-sky-50 p-2.5 text-xs font-bold text-sky-900">
                ⭐ Victory: Unmask and eliminate all Undercovers & Mr. White.
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
                <Badge variant="primary" className="font-black">The Infiltrator</Badge>
              </div>
              <CardTitle className="text-2xl font-black text-black">Undercover</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                You receive a word subtly different from the Civilians. Listen intently, blend in, and trick the group into voting out innocent civilians.
              </p>
              <div className="rounded-base border border-black/20 bg-yellow-100 p-2.5 text-xs font-bold text-yellow-900">
                ⭐ Victory: Survive until only 1 civilian is left alive.
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
                <Badge variant="destructive" className="font-black">The Wildcard</Badge>
              </div>
              <CardTitle className="text-2xl font-black text-black">Mr. White</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                You get no word at all! You must deduce the topic on the fly, bluff like a master, and if caught, guess the civilian word for an instant steal!
              </p>
              <div className="rounded-base border border-black/20 bg-pink-100 p-2.5 text-xs font-bold text-pink-900">
                ⭐ Victory: Survive, or correctly guess the civilian word!
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
              How A Round Plays Out
            </h3>
            <p className="text-xs sm:text-sm font-medium text-gray-700">
              Simple 4-phase loop. Fast games lasting 5-10 minutes.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRulesOpen(true)}
            className="border-2 border-black shadow-brutal-sm hover:bg-yellow-200 font-bold text-xs"
          >
            <GiSecretBook className="mr-1.5 size-4" /> Full Rulebook
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-base border-2 border-black bg-[#fdfbf7] shadow-brutal-sm">
            <div className="size-8 rounded-base border-2 border-black bg-lime-300 flex items-center justify-center font-black text-sm mb-3">
              1
            </div>
            <h4 className="font-black text-base text-black mb-1 flex items-center gap-1.5">
              <GiSecretBook className="size-4" /> Secret Word
            </h4>
            <p className="text-xs font-medium text-gray-700">
              Each player sees their private role card on their device. Keep it secret!
            </p>
          </div>

          <div className="p-4 rounded-base border-2 border-black bg-[#fdfbf7] shadow-brutal-sm">
            <div className="size-8 rounded-base border-2 border-black bg-yellow-300 flex items-center justify-center font-black text-sm mb-3">
              2
            </div>
            <h4 className="font-black text-base text-black mb-1 flex items-center gap-1.5">
              <GiDiscussion className="size-4" /> Clue Phase
            </h4>
            <p className="text-xs font-medium text-gray-700">
              In turn, each player speaks one word or phrase. Be subtle but not too cryptic.
            </p>
          </div>

          <div className="p-4 rounded-base border-2 border-black bg-[#fdfbf7] shadow-brutal-sm">
            <div className="size-8 rounded-base border-2 border-black bg-sky-300 flex items-center justify-center font-black text-sm mb-3">
              3
            </div>
            <h4 className="font-black text-base text-black mb-1 flex items-center gap-1.5">
              <GiMagnifyingGlass className="size-4" /> Debate
            </h4>
            <p className="text-xs font-medium text-gray-700">
              Cross-examine who hesitated or whose clue sounded slightly off.
            </p>
          </div>

          <div className="p-4 rounded-base border-2 border-black bg-[#fdfbf7] shadow-brutal-sm">
            <div className="size-8 rounded-base border-2 border-black bg-pink-300 flex items-center justify-center font-black text-sm mb-3">
              4
            </div>
            <h4 className="font-black text-base text-black mb-1 flex items-center gap-1.5">
              <GiVote className="size-4" /> The Vote
            </h4>
            <p className="text-xs font-medium text-gray-700">
              Vote simultaneously. The top suspect is eliminated and reveals their identity.
            </p>
          </div>
        </div>
      </div>

      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  );
};

export default RolesSection;
