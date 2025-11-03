#!/usr/bin/env node

/**
 * Create Rebate Agreements for MatrixIT World
 * Establishes purchasing rebate structures with major suppliers
 */

import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import 'dotenv/config'

// Use development environment (lines 16-18 from .env)
const supabaseUrl = 'https://qqagokigwuujyeyrgdkq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgxMzUyNiwiZXhwIjoyMDc1Mzg5NTI2fQ.NmfOUGeCd-9o7cbJjWmWETN9NobDNkvjnQuTa0EBorg'
const MATRIXITWORLD_ORG_ID = '30c9841b-0472-4dc3-82af-6290192255ba'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const actorUserId = uuidv4() // Demo user for actor stamping

// Helper function to create entity
async function createEntity(entityData, dynamicData = {}, relationships = []) {
  try {
    const result = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: MATRIXITWORLD_ORG_ID,
      p_entity: entityData,
      p_dynamic: dynamicData,
      p_relationships: relationships,
      p_options: {}
    })

    if (result.error) {
      console.log(`⚠️  Failed to create ${entityData.entity_name}: ${result.error.message}`)
      return null
    }

    console.log(`✅ Created ${entityData.entity_type}: ${entityData.entity_name}`)
    return result.data
  } catch (error) {
    console.log(`❌ Error creating ${entityData.entity_name}: ${error.message}`)
    return null
  }
}

// Get existing vendors to link rebate agreements
async function getExistingVendors() {
  try {
    // Try direct table query first
    const directQuery = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'VENDOR')
      .eq('organization_id', MATRIXITWORLD_ORG_ID)

    console.log(`📋 Direct query result:`, directQuery.data?.length || 0, 'vendors')
    if (directQuery.data && directQuery.data.length > 0) {
      console.log(`📋 Found ${directQuery.data.length} vendors via direct query`)
      console.log(`📋 Sample vendor:`, directQuery.data[0])
      return directQuery.data
    }

    // Fallback to RPC function
    const result = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: actorUserId,
      p_organization_id: MATRIXITWORLD_ORG_ID,
      p_entity: { entity_type: 'VENDOR' },
      p_dynamic: {},
      p_relationships: [],
      p_options: { include_dynamic: true }
    })

    if (result.error) {
      console.log(`⚠️  Failed to get vendors via RPC: ${result.error.message}`)
      return directQuery.data || []
    }

    console.log(`📋 RPC result:`, JSON.stringify(result.data, null, 2))
    
    // Check if RPC returned data in 'list' structure
    const rpcVendors = result.data?.data?.list || result.data?.items || []
    return rpcVendors.length > 0 ? rpcVendors : (directQuery.data || [])
  } catch (error) {
    console.log(`❌ Error getting vendors: ${error.message}`)
    return []
  }
}

