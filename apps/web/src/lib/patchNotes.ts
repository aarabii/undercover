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
    title: "Classified Dossier UI & Design System",
    isLatest: true,
    summary:
      "A complete visual and tactical overhaul: custom 4-tier Neo-Brutalist color schema, official brutalist typography, phase progress steppers, and declassified patch notes.",
    items: [
      {
        type: "new",
        text: "Custom Classified Dossier color schema with Base, Shade, Tint, and Fade/Wash palettes mapped across every game role and UI surface.",
      },
      {
        type: "new",
        text: "Declassified Patch Notes popup drawer with instant update tracking and version stamps directly on the home deck.",
      },
      {
        type: "new",
        text: "Interactive Word-Pair Evidence Preview on the landing page to demonstrate the core deduction mechanics in 2 seconds.",
      },
      {
        type: "new",
        text: "Live Suspect Ratio breakdown bar in lobby settings, visually charting Civilians vs. Infiltrators as settings change.",
      },
      {
        type: "new",
        text: "Tactile Round Phase stepper and voting progress bar during active in-game interrogation rounds.",
      },
      {
        type: "improved",
        text: "Restored authentic neo-brutalist typography with Archivo Black headers, Public Sans body, and IBM Plex Mono numerals.",
      },
      {
        type: "improved",
        text: "Unified role color identity across landing page, rules dialog, and live match: Civilian (Lime), Undercover (Sky), Mr. White (Dashed White).",
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
      "A massive influx of spy codenames, CC0 disguise collections, and refined Mr. White fuzzy deduction logic.",
    items: [
      {
        type: "new",
        text: "320+ spy codename generator with instant re-roll dice button for quick disguised aliases.",
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
    ],
  },
];
