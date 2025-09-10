#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Kerala Furniture Works (Demo) organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

async function verifyFurnitureCOA() {
  console.log('🔍 Verifying Universal Chart of Accounts for Kerala Furniture Works...\n')
  
  try {
    // Get all GL accounts
    const { data: accounts, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'gl_account')
      .order('entity_code')
    
    if (error) {
      console.error('Error fetching accounts:', error)
      return
    }
    
    console.log(`📊 Total GL Accounts: ${accounts.length}`)
    
    // Group by account type
    const accountsByType = {}
    const accountsByLevel = {}
    
    accounts.forEach(account => {
      const type = account.metadata?.account_type || 'unknown'
      const level = account.metadata?.account_level || 0
      
      accountsByType[type] = (accountsByType[type] || 0) + 1
      accountsByLevel[level] = (accountsByLevel[level] || 0) + 1
    })
    
    console.log('\n📈 Accounts by Type:')
    Object.entries(accountsByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`)
    })
    
    console.log('\n📊 Accounts by Level:')
    Object.entries(accountsByLevel).sort((a, b) => a[0] - b[0]).forEach(([level, count]) => {
      console.log(`   Level ${level}: ${count} accounts`)
    })
    
    // Show account hierarchy
    console.log('\n🌳 Account Hierarchy (Top Level):')
    const topLevelAccounts = accounts.filter(a => a.metadata?.account_level === 1)
    topLevelAccounts.forEach(account => {
      console.log(`\n${account.entity_code} - ${account.entity_name}`)
      
      // Show level 2 accounts
      const level2 = accounts.filter(a => 
        a.metadata?.parent_account === account.entity_code && 
        a.metadata?.account_level === 2
      )
      level2.forEach(l2 => {
        console.log(`  └─ ${l2.entity_code} - ${l2.entity_name}`)
        
        // Show level 3 accounts (just count)
        const level3Count = accounts.filter(a => 
          a.metadata?.parent_account === l2.entity_code && 
          a.metadata?.account_level === 3
        ).length
        
        if (level3Count > 0) {
          console.log(`     └─ (${level3Count} sub-accounts)`)
        }
      })
    })
    
    // Check posting rules
    const { data: postingRules } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'posting_rule')
    
    console.log(`\n⚙️ Posting Rules: ${postingRules?.length || 0}`)
    postingRules?.forEach(rule => {
      console.log(`   - ${rule.entity_name} (${rule.entity_code})`)
    })
    
    // Sample accounts for key areas
    console.log('\n🔑 Key Accounts Created:')
    const keyAccounts = [
      { code: '1112000', desc: 'Main Bank Account' },
      { code: '1121000', desc: 'Customer Receivables' },
      { code: '1131000', desc: 'Wood Inventory' },
      { code: '1135000', desc: 'Finished Furniture' },
      { code: '2111000', desc: 'Supplier Payables' },
      { code: '2141000', desc: 'GST Payable' },
      { code: '4111000', desc: 'Furniture Sales - Retail' },
      { code: '5111000', desc: 'Wood and Timber Costs' }
    ]
    
    keyAccounts.forEach(({ code, desc }) => {
      const account = accounts.find(a => a.entity_code === code)
      if (account) {
        console.log(`   ✅ ${code} - ${account.entity_name} (${desc})`)
      } else {
        console.log(`   ❌ ${code} - Not found (${desc})`)
      }
    })
    
    // Check for Indian-specific accounts
    console.log('\n🇮🇳 Indian Compliance Accounts:')
    const indianAccounts = [
      { pattern: 'GST', desc: 'GST related accounts' },
      { pattern: 'TDS', desc: 'Tax Deducted at Source' },
      { pattern: 'PF', desc: 'Provident Fund' },
      { pattern: 'ESI', desc: 'Employee State Insurance' }
    ]
    
    indianAccounts.forEach(({ pattern, desc }) => {
      const count = accounts.filter(a => 
        a.entity_name.includes(pattern) || 
        a.entity_code.includes(pattern)
      ).length
      console.log(`   ${desc}: ${count} accounts`)
    })
    
    console.log('\n✅ COA verification completed!')
    
  } catch (error) {
    console.error('Error verifying COA:', error)
  }
}

verifyFurnitureCOA().catch(console.error)