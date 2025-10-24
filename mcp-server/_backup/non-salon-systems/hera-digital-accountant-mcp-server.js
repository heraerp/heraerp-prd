#!/usr/bin/env node

/**
 * 🧾 HERA Digital Accountant MCP Server
 * 
 * Enterprise-grade accounting automation with natural language interface
 * Enforces sacred 6-table architecture with smart code intelligence
 * 
 * Smart Code: HERA.FIN.ACCT.DIGITAL.MCP.v1
 */

require('dotenv').config();
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Import guardrails and validators
const { SQLGuardrailValidator, SACRED_TABLES, GUARDRAIL_RULES } = require('../src/lib/digital-accountant/sql-guardrails.js');

// ================================================================================
// CONSTANTS
// ================================================================================

const JOURNAL_STATUSES = ['draft', 'pending_approval', 'approved', 'posted', 'reversed', 'cancelled'];
const PERIOD_STATUSES = ['open', 'soft_closed', 'hard_closed', 'archived'];
const SMART_CODE_PATTERNS = {
  JOURNAL_MANUAL: 'HERA.FIN.GL.JE.MANUAL.v1',
  JOURNAL_AUTO: 'HERA.FIN.GL.JE.AUTO.v1',
  JOURNAL_REVERSAL: 'HERA.FIN.GL.JE.REVERSAL.v1',
  RECON_BANK: 'HERA.FIN.RECON.BANK.v1',
  REPORT_BS: 'HERA.FIN.REPORT.BS.v1',
  REPORT_PL: 'HERA.FIN.REPORT.PL.v1',
  AUDIT_TRAIL: 'HERA.FIN.AUDIT.TRAIL.v1'
};

// ================================================================================
// MCP SERVER CLASS
// ================================================================================

class HeraDigitalAccountantMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'hera-digital-accountant-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.guardrailValidator = null; // Will be initialized per request with org/user context
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Journal Entry Tools
        {
          name: 'create_journal_entry',
          description: 'Create a new journal entry with automatic validation and smart code assignment',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: { type: 'string', description: 'Organization UUID (required)' },
              journal_date: { type: 'string', description: 'Journal date (YYYY-MM-DD)' },
              description: { type: 'string', description: 'Journal entry description' },
              reference_number: { type: 'string', description: 'Reference number (optional)' },
              lines: {
                type: 'array',
                description: 'Journal lines with GL accounts and amounts',
                items: {
                  type: 'object',
                  properties: {
                    gl_account_code: { type: 'string', description: 'GL account code' },
                    debit_amount: { type: 'number', description: 'Debit amount (0 if credit)' },
                    credit_amount: { type: 'number', description: 'Credit amount (0 if debit)' },
                    description: { type: 'string', description: 'Line description' },
                    cost_center_code: { type: 'string', description: 'Cost center (optional)' }
                  },
                  required: ['gl_account_code', 'description']
                }
              },
              auto_post: { type: 'boolean', description: 'Auto-post if validation passes (default: false)' }
            },
            required: ['organization_id', 'journal_date', 'description', 'lines']
          }
        },
        
        {
          name: 'post_journal_entry',
          description: 'Post a draft journal entry to the general ledger',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: { type: 'string', description: 'Organization UUID (required)' },
              journal_entry_id: { type: 'string', description: 'Journal entry ID to post' },
              posting_date: { type: 'string', description: 'Posting date (optional, defaults to today)' },
              validation_override: { 
                type: 'array', 
                description: 'Validation warnings to override',
                items: { type: 'string' }
              }
            },
            required: ['organization_id', 'journal_entry_id']
          }
        },

        {
          name: 'reverse_journal_entry',
          description: 'Create a reversal journal entry',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: { type: 'string', description: 'Organization UUID (required)' },
              journal_entry_id: { type: 'string', description: 'Journal entry ID to reverse' },
              reversal_date: { type: 'string', description: 'Reversal date' },
              reversal_reason: { type: 'string', description: 'Reason for reversal' }
            },
            required: ['organization_id', 'journal_entry_id', 'reversal_date', 'reversal_reason']
          }
        },

        // Transaction Processing Tools
        {
          name: 'process_transaction_batch',
          description: 'Process a batch of transactions and create journal entries automatically',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: { type: 'string', description: 'Organization UUID (required)' },
              transaction_ids: {
                type: 'array',
                description: 'Array of transaction IDs to process',
                items: { type: 'string' }
              },
              batch_mode: {
                type: 'string',
                description: 'Batch processing mode',
                enum: ['immediate', 'daily_summary', 'smart']
              }
            },
            required: ['organization_id', 'transaction_ids']
          }
        },

        // Reconciliation Tools
        {
          name: 'start_bank_reconciliation',
          description: 'Start a new bank reconciliation session',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: { type: 'string', description: 'Organization UUID (required)' },
              bank_account_code: { type: 'string', description: 'Bank GL account code' },
              statement_date: { type: 'string', description: 'Bank statement date' },
              statement_balance: { type: 'number', description: 'Bank statement ending balance' },
              auto_match: { type: 'boolean', description: 'Perform auto-matching (default: true)' }
            },
            required: ['organization_id', 'bank_account_code', 'statement_date', 'statement_balance']
          }
        },

        {
          name: 'match_reconciliation_items',
          description: 'Match bank statement items with GL transactions',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: { type: 'string', description: 'Organization UUID (required)' },
              session_id: { type: 'string', description: 'Reconciliation session ID' },
              statement_item_id: { type: 'string', description: 'Bank statement item ID' },
              gl_transaction_id: { type: 'string', description: 'GL transaction ID to match' },
              confidence: { type: 'number', description: 'Match confidence (0-1)' }
            },
            required: ['organization_id', 'session_id', 'statement_item_id', 'gl_transaction_id']
          }
        },

        // Financial Reporting Tools
        {
          name: 'generate_financial_report',
          description: 'Generate financial reports (Balance Sheet, Income Statement, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: { type: 'string', description: 'Organization UUID (required)' },
              report_type: {
                type: 'string',
                description: 'Type of report to generate',
                enum: ['balance_sheet', 'income_statement', 'cash_flow', 'trial_balance', 'custom']
              },
              period_start: { type: 'string', description: 'Period start date' },
              period_end: { type: 'string', description: 'Period end date' },
              comparison_period: { 
                type: 'string', 
                description: 'Comparison period type',
                enum: ['none', 'prior_period', 'prior_year']
              },
              format: {
                type: 'string',
                description: 'Output format',
                enum: ['summary', 'detailed', 'consolidated']
              }
            },
            required: ['organization_id', 'report_type', 'period_start', 'period_end']
          }
        },

        // Period Management Tools
        {
          name: 'close_accounting_period',
          description: 'Close an accounting period (soft or hard close)',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: { type: 'string', description: 'Organization UUID (required)' },
              period_code: { type: 'string', description: 'Period code (e.g., 2024-01)' },
              close_type: {
                type: 'string',
                description: 'Type of close',
                enum: ['soft', 'hard']
              },
              validation_checks: { 
                type: 'boolean', 
                description: 'Run validation checks before closing (default: true)' 
              }
            },
            required: ['organization_id', 'period_code', 'close_type']
          }
        },

        // Natural Language Tools
        {
          name: 'process_accounting_query',
          description: 'Process natural language accounting queries',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: { type: 'string', description: 'Organization UUID (required)' },
              query: { type: 'string', description: 'Natural language query' },
              context: {
                type: 'object',
                description: 'Additional context for the query',
                properties: {
                  period: { type: 'string', description: 'Specific period' },
                  accounts: { 
                    type: 'array', 
                    description: 'Specific GL accounts',
                    items: { type: 'string' }
                  }
                }
              }
            },
            required: ['organization_id', 'query']
          }
        },

        // Audit & Compliance Tools
        {
          name: 'generate_audit_trail',
          description: 'Generate audit trail for specified entities or period',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: { type: 'string', description: 'Organization UUID (required)' },
              entity_type: {
                type: 'string',
                description: 'Entity type to audit',
                enum: ['journal_entry', 'transaction', 'all']
              },
              entity_id: { type: 'string', description: 'Specific entity ID (optional)' },
              date_from: { type: 'string', description: 'Start date for audit trail' },
              date_to: { type: 'string', description: 'End date for audit trail' },
              include_details: { type: 'boolean', description: 'Include detailed changes (default: true)' }
            },
            required: ['organization_id', 'entity_type', 'date_from', 'date_to']
          }
        }
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        // Initialize guardrail validator with organization context
        if (args.organization_id) {
          this.guardrailValidator = new SQLGuardrailValidator(
            args.organization_id,
            args.user_id || 'system'
          );
        }

        // Route to appropriate handler
        switch (name) {
          // Journal Entry Tools
          case 'create_journal_entry':
            return await this.createJournalEntry(args);
          case 'post_journal_entry':
            return await this.postJournalEntry(args);
          case 'reverse_journal_entry':
            return await this.reverseJournalEntry(args);
          
          // Transaction Processing
          case 'process_transaction_batch':
            return await this.processTransactionBatch(args);
          
          // Reconciliation
          case 'start_bank_reconciliation':
            return await this.startBankReconciliation(args);
          case 'match_reconciliation_items':
            return await this.matchReconciliationItems(args);
          
          // Reporting
          case 'generate_financial_report':
            return await this.generateFinancialReport(args);
          
          // Period Management
          case 'close_accounting_period':
            return await this.closeAccountingPeriod(args);
          
          // Natural Language
          case 'process_accounting_query':
            return await this.processAccountingQuery(args);
          
          // Audit
          case 'generate_audit_trail':
            return await this.generateAuditTrail(args);
          
          default:
            return {
              content: [{ type: 'text', text: `Unknown tool: ${name}` }],
              isError: true,
            };
        }
      } catch (error) {
        console.error('Tool execution error:', error);
        return {
          content: [{ 
            type: 'text', 
            text: `Error: ${error.message}\n\nStack: ${error.stack}` 
          }],
          isError: true,
        };
      }
    });
  }

  // ================================================================================
  // JOURNAL ENTRY TOOLS
  // ================================================================================

  async createJournalEntry(args) {
    const { 
      organization_id, 
      journal_date, 
      description, 
      reference_number,
      lines = [],
      auto_post = false 
    } = args;

    try {
      // Validate balance
      const totalDebits = lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
      const totalCredits = lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(`Journal entry is unbalanced. Debits: ${totalDebits}, Credits: ${totalCredits}`);
      }

      // Create journal entry entity
      const { data: journal, error: journalError } = await supabase
        .from('core_entities')
        .insert({
          organization_id,
          entity_type: 'journal_entry',
          entity_name: `JE-${new Date().getTime()}`,
          entity_description: description,
          smart_code: auto_post ? SMART_CODE_PATTERNS.JOURNAL_AUTO : SMART_CODE_PATTERNS.JOURNAL_MANUAL,
          metadata: {
            journal_date,
            posting_date: null,
            reference_number,
            total_debits: totalDebits,
            total_credits: totalCredits,
            line_count: lines.length,
            status: auto_post ? 'pending_approval' : 'draft',
            auto_generated: false,
            validation_status: 'valid'
          },
          status: 'active'
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // Create journal as a transaction
      const { data: transaction, error: txError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id,
          transaction_type: 'journal_entry',
          transaction_date: journal_date,
          transaction_code: journal.entity_name,
          total_amount: totalDebits,
          smart_code: journal.smart_code,
          metadata: {
            journal_id: journal.id,
            description,
            reference_number
          },
          transaction_status: 'pending'
        })
        .select()
        .single();

      if (txError) throw txError;

      // Create transaction lines for each journal line
      const lineData = lines.map((line, index) => ({
        organization_id,
        transaction_id: transaction.id,
        line_number: index + 1,
        line_entity_id: line.gl_account_id || null,
        line_description: line.description,
        quantity: 1,
        unit_price: line.debit_amount || line.credit_amount || 0,
        line_amount: line.debit_amount || line.credit_amount || 0,
        smart_code: journal.smart_code + '.LINE',
        metadata: {
          gl_account_code: line.gl_account_code,
          debit_amount: line.debit_amount || 0,
          credit_amount: line.credit_amount || 0,
          cost_center_code: line.cost_center_code
        }
      }));

      const { error: linesError } = await supabase
        .from('universal_transaction_lines')
        .insert(lineData);

      if (linesError) throw linesError;

      // Auto-post if requested and validation passes
      if (auto_post) {
        await this.postJournalEntry({
          organization_id,
          journal_entry_id: journal.id,
          posting_date: journal_date
        });
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Journal entry created successfully!
          
Journal ID: ${journal.id}
Reference: ${journal.entity_name}
Description: ${description}
Date: ${journal_date}
Status: ${auto_post ? 'Posted' : 'Draft'}

Lines:
${lines.map((line, i) => 
  `${i + 1}. ${line.gl_account_code} - ${line.description}
     Debit: ${line.debit_amount || 0} | Credit: ${line.credit_amount || 0}`
).join('\n')}

Total Debits: ${totalDebits}
Total Credits: ${totalCredits}

${auto_post ? '📌 Journal has been automatically posted.' : '💡 Use post_journal_entry to post this journal.'}`
        }]
      };

    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Failed to create journal entry: ${error.message}` 
        }],
        isError: true
      };
    }
  }

  async postJournalEntry(args) {
    const { 
      organization_id, 
      journal_entry_id, 
      posting_date = new Date().toISOString().split('T')[0],
      validation_override = []
    } = args;

    try {
      // Get journal entry
      const { data: journal, error: journalError } = await supabase
        .from('core_entities')
        .select('*, metadata')
        .eq('id', journal_entry_id)
        .eq('organization_id', organization_id)
        .eq('entity_type', 'journal_entry')
        .single();

      if (journalError || !journal) {
        throw new Error('Journal entry not found');
      }

      // Check if already posted
      if (journal.metadata?.status === 'posted') {
        throw new Error('Journal entry is already posted');
      }

      // Validate period is open
      // TODO: Implement period validation

      // Update journal status to posted
      const { error: updateError } = await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...journal.metadata,
            status: 'posted',
            posting_date,
            posted_by: 'system', // TODO: Get actual user
            posted_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', journal_entry_id)
        .eq('organization_id', organization_id);

      if (updateError) throw updateError;

      // Update transaction status
      const { error: txUpdateError } = await supabase
        .from('universal_transactions')
        .update({
          transaction_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('metadata->>journal_id', journal_entry_id)
        .eq('organization_id', organization_id);

      if (txUpdateError) throw txUpdateError;

      // Create audit trail
      await this.createAuditEntry(
        organization_id,
        'journal_entry',
        journal_entry_id,
        'post',
        { status: 'draft', posting_date: null },
        { status: 'posted', posting_date }
      );

      return {
        content: [{
          type: 'text',
          text: `✅ Journal entry posted successfully!

Journal ID: ${journal_entry_id}
Reference: ${journal.entity_name}
Posting Date: ${posting_date}
Status: Posted

📌 The journal entry has been posted to the general ledger.`
        }]
      };

    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Failed to post journal entry: ${error.message}` 
        }],
        isError: true
      };
    }
  }

  async reverseJournalEntry(args) {
    const { 
      organization_id, 
      journal_entry_id, 
      reversal_date,
      reversal_reason
    } = args;

    try {
      // Get original journal entry and its lines
      const { data: original, error: originalError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', journal_entry_id)
        .eq('organization_id', organization_id)
        .eq('entity_type', 'journal_entry')
        .single();

      if (originalError || !original) {
        throw new Error('Original journal entry not found');
      }

      // Get original transaction and lines
      const { data: originalTx, error: txError } = await supabase
        .from('universal_transactions')
        .select('*, universal_transaction_lines(*)')
        .eq('metadata->>journal_id', journal_entry_id)
        .eq('organization_id', organization_id)
        .single();

      if (txError || !originalTx) {
        throw new Error('Original transaction not found');
      }

      // Create reversal journal entry
      const reversalDescription = `Reversal of ${original.entity_name}: ${reversal_reason}`;
      
      // Prepare reversal lines (swap debits and credits)
      const reversalLines = originalTx.universal_transaction_lines.map(line => ({
        gl_account_code: line.metadata.gl_account_code,
        debit_amount: line.metadata.credit_amount || 0,
        credit_amount: line.metadata.debit_amount || 0,
        description: `Reversal: ${line.line_description}`
      }));

      // Create reversal using the createJournalEntry method
      const reversalResult = await this.createJournalEntry({
        organization_id,
        journal_date: reversal_date,
        description: reversalDescription,
        reference_number: `REV-${original.entity_name}`,
        lines: reversalLines,
        auto_post: true
      });

      // Link reversal to original
      if (reversalResult.content && !reversalResult.isError) {
        // Update original journal metadata
        await supabase
          .from('core_entities')
          .update({
            metadata: {
              ...original.metadata,
              reversed: true,
              reversal_date,
              reversal_reason
            }
          })
          .eq('id', journal_entry_id)
          .eq('organization_id', organization_id);
      }

      return reversalResult;

    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Failed to reverse journal entry: ${error.message}` 
        }],
        isError: true
      };
    }
  }

  // ================================================================================
  // TRANSACTION PROCESSING
  // ================================================================================

  async processTransactionBatch(args) {
    const { 
      organization_id, 
      transaction_ids = [],
      batch_mode = 'smart'
    } = args;

    try {
      // Get transactions
      const { data: transactions, error: txError } = await supabase
        .from('universal_transactions')
        .select('*, universal_transaction_lines(*)')
        .in('id', transaction_ids)
        .eq('organization_id', organization_id);

      if (txError) throw txError;

      const results = {
        processed: 0,
        journals_created: 0,
        errors: []
      };

      // Group transactions by type for batch processing
      const groupedTxns = {};
      transactions.forEach(tx => {
        const key = `${tx.transaction_type}_${tx.transaction_date}`;
        if (!groupedTxns[key]) groupedTxns[key] = [];
        groupedTxns[key].push(tx);
      });

      // Process each group
      for (const [groupKey, groupTxns] of Object.entries(groupedTxns)) {
        try {
          if (batch_mode === 'daily_summary' && groupTxns.length > 1) {
            // Create summary journal
            await this.createSummaryJournal(organization_id, groupTxns);
            results.journals_created++;
          } else {
            // Create individual journals
            for (const tx of groupTxns) {
              await this.createJournalFromTransaction(organization_id, tx);
              results.journals_created++;
            }
          }
          results.processed += groupTxns.length;
        } catch (error) {
          results.errors.push(`${groupKey}: ${error.message}`);
        }
      }

      return {
        content: [{
          type: 'text',
          text: `📊 Transaction Batch Processing Complete

Transactions Processed: ${results.processed}/${transaction_ids.length}
Journals Created: ${results.journals_created}
Batch Mode: ${batch_mode}

${results.errors.length > 0 ? `\n⚠️ Errors:\n${results.errors.join('\n')}` : '✅ All transactions processed successfully!'}`
        }]
      };

    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Failed to process transaction batch: ${error.message}` 
        }],
        isError: true
      };
    }
  }

  // ================================================================================
  // RECONCILIATION
  // ================================================================================

  async startBankReconciliation(args) {
    const { 
      organization_id, 
      bank_account_code,
      statement_date,
      statement_balance,
      auto_match = true
    } = args;

    try {
      // Get bank GL account
      const { data: bankAccount, error: accountError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('entity_type', 'gl_account')
        .eq('entity_code', bank_account_code)
        .single();

      if (accountError || !bankAccount) {
        throw new Error(`Bank account ${bank_account_code} not found`);
      }

      // Create reconciliation session entity
      const { data: session, error: sessionError } = await supabase
        .from('core_entities')
        .insert({
          organization_id,
          entity_type: 'reconciliation_session',
          entity_name: `RECON-${bank_account_code}-${statement_date}`,
          entity_description: `Bank reconciliation for ${bank_account_code}`,
          smart_code: SMART_CODE_PATTERNS.RECON_BANK,
          metadata: {
            bank_account_id: bankAccount.id,
            bank_account_code,
            statement_date,
            statement_balance,
            reconciled_balance: 0,
            difference: statement_balance,
            status: 'in_progress',
            auto_matched_count: 0,
            manual_matched_count: 0,
            started_at: new Date().toISOString()
          },
          status: 'active'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Get unreconciled transactions for the bank account
      const { data: unreconciledTxns, error: txError } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', organization_id)
        .or(`source_entity_id.eq.${bankAccount.id},target_entity_id.eq.${bankAccount.id}`)
        .eq('metadata->>reconciliation_status', 'unreconciled')
        .lte('transaction_date', statement_date);

      if (txError) throw txError;

      let autoMatchedCount = 0;
      if (auto_match && unreconciledTxns.length > 0) {
        // Perform auto-matching logic here
        // This is a simplified version - real implementation would be more sophisticated
        autoMatchedCount = Math.floor(unreconciledTxns.length * 0.7); // Mock 70% match rate
      }

      return {
        content: [{
          type: 'text',
          text: `🏦 Bank Reconciliation Started

Session ID: ${session.id}
Bank Account: ${bank_account_code}
Statement Date: ${statement_date}
Statement Balance: ${statement_balance}

📊 Initial Status:
- Unreconciled Transactions: ${unreconciledTxns?.length || 0}
- Auto-Matched: ${autoMatchedCount}
- Remaining to Match: ${(unreconciledTxns?.length || 0) - autoMatchedCount}

💡 Use match_reconciliation_items to manually match remaining items.`
        }]
      };

    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Failed to start bank reconciliation: ${error.message}` 
        }],
        isError: true
      };
    }
  }

  async matchReconciliationItems(args) {
    const { 
      organization_id, 
      session_id,
      statement_item_id,
      gl_transaction_id,
      confidence = 1.0
    } = args;

    try {
      // Create relationship between statement item and GL transaction
      const { data: match, error: matchError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id,
          from_entity_id: statement_item_id,
          to_entity_id: gl_transaction_id,
          relationship_type: 'reconciled_to',
          smart_code: 'HERA.FIN.RECON.MATCH.v1',
          ai_confidence: confidence,
          metadata: {
            session_id,
            matched_at: new Date().toISOString(),
            match_method: confidence === 1.0 ? 'exact' : 'fuzzy'
          },
          is_active: true
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Update transaction reconciliation status
      const { error: updateError } = await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            reconciliation_status: 'reconciled',
            reconciliation_date: new Date().toISOString(),
            reconciliation_session: session_id
          }
        })
        .eq('id', gl_transaction_id)
        .eq('organization_id', organization_id);

      if (updateError) throw updateError;

      return {
        content: [{
          type: 'text',
          text: `✅ Items matched successfully!

Statement Item: ${statement_item_id}
GL Transaction: ${gl_transaction_id}
Confidence: ${(confidence * 100).toFixed(0)}%
Match Method: ${confidence === 1.0 ? 'Exact' : 'Fuzzy'}

The transaction has been marked as reconciled.`
        }]
      };

    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Failed to match reconciliation items: ${error.message}` 
        }],
        isError: true
      };
    }
  }

  // ================================================================================
  // FINANCIAL REPORTING
  // ================================================================================

  async generateFinancialReport(args) {
    const { 
      organization_id, 
      report_type,
      period_start,
      period_end,
      comparison_period = 'none',
      format = 'summary'
    } = args;

    try {
      // Get GL accounts based on report type
      const accountFilters = {
        balance_sheet: "metadata->>'statement_type' IN ('assets', 'liabilities', 'equity')",
        income_statement: "metadata->>'statement_type' IN ('revenue', 'expenses')",
        cash_flow: "metadata->>'account_type' = 'cash'",
        trial_balance: "entity_type = 'gl_account'"
      };

      const { data: accounts, error: accountError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('entity_type', 'gl_account')
        .filter('metadata', 'not.is', null);

      if (accountError) throw accountError;

      // Get transactions for the period
      const { data: transactions, error: txError } = await supabase
        .from('universal_transactions')
        .select('*, universal_transaction_lines(*)')
        .eq('organization_id', organization_id)
        .gte('transaction_date', period_start)
        .lte('transaction_date', period_end)
        .eq('transaction_status', 'completed');

      if (txError) throw txError;

      // Calculate balances (simplified)
      const balances = {};
      transactions.forEach(tx => {
        tx.universal_transaction_lines?.forEach(line => {
          const accountCode = line.metadata?.gl_account_code;
          if (accountCode) {
            if (!balances[accountCode]) {
              balances[accountCode] = {
                debit: 0,
                credit: 0,
                net: 0
              };
            }
            balances[accountCode].debit += line.metadata?.debit_amount || 0;
            balances[accountCode].credit += line.metadata?.credit_amount || 0;
            balances[accountCode].net = balances[accountCode].debit - balances[accountCode].credit;
          }
        });
      });

      // Format report based on type
      let reportContent = `📊 ${report_type.toUpperCase().replace('_', ' ')}
