/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const roots = ['icons', 'components', 'src'].map(p => path.resolve(process.cwd(), p));
const exts = ['.svg', '.tsx', '.jsx'];

// Simple heuristics:
// - For .svg files: string-based transform is safe.
// - For TSX/JSX: transform <svg ...>...</svg> blocks via regex; leave brand logos by opt-out attr.
const SVG_OPEN_TAG = /<svg\b[^>]*>/i;
const HAS_KEEP = /<svg\b[^>]*\bdata-keep-color=["']?true["']?[^>]*>/i;

function patchRootSvgTag(tag) {
  if (/stroke=/.test(tag) === false) tag = tag.replace('<svg', '<svg stroke="currentColor"');
  // If root has an explicit fill already set to non-none, prefer 'none' for icons; elements can override.
  if (/fill=/.test(tag) === false) tag = tag.replace('<svg', '<svg fill="none"');
  return tag;
}

function replaceColors(str) {
  // Replace fill/stroke hex/rgb/hsl or named colors with currentColor, but keep 'none'.
  // Covers: #fff, #FFFFFF, rgb(...), hsl(...), currentColor (kept), and common names.
  return str
    .replace(/(fill|stroke)\s*=\s*["'](?!none\b)(?!currentColor\b)[^"']+["']/gi, (_, attr) => `${attr}="currentColor"`)
    .replace(/\b(fill|stroke):\s*(?!none\b)(?!currentColor\b)[#a-z0-9().,\s%-]+/gi, (m, attr) => `${attr}: currentColor`);
}

function transformSvgFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (HAS_KEEP.test(src)) return null; // skip brand/locked color icons

  let out = src;
  // Patch root <svg>
  const open = out.match(SVG_OPEN_TAG);
  if (open) {
    const patched = patchRootSvgTag(open[0]);
    out = out.replace(SVG_OPEN_TAG, patched);
  }
  // Replace colors throughout
  out = replaceColors(out);

  if (out !== src) {
    fs.writeFileSync(file, out, 'utf8');
    return { file, changed: true };
  }
  return null;
}

function transformJsxFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Process each <svg>...</svg> block
  src = src.replace(/<svg\b[\s\S]*?<\/svg>/gi, (block) => {
    if (HAS_KEEP.test(block)) return block; // opt-out
    let b = block;

    // Patch opening tag
    const open = b.match(SVG_OPEN_TAG);
    if (open) {
      const patched = patchRootSvgTag(open[0]);
      b = b.replace(SVG_OPEN_TAG, patched);
    }

    // Normalize inline attributes/styles
    const replaced = replaceColors(b);
    if (replaced !== b) changed = true;
    return replaced;
  });

  if (changed) {
    fs.writeFileSync(file, src, 'utf8');
    return { file, changed: true };
  }
  return null;
}

function run() {
  const matches = roots.flatMap(root =>
    exts.flatMap(ext => glob.sync(path.join(root, '**', `*${ext}`), { nodir: true }))
  );

  const touched = [];
  for (const file of matches) {
    try {
      if (file.endsWith('.svg')) {
        const res = transformSvgFile(file);
        if (res) touched.push(res.file);
      } else {
        const res = transformJsxFile(file);
        if (res) touched.push(res.file);
      }
    } catch (e) {
      console.error(`Failed on ${file}:`, e.message);
    }
  }

  console.log(`icons-currentColor: updated ${touched.length} file(s).`);
  if (touched.length) {
    console.log(touched.slice(0, 30).join('\n') + (touched.length > 30 ? `\n...and ${touched.length-30} more` : ''));
  }
}

run();