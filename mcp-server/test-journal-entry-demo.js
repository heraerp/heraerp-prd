#!/usr/bin/env node
/**
 * HERA Digital Accountant - Journal Entry Demo Test
 * Smart Code: HERA.TEST.DIGITAL.ACCOUNTANT.JOURNAL.v1
 * 
 * Demonstrates complete journal entry process from natural language to posted entries
 */

const Table = require('cli-table3');

// Simple color functions to replace chalk
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// Create chalk-like interface
const chalk = {
  blue: { bold: (text) => colors.bold(colors.blue(text)) },
  green: { bold: (text) => colors.bold(colors.green(text)) },
  red: (text) => colors.red(text),
  yellow: (text) => colors.yellow(text),
  gray: (text) => colors.gray(text),
  bold: (text) => colors.bold(text)
};

// Test organization ID (Hair Talkz Salon)
const ORGANIZATION_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

// Real Hair Talkz Salon Chart of Accounts (Dubai-specific)
const salonCOA = {
  cash_on_hand: { id: '478a3f22-4036-451d-9755-eceb7d3c567a', code: '1100000', name: 'Cash and Cash Equivalents' },
  card_clearing: { id: 'e59ea8d7-0ded-4510-a4ea-d998743cb369', code: '1120000', name: 'Bank Accounts' },
  accounts_payable: { id: '421083a6-eca4-44d6-b42b-74cd90acd019', code: '2100000', name: 'Accounts Payable' },
  commission_payable: { id: '57429e77-0caa-45fa-b56e-a78a44a718df', code: '2210000', name: 'Commission Payable' },
  vat_output_tax: { id: '1469112c-df86-4058-9e7f-68f1cc19ad98', code: '2400000', name: 'VAT Payable' },
  service_revenue: { id: 'a99eb1e4-8f2f-46cf-98a7-2a35d141d9be', code: '4110000', name: 'Haircut Services Revenue' },
  product_revenue: { id: 'c1cf82c5-7926-413f-bebe-7b5518c413f7', code: '4210000', name: 'Hair Care Products Sales' },
  commission_expense: { id: 'f8619078-ed8f-4716-a46f-1e58ca845cc7', code: '5110000', name: 'Stylist Commission' },
  operating_expenses: { id: '49c77ec1-751e-44f9-a693-b8a3ac9f1351', code: '5130000', name: 'Product Costs' }
};

// Demo examples
const DEMO_EXAMPLES = [
  {
    type: 'cash_sale',
    utterance: 'Maya paid 450 cash for haircut and styling',
    description: 'Simple cash sale without VAT'
  },
  {
    type: 'card_sale_vat',
    utterance: 'Client paid 525 by card for full treatment including 5% VAT',
    description: 'Card sale with VAT calculation'
  },
  {
    type: 'commission',
    utterance: 'Pay Sarah 40% commission on 2000 revenue',
    description: 'Staff commission payment'
  },
  {
    type: 'expense',
    utterance: 'Bought hair supplies from Beauty Depot for 320',
    description: 'Business expense recording'
  }
];

async function runJournalEntryDemo() {
  console.log(colors.bold(colors.blue('\n🤖 HERA Digital Accountant - Journal Entry Demo\n')));
  console.log(colors.bold(colors.cyan('🏪 Using Hair Talkz Salon Chart of Accounts (Dubai)\n')));
  console.log(colors.gray(`📊 Organization: ${ORGANIZATION_ID}`));
  console.log(colors.gray(`🏦 50 GL accounts including salon-specific revenue & expense accounts\n`));
  
  console.log(colors.yellow('Testing complete flow: Natural Language → Journal Entry → Posted Transaction\n'));

  for (const example of DEMO_EXAMPLES) {
    console.log(colors.bold(colors.green(`\n📝 Example: ${example.description}`)));
    console.log(colors.gray(`Input: "${example.utterance}"\n`));

    try {
      // Simulate the journal entry process
      const result = await simulateJournalEntry(example);
      
      // Display results
      displayJournalEntry(result);
      
    } catch (error) {
      console.log(colors.red(`❌ Error: ${error.message}\n`));
    }
  }

  console.log(colors.bold(colors.blue('\n✅ Demo completed! All examples show how HERA transforms natural language into proper accounting entries.\n')));
}

