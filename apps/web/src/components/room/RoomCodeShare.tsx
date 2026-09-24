import { useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface RoomCodeShareProps {
  code: string;
}

export default function RoomCodeShare({ code }: RoomCodeShareProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const getInviteUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/r/${code}`;
    }
    return `https://undercover.aarab.me/r/${code}`;
  };

  const inviteUrl = getInviteUrl();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Join my Undercover game: ${code}`,
          text: `Join my Undercover game with room code ${code}!`,
          url: inviteUrl,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    }
    await handleCopy();
  };

  return (
    <div className="w-full bg-[#fdfbf7] border-[3px] border-black rounded-base p-4 shadow-[4px_4px_0px_#000] text-center space-y-3">
      <div className="space-y-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-600">
          Room Code
        </span>
        <div className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-black select-all">
          {code}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pt-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleShare}
          className="bg-pink-300 hover:bg-pink-200 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 font-bold flex items-center gap-1.5"
        >
          <Share2 className="size-4 shrink-0" />
          <span>{copied ? "Invite Copied!" : "Invite Friends"}</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="bg-white hover:bg-gray-100 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 font-bold flex items-center gap-1.5"
        >
          {copied ? <Check className="size-4 text-green-700" /> : <Copy className="size-4" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setQrOpen(true)}
          className="bg-white hover:bg-gray-100 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 font-bold flex items-center gap-1.5"
          title="Show QR Code"
          aria-label="Show QR Code"
        >
          <QrCode className="size-4" />
          <span>QR</span>
        </Button>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-xs bg-white border-[3px] border-black shadow-[6px_6px_0px_#000] p-6 text-center">
          <DialogHeader className="border-b-2 border-black pb-2">
            <DialogTitle className="font-heading font-black text-lg">
              Scan to Join the Interrogation
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-gray-700 font-mono">
              ROOM: {code}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-4 bg-white border-2 border-black rounded-base shadow-[2px_2px_0px_#000] my-2">
            <QRCode value={inviteUrl} size={180} />
          </div>

          <div className="text-xs font-mono font-bold text-gray-600 break-all select-all">
            {inviteUrl}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
