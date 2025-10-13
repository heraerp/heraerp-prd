import fs from 'fs'
import path from 'path'

export function readDefaultStylesheet(): string {
  // Read stable project asset, not build artifact
  try {
    const staticCssPath = path.join(process.cwd(), 'public', 'docs', 'default-stylesheet.css')
    if (fs.existsSync(staticCssPath)) {
      return fs.readFileSync(staticCssPath, 'utf8')
    }
  } catch (error) {
    console.warn('[readDefaultStylesheet] Error reading static CSS:', error)
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
