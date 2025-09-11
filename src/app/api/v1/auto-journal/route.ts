// ================================================================================
// HERA AUTO-JOURNAL API ENDPOINT
// RESTful API for intelligent journal entry automation
// Smart Code: HERA.FIN.GL.AUTO.JOURNAL.API.v1
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  processTransactionForJournal, 
  runBatchProcessing, 
  checkJournalRelevance, 
  generateJournalEntry 
} from '@/lib/auto-journal-engine';
import { supabase } from '@/lib/supabase';

// ================================================================================
// POST ENDPOINT - Process Transaction for Auto-Journal
// ================================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, transaction_id, organization_id, transaction_data } = body;

    switch (action) {
      
      // ============================================================================
      // PROCESS TRANSACTION FOR JOURNAL CREATION
      // ============================================================================
      case 'process_transaction':
        if (!transaction_id || !organization_id) {
          return NextResponse.json({
            success: false,
            error: 'transaction_id and organization_id are required'
          }, { status: 400 });
        }

        const result = await processTransactionForJournal(transaction_id, organization_id);
        
        return NextResponse.json({
          success: true,
          data: result,
          message: 'Transaction processed for auto-journal creation'
        });

      // ============================================================================
      // RUN BATCH PROCESSING FOR ORGANIZATION
      // ============================================================================
      case 'run_batch_processing':
        if (!organization_id) {
          return NextResponse.json({
            success: false,
            error: 'organization_id is required'
          }, { status: 400 });
        }

        const batchResult = await runBatchProcessing(organization_id);
        
        return NextResponse.json({
          success: true,
          data: batchResult,
          message: 'Batch processing completed successfully'
        });

      // ============================================================================
      // CHECK JOURNAL RELEVANCE FOR TRANSACTION
      // ============================================================================
      case 'check_relevance':
        if (!transaction_data) {
          return NextResponse.json({
            success: false,
            error: 'transaction_data is required'
          }, { status: 400 });
        }

        const relevanceResult = await checkJournalRelevance(transaction_data);
        
        return NextResponse.json({
          success: true,
          data: relevanceResult,
          message: 'Journal relevance check completed'
        });

      // ============================================================================
      // GENERATE JOURNAL ENTRY FOR TRANSACTION
      // ============================================================================
      case 'generate_journal':
        if (!transaction_data) {
          return NextResponse.json({
            success: false,
            error: 'transaction_data is required'
          }, { status: 400 });
        }

        const journalResult = await generateJournalEntry(transaction_data);
        
        return NextResponse.json({
          success: true,
          data: journalResult,
          message: 'Journal entry generated successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: process_transaction, run_batch_processing, check_relevance, generate_journal'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Auto-journal API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      details: error.stack
    }, { status: 500 });
  }
}

