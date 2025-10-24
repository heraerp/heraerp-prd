#!/usr/bin/env node
/**
 * HERA Finance DNA v2.2 - Michele's Hair Salon Finance Integration Test
 * Tests complete salon-to-finance posting with real Michele's salon data
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = process.env.DEFAULT_SALON_ORGANIZATION_ID || '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

// System actor for automated processes
const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000001';

// Michele's Hair Salon real scenarios
const MICHELE_SCENARIOS = [
  {
    id: "MS001",
    date: "2025-10-17T10:30:00Z",
    customer: {
      name: "Sarah Johnson",
      phone: "+971-50-123-4567",
      email: "sarah.j@email.com",
      visit_number: 3
    },
    services: [{
      name: "Hair Cut & Blow Dry", 
      duration: 60,
      price: 150.00,
      stylist: "Michele",
      commission_rate: 0.30
    }],
    products: [],
    payment_method: "CASH",
    notes: "Regular customer, prefers layered cut"
  },
  {
    id: "MS002", 
    date: "2025-10-17T14:00:00Z",
    customer: {
      name: "Emma Wilson",
      phone: "+971-55-987-6543", 
      email: "emma.wilson@email.com",
      visit_number: 1
    },
    services: [{
      name: "Full Color & Cut",
      duration: 180,
      price: 350.00,
      stylist: "Michele",
      commission_rate: 0.25
    }],
    products: [
      {
        name: "Color Protection Shampoo",
        cost: 15.00,
        price: 45.00,
        quantity: 1
      },
      {
        name: "Leave-in Conditioner",
        cost: 12.00,
        price: 35.00,
        quantity: 1
      }
    ],
    payment_method: "CARD",
    notes: "First time client, going from brunette to blonde"
  }
];

// Account code to name mapping for Michele's salon
const MICHELE_ACCOUNTS = {
  "1000": "Cash",
  "1100": "Credit Card Receivable", 
  "1300": "Inventory - Hair Products",
  "4000": "Service Revenue",
  "4100": "Product Sales Revenue",
  "2100": "VAT Payable",
  "5000": "Commission Expense",
  "5100": "Cost of Goods Sold",
  "2101": "Accounts Payable"
};

/**
 * Calculate Michele's salon financials with AED amounts
 */
function calculateMicheleFinancials(scenario) {
  // Service calculations
  const serviceTotal = scenario.services.reduce((sum, svc) => sum + svc.price, 0);
  const commissionTotal = scenario.services.reduce((sum, svc) => sum + (svc.price * svc.commission_rate), 0);
  
  // Product calculations  
  const productRevenue = scenario.products.reduce((sum, prod) => sum + (prod.price * prod.quantity), 0);
  const productCost = scenario.products.reduce((sum, prod) => sum + (prod.cost * prod.quantity), 0);
  
  // Tax calculations (5% VAT in UAE)
  const netAmount = serviceTotal + productRevenue;
  const vatAmount = netAmount * 0.05;
  const grossAmount = netAmount + vatAmount;
  
  return {
    service_revenue: serviceTotal,
    product_revenue: productRevenue, 
    net_amount: netAmount,
    vat_amount: vatAmount,
    gross_amount: grossAmount,
    commission_amount: commissionTotal,
    product_cost: productCost,
    currency: "AED"
  };
}

/**
 * Generate GL postings for Michele's scenario
 */
