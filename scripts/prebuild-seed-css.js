// Ensure legacy .next/browser/default-stylesheet.css exists before next build
const fs = require("fs");
const path = require("path");

const nextBrowserDir = path.join(process.cwd(), ".next", "browser");
const legacyCss = path.join(nextBrowserDir, "default-stylesheet.css");
const publicCss = path.join(process.cwd(), "public", "default-stylesheet.css");

fs.mkdirSync(nextBrowserDir, { recursive: true });

if (!fs.existsSync(legacyCss)) {
  if (fs.existsSync(publicCss)) {
    fs.copyFileSync(publicCss, legacyCss);
    console.log("[prebuild] Seeded default-stylesheet.css from public/");
  } else {
    fs.writeFileSync(
      legacyCss,
      "/* minimal fallback */\n:root{--hera-docs-bg:#fff;}\nbody{background:var(--hera-docs-bg);}\n",
      "utf8"
    );
    console.log("[prebuild] Wrote minimal fallback default-stylesheet.css");
  }
} else {
  console.log("[prebuild] default-stylesheet.css already present");
}