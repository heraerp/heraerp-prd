import fs from 'fs'
import path from 'path'

export function readDefaultStylesheet(): string {
  // Build-safe CSS reader with comprehensive fallbacks
  try {
    const roots = [process.cwd()]
    const candidates = [
      ['.next', 'browser', 'default-stylesheet.css'], // legacy path your code expects
      ['public', 'default-stylesheet.css'], // our portable fallback
      ['node_modules', '@next', 'docs', 'default-stylesheet.css'], // next.js docs fallback
      ['styles', 'globals.css'], // common location
      ['src', 'styles', 'globals.css'] // src-based styles
    ].flatMap(parts => roots.map(r => path.join(r, ...parts)))

    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) {
          return fs.readFileSync(p, 'utf8')
        }
      } catch (readError) {
        console.warn(`[readDefaultStylesheet] Failed to read ${p}:`, readError)
        continue
      }
    }
  } catch (error) {
    console.warn('[readDefaultStylesheet] Error accessing filesystem:', error)
  }
  
  // Comprehensive fallback CSS for build safety
  return `/* build-safe fallback CSS */
:root {
  --doc-fg: #111;
  --doc-bg: #fff;
  --doc-border: #e1e5e9;
  --doc-muted: #6c757d;
  --doc-primary: #0d6efd;
}
body { 
  color: var(--doc-fg); 
  background: var(--doc-bg); 
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}
.docs-content { 
  max-width: 800px; 
  margin: 0 auto; 
  padding: 1rem;
}`
}
