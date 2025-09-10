#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Kerala Furniture Works (Demo) organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

// Helper function to create transaction lines with correct structure
function createTransactionLine(transactionId, entityId, lineNumber, debitAmount, creditAmount, glCode, glName, organizationId) {
  return {
    transaction_id: transactionId,
    entity_id: entityId,
    line_number: lineNumber,
    line_amount: debitAmount || creditAmount,
    line_type: 'gl_account',
    line_data: {
      debit_amount: debitAmount || 0,
      credit_amount: creditAmount || 0,
      gl_account: glCode,
      gl_account_name: glName
    },
    smart_code: debitAmount ? 'HERA.FIN.GL.LINE.DEBIT.v1' : 'HERA.FIN.GL.LINE.CREDIT.v1',
    organization_id: organizationId
  }
}

async function seedFinanceData() {
  console.log('💰 Seeding Finance data for Kerala Furniture Works (V2)...')
  
  try {
    // Get GL accounts
    const { data: glAccounts } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'gl_account')
    
    if (!glAccounts || glAccounts.length === 0) {
      console.error('No GL accounts found. Please run create-furniture-coa-india.js first')
      return
    }
    
    console.log(`Found ${glAccounts.length} GL accounts`)
    
    // Create helper to find GL account by code
    const getGLAccount = (code) => glAccounts.find(a => a.entity_code === code)
    
    // Get some entities for transactions
    const { data: customers } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'customer')
      .limit(5)
    
    const { data: suppliers } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'supplier')
      .limit(5)
    
    console.log('\n📝 Creating Financial Transactions...')
    
    // 1. Opening Capital Journal Entry
    const capitalJE = {
      transaction_type: 'journal_entry',
      transaction_code: `JE-2025-0001`,
      transaction_date: '2025-01-01T00:00:00Z',
      smart_code: 'HERA.FIN.GL.TXN.JE.v1',
      total_amount: 5000000,
      metadata: {
        description: 'Opening Capital Investment',
        posted: true,
        fiscal_year: 2025
      },
      organization_id: FURNITURE_ORG_ID
    }
    
    const { data: capital } = await supabase
      .from('universal_transactions')
      .insert(capitalJE)
      .select()
      .single()
    
    if (capital) {
      const lines = [
        createTransactionLine(capital.id, getGLAccount('1112000')?.id, 1, 5000000, 0, '1112000', 'Cash in Bank', FURNITURE_ORG_ID),
        createTransactionLine(capital.id, getGLAccount('3110000')?.id, 2, 0, 5000000, '3110000', 'Share Capital', FURNITURE_ORG_ID)
      ]
      
      await supabase.from('universal_transaction_lines').insert(lines)
      console.log('✅ Created opening capital: ₹50,00,000')
    }
    
    // 2. Purchase of Machinery
    const machineryJE = {
      transaction_type: 'journal_entry',
      transaction_code: `JE-2025-0002`,
      transaction_date: '2025-01-02T00:00:00Z',
      smart_code: 'HERA.FIN.GL.TXN.JE.v1',
      total_amount: 1500000,
      metadata: {
        description: 'Purchase of Wood Cutting Machinery',
        asset_purchase: true
      },
      organization_id: FURNITURE_ORG_ID
    }
    
    const { data: machinery } = await supabase
      .from('universal_transactions')
      .insert(machineryJE)
      .select()
      .single()
    
    if (machinery) {
      const lines = [
        createTransactionLine(machinery.id, getGLAccount('1213000')?.id, 1, 1271186, 0, '1213000', 'Plant and Machinery', FURNITURE_ORG_ID),
        createTransactionLine(machinery.id, getGLAccount('1151000')?.id, 2, 228814, 0, '1151000', 'GST Input', FURNITURE_ORG_ID),
        createTransactionLine(machinery.id, getGLAccount('1112000')?.id, 3, 0, 1500000, '1112000', 'Cash in Bank', FURNITURE_ORG_ID)
      ]
      
      await supabase.from('universal_transaction_lines').insert(lines)
      console.log('✅ Created machinery purchase: ₹15,00,000')
    }
    
    // 3. Monthly Sales
    const salesJE = {
      transaction_type: 'journal_entry',
      transaction_code: `JE-2025-0003`,
      transaction_date: '2025-01-31T00:00:00Z',
      smart_code: 'HERA.FIN.GL.TXN.JE.v1',
      total_amount: 2130000,
      metadata: {
        description: 'January Sales Summary',
        period: 'January 2025'
      },
      organization_id: FURNITURE_ORG_ID
    }
    
    const { data: sales } = await supabase
      .from('universal_transactions')
      .insert(salesJE)
      .select()
      .single()
    
    if (sales) {
      const baseAmount = 2130000 / 1.18
      const gstAmount = 2130000 - baseAmount
      
      const lines = [
        createTransactionLine(sales.id, getGLAccount('1121000')?.id, 1, 2130000, 0, '1121000', 'Trade Debtors', FURNITURE_ORG_ID),
        createTransactionLine(sales.id, getGLAccount('4111000')?.id, 2, 0, baseAmount, '4111000', 'Furniture Sales', FURNITURE_ORG_ID),
        createTransactionLine(sales.id, getGLAccount('2141000')?.id, 3, 0, gstAmount, '2141000', 'GST Payable', FURNITURE_ORG_ID)
      ]
      
      await supabase.from('universal_transaction_lines').insert(lines)
      console.log('✅ Created sales: ₹21,30,000')
    }
    
    // 4. Purchase of Raw Materials
    const purchaseJE = {
      transaction_type: 'journal_entry',
      transaction_code: `JE-2025-0004`,
      transaction_date: '2025-01-15T00:00:00Z',
      smart_code: 'HERA.FIN.GL.TXN.JE.v1',
      total_amount: 580000,
      metadata: {
        description: 'Raw Materials Purchase - January',
        materials: 'Wood, Hardware, Fabric'
      },
      organization_id: FURNITURE_ORG_ID
    }
    
    const { data: purchase } = await supabase
      .from('universal_transactions')
      .insert(purchaseJE)
      .select()
      .single()
    
    if (purchase) {
      const baseAmount = 580000 / 1.18
      const gstAmount = 580000 - baseAmount
      
      const lines = [
        createTransactionLine(purchase.id, getGLAccount('1131000')?.id, 1, baseAmount, 0, '1131000', 'Raw Materials', FURNITURE_ORG_ID),
        createTransactionLine(purchase.id, getGLAccount('1152000')?.id, 2, gstAmount, 0, '1152000', 'GST Input', FURNITURE_ORG_ID),
        createTransactionLine(purchase.id, getGLAccount('2111000')?.id, 3, 0, 580000, '2111000', 'Trade Creditors', FURNITURE_ORG_ID)
      ]
      
      await supabase.from('universal_transaction_lines').insert(lines)
      console.log('✅ Created purchases: ₹5,80,000')
    }
    
    // 5. Monthly Expenses
    const expensesJE = {
      transaction_type: 'journal_entry',
      transaction_code: `JE-2025-0005`,
      transaction_date: '2025-01-31T00:00:00Z',
      smart_code: 'HERA.FIN.GL.TXN.JE.v1',
      total_amount: 619000,
      metadata: {
        description: 'January Operating Expenses',
        period: 'January 2025'
      },
      organization_id: FURNITURE_ORG_ID
    }
    
    const { data: expenses } = await supabase
      .from('universal_transactions')
      .insert(expensesJE)
      .select()
      .single()
    
    if (expenses) {
      const lines = [
        createTransactionLine(expenses.id, getGLAccount('5210000')?.id, 1, 450000, 0, '5210000', 'Salaries', FURNITURE_ORG_ID),
        createTransactionLine(expenses.id, getGLAccount('5131000')?.id, 2, 75000, 0, '5131000', 'Factory Rent', FURNITURE_ORG_ID),
        createTransactionLine(expenses.id, getGLAccount('5410000')?.id, 3, 35000, 0, '5410000', 'Office Rent', FURNITURE_ORG_ID),
        createTransactionLine(expenses.id, getGLAccount('5132000')?.id, 4, 28500, 0, '5132000', 'Power and Fuel', FURNITURE_ORG_ID),
        createTransactionLine(expenses.id, getGLAccount('5330000')?.id, 5, 22000, 0, '5330000', 'Transport', FURNITURE_ORG_ID),
        createTransactionLine(expenses.id, getGLAccount('5420000')?.id, 6, 8500, 0, '5420000', 'Phone & Internet', FURNITURE_ORG_ID),
        createTransactionLine(expenses.id, getGLAccount('1112000')?.id, 7, 0, 619000, '1112000', 'Cash in Bank', FURNITURE_ORG_ID)
      ]
      
      await supabase.from('universal_transaction_lines').insert(lines)
      console.log('✅ Created expenses: ₹6,19,000')
    }
    
    // 6. Customer Receipts
    const receiptsJE = {
      transaction_type: 'journal_entry',
      transaction_code: `JE-2025-0006`,
      transaction_date: '2025-01-25T00:00:00Z',
      smart_code: 'HERA.FIN.GL.TXN.JE.v1',
      total_amount: 575000,
      metadata: {
        description: 'Customer Payments Received',
        customers: 'ITC Grand, Retail'
      },
      organization_id: FURNITURE_ORG_ID
    }
    
    const { data: receipts } = await supabase
      .from('universal_transactions')
      .insert(receiptsJE)
      .select()
      .single()
    
    if (receipts) {
      const lines = [
        createTransactionLine(receipts.id, getGLAccount('1112000')?.id, 1, 575000, 0, '1112000', 'Cash in Bank', FURNITURE_ORG_ID),
        createTransactionLine(receipts.id, getGLAccount('1121000')?.id, 2, 0, 575000, '1121000', 'Trade Debtors', FURNITURE_ORG_ID)
      ]
      
      await supabase.from('universal_transaction_lines').insert(lines)
      console.log('✅ Created receipts: ₹5,75,000')
    }
    
    console.log('\n🎉 Finance data seeding completed!')
    console.log(`
Financial Summary:
- Opening Capital: ₹50,00,000
- Fixed Assets: ₹15,00,000  
- Sales Revenue: ₹21,30,000 (incl. GST)
- Material Purchases: ₹5,80,000 (incl. GST)
- Operating Expenses: ₹6,19,000
- Customer Receipts: ₹5,75,000

Expected Balances:
- Cash in Bank: ₹28,56,000 Dr
- Trade Debtors: ₹15,55,000 Dr  
- Trade Creditors: ₹5,80,000 Cr
- GST Payable (Net): ₹2,45,105 Cr
    `)
    
  } catch (error) {
    console.error('Error seeding finance data:', error)
  }
}

seedFinanceData().catch(console.error)