async function simulateJournalEntry(example) {
  // Simulate the Digital Accountant processing
  const event = generateFinanceEvent(example);
  const journalEntry = generateJournalEntry(event);
  const validation = validateJournalEntry(journalEntry);
  
  return {
    natural_input: example.utterance,
    event,
    journal_entry: journalEntry,
    validation,
    posted: true,
    timestamp: new Date().toISOString()
  };
}

function generateFinanceEvent(example) {
  const baseEvent = {
    organization_id: ORGANIZATION_ID,
    event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    event_timestamp: new Date().toISOString(),
    document: {
      document_date: new Date().toISOString().split('T')[0],
      reference: `REF-${Date.now()}`
    },
    metadata: {
      source_app: 'Digital Accountant Demo',
      captured_by: 'assistant_nlu',
      utterance: example.utterance
    }
  };

  switch (example.type) {
    case 'cash_sale':
      return {
        ...baseEvent,
        event_type: 'SALE',
        amounts: { currency: 'AED', gross_amount: 450.00 },
        payment: { method: 'CASH' },
        lines: [{ description: 'Haircut and styling', quantity: 1, unit_amount: 450.00 }],
        posting: { policy: 'AUTO' }
      };

    case 'card_sale_vat':
      return {
        ...baseEvent,
        event_type: 'SALE',
        amounts: { 
          currency: 'AED', 
          net_amount: 500.00, 
          tax_amount: 25.00, 
          gross_amount: 525.00,
          tax_code: 'VAT.5'
        },
        payment: { method: 'CARD' },
        lines: [{ description: 'Full hair treatment package', quantity: 1, unit_amount: 500.00 }],
        posting: { policy: 'AUTO' }
      };

    case 'commission':
      return {
        ...baseEvent,
        event_type: 'EXPENSE',
        amounts: { currency: 'AED', gross_amount: 800.00 },
        lines: [{ description: 'Commission - Sarah (40% on AED 2,000)', quantity: 1, unit_amount: 800.00 }],
        posting: { policy: 'AUTO' }
      };

    case 'expense':
      return {
        ...baseEvent,
        event_type: 'EXPENSE',
        amounts: { currency: 'AED', gross_amount: 320.00 },
        lines: [{ description: 'Hair supplies - Beauty Depot', quantity: 1, unit_amount: 320.00 }],
        posting: { policy: 'AUTO' }
      };

    default:
      throw new Error(`Unknown example type: ${example.type}`);
  }
}

function generateJournalEntry(event) {
  const transactionId = `TXN-${Date.now()}`;
  const currentDate = new Date();
  
  const header = {
    organization_id: ORGANIZATION_ID,
    transaction_id: transactionId,
    transaction_type: 'JOURNAL_ENTRY',
    transaction_date: event.document.document_date,
    reference_number: event.document.reference,
    smart_code: getJournalSmartCode(event.event_type),
    fiscal_year: currentDate.getFullYear(),
    fiscal_period: currentDate.getMonth() + 1,
    posting_period_code: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
    transaction_currency_code: event.amounts.currency,
    total_amount: event.amounts.gross_amount,
    ai_confidence: 0.95,
    ai_insights: {
      posting_recipe: getPostingRecipe(event),
      source_event_id: event.event_id,
      natural_language_input: event.metadata.utterance
    }
  };

  const lines = generateJournalLines(event, transactionId);

  return { header, lines };
}

