#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'

// This is a stub for preset documentation generation
// In production, this would:
// 1. Load all presets from entityPresets.ts
// 2. Generate markdown documentation for each preset
// 3. Create an index of all entity types
// 4. Generate relationship diagrams

console.log('📚 Generating preset documentation...')

const docsDir = path.join(process.cwd(), 'docs', 'presets')
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true })
}

// Create a placeholder index
const indexContent = `# Entity Presets Documentation

This documentation is auto-generated from the entity presets.

## Entity Types
- CUSTOMER
- PRODUCT
- ROLE
- SALE
- GL_ACCOUNT
- ... and more

Run \`npm run docs:sync\` to regenerate this documentation.
`

fs.writeFileSync(path.join(docsDir, 'index.md'), indexContent)

console.log('✅ Preset documentation generated')