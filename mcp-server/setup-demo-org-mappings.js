#!/usr/bin/env node

/**
 * Setup Demo Organization Mappings
 * Maps URL paths to organization IDs using HERA universal architecture
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// HERA System Organization ID
const SYSTEM_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'

async function setupDemoOrgMappings() {
  console.log('🚀 Setting up demo organization mappings...\n')

  // Demo organization mappings
  const demoMappings = [
    {
      path: '/icecream',
      orgId: '1471e87b-b27e-42ef-8192-343cc5e0d656',
      orgName: 'Kochi Ice Cream Manufacturing',
      industry: 'manufacturing'
    },
    {
      path: '/restaurant',
      orgId: '8c4f6b2d-5a91-4e8c-b3d7-1f9e8a7c6d54',
      orgName: "Mario's Authentic Italian Restaurant",
      industry: 'restaurant'
    },
    {
      path: '/healthcare',
      orgId: 'a2e5f8d9-7b3c-4f6e-9d1a-8c7e5b4a2f9d',
      orgName: 'Dr. Smith Family Practice',
      industry: 'healthcare'
    },
    {
      path: '/salon',
      orgId: 'c7d9e4f8-3b2a-4e6d-8f1c-9a7b5c3d2e8f',
      orgName: 'Bella Beauty Salon',
      industry: 'salon'
    },
    {
      path: '/retail',
      orgId: 'e5f8a9d7-2c3b-4f7e-8d1a-7b6c4e3f2a9d',
      orgName: 'TechGear Electronics Store',
      industry: 'retail'
    },
    {
      path: '/furniture',
      orgId: 'f0af4ced-9d12-4a55-a649-b484368db249',
      orgName: 'Kerala Furniture Works (Demo)',
      industry: 'furniture'
    }
  ]

  try {
    // Create demo_route_mapping entities in HERA System Organization
    for (const mapping of demoMappings) {
      console.log(`📍 Creating mapping for ${mapping.path}...`)

      // Create the mapping entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: SYSTEM_ORG_ID,
          entity_type: 'demo_route_mapping',
          entity_name: `Demo Route: ${mapping.path}`,
          entity_code: `DEMO-ROUTE${mapping.path.toUpperCase().replace('/', '-')}`,
          smart_code: `HERA.DEMO.ROUTE.${mapping.industry.toUpperCase()}.v1`,
          metadata: {
            route_path: mapping.path,
            target_org_id: mapping.orgId,
            target_org_name: mapping.orgName,
            industry: mapping.industry,
            is_demo: true,
            created_for: 'automatic_org_assignment'
          }
        })
        .select()
        .single()

      if (entityError) {
        console.error(`❌ Error creating mapping for ${mapping.path}:`, entityError)
        continue
      }

      console.log(`✅ Created mapping: ${mapping.path} → ${mapping.orgName}`)

      // Store the path and org_id in dynamic data for quick lookup
      const dynamicFields = [
        { field_name: 'route_path', field_value_text: mapping.path },
        { field_name: 'target_org_id', field_value_text: mapping.orgId },
        { field_name: 'is_active', field_value_text: 'true' }
      ]

      for (const field of dynamicFields) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            entity_id: entity.id,
            organization_id: SYSTEM_ORG_ID,
            field_name: field.field_name,
            field_value_text: field.field_value_text,
            smart_code: `HERA.DEMO.FIELD.${field.field_name.toUpperCase()}.v1`
          })
      }
    }

    console.log('\n✅ All demo route mappings created successfully!')
    console.log('\n📋 Summary:')
    demoMappings.forEach(m => {
      console.log(`   ${m.path} → ${m.orgName} (${m.orgId})`)
    })

  } catch (error) {
    console.error('❌ Error setting up demo mappings:', error)
    process.exit(1)
  }
}

// Run the setup
setupDemoOrgMappings()