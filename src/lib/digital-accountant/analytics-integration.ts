/**
 * 🤖 HERA Digital Accountant Analytics Integration
 * 
 * Natural language interface for accounting queries and operations
 * Integrates with analytics-chat for conversational accounting
 * 
 * Smart Code: HERA.FIN.ACCT.ANALYTICS.v1
 */

import { AnalyticsChatStorage, ChatMessage, CHAT_SMART_CODES } from '@/lib/analytics-chat-storage';
import { universalApi } from '@/lib/universal-api';
import { 
  AccountingQuery,
  AccountingOperation,
  FinancialReport,
  JournalEntry,
  ValidationResult,
  ACCOUNTANT_SMART_CODES
} from '@/types/digital-accountant.types';
import { IDigitalAccountantService } from './contracts';
import OpenAI from 'openai';

// ================================================================================
// ACCOUNTING CHAT SMART CODES
// ================================================================================

export const ACCOUNTING_CHAT_CODES = {
  ...CHAT_SMART_CODES,
  ACCOUNTING_QUERY: 'HERA.FIN.ACCT.CHAT.QUERY.v1',
  ACCOUNTING_REPORT: 'HERA.FIN.ACCT.CHAT.REPORT.v1',
  ACCOUNTING_ACTION: 'HERA.FIN.ACCT.CHAT.ACTION.v1',
  ACCOUNTING_VALIDATION: 'HERA.FIN.ACCT.CHAT.VALIDATE.v1'
} as const;

// ================================================================================
// QUERY INTENT TYPES
// ================================================================================

export type AccountingIntent = 
  | 'balance_inquiry'
  | 'transaction_search'
  | 'report_generation'
  | 'journal_creation'
  | 'reconciliation_status'
  | 'period_status'
  | 'compliance_check'
  | 'approval_request'
  | 'general_help';

export interface AccountingChatContext {
  organizationId: string;
  userId: string;
  sessionId: string;
  currentPeriod?: string;
  selectedAccounts?: string[];
  reportContext?: string;
  permissions?: string[];
}

// ================================================================================
// NATURAL LANGUAGE PATTERNS
// ================================================================================

const INTENT_PATTERNS: Record<AccountingIntent, RegExp[]> = {
  balance_inquiry: [
    /what.*balance/i,
    /show.*account.*balance/i,
    /how much.*in.*account/i,
    /current.*balance/i
  ],
  transaction_search: [
    /find.*transaction/i,
    /search.*journal/i,
    /show.*entries.*for/i,
    /list.*posting/i
  ],
  report_generation: [
    /generate.*report/i,
    /create.*statement/i,
    /show.*trial balance/i,
    /income statement/i,
    /balance sheet/i,
    /cash flow/i
  ],
  journal_creation: [
    /create.*journal/i,
    /post.*entry/i,
    /record.*transaction/i,
    /book.*adjustment/i
  ],
  reconciliation_status: [
    /reconciliation.*status/i,
    /unreconciled.*items/i,
    /bank.*reconciliation/i,
    /matching.*status/i
  ],
  period_status: [
    /period.*status/i,
    /close.*period/i,
    /open.*periods/i,
    /accounting.*period/i
  ],
  compliance_check: [
    /compliance.*check/i,
    /audit.*trail/i,
    /validation.*errors/i,
    /control.*report/i
  ],
  approval_request: [
    /pending.*approval/i,
    /approve.*journal/i,
    /authorization.*needed/i,
    /waiting.*approval/i
  ],
  general_help: [
    /help/i,
    /what can.*do/i,
    /how.*work/i,
    /explain/i
  ]
};

// ================================================================================
// ACCOUNTING ANALYTICS INTEGRATION
// ================================================================================

export class AccountingAnalyticsIntegration {
  private chatStorage: AnalyticsChatStorage;
  private accountantService: IDigitalAccountantService;
  private openai: OpenAI | null = null;
  private context: AccountingChatContext;