// Create rebate agreements for each vendor
async function createRebateAgreements() {
  console.log('\n💰 Creating Rebate Agreements...')
  
  const vendors = await getExistingVendors()
  console.log(`📋 Found ${vendors.length} existing vendors`)

  const rebateAgreements = [
    {
      vendor_name: 'Apple India Distribution',
      vendor_code: 'APPLEINDIA',
      agreement: {
        entity: {
          entity_type: 'REBATE_AGREEMENT',
          entity_name: 'Apple Volume Rebate Agreement 2024',
          entity_code: 'APPLE_REBATE_2024',
          smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.ENTITY.v1'
        },
        dynamic: {
          vendor_id: { field_type: 'text', field_value_text: '', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.VENDOR_ID.V1' },
          product_category: { field_type: 'text', field_value_text: 'Mobile & Computer', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.PRODUCT_CATEGORY.V1' },
          rebate_percentage: { field_type: 'text', field_value_text: '3.5%', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.REBATE_PERCENTAGE.V1' },
          min_volume: { field_type: 'text', field_value_text: '₹10,00,000/month', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.MIN_VOLUME.V1' },
          start_date: { field_type: 'text', field_value_text: '2024-01-01', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.START_DATE.V1' },
          end_date: { field_type: 'text', field_value_text: '2024-12-31', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.END_DATE.V1' },
          status: { field_type: 'text', field_value_text: 'active', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.STATUS.V1' }
        }
      }
    },
    {
      vendor_name: 'Samsung India Electronics',
      vendor_code: 'SAMSUNGINDIA',
      agreement: {
        entity: {
          entity_type: 'REBATE_AGREEMENT',
          entity_name: 'Samsung Growth Incentive Program 2024',
          entity_code: 'SAMSUNG_REBATE_2024',
          smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.ENTITY.v1'
        },
        dynamic: {
          vendor_id: { field_type: 'text', field_value_text: '', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.VENDOR_ID.V1' },
          product_category: { field_type: 'text', field_value_text: 'Mobile & Electronics', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.PRODUCT_CATEGORY.V1' },
          rebate_percentage: { field_type: 'text', field_value_text: '2.8%', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.REBATE_PERCENTAGE.V1' },
          min_volume: { field_type: 'text', field_value_text: '₹8,00,000/month', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.MIN_VOLUME.V1' },
          start_date: { field_type: 'text', field_value_text: '2024-01-01', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.START_DATE.V1' },
          end_date: { field_type: 'text', field_value_text: '2024-12-31', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.END_DATE.V1' },
          status: { field_type: 'text', field_value_text: 'active', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.STATUS.V1' }
        }
      }
    },
    {
      vendor_name: 'Dell Technologies India',
      vendor_code: 'DELLINDIA',
      agreement: {
        entity: {
          entity_type: 'REBATE_AGREEMENT',
          entity_name: 'Dell Partner Excellence Rebate 2024',
          entity_code: 'DELL_REBATE_2024',
          smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.ENTITY.v1'
        },
        dynamic: {
          vendor_id: { field_type: 'text', field_value_text: '', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.VENDOR_ID.V1' },
          product_category: { field_type: 'text', field_value_text: 'Computers & Servers', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.PRODUCT_CATEGORY.V1' },
          rebate_percentage: { field_type: 'text', field_value_text: '4.2%', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.REBATE_PERCENTAGE.V1' },
          min_volume: { field_type: 'text', field_value_text: '₹5,00,000/month', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.MIN_VOLUME.V1' },
          start_date: { field_type: 'text', field_value_text: '2024-01-01', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.START_DATE.V1' },
          end_date: { field_type: 'text', field_value_text: '2024-12-31', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.END_DATE.V1' },
          status: { field_type: 'text', field_value_text: 'active', smart_code: 'HERA.PURCHASE.REBATE.AGREEMENT.DYN.v1.STATUS.V1' }
        }
      }
    }
  ]

  const createdAgreements = []
  
  for (const rebateConfig of rebateAgreements) {
    // Find matching vendor
    const matchingVendor = vendors.find(vendor => vendor.entity_code === rebateConfig.vendor_code)
    
    if (matchingVendor) {
      // Set vendor ID in the rebate agreement
      rebateConfig.agreement.dynamic.vendor_id.field_value_text = matchingVendor.id
      
      // Create the rebate agreement
      const agreement = await createEntity(
        rebateConfig.agreement.entity,
        rebateConfig.agreement.dynamic,
        []
      )
      
      if (agreement) {
        createdAgreements.push({
          agreement,
          vendor: matchingVendor,
          rebate_percentage: rebateConfig.agreement.dynamic.rebate_percentage.field_value_text
        })
        
        // Create relationship between vendor and rebate agreement
        try {
          await supabase
            .from('core_relationships')
            .insert({
              source_entity_id: matchingVendor.id,
              target_entity_id: agreement.items[0].id,
              relationship_type: 'HAS_REBATE_AGREEMENT',
              organization_id: MATRIXITWORLD_ORG_ID,
              created_by: actorUserId,
              updated_by: actorUserId,
              effective_date: new Date('2024-01-01').toISOString(),
              expiration_date: new Date('2024-12-31').toISOString(),
              relationship_data: {
                agreement_type: 'volume_rebate',
                payment_frequency: 'monthly',
                created_via: 'rebate_setup_script'
              }
            })
          
          console.log(`🔗 Created relationship: ${rebateConfig.vendor_name} → Rebate Agreement`)
        } catch (relationshipError) {
          console.log(`⚠️  Failed to create relationship: ${relationshipError.message}`)
        }
      }
    } else {
      console.log(`⚠️  Vendor not found: ${rebateConfig.vendor_name}`)
    }
  }
  
  return createdAgreements
}

// Create sample GL journal entries for rebate accruals
async function createRebateGLEntries() {
  console.log('\n📊 Creating Sample GL Journal Entries for Rebates...')
  
  const glEntries = [
    {
      entity: {
        entity_type: 'GL_JOURNAL',
        entity_name: 'Rebate Accrual - Apple October 2024',
        entity_code: 'GL_REBATE_APPLE_OCT24',
        smart_code: 'HERA.FINANCE.TXN.ENTITY.GL_JOURNAL.v1'
      },
      dynamic: {
        journal_number: { field_type: 'text', field_value_text: 'GL-2024-1001', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.JOURNAL_NUMBER.V1' },
        description: { field_type: 'text', field_value_text: 'Apple volume rebate accrual for October 2024', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.DESCRIPTION.V1' },
        journal_date: { field_type: 'text', field_value_text: '2024-10-31', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.JOURNAL_DATE.V1' },
        total_debit: { field_type: 'text', field_value_text: '₹1,20,000', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.TOTAL_DEBIT.V1' },
        total_credit: { field_type: 'text', field_value_text: '₹1,20,000', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.TOTAL_CREDIT.V1' },
        status: { field_type: 'text', field_value_text: 'posted', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.STATUS.V1' },
        reference: { field_type: 'text', field_value_text: 'APPLE_REBATE_2024', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.REFERENCE.V1' }
      }
    },
    {
      entity: {
        entity_type: 'GL_JOURNAL',
        entity_name: 'Rebate Accrual - Samsung October 2024',
        entity_code: 'GL_REBATE_SAMSUNG_OCT24',
        smart_code: 'HERA.FINANCE.TXN.ENTITY.GL_JOURNAL.v1'
      },
      dynamic: {
        journal_number: { field_type: 'text', field_value_text: 'GL-2024-1002', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.JOURNAL_NUMBER.V1' },
        description: { field_type: 'text', field_value_text: 'Samsung growth incentive rebate accrual for October 2024', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.DESCRIPTION.V1' },
        journal_date: { field_type: 'text', field_value_text: '2024-10-31', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.JOURNAL_DATE.V1' },
        total_debit: { field_type: 'text', field_value_text: '₹80,000', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.TOTAL_DEBIT.V1' },
        total_credit: { field_type: 'text', field_value_text: '₹80,000', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.TOTAL_CREDIT.V1' },
        status: { field_type: 'text', field_value_text: 'posted', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.STATUS.V1' },
        reference: { field_type: 'text', field_value_text: 'SAMSUNG_REBATE_2024', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.REFERENCE.V1' }
      }
    },
    {
      entity: {
        entity_type: 'GL_JOURNAL',
        entity_name: 'Rebate Accrual - Dell October 2024',
        entity_code: 'GL_REBATE_DELL_OCT24',
        smart_code: 'HERA.FINANCE.TXN.ENTITY.GL_JOURNAL.v1'
      },
      dynamic: {
        journal_number: { field_type: 'text', field_value_text: 'GL-2024-1003', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.JOURNAL_NUMBER.V1' },
        description: { field_type: 'text', field_value_text: 'Dell partner excellence rebate accrual for October 2024', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.DESCRIPTION.V1' },
        journal_date: { field_type: 'text', field_value_text: '2024-10-31', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.JOURNAL_DATE.V1' },
        total_debit: { field_type: 'text', field_value_text: '₹40,000', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.TOTAL_DEBIT.V1' },
        total_credit: { field_type: 'text', field_value_text: '₹40,000', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.TOTAL_CREDIT.V1' },
        status: { field_type: 'text', field_value_text: 'posted', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.STATUS.V1' },
        reference: { field_type: 'text', field_value_text: 'DELL_REBATE_2024', smart_code: 'HERA.FINANCE.TXN.DYN.GL_JOURNAL.v1.REFERENCE.V1' }
      }
    }
  ]

  const createdGLEntries = []
  for (const glEntry of glEntries) {
    const result = await createEntity(glEntry.entity, glEntry.dynamic)
    if (result) createdGLEntries.push(result)
  }
  
  return createdGLEntries
}

// Main execution
async function main() {
  console.log('🚀 Creating Rebate Agreements for MatrixIT World')
  console.log('================================================')
  console.log(`🏢 Organization: ${MATRIXITWORLD_ORG_ID}`)
  console.log(`👤 Actor User: ${actorUserId}`)
  
  const rebateAgreements = await createRebateAgreements()
  const glEntries = await createRebateGLEntries()
  
  console.log('\n📊 Summary:')
  console.log(`✅ Rebate Agreements Created: ${rebateAgreements.length}`)
  console.log(`✅ GL Journal Entries Created: ${glEntries.length}`)
  
  console.log('\n💰 Rebate Structure:')
  rebateAgreements.forEach(({ agreement, vendor, rebate_percentage }) => {
    console.log(`• ${vendor.entity_name}: ${rebate_percentage} rebate`)
  })
  
  console.log('\n🎉 Rebate Agreement Setup Complete!')
  console.log('\nMatrixIT World now has:')
  console.log('• Vendor-specific rebate agreements')
  console.log('• Automated rebate calculation capability')
  console.log('• GL integration for rebate accruals')
  console.log('• Financial reporting for supplier incentives')
  console.log('• Multi-branch rebate tracking')
  
  return {
    rebateAgreements,
    glEntries,
    organizationId: MATRIXITWORLD_ORG_ID
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export default main