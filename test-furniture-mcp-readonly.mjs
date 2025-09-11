#!/usr/bin/env node

// Read-only furniture sanity via MCP server (no direct Supabase from this process)
import fetch from 'node-fetch'

const args = Object.fromEntries(process.argv.slice(2).map(kv => {
  const [k, ...rest] = kv.replace(/^--/, '').split('=')
  return [k, rest.join('=')]
}))

const MCP_URL = args.mcp || process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:3005'
const ORG_ID = args.org || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'f0af4ced-9d12-4a55-a649-b484368db249'
const SAMPLE = Number.parseInt(args.sample || '20', 10) || 20
const MODE = args.mode || '' // '', 'entities', 'transactions', 'lines', 'glbalance', 'txdetail'
const ENTITY_TYPE = args.type || ''
const SMART_PREFIX = args.smart || ''
const CODE = args.code || ''
const CODE_PREFIX = args.codePrefix || ''
const NAME = args.name || ''
const NAME_PREFIX = args.namePrefix || ''
// Transaction filters
const TTYPE = args.ttype || ''
const TSMART = args.tsmart || ''
const TCODE = args.tcode || ''
const TCODE_PREFIX = args.tcodePrefix || ''
const FROM = args.from || ''
const TO = args.to || ''
// Transaction line filters
const LTID = args.tid || ''
const LTCODE = args.ltcode || '' // alias for transactionCode substring
const LTCODE_PREFIX = args.ltcodePrefix || ''
const LSMART = args.lsmart || ''
const LGLTYPE = args.gltype || '' // 'debit' | 'credit'
// Transaction detail filters
const DTID = args.txid || ''
const DTCODE = args.txcode || ''
const DLSMART = args.dlsmart || ''
const DGLTYPE = args.dgltype || ''

