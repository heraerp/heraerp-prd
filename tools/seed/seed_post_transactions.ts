#!/usr/bin/env node
// HERA Finance DNA v2.2 - Transaction Seeder (Org-agnostic)
// Posts sample transactions using runtime-resolved account entity IDs

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

type LineTemplate = {
  line_number: number;
  line_type: string;
  smart_code: string;
  account_code: string;
  amount_expr?: string;
  fixed_amount?: number;
  side: string;
};

type TransactionTemplate = {
  transaction: any;
  lines: LineTemplate[];
};

/**
 * Resolve amount from line configuration and context
 */
function amountFrom(line: LineTemplate, ctx: any): number {
  if (line.fixed_amount != null) {
    return Number(line.fixed_amount);
  }
  
  if (line.amount_expr && ctx[line.amount_expr] != null) {
    return Number(ctx[line.amount_expr]);
  }
  
  throw new Error(
    `Cannot resolve amount for line_number=${line.line_number}. ` +
    `Need fixed_amount or valid amount_expr with context value.`
  );
}

/**
 * Normalize GL side to DR/CR
 */
function toGLSide(side: string): string {
  const normalized = side?.toUpperCase();
  if (normalized === "DR" || normalized === "DEBIT") return "DR";
  if (normalized === "CR" || normalized === "CREDIT") return "CR";
  throw new Error(`Invalid GL side: ${side}. Must be DR/CR or DEBIT/CREDIT.`);
}

/**
 * Post transaction from template file
 */
async function postTemplate(templateFile: string): Promise<void> {
  console.log(`\n📄 Processing template: ${path.basename(templateFile)}`);
  
  // Resolve organization
  const org_id = await resolveOrgId();
  
  // Load and parse template
  const templatePath = path.resolve(process.cwd(), templateFile);
  const rawTemplate: TransactionTemplate = JSON.parse(
    await fs.readFile(templatePath, "utf8")
  );
  
  // Build context from transaction and business_context
  const context = {
    ...(rawTemplate.transaction?.business_context ?? {}),
    ...rawTemplate.transaction
  };
  
  console.log(`  Context variables: ${Object.keys(context).join(", ")}`);
  
  // Determine needed account codes
  const neededCodes = Array.from(
    new Set(
      (rawTemplate.lines ?? [])
        .map((line: LineTemplate) => line.account_code)
        .filter(Boolean)
    )
  );
  
  console.log(`  Required accounts: ${neededCodes.join(", ")}`);
  
  // Resolve account entity IDs
  const accountMap = await resolveAccountIds(org_id, neededCodes);
  
  // Build transaction payload
  const payload = {
    p_action: "CREATE",
    p_organization_id: org_id,
    p_transaction: {
      smart_code: rawTemplate.transaction.smart_code,
      transaction_type: rawTemplate.transaction.transaction_type,
      transaction_date: rawTemplate.transaction.transaction_date,
      transaction_currency_code: rawTemplate.transaction.transaction_currency_code,
      base_currency_code: rawTemplate.transaction.base_currency_code,
      exchange_rate: rawTemplate.transaction.exchange_rate,
      exchange_rate_date: rawTemplate.transaction.exchange_rate_date,
      exchange_rate_type: rawTemplate.transaction.exchange_rate_type,
      fiscal_year: rawTemplate.transaction.fiscal_year,
      fiscal_period: rawTemplate.transaction.fiscal_period,
      total_amount: 0 // Will be calculated from lines
    },
    p_lines: (rawTemplate.lines ?? []).map((line: LineTemplate) => {
      const amount = amountFrom(line, context);
      return {
        line_number: line.line_number,
        line_type: "GL",
        smart_code: line.smart_code,
        entity_id: accountMap[line.account_code],
        line_amount: amount,
        line_data: {
          side: toGLSide(line.side),
          account_code: line.account_code
        }
      };
    }),
    p_dynamic: {
      business_context: {
        field_type: "json",
        field_value_json: rawTemplate.transaction.business_context,
        smart_code: "HERA.FINANCE.TXN.FIELD.CONTEXT.v1"
      }
    }
  };
  
  // Calculate total amount from lines
  const totalAmount = payload.p_lines.reduce((sum, line) => sum + line.line_amount, 0);
  payload.p_transaction.total_amount = totalAmount;
  
  console.log(`  Posting transaction with ${payload.p_lines.length} lines, total: ${totalAmount}`);
  
  // Post transaction
  const response = await fetch(`${HERA_API}/hera_transactions_crud_v2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TOKEN}`
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `${templateFile} posting failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }
  
  const result = await response.json();
  const transactionId = result?.items?.[0]?.id ?? result?.transaction_id;
  
  console.log(`  ✅ Posted successfully - Transaction ID: ${transactionId}`);
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log("🚀 HERA Finance DNA v2.2 - Transaction Seeder");
  console.log("=" + "=".repeat(50));
  
  try {
    // Ensure cache directory exists
    await fs.mkdir(".cache", { recursive: true });
    
    // Post all sample transactions
    const templates = [
      "seeds/finance/tx_sale_salon.template.json",
      "seeds/finance/tx_expense_fx.template.json", 
      "seeds/finance/tx_close_ye.template.json"
    ];
    
    for (const template of templates) {
      await postTemplate(template);
    }
    
    console.log("\n🎉 All transactions posted successfully!");
    console.log("   Check your HERA dashboard to view the posted transactions.");
    
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}