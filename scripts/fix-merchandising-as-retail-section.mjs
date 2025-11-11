#!/usr/bin/env node
/**
 * Fix merchandising to be a section under retail domain (not a separate domain)
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLATFORM_ORG = '00000000-0000-0000-0000-000000000000'

async function fixMerchandisingAsRetailSection() {
  console.log('🔧 Fixing merchandising to be a section under retail...')
  
  try {
    // 1. Delete the separate merchandising domain
    console.log('🗑️ Removing separate merchandising domain...')
    const { error: deleteDomainError } = await supabase
      .from('core_entities')
      .delete()
      .eq('entity_type', 'APP_DOMAIN')
      .eq('entity_code', 'NAV-DOM-MERCHANDISING')
    
    if (deleteDomainError) {
      console.error('❌ Error deleting merchandising domain:', deleteDomainError)
    } else {
      console.log('✅ Removed merchandising domain')
    }
    
    // 2. Delete the existing merchandising sections 
    console.log('🗑️ Removing existing merchandising sections...')
    const { error: deleteSectionsError } = await supabase
      .from('core_entities')
      .delete()
      .eq('entity_type', 'APP_SECTION')
      .in('entity_code', ['NAV-SEC-MERCHANDISING-CATALOG', 'NAV-SEC-MERCHANDISING-PRICING', 'NAV-SEC-MERCHANDISING-PROMOTIONS'])
    
    if (deleteSectionsError) {
      console.error('❌ Error deleting merchandising sections:', deleteSectionsError)
    } else {
      console.log('✅ Removed merchandising sections')
    }
    
    // 3. Add merchandising as a section under retail domain
    console.log('➕ Adding merchandising as a retail section...')
    
    const { data: retailSectionResult, error: retailSectionError } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'APP_SECTION',
        entity_code: 'NAV-SEC-RETAIL-MERCHANDISING',
        entity_name: 'Merchandising',
        smart_code: 'HERA.PLATFORM.NAV.APPSECTION.RETAIL.MERCHANDISING.v1',
        organization_id: PLATFORM_ORG,
        metadata: {
          domain: 'retail',
          slug: 'merchandising',
          subtitle: 'Product catalog, pricing & promotions',
          icon: 'tags',
          color: '#F59E0B',
          persona_label: 'Merchandiser',
          visible_roles: ['merchandiser', 'manager'],
          route: '/apps/retail/merchandising',
          order: 5
        }
      })
      .select()
    
    if (retailSectionError) {
      console.error('❌ Error creating retail merchandising section:', retailSectionError)
      return
    }
    
    console.log('✅ Created merchandising section under retail')
    
    // 4. Verify the fix
    const { data: verifyData, error: verifyError } = await supabase
      .from('core_entities')
      .select('entity_type, entity_name, entity_code, metadata->domain as domain')
      .eq('organization_id', PLATFORM_ORG)
      .eq('entity_type', 'APP_SECTION')
      .contains('metadata', { domain: 'retail' })
      .order('metadata->order')
    
    if (verifyError) {
      console.error('❌ Error verifying:', verifyError)
      return
    }
    
    console.log('🔍 Retail sections now:')
    verifyData.forEach(section => {
      console.log(`  - ${section.entity_name} (${section.entity_code})`)
    })
    
    console.log('🎉 Fixed! Now merchandising is a section under retail.')
    console.log('📍 URL: http://localhost:3000/apps/retail (will show merchandising as a tile)')
    console.log('📍 Route: /apps/retail/merchandising (clicking the tile will go here)')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixMerchandisingAsRetailSection()