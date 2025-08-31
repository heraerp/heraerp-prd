#!/usr/bin/env node

/**
 * Verify Ice Cream Financial Data
 * This script checks what financial data is currently available in the system
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Ice cream organization ID
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656';

async function analyzeFinancialData() {
  console.log('📊 Analyzing Ice Cream Financial Data');
  console.log('═══════════════════════════════════════');
  console.log(`Organization: Kochi Ice Cream Manufacturing`);
  console.log(`Organization ID: ${ORG_ID}`);
  console.log('');
  
  try {
    // Get current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    console.log(`📅 Current Period: ${startOfMonth.toLocaleDateString()} - ${now.toLocaleDateString()}`);
    console.log('');
    
    // 1. Revenue Analysis
    console.log('💰 REVENUE ANALYSIS');
    console.log('─────────────────────');
    
    const { data: currentRevenue, error: revError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORG_ID)
      .in('transaction_type', ['pos_sale', 'invoice'])
      .gte('transaction_date', startOfMonth.toISOString())
      .lte('transaction_date', now.toISOString());
    
    if (revError) {
      console.error('Error fetching revenue:', revError);
      return;
    }
    
    const totalRevenue = currentRevenue?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
    console.log(`Current Month Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`);
    console.log(`Number of Transactions: ${currentRevenue?.length || 0}`);
    
    if (currentRevenue && currentRevenue.length > 0) {
      console.log('\nRecent Revenue Transactions:');
      currentRevenue.slice(0, 3).forEach(t => {
        console.log(`  - ${t.transaction_code}: ₹${t.total_amount} (${t.transaction_type})`);
      });
    }
    
    // 2. Cost Analysis
    console.log('\n\n❄️ COLD CHAIN & OPERATIONAL COSTS');
    console.log('─────────────────────────────────');
    
    const { data: expenses } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORG_ID)
      .in('transaction_type', ['expense', 'utility', 'inventory_adjustment'])
      .gte('transaction_date', startOfMonth.toISOString());
    
    const coldChainCosts = expenses?.filter(e => 
      e.smart_code?.includes('COLD') || 
      e.smart_code?.includes('FREEZER') || 
      e.smart_code?.includes('ENERGY') ||
      e.metadata?.expense_type?.includes('cold')
    ) || [];
    
    const totalColdChain = coldChainCosts.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    console.log(`Total Cold Chain Costs: ₹${totalColdChain.toLocaleString('en-IN')}`);
    console.log(`Cold Chain Transactions: ${coldChainCosts.length}`);
    
    // 3. Temperature Variance
    const tempVariance = expenses?.filter(e => 
      e.smart_code?.includes('TEMPERATURE') || 
      e.smart_code?.includes('WASTAGE') ||
      e.metadata?.wastage_reason?.includes('temperature')
    ) || [];
    
    const totalTempLoss = tempVariance.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    console.log(`\nTemperature Variance Losses: ₹${totalTempLoss.toLocaleString('en-IN')}`);
    console.log(`Temperature Incidents: ${tempVariance.length}`);
    
    // 4. Production Analysis
    console.log('\n\n🏭 PRODUCTION ANALYSIS');
    console.log('────────────────────────');
    
    const { data: production } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('transaction_type', 'production_batch')
      .gte('transaction_date', startOfMonth.toISOString());
    
    console.log(`Production Batches: ${production?.length || 0}`);
    
    let totalOutput = 0;
    let totalMargin = 0;
    let marginCount = 0;
    
    production?.forEach(batch => {
      if (batch.metadata?.actual_output_liters) {
        totalOutput += parseFloat(batch.metadata.actual_output_liters);
      }
      if (batch.metadata?.profit_margin) {
        totalMargin += parseFloat(batch.metadata.profit_margin);
        marginCount++;
      }
    });
    
    console.log(`Total Production: ${totalOutput} Liters`);
    console.log(`Average Profit Margin: ${marginCount > 0 ? (totalMargin / marginCount).toFixed(1) : 0}%`);
    
    // 5. AP/AR Analysis
    console.log('\n\n💳 ACCOUNTS PAYABLE/RECEIVABLE');
    console.log('──────────────────────────────');
    
    const { data: apData } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('transaction_type', 'purchase_invoice')
      .eq('transaction_status', 'pending');
    
    const apTotal = apData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
    const apOverdue = apData?.filter(t => {
      const dueDate = new Date(t.metadata?.due_date || t.created_at);
      return dueDate < now;
    }).length || 0;
    
    console.log(`AP Outstanding: ₹${apTotal.toLocaleString('en-IN')}`);
    console.log(`AP Overdue Invoices: ${apOverdue}`);
    
    const { data: arData } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('transaction_type', 'invoice')
      .eq('transaction_status', 'pending');
    
    const arTotal = arData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
    console.log(`\nAR Outstanding: ₹${arTotal.toLocaleString('en-IN')}`);
    console.log(`AR Pending Invoices: ${arData?.length || 0}`);
    
    // 6. Summary
    console.log('\n\n📊 FINANCIAL SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Revenue MTD: ₹${totalRevenue.toLocaleString('en-IN')}`);
    console.log(`Cold Chain Costs: ₹${totalColdChain.toLocaleString('en-IN')} (${totalRevenue > 0 ? ((totalColdChain/totalRevenue)*100).toFixed(1) : 0}% of revenue)`);
    console.log(`Temperature Losses: ₹${totalTempLoss.toLocaleString('en-IN')}`);
    console.log(`Production Output: ${totalOutput} Liters`);
    console.log(`Outstanding Receivables: ₹${arTotal.toLocaleString('en-IN')}`);
    console.log(`Outstanding Payables: ₹${apTotal.toLocaleString('en-IN')}`);
    console.log('═══════════════════════════════════════');
    
    console.log('\n📈 Data will appear in financial dashboard at:');
    console.log('   http://localhost:3000/icecream-financial');
    
    // Check if we have any data
    if (totalRevenue === 0 && production?.length === 0) {
      console.log('\n⚠️  No financial data found for current month.');
      console.log('   Run setup-kochi-icecream.js to create demo data.');
    }
    
  } catch (error) {
    console.error('\n❌ Error analyzing data:', error);
  }
}

// Run the analysis
analyzeFinancialData();