import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const WEB_PACKAGE_JSON = join(__dirname, "../apps/web/package.json");
const WEB_SRC_DIR = join(__dirname, "../apps/web/src");

let failed = false;

// 1. Check package.json
const pkg = JSON.parse(readFileSync(WEB_PACKAGE_JSON, "utf-8"));
const allDeps = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
  ...pkg.peerDependencies,
};

if (allDeps["@game/words"]) {
  console.error("❌ Boundary violation: apps/web package.json must not depend on @game/words!");
  failed = true;
}

// 2. Recursively check all source files in apps/web/src
function scanDir(dir: string) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(ts|tsx|js|jsx|astro|mjs)$/.test(entry)) {
      const content = readFileSync(fullPath, "utf-8");
      if (content.includes("@game/words")) {
        console.error(`❌ Boundary violation in ${fullPath}: source file imports or references @game/words!`);
        failed = true;
      }
    }
  }
}

scanDir(WEB_SRC_DIR);

if (failed) {
  process.exit(1);
} else {
  console.log("✅ Boundary check passed: apps/web does not depend on or import @game/words.");
}
