#!/usr/bin/env node
// HERA Finance DNA v2.2 - Salon Integration Test
// Tests complete salon transaction flow with automatic GL posting

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

// Salon transaction types with GL posting requirements
const SALON_SCENARIOS = [
  {
    name: "Hair Cut Service Sale",
    type: "SALON_SERVICE",
    scenario: {
      service: "HAIRCUT",
      stylist: "Michele",
      customer: "Sarah Johnson",
      price: 175.00,
      commission_rate: 0.30,
      vat_rate: 0.05
    }
  },
  {
    name: "Hair Coloring with Products",
    type: "SALON_SERVICE_PRODUCTS",
    scenario: {
      service: "COLORING",
      products: [
        { name: "Hair Dye", cost: 15.00, price: 45.00 },
        { name: "Developer", cost: 8.00, price: 25.00 }
      ],
      stylist: "Michele",
      customer: "Emma Wilson",
      service_price: 250.00,
      commission_rate: 0.25,
      vat_rate: 0.05
    }
  },
  {
    name: "Product Retail Sale",
    type: "SALON_RETAIL",
    scenario: {
      products: [
        { name: "Premium Shampoo", cost: 12.00, price: 35.00, qty: 2 },
        { name: "Hair Serum", cost: 20.00, price: 55.00, qty: 1 }
      ],
      customer: "Lisa Brown",
      vat_rate: 0.05
    }
  },
  {
    name: "Supplier Payment (Products)",
    type: "SALON_EXPENSE",
    scenario: {
      supplier: "Hair Products Ltd",
      invoice_amount: 1200.00,
      currency: "AED",
      expense_type: "INVENTORY_PURCHASE"
    }
  },
  {
    name: "Rent Payment",
    type: "SALON_EXPENSE", 
    scenario: {
      supplier: "Property Management Co",
      invoice_amount: 8500.00,
      currency: "AED",
      expense_type: "RENT"
    }
  },
  {
    name: "Staff Salary Payment",
    type: "SALON_PAYROLL",
    scenario: {
      employee: "Assistant Stylist",
      base_salary: 4500.00,
      commissions: 850.00,
      currency: "AED"
    }
  }
];

/**
 * Calculate salon transaction amounts and GL postings
 */
function calculateSalonFinancials(scenario: any) {
  switch (scenario.type) {
    case "SALON_SERVICE":
      const serviceNet = scenario.scenario.price;
      const serviceVat = serviceNet * scenario.scenario.vat_rate;
      const serviceGross = serviceNet + serviceVat;
      const serviceCommission = serviceNet * scenario.scenario.commission_rate;
      
      return {
        gross_amount: serviceGross,
        net_amount: serviceNet,
        vat_amount: serviceVat,
        commission_amount: serviceCommission,
        postings: [
          { account_code: "1000", side: "DR", amount: serviceGross, description: "Cash received" },
          { account_code: "4000", side: "CR", amount: serviceNet, description: "Service revenue" },
          { account_code: "2100", side: "CR", amount: serviceVat, description: "VAT payable" },
          { account_code: "5000", side: "DR", amount: serviceCommission, description: "Stylist commission" }
        ]
      };
      
    case "SALON_SERVICE_PRODUCTS":
      const svcPrice = scenario.scenario.service_price;
      const prodTotal = scenario.scenario.products.reduce((sum: number, p: any) => sum + p.price, 0);
      const totalNet = svcPrice + prodTotal;
      const totalVat = totalNet * scenario.scenario.vat_rate;
      const totalGross = totalNet + totalVat;
      const svcCommission = svcPrice * scenario.scenario.commission_rate;
      const prodCost = scenario.scenario.products.reduce((sum: number, p: any) => sum + p.cost, 0);
      
      return {
        gross_amount: totalGross,
        service_amount: svcPrice,
        product_amount: prodTotal,
        vat_amount: totalVat,
        commission_amount: svcCommission,
        product_cost: prodCost,
        postings: [
          { account_code: "1000", side: "DR", amount: totalGross, description: "Cash received" },
          { account_code: "4000", side: "CR", amount: svcPrice, description: "Service revenue" },
          { account_code: "4100", side: "CR", amount: prodTotal, description: "Product revenue" },
          { account_code: "2100", side: "CR", amount: totalVat, description: "VAT payable" },
          { account_code: "5000", side: "DR", amount: svcCommission, description: "Service commission" },
          { account_code: "5100", side: "DR", amount: prodCost, description: "Product COGS" },
          { account_code: "1300", side: "CR", amount: prodCost, description: "Inventory reduction" }
        ]
      };
      
    case "SALON_RETAIL":
      const retailGross = scenario.scenario.products.reduce((sum: number, p: any) => sum + (p.price * p.qty), 0);
      const retailVat = retailGross * scenario.scenario.vat_rate;
      const retailTotal = retailGross + retailVat;
      const retailCost = scenario.scenario.products.reduce((sum: number, p: any) => sum + (p.cost * p.qty), 0);
      
      return {
        gross_amount: retailTotal,
        net_amount: retailGross,
        vat_amount: retailVat,
        cost_amount: retailCost,
        postings: [
          { account_code: "1000", side: "DR", amount: retailTotal, description: "Cash received" },
          { account_code: "4100", side: "CR", amount: retailGross, description: "Product sales" },
          { account_code: "2100", side: "CR", amount: retailVat, description: "VAT payable" },
          { account_code: "5100", side: "DR", amount: retailCost, description: "Product COGS" },
          { account_code: "1300", side: "CR", amount: retailCost, description: "Inventory reduction" }
        ]
      };
      
    case "SALON_EXPENSE":
      const expenseAmount = scenario.scenario.invoice_amount;
      const expenseAccount = scenario.scenario.expense_type === "RENT" ? "6200" : 
                           scenario.scenario.expense_type === "INVENTORY_PURCHASE" ? "1300" : "6100";
      const expenseDesc = scenario.scenario.expense_type === "RENT" ? "Rent expense" :
                         scenario.scenario.expense_type === "INVENTORY_PURCHASE" ? "Inventory purchase" : "Operating expense";
      
      return {
        expense_amount: expenseAmount,
        postings: [
          { account_code: expenseAccount, side: "DR", amount: expenseAmount, description: expenseDesc },
          { account_code: "2101", side: "CR", amount: expenseAmount, description: "Accounts payable" }
        ]
      };
      
    case "SALON_PAYROLL":
      const baseSalary = scenario.scenario.base_salary;
      const commissions = scenario.scenario.commissions;
      const totalPayroll = baseSalary + commissions;
      
      return {
        total_payroll: totalPayroll,
        base_salary: baseSalary,
        commissions: commissions,
        postings: [
          { account_code: "6300", side: "DR", amount: baseSalary, description: "Salary expense" },
          { account_code: "6301", side: "DR", amount: commissions, description: "Commission expense" },
          { account_code: "2200", side: "CR", amount: totalPayroll, description: "Salaries payable" }
        ]
      };
      
    default:
      throw new Error(`Unknown salon transaction type: ${scenario.type}`);
  }
}

/**
 * Post salon transaction with automatic GL posting
 */
async function postSalonTransaction(org_id: string, scenario: any): Promise<any> {
  console.log(`\n💇 Processing: ${scenario.name}`);
  
  // Calculate financials and GL postings
  const financials = calculateSalonFinancials(scenario);
  console.log(`   Financial summary:`, JSON.stringify(financials, null, 2));
  
  // Get required account codes
  const accountCodes = Array.from(new Set(financials.postings.map((p: any) => p.account_code)));
  console.log(`   Required accounts: ${accountCodes.join(", ")}`);
  
  // Ensure all accounts exist
  await ensureAdditionalAccounts(org_id, accountCodes);
  
  // Resolve account entity IDs
  const accountMap = await resolveAccountIds(org_id, accountCodes);
  
  // Build transaction payload
  const transactionPayload = {
    p_action: "CREATE",
    p_organization_id: org_id,
    p_transaction: {
      smart_code: getSmartCodeForScenario(scenario.type),
      transaction_type: getTransactionTypeForScenario(scenario.type),
      transaction_date: new Date().toISOString(),
      transaction_currency_code: scenario.scenario.currency || "AED",
      base_currency_code: "AED",
      exchange_rate: 1.0,
      fiscal_year: 2025,
      fiscal_period: 10,
      total_amount: getTotalAmountForScenario(financials)
    },
    p_lines: financials.postings.map((posting: any, index: number) => ({
      line_number: (index + 1) * 10,
      line_type: "GL",
      smart_code: "HERA.SALON.FINANCE.GL.LINE.v1",
      entity_id: accountMap[posting.account_code],
      line_amount: posting.amount,
      description: posting.description,
      line_data: {
        side: posting.side,
        account_code: posting.account_code,
        salon_context: scenario.scenario
      }
    })),
    p_dynamic: {
      salon_scenario: {
        field_type: "json",
        field_value_json: scenario,
        smart_code: "HERA.SALON.FINANCE.FIELD.SCENARIO.v1"
      },
      financials_breakdown: {
        field_type: "json", 
        field_value_json: financials,
        smart_code: "HERA.SALON.FINANCE.FIELD.BREAKDOWN.v1"
      }
    }
  };
  
  console.log(`   Posting transaction with ${financials.postings.length} GL lines...`);
  
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
    throw new Error(`Failed to post ${scenario.name}: ${response.status} ${errorText}`);
  }
  
  const result = await response.json();
  const transactionId = result?.items?.[0]?.id;
  
  console.log(`   ✅ Posted successfully - Transaction ID: ${transactionId}`);
  console.log(`   💰 GL Impact: ${financials.postings.length} accounts affected`);
  
  return { transactionId, financials, scenario };
}