async function main() {
  console.log('🧪 Furniture MCP read-only test')
  console.log('='.repeat(40))
  console.log(`MCP: ${MCP_URL}`)
  console.log(`Org: ${ORG_ID}`)

  // Health check
  const health = await fetch(`${MCP_URL}/health`).then(r => r.json()).catch(() => null)
  if (!health) throw new Error('MCP server not reachable at /health')
  console.log(`   ✅ MCP health: ${health.status} (${health.service})`)

  // If transaction mode requested, hit transactions endpoint
  if (MODE === 'transactions') {
    const params = new URLSearchParams({ organizationId: ORG_ID, limit: String(SAMPLE) })
    if (TTYPE) params.set('type', TTYPE)
    if (TSMART) params.set('smart', TSMART)
    if (TCODE) params.set('code', TCODE)
    if (TCODE_PREFIX) params.set('codePrefix', TCODE_PREFIX)
    if (FROM) params.set('from', FROM)
    if (TO) params.set('to', TO)

    const txResp = await fetch(`${MCP_URL}/api/uat/transactions?${params.toString()}`)
    if (!txResp.ok) {
      const text = await txResp.text()
      throw new Error(`MCP transactions query failed: ${txResp.status} ${text}`)
    }
    const tx = await txResp.json()
    const rows = tx?.data || []
    console.log(`\n🧾 Transactions (count): ${rows.length}`)
    if (rows.length) {
      console.log(`\n🔎 First ${Math.min(SAMPLE, rows.length)} transactions:`)
      rows.slice(0, SAMPLE).forEach((t, i) => {
        console.log(`   ${i + 1}. [${t.transaction_type}] ${t.transaction_code} — ${t.transaction_date}  amount=${t.total_amount ?? 'N/A'}  smart=${t.smart_code || 'N/A'}`)
      })
    }
  } else if (MODE === 'glbalance') {
    const params = new URLSearchParams({ organizationId: ORG_ID, limit: String(SAMPLE) })
    if (TTYPE) params.set('type', TTYPE)
    if (TSMART) params.set('smart', TSMART)
    if (FROM) params.set('from', FROM)
    if (TO) params.set('to', TO)
    if (LSMART) params.set('lsmart', LSMART)

    const glResp = await fetch(`${MCP_URL}/api/uat/gl-balance?${params.toString()}`)
    if (!glResp.ok) {
      const text = await glResp.text()
      throw new Error(`MCP gl-balance query failed: ${glResp.status} ${text}`)
    }
    const gl = await glResp.json()
    console.log(`\n🧮 GL Balance Summary: tx=${gl?.summary?.transactions || 0}, lines=${gl?.summary?.checkedLines || 0}, unbalanced=${gl?.summary?.unbalanced || 0}`)
    const rows = gl?.unbalanced || []
    if (rows.length) {
      console.log(`\n🔎 First ${Math.min(SAMPLE, rows.length)} unbalanced transactions:`)
      rows.slice(0, SAMPLE).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.transaction_code} ${r.transaction_date} debit=${r.total_debit} credit=${r.total_credit} diff=${r.diff}`)
      })
    } else {
      console.log('   ✅ All checked transactions balanced')
    }

  } else if (MODE === 'txdetail') {
    const params = new URLSearchParams({ organizationId: ORG_ID, limit: String(SAMPLE) })
    if (DTID) params.set('tid', DTID)
    if (DTCODE) params.set('tcode', DTCODE)
    if (DLSMART) params.set('lsmart', DLSMART)
    if (DGLTYPE) params.set('glType', DGLTYPE)

    const tdResp = await fetch(`${MCP_URL}/api/uat/transaction-detail?${params.toString()}`)
    if (!tdResp.ok) {
      const text = await tdResp.text()
      throw new Error(`MCP transaction-detail failed: ${tdResp.status} ${text}`)
    }
    const td = await tdResp.json()
    const header = td?.header
    const lines = td?.lines || []
    console.log(`\n🧾 Transaction: ${header?.transaction_code} (${header?.transaction_type}) ${header?.transaction_date}`)
    console.log(`   Smart: ${header?.smart_code || 'N/A'}  Total amount: ${header?.total_amount ?? 'N/A'}`)
    console.log(`   Lines: ${lines.length} | GL totals: debit=${td?.summary?.total_debit || 0} credit=${td?.summary?.total_credit || 0} diff=${td?.summary?.diff || 0}`)
    if (lines.length) {
      console.log(`\n🔎 First ${Math.min(SAMPLE, lines.length)} lines:`)
      lines.slice(0, SAMPLE).forEach((l, i) => {
        console.log(`   ${i + 1}. line=${l.line_no} gl=${l.gl_type || '-'} amount=${l.amount ?? '-'} smart=${l.smart_code || 'N/A'}`)
      })
    }

  // If entity filters provided, hit entities endpoint; else use inventory report
  } else if (MODE === 'lines') {
    const params = new URLSearchParams({ organizationId: ORG_ID, limit: String(SAMPLE) })
    if (LTID) params.set('tid', LTID)
    if (LTCODE) params.set('tcode', LTCODE)
    if (LTCODE_PREFIX) params.set('tcodePrefix', LTCODE_PREFIX)
    if (LSMART) params.set('smart', LSMART)
    if (LGLTYPE) params.set('glType', LGLTYPE)

    const lnResp = await fetch(`${MCP_URL}/api/uat/transaction-lines?${params.toString()}`)
    if (!lnResp.ok) {
      const text = await lnResp.text()
      throw new Error(`MCP transaction-lines query failed: ${lnResp.status} ${text}`)
    }
    const ln = await lnResp.json()
    const rows = ln?.data || []
    console.log(`\n🧾 Transaction lines (count): ${rows.length}`)
    if (rows.length) {
      console.log(`\n🔎 First ${Math.min(SAMPLE, rows.length)} lines:`)
      rows.slice(0, SAMPLE).forEach((l, i) => {
        console.log(`   ${i + 1}. tx=${l.transaction_id} line=${l.line_no} gl=${l.gl_type || '-'} amount=${l.amount ?? '-'} smart=${l.smart_code || 'N/A'}`)
      })
    }

  } else if (ENTITY_TYPE || SMART_PREFIX || CODE || CODE_PREFIX || NAME || NAME_PREFIX || MODE === 'entities') {
    const params = new URLSearchParams({
      organizationId: ORG_ID,
      limit: String(SAMPLE)
    })
    if (ENTITY_TYPE) params.set('type', ENTITY_TYPE)
    if (SMART_PREFIX) params.set('smart', SMART_PREFIX)
    if (CODE) params.set('code', CODE)
    if (CODE_PREFIX) params.set('codePrefix', CODE_PREFIX)
    if (NAME) params.set('name', NAME)
    if (NAME_PREFIX) params.set('namePrefix', NAME_PREFIX)

    const entResp = await fetch(`${MCP_URL}/api/uat/entities?${params.toString()}`)
    if (!entResp.ok) {
      const text = await entResp.text()
      throw new Error(`MCP entities query failed: ${entResp.status} ${text}`)
    }
    const ent = await entResp.json()
    const rows = ent?.data || []
    console.log(`\n📄 Entities (count): ${rows.length}`)
    if (rows.length) {
      console.log(`\n🔎 First ${Math.min(SAMPLE, rows.length)} entities:`)
      rows.slice(0, SAMPLE).forEach((e, i) => {
        console.log(`   ${i + 1}. [${e.entity_type}] ${e.entity_code} — ${e.entity_name} (${e.smart_code || 'N/A'})`)
      })
    }
  } else {
    // Use reports endpoint to fetch inventory (products)
    const invResp = await fetch(`${MCP_URL}/api/uat/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportType: 'inventory', organizationId: ORG_ID })
    })

    if (!invResp.ok) {
      const text = await invResp.text()
      throw new Error(`MCP inventory report failed: ${invResp.status} ${text}`)
    }

    const inv = await invResp.json()
    const products = inv?.report?.products || inv?.report?.data || []

    console.log(`\n📦 Inventory products (count): ${Array.isArray(products) ? products.length : 0}`)
    if (Array.isArray(products) && products.length) {
      console.log(`\n🔎 First ${Math.min(SAMPLE, products.length)} products:`)
      products.slice(0, SAMPLE).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.entity_code || p.code || '(no code)'} — ${p.entity_name || p.name || ''}`)
      })
    }
  }

  console.log('\n🎉 MCP-based read-only test completed.')
}

main().catch(err => {
  console.error('❌ MCP test failed:', err?.message || err)
  process.exit(1)
})
