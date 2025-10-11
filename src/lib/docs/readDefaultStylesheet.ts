import fs from 'fs';
import path from 'path';

export function readDefaultStylesheet(): string {
  const roots = [process.cwd()];
  const candidates = [
    ['.next', 'browser', 'default-stylesheet.css'],      // legacy path your code expects
    ['public', 'default-stylesheet.css'],                // our portable fallback
  ]
    .flatMap(parts => roots.map(r => path.join(r, ...parts)));

  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  // last-ditch minimal CSS so the collector never crashes
  return `/* fallback */ :root{--doc-fg:#111;--doc-bg:#fff}`;
}