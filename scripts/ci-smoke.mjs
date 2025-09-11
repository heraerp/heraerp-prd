#!/usr/bin/env node

// CI smoke test: queries MCP /api/uat/smoke and fails on unbalanced GL
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load env from repo root if present
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// Parse CLI args like --mcp= --org= --from= --to= --esmart= --tsmart= --lsmart= --sample=
const args = Object.fromEntries(process.argv.slice(2).map(kv => {
  const [k, ...rest] = kv.replace(/^--/, '').split('=')
  return [k, rest.join('=')]
}))

const MCP_URL = args.mcp || process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:3005'
const ORG_ID = args.org || process.env.DEFAULT_ORGANIZATION_ID || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
const FROM = args.from || ''
const TO = args.to || ''
const ESMART = args.esmart || ''
const TSMART = args.tsmart || ''
const LSMART = args.lsmart || '%.GL.LINE.%'
const SAMPLE = Number.parseInt(args.sample || '20', 10) || 20

if (!ORG_ID) {
  console.error('❌ CI smoke: organizationId is required (use --org or set DEFAULT_ORGANIZATION_ID)')
  process.exit(2)
}

async function main() {
  console.log('🔎 CI Smoke: MCP /api/uat/smoke')
  console.log(`MCP: ${MCP_URL}`)
  console.log(`Org: ${ORG_ID}`)

  // Health check first
  try {
    const health = await fetch(`${MCP_URL}/health`, { timeout: 5000 }).then(r => r.json())
    console.log(`✅ MCP health: ${health?.status || 'unknown'}`)
  } catch (e) {
    console.error('❌ MCP health check failed:', e?.message || e)
    process.exit(2)
  }

  const params = new URLSearchParams({
    organizationId: ORG_ID,
    elimit: String(SAMPLE),
    tlimit: String(SAMPLE)
  })
  if (FROM) params.set('from', FROM)
  if (TO) params.set('to', TO)
  if (ESMART) params.set('esmart', ESMART)
  if (TSMART) params.set('tsmart', TSMART)
  if (LSMART) params.set('lsmart', LSMART)

  let json
  try {
    const resp = await fetch(`${MCP_URL}/api/uat/smoke?${params.toString()}`)
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`HTTP ${resp.status}: ${text}`)
    }
    json = await resp.json()
  } catch (e) {
    console.error('❌ CI smoke: request failed:', e?.message || e)
    process.exit(2)
  }

  const entitiesCount = json?.entities?.count ?? 0
  const txCount = json?.transactions?.count ?? 0
  const glSummary = json?.glBalance?.summary || { transactions: 0, checkedLines: 0, unbalanced: 0 }

  console.log(`🏢 Organization: ${json?.organization?.organization_name || json?.organization?.id}`)
  console.log(`📄 Entities: ${entitiesCount} (sample ${json?.entities?.sample?.length || 0})`)
  console.log(`🧾 Transactions: ${txCount} (recent ${json?.transactions?.recent?.length || 0})`)
  console.log(`🧮 GL Balance: tx=${glSummary.transactions}, lines=${glSummary.checkedLines}, unbalanced=${glSummary.unbalanced}`)

  if (glSummary.unbalanced > 0) {
    console.error('❌ CI smoke: Found unbalanced GL transactions. Failing build.')
    const rows = json?.glBalance?.unbalanced || []
    rows.slice(0, 10).forEach((r, i) => {
      console.error(`   ${i + 1}. ${r.transaction_code || r.code || ''} ${r.transaction_date || r.date || ''} diff=${r.diff}`)
    })
    process.exit(1)
  }

  console.log('✅ CI smoke: All checks passed (no unbalanced GL)')
}

main().catch(err => {
  console.error('❌ CI smoke error:', err?.message || err)
  process.exit(2)
})

