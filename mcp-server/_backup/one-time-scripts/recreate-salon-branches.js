#!/usr/bin/env node

/**
 * Recreate Missing Salon Branches
 * 
 * Creates the two missing salon branches:
 * 1. Park Regis Kris Kin Hotel, Al Karama, Dubai, U.A.E
 * 2. Mercure Gold Hotel, Al Mina Road, Jumeirah, Dubai, U.A.E
 * 
 * For organization: 378f24fb-d496-4ff7-8afa-ea34895a0eb8
 */

import { createClient } from '@supabase/supabase-js'

const organizationId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

const branches = [
  {
    name: 'Park Regis Kris Kin Hotel',
    code: 'PARK-REGIS',
    location: 'Al Karama, Dubai, U.A.E',
    description: 'Hair Talkz Salon at Park Regis Kris Kin Hotel'
  },
  {
    name: 'Mercure Gold Hotel', 
    code: 'MERCURE-GOLD',
    location: 'Al Mina Road, Jumeirah, Dubai, U.A.E',
    description: 'Hair Talkz Salon at Mercure Gold Hotel'
  }
]

async function recreateBranches() {
  try {
    console.log('🏗️ Recreating salon branches...')
    console.log(`Organization ID: ${organizationId}`)
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mpwctcxhykmzozwxmqpy.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wd2N0Y3hoeWttem96d3htcXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUyODY0OTIsImV4cCI6MjA0MDg2MjQ5Mn0.gvs7HfGAPvF8-TtdHQZLN1hYRQ5gCE2Q7QvgTrGjOgI'
    )
    
    // Check existing branches first
    console.log('\n📋 Checking existing branches...')
    const { data: existingBranches, error: checkError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'BRANCH')
    
    if (checkError) {
      console.error('Error checking existing branches:', checkError)
      return
    }
    
    console.log(`Found ${existingBranches?.length || 0} existing branches:`)
    existingBranches?.forEach(branch => {
      console.log(`  - ${branch.entity_name} (${branch.entity_code || 'no code'})`)
    })
    
    // Create each branch
    for (const branch of branches) {
      console.log(`\n🔧 Creating branch: ${branch.name}`)
      
      // Check if this branch already exists
      const existingBranch = existingBranches?.find(b => 
        b.entity_name === branch.name || b.entity_code === branch.code
      )
      
      if (existingBranch) {
        console.log(`✅ Branch already exists: ${existingBranch.entity_name}`)
        continue
      }
      
      // Create branch entity
      const { data: newBranch, error: createError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'BRANCH',
          entity_name: branch.name,
          entity_code: branch.code,
          smart_code: 'HERA.SALON.BRANCH.LOCATION.V1',
          metadata: {
            location: branch.location,
            description: branch.description,
            status: 'active',
            business_type: 'salon'
          }
        })
        .select()
        .single()
      
      if (createError) {
        console.error(`❌ Failed to create branch: ${branch.name}`)
        console.error('Error:', createError)
        continue
      }
      
      const branchId = newBranch.id
      console.log(`✅ Created branch: ${branch.name} (ID: ${branchId})`)
      
      // Add dynamic data for address and contact info
      const dynamicFields = [
        {
          field_name: 'full_address',
          field_type: 'text',
          field_value_text: `${branch.name}, ${branch.location}`,
          smart_code: 'HERA.SALON.BRANCH.ADDRESS.V1'
        },
        {
          field_name: 'city',
          field_type: 'text', 
          field_value_text: 'Dubai',
          smart_code: 'HERA.SALON.BRANCH.CITY.V1'
        },
        {
          field_name: 'country',
          field_type: 'text',
          field_value_text: 'U.A.E',
          smart_code: 'HERA.SALON.BRANCH.COUNTRY.V1'
        },
        {
          field_name: 'branch_type',
          field_type: 'text',
          field_value_text: 'hotel_salon',
          smart_code: 'HERA.SALON.BRANCH.TYPE.V1'
        }
      ]
      
      for (const field of dynamicFields) {
        const { error: fieldError } = await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: branchId,
            ...field
          })
        
        if (fieldError) {
          console.error(`Warning: Failed to add ${field.field_name}:`, fieldError)
        }
      }
      
      console.log(`📍 Added location data for ${branch.name}`)
    }
    
    // Verify final branch list
    console.log('\n🔍 Final verification...')
    const { data: finalBranches, error: finalError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'BRANCH')
    
    if (finalError) {
      console.error('Error in final verification:', finalError)
      return
    }
    
    console.log(`\n✅ Total branches now: ${finalBranches?.length || 0}`)
    finalBranches?.forEach(branch => {
      console.log(`  - ${branch.entity_name} (${branch.entity_code || 'no code'}) - ID: ${branch.id}`)
    })
    
    console.log('\n🎉 Branch recreation completed!')
    console.log('\nThe branches should now appear in:')
    console.log('- Salon appointments page branch filter')
    console.log('- Branch selector dropdowns')  
    console.log('- Financial reports by branch')
    console.log('- All salon pages with branch filtering')
    
  } catch (error) {
    console.error('❌ Error recreating branches:', error)
    process.exit(1)
  }
}

// Run the script
recreateBranches()