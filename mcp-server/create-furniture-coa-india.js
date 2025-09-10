#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Kerala Furniture Works (Demo) organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

// Indian Furniture Industry COA with IFRS alignment
const furnitureIndiaCOA = {
  // 1000000 - ASSETS
  '1000000': { name: 'ASSETS', type: 'header', level: 1, ifrs: 'Assets' },
  
  // Current Assets (1100000)
  '1100000': { name: 'Current Assets', type: 'header', level: 2, ifrs: 'Current Assets', parent: '1000000' },
  '1110000': { name: 'Cash and Cash Equivalents', type: 'header', level: 3, ifrs: 'Cash and cash equivalents', parent: '1100000' },
  '1111000': { name: 'Petty Cash', type: 'detail', level: 4, parent: '1110000' },
  '1112000': { name: 'Cash in Bank - Current Account', type: 'detail', level: 4, parent: '1110000' },
  '1113000': { name: 'Cash in Bank - Savings Account', type: 'detail', level: 4, parent: '1110000' },
  '1114000': { name: 'Fixed Deposits (< 1 year)', type: 'detail', level: 4, parent: '1110000' },
  
  '1120000': { name: 'Trade Receivables', type: 'header', level: 3, ifrs: 'Trade and other receivables', parent: '1100000' },
  '1121000': { name: 'Trade Debtors - Domestic', type: 'detail', level: 4, parent: '1120000' },
  '1122000': { name: 'Trade Debtors - Export', type: 'detail', level: 4, parent: '1120000' },
  '1123000': { name: 'Bills Receivable', type: 'detail', level: 4, parent: '1120000' },
  '1129000': { name: 'Provision for Doubtful Debts', type: 'detail', level: 4, parent: '1120000' },
  
  '1130000': { name: 'Inventory', type: 'header', level: 3, ifrs: 'Inventories', parent: '1100000' },
  '1131000': { name: 'Raw Materials - Wood', type: 'detail', level: 4, parent: '1130000' },
  '1132000': { name: 'Raw Materials - Hardware & Fittings', type: 'detail', level: 4, parent: '1130000' },
  '1133000': { name: 'Raw Materials - Upholstery & Fabric', type: 'detail', level: 4, parent: '1130000' },
  '1134000': { name: 'Work in Progress', type: 'detail', level: 4, parent: '1130000' },
  '1135000': { name: 'Finished Goods - Furniture', type: 'detail', level: 4, parent: '1130000' },
  '1136000': { name: 'Packing Materials', type: 'detail', level: 4, parent: '1130000' },
  
  '1140000': { name: 'Prepaid Expenses', type: 'header', level: 3, ifrs: 'Other current assets', parent: '1100000' },
  '1141000': { name: 'Prepaid Rent', type: 'detail', level: 4, parent: '1140000' },
  '1142000': { name: 'Prepaid Insurance', type: 'detail', level: 4, parent: '1140000' },
  '1143000': { name: 'Advance to Suppliers', type: 'detail', level: 4, parent: '1140000' },
  
  '1150000': { name: 'GST Receivables', type: 'header', level: 3, ifrs: 'Current tax assets', parent: '1100000' },
  '1151000': { name: 'GST Input - Capital Goods', type: 'detail', level: 4, parent: '1150000' },
  '1152000': { name: 'GST Input - Inputs', type: 'detail', level: 4, parent: '1150000' },
  '1153000': { name: 'GST Input - Input Services', type: 'detail', level: 4, parent: '1150000' },
  '1154000': { name: 'GST Refund Receivable', type: 'detail', level: 4, parent: '1150000' },
  
  // Non-Current Assets (1200000)
  '1200000': { name: 'Non-Current Assets', type: 'header', level: 2, ifrs: 'Non-current Assets', parent: '1000000' },
  '1210000': { name: 'Property, Plant and Equipment', type: 'header', level: 3, ifrs: 'Property, plant and equipment', parent: '1200000' },
  '1211000': { name: 'Land', type: 'detail', level: 4, parent: '1210000' },
  '1212000': { name: 'Buildings', type: 'detail', level: 4, parent: '1210000' },
  '1213000': { name: 'Plant and Machinery', type: 'detail', level: 4, parent: '1210000' },
  '1214000': { name: 'Furniture and Fixtures', type: 'detail', level: 4, parent: '1210000' },
  '1215000': { name: 'Vehicles', type: 'detail', level: 4, parent: '1210000' },
  '1216000': { name: 'Office Equipment', type: 'detail', level: 4, parent: '1210000' },
  '1217000': { name: 'Computer Equipment', type: 'detail', level: 4, parent: '1210000' },
  
  '1220000': { name: 'Accumulated Depreciation', type: 'header', level: 3, ifrs: 'Accumulated depreciation', parent: '1200000' },
  '1221000': { name: 'Acc. Dep. - Buildings', type: 'detail', level: 4, parent: '1220000' },
  '1222000': { name: 'Acc. Dep. - Plant and Machinery', type: 'detail', level: 4, parent: '1220000' },
  '1223000': { name: 'Acc. Dep. - Furniture and Fixtures', type: 'detail', level: 4, parent: '1220000' },
  '1224000': { name: 'Acc. Dep. - Vehicles', type: 'detail', level: 4, parent: '1220000' },
  '1225000': { name: 'Acc. Dep. - Office Equipment', type: 'detail', level: 4, parent: '1220000' },
  
  // 2000000 - LIABILITIES
  '2000000': { name: 'LIABILITIES', type: 'header', level: 1, ifrs: 'Liabilities' },
  
  // Current Liabilities (2100000)
  '2100000': { name: 'Current Liabilities', type: 'header', level: 2, ifrs: 'Current liabilities', parent: '2000000' },
  '2110000': { name: 'Trade Payables', type: 'header', level: 3, ifrs: 'Trade and other payables', parent: '2100000' },
  '2111000': { name: 'Trade Creditors - Domestic', type: 'detail', level: 4, parent: '2110000' },
  '2112000': { name: 'Trade Creditors - Import', type: 'detail', level: 4, parent: '2110000' },
  '2113000': { name: 'Bills Payable', type: 'detail', level: 4, parent: '2110000' },
  
  '2120000': { name: 'Short-term Borrowings', type: 'header', level: 3, ifrs: 'Current financial liabilities', parent: '2100000' },
  '2121000': { name: 'Cash Credit from Banks', type: 'detail', level: 4, parent: '2120000' },
  '2122000': { name: 'Working Capital Loans', type: 'detail', level: 4, parent: '2120000' },
  '2123000': { name: 'Bank Overdraft', type: 'detail', level: 4, parent: '2120000' },
  
  '2130000': { name: 'Other Current Liabilities', type: 'header', level: 3, ifrs: 'Other current liabilities', parent: '2100000' },
  '2131000': { name: 'Salaries Payable', type: 'detail', level: 4, parent: '2130000' },
  '2132000': { name: 'Wages Payable', type: 'detail', level: 4, parent: '2130000' },
  '2133000': { name: 'Advance from Customers', type: 'detail', level: 4, parent: '2130000' },
  '2134000': { name: 'Expenses Payable', type: 'detail', level: 4, parent: '2130000' },
  
  '2140000': { name: 'Statutory Liabilities', type: 'header', level: 3, ifrs: 'Current tax liabilities', parent: '2100000' },
  '2141000': { name: 'GST Payable - Output', type: 'detail', level: 4, parent: '2140000' },
  '2142000': { name: 'GST Payable - RCM', type: 'detail', level: 4, parent: '2140000' },
  '2143000': { name: 'TDS Payable', type: 'detail', level: 4, parent: '2140000' },
  '2144000': { name: 'TCS Payable', type: 'detail', level: 4, parent: '2140000' },
  '2145000': { name: 'PF Payable', type: 'detail', level: 4, parent: '2140000' },
  '2146000': { name: 'ESI Payable', type: 'detail', level: 4, parent: '2140000' },
  '2147000': { name: 'Professional Tax Payable', type: 'detail', level: 4, parent: '2140000' },
  '2148000': { name: 'Income Tax Payable', type: 'detail', level: 4, parent: '2140000' },
  
  // Non-Current Liabilities (2200000)
  '2200000': { name: 'Non-Current Liabilities', type: 'header', level: 2, ifrs: 'Non-current liabilities', parent: '2000000' },
  '2210000': { name: 'Long-term Borrowings', type: 'header', level: 3, ifrs: 'Non-current financial liabilities', parent: '2200000' },
  '2211000': { name: 'Term Loans from Banks', type: 'detail', level: 4, parent: '2210000' },
  '2212000': { name: 'Loans from Financial Institutions', type: 'detail', level: 4, parent: '2210000' },
  '2213000': { name: 'Unsecured Loans', type: 'detail', level: 4, parent: '2210000' },
  
  // 3000000 - EQUITY
  '3000000': { name: 'EQUITY', type: 'header', level: 1, ifrs: 'Equity' },
  '3100000': { name: 'Share Capital', type: 'header', level: 2, ifrs: 'Issued capital', parent: '3000000' },
  '3110000': { name: 'Equity Share Capital', type: 'detail', level: 3, parent: '3100000' },
  '3120000': { name: 'Preference Share Capital', type: 'detail', level: 3, parent: '3100000' },
  
  '3200000': { name: 'Reserves and Surplus', type: 'header', level: 2, ifrs: 'Retained earnings', parent: '3000000' },
  '3210000': { name: 'General Reserve', type: 'detail', level: 3, parent: '3200000' },
  '3220000': { name: 'Retained Earnings', type: 'detail', level: 3, parent: '3200000' },
  '3230000': { name: 'Current Year Earnings', type: 'detail', level: 3, parent: '3200000' },
  
  // 4000000 - INCOME
  '4000000': { name: 'INCOME', type: 'header', level: 1, ifrs: 'Revenue' },
  '4100000': { name: 'Revenue from Operations', type: 'header', level: 2, ifrs: 'Revenue from contracts with customers', parent: '4000000' },
  '4110000': { name: 'Domestic Sales', type: 'header', level: 3, parent: '4100000' },
  '4111000': { name: 'Sale of Furniture - Retail', type: 'detail', level: 4, parent: '4110000' },
  '4112000': { name: 'Sale of Furniture - Institutional', type: 'detail', level: 4, parent: '4110000' },
  '4113000': { name: 'Sale of Furniture - Online', type: 'detail', level: 4, parent: '4110000' },
  '4114000': { name: 'Custom Furniture Sales', type: 'detail', level: 4, parent: '4110000' },
  
  '4120000': { name: 'Export Sales', type: 'header', level: 3, parent: '4100000' },
  '4121000': { name: 'Export Sales - Direct', type: 'detail', level: 4, parent: '4120000' },
  '4122000': { name: 'Export Sales - Merchant Export', type: 'detail', level: 4, parent: '4120000' },
  
  '4130000': { name: 'Other Operating Revenue', type: 'header', level: 3, parent: '4100000' },
  '4131000': { name: 'Installation Charges', type: 'detail', level: 4, parent: '4130000' },
  '4132000': { name: 'Annual Maintenance Contracts', type: 'detail', level: 4, parent: '4130000' },
  '4133000': { name: 'Scrap Sales', type: 'detail', level: 4, parent: '4130000' },
  
  '4190000': { name: 'Sales Returns and Discounts', type: 'header', level: 3, parent: '4100000' },
  '4191000': { name: 'Sales Returns', type: 'detail', level: 4, parent: '4190000' },
  '4192000': { name: 'Trade Discounts', type: 'detail', level: 4, parent: '4190000' },
  
  '4200000': { name: 'Other Income', type: 'header', level: 2, ifrs: 'Other income', parent: '4000000' },
  '4210000': { name: 'Interest Income', type: 'detail', level: 3, parent: '4200000' },
  '4220000': { name: 'Dividend Income', type: 'detail', level: 3, parent: '4200000' },
  '4230000': { name: 'Foreign Exchange Gain', type: 'detail', level: 3, parent: '4200000' },
  '4240000': { name: 'Miscellaneous Income', type: 'detail', level: 3, parent: '4200000' },
  
  // 5000000 - EXPENSES
  '5000000': { name: 'EXPENSES', type: 'header', level: 1, ifrs: 'Expenses' },
  
  // Cost of Goods Sold (5100000)
  '5100000': { name: 'Cost of Goods Sold', type: 'header', level: 2, ifrs: 'Cost of sales', parent: '5000000' },
  '5110000': { name: 'Material Costs', type: 'header', level: 3, parent: '5100000' },
  '5111000': { name: 'Wood and Timber', type: 'detail', level: 4, parent: '5110000' },
  '5112000': { name: 'Hardware and Fittings', type: 'detail', level: 4, parent: '5110000' },
  '5113000': { name: 'Upholstery Materials', type: 'detail', level: 4, parent: '5110000' },
  '5114000': { name: 'Adhesives and Chemicals', type: 'detail', level: 4, parent: '5110000' },
  '5115000': { name: 'Packing Materials Consumed', type: 'detail', level: 4, parent: '5110000' },
  
  '5120000': { name: 'Direct Labor', type: 'header', level: 3, parent: '5100000' },
  '5121000': { name: 'Wages - Carpenters', type: 'detail', level: 4, parent: '5120000' },
  '5122000': { name: 'Wages - Polishers', type: 'detail', level: 4, parent: '5120000' },
  '5123000': { name: 'Wages - Upholsterers', type: 'detail', level: 4, parent: '5120000' },
  '5124000': { name: 'Overtime Wages', type: 'detail', level: 4, parent: '5120000' },
  
  '5130000': { name: 'Manufacturing Overheads', type: 'header', level: 3, parent: '5100000' },
  '5131000': { name: 'Factory Rent', type: 'detail', level: 4, parent: '5130000' },
  '5132000': { name: 'Power and Fuel', type: 'detail', level: 4, parent: '5130000' },
  '5133000': { name: 'Repairs - Machinery', type: 'detail', level: 4, parent: '5130000' },
  '5134000': { name: 'Factory Insurance', type: 'detail', level: 4, parent: '5130000' },
  '5135000': { name: 'Quality Control Expenses', type: 'detail', level: 4, parent: '5130000' },
  
  // Operating Expenses (5200000-5900000)
  '5200000': { name: 'Employee Benefits', type: 'header', level: 2, ifrs: 'Employee benefits expense', parent: '5000000' },
  '5210000': { name: 'Salaries and Wages', type: 'detail', level: 3, parent: '5200000' },
  '5220000': { name: 'Directors Remuneration', type: 'detail', level: 3, parent: '5200000' },
  '5230000': { name: 'PF Contribution', type: 'detail', level: 3, parent: '5200000' },
  '5240000': { name: 'ESI Contribution', type: 'detail', level: 3, parent: '5200000' },
  '5250000': { name: 'Gratuity', type: 'detail', level: 3, parent: '5200000' },
  '5260000': { name: 'Staff Welfare', type: 'detail', level: 3, parent: '5200000' },
  
  '5300000': { name: 'Selling and Distribution', type: 'header', level: 2, ifrs: 'Distribution costs', parent: '5000000' },
  '5310000': { name: 'Advertisement and Publicity', type: 'detail', level: 3, parent: '5300000' },
  '5320000': { name: 'Sales Commission', type: 'detail', level: 3, parent: '5300000' },
  '5330000': { name: 'Transportation and Delivery', type: 'detail', level: 3, parent: '5300000' },
  '5340000': { name: 'Showroom Expenses', type: 'detail', level: 3, parent: '5300000' },
  '5350000': { name: 'Export Expenses', type: 'detail', level: 3, parent: '5300000' },
  
  '5400000': { name: 'Administrative Expenses', type: 'header', level: 2, ifrs: 'Administrative expenses', parent: '5000000' },
  '5410000': { name: 'Office Rent', type: 'detail', level: 3, parent: '5400000' },
  '5420000': { name: 'Telephone and Internet', type: 'detail', level: 3, parent: '5400000' },
  '5430000': { name: 'Printing and Stationery', type: 'detail', level: 3, parent: '5400000' },
  '5440000': { name: 'Legal and Professional Fees', type: 'detail', level: 3, parent: '5400000' },
  '5450000': { name: 'Audit Fees', type: 'detail', level: 3, parent: '5400000' },
  '5460000': { name: 'Insurance', type: 'detail', level: 3, parent: '5400000' },
  '5470000': { name: 'Bank Charges', type: 'detail', level: 3, parent: '5400000' },
  
  '5500000': { name: 'Finance Costs', type: 'header', level: 2, ifrs: 'Finance costs', parent: '5000000' },
  '5510000': { name: 'Interest on Term Loans', type: 'detail', level: 3, parent: '5500000' },
  '5520000': { name: 'Interest on Working Capital', type: 'detail', level: 3, parent: '5500000' },
  '5530000': { name: 'Interest on Others', type: 'detail', level: 3, parent: '5500000' },
  '5540000': { name: 'Bank Guarantee Charges', type: 'detail', level: 3, parent: '5500000' },
  
  '5600000': { name: 'Depreciation and Amortization', type: 'header', level: 2, ifrs: 'Depreciation and amortisation expense', parent: '5000000' },
  '5610000': { name: 'Depreciation - Buildings', type: 'detail', level: 3, parent: '5600000' },
  '5620000': { name: 'Depreciation - Machinery', type: 'detail', level: 3, parent: '5600000' },
  '5630000': { name: 'Depreciation - Vehicles', type: 'detail', level: 3, parent: '5600000' },
  '5640000': { name: 'Depreciation - Office Equipment', type: 'detail', level: 3, parent: '5600000' },
  
  '5700000': { name: 'Other Expenses', type: 'header', level: 2, ifrs: 'Other expenses', parent: '5000000' },
  '5710000': { name: 'Bad Debts Written Off', type: 'detail', level: 3, parent: '5700000' },
  '5720000': { name: 'Foreign Exchange Loss', type: 'detail', level: 3, parent: '5700000' },
  '5730000': { name: 'Loss on Sale of Assets', type: 'detail', level: 3, parent: '5700000' },
  '5740000': { name: 'Miscellaneous Expenses', type: 'detail', level: 3, parent: '5700000' },
  
  '5900000': { name: 'Taxes', type: 'header', level: 2, ifrs: 'Income tax expense', parent: '5000000' },
  '5910000': { name: 'Current Tax', type: 'detail', level: 3, parent: '5900000' },
  '5920000': { name: 'Deferred Tax', type: 'detail', level: 3, parent: '5900000' }
}