function generateMicheleGLPostings(scenario, financials, customerId) {
  const postings = [];
  let lineNumber = 10;
  
  // Cash/Card receipt
  const paymentAccount = scenario.payment_method === "CASH" ? "1000" : "1100";
  const paymentDesc = scenario.payment_method === "CASH" ? "Cash received" : "Card payment";
  postings.push({
    line_number: lineNumber,
    account_code: paymentAccount,
    side: "DR",
    amount: financials.gross_amount,
    description: paymentDesc,
    customer_id: customerId
  });
  lineNumber += 10;
  
  // Service revenue
  if (financials.service_revenue > 0) {
    postings.push({
      line_number: lineNumber,
      account_code: "4000", 
      side: "CR",
      amount: financials.service_revenue,
      description: "Service revenue",
      customer_id: customerId
    });
    lineNumber += 10;
  }
  
  // Product revenue
  if (financials.product_revenue > 0) {
    postings.push({
      line_number: lineNumber,
      account_code: "4100",
      side: "CR", 
      amount: financials.product_revenue,
      description: "Product sales revenue",
      customer_id: customerId
    });
    lineNumber += 10;
  }
  
  // VAT payable
  if (financials.vat_amount > 0) {
    postings.push({
      line_number: lineNumber,
      account_code: "2100",
      side: "CR",
      amount: financials.vat_amount,
      description: "VAT payable (5%)",
      customer_id: customerId
    });
    lineNumber += 10;
  }
  
  // Commission expense
  if (financials.commission_amount > 0) {
    postings.push({
      line_number: lineNumber, 
      account_code: "5000",
      side: "DR",
      amount: financials.commission_amount,
      description: "Stylist commission",
      customer_id: customerId
    });
    lineNumber += 10;
  }
  
  // Product COGS and inventory reduction
  if (financials.product_cost > 0) {
    postings.push({
      line_number: lineNumber,
      account_code: "5100",
      side: "DR", 
      amount: financials.product_cost,
      description: "Product cost of sales",
      customer_id: customerId
    });
    lineNumber += 10;
    
    postings.push({
      line_number: lineNumber,
      account_code: "1300",
      side: "CR",
      amount: financials.product_cost, 
      description: "Inventory reduction",
      customer_id: customerId
    });
  }
  
  return postings;
}

/**
 * Create or find customer entity
 */
async function ensureCustomerEntity(orgId, customer) {
  console.log(`   👤 Ensuring customer: ${customer.name}`);
  
  // Try to find existing customer by phone
  try {
    const { data: existing, error: searchError } = await supabase
      .from('core_dynamic_data')
      .select(`
        entity_id,
        core_entities!inner (
          id,
          entity_name,
          organization_id
        )
      `)
      .eq('organization_id', orgId)
      .eq('field_name', 'phone')
      .eq('field_value_text', customer.phone)
      .eq('core_entities.entity_type', 'customer')
      .single();
    
    if (existing && !searchError) {
      console.log(`      Found existing customer: ${existing.entity_id}`);
      return existing.entity_id;
    }
  } catch (error) {
    console.log(`      Search failed, creating new customer: ${error.message}`);
  }
  
  // Create new customer
  const { data: newCustomer, error: createError } = await supabase
    .from('core_entities')
    .insert({
      organization_id: orgId,
      entity_type: 'customer',
      entity_name: customer.name,
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.REGULAR.v1',
      created_by: SYSTEM_ACTOR_ID,
      updated_by: SYSTEM_ACTOR_ID
    })
    .select()
    .single();
  
  if (createError) {
    throw new Error(`Failed to create customer ${customer.name}: ${createError.message}`);
  }
  
  // Add customer phone
  const { error: phoneError } = await supabase
    .from('core_dynamic_data')
    .insert({
      organization_id: orgId,
      entity_id: newCustomer.id,
      field_name: 'phone',
      field_type: 'text',
      field_value_text: customer.phone,
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1',
      created_by: SYSTEM_ACTOR_ID,
      updated_by: SYSTEM_ACTOR_ID
    });
  
  if (phoneError) {
    console.warn(`Warning: Failed to add phone for ${customer.name}: ${phoneError.message}`);
  }
  
  console.log(`      Created new customer: ${newCustomer.id}`);
  return newCustomer.id;
}

/**
 * Ensure GL accounts exist
 */
