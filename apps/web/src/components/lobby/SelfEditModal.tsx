import { useState, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { connection } from "@/lib/connection";
import ProfileEditor from "@/components/modals/ProfileEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface SelfEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SelfEditModal({
  open,
  onOpenChange,
}: SelfEditModalProps) {
  const { profile, setProfile } = useGameStore();
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);

  // Re-sync with store when modal is opened
  useEffect(() => {
    if (open) {
      setName(profile.name);
      setAvatar(profile.avatar);
    }
  }, [open, profile]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = { ...profile, name: trimmed, avatar };
    setProfile(updated);
    connection.updateProfile({ name: trimmed, avatar });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-paper border-[3px] border-black shadow-[6px_6px_0px_#000] p-6 text-center">
        <DialogHeader className="border-b-2 border-black pb-3">
          <DialogTitle className="font-heading font-black text-xl text-ink">
            Change Your Disguise
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-ink-muted">
            Switch your alias or face before anyone gets suspicious.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ProfileEditor
            name={name}
            onNameChange={setName}
            avatar={avatar}
            onAvatarChange={setAvatar}
          />
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full flex items-center justify-center gap-2"
          >
            <Check className="size-5" />
            <span>Apply Changes</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