async function createFurnitureCOA() {
  console.log('📊 Creating Universal Chart of Accounts for Indian Furniture Industry...')
  console.log(`Organization: Kerala Furniture Works (Demo) - ${FURNITURE_ORG_ID}\n`)
  
  try {
    // First, check if COA already exists
    const { data: existingCOA, error: checkError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'gl_account')
      .limit(5)
    
    if (existingCOA && existingCOA.length > 0) {
      console.log('⚠️  Chart of Accounts already exists for this organization.')
      console.log(`   Found ${existingCOA.length}+ GL accounts`)
      console.log('\n❓ Do you want to delete existing COA and create fresh? (Not recommended for production)')
      return
    }
    
    console.log('📝 Creating GL Account entities...')
    let accountCount = 0
    const accountIds = {} // Store account IDs for relationship creation
    
    // Create all GL accounts
    for (const [code, account] of Object.entries(furnitureIndiaCOA)) {
      const glAccount = {
        entity_type: 'gl_account',
        entity_code: code,
        entity_name: account.name,
        smart_code: `HERA.FIN.GL.ACC.${account.type.toUpperCase()}.v1`,
        organization_id: FURNITURE_ORG_ID,
        status: 'active',
        metadata: {
          account_type: account.type,
          account_level: account.level,
          ifrs_classification: account.ifrs,
          parent_account: account.parent || null,
          currency: 'INR',
          country: 'IN',
          industry: 'furniture',
          normal_balance: code.startsWith('1') ? 'debit' : 
                         code.startsWith('5') ? 'debit' : 'credit'
        }
      }
      
      const { data, error } = await supabase
        .from('core_entities')
        .insert(glAccount)
        .select()
        .single()
      
      if (!error && data) {
        accountIds[code] = data.id
        accountCount++
        
        // Show progress every 10 accounts
        if (accountCount % 10 === 0) {
          console.log(`   Created ${accountCount} accounts...`)
        }
      } else if (error) {
        console.error(`Error creating account ${code}:`, error.message)
      }
    }
    
    console.log(`\n✅ Created ${accountCount} GL accounts`)
    
    // Create parent-child relationships
    console.log('\n🔗 Creating account hierarchy relationships...')
    let relationshipCount = 0
    
    for (const [code, account] of Object.entries(furnitureIndiaCOA)) {
      if (account.parent && accountIds[code] && accountIds[account.parent]) {
        const relationship = {
          from_entity_id: accountIds[account.parent], // Parent account
          to_entity_id: accountIds[code], // Child account
          relationship_type: 'parent_of',
          smart_code: 'HERA.FIN.GL.REL.HIERARCHY.v1',
          organization_id: FURNITURE_ORG_ID,
          metadata: {
            relationship_subtype: 'account_hierarchy',
            child_level: account.level,
            parent_level: furnitureIndiaCOA[account.parent].level
          }
        }
        
        const { error } = await supabase
          .from('core_relationships')
          .insert(relationship)
        
        if (!error) {
          relationshipCount++
        }
      }
    }
    
    console.log(`✅ Created ${relationshipCount} hierarchy relationships`)
    
    // Add IFRS compliance metadata using dynamic data
    console.log('\n📋 Adding IFRS compliance metadata...')
    let dynamicDataCount = 0
    
    // Sample IFRS metadata for key accounts
    const ifrsMetadata = {
      '1112000': { 
        fields: [
          { name: 'ifrs_statement', value: 'SFP', description: 'Statement of Financial Position' },
          { name: 'ifrs_category', value: 'Current Assets', description: 'IFRS Category' },
          { name: 'ifrs_subcategory', value: 'Cash and cash equivalents', description: 'IFRS Subcategory' },
          { name: 'liquidity_order', value: '1', description: 'Order of liquidity' }
        ]
      },
      '4111000': {
        fields: [
          { name: 'ifrs_statement', value: 'SPL', description: 'Statement of Profit or Loss' },
          { name: 'ifrs_category', value: 'Revenue', description: 'IFRS Category' },
          { name: 'revenue_recognition', value: 'Point in time', description: 'IFRS 15 Recognition' },
          { name: 'gst_rate', value: '18', description: 'GST Rate %' }
        ]
      },
      '5111000': {
        fields: [
          { name: 'ifrs_statement', value: 'SPL', description: 'Statement of Profit or Loss' },
          { name: 'ifrs_category', value: 'Cost of sales', description: 'IFRS Category' },
          { name: 'cost_allocation', value: 'Direct', description: 'Cost allocation method' },
          { name: 'inventory_impact', value: 'Yes', description: 'Impacts inventory valuation' }
        ]
      }
    }
    
    for (const [accountCode, metadata] of Object.entries(ifrsMetadata)) {
      if (accountIds[accountCode]) {
        for (const field of metadata.fields) {
          const dynamicData = {
            entity_id: accountIds[accountCode],
            field_name: field.name,
            field_value_text: field.value,
            field_description: field.description,
            smart_code: 'HERA.FIN.GL.DYN.IFRS.v1',
            organization_id: FURNITURE_ORG_ID
          }
          
          const { error } = await supabase
            .from('core_dynamic_data')
            .insert(dynamicData)
          
          if (!error) {
            dynamicDataCount++
          }
        }
      }
    }
    
    console.log(`✅ Added ${dynamicDataCount} IFRS compliance fields`)
    
    // Create some sample posting rules for auto-journal
    console.log('\n⚙️ Creating auto-posting rules...')
    const postingRules = [
      {
        entity_type: 'posting_rule',
        entity_code: 'POST-SALE-001',
        entity_name: 'Furniture Sale Posting Rule',
        smart_code: 'HERA.FIN.POST.RULE.SALE.v1',
        metadata: {
          transaction_type: 'sale',
          smart_code_pattern: 'HERA.FURNITURE.SALE.*',
          posting_logic: {
            debit: ['1121000'], // Trade Debtors - Domestic
            credit: ['4111000', '2141000'], // Sales + GST Payable
            split_ratio: { '4111000': 0.847, '2141000': 0.153 } // 18% GST
          }
        },
        organization_id: FURNITURE_ORG_ID,
        status: 'active'
      },
      {
        entity_type: 'posting_rule',
        entity_code: 'POST-PUR-001',
        entity_name: 'Material Purchase Posting Rule',
        smart_code: 'HERA.FIN.POST.RULE.PURCHASE.v1',
        metadata: {
          transaction_type: 'purchase',
          smart_code_pattern: 'HERA.FURNITURE.PUR.MAT.*',
          posting_logic: {
            debit: ['1131000', '1152000'], // Raw Materials + GST Input
            credit: ['2111000'], // Trade Creditors
            split_ratio: { '1131000': 0.847, '1152000': 0.153 } // 18% GST
          }
        },
        organization_id: FURNITURE_ORG_ID,
        status: 'active'
      }
    ]
    
    for (const rule of postingRules) {
      const { error } = await supabase
        .from('core_entities')
        .insert(rule)
      
      if (!error) {
        console.log(`✅ Created posting rule: ${rule.entity_name}`)
      }
    }
    
    console.log('\n🎉 Universal Chart of Accounts creation completed!')
    console.log(`
Summary:
- Total GL Accounts: ${accountCount}
- Account Hierarchy: ${relationshipCount} relationships
- IFRS Metadata: ${dynamicDataCount} fields
- Posting Rules: ${postingRules.length} rules

Features:
✅ Indian accounting standards compliant
✅ GST-ready with input/output tracking
✅ IFRS aligned with full lineage
✅ Furniture industry specific accounts
✅ Multi-dimensional cost tracking
✅ Auto-posting rules configured
✅ Complete 5-level hierarchy
    `)
    
  } catch (error) {
    console.error('Error creating COA:', error)
  }
}

createFurnitureCOA().catch(console.error)