  constructor(
    accountantService: IDigitalAccountantService,
    context: AccountingChatContext
  ) {
    this.accountantService = accountantService;
    this.context = context;
    this.chatStorage = new AnalyticsChatStorage(context.organizationId);
    
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  /**
   * Process natural language accounting query
   */
  async processQuery(query: string): Promise<string> {
    try {
      // Save user query
      await this.chatStorage.saveMessage({
        session_id: this.context.sessionId,
        message_type: 'user',
        content: query,
        timestamp: new Date().toISOString(),
        metadata: {
          smart_code: ACCOUNTING_CHAT_CODES.ACCOUNTING_QUERY
        }
      });

      // Detect intent
      const intent = this.detectIntent(query);
      
      // Process based on intent
      let response: string;
      switch (intent) {
        case 'balance_inquiry':
          response = await this.handleBalanceInquiry(query);
          break;
        
        case 'transaction_search':
          response = await this.handleTransactionSearch(query);
          break;
        
        case 'report_generation':
          response = await this.handleReportGeneration(query);
          break;
        
        case 'journal_creation':
          response = await this.handleJournalCreation(query);
          break;
        
        case 'reconciliation_status':
          response = await this.handleReconciliationStatus(query);
          break;
        
        case 'period_status':
          response = await this.handlePeriodStatus(query);
          break;
        
        case 'compliance_check':
          response = await this.handleComplianceCheck(query);
          break;
        
        case 'approval_request':
          response = await this.handleApprovalRequest(query);
          break;
        
        default:
          response = await this.handleGeneralHelp(query);
      }

      // Save assistant response
      await this.chatStorage.saveMessage({
        session_id: this.context.sessionId,
        message_type: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        metadata: {
          smart_code: ACCOUNTING_CHAT_CODES.ACCOUNTING_REPORT,
          intent,
          tokens_used: response.length / 4 // Approximate token count
        }
      });

      return response;

    } catch (error) {
      console.error('Error processing accounting query:', error);
      return `I encountered an error processing your request: ${error.message}. Please try rephrasing your question or contact support.`;
    }
  }

  /**
   * Detect user intent from query
   */
  private detectIntent(query: string): AccountingIntent {
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(query))) {
        return intent as AccountingIntent;
      }
    }
    return 'general_help';
  }

  // ================================================================================
  // INTENT HANDLERS
  // ================================================================================

  private async handleBalanceInquiry(query: string): Promise<string> {
    // Extract account information from query
    const accountMatch = query.match(/(?:account|GL)\s*(?:code|number|#)?\s*(\d+)/i);
    const accountCode = accountMatch?.[1];

    if (accountCode) {
      // Get specific account balance
      const { data: account, error } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', this.context.organizationId)
        .eq('entity_type', 'gl_account')
        .eq('entity_code', accountCode)
        .single();

      if (error || !account) {
        return `I couldn't find GL account ${accountCode}. Please verify the account code.`;
      }

      // Calculate balance from transactions
      const balance = await this.calculateAccountBalance(account.id);
      
      return `📊 Account Balance

**Account:** ${accountCode} - ${account.entity_name}
**Current Balance:** ${this.formatCurrency(balance)}
**Account Type:** ${account.metadata?.account_type || 'General'}

Would you like to see recent transactions for this account?`;
    } else {
      // Show summary of key accounts
      return await this.getAccountBalanceSummary();
    }
  }

  private async handleTransactionSearch(query: string): Promise<string> {
    // Extract search criteria
    const dateMatch = query.match(/(?:from|since|after)\s+(\d{4}-\d{2}-\d{2})/i);
    const amountMatch = query.match(/(?:amount|total)\s*(?:of|=)?\s*\$?([\d,]+\.?\d*)/i);
    const typeMatch = query.match(/(?:type|kind)\s*(?:of|=)?\s*(\w+)/i);

    const filters: any = {
      organization_id: this.context.organizationId
    };

    if (dateMatch) {
      filters.transaction_date = { gte: dateMatch[1] };
    }
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      filters.total_amount = { gte: amount - 0.01, lte: amount + 0.01 };
    }
    if (typeMatch) {
      filters.transaction_type = typeMatch[1].toLowerCase();
    }

    // Search transactions
    const transactions = await universalApi.searchTransactions(filters, { limit: 10 });

    if (!transactions || transactions.length === 0) {
      return `No transactions found matching your criteria. Try adjusting your search parameters.`;
    }

    let response = `🔍 Transaction Search Results\n\nFound ${transactions.length} matching transactions:\n\n`;
    
    transactions.forEach((tx, index) => {
      response += `${index + 1}. **${tx.transaction_code}**
   Date: ${tx.transaction_date}
   Type: ${tx.transaction_type}
   Amount: ${this.formatCurrency(tx.total_amount)}
   Status: ${tx.transaction_status}
   ${tx.metadata?.description || ''}\n\n`;
    });

    return response;
  }

  private async handleReportGeneration(query: string): Promise<string> {
    // Detect report type
    let reportType: string = 'trial_balance';
    if (query.includes('balance sheet')) reportType = 'balance_sheet';
    else if (query.includes('income statement') || query.includes('p&l')) reportType = 'income_statement';
    else if (query.includes('cash flow')) reportType = 'cash_flow';

    // Extract period
    const currentDate = new Date();
    const periodMatch = query.match(/(?:for|in)\s+(\w+)\s+(\d{4})/i);
    let period_start: string, period_end: string;

    if (periodMatch) {
      const month = this.parseMonth(periodMatch[1]);
      const year = parseInt(periodMatch[2]);
      period_start = new Date(year, month, 1).toISOString().split('T')[0];
      period_end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    } else {
      // Default to current month
      period_start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      period_end = currentDate.toISOString().split('T')[0];
    }

    // Generate report
    const report = await this.accountantService.generateFinancialReport(
      reportType,
      `${period_start}_${period_end}`
    );

    return this.formatFinancialReport(report, reportType);
  }

  private async handleJournalCreation(query: string): Promise<string> {
    // Use AI to parse journal entry details if available
    if (this.openai) {
      const journalDetails = await this.parseJournalWithAI(query);
      
      if (journalDetails) {
        return `📝 Journal Entry Draft

I've prepared the following journal entry based on your description:

**Date:** ${journalDetails.date}
**Description:** ${journalDetails.description}

**Journal Lines:**
${journalDetails.lines.map((line, i) => 
  `${i + 1}. ${line.account} - ${line.description}
     Debit: ${this.formatCurrency(line.debit)} | Credit: ${this.formatCurrency(line.credit)}`
).join('\n')}

**Total:** Debits ${this.formatCurrency(journalDetails.totalDebits)} = Credits ${this.formatCurrency(journalDetails.totalCredits)}

Would you like me to:
1. Create this as a draft journal entry?
2. Create and post it immediately?
3. Make adjustments to the entry?

Please respond with your choice (1, 2, or 3).`;
      }
    }

    // Fallback to guided creation
    return `📝 Create Journal Entry

To create a journal entry, I need the following information:

1. **Date** - When did this transaction occur?
2. **Description** - What is this journal entry for?
3. **Lines** - Which accounts to debit and credit?

Example format:
"Create a journal entry for today to record $5,000 cash sale - debit cash 1100 credit revenue 4100"

Please provide the journal entry details in a similar format.`;
  }

  private async handleReconciliationStatus(query: string): Promise<string> {
    // Get active reconciliation sessions
    const { data: sessions, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.context.organizationId)
      .eq('entity_type', 'reconciliation_session')
      .eq('metadata->>status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !sessions || sessions.length === 0) {
      return `📊 No active reconciliation sessions found.

Would you like to:
1. Start a new bank reconciliation?
2. View completed reconciliations?
3. See unreconciled transactions?`;
    }

    let response = `🏦 Active Reconciliation Sessions\n\n`;
    
    sessions.forEach((session, index) => {
      const meta = session.metadata;
      response += `${index + 1}. **${meta.bank_account_code}**
   Statement Date: ${meta.statement_date}
   Statement Balance: ${this.formatCurrency(meta.statement_balance)}
   Reconciled Balance: ${this.formatCurrency(meta.reconciled_balance)}
   Difference: ${this.formatCurrency(meta.difference)}
   Progress: ${meta.auto_matched_count + meta.manual_matched_count} items matched\n\n`;
    });

    return response;
  }

  private async handlePeriodStatus(query: string): Promise<string> {
    // Get accounting periods
    const { data: periods, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.context.organizationId)
      .eq('entity_type', 'accounting_period')
      .order('entity_code', { ascending: false })
      .limit(6);

    if (error || !periods) {
      return `Unable to retrieve period information. Please try again.`;
    }

    let response = `📅 Accounting Period Status\n\n`;
    
    periods.forEach(period => {
      const meta = period.metadata;
      const statusEmoji = {
        open: '🟢',
        soft_closed: '🟡',
        hard_closed: '🔴',
        archived: '📦'
      }[meta.status] || '❓';

      response += `${statusEmoji} **${period.entity_code}** - ${meta.status}
   ${meta.closed_at ? `Closed: ${new Date(meta.closed_at).toLocaleDateString()}` : 'Currently open'}\n`;
    });

    response += `\n💡 Legend:
🟢 Open - Transactions can be posted
🟡 Soft Closed - Limited posting with approval
🔴 Hard Closed - No posting allowed
📦 Archived - Historical period`;

    return response;
  }

  private async handleComplianceCheck(query: string): Promise<string> {
    // Run basic compliance checks
    const checks = {
      unbalancedJournals: 0,
      unapprovedJournals: 0,
      missingDocumentation: 0,
      overdueReconciliations: 0
    };

    // Check for unbalanced journals
    const { data: unbalanced } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', this.context.organizationId)
      .eq('entity_type', 'journal_entry')
      .neq('metadata->>total_debits', 'metadata->>total_credits')
      .neq('metadata->>status', 'cancelled');

    checks.unbalancedJournals = unbalanced?.length || 0;

    // Check for unapproved journals
    const { data: unapproved } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', this.context.organizationId)
      .eq('entity_type', 'journal_entry')
      .eq('metadata->>status', 'pending_approval');

    checks.unapprovedJournals = unapproved?.length || 0;

    let response = `🛡️ Compliance Check Results\n\n`;
    
    if (Object.values(checks).every(v => v === 0)) {
      response += `✅ All compliance checks passed!\n\nYour books appear to be in good order.`;
    } else {
      response += `⚠️ Issues requiring attention:\n\n`;
      
      if (checks.unbalancedJournals > 0) {
        response += `🔴 **Unbalanced Journals:** ${checks.unbalancedJournals} entries need correction\n`;
      }
      if (checks.unapprovedJournals > 0) {
        response += `🟡 **Pending Approvals:** ${checks.unapprovedJournals} journals awaiting approval\n`;
      }
      if (checks.missingDocumentation > 0) {
        response += `🟡 **Missing Documentation:** ${checks.missingDocumentation} transactions lack supporting documents\n`;
      }
      if (checks.overdueReconciliations > 0) {
        response += `🟡 **Overdue Reconciliations:** ${checks.overdueReconciliations} accounts need reconciliation\n`;
      }

      response += `\nWould you like me to provide details on any specific issue?`;
    }

    return response;
  }

  private async handleApprovalRequest(query: string): Promise<string> {
    // Get pending approvals
    const { data: pendingItems, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.context.organizationId)
      .eq('entity_type', 'journal_entry')
      .eq('metadata->>status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !pendingItems || pendingItems.length === 0) {
      return `✅ No journal entries pending approval.

All journal entries have been processed.`;
    }

    let response = `📋 Journal Entries Pending Approval\n\n`;
    response += `Found ${pendingItems.length} entries requiring approval:\n\n`;

    pendingItems.forEach((item, index) => {
      const meta = item.metadata;
      response += `${index + 1}. **${item.entity_name}**
   Date: ${meta.journal_date}
   Description: ${meta.description}
   Total: ${this.formatCurrency(meta.total_debits)}
   Created: ${new Date(item.created_at).toLocaleDateString()}\n\n`;
    });

    response += `To approve entries, please specify the journal ID or use the approval workflow in the accounting module.`;

    return response;
  }

  private async handleGeneralHelp(query: string): Promise<string> {
    return `🤖 HERA Digital Accountant Assistant

I can help you with:

**📊 Account Balances**
- "What's the balance in account 1100?"
- "Show me all cash account balances"

**🔍 Transaction Search**
- "Find all transactions from January 2024"
- "Show journal entries over $10,000"

**📈 Financial Reports**
- "Generate trial balance for this month"
- "Show me the income statement"

**📝 Journal Entries**
- "Create a journal entry for..."
- "Post draft journals"

**🏦 Bank Reconciliation**
- "Show reconciliation status"
- "Start bank reconciliation"

**📅 Period Management**
- "What periods are open?"
- "Close January 2024 period"

**🛡️ Compliance**
- "Run compliance check"
- "Show audit trail for..."

**✅ Approvals**
- "Show pending approvals"
- "Approve journal entry..."

Try asking a specific question about your accounting data!`;
  }

  // ================================================================================
  // HELPER METHODS
  // ================================================================================

  private async calculateAccountBalance(accountId: string): Promise<number> {
    // Get all transaction lines for this account
    const { data: lines } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .eq('organization_id', this.context.organizationId)
      .eq('metadata->>gl_account_id', accountId);

    if (!lines) return 0;

    let balance = 0;
    lines.forEach(line => {
      balance += (line.metadata?.debit_amount || 0) - (line.metadata?.credit_amount || 0);
    });

    return balance;
  }

  private async getAccountBalanceSummary(): Promise<string> {
    // Get key account types
    const accountTypes = ['cash', 'accounts_receivable', 'accounts_payable', 'revenue', 'expenses'];
    let response = `📊 Account Balance Summary\n\n`;

    for (const type of accountTypes) {
      const { data: accounts } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', this.context.organizationId)
        .eq('entity_type', 'gl_account')
        .eq('metadata->>account_type', type)
        .limit(5);

      if (accounts && accounts.length > 0) {
        response += `**${this.formatAccountType(type)}**\n`;
        
        for (const account of accounts) {
          const balance = await this.calculateAccountBalance(account.id);
          response += `  ${account.entity_code} - ${account.entity_name}: ${this.formatCurrency(balance)}\n`;
        }
        response += '\n';
      }
    }

    return response;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  }

  private formatAccountType(type: string): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private formatFinancialReport(report: FinancialReport, reportType: string): string {
    let response = `📊 ${this.formatAccountType(reportType)}\n`;
    response += `Period: ${report.period_start} to ${report.period_end}\n`;
    response += `Generated: ${new Date(report.metadata.generated_at).toLocaleString()}\n\n`;

    report.sections.forEach(section => {
      response += `**${section.section_name}**\n`;
      
      section.line_items.forEach(item => {
        const amount = this.formatCurrency(item.amount);
        const padding = ' '.repeat(Math.max(0, 40 - item.gl_account_name.length));
        response += `  ${item.gl_account_name}${padding}${amount}\n`;
      });
      
      response += `  ${'─'.repeat(40)}\n`;
      response += `  **Subtotal**${' '.repeat(28)}${this.formatCurrency(section.subtotal)}\n\n`;
    });

    return response;
  }

  private parseMonth(monthStr: string): number {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthIndex = months.findIndex(m => m.startsWith(monthStr.toLowerCase()));
    return monthIndex >= 0 ? monthIndex : new Date().getMonth();
  }

  private async parseJournalWithAI(query: string): Promise<any> {
    if (!this.openai) return null;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an accounting assistant. Parse the user's request for creating a journal entry and extract:
1. date (YYYY-MM-DD format, default to today)
2. description
3. lines array with: account code, account name, description, debit amount, credit amount

Ensure debits equal credits. Output as JSON.`
          },
          {
            role: "user",
            content: query
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      if (result.lines && result.description) {
        // Calculate totals
        result.totalDebits = result.lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
        result.totalCredits = result.lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);
        return result;
      }
    } catch (error) {
      console.error('AI parsing error:', error);
    }

    return null;
  }
}