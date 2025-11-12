#!/usr/bin/env node
/**
 * Migrate navigation data from tenant organization to platform organization
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'
const OLD_TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function migrateNavigationToPlatform() {
  console.log('🔄 Migrating navigation data to platform organization...')
  
  try {
    // 1. Delete old navigation data from tenant org
    console.log('🗑️ Cleaning up old navigation data from tenant org...')
    
    // Delete old merchandising navigation data (both old format and new format)
    const { error: deleteOldDomainError } = await supabase
      .from('core_entities')
      .delete()
      .in('entity_type', ['domain', 'APP_DOMAIN'])
      .or('entity_code.eq.MERCHANDISING,entity_code.eq.NAV-DOM-MERCHANDISING')
    
    // Delete old merchandising sections
    const { error: deleteOldSectionsError } = await supabase
      .from('core_entities')
      .delete()
      .in('entity_type', ['section', 'APP_SECTION'])
      .contains('metadata', { domain: 'merchandising' })
    
    if (deleteOldDomainError || deleteOldSectionsError) {
      console.error('❌ Error deleting old data:', deleteOldDomainError || deleteOldSectionsError)
      // Continue anyway - migration is more important than cleanup
    }
    
    console.log('✅ Cleaned up old navigation data')
    
    // 2. Create new navigation data in platform org
    console.log('🌱 Creating navigation data in platform organization...')
    
    // Create the merchandising domain entity (APP_DOMAIN)
    const domainResult = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'APP_DOMAIN',
        entity_code: 'NAV-DOM-MERCHANDISING',
        entity_name: 'Merchandise & Pricing',
        smart_code: 'HERA.PLATFORM.NAV.APPDOMAIN.MERCHANDISING.v1',
        organization_id: PLATFORM_ORGANIZATION_ID,
        metadata: {
          slug: 'merchandising',
          subtitle: 'Product Catalog & Pricing',
          color: '#F59E0B',
          icon: 'box'
        }
      })
    
    if (domainResult.error) {
      console.error('❌ Error creating platform domain:', domainResult.error)
      return
    }
    
    // Create the merchandising sections (APP_SECTION)
    const sections = [
      {
        entity_type: 'APP_SECTION',
        entity_code: 'NAV-SEC-MERCHANDISING-CATALOG',
        entity_name: 'Product Catalog',
        smart_code: 'HERA.PLATFORM.NAV.APPSECTION.MERCHANDISING.CATALOG.v1',
        organization_id: PLATFORM_ORGANIZATION_ID,
        metadata: {
          domain: 'merchandising',
          slug: 'catalog',
          subtitle: 'Product information management',
          icon: 'box',
          color: '#0EA5E9',
          persona_label: 'Merchandiser',
          visible_roles: ['merchandiser'],
          route: '/retail/merchandising/catalog',
          order: 1
        }
      },
      {
        entity_type: 'APP_SECTION',
        entity_code: 'NAV-SEC-MERCHANDISING-PRICING',
        entity_name: 'Price Management',
        smart_code: 'HERA.PLATFORM.NAV.APPSECTION.MERCHANDISING.PRICING.v1',
        organization_id: PLATFORM_ORGANIZATION_ID,
        metadata: {
          domain: 'merchandising',
          slug: 'pricing',
          subtitle: 'Pricing strategies & promotions',
          icon: 'tags',
          color: '#EF4444',
          persona_label: 'Pricing Manager',
          visible_roles: ['pricing_manager'],
          route: '/retail/merchandising/pricing',
          order: 2
        }
      },
      {
        entity_type: 'APP_SECTION',
        entity_code: 'NAV-SEC-MERCHANDISING-PROMOTIONS',
        entity_name: 'Promotions',
        smart_code: 'HERA.PLATFORM.NAV.APPSECTION.MERCHANDISING.PROMOTIONS.v1',
        organization_id: PLATFORM_ORGANIZATION_ID,
        metadata: {
          domain: 'merchandising',
          slug: 'promotions',
          subtitle: 'Campaign & discount management',
          icon: 'sparkles',
          color: '#10B981',
          persona_label: 'Marketing Manager',
          visible_roles: ['marketing_manager'],
          route: '/retail/merchandising/promotions',
          order: 3
        }
      }
    ]
    
    const sectionsResult = await supabase
      .from('core_entities')
      .insert(sections)
    
    if (sectionsResult.error) {
      console.error('❌ Error creating platform sections:', sectionsResult.error)
      return
    }
    
    console.log('✅ Created domain and 3 sections in platform organization')
    
    // 3. Verify the migration
    const { data: verifyData, error: verifyError } = await supabase
      .from('core_entities')
      .select('entity_type, entity_name, entity_code, organization_id')
      .eq('organization_id', PLATFORM_ORGANIZATION_ID)
      .in('entity_type', ['domain', 'section'])
      .or('entity_code.eq.MERCHANDISING')
    
    if (verifyError) {
      console.error('❌ Error verifying migration:', verifyError)
      return
    }
    
    console.log('🔍 Verification: Found', verifyData.length, 'navigation entities in platform org')
    verifyData.forEach(entity => {
      console.log(`  - ${entity.entity_type}: ${entity.entity_name} (${entity.entity_code}) [${entity.organization_id}]`)
    })
    
    console.log('🎉 Navigation data migrated to platform organization successfully!')
    console.log('🌐 Platform organization ID:', PLATFORM_ORGANIZATION_ID)
    
  } catch (error) {
    console.error('❌ Migration error:', error)
  }
}

migrateNavigationToPlatform()