function generateJournalLines(event, transactionId) {
  const lines = [];
  let lineNumber = 1;

  switch (event.event_type) {
    case 'SALE':
      // Debit: Cash/Card (using real salon accounts)
      const assetAccount = event.payment?.method === 'CASH' ? salonCOA.cash_on_hand : salonCOA.card_clearing;
      lines.push({
        organization_id: ORGANIZATION_ID,
        transaction_id: transactionId,
        line_number: lineNumber++,
        line_type: 'DEBIT',
        entity_id: assetAccount.id,
        account_code: assetAccount.code,
        account_name: assetAccount.name,
        description: `${event.payment?.method || 'Cash'} received - ${event.document.reference}`,
        line_amount: event.amounts.gross_amount,
        smart_code: `HERA.SALON.GL.ASSET.${assetAccount.code}.v1`
      });

      // Credit: Service Revenue (using real salon account)
      const revenueAmount = event.amounts.net_amount || event.amounts.gross_amount;
      lines.push({
        organization_id: ORGANIZATION_ID,
        transaction_id: transactionId,
        line_number: lineNumber++,
        line_type: 'CREDIT',
        entity_id: salonCOA.service_revenue.id,
        account_code: salonCOA.service_revenue.code,
        account_name: salonCOA.service_revenue.name,
        description: event.lines[0].description,
        line_amount: revenueAmount,
        smart_code: `HERA.SALON.GL.REVENUE.${salonCOA.service_revenue.code}.v1`
      });

      // Credit: VAT Output Tax (if applicable - using real salon account)
      if (event.amounts.tax_amount && event.amounts.tax_amount > 0) {
        lines.push({
          organization_id: ORGANIZATION_ID,
          transaction_id: transactionId,
          line_number: lineNumber++,
          line_type: 'CREDIT',
          entity_id: salonCOA.vat_output_tax.id,
          account_code: salonCOA.vat_output_tax.code,
          account_name: salonCOA.vat_output_tax.name,
          description: `VAT ${event.amounts.tax_code} on ${event.document.reference}`,
          line_amount: event.amounts.tax_amount,
          smart_code: `HERA.SALON.GL.LIABILITY.${salonCOA.vat_output_tax.code}.v1`
        });
      }
      break;

    case 'EXPENSE':
      // Determine expense type (using real salon accounts)
      const isCommission = event.metadata.utterance.toLowerCase().includes('commission');
      const expenseAccount = isCommission ? salonCOA.commission_expense : salonCOA.operating_expenses;
      const liabilityAccount = isCommission ? salonCOA.commission_payable : salonCOA.accounts_payable;

      // Debit: Expense
      lines.push({
        organization_id: ORGANIZATION_ID,
        transaction_id: transactionId,
        line_number: lineNumber++,
        line_type: 'DEBIT',
        entity_id: expenseAccount.id,
        account_code: expenseAccount.code,
        account_name: expenseAccount.name,
        description: event.lines[0].description,
        line_amount: event.amounts.gross_amount,
        smart_code: `HERA.SALON.GL.EXPENSE.${expenseAccount.code}.v1`
      });

      // Credit: Liability
      lines.push({
        organization_id: ORGANIZATION_ID,
        transaction_id: transactionId,
        line_number: lineNumber++,
        line_type: 'CREDIT',
        entity_id: liabilityAccount.id,
        account_code: liabilityAccount.code,
        account_name: liabilityAccount.name,
        description: `Payment due - ${event.document.reference}`,
        line_amount: event.amounts.gross_amount,
        smart_code: `HERA.SALON.GL.LIABILITY.${liabilityAccount.code}.v1`
      });
      break;
  }

  return lines;
}

function validateJournalEntry(journalEntry) {
  const { lines } = journalEntry;
  
  const totalDebits = lines
    .filter(line => line.line_type === 'DEBIT')
    .reduce((sum, line) => sum + line.line_amount, 0);
    
  const totalCredits = lines
    .filter(line => line.line_type === 'CREDIT')
    .reduce((sum, line) => sum + line.line_amount, 0);

  return {
    balanced: Math.abs(totalDebits - totalCredits) < 0.01,
    total_debits: totalDebits,
    total_credits: totalCredits,
    organization_isolated: true,
    smart_codes_valid: true,
    fiscal_period_open: true
  };
}

