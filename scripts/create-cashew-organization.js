#!/usr/bin/env node

/**
 * Create Kerala Cashew Processors Organization
 * Smart Code: HERA.SCRIPT.CREATE_CASHEW_ORGANIZATION.v1
 * 
 * Sets up dedicated organization for cashew manufacturing module
 * Uses HERA RPC patterns for proper multi-tenant setup
 */

import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import 'dotenv/config'

// Use development environment (HERA-DEV)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qqagokigwuujyeyrgdkq.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env file.')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createCashewOrganization() {
  console.log('🥜 CREATING KERALA CASHEW PROCESSORS ORGANIZATION')
  console.log('================================================')
  
  const cashewOrgId = uuidv4()
  const actorUserId = uuidv4() // Temporary actor for creation
  
  console.log(`🆔 Generated Organization ID: ${cashewOrgId}`)
  console.log(`👤 Temporary Actor ID: ${actorUserId}`)
  
  try {
    console.log('\n🏗️ Creating organization using HERA RPC...')
    
    // Create organization using HERA entities CRUD v1
    const result = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: cashewOrgId, // Self-referential for org creation
      p_entity: {
        entity_type: 'ORGANIZATION',
        entity_name: 'Kerala Cashew Processors',
        entity_code: 'KERALA_CASHEW',
        smart_code: 'HERA.CASHEW.ORGANIZATION.KERALA_PROCESSORS.v1'
      },
      p_dynamic: {
        industry: {
          field_type: 'text',
          field_value_text: 'Food Processing & Export',
          smart_code: 'HERA.CASHEW.ORGANIZATION.FIELD.INDUSTRY.v1'
        },
        location: {
          field_type: 'text', 
          field_value_text: 'Kerala, India',
          smart_code: 'HERA.CASHEW.ORGANIZATION.FIELD.LOCATION.v1'
        },
        processing_capacity: {
          field_type: 'text',
          field_value_text: '1000 MT per month',
          smart_code: 'HERA.CASHEW.ORGANIZATION.FIELD.CAPACITY.v1'
        },
        export_markets: {
          field_type: 'text',
          field_value_text: 'USA, Europe, Middle East, Asia',
          smart_code: 'HERA.CASHEW.ORGANIZATION.FIELD.MARKETS.v1'
        },
        certifications: {
          field_type: 'text',
          field_value_text: 'HACCP, ISO 22000, Organic, Fair Trade',
          smart_code: 'HERA.CASHEW.ORGANIZATION.FIELD.CERTIFICATIONS.v1'
        },
        business_model: {
          field_type: 'text',
          field_value_text: 'Integrated cashew processing from raw nuts to export-ready kernels',
          smart_code: 'HERA.CASHEW.ORGANIZATION.FIELD.BUSINESS_MODEL.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })

    if (result.error) {
      throw new Error(`Organization creation failed: ${result.error.message}`)
    }

    console.log('✅ Kerala Cashew Processors Organization Created Successfully!')
    console.log('\n📋 ORGANIZATION DETAILS:')
    console.log('========================')
    console.log(`🆔 Organization ID: ${cashewOrgId}`)
    console.log(`🏢 Organization Name: Kerala Cashew Processors`)
    console.log(`🏭 Industry: Food Processing & Export`)
    console.log(`📍 Location: Kerala, India`)
    console.log(`⚙️ Processing Capacity: 1000 MT per month`)
    console.log(`🌍 Export Markets: USA, Europe, Middle East, Asia`)
    console.log(`🏆 Certifications: HACCP, ISO 22000, Organic, Fair Trade`)
    console.log(`🔧 Smart Code: HERA.CASHEW.ORGANIZATION.KERALA_PROCESSORS.v1`)
    
    console.log('\n📝 ENVIRONMENT CONFIGURATION:')
    console.log('==============================')
    console.log('Add these to your .env file:')
    console.log(`CASHEW_ORGANIZATION_ID=${cashewOrgId}`)
    console.log(`NEXT_PUBLIC_CASHEW_ORGANIZATION_ID=${cashewOrgId}`)
    
    console.log('\n🎯 NEXT STEPS:')
    console.log('==============')
    console.log('1. Update your .env file with the organization ID above')
    console.log('2. Run: node scripts/create-cashew-user.js')
    console.log('3. Test cashew module authentication')
    
    return {
      organizationId: cashewOrgId,
      success: true,
      data: result.data
    }
    
  } catch (error) {
    console.error('❌ Failed to create Kerala Cashew Processors organization:', error.message)
    
    // Fallback: Generate UUID for manual setup
    console.log('\n🔄 FALLBACK: Manual Organization Setup')
    console.log('=====================================')
    console.log(`Generated Organization ID: ${cashewOrgId}`)
    console.log('Add this to your .env file:')
    console.log(`CASHEW_ORGANIZATION_ID=${cashewOrgId}`)
    console.log(`NEXT_PUBLIC_CASHEW_ORGANIZATION_ID=${cashewOrgId}`)
    
    console.log('\n🔧 MANUAL SETUP INSTRUCTIONS:')
    console.log('1. Check Supabase database connection')
    console.log('2. Verify HERA RPC functions are deployed')
    console.log('3. Ensure service role key has proper permissions')
    console.log('4. Try running the script again')
    
    return {
      organizationId: cashewOrgId,
      success: false,
      error: error.message
    }
  }
}

// Run the script
createCashewOrganization()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 CASHEW ORGANIZATION SETUP COMPLETE!')
      console.log('Ready for user creation and authentication setup.')
      process.exit(0)
    } else {
      console.log('\n⚠️ ORGANIZATION SETUP INCOMPLETE')
      console.log('Please check the error messages above and try again.')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('\n💥 FATAL ERROR:', error)
    process.exit(1)
  })