// ================================================================================
// GET ENDPOINT - Query Auto-Journal Status and History
// ================================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const organizationId = searchParams.get('organization_id');
    const transactionId = searchParams.get('transaction_id');
    const days = parseInt(searchParams.get('days') || '7');

    switch (action) {
      
      // ============================================================================
      // GET JOURNAL PROCESSING HISTORY
      // ============================================================================
      case 'history':
        if (!organizationId) {
          return NextResponse.json({
            success: false,
            error: 'organization_id is required'
          }, { status: 400 });
        }

        const historyResult = await getJournalProcessingHistory(organizationId, days);
        
        return NextResponse.json({
          success: true,
          data: historyResult,
          message: 'Journal processing history retrieved'
        });

      // ============================================================================
      // GET AUTO-JOURNAL STATISTICS
      // ============================================================================
      case 'statistics':
        if (!organizationId) {
          return NextResponse.json({
            success: false,
            error: 'organization_id is required'
          }, { status: 400 });
        }

        const statsResult = await getAutoJournalStatistics(organizationId, days);
        
        return NextResponse.json({
          success: true,
          data: statsResult,
          message: 'Auto-journal statistics retrieved'
        });

      // ============================================================================
      // GET PENDING BATCH TRANSACTIONS
      // ============================================================================
      case 'pending_batch':
        if (!organizationId) {
          return NextResponse.json({
            success: false,
            error: 'organization_id is required'
          }, { status: 400 });
        }

        const pendingResult = await getPendingBatchTransactions(organizationId);
        
        return NextResponse.json({
          success: true,
          data: pendingResult,
          message: 'Pending batch transactions retrieved'
        });

      // ============================================================================
      // GET TRANSACTION JOURNAL STATUS
      // ============================================================================
      case 'transaction_status':
        if (!transactionId) {
          return NextResponse.json({
            success: false,
            error: 'transaction_id is required'
          }, { status: 400 });
        }

        const statusResult = await getTransactionJournalStatus(transactionId);
        
        return NextResponse.json({
          success: true,
          data: statusResult,
          message: 'Transaction journal status retrieved'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: history, statistics, pending_batch, transaction_status'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Auto-journal API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

async function getJournalProcessingHistory(organizationId: string, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('core_dynamic_data')
    .select(`
      *,
      entity:core_entities!entity_id(entity_name, entity_code)
    `)
    .eq('organization_id', 'system')
    .in('field_name', ['journal_processing_result', 'journal_processing_error'])
    .gte('created_at', startDate)
    .order('created_at', { ascending: false });

  return data || [];
}

async function getAutoJournalStatistics(organizationId: string, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  // Get all auto-generated journal entries
  const { data: autoJournals } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'journal_entry')
    .eq('metadata->auto_generated', true)
    .gte('transaction_date', startDate);

  // Get processing results
  const { data: processingResults } = await supabase
    .from('core_dynamic_data')
    .select('field_value_json')
    .eq('field_name', 'journal_processing_result')
    .gte('created_at', startDate);

  const totalJournals = autoJournals?.length || 0;
  const totalProcessed = processingResults?.length || 0;
  const batchJournals = autoJournals?.filter(j => (j.metadata as any)?.batch_journal)?.length || 0;
  const immediateJournals = totalJournals - batchJournals;
  
  const processingModes = processingResults?.reduce((acc, result) => {
    const mode = (result.field_value_json as any)?.processing_mode;
    if (mode) {
      acc[mode as string] = (acc[mode as string] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  return {
    period_days: days,
    total_journals_created: totalJournals,
    total_transactions_processed: totalProcessed,
    immediate_journals: immediateJournals,
    batch_journals: batchJournals,
    processing_modes: processingModes,
    automation_rate: totalProcessed > 0 ? (totalJournals / totalProcessed * 100).toFixed(1) : '0.0'
  };
}

async function getPendingBatchTransactions(organizationId: string) {
  const { data } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      lines:universal_transaction_lines(*)
    `)
    .eq('organization_id', organizationId)
    .lte('total_amount', 100) // Small transactions
    .eq('status', 'completed')
    .is('metadata->batch_journal_id', null) // Not already batched
    .gte('transaction_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    .order('transaction_date');

  // Group by transaction type
  const grouped = (data || []).reduce((acc, txn) => {
    const type = txn.transaction_type as string;
    if (!acc[type]) {
      acc[type] = {
        transaction_type: type,
        count: 0,
        total_amount: 0,
        transactions: []
      };
    }
    acc[type].count++;
    acc[type].total_amount += txn.total_amount;
    acc[type].transactions.push(txn);
    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped);
}

async function getTransactionJournalStatus(transactionId: string) {
  // Get the transaction
  const { data: transaction } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  // Check if journal was created
  const { data: journalEntry } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'journal_entry')
    .eq('metadata->source_transaction_id', transactionId)
    .single();

  // Get processing log
  const { data: processingLog } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('entity_id', transactionId)
    .in('field_name', ['journal_processing_result', 'journal_processing_error'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    transaction,
    journal_entry: journalEntry,
    processing_log: processingLog,
    status: journalEntry ? 'journal_created' : 
            (transaction.metadata as any)?.batch_journal_id ? 'batched' :
            processingLog?.field_name === 'journal_processing_error' ? 'error' :
            'pending'
  };
}

// ================================================================================
// WEBHOOK HANDLER FOR SUPABASE TRIGGERS
// ================================================================================

// Helper function for webhook processing
async function handleTransactionWebhook(payload: any) {
  try {
    const { type, table, record, old_record } = payload;
    
    // Only process INSERT and UPDATE events on universal_transactions
    if (table !== 'universal_transactions' || type === 'DELETE') {
      return { success: true, message: 'Event ignored' };
    }

    // Only process completed transactions
    if (record.status !== 'completed') {
      return { success: true, message: 'Transaction not completed yet' };
    }

    // Avoid processing journal entries themselves
    if (record.transaction_type === 'journal_entry') {
      return { success: true, message: 'Journal entry ignored' };
    }

    // Process for auto-journal creation
    const result = await processTransactionForJournal(record.id, record.organization_id);
    
    return {
      success: true,
      data: result,
      message: 'Transaction processed for auto-journal'
    };

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}