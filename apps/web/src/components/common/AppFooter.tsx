import React, { useState } from "react";
import BrandLogo from "@/components/common/BrandLogo";
import Container from "@/components/common/Container";
import PatchNotesDrawer from "@/components/modals/PatchNotesDrawer";
import { Newspaper, Heart } from "lucide-react";

export const AppFooter: React.FC = () => {
  const [patchNotesOpen, setPatchNotesOpen] = useState(false);

  return (
    <footer className="border-t-[3px] border-black bg-paper py-6 mt-12 select-none">
      <Container
        id="app-footer-container"
        className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left"
      >
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" showTagline={true} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
          {/* Patch Notes Trigger in Footer */}
          <button
            type="button"
            onClick={() => setPatchNotesOpen(true)}
            className="px-2.5 py-1 rounded-base border-2 border-black bg-rose-tint shadow-brutal-sm text-ink hover:bg-rose-base transition-colors flex items-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            title="View latest updates and patch notes"
          >
            <Newspaper className="size-3.5 text-ink" />
            <span>Updates</span>
            <span className="text-[10px] font-mono font-black px-1 rounded-tight bg-paper border border-black">
              v1.2
            </span>
          </button>

          <a
            href="https://github.com/aarabii/undercover/issues/new?template=bug_report.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-base border-2 border-black bg-amber-tint shadow-brutal-sm no-underline text-ink hover:bg-amber-base transition-colors"
          >
            Report Bug
          </a>

          <a
            href="https://www.aarab.me/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-base border-2 border-black bg-sky-tint shadow-brutal-sm no-underline text-ink hover:bg-sky-base transition-colors"
          >
            Privacy
          </a>

          <a
            href="https://www.aarab.me/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-base border-2 border-black bg-lime-tint shadow-brutal-sm no-underline text-ink hover:bg-lime-base transition-colors"
          >
            Terms
          </a>
        </div>

        <div className="text-xs font-black uppercase tracking-wider text-ink-muted font-mono flex items-center gap-1">
          <span>Made with</span>
          <Heart className="size-3.5 text-crimson-shade fill-crimson-shade inline" />
          <span>by</span>
          <a
            href="https://aarab.me"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline text-ink hover:underline font-bold"
          >
            aarabii
          </a>
        </div>
      </Container>

      {/* Patch Notes Drawer */}
      <PatchNotesDrawer open={patchNotesOpen} onOpenChange={setPatchNotesOpen} />
    </footer>
  );
};

export default AppFooter;
