import { useState } from "react";
import type { AvatarConfig } from "@game/types";
import { ALLOWED_AVATAR_STYLES, getAvatarDataUri, generateRandomSeed } from "@/lib/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Dices, Check } from "lucide-react";

interface AvatarPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar: AvatarConfig;
  onSave: (avatar: AvatarConfig) => void;
}

export default function AvatarPickerModal({
  open,
  onOpenChange,
  currentAvatar,
  onSave,
}: AvatarPickerModalProps) {
  const [style, setStyle] = useState(currentAvatar.style || "bottts");
  const [seed, setSeed] = useState(currentAvatar.seed || "agent");

  const previewUri = getAvatarDataUri({ style, seed, options: currentAvatar.options });

  const handleRandomize = () => {
    setSeed(generateRandomSeed());
  };

  const handleSave = () => {
    onSave({
      style,
      seed,
      options: currentAvatar.options,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-[3px] border-black shadow-[6px_6px_0px_#000] p-6">
        <DialogHeader className="border-b-2 border-black pb-3">
          <DialogTitle className="font-heading font-black text-xl text-black">
            Choose Your Avatar
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-gray-700">
            Select a style and roll the dice to customize your disguise.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Avatar Preview */}
          <div className="relative group">
            <div className="size-28 rounded-full border-[3px] border-black bg-[#fdfbf7] p-2 shadow-[4px_4px_0px_#000] flex items-center justify-center overflow-hidden">
              <img
                src={previewUri}
                alt="Avatar preview"
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            </div>
            <button
              type="button"
              onClick={handleRandomize}
              className="absolute -bottom-2 -right-2 p-2 rounded-full border-2 border-black bg-yellow-300 hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#000] cursor-pointer transition-all"
              title="Randomize avatar"
              aria-label="Randomize avatar"
            >
              <Dices className="size-5 text-black" />
            </button>
          </div>

          {/* Style Selector Tabs */}
          <div className="w-full space-y-2">
            <span className="block text-xs font-black uppercase tracking-wider text-black">
              Disguise Style
            </span>
            <div className="grid grid-cols-3 gap-2">
              {ALLOWED_AVATAR_STYLES.map((s) => {
                const isSelected = style === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`py-2 px-3 text-xs font-black uppercase tracking-wider rounded-base border-2 border-black transition-all cursor-pointer ${
                      isSelected
                        ? "bg-yellow-300 shadow-[3px_3px_0px_#000] translate-x-[-1px] translate-y-[-1px]"
                        : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#000]"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={handleSave}
            className="w-full font-black bg-yellow-400 hover:bg-yellow-300 text-black border-[3px] border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <Check className="mr-2 size-5" /> Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
