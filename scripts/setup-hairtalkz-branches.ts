/**
 * Setup Hair Talkz Salon Branches
 * Smart Code: HERA.SCRIPT.SETUP_HAIRTALKZ_BRANCHES.V1
 * 
 * Sets up the two Hair Talkz branches with proper metadata and relationships
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
const DEFAULT_BRANCH_ID = 'a196a033-8e16-4308-82dd-6df7fb208a70'

async function setupHairTalkzBranches() {
  console.log('💇‍♀️ Setting up Hair Talkz Salon — Multi-Branch Configuration')
  console.log(`Organization ID: ${ORGANIZATION_ID}`)
  console.log('Website: www.hairtalkz.com\n')

  try {
    // 1. Update the default branch with full details
    console.log('📍 Updating default branch (Park Regis Kris Kin)...')
    
    const { error: updateError } = await supabase
      .from('core_entities')
      .update({
        entity_name: 'Hair Talkz – Park Regis Kris Kin',
        entity_code: 'BR-PARK-REGIS',
        metadata: {
          is_default: true,
          address: 'P Floor, Park Regis Kris Kin Hotel, Al Karama, Dubai, U.A.E',
          city: 'Dubai',
          country: 'U.A.E',
          notes: 'Main operational hub; used as default in API and migrations',
          website: 'www.hairtalkz.com'
        }
      })
      .eq('id', DEFAULT_BRANCH_ID)
      .eq('organization_id', ORGANIZATION_ID)

    if (updateError) {
      console.error('❌ Failed to update default branch:', updateError)
    } else {
      console.log('✅ Updated Park Regis branch')
    }

    // 2. Create the second branch
    console.log('\n📍 Creating Mercure Gold Jumeirah branch...')
    
    const { data: newBranch, error: createError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORGANIZATION_ID,
        entity_type: 'BRANCH',
        entity_name: 'Hair Talkz – Mercure Gold Jumeirah',
        entity_code: 'BR-MERCURE-GOLD',
        smart_code: 'HERA.SALON.BRANCH.ENTITY.LOCATION.V1',
        metadata: {
          is_default: false,
          address: 'Mercure Gold Hotel, Al Mina Road, Jumeirah, Dubai, U.A.E',
          city: 'Dubai',
          country: 'U.A.E',
          notes: 'Secondary branch; services, staff, and inventory linked via AVAILABLE_AT, MEMBER_OF, STOCK_AT',
          website: 'www.hairtalkz.com'
        }
      })
      .select()
      .single()

    if (createError) {
      // Check if branch already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORGANIZATION_ID)
        .eq('entity_type', 'BRANCH')
        .eq('entity_name', 'Hair Talkz – Mercure Gold Jumeirah')
        .single()

      if (existing) {
        console.log('✅ Mercure Gold branch already exists:', existing.id)
      } else {
        throw createError
      }
    } else {
      console.log('✅ Created Mercure Gold branch:', newBranch.id)
    }

    // 3. Create dynamic data for branches (phone, email, hours)
    console.log('\n📞 Adding branch contact information...')
    
    const branches = [
      {
        branch_id: DEFAULT_BRANCH_ID,
        branch_name: 'Park Regis',
        phone: '+971 4 123 4567',
        email: 'parkregis@hairtalkz.com',
        opening_hours: 'Mon-Sat: 9AM-9PM, Sun: 10AM-7PM'
      },
      {
        branch_id: newBranch?.id || existing?.id,
        branch_name: 'Mercure Gold',
        phone: '+971 4 987 6543',
        email: 'mercuregold@hairtalkz.com',
        opening_hours: 'Mon-Sat: 10AM-10PM, Sun: 11AM-8PM'
      }
    ]

    for (const branch of branches) {
      if (!branch.branch_id) continue

      const dynamicFields = [
        {
          organization_id: ORGANIZATION_ID,
          entity_id: branch.branch_id,
          field_name: 'phone',
          field_type: 'text',
          field_value_text: branch.phone,
          smart_code: 'HERA.SALON.BRANCH.FIELD.PHONE.V1'
        },
        {
          organization_id: ORGANIZATION_ID,
          entity_id: branch.branch_id,
          field_name: 'email',
          field_type: 'text',
          field_value_text: branch.email,
          smart_code: 'HERA.SALON.BRANCH.FIELD.EMAIL.V1'
        },
        {
          organization_id: ORGANIZATION_ID,
          entity_id: branch.branch_id,
          field_name: 'opening_hours',
          field_type: 'text',
          field_value_text: branch.opening_hours,
          smart_code: 'HERA.SALON.BRANCH.FIELD.HOURS.V1'
        }
      ]

      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .upsert(dynamicFields, {
          onConflict: 'organization_id,entity_id,field_name'
        })

      if (dynamicError) {
        console.error(`❌ Failed to add dynamic data for ${branch.branch_name}:`, dynamicError)
      } else {
        console.log(`✅ Added contact info for ${branch.branch_name}`)
      }
    }

    // 4. Display branch configuration
    console.log('\n🏢 Branch Configuration Summary:')
    console.log('━'.repeat(80))
    console.log('Branch Name                         | Branch ID                            | Default')
    console.log('━'.repeat(80))
    console.log(`Hair Talkz – Park Regis Kris Kin   | ${DEFAULT_BRANCH_ID} | ✅`)
    console.log(`Hair Talkz – Mercure Gold Jumeirah | ${newBranch?.id || existing?.id || 'TBD'} | ❌`)
    console.log('━'.repeat(80))

    console.log('\n🧩 Relationship Patterns:')
    console.log('Entity    | Relationship   | Description')
    console.log('━'.repeat(50))
    console.log('STAFF     | MEMBER_OF      | Staff → Branch')
    console.log('SERVICE   | AVAILABLE_AT   | Services offered per branch')
    console.log('PRODUCT   | STOCK_AT       | Inventory stocked per branch')
    console.log('CUSTOMER  | CUSTOMER_OF    | Customer preferences per branch')

    console.log('\n✅ Hair Talkz multi-branch setup completed!')
    console.log('\n📋 Next Steps:')
    console.log('1. Create staff members and assign to branches using MEMBER_OF')
    console.log('2. Set up services with AVAILABLE_AT relationships')
    console.log('3. Configure product inventory with STOCK_AT relationships')
    console.log('4. Test branch filtering in the UI')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
setupHairTalkzBranches()