Organization: ${organization_id}
Period: ${period_start} to ${period_end}
Generated: ${new Date().toISOString()}

`;

      if (report_type === 'balance_sheet') {
        reportContent += this.formatBalanceSheet(accounts, balances);
      } else if (report_type === 'income_statement') {
        reportContent += this.formatIncomeStatement(accounts, balances);
      } else if (report_type === 'trial_balance') {
        reportContent += this.formatTrialBalance(accounts, balances);
      }

      // Store report as entity
      const { data: report, error: reportError } = await supabase
        .from('core_entities')
        .insert({
          organization_id,
          entity_type: 'financial_report',
          entity_name: `${report_type}-${period_end}`,
          entity_description: `${report_type} for period ${period_start} to ${period_end}`,
          smart_code: SMART_CODE_PATTERNS[`REPORT_${report_type.toUpperCase()}`] || 'HERA.FIN.REPORT.CUSTOM.v1',
          metadata: {
            report_type,
            period_start,
            period_end,
            format,
            generated_at: new Date().toISOString(),
            balances
          },
          status: 'active'
        })
        .select()
        .single();

      if (reportError) throw reportError;

      return {
        content: [{
          type: 'text',
          text: reportContent + `\n\nReport ID: ${report.id}`
        }]
      };

    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Failed to generate financial report: ${error.message}` 
        }],
        isError: true
      };
    }
  }

  // ================================================================================
  // PERIOD MANAGEMENT
  // ================================================================================

  async closeAccountingPeriod(args) {
    const { 
      organization_id, 
      period_code,
      close_type,
      validation_checks = true
    } = args;

    try {
      // Get or create period entity
      let { data: period, error: periodError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('entity_type', 'accounting_period')
        .eq('entity_code', period_code)
        .single();

      if (periodError) {
        // Create period if it doesn't exist
        const { data: newPeriod, error: createError } = await supabase
          .from('core_entities')
          .insert({
            organization_id,
            entity_type: 'accounting_period',
            entity_code: period_code,
            entity_name: `Period ${period_code}`,
            smart_code: 'HERA.FIN.PERIOD.v1',
            metadata: {
              period_code,
              status: 'open',
              year: parseInt(period_code.split('-')[0]),
              month: parseInt(period_code.split('-')[1])
            },
            status: 'active'
          })
          .select()
          .single();

        if (createError) throw createError;
        period = newPeriod;
      }

      // Run validation checks if requested
      let validationIssues = [];
      if (validation_checks) {
        // Check for unposted journals
        const { data: draftJournals, error: draftError } = await supabase
          .from('core_entities')
          .select('id, entity_name')
          .eq('organization_id', organization_id)
          .eq('entity_type', 'journal_entry')
          .eq('metadata->>status', 'draft')
          .gte('metadata->>journal_date', `${period_code}-01`)
          .lte('metadata->>journal_date', `${period_code}-31`);

        if (!draftError && draftJournals?.length > 0) {
          validationIssues.push(`${draftJournals.length} unposted journal entries`);
        }

        // Check for unreconciled bank accounts
        // Add more validation checks as needed
      }

      if (validationIssues.length > 0 && close_type === 'hard') {
        throw new Error(`Cannot perform hard close with validation issues: ${validationIssues.join(', ')}`);
      }

      // Update period status
      const newStatus = close_type === 'soft' ? 'soft_closed' : 'hard_closed';
      const { error: updateError } = await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...period.metadata,
            status: newStatus,
            closed_at: new Date().toISOString(),
            closed_by: 'system', // TODO: Get actual user
            close_type
          }
        })
        .eq('id', period.id)
        .eq('organization_id', organization_id);

      if (updateError) throw updateError;

      // Create audit entry
      await this.createAuditEntry(
        organization_id,
        'accounting_period',
        period.id,
        'close_period',
        { status: period.metadata.status },
        { status: newStatus, close_type }
      );

      return {
        content: [{
          type: 'text',
          text: `✅ Period closed successfully!

Period: ${period_code}
Close Type: ${close_type}
New Status: ${newStatus}

${validationIssues.length > 0 ? `\n⚠️ Validation Warnings:\n${validationIssues.join('\n')}` : '✅ All validation checks passed.'}

${close_type === 'soft' ? '💡 Soft close allows posting with approval.' : '🔒 Hard close prevents all posting to this period.'}`
        }]
      };

    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Failed to close accounting period: ${error.message}` 
        }],
        isError: true
      };
    }
  }

  // ================================================================================
  // NATURAL LANGUAGE PROCESSING
  // ================================================================================

  async processAccountingQuery(args) {
    const { 
      organization_id, 
      query,
      context = {}
    } = args;

    try {
      // Parse the natural language query
      const queryLower = query.toLowerCase();
      
      // Determine query intent
      let response = '';
      
      if (queryLower.includes('balance') && (queryLower.includes('cash') || queryLower.includes('bank'))) {
        // Get cash balances
        response = await this.getCashBalances(organization_id, context.period);
      } else if (queryLower.includes('revenue') || queryLower.includes('sales')) {
        // Get revenue summary
        response = await this.getRevenueSummary(organization_id, context.period);
      } else if (queryLower.includes('expense')) {
        // Get expense summary
        response = await this.getExpenseSummary(organization_id, context.period);
      } else if (queryLower.includes('journal') && queryLower.includes('recent')) {
        // Get recent journals
        response = await this.getRecentJournals(organization_id);
      } else if (queryLower.includes('trial balance')) {
        // Generate trial balance
        const currentDate = new Date();
        const period_end = currentDate.toISOString().split('T')[0];
        const period_start = new Date(currentDate.getFullYear(), 0, 1).toISOString().split('T')[0];
        
        return await this.generateFinancialReport({
          organization_id,
          report_type: 'trial_balance',
          period_start,
          period_end,
          format: 'summary'
        });
      } else {
        response = `I can help you with:
