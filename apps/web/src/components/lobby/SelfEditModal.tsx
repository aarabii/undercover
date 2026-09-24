import { useState } from "react";
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

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setProfile({ ...profile, name: trimmed });
    connection.updateProfile({ name: trimmed, avatar: profile.avatar });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-[3px] border-black shadow-[6px_6px_0px_#000] p-6 text-center">
        <DialogHeader className="border-b-2 border-black pb-3">
          <DialogTitle className="font-heading font-black text-xl text-black">
            Change Your Disguise
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-gray-700">
            Switch your alias or face before anyone gets suspicious.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ProfileEditor name={name} onNameChange={setName} />
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full font-black bg-yellow-400 hover:bg-yellow-300 text-black border-[3px] border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <Check className="mr-2 size-5" /> Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
