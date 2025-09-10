#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Kerala Furniture Works (Demo) organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

// Define complete hierarchy mapping
const hierarchyMap = {
  // ASSETS
  '1100000': '1000000', // Current Assets -> Assets
  '1110000': '1100000', // Cash and Cash Equivalents -> Current Assets
  '1111000': '1110000', '1112000': '1110000', '1113000': '1110000', '1114000': '1110000',
  
  '1120000': '1100000', // Trade Receivables -> Current Assets
  '1121000': '1120000', '1122000': '1120000', '1123000': '1120000', '1129000': '1120000',
  
  '1130000': '1100000', // Inventory -> Current Assets
  '1131000': '1130000', '1132000': '1130000', '1133000': '1130000', '1134000': '1130000', '1135000': '1130000', '1136000': '1130000',
  
  '1140000': '1100000', // Prepaid Expenses -> Current Assets
  '1141000': '1140000', '1142000': '1140000', '1143000': '1140000',
  
  '1150000': '1100000', // GST Receivables -> Current Assets
  '1151000': '1150000', '1152000': '1150000', '1153000': '1150000', '1154000': '1150000',
  
  '1200000': '1000000', // Non-Current Assets -> Assets
  '1210000': '1200000', // PPE -> Non-Current Assets
  '1211000': '1210000', '1212000': '1210000', '1213000': '1210000', '1214000': '1210000', '1215000': '1210000', '1216000': '1210000', '1217000': '1210000',
  
  '1220000': '1200000', // Accumulated Depreciation -> Non-Current Assets
  '1221000': '1220000', '1222000': '1220000', '1223000': '1220000', '1224000': '1220000', '1225000': '1220000',
  
  // LIABILITIES
  '2100000': '2000000', // Current Liabilities -> Liabilities
  '2110000': '2100000', // Trade Payables -> Current Liabilities
  '2111000': '2110000', '2112000': '2110000', '2113000': '2110000',
  
  '2120000': '2100000', // Short-term Borrowings -> Current Liabilities
  '2121000': '2120000', '2122000': '2120000', '2123000': '2120000',
  
  '2130000': '2100000', // Other Current Liabilities -> Current Liabilities
  '2131000': '2130000', '2132000': '2130000', '2133000': '2130000', '2134000': '2130000',
  
  '2140000': '2100000', // Statutory Liabilities -> Current Liabilities
  '2141000': '2140000', '2142000': '2140000', '2143000': '2140000', '2144000': '2140000', '2145000': '2140000', '2146000': '2140000', '2147000': '2140000', '2148000': '2140000',
  
  '2200000': '2000000', // Non-Current Liabilities -> Liabilities
  '2210000': '2200000', // Long-term Borrowings -> Non-Current Liabilities
  '2211000': '2210000', '2212000': '2210000', '2213000': '2210000',
  
  // EQUITY
  '3100000': '3000000', // Share Capital -> Equity
  '3110000': '3100000', '3120000': '3100000',
  
  '3200000': '3000000', // Reserves and Surplus -> Equity
  '3210000': '3200000', '3220000': '3200000', '3230000': '3200000',
  
  // INCOME
  '4100000': '4000000', // Revenue from Operations -> Income
  '4110000': '4100000', // Domestic Sales -> Revenue from Operations
  '4111000': '4110000', '4112000': '4110000', '4113000': '4110000', '4114000': '4110000',
  
  '4120000': '4100000', // Export Sales -> Revenue from Operations
  '4121000': '4120000', '4122000': '4120000',
  
  '4130000': '4100000', // Other Operating Revenue -> Revenue from Operations
  '4131000': '4130000', '4132000': '4130000', '4133000': '4130000',
  
  '4190000': '4100000', // Sales Returns -> Revenue from Operations
  '4191000': '4190000', '4192000': '4190000',
  
  '4200000': '4000000', // Other Income -> Income
  '4210000': '4200000', '4220000': '4200000', '4230000': '4200000', '4240000': '4200000',
  
  // EXPENSES
  '5100000': '5000000', // COGS -> Expenses
  '5110000': '5100000', // Material Costs -> COGS
  '5111000': '5110000', '5112000': '5110000', '5113000': '5110000', '5114000': '5110000', '5115000': '5110000',
  
  '5120000': '5100000', // Direct Labor -> COGS
  '5121000': '5120000', '5122000': '5120000', '5123000': '5120000', '5124000': '5120000',
  
  '5130000': '5100000', // Manufacturing Overheads -> COGS
  '5131000': '5130000', '5132000': '5130000', '5133000': '5130000', '5134000': '5130000', '5135000': '5130000',
  
  '5200000': '5000000', // Employee Benefits -> Expenses
  '5210000': '5200000', '5220000': '5200000', '5230000': '5200000', '5240000': '5200000', '5250000': '5200000', '5260000': '5200000',
  
  '5300000': '5000000', // Selling and Distribution -> Expenses
  '5310000': '5300000', '5320000': '5300000', '5330000': '5300000', '5340000': '5300000', '5350000': '5300000',
  
  '5400000': '5000000', // Administrative Expenses -> Expenses
  '5410000': '5400000', '5420000': '5400000', '5430000': '5400000', '5440000': '5400000', '5450000': '5400000', '5460000': '5400000', '5470000': '5400000',
  
  '5500000': '5000000', // Finance Costs -> Expenses
  '5510000': '5500000', '5520000': '5500000', '5530000': '5500000', '5540000': '5500000',
  
  '5600000': '5000000', // Depreciation -> Expenses
  '5610000': '5600000', '5620000': '5600000', '5630000': '5600000', '5640000': '5600000',
  
  '5700000': '5000000', // Other Expenses -> Expenses
  '5710000': '5700000', '5720000': '5700000', '5730000': '5700000', '5740000': '5700000',
  
  '5900000': '5000000', // Taxes -> Expenses
  '5910000': '5900000', '5920000': '5900000'
}

