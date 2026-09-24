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
        <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-black">
          <div className="flex items-center gap-1.5">
            <label htmlFor="player-name-input">Your Nickname</label>
            <button
              type="button"
              onClick={handleRandomizeName}
              className="p-1 rounded-tight border-2 border-black bg-yellow-300 hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 shadow-[1px_1px_0px_#000] cursor-pointer transition-all flex items-center justify-center"
              title="Generate random nickname"
              aria-label="Generate random nickname"
            >
              <Dices className="size-3.5 text-black" />
            </button>
          </div>
          <span className="font-mono font-bold text-gray-600">
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
            placeholder="Enter nickname"
            className="font-bold text-base h-12 pr-11 bg-white border-2 border-black rounded-base shadow-[2px_2px_0px_#000] focus-visible:ring-2 focus-visible:ring-black"
          />
          <button
            type="button"
            onClick={handleRandomizeName}
            className="absolute right-2 p-1.5 rounded-base border-2 border-black bg-yellow-300 hover:bg-yellow-400 active:translate-x-0.5 active:translate-y-0.5 shadow-[1px_1px_0px_#000] cursor-pointer transition-all"
            title="Generate random nickname"
            aria-label="Generate random nickname"
          >
            <Dices className="size-4 text-black" />
          </button>
        </div>
        <p className="text-[11px] font-medium text-gray-500">
          This is how other players will identify you.
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
