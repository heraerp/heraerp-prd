#!/usr/bin/env node
/**
 * Discover bundle roots by looking for orchestration files.
 * Optionally restrict to a set of changed paths and auto-detect baselines.
 *
 * Usage:
 *   node mcp-server/scripts/gen-matrix.js \
 *     --roots '.' 'playbooks' \
 *     --baseline-names '["baseline_catalog.json","baseline.json"]' \
 *     [--changed <JSON array of changed paths>]
 *
 * Output (to stdout):
 *   {"include":[{"name":"root","bundle":"." ,"baseline":""}, ...]}
 */
const fs = require('fs')
const path = require('path')

function getArgValue(flag, def = null) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : def
}

function getRoots() {
  const roots = []
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--roots') {
      let j = i + 1
      while (j < process.argv.length && !String(process.argv[j]).startsWith('--')) {
        roots.push(process.argv[j])
        j++
      }
    }
  }
  if (roots.length === 0) return ['.']
  return roots
}

const orchFiles = ['orchestration.yml', 'orchestration.yaml', 'universal_orchestration.yaml']

function hasOrch(dir) {
  return orchFiles.some((f) => fs.existsSync(path.join(dir, f)))
}

function findBaseline(dir, baselineNames) {
  for (const name of baselineNames) {
    const p = path.join(dir, name)
    if (fs.existsSync(p)) return p
  }
  return ''
}

function pushBundle(absDir, include, seen, baselineNames) {
  if (seen.has(absDir)) return
  if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) return
  if (!hasOrch(absDir)) return
  seen.add(absDir)
  include.push({
    name: path.basename(absDir) || 'root',
    bundle: path.relative(process.cwd(), absDir) || '.',
    baseline: findBaseline(absDir, baselineNames),
  })
}

function main() {
  const baselineNames = JSON.parse(getArgValue('--baseline-names', '["baseline_catalog.json","baseline.json"]'))
  let changed = []
  try {
    changed = JSON.parse(getArgValue('--changed', '[]'))
  } catch {
    changed = []
  }

  const roots = getRoots()
  const seen = new Set()
  const include = []

  for (const root of roots) {
    const abs = path.resolve(root)
    if (!fs.existsSync(abs)) continue
    // root itself
    pushBundle(abs, include, seen, baselineNames)
    // first-level subdirs
    for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
      if (ent.isDirectory()) pushBundle(path.join(abs, ent.name), include, seen, baselineNames)
    }
  }

  if (changed.length) {
    const filtered = include.filter((it) => {
      if (it.bundle === '.') return true
      return changed.some((p) => p.startsWith(it.bundle + path.sep))
    })
    if (filtered.length) {
      console.error(
        `[gen-matrix] filtered to changed bundles: ${filtered.map((f) => f.bundle).join(', ')}`
      )
      process.stdout.write(JSON.stringify({ include: filtered }, null, 2))
      process.exit(0)
    }
  }

  process.stdout.write(JSON.stringify({ include }, null, 2))
}

main()

