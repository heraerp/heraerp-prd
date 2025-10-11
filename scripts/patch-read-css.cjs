// Preloaded once for the build process.
const fs = require("fs");
const path = require("path");

const READ = fs.readFileSync;

fs.readFileSync = function patchedRead(file, options) {
  try {
    const p = typeof file === "string" ? file : String(file);

    // Match both absolute and relative forms from any caller
    if (p.includes(".next/browser/default-stylesheet.css")) {
      try {
        // If it actually exists, just read it.
        return READ.call(fs, p, options ?? "utf8");
      } catch (e) {
        // Fallback to portable public asset
        const alt = path.join(process.cwd(), "public", "default-stylesheet.css");
        return READ.call(fs, alt, options ?? "utf8");
      }
    }
  } catch (_) {
    // fall through to default
  }
  return READ.apply(fs, arguments);
};