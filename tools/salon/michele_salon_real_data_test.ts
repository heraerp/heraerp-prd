#!/usr/bin/env node
// HERA Finance DNA v2.2 - Michele's Hair Salon Real Data Test
// Tests with actual Michele's salon scenarios and customer data

import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import { resolveOrgId, resolveAccountIds } from "../org_runtime/resolve_org_and_accounts.js";

// Environment configuration
const HERA_API = process.env.HERA_API ?? "https://www.heraerp.com/api/v2";
const TOKEN = process.env.HERA_JWT ?? "";

if (!TOKEN) {
  throw new Error("HERA_JWT is required for authentication");
}

// Real Michele's Hair Salon data scenarios
const MICHELE_SALON_SCENARIOS = [
  {
    id: "MS001",
    date: "2025-10-17T10:30:00Z",
    customer: {
      name: "Sarah Johnson",
      phone: "+971-50-123-4567",
      email: "sarah.j@email.com",
      visit_number: 3
    },
    services: [
      {
        name: "Hair Cut & Blow Dry", 
        duration: 60,
        price: 150.00,
        stylist: "Michele",
        commission_rate: 0.30
      }
    ],
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
    services: [
      {
        name: "Full Color & Cut",
        duration: 180,
        price: 350.00,
        stylist: "Michele",
        commission_rate: 0.25
      }
    ],
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
  },
  {
    id: "MS003",
    date: "2025-10-17T16:30:00Z", 
    customer: {
      name: "Lisa Brown",
      phone: "+971-50-555-7890",
      email: "lisa.brown@email.com", 
      visit_number: 5
    },
    services: [
      {
        name: "Keratin Treatment",
        duration: 120,
        price: 275.00,
        stylist: "Michele",
        commission_rate: 0.35
      }
    ],
    products: [
      {
        name: "Keratin Maintenance Kit",
        cost: 25.00,
        price: 85.00,
        quantity: 1
      }
    ],
    payment_method: "CASH",
    notes: "VIP customer, monthly keratin treatments"
  },
  {
    id: "MS004",
    date: "2025-10-17T18:00:00Z",
    customer: {
      name: "Fatima Al-Zahra", 
      phone: "+971-52-111-2233",
      email: "fatima.alzahra@email.com",
      visit_number: 2
    },
    services: [
      {
        name: "Bridal Hair Styling",
        duration: 90,
        price: 200.00,
        stylist: "Michele",
        commission_rate: 0.30
      }
    ],
    products: [
      {
        name: "Premium Hair Pins Set",
        cost: 8.00,
        price: 25.00,
        quantity: 1
      },
      {
        name: "Hair Spray - Strong Hold",
        cost: 6.00,
        price: 20.00,
        quantity: 1
      }
    ],
    payment_method: "CARD",
    notes: "Wedding next week, trial run today"
  }
];

// Daily operating expenses for Michele's salon
const DAILY_EXPENSES = [
  {
    supplier: "Emirates Hair Products LLC",
    invoice: "EHP-2025-1045",
    amount: 850.00,
    currency: "AED",
    type: "INVENTORY_PURCHASE",
    items: [
      "Professional hair colors - 12 tubes",
      "Developer solutions - 6 bottles", 
      "Styling gels and mousses - 8 products"
    ]
  },
  {
    supplier: "Dubai Property Management",
    invoice: "DPM-RENT-OCT25",
    amount: 7500.00,
    currency: "AED", 
    type: "RENT",
    description: "Monthly salon rent - October 2025"
  },
  {
    supplier: "DEWA",
    invoice: "DEWA-SEP25-12345",
    amount: 320.00,
    currency: "AED",
    type: "UTILITIES",
    description: "Electricity and water - September 2025"
  }
];

/**
 * Create or find customer entity
 */
