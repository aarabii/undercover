import { useState } from "react";
import type { AvatarConfig } from "@game/types";
import { useGameStore } from "@/stores/gameStore";
import AvatarTile from "@/components/common/AvatarTile";
import AvatarPickerModal from "@/components/modals/AvatarPickerModal";
import { Input } from "@/components/ui/input";
import { Dices } from "lucide-react";
import { getRandomNickname } from "@/lib/nickname";

interface ProfileEditorProps {
  name: string;
  onNameChange: (name: string) => void;
  avatar?: AvatarConfig;
  onAvatarChange?: (avatar: AvatarConfig) => void;
  className?: string;
}

export default function ProfileEditor({
  name,
  onNameChange,
  avatar,
  onAvatarChange,
  className = "",
}: ProfileEditorProps) {
  const { profile, setProfile } = useGameStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeAvatar = avatar || profile.avatar;

  const handleRandomizeName = () => {
    const randomName = getRandomNickname();
    onNameChange(randomName);
  };

  const handleSaveAvatar = (newAvatar: AvatarConfig) => {
    if (onAvatarChange) {
      onAvatarChange(newAvatar);
    } else {
      setProfile({ ...profile, avatar: newAvatar });
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Avatar with Interactive Affordance & Edit Badge */}
      <div className="relative cursor-pointer" onClick={() => setPickerOpen(true)}>
        <AvatarTile
          avatar={activeAvatar}
          name={name.trim() || profile.name || "Agent"}
          isMe
          canEdit
          onEdit={() => setPickerOpen(true)}
          onClick={() => setPickerOpen(true)}
          size="lg"
        />
      </div>

      {/* Name Input with 16-char Limit & Integrated Dice Button */}
      <div className="w-full space-y-1.5 text-left">
        <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-ink font-mono">
          <label htmlFor="player-name-input">Codename</label>
          <span className="font-mono font-bold text-ink-muted">
            {name.length}/16
          </span>
        </div>
        <div className="relative flex items-center">
          <Input
            id="player-name-input"
            type="text"
            value={name}
            maxLength={16}
            onChange={(e) => {
              const nextName = e.target.value.slice(0, 16);
              onNameChange(nextName);
            }}
            placeholder="Enter a codename"
            className="font-bold text-base h-12 pr-12 bg-paper text-ink"
          />
          <button
            type="button"
            onClick={handleRandomizeName}
            className="absolute right-2 p-1.5 rounded-base border-2 border-black bg-amber-base hover:bg-amber-tint active:translate-x-0.5 active:translate-y-0.5 shadow-[1px_1px_0px_#000] cursor-pointer transition-all text-ink"
            title="Roll a random codename"
            aria-label="Roll a random codename"
          >
            <Dices className="size-4 text-ink" />
          </button>
        </div>
        <p className="text-[11px] font-medium text-ink-muted">
          The name people will shout when they accuse you of treason.
        </p>
      </div>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        currentAvatar={activeAvatar}
        onSave={handleSaveAvatar}
      />
    </div>
  );
}
