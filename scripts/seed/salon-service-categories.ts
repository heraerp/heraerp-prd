#!/usr/bin/env node

/**
 * HERA Salon Service Categories Seed Script
 * 
 * Seeds common service categories for salon businesses.
 * Idempotent by (organization_id + name).
 * 
 * Usage:
 *   SEED_ORG_ID=<uuid> npm run seed:salon-service-categories
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })
config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const orgId = process.env.SEED_ORG_ID

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!orgId) {
  console.error('❌ Missing organization ID')
  console.error('Usage: SEED_ORG_ID=<uuid> npm run seed:salon-service-categories')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ServiceCategoryData {
  name: string
  code: string
  description: string
  display_order: number
  color_tag: string
}

const serviceCategories: ServiceCategoryData[] = [
  {
    name: 'Hair',
    code: 'SRV-HAIR',
    description: 'Hair cutting, washing, and basic styling services',
    display_order: 1,
    color_tag: '#8B4513'
  },
  {
    name: 'Color',
    code: 'SRV-COLOR',
    description: 'Hair coloring, highlighting, and chemical treatments',
    display_order: 2,
    color_tag: '#FF6B6B'
  },
  {
    name: 'Styling',
    code: 'SRV-STYLE',
    description: 'Special occasion styling, updos, and blowouts',
    display_order: 3,
    color_tag: '#4ECDC4'
  },
  {
    name: 'Nails',
    code: 'SRV-NAILS',
    description: 'Manicure, pedicure, and nail art services',
    display_order: 4,
    color_tag: '#FFD93D'
  },
  {
    name: 'Spa',
    code: 'SRV-SPA',
    description: 'Relaxation and wellness treatments',
    display_order: 5,
    color_tag: '#6BCF7F'
  },
  {
    name: 'Massage',
    code: 'SRV-MASSAGE',
    description: 'Therapeutic and relaxation massage services',
    display_order: 6,
    color_tag: '#A8E6CF'
  },
  {
    name: 'Facial',
    code: 'SRV-FACIAL',
    description: 'Skincare treatments and facial services',
    display_order: 7,
    color_tag: '#FFB3BA'
  },
  {
    name: 'Brows & Lashes',
    code: 'SRV-BROWS',
    description: 'Eyebrow shaping, tinting, and eyelash extensions',
    display_order: 8,
    color_tag: '#C7CEEA'
  }
]

async function seedServiceCategories() {
  console.log('🌱 Seeding salon service categories...')
  console.log(`📍 Organization ID: ${orgId}`)
  
  let created = 0
  let skipped = 0
  
  for (const category of serviceCategories) {
    try {
      // Check if category already exists (idempotent by organization_id + name)
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', orgId)
        .eq('entity_type', 'CATEGORY')
        .eq('entity_name', category.name)
        .single()
      
      if (existing) {
        console.log(`⏭️  Skipping existing category: ${category.name}`)
        skipped++
        continue
      }
      
      // Create the entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'CATEGORY',
          entity_name: category.name,
          entity_code: category.code,
          smart_code: 'HERA.SALON.CATEGORY.ENTITY.ITEM.V1',
          metadata: {
            created_by: 'seed-script',
            seed_version: '1.0.0'
          }
        })
        .select('id')
        .single()
      
      if (entityError) {
        console.error(`❌ Failed to create entity for ${category.name}:`, entityError)
        continue
      }
      
      // Create dynamic fields
      const dynamicFields = [
        {
          entity_id: entity.id,
          organization_id: orgId,
          field_name: 'kind',
          field_value_text: 'SERVICE',
          field_type: 'text',
          smart_code: 'HERA.SALON.CATEGORY.DYN.KIND.V1'
        },
        {
          entity_id: entity.id,
          organization_id: orgId,
          field_name: 'name',
          field_value_text: category.name,
          field_type: 'text',
          smart_code: 'HERA.SALON.CATEGORY.DYN.NAME.V1'
        },
        {
          entity_id: entity.id,
          organization_id: orgId,
          field_name: 'code',
          field_value_text: category.code,
          field_type: 'text',
          smart_code: 'HERA.SALON.CATEGORY.DYN.CODE.V1'
        },
        {
          entity_id: entity.id,
          organization_id: orgId,
          field_name: 'description',
          field_value_text: category.description,
          field_type: 'text',
          smart_code: 'HERA.SALON.CATEGORY.DYN.DESCRIPTION.V1'
        },
        {
          entity_id: entity.id,
          organization_id: orgId,
          field_name: 'display_order',
          field_value_number: category.display_order,
          field_type: 'number',
          smart_code: 'HERA.SALON.CATEGORY.DYN.DISPLAY_ORDER.V1'
        },
        {
          entity_id: entity.id,
          organization_id: orgId,
          field_name: 'status',
          field_value_text: 'active',
          field_type: 'text',
          smart_code: 'HERA.SALON.CATEGORY.DYN.STATUS.V1'
        },
        {
          entity_id: entity.id,
          organization_id: orgId,
          field_name: 'color_tag',
          field_value_text: category.color_tag,
          field_type: 'text',
          smart_code: 'HERA.SALON.CATEGORY.DYN.COLOR_TAG.V1'
        }
      ]
      
      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicFields)
      
      if (dynamicError) {
        console.error(`❌ Failed to create dynamic fields for ${category.name}:`, dynamicError)
        continue
      }
      
      console.log(`✅ Created category: ${category.name} (${category.code})`)
      created++
      
    } catch (error) {
      console.error(`❌ Error processing category ${category.name}:`, error)
    }
  }
  
  console.log('\n📊 Seeding Summary:')
  console.log(`✅ Created: ${created} categories`)
  console.log(`⏭️  Skipped: ${skipped} categories`)
  console.log(`📦 Total: ${serviceCategories.length} categories`)
  
  if (created > 0) {
    console.log('\n🎉 Service categories seed completed successfully!')
    console.log('🔗 Access them at: /salon/service-categories')
  } else {
    console.log('\n📋 All categories already exist - seed is idempotent')
  }
}

// Run the seed
seedServiceCategories()
  .then(() => {
    console.log('✨ Seed script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Seed script failed:', error)
    process.exit(1)
  })