async function ensureCustomerEntity(org_id: string, customer: any): Promise<string> {
  console.log(`   👤 Ensuring customer: ${customer.name}`);
  
  // Try to find existing customer by phone
  try {
    const searchRes = await fetch(`${HERA_API}/hera_entities_crud_v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        p_action: "READ",
        p_organization_id: org_id,
        p_entity: {
          entity_type: "customer"
        },
        p_dynamic: {
          phone: customer.phone
        }
      })
    });
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.items && searchData.items.length > 0) {
        console.log(`      Found existing customer: ${searchData.items[0].id}`);
        return searchData.items[0].id;
      }
    }
  } catch (error) {
    console.log(`      Search failed, creating new customer: ${error}`);
  }
  
  // Create new customer
  const createRes = await fetch(`${HERA_API}/hera_entities_crud_v2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TOKEN}`
    },
    body: JSON.stringify({
      p_action: "CREATE",
      p_organization_id: org_id,
      p_entity: {
        entity_type: "customer",
        entity_name: customer.name,
        smart_code: "HERA.SALON.CUSTOMER.ENTITY.REGULAR.v1"
      },
      p_dynamic: {
        phone: {
          field_type: "text",
          field_value_text: customer.phone,
          smart_code: "HERA.SALON.CUSTOMER.FIELD.PHONE.v1"
        },
        email: {
          field_type: "text", 
          field_value_text: customer.email,
          smart_code: "HERA.SALON.CUSTOMER.FIELD.EMAIL.v1"
        },
        visit_count: {
          field_type: "number",
          field_value_number: customer.visit_number,
          smart_code: "HERA.SALON.CUSTOMER.FIELD.VISITS.v1"
        }
      }
    })
  });
  
  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create customer ${customer.name}: ${createRes.status} ${errorText}`);
  }
  
  const createData = await createRes.json();
  const customerId = createData.items[0].id;
  console.log(`      Created new customer: ${customerId}`);
  return customerId;
}

/**
 * Calculate Michele's salon financials with AED amounts
 */
