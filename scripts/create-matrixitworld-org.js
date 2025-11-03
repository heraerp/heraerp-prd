#!/usr/bin/env node

/**
 * Create MatrixIT World Organization
 * Sets up proper organization context for the retail & distribution platform
 */

import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import 'dotenv/config'

// Use development environment (lines 16-18 from .env)
const supabaseUrl = 'https://qqagokigwuujyeyrgdkq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgxMzUyNiwiZXhwIjoyMDc1Mzg5NTI2fQ.NmfOUGeCd-9o7cbJjWmWETN9NobDNkvjnQuTa0EBorg'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env file.')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMatrixITWorldOrganization() {
  console.log('🏗️  Creating MatrixIT World Organization...')
  
  const matrixITOrgId = uuidv4()
  const actorUserId = process.env.DEFAULT_USER_ID || uuidv4() // We'll need a user ID
  
  try {
    // Create organization using HERA RPC
    const result = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: matrixITOrgId, // Self-referential for org creation
      p_entity: {
        entity_type: 'ORGANIZATION',
        entity_name: 'MatrixIT World',
        entity_code: 'MATRIXITWORLD',
        smart_code: 'HERA.RETAIL.ORGANIZATION.MATRIXITWORLD.v1'
      },
      p_dynamic: {
        industry: {
          field_type: 'text',
          field_value_text: 'PC & Mobile Retail Distribution',
          smart_code: 'HERA.RETAIL.ORGANIZATION.FIELD.INDUSTRY.v1'
        },
        location: {
          field_type: 'text', 
          field_value_text: 'Kerala, India',
          smart_code: 'HERA.RETAIL.ORGANIZATION.FIELD.LOCATION.v1'
        },
        branches: {
          field_type: 'number',
          field_value_number: 6,
          smart_code: 'HERA.RETAIL.ORGANIZATION.FIELD.BRANCHES.v1'
        },
        business_model: {
          field_type: 'text',
          field_value_text: 'Multi-branch retail and distribution',
          smart_code: 'HERA.RETAIL.ORGANIZATION.FIELD.BUSINESS_MODEL.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })

    if (result.error) {
      throw new Error(`Organization creation failed: ${result.error.message}`)
    }

    console.log('✅ MatrixIT World Organization Created Successfully!')
    console.log(`📋 Organization ID: ${matrixITOrgId}`)
    console.log(`🏢 Organization Name: MatrixIT World`)
    console.log(`🏭 Industry: PC & Mobile Retail Distribution`)
    console.log(`📍 Location: Kerala, India`)
    console.log(`🏪 Branches: 6`)
    
    // Update environment file
    console.log('\n📝 Environment Configuration:')
    console.log(`Add this to your .env file:`)
    console.log(`MATRIXITWORLD_ORGANIZATION_ID=${matrixITOrgId}`)
    console.log(`NEXT_PUBLIC_MATRIXITWORLD_ORGANIZATION_ID=${matrixITOrgId}`)
    
    return {
      organizationId: matrixITOrgId,
      success: true
    }
    
  } catch (error) {
    console.error('❌ Failed to create MatrixIT World organization:', error.message)
    
    // Fallback: Generate UUID for manual setup
    console.log('\n🔄 Fallback: Manual Organization Setup')
    console.log(`Generated Organization ID: ${matrixITOrgId}`)
    console.log(`Add this to your .env file:`)
    console.log(`MATRIXITWORLD_ORGANIZATION_ID=${matrixITOrgId}`)
    console.log(`NEXT_PUBLIC_MATRIXITWORLD_ORGANIZATION_ID=${matrixITOrgId}`)
    
    return {
      organizationId: matrixITOrgId,
      success: false,
      error: error.message
    }
  }
}

// Create the 6 branch locations for MatrixIT World
async function createMatrixITBranches(organizationId) {
  console.log('\n🏪 Creating 6 Kerala Branch Locations...')
  
  const branches = [
    { name: 'Kochi Main', type: 'Main Branch', city: 'Kochi', district: 'Ernakulam' },
    { name: 'Trivandrum Main', type: 'Main Branch', city: 'Trivandrum', district: 'Thiruvananthapuram' },
    { name: 'Kozhikode Distributor', type: 'Distributor', city: 'Kozhikode', district: 'Kozhikode' },
    { name: 'Thrissur Retail', type: 'Retail', city: 'Thrissur', district: 'Thrissur' },
    { name: 'Kannur Service', type: 'Service Center', city: 'Kannur', district: 'Kannur' },
    { name: 'Kollam Retail', type: 'Retail', city: 'Kollam', district: 'Kollam' }
  ]
  
  for (const branch of branches) {
    try {
      const branchResult = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: process.env.DEFAULT_USER_ID || uuidv4(),
        p_organization_id: organizationId,
        p_entity: {
          entity_type: 'LOCATION',
          entity_name: branch.name,
          entity_code: branch.name.replace(/\s+/g, '_').toUpperCase(),
          smart_code: 'HERA.RETAIL.LOCATION.BRANCH.v1'
        },
        p_dynamic: {
          location_type: {
            field_type: 'text',
            field_value_text: branch.type,
            smart_code: 'HERA.RETAIL.LOCATION.FIELD.TYPE.v1'
          },
          city: {
            field_type: 'text',
            field_value_text: branch.city,
            smart_code: 'HERA.RETAIL.LOCATION.FIELD.CITY.v1'
          },
          district: {
            field_type: 'text',
            field_value_text: branch.district,
            smart_code: 'HERA.RETAIL.LOCATION.FIELD.DISTRICT.v1'
          },
          state: {
            field_type: 'text',
            field_value_text: 'Kerala',
            smart_code: 'HERA.RETAIL.LOCATION.FIELD.STATE.v1'
          }
        },
        p_relationships: [],
        p_options: {}
      })
      
      if (branchResult.error) {
        console.log(`⚠️  Failed to create ${branch.name}: ${branchResult.error.message}`)
      } else {
        console.log(`✅ Created ${branch.name} (${branch.type})`)
      }
      
    } catch (error) {
      console.log(`⚠️  Error creating ${branch.name}: ${error.message}`)
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 MatrixIT World Organization Setup')
  console.log('=====================================\n')
  
  const result = await createMatrixITWorldOrganization()
  
  if (result.success) {
    await createMatrixITBranches(result.organizationId)
  }
  
  console.log('\n🎉 MatrixIT World Setup Complete!')
  console.log('\nNext Steps:')
  console.log('1. Add the organization ID to your .env file')
  console.log('2. Update MatrixIT World components to use the new organization ID')
  console.log('3. Test the retail and distribution functionality')
  
  return result
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { createMatrixITWorldOrganization, createMatrixITBranches }