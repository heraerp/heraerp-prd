#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Kerala Furniture Works (Demo) organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

async function seedFinanceData() {
  console.log('💰 Seeding Finance data for Kerala Furniture Works...')
  
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
    
    const { data: products } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'product')
      .like('smart_code', 'HERA.FURNITURE.PRODUCT%')
      .limit(10)
    
    console.log('\n📝 Creating Opening Balances (Journal Entries)...')
    
    // 1. Opening Capital Journal Entry
    const openingCapital = {
      transaction_type: 'journal_entry',
      transaction_code: `JV-2025-0001`,
      transaction_date: '2025-01-01T00:00:00Z',
      smart_code: 'HERA.FIN.GL.TXN.JE.v1',
      total_amount: 5000000, // 50 Lakhs
      metadata: {
        description: 'Opening Capital Investment',
        posted: true,
        fiscal_year: 2025,
        period: 1
      },
      organization_id: FURNITURE_ORG_ID
    }
    
    const { data: capitalJE } = await supabase
      .from('universal_transactions')
      .insert(openingCapital)
      .select()
      .single()
    
    if (capitalJE) {
      // Journal lines
      await supabase.from('universal_transaction_lines').insert([
        {
          transaction_id: capitalJE.id,
          entity_id: getGLAccount('1112000')?.id, // Cash in Bank
          line_number: 1,
          line_amount: 5000000,
          line_data: {
            line_data: {
            debit_amount: 5000000,
            credit_amount: 0,
            gl_account: '1112000',
            gl_account_name: 'Cash in Bank - Current Account'
          },
          smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1',
          organization_id: FURNITURE_ORG_ID
        },
        {
          transaction_id: capitalJE.id,
          entity_id: getGLAccount('3110000')?.id, // Equity Share Capital
          line_number: 2,
          line_amount: 5000000,
          line_data: {
            line_data: {
            debit_amount: 0,
            credit_amount: 5000000,
            gl_account: '3110000',
            gl_account_name: 'Equity Share Capital'
          },
          smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1',
          organization_id: FURNITURE_ORG_ID
        }
      ])
      console.log('✅ Created opening capital: ₹50,00,000')
    }
    
    // 2. Purchase of Machinery
    const machineryPurchase = {
      transaction_type: 'journal_entry',
      transaction_code: `JV-2025-0002`,
      transaction_date: '2025-01-02T00:00:00Z',
      smart_code: 'HERA.FIN.GL.TXN.JE.v1',
      total_amount: 1500000, // 15 Lakhs
      metadata: {
        description: 'Purchase of Wood Cutting Machinery',
        posted: true
      },
      organization_id: FURNITURE_ORG_ID
    }
    
    const { data: machineryJE } = await supabase
      .from('universal_transactions')
      .insert(machineryPurchase)
      .select()
      .single()
    
    if (machineryJE) {
      await supabase.from('universal_transaction_lines').insert([
        {
          transaction_id: machineryJE.id,
          entity_id: getGLAccount('1213000')?.id, // Plant and Machinery
          line_number: 1,
          line_amount: 1271186,
          line_data: {
            debit_amount: 1271186,
          credit_amount: 0,
          smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1',
          organization_id: FURNITURE_ORG_ID
        },
        {
          transaction_id: machineryJE.id,
          entity_id: getGLAccount('1151000')?.id, // GST Input - Capital Goods
          line_number: 2,
          line_amount: 228814,
          line_data: {
            debit_amount: 228814,
          credit_amount: 0,
          smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1',
          organization_id: FURNITURE_ORG_ID
        },
        {
          transaction_id: machineryJE.id,
          entity_id: getGLAccount('1112000')?.id, // Cash in Bank
          line_number: 3,
          line_amount: 1500000,
          line_data: {
            debit_amount: 0,
          credit_amount: 1500000,
          smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1',
          organization_id: FURNITURE_ORG_ID
        }
      ])
      console.log('✅ Created machinery purchase: ₹15,00,000')
    }
    
    // 3. Raw Material Purchases
    console.log('\n🛒 Creating Purchase Transactions...')
    
    const purchases = [
      { supplier: 'Kerala Wood Suppliers', material: 'Teak Wood', amount: 250000, date: '2025-01-05' },
      { supplier: 'Premium Fabric House', material: 'Upholstery Fabric', amount: 85000, date: '2025-01-08' },
      { supplier: 'Kerala Wood Suppliers', material: 'Rosewood', amount: 180000, date: '2025-01-10' },
      { supplier: 'Hardware Mart', material: 'Furniture Fittings', amount: 65000, date: '2025-01-12' }
    ]
    
    for (let i = 0; i < purchases.length; i++) {
      const purchase = purchases[i]
      const supplier = suppliers?.find(s => s.entity_name.includes(purchase.supplier.split(' ')[0]))
      
      const purchaseInvoice = {
        transaction_type: 'purchase_invoice',
        transaction_code: `PI-2025-${String(i + 1).padStart(4, '0')}`,
        transaction_date: purchase.date,
        smart_code: 'HERA.FIN.AP.TXN.INVOICE.v1',
        source_entity_id: supplier?.id,
        total_amount: purchase.amount,
        metadata: {
          description: `Purchase of ${purchase.material}`,
          payment_terms: 'NET30',
          due_date: new Date(new Date(purchase.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        organization_id: FURNITURE_ORG_ID
      }
      
      const { data: invoiceTxn } = await supabase
        .from('universal_transactions')
        .insert(purchaseInvoice)
        .select()
        .single()
      
      if (invoiceTxn) {
        const baseAmount = purchase.amount / 1.18 // Remove 18% GST
        const gstAmount = purchase.amount - baseAmount
        
        await supabase.from('universal_transaction_lines').insert([
          {
            transaction_id: invoiceTxn.id,
            entity_id: getGLAccount('1131000')?.id, // Raw Materials - Wood (using for all materials)
            line_number: 1,
            line_amount: baseAmount,
            line_data: {
            debit_amount: baseAmount,
            credit_amount: 0,
            smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1',
            organization_id: FURNITURE_ORG_ID
          },
          {
            transaction_id: invoiceTxn.id,
            entity_id: getGLAccount('1152000')?.id, // GST Input
            line_number: 2,
            line_amount: gstAmount,
            line_data: {
            debit_amount: gstAmount,
            credit_amount: 0,
            smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1',
            organization_id: FURNITURE_ORG_ID
          },
          {
            transaction_id: invoiceTxn.id,
            entity_id: getGLAccount('2111000')?.id, // Trade Creditors
            line_number: 3,
            line_amount: purchase.amount,
            line_data: {
            debit_amount: 0,
            credit_amount: purchase.amount,
            smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1',
            organization_id: FURNITURE_ORG_ID
          }
        ])
        console.log(`✅ Created purchase invoice: ${purchase.material} - ₹${purchase.amount.toLocaleString('en-IN')}`)
      }
    }
    
    // 4. Sales Transactions
    console.log('\n💸 Creating Sales Transactions...')
    
    const sales = [
      { customer: 'Marriott Hotels', product: 'Executive Office Chair', quantity: 50, unitPrice: 12000, date: '2025-01-07' },
      { customer: 'ITC Grand', product: 'Conference Table', quantity: 5, unitPrice: 85000, date: '2025-01-09' },
      { customer: 'Retail Customer', product: 'Study Table', quantity: 10, unitPrice: 15000, date: '2025-01-11' },
      { customer: 'Marriott Hotels', product: 'Hotel Room Furniture Set', quantity: 20, unitPrice: 45000, date: '2025-01-13' }
    ]
    
    for (let i = 0; i < sales.length; i++) {
      const sale = sales[i]
      const customer = customers?.find(c => c.entity_name.includes(sale.customer.split(' ')[0])) || customers?.[0]
      const product = products?.find(p => p.entity_name.includes(sale.product.split(' ')[0])) || products?.[i]
      
      const totalAmount = sale.quantity * sale.unitPrice
      
      const salesInvoice = {
        transaction_type: 'sales_invoice',
        transaction_code: `SI-2025-${String(i + 1).padStart(4, '0')}`,
        transaction_date: sale.date,
        smart_code: 'HERA.FIN.AR.TXN.INVOICE.v1',
        source_entity_id: customer?.id,
        target_entity_id: product?.id,
        total_amount: totalAmount,
        metadata: {
          description: `Sale of ${sale.product}`,
          quantity: sale.quantity,
          unit_price: sale.unitPrice,
          payment_terms: 'NET15'
        },
        organization_id: FURNITURE_ORG_ID
      }
      
      const { data: salesTxn } = await supabase
        .from('universal_transactions')
        .insert(salesInvoice)
        .select()
        .single()
      
      if (salesTxn) {
        const baseAmount = totalAmount / 1.18
        const gstAmount = totalAmount - baseAmount
        
        await supabase.from('universal_transaction_lines').insert([
          {
            transaction_id: salesTxn.id,
            entity_id: getGLAccount('1121000')?.id, // Trade Debtors
            line_number: 1,
            line_amount: totalAmount,
            line_data: {
            debit_amount: totalAmount,
            credit_amount: 0,
            smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1',
            organization_id: FURNITURE_ORG_ID
          },
          {
            transaction_id: salesTxn.id,
            entity_id: getGLAccount('4111000')?.id, // Sale of Furniture - Retail
            line_number: 2,
            line_amount: baseAmount,
            line_data: {
            debit_amount: 0,
            credit_amount: baseAmount,
            smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1',
            organization_id: FURNITURE_ORG_ID
          },
          {
            transaction_id: salesTxn.id,
            entity_id: getGLAccount('2141000')?.id, // GST Payable - Output
            line_number: 3,
            line_amount: gstAmount,
            line_data: {
            debit_amount: 0,
            credit_amount: gstAmount,
            smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1',
            organization_id: FURNITURE_ORG_ID
          }
        ])
        console.log(`✅ Created sales invoice: ${sale.product} - ₹${totalAmount.toLocaleString('en-IN')}`)
      }
    }
    
    // 5. Expense Transactions
    console.log('\n📋 Creating Expense Transactions...')
    
    const expenses = [
      { type: 'Factory Rent', account: '5131000', amount: 75000, date: '2025-01-01' },
      { type: 'Salaries - January', account: '5210000', amount: 450000, date: '2025-01-31' },
      { type: 'Electricity Bill', account: '5132000', amount: 28500, date: '2025-01-15' },
      { type: 'Internet & Phone', account: '5420000', amount: 8500, date: '2025-01-10' },
      { type: 'Office Rent', account: '5410000', amount: 35000, date: '2025-01-01' },
      { type: 'Transportation', account: '5330000', amount: 22000, date: '2025-01-20' }
    ]
    
    for (let i = 0; i < expenses.length; i++) {
      const expense = expenses[i]
      
      const expenseJE = {
        transaction_type: 'journal_entry',
        transaction_code: `JV-2025-${String(100 + i).padStart(4, '0')}`,
        transaction_date: expense.date,
        smart_code: 'HERA.FIN.GL.TXN.JE.v1',
        total_amount: expense.amount,
        metadata: {
          description: expense.type,
          expense_type: 'operating'
        },
        organization_id: FURNITURE_ORG_ID
      }
      
      const { data: expenseTxn } = await supabase
        .from('universal_transactions')
        .insert(expenseJE)
        .select()
        .single()
      
      if (expenseTxn) {
        await supabase.from('universal_transaction_lines').insert([
          {
            transaction_id: expenseTxn.id,
            entity_id: getGLAccount(expense.account)?.id,
            line_number: 1,
            line_amount: expense.amount,
            line_data: {
            debit_amount: expense.amount,
            credit_amount: 0,
            smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1',
            organization_id: FURNITURE_ORG_ID
          },
          {
            transaction_id: expenseTxn.id,
            entity_id: getGLAccount('1112000')?.id, // Cash in Bank
            line_number: 2,
            line_amount: expense.amount,
            line_data: {
            debit_amount: 0,
            credit_amount: expense.amount,
            smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1',
            organization_id: FURNITURE_ORG_ID
          }
        ])
        console.log(`✅ Created expense: ${expense.type} - ₹${expense.amount.toLocaleString('en-IN')}`)
      }
    }
    
    // 6. Customer Payments
    console.log('\n💵 Creating Customer Payment Receipts...')
    
    const payments = [
      { customer: 'ITC Grand', amount: 425000, date: '2025-01-25', invoice: 'SI-2025-0002' },
      { customer: 'Retail Customer', amount: 150000, date: '2025-01-26', invoice: 'SI-2025-0003' }
    ]
    
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i]
      const customer = customers?.find(c => c.entity_name.includes(payment.customer.split(' ')[0]))
      
      const receipt = {
        transaction_type: 'payment_receipt',
        transaction_code: `RCP-2025-${String(i + 1).padStart(4, '0')}`,
        transaction_date: payment.date,
        smart_code: 'HERA.FIN.AR.TXN.RCP.v1',
        source_entity_id: customer?.id,
        total_amount: payment.amount,
        metadata: {
          description: `Payment received from ${payment.customer}`,
          payment_method: 'bank_transfer',
          reference: payment.invoice
        },
        organization_id: FURNITURE_ORG_ID
      }
      
      const { data: rcpTxn } = await supabase
        .from('universal_transactions')
        .insert(receipt)
        .select()
        .single()
      
      if (rcpTxn) {
        await supabase.from('universal_transaction_lines').insert([
          {
            transaction_id: rcpTxn.id,
            entity_id: getGLAccount('1112000')?.id, // Cash in Bank
            line_number: 1,
            line_amount: payment.amount,
            line_data: {
            debit_amount: payment.amount,
            credit_amount: 0,
            smart_code: 'HERA.FIN.GL.LINE.DEBIT.v1',
            organization_id: FURNITURE_ORG_ID
          },
          {
            transaction_id: rcpTxn.id,
            entity_id: getGLAccount('1121000')?.id, // Trade Debtors
            line_number: 2,
            line_amount: payment.amount,
            line_data: {
            debit_amount: 0,
            credit_amount: payment.amount,
            smart_code: 'HERA.FIN.GL.LINE.CREDIT.v1',
            organization_id: FURNITURE_ORG_ID
          }
        ])
        console.log(`✅ Created payment receipt: ${payment.customer} - ₹${payment.amount.toLocaleString('en-IN')}`)
      }
    }
    
    // 7. Calculate and store GL balances in dynamic data
    console.log('\n📊 Calculating GL Account Balances...')
    
    // Get all transaction lines
    const { data: allLines } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
    
    if (allLines) {
      // Calculate balances by GL account
      const balances = {}
      
      allLines.forEach(line => {
        if (line.line_entity_id) {
          if (!balances[line.line_entity_id]) {
            balances[line.line_entity_id] = { debit: 0, credit: 0 }
          }
          balances[line.line_entity_id].debit += line.debit_amount || 0
          balances[line.line_entity_id].credit += line.credit_amount || 0
        }
      })
      
      // Store balances in dynamic data
      for (const [entityId, balance] of Object.entries(balances)) {
        const account = glAccounts.find(a => a.id === entityId)
        if (account) {
          const netBalance = balance.debit - balance.credit
          const absBalance = Math.abs(netBalance)
          
          // Store current balance
          await supabase
            .from('core_dynamic_data')
            .upsert({
              entity_id: entityId,
              field_name: 'current_balance',
              field_value_number: absBalance,
              field_value_text: netBalance >= 0 ? 'Dr' : 'Cr',
              smart_code: 'HERA.FIN.GL.DYN.BALANCE.v1',
              organization_id: FURNITURE_ORG_ID
            }, {
              onConflict: 'entity_id,field_name,organization_id'
            })
          
          if (absBalance > 0) {
            console.log(`   ${account.entity_code} - ${account.entity_name}: ₹${absBalance.toLocaleString('en-IN')} ${netBalance >= 0 ? 'Dr' : 'Cr'}`)
          }
        }
      }
    }
    
    console.log('\n🎉 Finance data seeding completed!')
    console.log(`
Summary:
- Opening Capital: ₹50,00,000
- Fixed Assets: ₹15,00,000
- Total Purchases: ₹5,80,000
- Total Sales: ₹21,30,000
- Operating Expenses: ₹6,19,000
- Customer Receipts: ₹5,75,000

Financial Position:
- Bank Balance: ~₹28 Lakhs
- Receivables: ~₹15.5 Lakhs
- Payables: ~₹5.8 Lakhs
- GST Position: Net payable ~₹2.5 Lakhs
    `)
    
  } catch (error) {
    console.error('Error seeding finance data:', error)
  }
}

seedFinanceData().catch(console.error)