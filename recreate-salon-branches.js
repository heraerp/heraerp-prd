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
    
    // Import HERA Universal API
    const { universalApi } = await import('./src/lib/universal-api-v2.js')
    
    // Set organization context
    universalApi.setOrganizationId(organizationId)
    
    // Check if branches already exist
    console.log('\n📋 Checking existing branches...')
    const existingResponse = await universalApi.read('core_entities', {
      organization_id: organizationId,
      entity_type: 'BRANCH'
    })
    
    if (existingResponse.success && existingResponse.data) {
      console.log(`Found ${existingResponse.data.length} existing branches:`)
      existingResponse.data.forEach(branch => {
        console.log(`  - ${branch.entity_name} (${branch.entity_code || 'no code'})`)
      })
    }
    
    // Create each branch
    for (const branch of branches) {
      console.log(`\n🔧 Creating branch: ${branch.name}`)
      
      // Check if this branch already exists
      const existingBranch = existingResponse.data?.find(b => 
        b.entity_name === branch.name || b.entity_code === branch.code
      )
      
      if (existingBranch) {
        console.log(`✅ Branch already exists: ${existingBranch.entity_name}`)
        continue
      }
      
      // Create branch entity
      const createResponse = await universalApi.create('core_entities', {
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
      
      if (createResponse.success) {
        const branchId = createResponse.data
        console.log(`✅ Created branch: ${branch.name} (ID: ${branchId})`)
        
        // Add dynamic data for address and contact info
        await universalApi.create('core_dynamic_data', {
          organization_id: organizationId,
          entity_id: branchId,
          field_name: 'full_address',
          field_type: 'text',
          field_value_text: `${branch.name}, ${branch.location}`,
          smart_code: 'HERA.SALON.BRANCH.ADDRESS.V1'
        })
        
        await universalApi.create('core_dynamic_data', {
          organization_id: organizationId,
          entity_id: branchId,
          field_name: 'city',
          field_type: 'text', 
          field_value_text: 'Dubai',
          smart_code: 'HERA.SALON.BRANCH.CITY.V1'
        })
        
        await universalApi.create('core_dynamic_data', {
          organization_id: organizationId,
          entity_id: branchId,
          field_name: 'country',
          field_type: 'text',
          field_value_text: 'U.A.E',
          smart_code: 'HERA.SALON.BRANCH.COUNTRY.V1'
        })
        
        await universalApi.create('core_dynamic_data', {
          organization_id: organizationId,
          entity_id: branchId,
          field_name: 'branch_type',
          field_type: 'text',
          field_value_text: 'hotel_salon',
          smart_code: 'HERA.SALON.BRANCH.TYPE.V1'
        })
        
        console.log(`📍 Added location data for ${branch.name}`)
        
      } else {
        console.error(`❌ Failed to create branch: ${branch.name}`)
        console.error('Error:', createResponse.error)
      }
    }
    
    // Verify final branch list
    console.log('\n🔍 Final verification...')
    const finalResponse = await universalApi.read('core_entities', {
      organization_id: organizationId,
      entity_type: 'BRANCH'
    })
    
    if (finalResponse.success && finalResponse.data) {
      console.log(`\n✅ Total branches now: ${finalResponse.data.length}`)
      finalResponse.data.forEach(branch => {
        console.log(`  - ${branch.entity_name} (${branch.entity_code || 'no code'}) - ID: ${branch.id}`)
      })
    }
    
    console.log('\n🎉 Branch recreation completed!')
    console.log('\nThe branches should now appear in:')
    console.log('- Salon appointments page')
    console.log('- Branch filter dropdowns')
    console.log('- Financial reports by branch')
    
  } catch (error) {
    console.error('❌ Error recreating branches:', error)
    process.exit(1)
  }
}

// Run the script
recreateBranches()