#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Kerala Furniture Works (Demo) organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

async function verifyFinanceData() {
  console.log('🔍 Verifying Finance data for Kerala Furniture Works...\n')
  
  try {
    // Get all GL accounts
    const { data: glAccounts } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'gl_account')
      .order('entity_code')
    
    // Get all transactions
    const { data: transactions } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .order('transaction_date')
    
    // Get all transaction lines
    const { data: transactionLines } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
    
    console.log(`📊 Summary:`)
    console.log(`   GL Accounts: ${glAccounts?.length || 0}`)
    console.log(`   Transactions: ${transactions?.length || 0}`)
    console.log(`   Transaction Lines: ${transactionLines?.length || 0}`)
    
    // Group transactions by type
    const txnByType = {}
    transactions?.forEach(txn => {
      const type = txn.transaction_type
      txnByType[type] = (txnByType[type] || 0) + 1
    })
    
    console.log('\n📋 Transactions by Type:')
    Object.entries(txnByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`)
    })
    
    // Calculate GL balances
    const balances = {}
    transactionLines?.forEach(line => {
      if (line.entity_id && line.line_data) {
        if (!balances[line.entity_id]) {
          balances[line.entity_id] = { debit: 0, credit: 0 }
        }
        balances[line.entity_id].debit += line.line_data.debit_amount || 0
        balances[line.entity_id].credit += line.line_data.credit_amount || 0
      }
    })
    
    // Show key account balances
    console.log('\n💰 Key Account Balances:')
    const keyAccounts = [
      '1112000', // Cash in Bank
      '1121000', // Trade Debtors
      '1131000', // Raw Materials
      '2111000', // Trade Creditors
      '2141000', // GST Payable
      '3110000', // Share Capital
      '4111000', // Sales Revenue
      '5210000', // Salaries
      '5131000'  // Factory Rent
    ]
    
    keyAccounts.forEach(accountCode => {
      const account = glAccounts?.find(a => a.entity_code === accountCode)
      if (account && balances[account.id]) {
        const bal = balances[account.id]
        const netBalance = bal.debit - bal.credit
        const absBalance = Math.abs(netBalance)
        const balType = netBalance >= 0 ? 'Dr' : 'Cr'
        
        console.log(`   ${accountCode} - ${account.entity_name}`)
        console.log(`      Debit: ₹${bal.debit.toLocaleString('en-IN')} | Credit: ₹${bal.credit.toLocaleString('en-IN')}`)
        console.log(`      Balance: ₹${absBalance.toLocaleString('en-IN')} ${balType}`)
      }
    })
    
    // Calculate financial position
    let totalAssets = 0
    let totalLiabilities = 0
    let totalEquity = 0
    let totalRevenue = 0
    let totalExpenses = 0
    
    Object.entries(balances).forEach(([accountId, bal]) => {
      const account = glAccounts?.find(a => a.id === accountId)
      if (account) {
        const netBalance = bal.debit - bal.credit
        const code = account.entity_code
        
        if (code.startsWith('1')) totalAssets += netBalance
        else if (code.startsWith('2')) totalLiabilities += Math.abs(netBalance)
        else if (code.startsWith('3')) totalEquity += Math.abs(netBalance)
        else if (code.startsWith('4')) totalRevenue += Math.abs(netBalance)
        else if (code.startsWith('5')) totalExpenses += netBalance
      }
    })
    
    console.log('\n📊 Financial Position:')
    console.log(`   Total Assets: ₹${totalAssets.toLocaleString('en-IN')}`)
    console.log(`   Total Liabilities: ₹${totalLiabilities.toLocaleString('en-IN')}`)
    console.log(`   Total Equity: ₹${totalEquity.toLocaleString('en-IN')}`)
    console.log(`   Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`)
    console.log(`   Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}`)
    console.log(`   Net Profit: ₹${(totalRevenue - totalExpenses).toLocaleString('en-IN')}`)
    
    // Show recent transactions
    console.log('\n📜 Recent Transactions:')
    const recentTxns = transactions?.slice(-5) || []
    recentTxns.forEach(txn => {
      console.log(`   ${txn.transaction_code} - ${txn.transaction_type} - ₹${txn.total_amount?.toLocaleString('en-IN')} (${new Date(txn.transaction_date).toLocaleDateString()})`)
    })
    
    console.log('\n✅ Finance verification completed!')
    
  } catch (error) {
    console.error('Error verifying finance data:', error)
  }
}

verifyFinanceData().catch(console.error)