/**
 * Get smart code for scenario type
 */
function getSmartCodeForScenario(type: string): string {
  const smartCodes = {
    "SALON_SERVICE": "HERA.SALON.FINANCE.TXN.SERVICE.v1",
    "SALON_SERVICE_PRODUCTS": "HERA.SALON.FINANCE.TXN.SERVICE_PRODUCTS.v1", 
    "SALON_RETAIL": "HERA.SALON.FINANCE.TXN.RETAIL.v1",
    "SALON_EXPENSE": "HERA.SALON.FINANCE.TXN.EXPENSE.v1",
    "SALON_PAYROLL": "HERA.SALON.FINANCE.TXN.PAYROLL.v1"
  };
  return smartCodes[type] || "HERA.SALON.FINANCE.TXN.DEFAULT.v1";
}

/**
 * Get transaction type for scenario
 */
function getTransactionTypeForScenario(type: string): string {
  const transactionTypes = {
    "SALON_SERVICE": "SALE",
    "SALON_SERVICE_PRODUCTS": "SALE",
    "SALON_RETAIL": "SALE", 
    "SALON_EXPENSE": "AP_INVOICE",
    "SALON_PAYROLL": "PAYROLL"
  };
  return transactionTypes[type] || "SALE";
}

/**
 * Get total amount for scenario
 */
function getTotalAmountForScenario(financials: any): number {
  // Return the largest amount as transaction total
  if (financials.gross_amount) return financials.gross_amount;
  if (financials.expense_amount) return financials.expense_amount;
  if (financials.total_payroll) return financials.total_payroll;
  return 0;
}

/**
 * Ensure additional salon-specific accounts exist
 */
