import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import AvatarTile from "@/components/common/AvatarTile";
import AvatarPickerModal from "@/components/modals/AvatarPickerModal";
import { Input } from "@/components/ui/input";

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

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Avatar with Edit Pencil */}
      <div className="relative">
        <AvatarTile
          avatar={profile.avatar}
          name={name.trim() || "Agent"}
          canEdit
          onEdit={() => setPickerOpen(true)}
          size="lg"
        />
      </div>

      {/* Name Input with 16-char Limit & Live Counter */}
      <div className="w-full space-y-1.5 text-left">
        <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-black">
          <label htmlFor="player-name-input">Your Nickname</label>
          <span className="font-mono font-bold text-gray-600">
            {name.length}/16
          </span>
        </div>
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
          className="font-bold text-base h-12 bg-white border-2 border-black rounded-base shadow-[2px_2px_0px_#000] focus-visible:ring-2 focus-visible:ring-black"
        />
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
