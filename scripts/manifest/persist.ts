/*
 * HERA Enterprise Manifest v2 Persistence
 * Upserts a core_entities row with smart_code and attaches dynamic fields via hera_dynamic_data_set_v1
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

type Json = any

type UpsertResult = { success: boolean; data?: { id: string }; error?: string }

function getEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

async function upsertEntity(supabase: any, orgId: string, manifest: Json) {
  const smartCode = 'HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2'
  const { data, error } = await supabase.rpc('hera_entity_upsert_v1', {
    p_org_id: orgId,
    p_entity_type: 'platform_manifest',
    p_entity_name: 'Supabase DB Manifest v2',
    p_smart_code: smartCode,
    p_entity_code: `DB-MANIFEST-V2-${new Date().toISOString().slice(0, 10)}`
  })
  if (error) throw new Error(`Upsert failed: ${error.message || error}`)
  const id = data?.data?.id || data?.id || data?.data?.entity_id
  if (!id) throw new Error('Missing entity id in upsert response')
  return id as string
}

async function setField(
  supabase: any,
  orgId: string,
  entityId: string,
  field: string,
  type: 'text' | 'json',
  value: any
) {
  const payload = {
    p_organization_id: orgId,
    p_entity_id: entityId,
    p_field_name: field,
    p_field_type: type,
    p_field_value_text: type === 'text' ? String(value ?? '') : null,
    p_field_value_json: type === 'json' ? value : null,
    p_smart_code: 'HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2'
  }
  const { error } = await supabase.rpc('hera_dynamic_data_set_v1', payload)
  if (error) throw new Error(`Set field ${field} failed: ${error.message || error}`)
}

async function main() {
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
  const organizationId = getEnv('HERA_ORG_ID')
  const manifestPath = process.env.HERA_MANIFEST_IN || 'artifacts/manifest.v2.json'

  if (!fs.existsSync(manifestPath)) throw new Error(`Manifest not found: ${manifestPath}`)
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  const supabase = createClient(supabaseUrl, supabaseKey)
  const entityId = await upsertEntity(supabase, organizationId, manifest)

  const jsonFields = [
    'extensions_allowed',
    'settings_enforced',
    'roles_matrix',
    'backup_policy',
    'ha_policy',
    'objects_tables_core',
    'objects_views_allowed',
    'objects_indices',
    'objects_generated_columns',
    'objects_triggers_hera',
    'objects_rpc_hera',
    'objects_fdw',
    'policies_rls',
    'partitioning',
    'query_budget',
    'slo',
    'observability',
    'drills'
  ]

  for (const f of jsonFields) {
    await setField(supabase, organizationId, entityId, f, 'json', manifest[f])
  }

  if (manifest.ci_snapshot_sha) {
    await setField(supabase, organizationId, entityId, 'ci_snapshot_sha', 'text', manifest.ci_snapshot_sha)
  }
  if (manifest.guardrails_hash) {
    await setField(supabase, organizationId, entityId, 'guardrails_hash', 'text', manifest.guardrails_hash)
  }

  console.log(`Persisted manifest to core_entities ${entityId}`)
}

if (require.main === module) {
  main().catch(err => {
    console.error('Persist failed:', err)
    process.exit(1)
  })
}

