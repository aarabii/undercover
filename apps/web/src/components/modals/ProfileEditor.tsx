import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import AvatarTile from "@/components/common/AvatarTile";
import AvatarPickerModal from "@/components/modals/AvatarPickerModal";
import { Input } from "@/components/ui/input";
import { Dices } from "lucide-react";
import { getRandomNickname } from "@/lib/nickname";

interface ProfileEditorProps {
  name: string;
  onNameChange: (name: string) => void;
  className?: string;
}

export default function ProfileEditor({
  name,
  onNameChange,
  className = "",
}: ProfileEditorProps) {
  const { profile, setProfile } = useGameStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleRandomizeName = () => {
    const randomName = getRandomNickname();
    onNameChange(randomName);
    setProfile({ ...profile, name: randomName });
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Avatar with Edit Pencil */}
      <div className="relative">
        <AvatarTile
          avatar={profile.avatar}
          name={name.trim() || profile.name || "Agent"}
          isMe
          canEdit
          onEdit={() => setPickerOpen(true)}
          size="lg"
        />
      </div>

      {/* Name Input with 16-char Limit & Live Counter */}
      <div className="w-full space-y-1.5 text-left">
        <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-ink font-mono">
          <div className="flex items-center gap-1.5">
            <label htmlFor="player-name-input">Codename</label>
            <button
              type="button"
              onClick={handleRandomizeName}
              className="p-1 rounded-tight border-2 border-black bg-amber-base hover:bg-amber-tint active:translate-x-0.5 active:translate-y-0.5 shadow-[1px_1px_0px_#000] cursor-pointer transition-all flex items-center justify-center text-ink"
              title="Roll for an alias"
              aria-label="Roll for an alias"
            >
              <Dices className="size-3.5 text-ink" />
            </button>
          </div>
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
              setProfile({ ...profile, name: nextName });
            }}
            placeholder="Enter a codename"
            className="font-bold text-base h-12 pr-11 bg-paper border-2 border-black rounded-base shadow-[2px_2px_0px_#000] focus-visible:ring-2 focus-visible:ring-black text-ink"
          />
          <button
            type="button"
            onClick={handleRandomizeName}
            className="absolute right-2 p-1.5 rounded-base border-2 border-black bg-amber-base hover:bg-amber-tint active:translate-x-0.5 active:translate-y-0.5 shadow-[1px_1px_0px_#000] cursor-pointer transition-all text-ink"
            title="Roll for an alias"
            aria-label="Roll for an alias"
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
        currentAvatar={profile.avatar}
        onSave={(newAvatar) => {
          setProfile({ ...profile, avatar: newAvatar });
        }}
      />
    </div>
  );
}
