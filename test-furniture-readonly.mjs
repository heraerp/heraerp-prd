#!/usr/bin/env node

// Read-only furniture module sanity check using default organization ID
import { createClient } from '@supabase/supabase-js'

// Supabase credentials (reuse same project as other tests)
const supabaseUrl = 'https://uirruxpfideciqubwhmp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcnJ1eHBmaWRlY2lxdWJ3aG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NDY1MjEsImV4cCI6MjA0NzQyMjUyMX0.LhBPAE9oBsjq80kBhOxHp7ByIy6vgQg4-3FPR5kRrLo'
const supabase = createClient(supabaseUrl, supabaseKey)

// Default Furniture organization ID (read-only scope)
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

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

  if (entErr) throw new Error(`Failed to read core_entities: ${entErr.message}`)
  console.log(`   ✅ Retrieved ${entities?.length ?? 0} entities (showing up to 50)`) 

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