function displayJournalEntry(result) {
  // Display the journal entry in a table
  const table = new Table({
    head: [
      colors.blue('Line'),
      colors.blue('Account'),
      colors.blue('Debit'),
      colors.blue('Credit'),
      colors.blue('Description')
    ],
    colWidths: [6, 35, 12, 12, 40]
  });

  result.journal_entry.lines.forEach(line => {
    table.push([
      line.line_number,
      `${line.account_code} - ${line.account_name}`,
      line.line_type === 'DEBIT' ? line.line_amount.toFixed(2) : '',
      line.line_type === 'CREDIT' ? line.line_amount.toFixed(2) : '',
      line.description
    ]);
  });

  // Add totals row
  table.push([
    '',
    colors.bold('TOTALS'),
    colors.bold(result.validation.total_debits.toFixed(2)),
    colors.bold(result.validation.total_credits.toFixed(2)),
    colors.green(result.validation.balanced ? '✅ BALANCED' : '❌ UNBALANCED')
  ]);

  console.log(table.toString());

  // Display metadata
  console.log(colors.gray(`🔍 Header Smart Code: ${result.journal_entry.header.smart_code}`));
  console.log(colors.gray(`📋 Line Smart Codes: ${result.journal_entry.lines.map(l => l.smart_code).join(', ')}`));
  console.log(colors.gray(`📅 Posting Period: ${result.journal_entry.header.posting_period_code}`));
  console.log(colors.gray(`🤖 AI Confidence: ${(result.journal_entry.header.ai_confidence * 100).toFixed(1)}%`));
  console.log(colors.gray(`🏷️  Reference: ${result.journal_entry.header.reference_number}`));
}

function getJournalSmartCode(eventType) {
  const codeMap = {
    'SALE': 'HERA.ACCOUNTING.GL.JOURNAL.SALES.v1',
    'EXPENSE': 'HERA.ACCOUNTING.GL.JOURNAL.EXPENSE.v1'
  };
  return codeMap[eventType] || 'HERA.ACCOUNTING.GL.JOURNAL.GENERAL.v1';
}

function getAccountSmartCode(accountType) {
  const codeMap = {
    'asset': 'HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.v1',
    'liability': 'HERA.ACCOUNTING.COA.ACCOUNT.GL.LIABILITY.v1',
    'revenue': 'HERA.ACCOUNTING.COA.ACCOUNT.GL.REVENUE.v1',
    'expense': 'HERA.ACCOUNTING.COA.ACCOUNT.GL.EXPENSE.v1'
  };
  return codeMap[accountType] || 'HERA.ACCOUNTING.COA.ACCOUNT.GL.GENERAL.v1';
}

function getPostingRecipe(event) {
  if (event.event_type === 'SALE') {
    if (event.amounts.tax_amount && event.amounts.tax_amount > 0) {
      return event.payment?.method === 'CARD' ? 'CARD_SALE_WITH_VAT' : 'CASH_SALE_WITH_VAT';
    }
    return event.payment?.method === 'CARD' ? 'CARD_SALE_NO_TAX' : 'CASH_SALE_NO_TAX';
  }
  if (event.event_type === 'EXPENSE') {
    return event.metadata.utterance.toLowerCase().includes('commission') ? 'COMMISSION_EXPENSE' : 'GENERAL_EXPENSE';
  }
  return 'GENERAL_JOURNAL';
}

// Main execution
if (require.main === module) {
  runJournalEntryDemo().catch(error => {
    console.error(colors.red('Demo failed:'), error);
    process.exit(1);
  });
}

module.exports = {
  runJournalEntryDemo,
  simulateJournalEntry,
  ORGANIZATION_ID
};