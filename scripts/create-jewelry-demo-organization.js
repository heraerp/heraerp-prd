#!/usr/bin/env node

/**
 * HERA Jewelry Demo Organization Creation Script
 * 
 * This script creates the demo organization entity in the HERA database
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const JEWELRY_DEMO_ORG_ID = 'f8d2c5e7-9a4b-6c8d-0e1f-2a3b4c5d6e7f'

async function createDemoOrganization() {
  console.log('🏢 Creating HERA Jewelry Demo Organization')
  console.log('==========================================')
  console.log('')

  try {
    // Check if organization already exists
    const { data: existing } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', JEWELRY_DEMO_ORG_ID)
      .single()

    if (existing) {
      console.log('✅ Demo organization already exists')
      console.log(`📍 Organization: ${existing.organization_name}`)
      console.log(`🆔 ID: ${existing.id}`)
      console.log('')
      return
    }

    // Create the organization
    const { data, error } = await supabase
      .from('core_organizations')
      .insert({
        id: JEWELRY_DEMO_ORG_ID,
        organization_name: 'Sterling Luxury Jewelers - Demo',
        organization_code: 'STERLING-DEMO',
        organization_type: 'jewelry_retailer',
        industry_classification: 'luxury_retail',
        status: 'active',
        ai_classification: 'jewelry_business',
        ai_confidence: 0.95,
        settings: {
          demo_mode: true,
          business_type: 'luxury_jewelry',
          location: 'Beverly Hills, CA',
          established: '2020',
          specialties: ['Diamond Engagement Rings', 'Luxury Watches', 'Custom Jewelry', 'Estate Pieces'],
          demo_features: [
            'Role-based access control',
            'Inventory management',
            'Customer relationship management', 
            'Appraisal and certification tracking',
            'Global entity search',
            'Real-time analytics'
          ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to create organization:', error.message)
      return
    }

    console.log('✅ Demo organization created successfully')
    console.log(`📍 Organization: ${data.organization_name}`)
    console.log(`🆔 ID: ${data.id}`)
    console.log(`🏪 Type: ${data.organization_type}`)
    console.log(`📅 Status: ${data.status}`)
    console.log('')

    // Create some basic entities for the demo organization
    console.log('🎯 Creating demo entities...')
    
    const entities = [
      {
        entity_type: 'customer',
        entity_name: 'Premium Customer Portfolio',
        entity_code: 'CUSTOMERS-DEMO',
        organization_id: JEWELRY_DEMO_ORG_ID,
        smart_code: 'HERA.JEWELRY.CUSTOMER.PORTFOLIO.V1',
        ai_classification: 'customer_portfolio',
        ai_confidence: 0.90
      },
      {
        entity_type: 'product_catalog',
        entity_name: 'Luxury Jewelry Collection',
        entity_code: 'CATALOG-DEMO',
        organization_id: JEWELRY_DEMO_ORG_ID,
        smart_code: 'HERA.JEWELRY.CATALOG.LUXURY.V1',
        ai_classification: 'product_catalog',
        ai_confidence: 0.92
      },
      {
        entity_type: 'security_vault',
        entity_name: 'Beverly Hills Vault',
        entity_code: 'VAULT-BH-001',
        organization_id: JEWELRY_DEMO_ORG_ID,
        smart_code: 'HERA.JEWELRY.SECURITY.VAULT.V1',
        ai_classification: 'security_facility',
        ai_confidence: 0.88
      }
    ]

    for (const entity of entities) {
      const { error: entityError } = await supabase
        .from('core_entities')
        .insert(entity)

      if (entityError) {
        console.log(`   ⚠️  Failed to create ${entity.entity_name}: ${entityError.message}`)
      } else {
        console.log(`   ✅ Created: ${entity.entity_name}`)
      }
    }

    console.log('')
    console.log('🎉 Demo Organization Setup Complete!')
    console.log('====================================')
    console.log('')
    console.log('🔗 Access the demo at:')
    console.log('Demo Selection: http://localhost:3000/jewelry/demo')
    console.log('Dashboard: http://localhost:3000/jewelry/dashboard')
    console.log('Search: http://localhost:3000/jewelry/search')
    console.log('')
    
  } catch (error) {
    console.error('❌ Error creating demo organization:', error.message)
  }
}

// Run the script
createDemoOrganization().catch(console.error)