export interface PatchNoteItem {
  type: "new" | "improved" | "fixed" | "security";
  text: string;
}

export interface PatchRelease {
  version: string;
  date: string;
  title: string;
  isLatest?: boolean;
  summary: string;
  items: PatchNoteItem[];
}

export const PATCH_NOTES: PatchRelease[] = [
  {
    version: "v1.2.0",
    date: "October 2026",
    title: "Classified Dossier UI & Edge Architecture",
    isLatest: true,
    summary:
      "A massive visual, tactical, and infrastructure overhaul: full Classified Dossier Neo-Brutalist design system, universal navigation headers & footers, interactive secret dossier flip cards, edge WebSocket heartbeat offloading, and high-performance SQLite write coalescing.",
    items: [
      {
        type: "new",
        text: "Custom Classified Dossier color schema with Base, Shade, Tint, and Fade/Wash palettes mapped across every game role and UI surface.",
      },
      {
        type: "new",
        text: "Declassified Field Patch Notes popup drawer with instant update tracking, categorization badges, and responsive slide-out navigation.",
      },
      {
        type: "new",
        text: "Tactile Secret Dossier RoleCard with interactive 3D flip animation, confidential classification stamps, and secret word reveal toggle.",
      },
      {
        type: "new",
        text: "Universal AppHeader and AppFooter components unifying top navigation, safety escape, rules trigger, bug reporting, and update tracking across all pages.",
      },
      {
        type: "new",
        text: "Enhanced Room Code Sharing hub with instant QR code modal display, one-tap code copy, direct invite link sharing, and Web Share API integration.",
      },
      {
        type: "new",
        text: "Tactile Round Phase stepper and voting progress bar during active in-game interrogation rounds.",
      },
      {
        type: "new",
        text: "Interactive Word-Pair Evidence Preview on the landing page to demonstrate core deduction mechanics in seconds.",
      },
      {
        type: "new",
        text: "Live Suspect Ratio breakdown bar in lobby settings, visually charting Civilians vs. Infiltrators as settings change.",
      },
      {
        type: "new",
        text: "Expanded 320+ Spy Codename Generator featuring tactical adjectives, NATO callsigns, and intelligence agency operative aliases.",
      },
      {
        type: "new",
        text: "Centralized StatusBanner component delivering clear alerts for connection drops, room closures, and host events.",
      },
      {
        type: "improved",
        text: "Edge WebSocket Heartbeat Offloading via Cloudflare's WebSocketRequestResponsePair, responding at edge infrastructure without waking hibernated Durable Objects.",
      },
      {
        type: "improved",
        text: "High-Performance SQLite Write Coalescing in RoomStorage, skipping redundant database writes during steady states to slash DO I/O and CPU overhead.",
      },
      {
        type: "improved",
        text: "Smart Alarm Synchronization with deduplication logic, preventing redundant alarm scheduling and execution churn.",
      },
      {
        type: "improved",
        text: "Selective Broadcast Projections caching player view projections and filtering recipients during engine state transitions.",
      },
      {
        type: "improved",
        text: "Client-side ConnectionManager 25s ping-pong keepalive loop with graceful heartbeat_ack consumption to prevent stale disconnections.",
      },
      {
        type: "improved",
        text: "Restored authentic neo-brutalist typography with Archivo Black headers, Public Sans body, and IBM Plex Mono numerals.",
      },
      {
        type: "improved",
        text: "Full accessibility compliance with prefers-reduced-motion media query support to disable high-intensity animations on demand.",
      },
      {
        type: "improved",
        text: "Streamlined layout architecture in index.astro and play.astro, eliminating redundant wrappers and dead CSS rules.",
      },
    ],
  },
  {
    version: "v1.1.5",
    date: "September 2026",
    title: "Reporting & Incident Dispatch",
    summary:
      "Direct GitHub dispatch links for incident reports, feature requests, and refined post-elimination verdict displays.",
    items: [
      {
        type: "new",
        text: "Direct incident reporting and feature request templates linked in the game header and footer.",
      },
      {
        type: "improved",
        text: "Refined post-elimination verdict cards with resilient text wrapping and prominent true identity badges.",
      },
      {
        type: "improved",
        text: "Streamlined Host Management modal with clear suspect action choices (Pass the Crown / Kick).",
      },
      {
        type: "improved",
        text: "Optimized image assets and repository documentation for faster asset loading and onboarding.",
      },
      {
        type: "fixed",
        text: "Addressed tie-round status presentation during deadlocked eliminations.",
      },
    ],
  },
  {
    version: "v1.1.0",
    date: "September 2026",
    title: "The Disguise & Alias Expansion",
    summary:
      "Client-side disguise collections, seeded PRNG fairness, and refined Mr. White fuzzy deduction logic.",
    items: [
      {
        type: "new",
        text: "Disguised operative alias generator with instant re-roll dice button for quick aliases.",
      },
      {
        type: "new",
        text: "CC0 Lorelei disguise style alongside client-side SVG avatar rendering without external API dependencies.",
      },
      {
        type: "improved",
        text: "Enhanced Mr. White guessing engine with fuzzy matching, plural normalization, and diacritic handling.",
      },
      {
        type: "improved",
        text: "Categorized word pairs into Easy, Medium, Hard, and Fan Favorites banks.",
      },
      {
        type: "improved",
        text: "Playwright end-to-end multi-player test suite covering lobby creation, joining, and in-game voting cycles.",
      },
      {
        type: "fixed",
        text: "Seeded PRNG improvements ensuring fair, unpredictable word and role distribution across rounds.",
      },
    ],
  },
  {
    version: "v1.0.0",
    date: "September 2026",
    title: "Initial Declassification",
    summary:
      "Initial launch of Undercover: real-time zero-login social deduction party game for browser and mobile calls.",
    items: [
      {
        type: "new",
        text: "Zero-login real-time party gameplay powered by Cloudflare Durable Objects and WebSockets.",
      },
      {
        type: "new",
        text: "Instant 6-letter room code creation with Web Share API and offline QR code scan-to-join.",
      },
      {
        type: "new",
        text: "Bouncer mode with host approval gate and real-time knock-on-door notifications.",
      },
      {
        type: "new",
        text: "Complete round lifecycle: secret word delivery, discussion timer, simultaneous voting, and Mr. White final guess.",
      },
      {
        type: "new",
        text: "SQLite persistence layer with state hydration and recovery across Durable Object hibernation cycles.",
      },
    ],
  },
];
