/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Public areas only (adjust as needed)
const ROOTS = ['src/app', 'src/components'];
const GLOBS = ROOTS.map(r => `${r}/**/*.{tsx,ts,jsx,js,css,mdx,md}`);

// Conservative mapping — headings/buttons => .ink, body/secondary => .ink-muted, faint accents => .ink-faint
const REPLACEMENTS = [
  // Primary text
  [/text-(?:gray|zinc|slate|neutral)-900\b/g, 'ink'],
  [/text-(?:gray|zinc|slate|neutral)-(?:700)\b/g, 'ink'],
  // Secondary text
  [/text-(?:gray|zinc|slate|neutral)-(?:500|600)\b/g, 'ink-muted'],
  [/text-(?:gray|zinc|slate|neutral)-400\b/g, 'ink-muted'],
  // White/black with opacity → semantic
  [/text-white\/(?:60|70)\b/g, 'ink-faint'],
  [/text-black\/(?:40|50|60|70)\b/g, 'ink-muted'],
  // Hardcoded blacks (in class attr)
  [/#(?:000000|000|111111|121212)/gi, 'var(--ink-primary)'],
];

// Remove opacity-* when the same class string suggests it's a text container
function stripOpacityInTextClasses(str) {
  return str.replace(/className\s*=\s*{?["'`](.*?)["'`]}?/gs, (m, classes) => {
    if (/(text-|prose|ink|leading-|tracking-)/.test(classes)) {
      const cleaned = classes.replace(/\bopacity-[1-9]0\b/g, '').replace(/\s+/g, ' ').trim();
      return m.replace(classes, cleaned);
    }
    return m;
  });
}

// Map utilities inside class strings
function mapUtilities(src) {
  return src.replace(/class(Name)?\s*=\s*{?["'`](.*?)["'`]}?/gs, (m, _g1, classes) => {
    let out = classes;
    for (const [re, token] of REPLACEMENTS) {
      out = out.replace(re, token);
    }
    // collapse duplicates
    out = out.replace(/\b(ink(?:-muted|-faint)?)\b(?=.*\b\1\b)/g, '').replace(/\s+/g,' ').trim();
    // If we introduced tokens but the element had no public-page, that's fine: tokens are scoped by .public-page cascade.
    return m.replace(classes, out);
  });
}

function processFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  let out = src;
  out = mapUtilities(out);
  out = stripOpacityInTextClasses(out);

  if (out !== src) {
    fs.writeFileSync(file, out, 'utf8');
    return true;
  }
  return false;
}

function run() {
  const files = glob.sync(`{${GLOBS.join(',')}}`, { nodir: true, ignore: ['**/node_modules/**', '**/.next/**', '**/public/**', '**/dist/**'] });
  let changed = 0;
  for (const f of files) {
    try { if (processFile(f)) changed++; } catch (e) { console.error('Failed:', f, e.message); }
  }
  console.log(`cleanup-public-pages: updated ${changed} file(s).`);
  if (changed === 0) console.log('No changes needed.');
}
run();