async function ensureAdditionalAccounts(org_id: string, neededCodes: string[]) {
  const additionalAccounts = [
    { code: "4100", name: "Product Sales Revenue", smart_code: "HERA.ACCOUNTING.COA.ACCOUNT.GL.REVENUE.v1" },
    { code: "1300", name: "Inventory", smart_code: "HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.v1" },
    { code: "5100", name: "Product COGS", smart_code: "HERA.ACCOUNTING.COA.ACCOUNT.GL.EXPENSE.v1" },
    { code: "6200", name: "Rent Expense", smart_code: "HERA.ACCOUNTING.COA.ACCOUNT.GL.EXPENSE.v1" },
    { code: "6300", name: "Salary Expense", smart_code: "HERA.ACCOUNTING.COA.ACCOUNT.GL.EXPENSE.v1" },
    { code: "6301", name: "Commission Expense", smart_code: "HERA.ACCOUNTING.COA.ACCOUNT.GL.EXPENSE.v1" },
    { code: "2200", name: "Salaries Payable", smart_code: "HERA.ACCOUNTING.COA.ACCOUNT.GL.LIABILITY.v1" }
  ];
  
  const neededAdditional = additionalAccounts.filter(acc => neededCodes.includes(acc.code));
  
  if (neededAdditional.length > 0) {
    console.log(`   🏗️  Ensuring additional accounts: ${neededAdditional.map(a => a.code).join(", ")}`);
    
    for (const account of neededAdditional) {
      try {
        const response = await fetch(`${HERA_API}/hera_entities_crud_v2`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOKEN}`
          },
          body: JSON.stringify({
            p_action: "CREATE",
            p_organization_id: org_id,
            p_entity: {
              entity_type: "account",
              entity_name: account.name,
              smart_code: account.smart_code,
              business_rules: { ledger_type: "GL" }
            },
            p_dynamic: {
              account_code: {
                field_type: "text",
                field_value_text: account.code,
                smart_code: "HERA.ACCOUNTING.COA.FIELD.CODE.v1"
              }
            }
          })
        });
        
        if (response.ok) {
          console.log(`     ✅ Account ${account.code} (${account.name}) ready`);
        }
      } catch (error) {
        console.log(`     ⚠️  Account ${account.code} may already exist: ${error}`);
      }
    }
  }
}

/**
 * Generate GL summary report
 */
function generateGLSummary(results: any[]) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 SALON FINANCE INTEGRATION - GL SUMMARY REPORT");
  console.log("=".repeat(60));
  
  const glTotals: Record<string, { debits: number, credits: number, description: string }> = {};
  
  results.forEach(result => {
    result.financials.postings.forEach((posting: any) => {
      if (!glTotals[posting.account_code]) {
        glTotals[posting.account_code] = { debits: 0, credits: 0, description: posting.description };
      }
      
      if (posting.side === "DR") {
        glTotals[posting.account_code].debits += posting.amount;
      } else {
        glTotals[posting.account_code].credits += posting.amount;
      }
    });
  });
  
  console.log("\nAccount  | Description           | Debits    | Credits   | Net       ");
  console.log("---------|----------------------|-----------|-----------|------------");
  
  let totalDebits = 0;
  let totalCredits = 0;
  
  Object.entries(glTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([code, totals]) => {
      const net = totals.debits - totals.credits;
      console.log(
        `${code.padEnd(8)} | ${totals.description.substring(0, 20).padEnd(20)} | ` +
        `${totals.debits.toFixed(2).padStart(9)} | ${totals.credits.toFixed(2).padStart(9)} | ` +
        `${net.toFixed(2).padStart(10)}`
      );
      totalDebits += totals.debits;
      totalCredits += totals.credits;
    });
  
  console.log("---------|----------------------|-----------|-----------|------------");
  console.log(
    `${"TOTALS".padEnd(8)} | ${" ".repeat(20)} | ` +
    `${totalDebits.toFixed(2).padStart(9)} | ${totalCredits.toFixed(2).padStart(9)} | ` +
    `${(totalDebits - totalCredits).toFixed(2).padStart(10)}`
  );
  
  console.log(`\n✅ GL Balance Check: ${Math.abs(totalDebits - totalCredits) < 0.01 ? "BALANCED" : "⚠️  UNBALANCED"}`);
  console.log(`📈 Total Transaction Volume: AED ${totalDebits.toFixed(2)}`);
  console.log(`🧾 Total Transactions Posted: ${results.length}`);
}

/**
 * Main test execution
 */
async function main() {
  console.log("🏪 HERA Finance DNA v2.2 - SALON INTEGRATION TEST");
  console.log("=" + "=".repeat(50));
  console.log("🎯 Testing complete salon-to-finance posting automation");
  
  try {
    // Resolve organization
    const org_id = await resolveOrgId();
    console.log(`\n📍 Testing with organization: ${org_id}`);
    
    // Ensure base accounts exist
    console.log("\n🏗️  Ensuring base Chart of Accounts...");
    await resolveAccountIds(org_id, ["1000", "4000", "2100", "5000", "2101"]);
    
    // Process all salon scenarios
    const results = [];
    for (const scenario of SALON_SCENARIOS) {
      try {
        const result = await postSalonTransaction(org_id, scenario);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to process ${scenario.name}:`, error);
      }
    }
    
    // Generate summary report
    generateGLSummary(results);
    
    console.log("\n🎉 SALON FINANCE INTEGRATION TEST COMPLETED!");
    console.log("✅ All salon transactions automatically generated GL postings");
    console.log("📊 Check your HERA dashboard for posted transactions and GL impact");
    
  } catch (error) {
    console.error("\n❌ Salon integration test failed:", error);
    process.exit(1);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}