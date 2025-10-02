const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixProductStatuses() {
  try {
    // First, let's check all products for the Hair Talkz organization
    const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

    console.log('\n=== Checking Products ===')
    const { data: allProducts, error: allError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, status')
      .eq('organization_id', orgId)
      .eq('entity_type', 'product')
      .order('entity_name')

    if (allError) {
      console.error('Error fetching products:', allError)
      return
    }

    console.log(`\nFound ${allProducts.length} total products:`)
    allProducts.forEach(p => {
      console.log(`  - ${p.entity_name} (${p.entity_code || 'no code'}): status = ${p.status === null ? 'NULL' : p.status}`)
    })

    // Count by status
    const activeCount = allProducts.filter(p => p.status === 'active').length
    const nullCount = allProducts.filter(p => p.status === null).length
    const archivedCount = allProducts.filter(p => p.status === 'archived').length

    console.log(`\nStatus Breakdown:`)
    console.log(`  - Active: ${activeCount}`)
    console.log(`  - NULL: ${nullCount}`)
    console.log(`  - Archived: ${archivedCount}`)

    // Update NULL statuses to 'active'
    if (nullCount > 0) {
      console.log(`\n=== Fixing ${nullCount} products with NULL status ===`)
      const { data: updated, error: updateError } = await supabase
        .from('core_entities')
        .update({ status: 'active' })
        .eq('organization_id', orgId)
        .eq('entity_type', 'product')
        .is('status', null)
        .select()

      if (updateError) {
        console.error('Error updating products:', updateError)
        return
      }

      console.log(`✅ Updated ${updated.length} products to status = 'active'`)
      updated.forEach(p => {
        console.log(`  - ${p.entity_name}`)
      })
    } else {
      console.log(`\n✅ All products already have valid status`)
    }

    // Verify final state
    console.log('\n=== Final Verification ===')
    const { data: finalProducts, error: finalError } = await supabase
      .from('core_entities')
      .select('id, entity_name, status')
      .eq('organization_id', orgId)
      .eq('entity_type', 'product')
      .order('entity_name')

    if (finalError) {
      console.error('Error in final check:', finalError)
      return
    }

    const finalActive = finalProducts.filter(p => p.status === 'active').length
    const finalNull = finalProducts.filter(p => p.status === null).length
    const finalArchived = finalProducts.filter(p => p.status === 'archived').length

    console.log(`Final status counts:`)
    console.log(`  - Active: ${finalActive}`)
    console.log(`  - NULL: ${finalNull}`)
    console.log(`  - Archived: ${finalArchived}`)

    if (finalNull === 0) {
      console.log(`\n✅ SUCCESS: All products now have valid status!`)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

fixProductStatuses()
