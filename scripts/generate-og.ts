import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

const width = 1200;
const height = 630;

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fdfbf7" />
  <!-- Background subtle grid pattern -->
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e5e5" stroke-width="1.5" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" />

  <!-- Neo-brutal Card -->
  <!-- Hard Shadow -->
  <rect x="96" y="86" width="1024" height="474" fill="#000000" rx="16" />
  <!-- Card Face -->
  <rect x="80" y="70" width="1024" height="474" fill="#ffffff" stroke="#000000" stroke-width="6" rx="16" />

  <!-- Yellow Eyebrow Badge -->
  <rect x="130" y="120" width="340" height="44" fill="#fde047" stroke="#000000" stroke-width="3" rx="8" />
  <text x="145" y="148" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="900" letter-spacing="2" fill="#000000">🕵️ NO LOGIN • REAL-TIME</text>

  <!-- Big Title -->
  <text x="130" y="240" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="72" font-weight="900" fill="#000000">
    UNDERCOVER
  </text>

  <!-- Subtitle with Yellow Highlight Box -->
  <rect x="130" y="280" width="480" height="64" fill="#fde047" stroke="#000000" stroke-width="4" rx="6" />
  <text x="146" y="325" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="34" font-weight="900" fill="#000000">
    One of you is lying.
  </text>

  <text x="130" y="390" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="28" font-weight="700" fill="#4b5563">
    Social deduction word game for groups and calls.
  </text>

  <!-- Roles Badges -->
  <rect x="130" y="440" width="180" height="48" fill="#dbeafe" stroke="#000000" stroke-width="3" rx="8" />
  <text x="160" y="471" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="900" fill="#1e40af">CIVILIAN</text>

  <rect x="330" y="440" width="200" height="48" fill="#fce7f3" stroke="#000000" stroke-width="3" rx="8" />
  <text x="355" y="471" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="900" fill="#be185d">UNDERCOVER</text>

  <rect x="550" y="440" width="180" height="48" fill="#f3f4f6" stroke="#000000" stroke-width="3" rx="8" />
  <text x="575" y="471" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="900" fill="#111827">MR. WHITE</text>

  <!-- Play Callout -->
  <rect x="830" y="430" width="220" height="60" fill="#22c55e" stroke="#000000" stroke-width="4" rx="10" />
  <text x="860" y="468" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="24" font-weight="900" fill="#ffffff">PLAY FREE →</text>
</svg>
`;

async function main() {
  const outputPath = join(__dirname, "../apps/web/public/og-image.png");
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
  console.log(`Generated OG Image at ${outputPath}`);
}

main().catch(console.error);
