/*
 * HERA Enterprise Manifest v2 Diff
 * Compares DEV vs PROD manifests and exits non-zero on violations.
 */

import fs from 'fs'
import path from 'path'
import { Client } from 'pg'
import { buildManifest } from './build'

type Json = any

function summarizeDiff(a: any[], b: any[]) {
  const setA = new Set(a)
  const setB = new Set(b)
  const onlyA = [...setA].filter(x => !setB.has(x))
  const onlyB = [...setB].filter(x => !setA.has(x))
  return { onlyA, onlyB }
}

async function loadOrBuild(databaseUrl: string, cached?: string) {
  if (cached && fs.existsSync(cached)) return JSON.parse(fs.readFileSync(cached, 'utf8'))
  const pg = new Client({ connectionString: databaseUrl })
  await pg.connect()
  try {
    return await buildManifest(pg)
  } finally {
    await pg.end()
  }
}

function writeReport(outDir: string, name: string, json: Json, human: string) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(json, null, 2), 'utf8')
  fs.writeFileSync(path.join(outDir, `${name}.txt`), human, 'utf8')
}

async function main() {
  const devDb = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL
  const prodDb = process.env.PROD_DATABASE_URL
  if (!devDb || !prodDb) throw new Error('DEV_DATABASE_URL and PROD_DATABASE_URL are required')
  const outDir = process.env.HERA_OUT_DIR || 'artifacts'

  const dev = await loadOrBuild(devDb)
  const prod = await loadOrBuild(prodDb)

  const violations: string[] = []
  const notes: string[] = []

  // 1) Extensions must be equal or subset; no extra risky ones in PROD
  const ext = summarizeDiff(dev.extensions_allowed, prod.extensions_allowed)
  if (ext.onlyB.length > 0) notes.push(`Extensions only in PROD: ${ext.onlyB.join(', ')}`)
  if (ext.onlyA.length > 0) notes.push(`Extensions only in DEV: ${ext.onlyA.join(', ')}`)

  // 2) RLS must exist for sacred tables in PROD
  const sacred = ['core_organizations', 'core_entities', 'core_dynamic_data', 'core_relationships']
  const rlsTables = new Set(prod.policies_rls.map((p: any) => p.tablename))
  for (const t of sacred) {
    if (!rlsTables.has(t)) violations.push(`Missing RLS policies for ${t} in PROD`)
  }

  // 3) No non-hera functions or triggers added in PROD vs DEV
  const devRpcs = new Set(dev.objects_rpc_hera.map((r: any) => `${r.schema}.${r.name}(${r.args})`))
  const prodRpcs = new Set(prod.objects_rpc_hera.map((r: any) => `${r.schema}.${r.name}(${r.args})`))
  const rpcOnlyProd = [...prodRpcs].filter(x => !devRpcs.has(x))
  for (const f of rpcOnlyProd) {
    if (!f.includes('.hera_')) violations.push(`Non-hera RPC present only in PROD: ${f}`)
  }

  const devTrig = new Set(dev.objects_triggers_hera.map((t: any) => `${t.table}.${t.trigger}`))
  const prodTrig = new Set(prod.objects_triggers_hera.map((t: any) => `${t.table}.${t.trigger}`))
  const trigOnlyProd = [...prodTrig].filter(x => !devTrig.has(x))
  for (const t of trigOnlyProd) {
    if (!t.includes('hera_')) violations.push(`Non-hera trigger present only in PROD: ${t}`)
  }

  // 4) Indices differences allowed if additive, but flag drops
  const devIdx = new Set(dev.objects_indices.map((i: any) => i.indexname))
  const prodIdx = new Set(prod.objects_indices.map((i: any) => i.indexname))
  const droppedIdx = [...devIdx].filter(x => !prodIdx.has(x))
  if (droppedIdx.length > 0) notes.push(`Indices missing in PROD: ${droppedIdx.join(', ')}`)

  // 5) Guardrails hash must match
  if (dev.guardrails_hash !== prod.guardrails_hash) violations.push('Guardrails hash mismatch (sacred tables changed)')

  const summary = {
    dev: { database: dev.database, ci_snapshot_sha: dev.ci_snapshot_sha },
    prod: { database: prod.database, ci_snapshot_sha: prod.ci_snapshot_sha },
    notes,
    violations
  }
  const human = [
    `HERA Manifest Diff (DEV -> PROD)`,
    `DEV db: ${summary.dev.database}`,
    `PROD db: ${summary.prod.database}`,
    notes.length ? `Notes:\n- ${notes.join('\n- ')}` : 'Notes: none',
    violations.length ? `Violations:\n- ${violations.join('\n- ')}` : 'Violations: none'
  ].join('\n')

  writeReport(outDir, 'manifest-diff', summary, human)

  if (violations.length > 0) {
    console.error(human)
    process.exit(2)
  } else {
    console.log(human)
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Diff failed:', err)
    process.exit(1)
  })
}

