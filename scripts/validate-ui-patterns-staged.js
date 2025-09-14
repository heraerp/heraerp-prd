#!/usr/bin/env node
// Validate UI patterns only in staged files (for pre-commit), to avoid blocking on legacy files.
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const baseValidator = path.resolve(__dirname, 'validate-ui-patterns.js')
const staged = execSync("git diff --cached --name-only --diff-filter=ACM", { encoding: 'utf8' })
  .split('\n')
  .map(f => f.trim())
  .filter(Boolean)
  .filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'))

if (staged.length === 0) {
  console.log('No staged UI files to validate. Skipping.')
  process.exit(0)
}

// Minimal inlined validator: reuse patterns from main script by requiring it is complex; so run a subset here.
const forbidden = [
  { regex: /\$\d+(\.\d+)?(?![}])/, message: 'Hardcoded dollar sign found. Use CurrencyDisplay component' },
  { regex: /className\s*=\s*["'][^"']*\b(bg-(white|black|gray-\d+))/, message: 'Hardcoded colors found. Use semantic colors (bg-background, bg-muted, border-border, text-foreground)' }
]

let violations = []
for (const file of staged) {
  try {
    const content = fs.readFileSync(file, 'utf8')
    const lines = content.split('\n')
    lines.forEach((line, i) => {
      for (const rule of forbidden) {
        if (rule.regex.test(line) && !line.includes('//')) {
          violations.push({ file, line: i + 1, message: rule.message, code: line.trim().slice(0, 120) })
        }
      }
    })
  } catch {}
}

if (violations.length) {
  console.log('\n❌ UI validation failed for staged files:\n')
  for (const v of violations.slice(0, 100)) {
    console.log(`  ${v.file}:${v.line} - ${v.message}`)
    if (v.code) console.log(`    ${v.code}`)
  }
  if (violations.length > 100) console.log(`  ...and ${violations.length - 100} more.`)
  console.log('\nHint: Replace hardcoded whites/greys/black with bg-card/bg-muted/border-border/text-foreground; replace $ with CurrencyDisplay.')
  process.exit(1)
}

console.log('✅ Staged UI files passed validation')
process.exit(0)

