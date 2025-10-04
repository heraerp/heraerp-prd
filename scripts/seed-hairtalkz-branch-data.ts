/**
 * Seed Hair Talkz Branch Data
 * Smart Code: HERA.SCRIPT.SEED_HAIRTALKZ_BRANCH_DATA.V1
 * 
 * Creates sample staff, services, and products for both Hair Talkz branches
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Hair Talkz Configuration
const ORGANIZATION_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const PARK_REGIS_BRANCH_ID = 'a196a033-8e16-4308-82dd-6df7fb208a70'
const MERCURE_GOLD_BRANCH_ID = '09d57baa-99b0-4b7c-9583-1f53787e8472'

interface StaffMember {
  name: string
  email: string
  phone: string
  role: string
  branches: string[]
}

interface Service {
  name: string
  price: number
  duration: number
  branches: string[]
}

interface Product {
  name: string
  brand: string
  price: number
  branches: { id: string, stock: number }[]
}

async function seedBranchData() {
  console.log('🌱 Seeding Hair Talkz branch data...\n')

  try {
    // 1. Create Staff Members
    console.log('👥 Creating staff members...')
    
    const staff: StaffMember[] = [
      // Park Regis exclusive staff
      {
        name: 'Sarah Johnson',
        email: 'sarah@hairtalkz.com',
        phone: '+971 50 123 4567',
        role: 'Senior Stylist',
        branches: [PARK_REGIS_BRANCH_ID]
      },
      {
        name: 'Maria Garcia',
        email: 'maria@hairtalkz.com',
        phone: '+971 50 123 4568',
        role: 'Hair Colorist',
        branches: [PARK_REGIS_BRANCH_ID]
      },
      // Mercure Gold exclusive staff
      {
        name: 'Ahmed Hassan',
        email: 'ahmed@hairtalkz.com',
        phone: '+971 50 987 6543',
        role: 'Master Stylist',
        branches: [MERCURE_GOLD_BRANCH_ID]
      },
      {
        name: 'Fatima Al-Rashid',
        email: 'fatima@hairtalkz.com',
        phone: '+971 50 987 6544',
        role: 'Spa Specialist',
        branches: [MERCURE_GOLD_BRANCH_ID]
      },
      // Multi-branch staff
      {
        name: 'David Chen',
        email: 'david@hairtalkz.com',
        phone: '+971 50 555 1234',
        role: 'Regional Manager',
        branches: [PARK_REGIS_BRANCH_ID, MERCURE_GOLD_BRANCH_ID]
      }
    ]

    for (const member of staff) {
      // Create staff entity
      const { data: staffEntity, error: staffError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'STAFF',
          entity_name: member.name,
          entity_code: `STAFF-${member.name.split(' ')[0].toUpperCase()}`,
          smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.V1',
          metadata: {}
        })
        .select()
        .single()

      if (staffError) {
        console.error(`❌ Failed to create staff ${member.name}:`, staffError)
        continue
      }

      // Add dynamic fields
      const dynamicFields = [
        {
          organization_id: ORGANIZATION_ID,
          entity_id: staffEntity.id,
          field_name: 'email',
          field_type: 'text',
          field_value_text: member.email,
          smart_code: 'HERA.SALON.STAFF.FIELD.EMAIL.V1'
        },
        {
          organization_id: ORGANIZATION_ID,
          entity_id: staffEntity.id,
          field_name: 'phone',
          field_type: 'text',
          field_value_text: member.phone,
          smart_code: 'HERA.SALON.STAFF.FIELD.PHONE.V1'
        },
        {
          organization_id: ORGANIZATION_ID,
          entity_id: staffEntity.id,
          field_name: 'role_title',
          field_type: 'text',
          field_value_text: member.role,
          smart_code: 'HERA.SALON.STAFF.FIELD.ROLE.V1'
        }
      ]

      await supabase.from('core_dynamic_data').upsert(dynamicFields, {
        onConflict: 'organization_id,entity_id,field_name'
      })

      // Create branch relationships
      for (const branchId of member.branches) {
        await supabase.from('core_relationships').insert({
          organization_id: ORGANIZATION_ID,
          from_entity_id: staffEntity.id,
          to_entity_id: branchId,
          relationship_type: 'MEMBER_OF',
          smart_code: 'HERA.SALON.STAFF.REL.MEMBER_OF.V1',
          relationship_direction: 'forward',
          is_active: true
        })
      }

      console.log(`✅ Created ${member.name} (works at ${member.branches.length} branch(es))`)
    }

    // 2. Create Services
    console.log('\n💇 Creating services...')
    
    const services: Service[] = [
      // Available at both branches
      {
        name: 'Classic Cut & Style',
        price: 120,
        duration: 45,
        branches: [PARK_REGIS_BRANCH_ID, MERCURE_GOLD_BRANCH_ID]
      },
      {
        name: 'Hair Color - Full',
        price: 350,
        duration: 120,
        branches: [PARK_REGIS_BRANCH_ID, MERCURE_GOLD_BRANCH_ID]
      },
      // Park Regis exclusive
      {
        name: 'Express Blowdry',
        price: 80,
        duration: 30,
        branches: [PARK_REGIS_BRANCH_ID]
      },
      // Mercure Gold exclusive (premium services)
      {
        name: 'Luxury Hair Spa Treatment',
        price: 450,
        duration: 90,
        branches: [MERCURE_GOLD_BRANCH_ID]
      },
      {
        name: 'Bridal Hair Package',
        price: 850,
        duration: 180,
        branches: [MERCURE_GOLD_BRANCH_ID]
      }
    ]

    for (const service of services) {
      // Create service entity
      const { data: serviceEntity, error: serviceError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'SERVICE',
          entity_name: service.name,
          entity_code: `SVC-${service.name.split(' ')[0].toUpperCase()}`,
          smart_code: 'HERA.SALON.SERVICE.ENTITY.STANDARD.V1',
          metadata: {}
        })
        .select()
        .single()

      if (serviceError) {
        console.error(`❌ Failed to create service ${service.name}:`, serviceError)
        continue
      }

      // Add dynamic fields
      const dynamicFields = [
        {
          organization_id: ORGANIZATION_ID,
          entity_id: serviceEntity.id,
          field_name: 'price_market',
          field_type: 'number',
          field_value_number: service.price,
          smart_code: 'HERA.SALON.SERVICE.FIELD.PRICE.V1'
        },
        {
          organization_id: ORGANIZATION_ID,
          entity_id: serviceEntity.id,
          field_name: 'duration_min',
          field_type: 'number',
          field_value_number: service.duration,
          smart_code: 'HERA.SALON.SERVICE.FIELD.DURATION.V1'
        }
      ]

      await supabase.from('core_dynamic_data').upsert(dynamicFields, {
        onConflict: 'organization_id,entity_id,field_name'
      })

      // Create branch relationships
      for (const branchId of service.branches) {
        await supabase.from('core_relationships').insert({
          organization_id: ORGANIZATION_ID,
          from_entity_id: serviceEntity.id,
          to_entity_id: branchId,
          relationship_type: 'AVAILABLE_AT',
          smart_code: 'HERA.SALON.SERVICE.REL.AVAILABLE_AT.V1',
          relationship_direction: 'forward',
          is_active: true
        })
      }

      console.log(`✅ Created ${service.name} (available at ${service.branches.length} branch(es))`)
    }

    // 3. Create Products
    console.log('\n📦 Creating products...')
    
    const products: Product[] = [
      {
        name: 'Argan Oil Shampoo',
        brand: 'L\'Oreal Professional',
        price: 85,
        branches: [
          { id: PARK_REGIS_BRANCH_ID, stock: 25 },
          { id: MERCURE_GOLD_BRANCH_ID, stock: 40 }
        ]
      },
      {
        name: 'Keratin Treatment Kit',
        brand: 'Kerastase',
        price: 320,
        branches: [
          { id: PARK_REGIS_BRANCH_ID, stock: 10 },
          { id: MERCURE_GOLD_BRANCH_ID, stock: 15 }
        ]
      },
      {
        name: 'Hair Styling Wax',
        brand: 'TIGI',
        price: 65,
        branches: [
          { id: PARK_REGIS_BRANCH_ID, stock: 30 }
        ]
      },
      {
        name: 'Luxury Hair Mask',
        brand: 'Olaplex',
        price: 150,
        branches: [
          { id: MERCURE_GOLD_BRANCH_ID, stock: 20 }
        ]
      }
    ]

    for (const product of products) {
      // Create product entity
      const { data: productEntity, error: productError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'PRODUCT',
          entity_name: product.name,
          entity_code: `PROD-${product.name.split(' ')[0].toUpperCase()}`,
          smart_code: 'HERA.SALON.PRODUCT.ENTITY.STANDARD.V1',
          metadata: {}
        })
        .select()
        .single()

      if (productError) {
        console.error(`❌ Failed to create product ${product.name}:`, productError)
        continue
      }

      // Add dynamic fields
      const dynamicFields = [
        {
          organization_id: ORGANIZATION_ID,
          entity_id: productEntity.id,
          field_name: 'brand',
          field_type: 'text',
          field_value_text: product.brand,
          smart_code: 'HERA.SALON.PRODUCT.FIELD.BRAND.V1'
        },
        {
          organization_id: ORGANIZATION_ID,
          entity_id: productEntity.id,
          field_name: 'retail_price',
          field_type: 'number',
          field_value_number: product.price,
          smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
        }
      ]

      await supabase.from('core_dynamic_data').upsert(dynamicFields, {
        onConflict: 'organization_id,entity_id,field_name'
      })

      // Create branch relationships with stock levels
      for (const branch of product.branches) {
        await supabase.from('core_relationships').insert({
          organization_id: ORGANIZATION_ID,
          from_entity_id: productEntity.id,
          to_entity_id: branch.id,
          relationship_type: 'STOCK_AT',
          smart_code: 'HERA.SALON.PRODUCT.REL.STOCK_AT.V1',
          relationship_direction: 'forward',
          is_active: true,
          metadata: {
            stock_quantity: branch.stock,
            last_updated: new Date().toISOString()
          }
        })
      }

      console.log(`✅ Created ${product.name} (stocked at ${product.branches.length} branch(es))`)
    }

    // 4. Summary
    console.log('\n📊 Seeding Summary:')
    console.log('━'.repeat(60))
    console.log(`✅ Created ${staff.length} staff members`)
    console.log(`✅ Created ${services.length} services`)
    console.log(`✅ Created ${products.length} products`)
    console.log('━'.repeat(60))
    
    console.log('\n🔍 Branch Distribution:')
    console.log('Park Regis Branch:')
    console.log('  - 3 exclusive staff + 1 shared')
    console.log('  - 3 services + 2 exclusive')
    console.log('  - 3 products')
    console.log('\nMercure Gold Branch:')
    console.log('  - 2 exclusive staff + 1 shared')
    console.log('  - 2 services + 2 exclusive premium')
    console.log('  - 3 products (1 exclusive luxury)')
    
    console.log('\n✅ Branch data seeding completed!')
    console.log('\n🎯 Ready to test branch filtering in the UI!')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run the seeding
seedBranchData()