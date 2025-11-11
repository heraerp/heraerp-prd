#!/usr/bin/env node
/**
 * Seed Merchandising Navigation Data to Supabase
 * Populates core_entities with domain and section entities for merchandising
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Platform organization ID for navigation structure
const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'

async function seedMerchandisingNavigation() {
  console.log('🌱 Seeding merchandising navigation data...')
  
  try {
    // 1. Create the merchandising domain entity
    const domainResult = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'domain',
        entity_code: 'MERCHANDISING',
        entity_name: 'Merchandise & Pricing',
        smart_code: 'HERA.RETAIL.DOMAIN.ENTITY.MERCHANDISING.v1',
        organization_id: PLATFORM_ORGANIZATION_ID,
        metadata: {
          slug: 'merchandising',
          subtitle: 'Product Catalog & Pricing',
          color: '#F59E0B',
          icon: 'box'
        }
      })
    
    if (domainResult.error) {
      console.error('❌ Error creating domain:', domainResult.error)
      return
    }
    
    console.log('✅ Created merchandising domain entity')
    
    // 2. Create the merchandising sections
    const sections = [
      {
        entity_type: 'section',
        entity_code: 'CATALOG',
        entity_name: 'Product Catalog',
        smart_code: 'HERA.RETAIL.SECTION.ENTITY.CATALOG.v1',
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
        entity_type: 'section',
        entity_code: 'PRICING',
        entity_name: 'Price Management',
        smart_code: 'HERA.RETAIL.SECTION.ENTITY.PRICING.v1',
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
        entity_type: 'section',
        entity_code: 'PROMOTIONS',
        entity_name: 'Promotions',
        smart_code: 'HERA.RETAIL.SECTION.ENTITY.PROMOTIONS.v1',
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
      console.error('❌ Error creating sections:', sectionsResult.error)
      return
    }
    
    console.log('✅ Created 3 merchandising sections')
    
    // 3. Verify the data was created
    const { data: verifyData, error: verifyError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .in('entity_type', ['domain', 'section'])
      .eq('entity_code', 'MERCHANDISING')
      .or('metadata->domain.eq.merchandising')
    
    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError)
      return
    }
    
    console.log('🔍 Verification: Found', verifyData.length, 'navigation entities')
    verifyData.forEach(entity => {
      console.log(`  - ${entity.entity_type}: ${entity.entity_name} (${entity.entity_code})`)
    })
    
    console.log('🎉 Merchandising navigation data seeded successfully!')
    console.log('🌐 Test URL: http://localhost:3000/retail/merchandising')
    
  } catch (error) {
    console.error('❌ Seeding error:', error)
  }
}

seedMerchandisingNavigation()