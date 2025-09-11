#!/usr/bin/env node

// Read-only furniture module sanity check using default organization ID
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fetch from 'node-fetch'

// Load .env.local from project root for credentials (read-only)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env.local') })

// Simple CLI flags: --url=, --key=, --org=
const args = Object.fromEntries(process.argv.slice(2).map(kv => {
  const [k, ...rest] = kv.replace(/^--/, '').split('=')
  return [k, rest.join('=')]
}))

// Supabase credentials (flags override env)
const supabaseUrl = args.url || process.env.NEXT_PUBLIC_SUPABASE_URL
// Use anon key for read-only access
const supabaseKey = args.key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Default Furniture organization ID (read-only scope)
const FURNITURE_ORG_ID = args.org || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID

async function main() {
  console.log('🧪 Furniture module read-only test')
  console.log('='.repeat(52))
  console.log(`Organization ID: ${FURNITURE_ORG_ID}`)

  // 1) Basic connectivity and entities count
  console.log('\n1) Reading core_entities for org...')
  const { data: entities, error: entErr } = await supabase
    .from('core_entities')
    .select('id, entity_type, entity_code, entity_name, smart_code')
    .eq('organization_id', FURNITURE_ORG_ID)
    .limit(50)

  if (entErr) {
    console.error('   ⚠️ Supabase client read failed:', entErr)
    // REST fallback to surface HTTP error details (still read-only)
    const restLimit = Number.parseInt(args.sample || '20', 10) || 20
    const restUrl = `${supabaseUrl}/rest/v1/core_entities?select=id,entity_type,entity_code,entity_name,smart_code&organization_id=eq.${FURNITURE_ORG_ID}&limit=${restLimit}`
    try {
      const resp = await fetch(restUrl, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      })
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(`REST error ${resp.status}: ${text}`)
      }
      const restData = await resp.json()
      console.log(`   ✅ REST fallback retrieved ${restData.length} entities (showing up to ${restLimit})`)
      if (restData?.length && (args.dump || args.sample)) {
        const count = Number.parseInt(args.sample || '20', 10) || 20
        console.log(`\n   🔎 First ${Math.min(count, restData.length)} entity codes:`)
        restData.slice(0, count).forEach((e, i) => {
          console.log(`     ${i + 1}. ${e.entity_code} — ${e.entity_name}`)
        })
      }
    } catch (restErr) {
      throw new Error(`Failed to read core_entities: ${restErr?.message || restErr}`)
    }
  }
  console.log(`   ✅ Retrieved ${entities?.length ?? 0} entities (showing up to 50)`) 

  // Optional: dump first N entity codes (default 20)
  if ((entities?.length ?? 0) && (args.dump || args.sample)) {
    const count = Number.parseInt(args.sample || '20', 10) || 20
    console.log(`\n   🔎 First ${Math.min(count, entities.length)} entity codes:`)
    entities.slice(0, count).forEach((e, i) => {
      console.log(`     ${i + 1}. ${e.entity_code} — ${e.entity_name}`)
    })
  }

  // 2) Verify GL accounts exist
  console.log('\n2) Verifying GL accounts exist...')
  const gl = (entities || []).filter(e => e.entity_type === 'gl_account')
  console.log(`   ✅ Found ${gl.length} GL accounts in sample set`)
  if (gl.length) {
    console.log('   📊 Sample GL:')
    gl.slice(0, 5).forEach((a, i) => {
      console.log(`     ${i + 1}. ${a.entity_code} - ${a.entity_name}`)
    })
  }

  // 3) Check for furniture smart codes present in data
  console.log('\n3) Checking furniture smart codes present in entities...')
  const furnitureEntities = (entities || []).filter(
    e => typeof e.smart_code === 'string' && e.smart_code.startsWith('HERA.MANUFACTURING.FURNITURE.')
  )
  console.log(`   ✅ Entities with furniture smart codes in sample: ${furnitureEntities.length}`)
  if (furnitureEntities.length) {
    furnitureEntities.slice(0, 5).forEach((e, i) => {
      console.log(`     ${i + 1}. ${e.entity_type} - ${e.entity_code} (${e.smart_code})`)
    })
  }

  // 4) If nothing was found, list organizations to help pick correct org id
  if ((entities?.length ?? 0) === 0) {
    console.log('\n4) No data found; listing organizations (first 10)...')
    const { data: orgs, error: orgErr } = await supabase
      .from('core_organizations')
      .select('id, organization_name')
      .limit(10)
    if (orgErr) {
      console.log('   ⚠️  Unable to read organizations:', orgErr.message)
    } else {
      for (const o of orgs || []) {
        console.log(`   - ${o.organization_name} (${o.id})`)
      }
    }
  }

  console.log('\n📋 SUMMARY')
  console.log(`- Entities fetched: ${entities?.length ?? 0}`)
  console.log(`- GL accounts (sample): ${gl.length}`)
  console.log(`- Furniture smart-coded entities (sample): ${furnitureEntities.length}`)
  console.log('\n🎉 Read-only furniture check completed.')
}

main().catch(err => {
  console.error('❌ Read-only test failed:', err?.message || err)
  process.exit(1)
})
