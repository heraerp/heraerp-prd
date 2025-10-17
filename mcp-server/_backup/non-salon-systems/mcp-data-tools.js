#!/usr/bin/env node

/**
 * HERA MCP Data Tools
 * Option A: 2 tools — hera.select (universal, read-only) + hera.report.run (pre-registered report)
 * Smart Code: HERA.MCP.DATA.TOOLS.v1
 */

const { Client } = require('pg')

const MAX_LIMIT = 1000
const DEFAULT_LIMIT = 50
const STMT_TIMEOUT_MS = 3000

function getOrgId() {
  // Server must inject the org at runtime (do NOT trust model input)
  const org = process.env.HERA_ORG_ID || process.env.DEFAULT_ORGANIZATION_ID
  if (!org) throw new Error('ORG_CONTEXT_MISSING: Set HERA_ORG_ID/DEFAULT_ORGANIZATION_ID')
  return org
}

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL missing for read operations')
  const client = new Client({ connectionString: url, statement_timeout: STMT_TIMEOUT_MS })
  return client
}

// Whitelists
const TABLES = {
  core_entities: {
    columns: new Set(['id', 'organization_id', 'entity_type', 'entity_code', 'entity_name', 'smart_code', 'status', 'created_at', 'updated_at']),
    filters: {
      entity_type: { col: 'entity_type', ops: ['eq', 'in'] },
      entity_code: { col: 'entity_code', ops: ['eq', 'in', 'like'] },
      entity_name: { col: 'entity_name', ops: ['eq', 'like'] },
      smart_code: { col: 'smart_code', ops: ['eq', 'in', 'like'] },
      status: { col: 'status', ops: ['eq', 'in'] },
      created_at: { col: 'created_at', ops: ['eq', 'gte', 'lte', 'between'] },
    },
  },
  core_relationships: {
    columns: new Set(['id', 'organization_id', 'parent_entity_id', 'child_entity_id', 'relationship_type', 'smart_code', 'is_active', 'effective_from', 'effective_to', 'created_at']),
    filters: {
      relationship_type: { col: 'relationship_type', ops: ['eq', 'in'] },
      from_entity_id: { col: 'parent_entity_id', ops: ['eq', 'in'] },
      to_entity_id: { col: 'child_entity_id', ops: ['eq', 'in'] },
      status: { col: 'is_active', ops: ['eq'] },
    },
  },
  core_dynamic_data: {
    columns: new Set(['id', 'organization_id', 'entity_id', 'key', 'value_type', 'value_text', 'value_number', 'value_boolean', 'value_date', 'value_json', 'created_at']),
    filters: {
      entity_id: { col: 'entity_id', ops: ['eq', 'in'] },
      key: { col: 'key', ops: ['eq', 'in', 'like'] },
      value_type: { col: 'value_type', ops: ['eq', 'in'] },
    },
  },
  universal_transactions: {
    columns: new Set(['id', 'organization_id', 'transaction_type', 'transaction_number', 'transaction_date', 'status', 'total_amount', 'currency_code', 'smart_code', 'description', 'metadata', 'created_at', 'updated_at']),
    filters: {
      transaction_type: { col: 'transaction_type', ops: ['eq', 'in'] },
      transaction_number: { col: 'transaction_number', ops: ['eq', 'in', 'like'] },
      transaction_date: { col: 'transaction_date', ops: ['eq', 'gte', 'lte', 'between'] },
      status: { col: 'status', ops: ['eq', 'in'] },
      currency_code: { col: 'currency_code', ops: ['eq', 'in'] },
      smart_code: { col: 'smart_code', ops: ['eq', 'in', 'like'] },
      total_amount: { col: 'total_amount', ops: ['eq', 'gte', 'lte', 'between'] },
    },
  },
  universal_transaction_lines: {
    columns: new Set(['id', 'organization_id', 'transaction_id', 'line_number', 'line_type', 'line_entity_id', 'quantity', 'unit_of_measure', 'unit_price', 'line_amount', 'smart_code', 'metadata', 'created_at']),
    filters: {
      transaction_id: { col: 'transaction_id', ops: ['eq', 'in'] },
      line_type: { col: 'line_type', ops: ['eq', 'in'] },
      entity_id: { col: 'line_entity_id', ops: ['eq', 'in'] },
      unit_of_measure: { col: 'unit_of_measure', ops: ['eq', 'in'] },
    },
  },
}

