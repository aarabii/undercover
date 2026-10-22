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
    <div className="w-full bg-paper border-[3px] border-black rounded-base p-4 shadow-brutal text-center space-y-3">
      <div className="space-y-1 bg-amber-fade/60 p-2 rounded-tight border border-black/10">
        <span className="text-[10px] font-mono font-black uppercase tracking-widest text-ink-muted">
          DOSSIER ROOM CODE
        </span>
        <div className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-ink select-all">
          {code}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pt-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleShare}
          className="bg-rose-base hover:bg-rose-tint text-ink border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Share2 className="size-4 shrink-0" />
          <span>{copied ? "Invite Copied!" : "Invite Friends"}</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="bg-paper hover:bg-canvas-fade text-ink border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 font-bold flex items-center gap-1.5 cursor-pointer"
        >
          {copied ? <Check className="size-4 text-lime-shade" /> : <Copy className="size-4" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setQrOpen(true)}
          className="bg-paper hover:bg-canvas-fade text-ink border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 font-bold flex items-center gap-1.5 cursor-pointer"
          title="Show QR Code"
          aria-label="Show QR Code"
        >
          <QrCode className="size-4" />
          <span>QR</span>
        </Button>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-xs bg-paper border-[3px] border-black shadow-[6px_6px_0px_#000] p-6 text-center">
          <DialogHeader className="border-b-2 border-black pb-2">
            <DialogTitle className="font-heading font-black text-lg text-ink">
              Scan to Join the Interrogation
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-ink-muted font-mono">
              ROOM: {code}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-4 bg-paper border-2 border-black rounded-base shadow-[2px_2px_0px_#000] my-2">
            <QRCode value={inviteUrl} size={180} />
          </div>

          <div className="text-xs font-mono font-bold text-ink-muted break-all select-all">
            {inviteUrl}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
