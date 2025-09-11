#!/usr/bin/env node

// Local pre-push guardrail runner: runs smoke + relationships, asks MCP/Claude to diagnose on failure
import { spawnSync } from 'node:child_process'
import fetch from 'node-fetch'

const args = Object.fromEntries(process.argv.slice(2).map(kv => {
  const [k, ...rest] = kv.replace(/^--/, '').split('=')
  return [k, rest.join('=')]
}))

const MCP_URL = args.mcp || process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:3005'
const ORG_ID = args.org || process.env.DEFAULT_ORGANIZATION_ID || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
const FROM = args.from || ''
const TO = args.to || ''
const TSMART = args.tsmart || 'HERA.MANUFACTURING.FURNITURE.'
const LSMART = args.lsmart || '%.GL.LINE.%'
const SAMPLE = args.sample || '20'

function run(cmd, argv, env = {}) {
  const r = spawnSync(cmd, argv, { stdio: 'pipe', env: { ...process.env, ...env } })
  return { code: r.status, out: r.stdout?.toString?.() || '', err: r.stderr?.toString?.() || '' }
}

async function main() {
  if (!ORG_ID) {
    console.error('❌ prepush: missing organization id (--org or DEFAULT_ORGANIZATION_ID)')
    process.exit(2)
  }

  console.log('🔎 Running CI smoke...')
  const smoke = run('node', ['scripts/ci-smoke.mjs', `--mcp=${MCP_URL}`, `--org=${ORG_ID}`, `--from=${FROM}`, `--to=${TO}`, `--tsmart=${TSMART}`, `--lsmart=${LSMART}`, `--sample=${SAMPLE}`])
  const smokeFailed = smoke.code !== 0
  if (smokeFailed) console.error(smoke.out || smoke.err)

  console.log('🔎 Running relationships guardrails...')
  const rel = run('node', ['scripts/rel-guardrails.mjs', `--mcp=${MCP_URL}`, `--org=${ORG_ID}`])
  const relFailed = rel.code !== 0
  if (relFailed) console.error(rel.out || rel.err)

  if (!smokeFailed && !relFailed) {
    console.log('✅ prepush checks passed')
    process.exit(0)
  }

  // Try to fetch smoke JSON for richer diagnosis if MCP reachable
  let smokeJson = null
  try {
    const params = new URLSearchParams({ organizationId: ORG_ID, tlimit: '20', elimit: '20', from: FROM, to: TO, tsmart: TSMART, lsmart: LSMART })
    const resp = await fetch(`${MCP_URL}/api/uat/smoke?${params.toString()}`)
    if (resp.ok) smokeJson = await resp.json()
  } catch {}

  // Ask MCP/Claude to diagnose
  try {
    const body = { type: 'prepush', organizationId: ORG_ID, smoke: smokeJson, relationships: { errors: relFailed ? (rel.err || rel.out || '').split('\n').slice(0, 50) : [] } }
    const d = await fetch(`${MCP_URL}/api/uat/diagnose`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (d.ok) {
      const js = await d.json()
      console.log('\n🧠 AI suggestions:')
      console.log(js.suggestions || js)
    } else {
      console.warn('⚠️ Diagnose HTTP', d.status)
    }
  } catch (e) {
    console.warn('⚠️ Diagnose failed:', e?.message || e)
  }

  process.exit(1)
}

main().catch(e => { console.error('❌ prepush error:', e?.message || e); process.exit(2) })

