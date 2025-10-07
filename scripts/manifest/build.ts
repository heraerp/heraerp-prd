/*
 * HERA Enterprise Manifest v2 Builder
 * Smart Code: HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2
 * Introspects pg_catalog to produce a JSON manifest capturing enterprise posture.
 */

import { Client } from 'pg'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { execSync } from 'child_process'

type Json = any

type ManifestV2 = {
  smart_code: 'HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2'
  generated_at: string
  database: string
  extensions_allowed: string[]
  settings_enforced: Json
  roles_matrix: Json
  backup_policy: Json | null
  ha_policy: Json | null
  objects_tables_core: string[]
  objects_views_allowed: string[]
  objects_indices: Array<{ schemaname: string; tablename: string; indexname: string; indexdef: string }>
  objects_generated_columns: Array<{ schemaname: string; tablename: string; column_name: string; generation_expression: string }>
  objects_triggers_hera: Array<{ table: string; trigger: string; function: string }>
  objects_rpc_hera: Array<{ schema: string; name: string; args: string }>
  objects_fdw: Json
  policies_rls: Array<{ schemaname: string; tablename: string; policyname: string; cmd: string }>
  partitioning: Array<{ parent: string; strategy: string; subparts?: string[] }>
  query_budget: Json | null
  slo: Json | null
  observability: Json | null
  drills: Json | null
  ci_snapshot_sha: string | null
  guardrails_hash: string
}

const CORE_TABLES = ['core_organizations', 'core_entities', 'core_dynamic_data', 'core_relationships']

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] || fallback
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

async function q<T = any>(pg: Client, sql: string, params: any[] = []) {
  const res = await pg.query(sql, params)
  return res.rows as T[]
}

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

async function computeGuardrailsHash(pg: Client) {
  const cols = await q<{ table_name: string; column_name: string; data_type: string }>(
    pg,
    `select table_name, column_name, data_type
     from information_schema.columns
     where table_schema='public' and table_name = any($1)
     order by table_name, ordinal_position`,
    [CORE_TABLES]
  )
  const sig = cols.map(c => `${c.table_name}.${c.column_name}:${c.data_type}`).join('\n')
  return sha256(sig)
}

async function buildManifest(pg: Client): Promise<ManifestV2> {
  const database = (await q<{ datname: string }>(pg, 'select current_database() as datname'))[0]?.datname
  const extensions = await q<{ extname: string }>(pg, 'select extname from pg_extension order by 1')
  const views = await q<{ schemaname: string; viewname: string }>(
    pg,
    `select table_schema as schemaname, table_name as viewname
     from information_schema.views where table_schema='public' and table_name like 'hera_%' order by 1,2`
  )
  const indices = await q<{ schemaname: string; tablename: string; indexname: string; indexdef: string }>(
    pg,
    `select schemaname, tablename, indexname, indexdef
     from pg_indexes
     where schemaname='public' and (tablename like 'hera_%' or tablename = any($1))
     order by tablename, indexname`,
    [CORE_TABLES]
  )
  const genCols = await q<{
    schemaname: string
    tablename: string
    column_name: string
    generation_expression: string
  }>(
    pg,
    `select table_schema as schemaname, table_name as tablename, column_name, generation_expression
     from information_schema.columns
     where table_schema='public' and is_generated='ALWAYS'
     order by 1,2,3`
  )
  const triggers = await q<{ table: string; trigger: string; function: string }>(
    pg,
    `select c.relname as table, t.tgname as trigger, p.proname as function
     from pg_trigger t
     join pg_class c on c.oid=t.tgrelid
     join pg_proc p on p.oid=t.tgfoid
     join pg_namespace n on n.oid=c.relnamespace
     where t.tgisinternal = false and n.nspname='public' and t.tgname like 'hera_%'
     order by 1,2`
  )
  const rpcs = await q<{ schema: string; name: string; args: string }>(
    pg,
    `select n.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as args
     from pg_proc p
     join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname like 'hera_%'
     order by 1,2`
  )
  const policies = await q<{ schemaname: string; tablename: string; policyname: string; cmd: string }>(
    pg,
    `select schemaname, tablename, policyname, cmd from pg_policies
     where schemaname='public' and tablename = any($1)
     order by tablename, policyname`,
    [CORE_TABLES]
  )
  const partitioning = await q<{ parent: string; strategy: string }>(
    pg,
    `select c.relname as parent,
            case part.strat when 'l' then 'LIST' when 'r' then 'RANGE' when 'h' then 'HASH' else part.strat end as strategy
     from pg_partitioned_table part
     join pg_class c on c.oid=part.partrelid
     join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and c.relname like 'hera_%'
     order by 1`
  )
  const roleSettings = await q<{ rolname: string; setconfig: string[] }>(
    pg,
    `select r.rolname, coalesce(s.setconfig, '{}') as setconfig
     from pg_roles r
     left join pg_db_role_setting s on s.setrole = r.oid and (s.setdatabase = 0 or s.setdatabase = (select oid from pg_database where datname=current_database()))
     where r.rolname in ('anon','authenticated','service_role','postgres')
     order by 1`
  )
  const roleMembers = await q<{ role: string; member: string }>(
    pg,
    `select r.rolname as role, m.rolname as member
     from pg_auth_members am
     join pg_roles r on r.oid = am.roleid
     join pg_roles m on m.oid = am.member
     order by 1,2`
  )
  const fdw = await q(pg, `select srvname, srvoptions from pg_foreign_server order by 1`)

  let ciSha: string | null = process.env.GITHUB_SHA || null
  if (!ciSha) {
    try {
      ciSha = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch {}
  }

  const guardHash = await computeGuardrailsHash(pg)

  const settingsEnforced: Record<string, any> = {}
  for (const rs of roleSettings) settingsEnforced[rs.rolname] = rs.setconfig

  return {
    smart_code: 'HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2',
    generated_at: new Date().toISOString(),
    database,
    extensions_allowed: extensions.map(e => e.extname),
    settings_enforced: settingsEnforced,
    roles_matrix: { memberships: roleMembers },
    backup_policy: null,
    ha_policy: null,
    objects_tables_core: CORE_TABLES,
    objects_views_allowed: views.map(v => v.viewname),
    objects_indices: indices,
    objects_generated_columns: genCols,
    objects_triggers_hera: triggers,
    objects_rpc_hera: rpcs,
    objects_fdw: fdw,
    policies_rls: policies,
    partitioning: partitioning.map(p => ({ parent: p.parent, strategy: p.strategy })),
    query_budget: null,
    slo: null,
    observability: { views: ['hera_observability_top_queries'] },
    drills: null,
    ci_snapshot_sha: ciSha,
    guardrails_hash: guardHash
  }
}

async function main() {
  const databaseUrl = getEnv('DATABASE_URL')
  const outDir = process.env.HERA_OUT_DIR || 'artifacts'
  const outFile = process.env.HERA_MANIFEST_OUT || path.join(outDir, 'manifest.v2.json')

  const pg = new Client({ connectionString: databaseUrl })
  await pg.connect()
  try {
    const manifest = await buildManifest(pg)
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), 'utf8')
    // Also echo compact summary for logs
    console.log(`HERA Manifest v2 written to ${outFile}`)
    console.log(`Extensions: ${manifest.extensions_allowed.join(', ')}`)
    console.log(`Views: ${manifest.objects_views_allowed.join(', ')}`)
  } finally {
    await pg.end()
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Manifest build failed:', err)
    process.exit(1)
  })
}

export { buildManifest }

