#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Kerala Furniture Works (Demo) organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

async function fixCOAHierarchy() {
  console.log('🔧 Fixing Chart of Accounts hierarchy for Kerala Furniture Works...')
  
  try {
    // Get all GL accounts
    const { data: glAccounts, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'gl_account')
      .order('entity_code')
    
    if (error) {
      console.error('Error fetching GL accounts:', error)
      return
    }
    
    console.log(`Found ${glAccounts.length} GL accounts`)
    
    // Create a map for easy lookup
    const accountMap = {}
    glAccounts.forEach(account => {
      accountMap[account.entity_code] = account
    })
    
    // Define parent-child relationships based on account codes
    const relationships = []
    
    glAccounts.forEach(account => {
      const code = account.entity_code
      const metadata = account.metadata || {}
      
      // Determine parent based on code structure
      let parentCode = null
      
      if (code.length === 7 && code !== '1000000' && code !== '2000000' && code !== '3000000' && code !== '4000000' && code !== '5000000') {
        // This is a level 2-4 account
        if (metadata.account_level === 4) {
          // Level 4 account - find level 3 parent
          parentCode = code.substring(0, 6) + '0'
        } else if (metadata.account_level === 3) {
          // Level 3 account - find level 2 parent
          parentCode = code.substring(0, 4) + '000'
        } else if (metadata.account_level === 2) {
          // Level 2 account - find level 1 parent
          parentCode = code.charAt(0) + '000000'
        }
      }
      
      // If we found a parent and it exists, create the relationship
      if (parentCode && accountMap[parentCode] && accountMap[parentCode].id !== account.id) {
        relationships.push({
          from_entity_id: accountMap[parentCode].id, // Parent
          to_entity_id: account.id, // Child
          relationship_type: 'parent_of',
          smart_code: 'HERA.FIN.GL.REL.HIERARCHY.v1',
          organization_id: FURNITURE_ORG_ID,
          relationship_data: {
            relationship_subtype: 'account_hierarchy',
            parent_code: parentCode,
            child_code: code,
            parent_level: accountMap[parentCode].metadata?.account_level || 1,
            child_level: metadata.account_level || 4
          }
        })
      }
    })
    
    console.log(`\n📊 Creating ${relationships.length} hierarchy relationships...`)
    
    // Delete existing relationships first
    const { error: deleteError } = await supabase
      .from('core_relationships')
      .delete()
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('relationship_type', 'parent_of')
      .like('smart_code', '%GL.REL.HIERARCHY%')
    
    if (deleteError) {
      console.log('Note: Could not delete existing relationships:', deleteError.message)
    }
    
    // Insert relationships in batches
    const batchSize = 50
    let successCount = 0
    for (let i = 0; i < relationships.length; i += batchSize) {
      const batch = relationships.slice(i, i + batchSize)
      
      // Check for any self-relationships in the batch
      const selfRels = batch.filter(r => r.from_entity_id === r.to_entity_id)
      if (selfRels.length > 0) {
        console.log(`Warning: Found ${selfRels.length} self-relationships in batch ${i / batchSize + 1}`)
      }
      
      const { data, error: insertError } = await supabase
        .from('core_relationships')
        .insert(batch)
        .select()
      
      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError.message)
        
        // Try inserting one by one to find problematic records
        for (const rel of batch) {
          const { error: singleError } = await supabase
            .from('core_relationships')
            .insert(rel)
          
          if (!singleError) {
            successCount++
          }
        }
      } else {
        successCount += batch.length
        console.log(`✅ Created batch ${i / batchSize + 1} (${batch.length} relationships)`)
      }
    }
    
    console.log(`\n✅ Successfully created ${successCount} relationships`)
    
    // Show hierarchy summary
    console.log('\n🌳 Hierarchy Summary:')
    
    // Level 1 accounts
    const level1 = glAccounts.filter(a => a.metadata?.account_level === 1)
    console.log(`\nLevel 1 Accounts (${level1.length}):`)
    level1.forEach(account => {
      console.log(`  ${account.entity_code} - ${account.entity_name}`)
      
      // Count children
      const childCount = relationships.filter(r => 
        r.from_entity_id === account.id
      ).length
      if (childCount > 0) {
        console.log(`    └─ ${childCount} direct children`)
      }
    })
    
    // Show sample hierarchy
    console.log('\n📋 Sample Account Hierarchy:')
    const sampleParent = accountMap['1100000'] // Current Assets
    if (sampleParent) {
      console.log(`\n${sampleParent.entity_code} - ${sampleParent.entity_name}`)
      
      // Find level 3 children
      const level3Children = glAccounts.filter(a => 
        a.metadata?.parent_account === '1100000' && 
        a.metadata?.account_level === 3
      )
      
      level3Children.forEach(l3 => {
        console.log(`  └─ ${l3.entity_code} - ${l3.entity_name}`)
        
        // Find level 4 children
        const level4Children = glAccounts.filter(a => 
          a.entity_code.startsWith(l3.entity_code.substring(0, 4)) && 
          a.metadata?.account_level === 4 &&
          a.entity_code !== l3.entity_code
        )
        
        level4Children.slice(0, 3).forEach(l4 => {
          console.log(`      └─ ${l4.entity_code} - ${l4.entity_name}`)
        })
        
        if (level4Children.length > 3) {
          console.log(`      └─ ... and ${level4Children.length - 3} more`)
        }
      })
    }
    
    console.log('\n✅ Chart of Accounts hierarchy fixed successfully!')
    
  } catch (error) {
    console.error('Error fixing hierarchy:', error)
  }
}

fixCOAHierarchy().catch(console.error)