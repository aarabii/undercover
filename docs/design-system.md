# Design System

Neo-brutalist, case-file aesthetic: flat shadows (no blur/gradients), hard 2–4px ink borders, a physical `2px, 2px` button-press translation, and one loud focal point per screen. Status is always dual-coded (e.g. eliminated players get grayscale _and_ a skull stamp, not just a color change) so nothing depends on color alone.

## Typography & Motion

Fonts: `Archivo Black` for display headings, `Inter` for UI, `IBM Plex Mono` for timers and tabular figures. Motion stays under 250 ms and fully respects `prefers-reduced-motion`.

## Design Tokens

Tokens live in [`apps/web/src/styles/global.css`](../apps/web/src/styles/global.css) (Tailwind v4 `@theme`) — role colors (lime for Civilian, sky for Undercover, a dashed white card for Mr. White), a warm off-white canvas, and a red accent for danger actions and low-time countdowns.
