#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const YAML = require('yaml')

const PHASE_ORDER = { entities: 10, dynamic_data: 20, relationships: 30, procedures: 40, read_models: 50, tests_uat: 60, deploy_support: 70 }

// Symbol helpers
const key = (t, slug) => `${t}::${slug}`
const K = {
  ENTITY: 'ENTITY',
  ENTITY_TYPE: 'ENTITY_TYPE',
  TRANSACTION_TYPE: 'TRANSACTION_TYPE',
  LINE_TYPE: 'LINE_TYPE',
  REL_TYPE: 'REL_TYPE',
}

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { bundle: '.', baseline: null }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bundle') out.bundle = args[++i]
    else if (args[i] === '--baseline') out.baseline = args[++i]
  }
  return out
}

function detectKind(obj) {
  if (obj?.items) return 'entities'
  if (obj?.rows && obj?.rows[0]?.relationship_type) return 'relationships'
  if (obj?.rows) return 'dynamic_data'
  if (obj?.happy_path || obj?.inputs) return 'procedures'
  return 'deploy_support'
}

function topoSort(nodes, edges) {
  const fileSet = new Set(nodes.map((n) => n.file))
  const incoming = new Map()
  const adj = new Map()
  for (const f of fileSet) incoming.set(f, 0)
  for (const [a, b] of edges) {
    if (!fileSet.has(a) || !fileSet.has(b)) continue
    adj.set(a, [...(adj.get(a) || []), b])
    incoming.set(b, (incoming.get(b) || 0) + 1)
  }
  const q = [...Array.from(incoming.entries()).filter(([, d]) => d === 0).map(([f]) => f)]
  const out = []
  while (q.length) {
    const f = q.shift()
    out.push(f)
    for (const n of adj.get(f) || []) {
      incoming.set(n, incoming.get(n) - 1)
      if (incoming.get(n) === 0) q.push(n)
    }
  }
  if (out.length !== fileSet.size) {
    console.error(JSON.stringify({ error: 'DAG_CYCLE' }))
    process.exit(1)
  }
  return out
}

;(function main() {
  const { bundle, baseline } = parseArgs()
  const root = path.resolve(bundle)
  const orch = ['orchestration.yml', 'orchestration.yaml', 'universal_orchestration.yaml']
    .map((f) => path.join(root, f))
    .find((p) => fs.existsSync(p))
  if (!orch) {
    console.error(JSON.stringify({ error: 'ORCH_NOT_FOUND', root }))
    process.exit(1)
  }
  const o = YAML.parse(fs.readFileSync(orch, 'utf8'))
  const files = (o.contracts || []).map((rel) => path.resolve(path.dirname(orch), rel))
  const loaded = files.map((f) => ({ file: f, obj: YAML.parse(fs.readFileSync(f, 'utf8')) }))
  const nodes = loaded.map(({ file, obj }) => ({ file, kind: detectKind(obj), obj }))

  // Collect provides and references
  const provides = new Map() // symbol -> file
  const references = new Map() // file -> symbols[]

  for (const n of nodes) {
    const refs = []
    if (n.kind === 'entities') {
      for (const it of n.obj.items || []) {
        provides.set(key(it.entity_type, it.slug), n.file)
      }
    } else if (n.kind === 'dynamic_data') {
      for (const r of n.obj.rows || []) if (r.entity_slug) refs.push(key(K.ENTITY, r.entity_slug))
    } else if (n.kind === 'relationships') {
      for (const r of n.obj.rows || []) {
        if (r.from_slug) refs.push(key(K.ENTITY, r.from_slug))
        if (r.to_slug) refs.push(key(K.ENTITY, r.to_slug))
        if (r.relationship_type) refs.push(key(K.REL_TYPE, r.relationship_type))
      }
    } else if (n.kind === 'procedures') {
      const prec = Array.isArray(n.obj.preconditions) ? n.obj.preconditions : []
      for (const s of prec) {
        const re = /\b(ENTITY|ENTITY_TYPE|TRANSACTION_TYPE|LINE_TYPE|REL_TYPE)::([a-z0-9_]+)\b/g
        for (const m of String(s).matchAll(re)) refs.push(key(m[1], m[2]))
      }
    }
    references.set(n.file, refs)
  }

  const byPhase = {}
  nodes.forEach((n) => {
    const p = n.kind
    byPhase[p] = byPhase[p] || []
    byPhase[p].push(n.file)
  })

  const phases = Object.keys(PHASE_ORDER).sort((a, b) => PHASE_ORDER[a] - PHASE_ORDER[b])
  const edges = []
  for (let i = 0; i < phases.length - 1; i++) {
    for (const f of byPhase[phases[i]] || []) {
      for (const t of byPhase[phases[i + 1]] || []) edges.push([f, t])
    }
  }
  for (const [a, b] of o.graph || []) edges.push([path.resolve(path.dirname(orch), a), path.resolve(path.dirname(orch), b)])

  // Add edges derived from references
  for (const [file, syms] of references.entries()) {
    for (const s of syms) {
      const prov = provides.get(s)
      if (prov && prov !== file) edges.push([prov, file])
    }
  }

  // Baseline set (optional)
  const baselineSet = new Set()
  if (baseline) {
    try {
      const baseList = JSON.parse(fs.readFileSync(path.resolve(baseline), 'utf8'))
      for (const sym of baseList) baselineSet.add(sym)
    } catch (e) {
      console.error(JSON.stringify({ error: 'BASELINE_PARSE_ERROR', detail: String(e.message || e) }))
      process.exit(1)
    }
  }

  // Missing providers
  const missing = []
  for (const [file, syms] of references.entries()) {
    for (const s of syms) {
      if (!provides.has(s) && !baselineSet.has(s)) missing.push({ file, symbol: s })
    }
  }
  if (missing.length) {
    console.error(JSON.stringify({ error: 'MISSING_PROVIDERS', missing }, null, 2))
    process.exit(1)
  }

  const order = topoSort(nodes, edges)
  console.log(JSON.stringify({ order, edges }, null, 2))
})()
