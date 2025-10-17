#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const cp = require('child_process')

function run(cmd, args, stdin) {
  try {
    return cp.spawnSync(cmd, args, { input: stdin, encoding: 'utf8' })
  } catch (e) {
    return { error: e, status: 1, stdout: '', stderr: String(e.message || e) }
  }
}

const bundle = process.argv[2] || '.'
const extra = process.argv.slice(3)
const planProc = run('node', ['mcp-server/contract-plan.js', '--bundle', bundle, ...extra])
let plan
try {
  plan = JSON.parse(planProc.stdout || '{}')
} catch (e) {
  console.error('PLAN_PARSE_ERROR', planProc.stdout)
  process.exit(1)
}

const nodes = Array.from(new Set(plan.order || [])).map((f) => path.basename(f)).sort()
const edges = (plan.edges || [])
  .map(([a, b]) => [path.basename(a), path.basename(b)])
  .sort((x, y) => (x[0] + x[1]).localeCompare(y[0] + y[1]))

const dot = [
  'digraph HERA {',
  '  rankdir=LR; node [shape=box, fontname="Inter"];',
  ...nodes.map((n) => `  "${n}";`),
  ...edges.map(([a, b]) => `  "${a}" -> "${b}";`),
  '}',
].join('\n')

const outDir = path.join(bundle, '.hera')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
const dotPath = path.join(outDir, 'graph.dot')
fs.writeFileSync(dotPath, dot)

const gv = run('dot', ['-Tsvg'], dot)
let svgPath = null
if (!gv.error && gv.status === 0 && gv.stdout) {
  svgPath = path.join(outDir, 'graph.svg')
  fs.writeFileSync(svgPath, gv.stdout)
}

console.log(JSON.stringify({ dot: '.hera/graph.dot', svg: svgPath ? '.hera/graph.svg' : null }, null, 2))
