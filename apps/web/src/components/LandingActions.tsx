import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import RulesDialog from "./RulesDialog";
import {
  GiPadlock,
  GiEntryDoor,
  GiSecretBook,
  GiSpy,
  GiCheckMark,
} from "react-icons/gi";

export const LandingActions: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const playerName = name.trim() || "Agent";
    window.location.href = `/play?action=create&name=${encodeURIComponent(playerName)}`;
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim().toUpperCase();
    if (cleanCode.length !== 6) return;
    const playerName = name.trim() || "Agent";
    window.location.href = `/play?action=join&code=${encodeURIComponent(cleanCode)}&name=${encodeURIComponent(playerName)}`;
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* 2 Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <Button
          type="button"
          size="lg"
          variant="default"
          onClick={() => setCreateOpen(true)}
          className="w-full text-base sm:text-lg font-black tracking-wide h-14 bg-lime-400 hover:bg-lime-300 text-black border-[3px] border-black shadow-brutal flex items-center justify-center gap-2.5"
        >
          <GiPadlock className="size-6 shrink-0" />
          <span>Create Room</span>
        </Button>

        <Button
          type="button"
          size="lg"
          variant="secondary"
          onClick={() => setJoinOpen(true)}
          className="w-full text-base sm:text-lg font-black tracking-wide h-14 bg-sky-300 hover:bg-sky-200 text-black border-[3px] border-black shadow-brutal flex items-center justify-center gap-2.5"
        >
          <GiEntryDoor className="size-6 shrink-0" />
          <span>Join a Room</span>
        </Button>
      </div>

      {/* Rules trigger button */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => setRulesOpen(true)}
          className="bg-white hover:bg-yellow-200 font-bold border-2 border-black shadow-brutal-sm flex items-center gap-2 text-sm"
        >
          <GiSecretBook className="size-4 text-black" />
          <span>How to Play & Rules</span>
        </Button>
      </div>

      {/* Rules Dialog */}
      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />

      {/* Create Room Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <DialogHeader className="border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-base border-2 border-black bg-lime-300 flex items-center justify-center">
                  <GiPadlock className="size-5 text-black" />
                </div>
                <DialogTitle>Create a New Room</DialogTitle>
              </div>
              <DialogDescription>
                Host a game session for your friends. No login required.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Your Nickname
              </label>
              <Input
                type="text"
                autoFocus
                placeholder="e.g. 007, Bond, Fox"
                maxLength={16}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-bold text-base"
              />
              <p className="text-[11px] font-medium text-gray-600">
                You will be the room host and can configure player counts.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full font-black bg-lime-400 hover:bg-lime-300 text-black border-[3px] border-black shadow-brutal"
              >
                <GiCheckMark className="mr-2 size-4" /> Start Room
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join Room Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <DialogHeader className="border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-base border-2 border-black bg-sky-300 flex items-center justify-center">
                  <GiEntryDoor className="size-5 text-black" />
                </div>
                <DialogTitle>Join Existing Room</DialogTitle>
              </div>
              <DialogDescription>
                Enter the 6-character room code shared by your host.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-black">
                  Room Code
                </label>
                <Input
                  type="text"
                  autoFocus
                  placeholder="e.g. ABCXYZ"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="font-mono text-center tracking-widest text-2xl uppercase font-black h-12 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-black">
                  Your Nickname
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Mystery, Sleuth"
                  maxLength={16}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="font-bold text-base"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                disabled={roomCode.trim().length !== 6}
                className="w-full font-black bg-sky-300 hover:bg-sky-200 text-black border-[3px] border-black shadow-brutal disabled:opacity-50"
              >
                <GiSpy className="mr-2 size-5" /> Enter Room
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingActions;