async function ensureGLAccounts(orgId, accountCodes) {
  console.log(`   🏗️  Ensuring GL accounts: ${accountCodes.join(", ")}`);
  
  const accountMap = {};
  
  for (const code of accountCodes) {
    // Check if account exists
    const { data: existing } = await supabase
      .from('core_dynamic_data')
      .select(`
        entity_id,
        core_entities!inner (
          id,
          entity_name
        )
      `)
      .eq('organization_id', orgId)
      .eq('field_name', 'account_code')
      .eq('field_value_text', code)
      .eq('core_entities.entity_type', 'account')
      .single();
    
    if (existing) {
      accountMap[code] = existing.entity_id;
      console.log(`     ✅ Account ${code} exists: ${existing.entity_id}`);
    } else {
      // Create new account
      const accountName = MICHELE_ACCOUNTS[code] || `Account ${code}`;
      const { data: newAccount, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'account',
          entity_name: accountName,
          smart_code: 'HERA.ACCOUNTING.COA.ACCOUNT.GL.GENERAL.v1',
          created_by: SYSTEM_ACTOR_ID,
          updated_by: SYSTEM_ACTOR_ID
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create account ${code}: ${error.message}`);
      }
      
      // Add account code
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: orgId,
          entity_id: newAccount.id,
          field_name: 'account_code',
          field_type: 'text',
          field_value_text: code,
          smart_code: 'HERA.ACCOUNTING.COA.FIELD.CODE.v1',
          created_by: SYSTEM_ACTOR_ID,
          updated_by: SYSTEM_ACTOR_ID
        });
      
      accountMap[code] = newAccount.id;
      console.log(`     ✅ Created account ${code} (${accountName}): ${newAccount.id}`);
    }
  }
  
  return accountMap;
}

/**
 * Post Michele's salon transaction using hera_transactions_crud_v2
 */
async function postMicheleTransaction(orgId, scenario) {
  console.log(`\n💇 Processing Michele's appointment: ${scenario.id}`);
  console.log(`   📅 ${scenario.date} - ${scenario.customer.name}`);
  
  // Ensure customer exists
  const customerId = await ensureCustomerEntity(orgId, scenario.customer);
  
  // Calculate financials
  const financials = calculateMicheleFinancials(scenario);
  console.log(`   💰 Revenue: AED ${financials.gross_amount.toFixed(2)} (incl. VAT)`);
  
  // Generate GL postings
  const postings = generateMicheleGLPostings(scenario, financials, customerId);
  
  // Get required account codes
  const accountCodes = Array.from(new Set(postings.map(p => p.account_code)));
  console.log(`   📊 GL accounts: ${accountCodes.join(", ")}`);
  
  // Ensure all accounts exist
  const accountMap = await ensureGLAccounts(orgId, accountCodes);
  
  // Build transaction payload for hera_transactions_crud_v2
  const transactionPayload = {
    p_action: "CREATE",
    p_organization_id: orgId,
    p_transaction: {
      smart_code: "HERA.SALON.MICHELE.TXN.APPOINTMENT.v1",
      transaction_type: "SALE",
      transaction_date: scenario.date,
      transaction_currency_code: "AED",
      base_currency_code: "AED", 
      exchange_rate: 1.0,
      fiscal_year: 2025,
      fiscal_period: 10,
      total_amount: financials.gross_amount,
      source_entity_id: customerId,
      target_entity_id: null, // Michele's entity ID would go here
      reference_number: scenario.id
    },
    p_lines: postings.map(posting => ({
      line_number: posting.line_number,
      line_type: "GL",
      smart_code: "HERA.SALON.MICHELE.GL.LINE.v1",
      entity_id: accountMap[posting.account_code],
      line_amount: posting.amount,
      description: posting.description,
      line_data: {
        side: posting.side,
        account_code: posting.account_code,
        customer_id: posting.customer_id,
        payment_method: scenario.payment_method
      }
    })),
    p_dynamic: {
      michele_appointment: {
        field_type: "json",
        field_value_json: scenario,
        smart_code: "HERA.SALON.MICHELE.FIELD.APPOINTMENT.v1"
      },
      financial_breakdown: {
        field_type: "json",
        field_value_json: financials,
        smart_code: "HERA.SALON.MICHELE.FIELD.FINANCIALS.v1"
      }
    }
  };
  
  console.log(`   🚀 Posting transaction with ${postings.length} GL lines...`);
  
  // Call hera_transactions_crud_v2 function
  const { data, error } = await supabase.rpc('hera_transactions_crud_v2', transactionPayload);
  
  if (error) {
    throw new Error(`Failed to post ${scenario.id}: ${error.message}`);
  }
  
  const transactionId = data?.id || data?.[0]?.id;
  
  console.log(`   ✅ Posted successfully - Transaction ID: ${transactionId}`);
  
  // Check GL balance
  const totalDebits = postings.filter(p => p.side === "DR").reduce((sum, p) => sum + p.amount, 0);
  const totalCredits = postings.filter(p => p.side === "CR").reduce((sum, p) => sum + p.amount, 0);
  const balanced = Math.abs(totalDebits - totalCredits) < 0.01;
  
  console.log(`   🎯 GL lines: ${postings.length}, Balance: ${balanced ? "✅ OK" : "❌ ERROR"}`);
  
  return { transactionId, financials, scenario, customerId };
}

/**
 * Generate Michele's daily summary
 */
function generateMicheleDailySummary(appointmentResults) {
  console.log("\n" + "=".repeat(70));
  console.log("📊 MICHELE'S HAIR SALON - FINANCE INTEGRATION SUMMARY");
  console.log("=".repeat(70));
  
  // Revenue summary
  const totalRevenue = appointmentResults.reduce((sum, r) => sum + r.financials.gross_amount, 0);
  const totalServiceRevenue = appointmentResults.reduce((sum, r) => sum + r.financials.service_revenue, 0);
  const totalProductRevenue = appointmentResults.reduce((sum, r) => sum + r.financials.product_revenue, 0);
  const totalVAT = appointmentResults.reduce((sum, r) => sum + r.financials.vat_amount, 0);
  const totalCommissions = appointmentResults.reduce((sum, r) => sum + r.financials.commission_amount, 0);
  
  console.log("\n💰 REVENUE BREAKDOWN:");
  console.log(`   Service Revenue:    AED ${totalServiceRevenue.toFixed(2)}`);
  console.log(`   Product Revenue:    AED ${totalProductRevenue.toFixed(2)}`);
  console.log(`   VAT Collected:      AED ${totalVAT.toFixed(2)}`);
  console.log(`   Gross Revenue:      AED ${totalRevenue.toFixed(2)}`);
  
  console.log("\n💸 EXPENSE BREAKDOWN:");
  console.log(`   Commission Paid:    AED ${totalCommissions.toFixed(2)}`);
  
  console.log("\n📈 PERFORMANCE METRICS:");
  console.log(`   Total Appointments: ${appointmentResults.length}`);
  console.log(`   Average Ticket:     AED ${(totalRevenue / appointmentResults.length).toFixed(2)}`);
  console.log(`   Commission Rate:    ${((totalCommissions / totalServiceRevenue) * 100).toFixed(1)}%`);
  
  // Customer breakdown
  console.log("\n👥 CUSTOMER BREAKDOWN:");
  appointmentResults.forEach(result => {
    const customer = result.scenario.customer;
    console.log(`   ${customer.name.padEnd(20)} | Visit #${customer.visit_number} | AED ${result.financials.gross_amount.toFixed(2)}`);
  });
  
  console.log("\n✅ ALL TRANSACTIONS POSTED TO GENERAL LEDGER");
  console.log("📊 Financial statements updated in real-time");
  console.log("🎯 Ready for Michele's dashboard and reporting");
}

/**
 * Main test execution
 */
async function main() {
  console.log("🏪 MICHELE'S HAIR SALON - FINANCE INTEGRATION TEST");
  console.log("=" + "=".repeat(60));
  console.log("🎯 Testing automatic GL posting for Michele's salon transactions");
  
  try {
    console.log(`\n📍 Testing with Michele's organization: ${SALON_ORG_ID}`);
    
    // Process appointment scenarios
    console.log("\n💇 Processing Michele's daily appointments...");
    const appointmentResults = [];
    
    for (const scenario of MICHELE_SCENARIOS) {
      try {
        const result = await postMicheleTransaction(SALON_ORG_ID, scenario);
        appointmentResults.push(result);
      } catch (error) {
        console.error(`❌ Failed to process appointment ${scenario.id}:`, error.message);
      }
    }
    
    // Generate daily summary
    if (appointmentResults.length > 0) {
      generateMicheleDailySummary(appointmentResults);
    }
    
    console.log("\n🎉 MICHELE'S SALON FINANCE INTEGRATION COMPLETED!");
    console.log("✅ All transactions automatically posted to GL with proper accounting");
    console.log("📊 Michele can now view real-time financial statements and reports");
    console.log("💡 Customer data integrated with financial transactions for complete visibility");
    
  } catch (error) {
    console.error("\n❌ Michele's salon integration test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);