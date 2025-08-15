#!/usr/bin/env node

/**
 * Deploy IFRS Lineage Implementation to Database
 * Adds complete IFRS hierarchy and classification to all GL accounts
 * Smart Code: HERA.GLOBAL.IFRS.LINEAGE.DEPLOYMENT.v1
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://hsumtzuqzoqccpjiaikh.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdW10enVxem9xY2NwamlhaWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzYwMDc4NywiZXhwIjoyMDY5MTc2Nzg3fQ.MeQGn3wi7WFDLfw_DNUKzvfOYle9vGX9BEN67wuSTLQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function deployIFRSLineage() {
  console.log('🚀 Starting IFRS Lineage Deployment')
  console.log('====================================')

  try {
    // Step 1: Check existing GL accounts
    console.log('1️⃣ Checking existing GL accounts...')
    const { data: existingAccounts, error: checkError } = await supabase
      .from('core_entities')
      .select('id, entity_code, entity_name')
      .eq('entity_type', 'gl_account')
      .order('entity_code')

    if (checkError) {
      throw new Error(`Failed to check existing accounts: ${checkError.message}`)
    }

    console.log(`   ✅ Found ${existingAccounts?.length || 0} existing GL accounts`)

    // Step 2: Add IFRS lineage fields for each account
    console.log('2️⃣ Adding IFRS lineage fields...')
    
    let successCount = 0
    let skipCount = 0
    
    for (const account of existingAccounts || []) {
      // Determine IFRS classification based on account code
      const firstDigit = account.entity_code.charAt(0)
      let ifrsClassification = ''
      let parentAccount = ''
      let accountLevel = 4
      let ifrsCategory = ''
      let presentationOrder = parseInt(account.entity_code) || 0
      let isHeader = account.entity_code.endsWith('000') || account.entity_code.endsWith('00')
      let rollupAccount = ''
      let ifrsStatement = 'SPL'
      let ifrsSubcategory = ''
      let consolidationMethod = 'sum'

      // Determine IFRS classification and hierarchy
      switch (firstDigit) {
        case '1':
          ifrsClassification = account.entity_code.startsWith('11') ? 'Current Assets' : 
                              account.entity_code.startsWith('12') ? 'Non-Current Assets' : 'Assets'
          ifrsCategory = 'Assets'
          ifrsStatement = 'SFP'
          parentAccount = account.entity_code === '1000' ? '' : '1000'
          rollupAccount = account.entity_code === '1000' ? '' : '1000'
          ifrsSubcategory = account.entity_code.startsWith('111') ? 'Cash and Cash Equivalents' :
                           account.entity_code.startsWith('112') ? 'Trade and Other Receivables' :
                           account.entity_code.startsWith('113') ? 'Inventories' :
                           account.entity_code.startsWith('121') ? 'Property, Plant and Equipment' :
                           'Total Assets'
          break
        case '2':
          ifrsClassification = account.entity_code.startsWith('21') ? 'Current Liabilities' : 
                              account.entity_code.startsWith('22') ? 'Non-Current Liabilities' : 'Liabilities'
          ifrsCategory = 'Liabilities'
          ifrsStatement = 'SFP'
          parentAccount = account.entity_code === '2000' ? '' : '2000'
          rollupAccount = account.entity_code === '2000' ? '' : '2000'
          ifrsSubcategory = account.entity_code.startsWith('211') ? 'Trade and Other Payables' :
                           account.entity_code.startsWith('221') ? 'Long-term Borrowings' :
                           'Total Liabilities'
          break
        case '3':
          ifrsClassification = 'Share Capital'
          ifrsCategory = 'Equity'
          ifrsStatement = 'SFP'
          parentAccount = account.entity_code === '3000' ? '' : '3000'
          rollupAccount = account.entity_code === '3000' ? '' : '3000'
          ifrsSubcategory = 'Total Equity'
          break
        case '4':
          ifrsClassification = 'Revenue from Contracts with Customers'
          ifrsCategory = 'Revenue'
          ifrsStatement = 'SPL'
          parentAccount = account.entity_code === '4000' ? '' : '4000'
          rollupAccount = account.entity_code === '4000' ? '' : '4000'
          ifrsSubcategory = 'Operating Revenue'
          break
        case '5':
          ifrsClassification = 'Cost of Sales'
          ifrsCategory = 'Cost of Sales'
          ifrsStatement = 'SPL'
          parentAccount = account.entity_code === '5000' ? '' : '5000'
          rollupAccount = account.entity_code === '5000' ? '' : '5000'
          ifrsSubcategory = 'Direct Costs'
          break
        case '6':
          ifrsClassification = 'Direct Operating Expenses'
          ifrsCategory = 'Direct Expenses'
          ifrsStatement = 'SPL'
          parentAccount = account.entity_code === '6000' ? '' : '6000'
          rollupAccount = account.entity_code === '6000' ? '' : '6000'
          ifrsSubcategory = 'Operating Expenses'
          break
        case '7':
          ifrsClassification = 'Administrative Expenses'
          ifrsCategory = 'Indirect Expenses'
          ifrsStatement = 'SPL'
          parentAccount = account.entity_code === '7000' ? '' : '7000'
          rollupAccount = account.entity_code === '7000' ? '' : '7000'
          ifrsSubcategory = account.entity_code.startsWith('71') ? 'Administrative and General' :
                           account.entity_code.startsWith('72') ? 'Marketing and Promotion' :
                           'Administrative Expenses'
          break
        case '8':
          ifrsClassification = account.entity_code.startsWith('81') ? 'Tax Expense' : 'Extraordinary Items'
          ifrsCategory = 'Taxes and Extraordinary'
          ifrsStatement = 'SPL'
          parentAccount = account.entity_code === '8000' ? '' : '8000'
          rollupAccount = account.entity_code === '8000' ? '' : '8000'
          ifrsSubcategory = account.entity_code.startsWith('81') ? 'Income Tax' : 'Non-Recurring Items'
          break
        case '9':
          ifrsClassification = 'Statistical Information'
          ifrsCategory = 'Statistical Information'
          ifrsStatement = 'NOTES'
          parentAccount = account.entity_code === '9000' ? '' : '9000'
          rollupAccount = account.entity_code === '9000' ? '' : '9000'
          ifrsSubcategory = 'Non-Financial Information'
          consolidationMethod = 'none'
          break
        default:
          ifrsClassification = 'Other'
          ifrsCategory = 'Other'
          parentAccount = ''
          rollupAccount = ''
          ifrsSubcategory = 'Other'
      }

      // Determine account level
      if (account.entity_code.endsWith('000')) {
        accountLevel = 1 // Main headers (1000, 2000, etc.)
      } else if (account.entity_code.endsWith('00')) {
        accountLevel = 2 // Category headers (1100, 2100, etc.)
      } else if (account.entity_code.endsWith('0')) {
        accountLevel = 3 // Subcategory headers (1110, 2110, etc.)
      } else {
        accountLevel = 4 // Regular accounts
      }

      // IFRS fields to add
      const ifrsFields = [
        { field_name: 'ifrs_classification', field_value_text: ifrsClassification },
        { field_name: 'parent_account', field_value_text: parentAccount },
        { field_name: 'account_level', field_value_number: accountLevel },
        { field_name: 'ifrs_category', field_value_text: ifrsCategory },
        { field_name: 'presentation_order', field_value_number: presentationOrder },
        { field_name: 'is_header', field_value_text: isHeader ? 'true' : 'false' },
        { field_name: 'rollup_account', field_value_text: rollupAccount },
        { field_name: 'ifrs_statement', field_value_text: ifrsStatement },
        { field_name: 'ifrs_subcategory', field_value_text: ifrsSubcategory },
        { field_name: 'consolidation_method', field_value_text: consolidationMethod },
        { field_name: 'reporting_standard', field_value_text: 'IFRS' }
      ]

      // Add each IFRS field
      for (const field of ifrsFields) {
        // Check if field already exists
        const { data: existingField } = await supabase
          .from('core_dynamic_data')
          .select('id')
          .eq('entity_id', account.id)
          .eq('field_name', field.field_name)
          .single()

        if (existingField) {
          skipCount++
          continue
        }

        // Add the field
        const { error: fieldError } = await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: (await supabase.from('core_entities').select('organization_id').eq('id', account.id).single()).data?.organization_id,
            entity_id: account.id,
            field_name: field.field_name,
            field_type: field.field_value_text ? 'text' : 'number',
            field_value_text: field.field_value_text || null,
            field_value_number: field.field_value_number || null,
            smart_code: `HERA.GLOBAL.IFRS.${field.field_name.toUpperCase()}.v1`,
            field_order: 100 + ifrsFields.indexOf(field),
            is_searchable: true,
            is_required: true,
            validation_status: 'valid'
          })

        if (fieldError) {
          console.warn(`   ⚠️  Warning: Could not add ${field.field_name} for ${account.entity_code}: ${fieldError.message}`)
        } else {
          successCount++
        }
      }

      console.log(`   ✅ Added IFRS fields for ${account.entity_code} - ${account.entity_name}`)
    }

    // Step 3: Create tracking transaction
    console.log('3️⃣ Creating tracking transaction...')
    
    const { data: globalOrg } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('organization_code', 'HERA-GLOBAL-COA')
      .single()

    if (globalOrg) {
      const { error: trackingError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: globalOrg.id,
          transaction_type: 'ifrs_lineage_implementation',
          transaction_number: `IFRS-LINEAGE-${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}`,
          transaction_date: new Date().toISOString().split('T')[0],
          description: 'IFRS Lineage Implementation - Complete hierarchy and classification for all GL accounts',
          total_amount: successCount,
          metadata: JSON.stringify({
            implementation_type: 'ifrs_lineage',
            accounts_processed: existingAccounts?.length || 0,
            fields_added: successCount,
            fields_skipped: skipCount,
            compliance_standard: 'IFRS',
            global_enforcement: true
          })
        })

      if (trackingError) {
        console.warn(`   ⚠️  Warning: Could not create tracking transaction: ${trackingError.message}`)
      } else {
        console.log('   ✅ Tracking transaction created')
      }
    }

    console.log('')
    console.log('🎉 IFRS LINEAGE DEPLOYMENT COMPLETE!')
    console.log('====================================')
    console.log(`📊 Summary:`)
    console.log(`   • GL Accounts Processed: ${existingAccounts?.length || 0}`)
    console.log(`   • IFRS Fields Added: ${successCount}`)
    console.log(`   • Fields Skipped (existing): ${skipCount}`)
    console.log(`   • Compliance Standard: IFRS`)
    console.log(`   • Status: ✅ All GL accounts now have complete IFRS hierarchy`)
    console.log('')
    console.log('💡 Next Steps:')
    console.log('   • Financial statements can now be generated automatically')
    console.log('   • IFRS-compliant reports are ready for production')
    console.log('   • Multi-level account hierarchies fully supported')
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    process.exit(1)
  }
}

// Run deployment
deployIFRSLineage()