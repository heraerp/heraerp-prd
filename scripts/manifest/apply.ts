/*
 * HERA Enterprise Manifest v2 Apply
 * Applies manifest in order: extensions → settings → rls → partitioning → indexes → views/MVs → RPCs → triggers
 */

import { Client } from 'pg'
import fs from 'fs'
import path from 'path'

type Json = any

function getEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

async function execSql(pg: Client, sql: string) {
  await pg.query(sql)
}

async function execFile(pg: Client, filePath: string) {
  if (!fs.existsSync(filePath)) return
  const sql = fs.readFileSync(filePath, 'utf8')
  await execSql(pg, sql)
}

async function applyExtensions(pg: Client, manifest: Json) {
  for (const ext of manifest.extensions_allowed || []) {
    await execSql(pg, `CREATE EXTENSION IF NOT EXISTS ${ext}`)
  }
  await execFile(pg, path.join('db', 'enterprise', 'extensions.sql'))
}

async function applySettings(pg: Client, manifest: Json) {
  // Database-level settings are not standardized in manifest; rely on file
  await execFile(pg, path.join('db', 'enterprise', 'settings.sql'))
  // Role-scoped settings
  const se = manifest.settings_enforced || {}
  for (const [role, setconfig] of Object.entries(se)) {
    if (!Array.isArray(setconfig)) continue
    for (const s of setconfig as string[]) {
      if (!s) continue
      const [k, v] = s.split('=')
      if (k && v !== undefined) {
        const esc = String(v).replace(/'/g, "''")
        await execSql(pg, `ALTER ROLE ${role} SET ${k} = '${esc}'`)
      }
    }
  }
}

async function applyRls(pg: Client) {
  await execFile(pg, path.join('db', 'enterprise', 'rls.sql'))
}

async function applyPartitioning(pg: Client, manifest: Json) {
  await execFile(pg, path.join('db', 'enterprise', 'partitioning.sql'))
  // Optionally seed partitions for known orgs if provided in manifest
  const orgs: string[] = []
  try {
    const res = await pg.query(`select id from core_organizations limit 10`)
    for (const r of res.rows) orgs.push(r.id)
  } catch {}
  const start = `date_trunc('month', now())::date`
  for (const orgId of orgs) {
    await execSql(pg, `SELECT hera_ut_create_monthly_partitions('${orgId}', ${start}, 3)`) // next 3 months
    await execSql(pg, `SELECT hera_utl_create_monthly_partitions('${orgId}', ${start}, 3)`)
  }
}

async function applyIndexes(pg: Client, manifest: Json) {
  await execFile(pg, path.join('db', 'enterprise', 'indexes.sql'))
  for (const idx of manifest.objects_indices || []) {
    // indexdef already contains IF NOT EXISTS? enforce idempotency
    if (idx.indexdef && !idx.indexdef.includes('IF NOT EXISTS')) {
      const safe = idx.indexdef.replace('CREATE INDEX', 'CREATE INDEX IF NOT EXISTS')
      await execSql(pg, safe)
    } else if (idx.indexdef) {
      await execSql(pg, idx.indexdef)
    }
  }
}

async function applyViews(pg: Client, manifest: Json) {
  await execFile(pg, path.join('db', 'enterprise', 'views.sql'))
  // Additional views can be enforced here if manifest contains ddl
}

async function applyRpcs(pg: Client) {
  await execFile(pg, path.join('db', 'enterprise', 'rpc.sql'))
}

async function applyTriggers(pg: Client) {
  await execFile(pg, path.join('db', 'enterprise', 'triggers.sql'))
}

async function main() {
  const databaseUrl = getEnv('DATABASE_URL')
  const manifestPath = process.env.HERA_MANIFEST_IN || path.join('artifacts', 'manifest.v2.json')
  if (!fs.existsSync(manifestPath)) throw new Error(`Manifest not found: ${manifestPath}`)
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  const pg = new Client({ connectionString: databaseUrl })
  await pg.connect()
  try {
    await applyExtensions(pg, manifest)
    await applySettings(pg, manifest)
    await applyRls(pg)
    await applyPartitioning(pg, manifest)
    await applyIndexes(pg, manifest)
    await applyViews(pg, manifest)
    await applyRpcs(pg)
    await applyTriggers(pg)
    console.log('HERA enterprise manifest applied successfully')
  } finally {
    await pg.end()
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Apply failed:', err)
    process.exit(1)
  })
}