function compileOneFilter(rule, value, where, params, pIndexRef) {
  const col = rule.col
  // Support simple value shorthand as eq
  const spec = value != null && typeof value === 'object' && !Array.isArray(value) ? value : { eq: value }
  for (const [op, val] of Object.entries(spec)) {
    if (!rule.ops.includes(op)) continue
    switch (op) {
      case 'eq':
        where.push(`${col} = $${pIndexRef.i}`); params.push(val); pIndexRef.i++; break
      case 'in':
        where.push(`${col} = ANY($${pIndexRef.i})`); params.push(val); pIndexRef.i++; break
      case 'like':
        where.push(`${col} ILIKE $${pIndexRef.i}`); params.push(val); pIndexRef.i++; break
      case 'gte':
        where.push(`${col} >= $${pIndexRef.i}`); params.push(val); pIndexRef.i++; break
      case 'lte':
        where.push(`${col} <= $${pIndexRef.i}`); params.push(val); pIndexRef.i++; break
      case 'between':
        if (Array.isArray(val) && val.length === 2) {
          where.push(`${col} BETWEEN $${pIndexRef.i} AND $${pIndexRef.i + 1}`); params.push(val[0], val[1]); pIndexRef.i += 2
        }
        break
      case 'is_null':
        where.push(`${col} IS ${val ? '' : 'NOT '}NULL`)
        break
      default:
        break
    }
  }
}