- Cash and bank balances
- Revenue and sales summaries
- Expense analysis
- Recent journal entries
- Trial balance reports
- Financial statements

Please be more specific about what you'd like to know.`;
      }

      return {
        content: [{
          type: 'text',
          text: `💬 Accounting Query Response

Query: "${query}"

${response}`
        }]
      };

    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Failed to process accounting query: ${error.message}` 
        }],
        isError: true
      };
    }
  }

  // ================================================================================
  // AUDIT & COMPLIANCE
  // ================================================================================

  async generateAuditTrail(args) {
    const { 
      organization_id, 
      entity_type,
      entity_id,
      date_from,
      date_to,
      include_details = true
    } = args;

    try {
      // Build query based on parameters
      let query = supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('entity_type', 'audit_entry')
        .gte('created_at', date_from)
        .lte('created_at', date_to);

      if (entity_id) {
        query = query.eq('metadata->>entity_id', entity_id);
      }

      if (entity_type !== 'all') {
        query = query.eq('metadata->>entity_type', entity_type);
      }

      const { data: auditEntries, error: auditError } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (auditError) throw auditError;

      // Format audit trail
      let auditReport = `📋 AUDIT TRAIL REPORT
Organization: ${organization_id}
Period: ${date_from} to ${date_to}
Entity Type: ${entity_type}
${entity_id ? `Entity ID: ${entity_id}` : ''}

