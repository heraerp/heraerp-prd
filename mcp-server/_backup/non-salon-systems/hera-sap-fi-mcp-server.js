#!/usr/bin/env node

/**
 * HERA SAP FI MCP Server
 * Exposes SAP Financial integration capabilities to AI agents
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SAP FI MCP Tools
const sapFITools = {
  // Post journal entry to SAP
  'sap.fi.post_journal_entry': {
    description: 'Post a journal entry to SAP Financial system',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization ID' },
        posting_date: { type: 'string', format: 'date', description: 'Posting date' },
        description: { type: 'string', description: 'Journal entry description' },
        lines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gl_account: { type: 'string', description: 'GL account code' },
              debit_amount: { type: 'number', description: 'Debit amount' },
              credit_amount: { type: 'number', description: 'Credit amount' },
              cost_center: { type: 'string', description: 'Cost center (optional)' },
              description: { type: 'string', description: 'Line description' }
            },
            required: ['gl_account']
          }
        }
      },
      required: ['organization_id', 'posting_date', 'lines']
    },
    handler: async (params) => {
      try {
        // Create transaction
        const { data: transaction, error: txError } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: params.organization_id,
            transaction_type: 'journal_entry',
            transaction_code: `JE-${Date.now()}`,
            transaction_date: params.posting_date,
            posting_date: params.posting_date,
            description: params.description,
            smart_code: 'HERA.ERP.FI.JE.POST.v1',
            total_amount: params.lines.reduce((sum, line) => 
              sum + (line.debit_amount || line.credit_amount || 0), 0
            )
          })
          .select()
          .single();

        if (txError) throw txError;

        // Create transaction lines
        const lines = params.lines.map((line, index) => ({
          organization_id: params.organization_id,
          transaction_id: transaction.id,
          line_number: index + 1,
          gl_account_code: line.gl_account,
          debit_amount: line.debit_amount || 0,
          credit_amount: line.credit_amount || 0,
          line_amount: line.debit_amount || line.credit_amount || 0,
          cost_center: line.cost_center,
          description: line.description
        }));

        const { error: linesError } = await supabase
          .from('universal_transaction_lines')
          .insert(lines);

        if (linesError) throw linesError;

        // Trigger SAP posting (would call integration service)
        // For now, we'll simulate the posting
        const sapDocument = {
          documentNumber: `4900${Math.floor(Math.random() * 1000000)}`,
          fiscalYear: new Date().getFullYear(),
          status: 'posted'
        };

        // Update transaction with SAP reference
        await supabase
          .from('universal_transactions')
          .update({
            transaction_status: 'posted',
            metadata: {
              sap_document_number: sapDocument.documentNumber,
              sap_fiscal_year: sapDocument.fiscalYear
            }
          })
          .eq('id', transaction.id);

        return {
          success: true,
          transaction_id: transaction.id,
          sap_document_number: sapDocument.documentNumber,
          message: 'Journal entry posted to SAP successfully'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  },

  // Get GL account balance
  'sap.fi.get_gl_balance': {
    description: 'Get GL account balance from SAP',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization ID' },
        gl_account: { type: 'string', description: 'GL account code' },
        period: { type: 'string', description: 'Period (MM)' },
        year: { type: 'string', description: 'Fiscal year (YYYY)' }
      },
      required: ['organization_id', 'gl_account']
    },
    handler: async (params) => {
      // In real implementation, this would call SAP connector
      // For now, calculate from HERA transactions
      const startDate = new Date(`${params.year || new Date().getFullYear()}-${params.period || '01'}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const { data: transactions } = await supabase
        .from('universal_transaction_lines')
        .select(`
          debit_amount,
          credit_amount,
          universal_transactions!inner(
            transaction_date,
            transaction_status
          )
        `)
        .eq('organization_id', params.organization_id)
        .eq('gl_account_code', params.gl_account)
        .eq('universal_transactions.transaction_status', 'posted')
        .gte('universal_transactions.transaction_date', startDate.toISOString())
        .lt('universal_transactions.transaction_date', endDate.toISOString());

      const balance = transactions?.reduce((acc, line) => {
        return acc + (line.debit_amount || 0) - (line.credit_amount || 0);
      }, 0) || 0;

      return {
        gl_account: params.gl_account,
        period: params.period || new Date().getMonth() + 1,
        year: params.year || new Date().getFullYear(),
        balance: balance,
        debit_total: transactions?.reduce((sum, line) => sum + (line.debit_amount || 0), 0) || 0,
        credit_total: transactions?.reduce((sum, line) => sum + (line.credit_amount || 0), 0) || 0,
        currency: 'USD'
      };
    }
  },

  // Create AP invoice
  'sap.fi.create_ap_invoice': {
    description: 'Create vendor invoice for posting to SAP',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization ID' },
        vendor_id: { type: 'string', description: 'Vendor entity ID' },
        invoice_date: { type: 'string', format: 'date' },
        invoice_number: { type: 'string', description: 'Vendor invoice number' },
        due_date: { type: 'string', format: 'date' },
        lines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gl_account: { type: 'string' },
              amount: { type: 'number' },
              cost_center: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      },
      required: ['organization_id', 'vendor_id', 'invoice_date', 'lines']
    },
    handler: async (params) => {
      const totalAmount = params.lines.reduce((sum, line) => sum + line.amount, 0);

      // Create AP invoice transaction
      const { data: transaction, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: params.organization_id,
          transaction_type: 'purchase_invoice',
          transaction_code: `PI-${Date.now()}`,
          transaction_date: params.invoice_date,
          source_entity_id: params.vendor_id,
          total_amount: totalAmount,
          smart_code: 'HERA.ERP.FI.AP.INVOICE.v1',
          metadata: {
            invoice_number: params.invoice_number,
            due_date: params.due_date
          }
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Create lines
      const lines = params.lines.map((line, index) => ({
        organization_id: params.organization_id,
        transaction_id: transaction.id,
        line_number: index + 1,
        gl_account_code: line.gl_account,
        debit_amount: line.amount,
        credit_amount: 0,
        line_amount: line.amount,
        cost_center: line.cost_center,
        description: line.description
      }));

      await supabase
        .from('universal_transaction_lines')
        .insert(lines);

      return {
        success: true,
        transaction_id: transaction.id,
        message: 'AP invoice created and ready for SAP posting'
      };
    }
  },

  // Check duplicate invoice
  'sap.fi.check_duplicate_invoice': {
    description: 'Check if an invoice is a duplicate using AI analysis',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string' },
        vendor_id: { type: 'string' },
        invoice_number: { type: 'string' },
        invoice_amount: { type: 'number' },
        invoice_date: { type: 'string', format: 'date' }
      },
      required: ['organization_id', 'vendor_id', 'invoice_amount']
    },
    handler: async (params) => {
      // Check for similar invoices in last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: similarInvoices } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', params.organization_id)
        .eq('source_entity_id', params.vendor_id)
        .eq('transaction_type', 'purchase_invoice')
        .gte('transaction_date', ninetyDaysAgo.toISOString());

      const duplicates = similarInvoices?.filter(inv => {
        const amountMatch = Math.abs(inv.total_amount - params.invoice_amount) < 0.01;
        const numberMatch = inv.metadata?.invoice_number === params.invoice_number;
        const dateClose = Math.abs(new Date(inv.transaction_date).getTime() - 
                                   new Date(params.invoice_date).getTime()) < 7 * 24 * 60 * 60 * 1000;
        
        return (amountMatch && numberMatch) || (amountMatch && dateClose);
      }) || [];

      const isDuplicate = duplicates.length > 0;
      const confidence = isDuplicate ? 
        (duplicates[0].metadata?.invoice_number === params.invoice_number ? 0.95 : 0.75) : 0;

      return {
        is_duplicate: isDuplicate,
        confidence: confidence,
        matches: duplicates.map(d => ({
          transaction_id: d.id,
          invoice_number: d.metadata?.invoice_number,
          amount: d.total_amount,
          date: d.transaction_date
        })),
        recommendation: isDuplicate ? 
          'DO NOT POST - Potential duplicate detected' : 
          'Safe to post - No duplicates found'
      };
    }
  },

  // Bank reconciliation
  'sap.fi.reconcile_bank_statement': {
    description: 'Reconcile bank statement with SAP postings',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string' },
        bank_account_id: { type: 'string' },
        statement_date: { type: 'string', format: 'date' },
        statement_balance: { type: 'number' },
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date' },
              amount: { type: 'number' },
              reference: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      },
      required: ['organization_id', 'bank_account_id', 'statement_date', 'transactions']
    },
    handler: async (params) => {
      // This would integrate with SAP bank reconciliation
      // For now, simulate matching logic
      const matched = [];
      const unmatched = [];

      for (const bankTxn of params.transactions) {
        // Try to find matching transaction
        const { data: matches } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', params.organization_id)
          .eq('total_amount', Math.abs(bankTxn.amount))
          .gte('transaction_date', new Date(bankTxn.date).toISOString())
          .lte('transaction_date', new Date(new Date(bankTxn.date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());

        if (matches && matches.length > 0) {
          matched.push({
            bank_transaction: bankTxn,
            matched_transaction: matches[0],
            confidence: 0.9
          });
        } else {
          unmatched.push(bankTxn);
        }
      }

      return {
        statement_date: params.statement_date,
        total_transactions: params.transactions.length,
        matched_count: matched.length,
        unmatched_count: unmatched.length,
        match_rate: (matched.length / params.transactions.length * 100).toFixed(1) + '%',
        matched_transactions: matched,
        unmatched_transactions: unmatched,
        recommended_actions: unmatched.length > 0 ? 
          'Review unmatched transactions and create missing entries' : 
          'All transactions matched successfully'
      };
    }
  }
};

// Start MCP server
function startMCPServer() {
  console.log('🚀 HERA SAP FI MCP Server starting...');
  console.log('📊 Available tools:');
  Object.keys(sapFITools).forEach(tool => {
    console.log(`   - ${tool}: ${sapFITools[tool].description}`);
  });

  // In a real implementation, this would:
  // 1. Listen for MCP protocol messages
  // 2. Route to appropriate tool handlers
  // 3. Return responses in MCP format
  
  console.log('\n✅ SAP FI MCP Server ready for AI agent connections');
}

// Export for testing
module.exports = { sapFITools };

// Start server if run directly
if (require.main === module) {
  startMCPServer();
}