function buildSelect({ table, columns = [], filters = {}, order_by = [], limit = DEFAULT_LIMIT, offset = 0 }) {
  if (!TABLES[table]) throw new Error('TABLE_NOT_ALLOWED')
  const whitelist = TABLES[table]
  const cols = (columns && columns.length ? columns : ['*']).filter((c) => c === '*' || whitelist.columns.has(c))
  if (!cols.length) throw new Error('NO_VALID_COLUMNS')
  const selects = cols.join(', ')

  const where = ['organization_id = $1']
  const params = [getOrgId()]
  const pIndexRef = { i: 2 }
  for (const [k, v] of Object.entries(filters || {})) {
    const rule = whitelist.filters[k]
    if (!rule) continue
    compileOneFilter(rule, v, where, params, pIndexRef)
  }

  const order = []
  for (const ob of order_by || []) {
    if (!ob || !whitelist.columns.has(ob.column)) continue
    const dir = (ob.direction || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC'
    order.push(`${ob.column} ${dir}`)
  }

  const lim = Math.max(1, Math.min(MAX_LIMIT, Number(limit || DEFAULT_LIMIT)))
  const off = Math.max(0, Number(offset || 0))

  const sql = `SELECT ${selects}\nFROM ${table}\nWHERE ${where.join(' AND ')}\n${order.length ? 'ORDER BY ' + order.join(', ') : ''}\nLIMIT ${lim} OFFSET ${off}`
  return { sql, params, lim, off, allowed_columns: Array.from(whitelist.columns), allowed_filters: Object.keys(whitelist.filters) }
}

async function fetchDisplayLabels(client, orgId) {
  const q = `SELECT ce.entity_code AS type_code,
                    (cr.relationship_data->>'locale') AS locale,
                    (cr.relationship_data->>'singular') AS singular,
                    (cr.relationship_data->>'plural') AS plural
             FROM core_relationships cr
             JOIN core_entities ce ON ce.id = cr.child_entity_id AND ce.organization_id = cr.organization_id
             WHERE cr.organization_id = $1 AND cr.relationship_type = 'DISPLAY_LABEL_FOR_TYPE'`
  const lr = await client.query(q, [orgId])
  const map = {}
  for (const r of lr.rows) {
    if (!map[r.type_code]) map[r.type_code] = {}
    const loc = r.locale || 'default'
    map[r.type_code][loc] = { singular: r.singular, plural: r.plural }
  }
  return map
}

async function execSelect(built, embed = {}) {
  const client = getDb()
  await client.connect()
  try {
    const t0 = Date.now()
    const res = await client.query(built.sql, built.params)
    let rows = res.rows
    const meta = { count: rows.length, limit: built.lim, offset: built.off, duration_ms: Date.now() - t0, sql: built.sql, allowed_columns: built.allowed_columns, allowed_filters: built.allowed_filters }
    // Embeds: convenience follow-up queries with the same org scope
    if (embed && embed.lines_for_transactions && rows.length) {
      const txIds = rows.map((r) => r.id).filter(Boolean)
      if (txIds.length) {
        const q = `SELECT * FROM universal_transaction_lines WHERE organization_id = $1 AND transaction_id = ANY($2)`
        const lr = await client.query(q, [built.params[0], txIds])
        meta.lines = { count: lr.rowCount }
        rows = rows.map((r) => ({ ...r, lines: lr.rows.filter((l) => l.transaction_id === r.id) }))
      }
    }
    if (embed && embed.entity_dynamic_data && rows.length && rows[0].id && built.sql.includes('FROM core_entities')) {
      const entityIds = rows.map((r) => r.id).filter(Boolean)
      if (entityIds.length) {
        const q = `SELECT * FROM core_dynamic_data WHERE organization_id = $1 AND entity_id = ANY($2)`
        const dr = await client.query(q, [built.params[0], entityIds])
        meta.dynamic_data = { count: dr.rowCount }
        // Convert per-entity rows to {key: typed_value}
        const ddByEntity = new Map()
        for (const d of dr.rows) {
          let val = null
          switch (d.value_type) {
            case 'text': val = d.value_text; break
            case 'number': val = d.value_number; break
            case 'boolean': val = d.value_boolean; break
            case 'date': val = d.value_date; break
            case 'json': val = d.value_json; break
            default: val = null
          }
          const m = ddByEntity.get(d.entity_id) || {}
          m[d.key] = val
          ddByEntity.set(d.entity_id, m)
        }
        rows = rows.map((r) => ({ ...r, dynamic_data: ddByEntity.get(r.id) || {} }))
      }
    }
    // Display labels per organization (optional helper)
    if (embed && embed.display_labels) {
      meta.display_labels = await fetchDisplayLabels(client, built.params[0])
    }
    return { rows, meta }
  } finally {
    await client.end()
  }
}

// Pre-registered reports (SELECT-only, parameterized)
const REPORTS = {
  // 1) Daily revenue by currency
  'HERA.REPORT.SALES.DAILY.v1': {
    sql: `SELECT transaction_date::date as day, currency_code, COUNT(*) as txn_count, SUM(total_amount) as total_amount
          FROM universal_transactions
          WHERE organization_id = $1 AND status = 'posted' AND transaction_date BETWEEN $2 AND $3
          GROUP BY day, currency_code
          ORDER BY day DESC`,
    params: ['from', 'to'],
  },

  // 2) Revenue by stylist (service worker)
  // Convention: service lines carry metadata.worker_id = UUID of staff entity (core_entities)
  'HERA.REPORT.SALES.REVENUE_BY_STYLIST.v1': {
    sql: `SELECT
            t.transaction_date::date AS day,
            w.id AS worker_id,
            w.entity_name AS worker_name,
            COUNT(*) AS line_count,
            SUM(l.line_amount) AS revenue
          FROM universal_transaction_lines l
          JOIN universal_transactions t ON t.id = l.transaction_id AND t.organization_id = $1
          LEFT JOIN core_entities w ON w.id = (l.metadata->>'worker_id')::uuid AND w.organization_id = $1
          WHERE l.organization_id = $1
            AND l.line_type = 'service'
            AND t.status = 'posted'
            AND t.transaction_date BETWEEN $2 AND $3
          GROUP BY day, worker_id, worker_name
          ORDER BY day DESC, revenue DESC`,
    params: ['from', 'to'],
  },

  // 3) Accounts Receivable aging (simple)
  // Uses total_amount as outstanding for open statuses, or metadata.outstanding_amount if present.
  'HERA.REPORT.AR.AGING.v1': {
    sql: `SELECT
            t.transaction_number,
            t.reference_entity_id AS customer_id,
            c.entity_name AS customer_name,
            t.currency_code,
            t.total_amount AS amount,
            COALESCE((t.metadata->>'outstanding_amount')::numeric, t.total_amount) AS outstanding_amount,
            t.due_date::date AS due_date,
            GREATEST(0, (CURRENT_DATE - t.due_date::date)) AS days_past_due,
            CASE
              WHEN CURRENT_DATE <= t.due_date::date THEN 'current'
              WHEN CURRENT_DATE - t.due_date::date <= 30 THEN '1-30'
              WHEN CURRENT_DATE - t.due_date::date <= 60 THEN '31-60'
              WHEN CURRENT_DATE - t.due_date::date <= 90 THEN '61-90'
              ELSE '90+'
            END AS bucket
          FROM universal_transactions t
          LEFT JOIN core_entities c ON c.id = t.reference_entity_id AND c.organization_id = $1
          WHERE t.organization_id = $1
            AND t.transaction_type = 'ar_invoice'
            AND t.transaction_date <= $2
            AND t.status IN ('pending','confirmed','approved','posted')
          ORDER BY customer_name NULLS LAST, t.due_date`,
    params: ['as_of'],
  },

  // 4) Inventory on hand as of date (by item)
  // Convention: item lines carry metadata.movement = 'IN'|'OUT' and quantity is positive.
  'HERA.REPORT.INVENTORY.ON_HAND.v1': {
    sql: `SELECT
            i.id AS item_id,
            i.entity_name AS item_name,
            SUM(CASE WHEN COALESCE(l.metadata->>'movement','OUT') = 'IN' THEN l.quantity ELSE -l.quantity END) AS qty_on_hand
          FROM universal_transaction_lines l
          JOIN universal_transactions t ON t.id = l.transaction_id AND t.organization_id = $1
          LEFT JOIN core_entities i ON i.id = l.line_entity_id AND i.organization_id = $1
          WHERE l.organization_id = $1
            AND l.line_type = 'item'
            AND t.transaction_date <= $2
          GROUP BY i.id, i.entity_name
          ORDER BY item_name`,
    params: ['as_of'],
  },

  // 5) Top items by revenue in range
  'HERA.REPORT.SALES.TOP_ITEMS.v1': {
    sql: `SELECT
            i.id AS item_id,
            i.entity_name AS item_name,
            SUM(l.line_amount) AS revenue,
            SUM(l.quantity) AS qty
          FROM universal_transaction_lines l
          JOIN universal_transactions t ON t.id = l.transaction_id AND t.organization_id = $1
          LEFT JOIN core_entities i ON i.id = l.line_entity_id AND i.organization_id = $1
          WHERE l.organization_id = $1
            AND l.line_type = 'item'
            AND t.status = 'posted'
            AND t.transaction_date BETWEEN $2 AND $3
          GROUP BY i.id, i.entity_name
          ORDER BY revenue DESC
          LIMIT $4`,
    params: ['from', 'to', 'limit'],
  },
}

function isSafeSelect(sql) {
  const s = String(sql || '').trim().toLowerCase()
  return s.startsWith('select') && !/\b(insert|update|delete|drop|alter|create)\b/.test(s)
}

async function runReport({ report_code, params = {}, format = 'json', display_labels = false }) {
  const def = REPORTS[report_code]
  if (!def) throw new Error('REPORT_NOT_FOUND')
  if (!isSafeSelect(def.sql) || !def.sql.includes('organization_id = $1')) throw new Error('REPORT_UNSAFE_SQL')
  const org = getOrgId()
  const values = [org]
  for (const key of def.params || []) values.push(params[key])
  const client = getDb()
  await client.connect()
  try {
    const res = await client.query(def.sql, values)
    let labels = undefined
    if (display_labels) {
      labels = await fetchDisplayLabels(client, org)
    }
    if (format === 'csv') {
      const header = res.fields.map((f) => f.name).join(',')
      const lines = res.rows.map((r) => res.fields.map((f) => JSON.stringify(r[f.name] ?? '')).join(',')).join('\n')
      return { format: 'csv', data: header + '\n' + lines, meta: { rows: res.rowCount, display_labels: labels }, explain: { sql: def.sql, params: values } }
    }
    return { format: 'json', data: res.rows, meta: { rows: res.rowCount, display_labels: labels }, explain: { sql: def.sql, params: values } }
  } finally {
    await client.end()
  }
}

const TOOLS = {
  'hera.select': {
    description: 'Read-only, org-scoped, parameterized SELECT against Sacred Six.',
    parameters: {
      table: { type: 'string', enum: Object.keys(TABLES) },
      columns: { type: 'array' },
      filters: { type: 'object' },
      order_by: { type: 'array' },
      limit: { type: 'number' },
      offset: { type: 'number' },
      embed: { type: 'object' },
    },
    handler: async (params) => {
      const built = buildSelect(params || {})
      const out = await execSelect(built, params.embed || {})
      return { exit_code: 0, ...out }
    },
  },
  'hera.report.run': {
    description: 'Run a pre-registered read-only report by smart_code',
    parameters: {
      report_code: { type: 'string' },
      params: { type: 'object' },
      format: { type: 'string', enum: ['json', 'csv'] },
      display_labels: { type: 'boolean' },
    },
    handler: async (params) => {
      const out = await runReport(params || {})
      return { exit_code: 0, ...out }
    },
  },
  'hera.labels.get': {
    description: 'Return per-type display labels (singular/plural) grouped by locale',
    parameters: {
      locale: { type: 'string' },
    },
    handler: async ({ locale }) => {
      const client = getDb()
      await client.connect()
      try {
        const org = getOrgId()
        const map = await fetchDisplayLabels(client, org)
        if (locale) {
          const filtered = {}
          for (const [typeCode, locs] of Object.entries(map)) {
            if (locs[locale]) filtered[typeCode] = locs[locale]
          }
          return { exit_code: 0, labels: filtered, locale }
        }
        return { exit_code: 0, labels: map }
      } finally {
        await client.end()
      }
    },
  },
}

async function handleMCPRequest(tool, params) {
  const t = TOOLS[tool]
  if (!t) return { error: 'UNKNOWN_TOOL', tools: Object.keys(TOOLS) }
  try {
    return await t.handler(params || {})
  } catch (e) {
    return { exit_code: 1, error: String(e.message || e) }
  }
}

module.exports = { MCP_DATA_TOOLS: TOOLS, handleMCPRequest }

// CLI smoke tests
if (require.main === module) {
  const [tool, paramsJson] = process.argv.slice(2)
  const params = paramsJson ? JSON.parse(paramsJson) : {}
  handleMCPRequest(tool, params).then((r) => console.log(JSON.stringify(r, null, 2))).catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
