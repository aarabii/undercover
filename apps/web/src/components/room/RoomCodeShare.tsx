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
  variant?: "full" | "compact";
  className?: string;
}

export default function RoomCodeShare({
  code,
  variant = "full",
  className = "",
}: RoomCodeShareProps) {
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

  const qrDialog = (
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
  );

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="font-mono text-xs font-black uppercase px-2 py-1 rounded-tight bg-amber-base border-2 border-black text-ink shadow-[1px_1px_0px_#000]">
          {code}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-xs flex items-center gap-1"
          title={copied ? "Copied invite link!" : "Copy invite link"}
          aria-label="Copy invite link"
        >
          {copied ? <Check className="size-3 text-lime-shade stroke-[3]" /> : <Copy className="size-3" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setQrOpen(true)}
          className="h-7 px-2 text-xs flex items-center gap-1"
          title="Show QR Code"
          aria-label="Show QR Code"
        >
          <QrCode className="size-3" />
          <span className="hidden sm:inline">QR</span>
        </Button>

        {qrDialog}
      </div>
    );
  }

  return (
    <div
      className={`w-full bg-paper border-[3px] border-black rounded-base p-4 sm:p-5 shadow-brutal text-center space-y-3 ${className}`}
    >
      <div className="space-y-1 bg-amber-fade/70 p-3 rounded-tight border-2 border-black">
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
          variant="rose"
          size="sm"
          onClick={handleShare}
          className="flex items-center gap-1.5"
        >
          <Share2 className="size-4 shrink-0" />
          <span>{copied ? "Invite Copied!" : "Invite Friends"}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-1.5"
        >
          {copied ? <Check className="size-4 text-lime-shade stroke-[3]" /> : <Copy className="size-4" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setQrOpen(true)}
          className="flex items-center gap-1.5"
          title="Show QR Code"
          aria-label="Show QR Code"
        >
          <QrCode className="size-4" />
          <span>QR</span>
        </Button>
      </div>

      {qrDialog}
    </div>
  );
}
