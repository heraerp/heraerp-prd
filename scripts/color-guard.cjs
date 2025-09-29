/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cp = require('child_process');

// -------- args (no deps) --------
const argv = process.argv.slice(2);
const getArg = (name, def = null) => {
  const i = argv.indexOf(name);
  if (i === -1) return def;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const has = (name) => argv.includes(name);

const REPORT_PATH = getArg('--report', null);           // write JSON report with LOCs
const NO_EXIT_NONZERO = has('--no-exit-nonzero');       // never fail the process (soft)
const GITHUB_ANN = has('--github-annotations');         // emit ::warning file=...,line=...::
const CHANGED_ONLY = has('--changed-only');             // scan only changed files
const BASE_BRANCH = getArg('--base', 'main');           // base for changed-only
const BASELINE = getArg('--baseline', null);            // compare against baseline counts
const WRITE_BASELINE = getArg('--write-baseline', null);// snapshot current counts
const CONTEXT = parseInt(getArg('--context', '0'), 10); // lines of context around hits

// -------- scopes --------
const ROOTS = ['app', 'src', 'components'];
const EXTS = '{ts,tsx,js,jsx,css,scss,md,mdx,html}';
const IGNORE = ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/public/**', '**/scripts/**'];

// -------- rules (same as before) --------
const rules = [
  { id: 'low-contrast-400-700', re: /text-(?:gray|zinc|slate)-(?:400|500|600|700)\b/g },
  { id: 'white-black-opacity',  re: /text-(?:white|black)\/(?:40|50|60|70)\b/g },
  { id: 'hard-900',             re: /text-(?:slate|zinc|gray|neutral)-900\b/g },
  { id: 'hard-black-hex',       re: /(?:#000000|#000\b|#111111|#121212)/gi },
  { id: 'opacity-ancestors',    re: /opacity-[1-9]0\b/g },
  { id: 'inline-style-color',   re: /style=\{\s*\{\s*color\s*:\s*[^}]+\}\s*\}/g },
  { id: 'svg-hex-fill',         re: /\bfill=["']#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})["']/g },
  { id: 'svg-hex-stroke',       re: /\bstroke=["']#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})["']/g },
];

// -------- helpers --------
function listFiles() {
  if (!CHANGED_ONLY) {
    return glob.sync(`{${ROOTS.join(',')}}/**/*.${EXTS}`, { ignore: IGNORE, nodir: true, nocase: true });
  }
  try {
    cp.execSync(`git fetch --depth=1 origin ${BASE_BRANCH}`, { stdio: 'ignore' });
  } catch {}
  const out = cp.execSync(`git diff --name-only --diff-filter=ACMRT origin/${BASE_BRANCH}...`, { encoding: 'utf8' });
  const changed = out.split(/\r?\n/).filter(Boolean);
  return changed
    .filter(f => ROOTS.some(r => f.startsWith(`${r}/`)))
    .filter(f => /\.(ts|tsx|js|jsx|css|scss|md|mdx|html)$/.test(f))
    .filter(f => !IGNORE.some(ig => new RegExp(ig.replace('**/', '.*')).test(f)));
}

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const hits = [];

  for (let ln = 0; ln < lines.length; ln++) {
    const line = lines[ln];
    for (const rule of rules) {
      rule.re.lastIndex = 0; // reset global regex
      const matches = [...line.matchAll(rule.re)];
      for (const m of matches) {
        const col = (m.index || 0) + 1;
        const entry = { file, rule: rule.id, line: ln + 1, col, match: m[0] };
        if (CONTEXT > 0) {
          const start = Math.max(0, ln - CONTEXT);
          const end = Math.min(lines.length, ln + CONTEXT + 1);
          entry.context = lines.slice(start, end).join('\n');
          entry.contextStart = start + 1;
        }
        hits.push(entry);
        if (!rule.re.global) break;
      }
    }
  }
  return hits;
}

function aggregateCounts(hits) {
  const counts = {};
  for (const h of hits) {
    if (!counts[h.file]) counts[h.file] = {};
    counts[h.file][h.rule] = (counts[h.file][h.rule] || 0) + 1;
  }
  return counts;
}

// -------- main --------
function run() {
  const files = listFiles();
  let allHits = [];
  for (const f of files) {
    try {
      allHits = allHits.concat(scanFile(f));
    } catch (e) {
      console.error(`Failed reading ${f}: ${e.message}`);
    }
  }

  // Baseline diff (optional)
  let effectiveHits = allHits;
  if (BASELINE && fs.existsSync(BASELINE)) {
    const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
    const baseCounts = base; // {file:{rule:count}}
    effectiveHits = allHits.filter(h => {
      const prev = baseCounts[h.file]?.[h.rule] || 0;
      // We'll decrement as we see hits; keep only the ones beyond baseline
      if (prev > 0) {
        baseCounts[h.file][h.rule] = prev - 1;
        return false;
      }
      return true;
    });
  }

  // Write baseline snapshot
  if (WRITE_BASELINE) {
    const counts = aggregateCounts(allHits);
    fs.writeFileSync(WRITE_BASELINE, JSON.stringify(counts, null, 2));
    console.log(`📝 Wrote baseline to ${WRITE_BASELINE}`);
    return;
  }

  // Reporting
  const toReport = effectiveHits;
  if (toReport.length === 0) {
    console.log('✅ Color Guard: no banned patterns found.');
  } else {
    console.log(`\n⚠️  Found ${toReport.length} offending match(es):\n`);
    // group by file for nicer output
    const byFile = new Map();
    for (const hit of toReport) {
      if (!byFile.has(hit.file)) byFile.set(hit.file, []);
      byFile.get(hit.file).push(hit);
    }
    for (const [file, hits] of byFile) {
      console.log(`• ${file}`);
      hits.sort((a,b)=>a.line-b.line || a.col-b.col).forEach(h => {
        const msg = `${h.rule} | ${h.match}`;
        console.log(`  - L${h.line}:C${h.col}  ${msg}`);
        if (GITHUB_ANN) {
          // GitHub Actions annotation (does not fail the job)
          console.log(`::warning file=${file},line=${h.line},col=${h.col}::${msg}`);
        }
        if (h.context) {
          const lines = h.context.split('\n');
          lines.forEach((l, i) => {
            const n = h.contextStart + i;
            console.log(`      ${String(n).padStart(4)}  ${l}`);
          });
        }
      });
      console.log('');
    }
  }

  if (REPORT_PATH) {
    const payload = {
      total: toReport.length,
      generatedAt: new Date().toISOString(),
      hits: toReport,
    };
    fs.writeFileSync(REPORT_PATH, JSON.stringify(payload, null, 2));
    console.log(`🗂  JSON report written to ${REPORT_PATH}`);
  }

  // Soft mode if requested
  if (NO_EXIT_NONZERO) return;
  if (toReport.length > 0) process.exitCode = 1;
}

run();