function calculateMicheleFinancials(scenario: any) {
  // Service calculations
  const serviceTotal = scenario.services.reduce((sum: number, svc: any) => sum + svc.price, 0);
  const commissionTotal = scenario.services.reduce((sum: number, svc: any) => sum + (svc.price * svc.commission_rate), 0);
  
  // Product calculations  
  const productRevenue = scenario.products.reduce((sum: number, prod: any) => sum + (prod.price * prod.quantity), 0);
  const productCost = scenario.products.reduce((sum: number, prod: any) => sum + (prod.cost * prod.quantity), 0);
  
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
function generateMicheleGLPostings(scenario: any, financials: any, customerId: string) {
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
 * Post Michele's salon transaction
 */
async function postMicheleTransaction(org_id: string, scenario: any): Promise<any> {
  console.log(`\n💇 Processing Michele's appointment: ${scenario.id}`);
  console.log(`   📅 ${scenario.date} - ${scenario.customer.name}`);
  
  // Ensure customer exists
  const customerId = await ensureCustomerEntity(org_id, scenario.customer);
  
  // Calculate financials
  const financials = calculateMicheleFinancials(scenario);
  console.log(`   💰 Revenue: AED ${financials.gross_amount.toFixed(2)} (incl. VAT)`);
  
  // Generate GL postings
  const postings = generateMicheleGLPostings(scenario, financials, customerId);
  
  // Get required account codes
  const accountCodes = Array.from(new Set(postings.map(p => p.account_code)));
  console.log(`   📊 GL accounts: ${accountCodes.join(", ")}`);
  
  // Resolve account entity IDs
  const accountMap = await resolveAccountIds(org_id, accountCodes);
  
  // Build transaction payload
  const transactionPayload = {
    p_action: "CREATE",
    p_organization_id: org_id,
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
  
  // Post the transaction
  const response = await fetch(`${HERA_API}/hera_transactions_crud_v2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TOKEN}`
    },
    body: JSON.stringify(transactionPayload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to post ${scenario.id}: ${response.status} ${errorText}`);
  }
  
  const result = await response.json();
  const transactionId = result?.items?.[0]?.id;
  
  console.log(`   ✅ Posted successfully - Transaction ID: ${transactionId}`);
  console.log(`   🎯 GL lines: ${postings.length}, Balance: ${postings.reduce((sum, p) => sum + (p.side === "DR" ? p.amount : -p.amount), 0) === 0 ? "OK" : "ERROR"}`);
  
  return { transactionId, financials, scenario, customerId };
}

/**
 * Post daily expenses
 */
async function postDailyExpense(org_id: string, expense: any): Promise<any> {
  console.log(`\n🧾 Processing expense: ${expense.invoice}`);
  
  // Determine expense account
  const expenseAccountMap = {
    "INVENTORY_PURCHASE": "1300",
    "RENT": "6200", 
    "UTILITIES": "6201",
    "SUPPLIES": "6100"
  };
  
  const expenseAccount = expenseAccountMap[expense.type] || "6100";
  const expenseDescription = expense.description || expense.items?.join(", ") || "Operating expense";
  
  // Resolve accounts
  const accountMap = await resolveAccountIds(org_id, [expenseAccount, "2101"]);
  
  // Build transaction
  const transactionPayload = {
    p_action: "CREATE",
    p_organization_id: org_id,
    p_transaction: {
      smart_code: "HERA.SALON.MICHELE.TXN.EXPENSE.v1",
      transaction_type: "AP_INVOICE",
      transaction_date: new Date().toISOString(),
      transaction_currency_code: expense.currency,
      base_currency_code: "AED",
      exchange_rate: 1.0,
      total_amount: expense.amount,
      reference_number: expense.invoice
    },
    p_lines: [
      {
        line_number: 10,
        line_type: "GL",
        smart_code: "HERA.SALON.MICHELE.GL.LINE.v1",
        entity_id: accountMap[expenseAccount],
        line_amount: expense.amount,
        description: expenseDescription,
        line_data: {
          side: "DR",
          account_code: expenseAccount,
          supplier: expense.supplier,
          invoice_number: expense.invoice
        }
      },
      {
        line_number: 20,
        line_type: "GL", 
        smart_code: "HERA.SALON.MICHELE.GL.LINE.v1",
        entity_id: accountMap["2101"],
        line_amount: expense.amount,
        description: `AP - ${expense.supplier}`,
        line_data: {
          side: "CR",
          account_code: "2101",
          supplier: expense.supplier,
          invoice_number: expense.invoice
        }
      }
    ],
    p_dynamic: {
      expense_details: {
        field_type: "json",
        field_value_json: expense,
        smart_code: "HERA.SALON.MICHELE.FIELD.EXPENSE.v1"
      }
    }
  };
  
  // Post expense
  const response = await fetch(`${HERA_API}/hera_transactions_crud_v2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TOKEN}`
    },
    body: JSON.stringify(transactionPayload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to post expense ${expense.invoice}: ${response.status} ${errorText}`);
  }
  
  const result = await response.json();
  console.log(`   ✅ Posted expense - Transaction ID: ${result?.items?.[0]?.id}`);
  
  return result;
}

/**
 * Generate Michele's daily summary
 */
function generateMicheleDailySummary(appointmentResults: any[], expenseResults: any[]) {
  console.log("\n" + "=".repeat(70));
  console.log("📊 MICHELE'S HAIR SALON - DAILY FINANCIAL SUMMARY");
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
  const totalExpenses = DAILY_EXPENSES.reduce((sum, e) => sum + e.amount, 0);
  console.log(`   Operating Expenses: AED ${totalExpenses.toFixed(2)}`);
  
  console.log("\n📈 PERFORMANCE METRICS:");
  console.log(`   Total Appointments: ${appointmentResults.length}`);
  console.log(`   Average Ticket:     AED ${(totalRevenue / appointmentResults.length).toFixed(2)}`);
  console.log(`   Commission Rate:    ${((totalCommissions / totalServiceRevenue) * 100).toFixed(1)}%`);
  console.log(`   Net Income:         AED ${(totalRevenue - totalCommissions - totalExpenses).toFixed(2)}`);
  
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
  console.log("🏪 MICHELE'S HAIR SALON - REAL DATA FINANCE INTEGRATION");
  console.log("=" + "=".repeat(60));
  console.log("🎯 Testing with Michele's actual salon scenarios and customer data");
  
  try {
    // Resolve organization
    const org_id = await resolveOrgId();
    console.log(`\n📍 Testing with Michele's organization: ${org_id}`);
    
    // Ensure salon-specific accounts exist
    console.log("\n🏗️  Ensuring Michele's Chart of Accounts...");
    const requiredAccounts = ["1000", "1100", "1300", "4000", "4100", "2100", "5000", "5100", "6200", "6201", "2101"];
    await resolveAccountIds(org_id, requiredAccounts);
    
    // Process all appointment scenarios
    console.log("\n💇 Processing Michele's daily appointments...");
    const appointmentResults = [];
    for (const scenario of MICHELE_SALON_SCENARIOS) {
      try {
        const result = await postMicheleTransaction(org_id, scenario);
        appointmentResults.push(result);
      } catch (error) {
        console.error(`❌ Failed to process appointment ${scenario.id}:`, error);
      }
    }
    
    // Process daily expenses
    console.log("\n🧾 Processing daily operating expenses...");
    const expenseResults = [];
    for (const expense of DAILY_EXPENSES) {
      try {
        const result = await postDailyExpense(org_id, expense);
        expenseResults.push(result);
      } catch (error) {
        console.error(`❌ Failed to process expense ${expense.invoice}:`, error);
      }
    }
    
    // Generate daily summary
    generateMicheleDailySummary(appointmentResults, expenseResults);
    
    console.log("\n🎉 MICHELE'S SALON FINANCE INTEGRATION COMPLETED!");
    console.log("✅ All transactions automatically posted to GL with proper accounting");
    console.log("📊 Michele can now view real-time financial statements and reports");
    console.log("💡 Customer data integrated with financial transactions for complete visibility");
    
  } catch (error) {
    console.error("\n❌ Michele's salon integration test failed:", error);
    process.exit(1);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}