async function fixCompleteHierarchy() {
  console.log('🔧 Creating complete Chart of Accounts hierarchy...')
  
  try {
    // Get all GL accounts
    const { data: glAccounts } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'gl_account')
      .order('entity_code')
    
    if (!glAccounts || glAccounts.length === 0) {
      console.error('No GL accounts found')
      return
    }
    
    console.log(`Found ${glAccounts.length} GL accounts`)
    
    // Create a map for easy lookup
    const accountMap = {}
    glAccounts.forEach(account => {
      accountMap[account.entity_code] = account
    })
    
    // Delete existing hierarchy relationships
    console.log('\n🗑️ Deleting existing hierarchy relationships...')
    const { error: deleteError } = await supabase
      .from('core_relationships')
      .delete()
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('relationship_type', 'parent_of')
      .eq('smart_code', 'HERA.FIN.GL.REL.HIERARCHY.v1')
    
    if (deleteError) {
      console.log('Note: Could not delete existing relationships:', deleteError.message)
    }
    
    // Create relationships based on hierarchy map
    const relationships = []
    for (const [childCode, parentCode] of Object.entries(hierarchyMap)) {
      const child = accountMap[childCode]
      const parent = accountMap[parentCode]
      
      if (child && parent) {
        relationships.push({
          from_entity_id: parent.id,
          to_entity_id: child.id,
          relationship_type: 'parent_of',
          smart_code: 'HERA.FIN.GL.REL.HIERARCHY.v1',
          organization_id: FURNITURE_ORG_ID,
          relationship_data: {
            relationship_subtype: 'account_hierarchy',
            parent_code: parentCode,
            child_code: childCode,
            parent_name: parent.entity_name,
            child_name: child.entity_name
          }
        })
      }
    }
    
    console.log(`\n📊 Creating ${relationships.length} hierarchy relationships...`)
    
    // Insert in batches
    const batchSize = 50
    let successCount = 0
    
    for (let i = 0; i < relationships.length; i += batchSize) {
      const batch = relationships.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from('core_relationships')
        .insert(batch)
      
      if (error) {
        console.error(`Error in batch ${Math.floor(i/batchSize) + 1}:`, error.message)
      } else {
        successCount += batch.length
        console.log(`✅ Created batch ${Math.floor(i/batchSize) + 1} (${batch.length} relationships)`)
      }
    }
    
    console.log(`\n✅ Successfully created ${successCount} relationships`)
    
    // Display hierarchy tree
    console.log('\n🌳 Complete Account Hierarchy:')
    
    // Show top-level accounts
    const topLevel = ['1000000', '2000000', '3000000', '4000000', '5000000']
    topLevel.forEach(code => {
      const account = accountMap[code]
      if (account) {
        console.log(`\n${code} - ${account.entity_name}`)
        
        // Show level 2 children
        const level2Children = Object.entries(hierarchyMap)
          .filter(([child, parent]) => parent === code)
          .map(([child]) => child)
          .sort()
        
        level2Children.forEach(l2Code => {
          const l2Account = accountMap[l2Code]
          if (l2Account) {
            console.log(`  └─ ${l2Code} - ${l2Account.entity_name}`)
            
            // Count level 3 children
            const l3Count = Object.entries(hierarchyMap)
              .filter(([child, parent]) => parent === l2Code)
              .length
            
            if (l3Count > 0) {
              console.log(`      └─ ${l3Count} sub-accounts`)
            }
          }
        })
      }
    })
    
    console.log('\n✅ Chart of Accounts hierarchy setup complete!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixCompleteHierarchy().catch(console.error)