/**
 * HERA Salon Branch Seed Script
 * Seeds demo branches for HairTalkz salon organization
 * 
 * Usage: tsx scripts/seed/salon-branches.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Use default salon demo organization ID from .env
const HAIRTALKZ_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

const branches = [
  {
    entity_name: 'Downtown Flagship',
    entity_code: 'BR-001',
    smart_code: 'HERA.SALON.LOCATION.ENTITY.BRANCH.V1',
    dynamic_fields: {
      code: { value: 'BR-001', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.CODE.V1' },
      address: { value: '123 Main Street, Downtown Dubai, UAE', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.ADDRESS.V1' },
      phone: { value: '+971 4 123 4567', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.PHONE.V1' },
      timezone: { value: 'Asia/Dubai', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.TIMEZONE.V1' },
      status: { value: 'active', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.STATUS.V1' }
    },
    metadata: {
      is_flagship: true,
      capacity: 12,
      operating_hours: {
        monday: { open: '09:00', close: '21:00' },
        tuesday: { open: '09:00', close: '21:00' },
        wednesday: { open: '09:00', close: '21:00' },
        thursday: { open: '09:00', close: '22:00' },
        friday: { open: '09:00', close: '22:00' },
        saturday: { open: '10:00', close: '20:00' },
        sunday: { open: '11:00', close: '19:00' }
      }
    }
  },
  {
    entity_name: 'Marina Mall',
    entity_code: 'BR-002',
    smart_code: 'HERA.SALON.LOCATION.ENTITY.BRANCH.V1',
    dynamic_fields: {
      code: { value: 'BR-002', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.CODE.V1' },
      address: { value: 'Marina Mall, Level 2, Dubai Marina, UAE', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.ADDRESS.V1' },
      phone: { value: '+971 4 234 5678', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.PHONE.V1' },
      timezone: { value: 'Asia/Dubai', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.TIMEZONE.V1' },
      status: { value: 'active', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.STATUS.V1' }
    },
    metadata: {
      is_flagship: false,
      capacity: 8,
      operating_hours: {
        monday: { open: '10:00', close: '22:00' },
        tuesday: { open: '10:00', close: '22:00' },
        wednesday: { open: '10:00', close: '22:00' },
        thursday: { open: '10:00', close: '22:00' },
        friday: { open: '10:00', close: '23:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '10:00', close: '22:00' }
      }
    }
  },
  {
    entity_name: 'Airport Terminal 3',
    entity_code: 'BR-003',
    smart_code: 'HERA.SALON.LOCATION.ENTITY.BRANCH.V1',
    dynamic_fields: {
      code: { value: 'BR-003', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.CODE.V1' },
      address: { value: 'Dubai International Airport, Terminal 3, Concourse B', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.ADDRESS.V1' },
      phone: { value: '+971 4 345 6789', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.PHONE.V1' },
      timezone: { value: 'Asia/Dubai', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.TIMEZONE.V1' },
      status: { value: 'active', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.STATUS.V1' }
    },
    metadata: {
      is_flagship: false,
      capacity: 4,
      is_express: true,
      operating_hours: {
        monday: { open: '00:00', close: '23:59' },
        tuesday: { open: '00:00', close: '23:59' },
        wednesday: { open: '00:00', close: '23:59' },
        thursday: { open: '00:00', close: '23:59' },
        friday: { open: '00:00', close: '23:59' },
        saturday: { open: '00:00', close: '23:59' },
        sunday: { open: '00:00', close: '23:59' }
      }
    }
  },
  {
    entity_name: 'JBR Beach Walk',
    entity_code: 'BR-004',
    smart_code: 'HERA.SALON.LOCATION.ENTITY.BRANCH.V1',
    dynamic_fields: {
      code: { value: 'BR-004', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.CODE.V1' },
      address: { value: 'The Beach, JBR Walk, Dubai, UAE', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.ADDRESS.V1' },
      phone: { value: '+971 4 456 7890', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.PHONE.V1' },
      timezone: { value: 'Asia/Dubai', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.TIMEZONE.V1' },
      status: { value: 'active', type: 'text', smart_code: 'HERA.SALON.LOCATION.DYN.STATUS.V1' }
    },
    metadata: {
      is_flagship: false,
      capacity: 6,
      has_outdoor_area: true,
      operating_hours: {
        monday: { open: '10:00', close: '23:00' },
        tuesday: { open: '10:00', close: '23:00' },
        wednesday: { open: '10:00', close: '23:00' },
        thursday: { open: '10:00', close: '00:00' },
        friday: { open: '10:00', close: '00:00' },
        saturday: { open: '10:00', close: '00:00' },
        sunday: { open: '10:00', close: '23:00' }
      }
    }
  }
]

async function seedBranches() {
  console.log('🌱 Starting branch seeding for HairTalkz...')

  try {
    // First, check if branches already exist
    const { data: existingBranches, error: checkError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'BRANCH')

    if (checkError) {
      throw new Error(`Error checking existing branches: ${checkError.message}`)
    }

    console.log(`Found ${existingBranches?.length || 0} existing branches`)

    // Insert branches
    for (const branchData of branches) {
      // Check if branch already exists by code
      const existing = existingBranches?.find(b => b.entity_code === branchData.entity_code)
      
      if (existing) {
        console.log(`⏭️  Branch ${branchData.entity_code} already exists, skipping...`)
        continue
      }

      // Insert the branch entity
      const { data: branch, error: insertError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: HAIRTALKZ_ORG_ID,
          entity_type: 'BRANCH',
          entity_name: branchData.entity_name,
          entity_code: branchData.entity_code,
          smart_code: branchData.smart_code,
          status: 'active',
          metadata: branchData.metadata
        })
        .select()
        .single()

      if (insertError) {
        console.error(`❌ Error creating branch ${branchData.entity_name}:`, insertError)
        continue
      }

      console.log(`✅ Created branch: ${branchData.entity_name} (${branch.id})`)

      // Insert dynamic fields
      for (const [fieldName, fieldData] of Object.entries(branchData.dynamic_fields)) {
        const { error: fieldError } = await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: HAIRTALKZ_ORG_ID,
            entity_id: branch.id,
            field_name: fieldName,
            field_value: fieldData.value,
            field_type: fieldData.type,
            smart_code: fieldData.smart_code
          })

        if (fieldError) {
          console.error(`❌ Error creating dynamic field ${fieldName}:`, fieldError)
        }
      }
    }

    // Link existing staff to default branch (Downtown Flagship)
    const { data: defaultBranch } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'BRANCH')
      .eq('entity_code', 'BR-001')
      .single()

    if (defaultBranch) {
      // Get all staff without branch assignment
      const { data: staff } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', HAIRTALKZ_ORG_ID)
        .eq('entity_type', 'STAFF')
        .eq('status', 'active')

      if (staff && staff.length > 0) {
        console.log(`\n🔗 Linking ${staff.length} staff members to default branch...`)

        for (const member of staff) {
          // Check if relationship already exists
          const { data: existingRel } = await supabase
            .from('core_relationships')
            .select('id')
            .eq('from_entity_id', member.id)
            .eq('relationship_type', 'STAFF_MEMBER_OF')
            .single()

          if (!existingRel) {
            const { error: relError } = await supabase
              .from('core_relationships')
              .insert({
                organization_id: HAIRTALKZ_ORG_ID,
                from_entity_id: member.id,
                to_entity_id: defaultBranch.id,
                relationship_type: 'STAFF_MEMBER_OF',
                smart_code: 'HERA.SALON.STAFF.REL.MEMBER_OF.V1'
              })

            if (relError) {
              console.error(`❌ Error linking staff member:`, relError)
            }
          }
        }
        console.log('✅ Staff members linked to default branch')
      }

      // Link all services to all branches
      const { data: services } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', HAIRTALKZ_ORG_ID)
        .eq('entity_type', 'SERVICE')
        .eq('status', 'active')

      const { data: allBranches } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', HAIRTALKZ_ORG_ID)
        .eq('entity_type', 'BRANCH')
        .eq('status', 'active')

      if (services && allBranches && services.length > 0 && allBranches.length > 0) {
        console.log(`\n🔗 Linking ${services.length} services to ${allBranches.length} branches...`)
        
        for (const service of services) {
          for (const branch of allBranches) {
            // Check if relationship already exists
            const { data: existingRel } = await supabase
              .from('core_relationships')
              .select('id')
              .eq('from_entity_id', service.id)
              .eq('to_entity_id', branch.id)
              .eq('relationship_type', 'SERVICE_AVAILABLE_AT')
              .single()

            if (!existingRel) {
              const { error: relError } = await supabase
                .from('core_relationships')
                .insert({
                  organization_id: HAIRTALKZ_ORG_ID,
                  from_entity_id: service.id,
                  to_entity_id: branch.id,
                  relationship_type: 'SERVICE_AVAILABLE_AT',
                  smart_code: 'HERA.SALON.SERVICE.REL.AVAILABLE_AT.V1'
                })

              if (relError) {
                console.error(`❌ Error linking service to branch:`, relError)
              }
            }
          }
        }
        console.log('✅ Services linked to all branches')
      }
    }

    console.log('\n🎉 Branch seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error during branch seeding:', error)
    process.exit(1)
  }
}

// Run the seed script
seedBranches()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })