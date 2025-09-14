#!/usr/bin/env node
// Sync playbooks between root and hera/playbook for gradual migration
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const SRC_ROOT = path.resolve(root, 'playbooks')
const DST_ROOT = path.resolve(root, 'hera/playbook/playbooks')

const args = process.argv.slice(2)
const direction = (args.find(a => a.startsWith('--direction=')) || '--direction=to-hera').split('=')[1]

const from = direction === 'to-root' ? DST_ROOT : SRC_ROOT
const to = direction === 'to-root' ? SRC_ROOT : DST_ROOT

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }

async function syncDir(src, dst) {
  ensureDir(dst)
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const e of entries) {
    const s = path.join(src, e.name)
    const d = path.join(dst, e.name)
    if (e.isDirectory()) {
      await syncDir(s, d)
    } else if (e.isFile()) {
      const content = fs.readFileSync(s)
      ensureDir(path.dirname(d))
      fs.writeFileSync(d, content)
    }
  }
}

if (!fs.existsSync(from)) {
  console.error(`Source does not exist: ${from}`)
  process.exit(1)
}

await syncDir(from, to)
console.log(`✅ Synced playbooks ${direction} ->\n  from: ${from}\n  to:   ${to}`)