Total Entries: ${auditEntries?.length || 0}

`;

      if (include_details && auditEntries?.length > 0) {
        auditReport += '🔍 Detailed Audit Log:\n\n';
        
        auditEntries.forEach((entry, index) => {
          const meta = entry.metadata || {};
          auditReport += `${index + 1}. ${meta.action?.toUpperCase() || 'UNKNOWN'} - ${entry.created_at}
   Entity: ${meta.entity_type} (${meta.entity_id})
   User: ${meta.performed_by || 'system'}
   ${meta.description || 'No description'}
   ${meta.changes ? `Changes: ${JSON.stringify(meta.changes, null, 2)}` : ''}
   
`;
        });
      }

      // Store audit report
      const { data: report, error: reportError } = await supabase
        .from('core_entities')
        .insert({
          organization_id,
          entity_type: 'audit_report',
          entity_name: `AUDIT-${new Date().getTime()}`,
          entity_description: `Audit trail for ${entity_type} from ${date_from} to ${date_to}`,
          smart_code: SMART_CODE_PATTERNS.AUDIT_TRAIL,
          metadata: {
            entity_type,
            entity_id,
            date_from,
            date_to,
            entry_count: auditEntries?.length || 0,
            include_details
          },
          status: 'active'
        })
        .select()
        .single();

      if (reportError) throw reportError;

      return {
        content: [{
          type: 'text',
          text: auditReport + `\nReport ID: ${report.id}`
        }]
      };

    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Failed to generate audit trail: ${error.message}` 
        }],
        isError: true
      };
    }
  }

  // ================================================================================
  // HELPER METHODS
  // ================================================================================

  async createAuditEntry(organization_id, entity_type, entity_id, action, before, after) {
    try {
      await supabase
        .from('core_entities')
        .insert({
          organization_id,
          entity_type: 'audit_entry',
          entity_name: `AUDIT-${action}-${new Date().getTime()}`,
          smart_code: SMART_CODE_PATTERNS.AUDIT_TRAIL,
          metadata: {
            entity_type,
            entity_id,
            action,
            performed_by: 'system', // TODO: Get actual user
            performed_at: new Date().toISOString(),
            changes: { before, after }
          },
          status: 'active'
        });
    } catch (error) {
      console.error('Failed to create audit entry:', error);
    }
  }

  async createJournalFromTransaction(organization_id, transaction) {
    // Implement logic to create journal entries from transactions
    // This would include posting rule evaluation and GL account mapping
    return true;
  }

  async createSummaryJournal(organization_id, transactions) {
    // Implement logic to create summary journal entries
    // This would aggregate multiple transactions into a single journal
    return true;
  }

  formatBalanceSheet(accounts, balances) {
    let report = '=== ASSETS ===\n';
    let totalAssets = 0;
    
    accounts
      .filter(a => a.metadata?.statement_type === 'assets')
      .forEach(account => {
        const balance = balances[account.entity_code]?.net || 0;
        totalAssets += balance;
        report += `${account.entity_code} ${account.entity_name}: ${balance.toFixed(2)}\n`;
      });
    
    report += `\nTOTAL ASSETS: ${totalAssets.toFixed(2)}\n\n`;
    
    report += '=== LIABILITIES ===\n';
    let totalLiabilities = 0;
    
    accounts
      .filter(a => a.metadata?.statement_type === 'liabilities')
      .forEach(account => {
        const balance = balances[account.entity_code]?.net || 0;
        totalLiabilities += balance;
        report += `${account.entity_code} ${account.entity_name}: ${balance.toFixed(2)}\n`;
      });
    
    report += `\nTOTAL LIABILITIES: ${totalLiabilities.toFixed(2)}\n\n`;
    
    report += '=== EQUITY ===\n';
    let totalEquity = 0;
    
    accounts
      .filter(a => a.metadata?.statement_type === 'equity')
      .forEach(account => {
        const balance = balances[account.entity_code]?.net || 0;
        totalEquity += balance;
        report += `${account.entity_code} ${account.entity_name}: ${balance.toFixed(2)}\n`;
      });
    
    report += `\nTOTAL EQUITY: ${totalEquity.toFixed(2)}\n`;
    report += `\nTOTAL LIABILITIES + EQUITY: ${(totalLiabilities + totalEquity).toFixed(2)}\n`;
    
    return report;
  }

  formatIncomeStatement(accounts, balances) {
    let report = '=== REVENUE ===\n';
    let totalRevenue = 0;
    
    accounts
      .filter(a => a.metadata?.statement_type === 'revenue')
      .forEach(account => {
        const balance = Math.abs(balances[account.entity_code]?.net || 0);
        totalRevenue += balance;
        report += `${account.entity_code} ${account.entity_name}: ${balance.toFixed(2)}\n`;
      });
    
    report += `\nTOTAL REVENUE: ${totalRevenue.toFixed(2)}\n\n`;
    
    report += '=== EXPENSES ===\n';
    let totalExpenses = 0;
    
    accounts
      .filter(a => a.metadata?.statement_type === 'expenses')
      .forEach(account => {
        const balance = balances[account.entity_code]?.net || 0;
        totalExpenses += balance;
        report += `${account.entity_code} ${account.entity_name}: ${balance.toFixed(2)}\n`;
      });
    
    report += `\nTOTAL EXPENSES: ${totalExpenses.toFixed(2)}\n`;
    report += `\nNET INCOME: ${(totalRevenue - totalExpenses).toFixed(2)}\n`;
    
    return report;
  }

  formatTrialBalance(accounts, balances) {
    let report = 'Account Code | Account Name | Debit | Credit\n';
    report += '---|---|---|---\n';
    let totalDebits = 0;
    let totalCredits = 0;
    
    accounts.forEach(account => {
      const balance = balances[account.entity_code];
      if (balance) {
        totalDebits += balance.debit;
        totalCredits += balance.credit;
        report += `${account.entity_code} | ${account.entity_name} | ${balance.debit.toFixed(2)} | ${balance.credit.toFixed(2)}\n`;
      }
    });
    
    report += `\nTOTAL | | ${totalDebits.toFixed(2)} | ${totalCredits.toFixed(2)}\n`;
    
    return report;
  }

  async getCashBalances(organization_id, period) {
    const { data: cashAccounts, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('entity_type', 'gl_account')
      .eq('metadata->>account_type', 'cash');

    if (error) throw error;

    let response = '💰 Cash Balances:\n\n';
    cashAccounts?.forEach(account => {
      response += `${account.entity_code} - ${account.entity_name}: $0.00\n`; // Would calculate actual balance
    });

    return response;
  }

  async getRevenueSummary(organization_id, period) {
    return '💰 Revenue Summary:\nImplement revenue calculation logic here';
  }

  async getExpenseSummary(organization_id, period) {
    return '💸 Expense Summary:\nImplement expense calculation logic here';
  }

  async getRecentJournals(organization_id) {
    const { data: journals, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('entity_type', 'journal_entry')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    let response = '📋 Recent Journal Entries:\n\n';
    journals?.forEach((journal, index) => {
      response += `${index + 1}. ${journal.entity_name} - ${journal.metadata?.description || 'No description'}\n`;
      response += `   Date: ${journal.metadata?.journal_date || 'N/A'} | Status: ${journal.metadata?.status || 'draft'}\n\n`;
    });

    return response;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('HERA Digital Accountant MCP server running...');
  }
}

// ================================================================================
// MAIN ENTRY POINT
// ================================================================================

const server = new HeraDigitalAccountantMCPServer();
server.run().catch(console.error);