#!/usr/bin/env node

// Relationships guardrail validator (lint + runtime checks via MCP)
// Exit codes:
// 0  -> OK
// 12 -> Missing organization_id (input or row)
// 13 -> Invalid smart code
// 14 -> Missing canonical IDs (from_entity_id/to_entity_id)
// 15 -> Schema drift attempt detected in SQL

import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const args = Object.fromEntries(process.argv.slice(2).map(kv => {
  const [k, ...rest] = kv.replace(/^--/, '').split('=')
  return [k, rest.join('=')]
}))

const MCP_URL = args.mcp || process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:3005'
const ORG_ID = args.org || process.env.DEFAULT_ORGANIZATION_ID || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
const TYPE = args.type || ''
const LIMIT = Math.min(parseInt(args.limit || '1000', 10) || 1000, 5000)
const SQL_PATHS = (args['lint-sql'] || '').split(',').filter(Boolean)
const SMART_REGEX = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/

const ALLOWED_REL_COLUMNS = new Set([
  'id','organization_id','from_entity_id','to_entity_id','relationship_type','relationship_direction',
  'smart_code','relationship_strength','relationship_data','business_logic','metadata','created_at','updated_at','created_by','updated_by'
])

function fail(code, msg) {
  console.error(msg)
  process.exit(code)
}

async function lintSQL(paths) {
  let driftFound = []
  for (const p of paths) {
    const full = path.resolve(p)
    if (!fs.existsSync(full)) continue
    const sql = fs.readFileSync(full, 'utf8')
    // Detect column additions on core_relationships
    const addColRegex = /ALTER\s+TABLE\s+"?core_relationships"?\s+ADD\s+COLUMN\s+"?([a-zA-Z0-9_]+)"?/gi
    let m
    while ((m = addColRegex.exec(sql)) !== null) {
      const col = (m[1] || '').toLowerCase()
      if (!ALLOWED_REL_COLUMNS.has(col)) {
        driftFound.push({ file: p, column: col })
      }
    }
    // Detect CREATE TABLE with non-allowed columns
    const createRegex = /CREATE\s+TABLE\s+"?core_relationships"?[\s\S]*?\(([^;]+)\);/gi
    let c
    while ((c = createRegex.exec(sql)) !== null) {
      const cols = c[1]
      const names = Array.from(cols.matchAll(/"?([a-zA-Z0-9_]+)"?\s+[A-Z]/g)).map(x => (x[1]||'').toLowerCase())
      for (const n of names) {
        if (!ALLOWED_REL_COLUMNS.has(n)) {
          driftFound.push({ file: p, column: n })
        }
      }
    }
  }
  if (driftFound.length) {
    console.error('❌ Schema drift detected in core_relationships:')
    for (const d of driftFound) console.error(`   ${d.file}: ${d.column}`)
    process.exit(15)
  }
}

async function validateRuntime() {
  if (!ORG_ID) fail(12, '❌ Missing organization_id (use --org or set DEFAULT_ORGANIZATION_ID)')
  // Health check
  try {
    const h = await fetch(`${MCP_URL}/health`).then(r => r.json())
    if (!h || !h.status) console.warn('⚠️ MCP health unknown')
  } catch (e) {
    console.warn('⚠️ MCP health check failed:', e?.message || e)
  }

  const params = new URLSearchParams({ organizationId: ORG_ID, limit: String(LIMIT) })
  if (TYPE) params.set('relationshipType', TYPE)
  const url = `${MCP_URL}/api/uat/relationships?${params.toString()}`
  let json
  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`HTTP ${resp.status}: ${text}`)
    }
    json = await resp.json()
  } catch (e) {
    fail(12, `❌ Relationships fetch failed: ${e?.message || e}`)
  }

  const rows = json?.data || []
  for (const r of rows) {
    if (!r.organization_id) fail(12, `❌ Missing organization_id in row ${r.id || ''}`)
    if (!r.from_entity_id || !r.to_entity_id) fail(14, `❌ Missing canonical IDs (from/to) in row ${r.id || ''}`)
    if (!r.relationship_type) fail(14, `❌ Missing relationship_type in row ${r.id || ''}`)
    if (!r.smart_code || !SMART_REGEX.test(r.smart_code)) fail(13, `❌ Invalid smart_code '${r.smart_code}' in row ${r.id || ''}`)
  }
  console.log(`✅ Relationships OK: ${rows.length} rows checked`)
}

(async () => {
  if (SQL_PATHS.length) await lintSQL(SQL_PATHS)
  await validateRuntime()
  process.exit(0)
})()

