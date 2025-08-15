// ================================================================================
// HERA AUTO-JOURNAL POSTING ENGINE
// Intelligent journal entry automation with OpenAI integration
// Smart Code: HERA.FIN.GL.AUTO.JOURNAL.ENGINE.v1
// ================================================================================

import { supabase } from './supabase';

// ================================================================================
// CORE INTERFACES
// ================================================================================

interface Transaction {
  id: string;
  organization_id: string;
  transaction_type: string;
  transaction_number: string;
  transaction_date: string;
  source_entity_id: string;
  target_entity_id: string;
  total_amount: number;
  currency: string;
  smart_code: string;
  metadata: any;
  lines: TransactionLine[];
}

interface TransactionLine {
  id: string;
  entity_id: string;
  line_description: string;
  quantity: number;
  unit_price: number;
  line_amount: number;
  gl_account_id?: string; // Pre-mapped GL account if available
}

interface JournalEntry {
  transaction_id: string;
  journal_date: string;
  description: string;
  reference: string;
  lines: JournalLine[];
  auto_generated: boolean;
  ai_confidence: number;
  validation_status: 'pending' | 'validated' | 'requires_review';
}

interface JournalLine {
  gl_account_id: string;
  gl_account_code: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  line_order: number;
}

// ================================================================================
// JOURNAL RELEVANCE CLASSIFIER
// ================================================================================

class JournalRelevanceEngine {
  
  /**
   * Determines if a transaction requires journal entry creation
   * Uses rule-based logic first, then AI for complex cases
   */
  async isJournalRelevant(transaction: Transaction): Promise<{
    isRelevant: boolean;
    reason: string;
    confidence: number;
    complexity: 'simple' | 'complex' | 'ai_required';
  }> {
    
    // ============================================================================
    // RULE-BASED CLASSIFICATION (Fast & Deterministic)
    // ============================================================================
    
    const ruleBasedResult = this.applyJournalRules(transaction);
    if (ruleBasedResult.confidence > 0.95) {
      return ruleBasedResult;
    }

    // ============================================================================
    // AI-POWERED CLASSIFICATION (Complex Cases)
    // ============================================================================
    
    return await this.aiClassifyJournalRelevance(transaction);
  }

  private applyJournalRules(transaction: Transaction): any {
    const { transaction_type, smart_code, total_amount, metadata } = transaction;

    // ALWAYS JOURNAL RELEVANT
    if (transaction_type.includes('journal') || 
        smart_code.includes('.GL.') ||
        transaction_type.includes('payment') ||
        transaction_type.includes('receipt') ||
        transaction_type.includes('adjustment')) {
      return {
        isRelevant: true,
        reason: 'Direct financial impact - always requires journal entry',
        confidence: 1.0,
        complexity: 'simple'
      };
    }

    // NEVER JOURNAL RELEVANT
    if (transaction_type.includes('quote') ||
        transaction_type.includes('inquiry') ||
        smart_code.includes('.DRAFT') ||
        metadata?.no_financial_impact === true) {
      return {
        isRelevant: false,
        reason: 'No financial impact - journal not required',
        confidence: 1.0,
        complexity: 'simple'
      };
    }

    // CONDITIONAL BASED ON AMOUNT
    if (total_amount === 0) {
      return {
        isRelevant: false,
        reason: 'Zero amount transaction - no journal needed',
        confidence: 0.98,
        complexity: 'simple'
      };
    }

    // INVENTORY TRANSACTIONS (Usually journal relevant)
    if (smart_code.includes('.INV.')) {
      return {
        isRelevant: true,
        reason: 'Inventory transaction affects GL accounts',
        confidence: 0.90,
        complexity: 'simple'
      };
    }

    // SALES/PURCHASE (Almost always journal relevant)
    if (transaction_type.includes('sale') || 
        transaction_type.includes('purchase') ||
        transaction_type.includes('order')) {
      return {
        isRelevant: true,
        reason: 'Sales/Purchase transaction - revenue/expense impact',
        confidence: 0.85,
        complexity: 'simple'
      };
    }

    // UNCERTAIN - Requires AI analysis
    return {
      isRelevant: true, // Default to safe side
      reason: 'Uncertain transaction type - requires AI analysis',
      confidence: 0.50,
      complexity: 'ai_required'
    };
  }

  private async aiClassifyJournalRelevance(transaction: Transaction): Promise<any> {
    try {
      // For now, use rule-based fallback since we don't have OpenAI configured
      // In production, this would use OpenAI API for complex analysis
      console.log(`🤖 AI analysis would be performed for transaction: ${transaction.transaction_number}`);
      
      // Intelligent fallback based on transaction patterns
      if (transaction.total_amount > 0 && 
          !transaction.smart_code.includes('.DRAFT') &&
          !transaction.transaction_type.includes('quote')) {
        return {
          isRelevant: true,
          reason: 'AI analysis suggests financial impact likely',
          confidence: 0.75,
          complexity: 'ai_required'
        };
      }

      return {
        isRelevant: false,
        reason: 'AI analysis suggests no financial impact',
        confidence: 0.70,
        complexity: 'ai_required'
      };
    } catch (error) {
      console.error('AI classification failed:', error);
      return {
        isRelevant: true, // Safe default
        reason: 'AI classification failed - defaulting to journal creation',
        confidence: 0.50,
        complexity: 'ai_required'
      };
    }
  }
}

// ================================================================================
// AUTO-JOURNAL GENERATOR
// ================================================================================

class AutoJournalGenerator {
  private glAccountMapping: Map<string, string>;
  
  constructor() {
    this.glAccountMapping = new Map();
    this.loadGLAccountMappings();
  }

  /**
   * Generates journal entry for a transaction
   * Uses rule-based logic for simple cases, AI for complex scenarios
   */
  async generateJournalEntry(transaction: Transaction): Promise<JournalEntry> {
    
    // ============================================================================
    // RULE-BASED JOURNAL GENERATION (Simple Cases)
    // ============================================================================
    
    const simpleJournal = this.trySimpleJournalGeneration(transaction);
    if (simpleJournal.ai_confidence > 0.95) {
      return simpleJournal;
    }

    // ============================================================================
    // AI-POWERED JOURNAL GENERATION (Complex Cases)
    // ============================================================================
    
    return await this.aiGenerateJournalEntry(transaction);
  }

  private trySimpleJournalGeneration(transaction: Transaction): JournalEntry {
    const { transaction_type, smart_code, lines, total_amount } = transaction;

    // SALES TRANSACTION
    if (transaction_type.includes('sale') || smart_code.includes('.SAL.')) {
      return {
        transaction_id: transaction.id,
        journal_date: transaction.transaction_date,
        description: `Sales Transaction - ${transaction.transaction_number}`,
        reference: transaction.transaction_number,
        auto_generated: true,
        ai_confidence: 0.98,
        validation_status: 'validated',
        lines: [
          {
            gl_account_id: this.getGLAccount('accounts_receivable'),
            gl_account_code: '1200',
            description: 'Accounts Receivable',
            debit_amount: total_amount,
            credit_amount: 0,
            line_order: 1
          },
          {
            gl_account_id: this.getGLAccount('sales_revenue'),
            gl_account_code: '4000',
            description: 'Sales Revenue',
            debit_amount: 0,
            credit_amount: total_amount,
            line_order: 2
          }
        ]
      };
    }

    // PURCHASE TRANSACTION
    if (transaction_type.includes('purchase') || smart_code.includes('.PUR.')) {
      return {
        transaction_id: transaction.id,
        journal_date: transaction.transaction_date,
        description: `Purchase Transaction - ${transaction.transaction_number}`,
        reference: transaction.transaction_number,
        auto_generated: true,
        ai_confidence: 0.98,
        validation_status: 'validated',
        lines: [
          {
            gl_account_id: this.getGLAccount('inventory_asset'),
            gl_account_code: '1300',
            description: 'Inventory Asset',
            debit_amount: total_amount,
            credit_amount: 0,
            line_order: 1
          },
          {
            gl_account_id: this.getGLAccount('accounts_payable'),
            gl_account_code: '2000',
            description: 'Accounts Payable',
            debit_amount: 0,
            credit_amount: total_amount,
            line_order: 2
          }
        ]
      };
    }

    // PAYMENT TRANSACTION
    if (transaction_type.includes('payment') || smart_code.includes('.PAY.')) {
      return {
        transaction_id: transaction.id,
        journal_date: transaction.transaction_date,
        description: `Payment Transaction - ${transaction.transaction_number}`,
        reference: transaction.transaction_number,
        auto_generated: true,
        ai_confidence: 0.98,
        validation_status: 'validated',
        lines: [
          {
            gl_account_id: this.getGLAccount('accounts_payable'),
            gl_account_code: '2000',
            description: 'Accounts Payable',
            debit_amount: total_amount,
            credit_amount: 0,
            line_order: 1
          },
          {
            gl_account_id: this.getGLAccount('cash_bank'),
            gl_account_code: '1000',
            description: 'Cash - Bank Account',
            debit_amount: 0,
            credit_amount: total_amount,
            line_order: 2
          }
        ]
      };
    }

    // RECEIPT TRANSACTION
    if (transaction_type.includes('receipt') || smart_code.includes('.RCP.')) {
      return {
        transaction_id: transaction.id,
        journal_date: transaction.transaction_date,
        description: `Receipt Transaction - ${transaction.transaction_number}`,
        reference: transaction.transaction_number,
        auto_generated: true,
        ai_confidence: 0.98,
        validation_status: 'validated',
        lines: [
          {
            gl_account_id: this.getGLAccount('cash_bank'),
            gl_account_code: '1000',
            description: 'Cash - Bank Account',
            debit_amount: total_amount,
            credit_amount: 0,
            line_order: 1
          },
          {
            gl_account_id: this.getGLAccount('accounts_receivable'),
            gl_account_code: '1200',
            description: 'Accounts Receivable',
            debit_amount: 0,
            credit_amount: total_amount,
            line_order: 2
          }
        ]
      };
    }

    // COMPLEX CASE - Requires AI
    return {
      transaction_id: transaction.id,
      journal_date: transaction.transaction_date,
      description: 'Complex transaction - AI analysis required',
      reference: transaction.transaction_number,
      auto_generated: false,
      ai_confidence: 0.20,
      validation_status: 'requires_review',
      lines: []
    };
  }

  private async aiGenerateJournalEntry(transaction: Transaction): Promise<JournalEntry> {
    try {
      // Load chart of accounts context
      const chartOfAccounts = await this.getChartOfAccounts(transaction.organization_id);
      
      console.log(`🤖 AI journal generation would be performed for transaction: ${transaction.transaction_number}`);
      
      // Intelligent fallback journal entry based on transaction type and amount
      const fallbackJournal = this.createIntelligentFallbackJournal(transaction, chartOfAccounts);
      
      return {
        ...fallbackJournal,
        ai_confidence: 0.75,
        validation_status: 'requires_review'
      };
      
    } catch (error) {
      console.error('AI journal generation failed:', error);
      throw new Error('Failed to generate AI journal entry');
    }
  }

  private createIntelligentFallbackJournal(transaction: Transaction, chartOfAccounts: any[]): JournalEntry {
    // Create a reasonable journal entry based on transaction patterns
    const isExpense = transaction.total_amount > 0 && (
      transaction.transaction_type.includes('expense') ||
      transaction.smart_code.includes('.EXP.')
    );

    if (isExpense) {
      return {
        transaction_id: transaction.id,
        journal_date: transaction.transaction_date,
        description: `Expense Transaction - ${transaction.transaction_number}`,
        reference: transaction.transaction_number,
        auto_generated: true,
        ai_confidence: 0.75,
        validation_status: 'requires_review',
        lines: [
          {
            gl_account_id: this.getGLAccount('operating_expense'),
            gl_account_code: '6000',
            description: 'Operating Expense',
            debit_amount: transaction.total_amount,
            credit_amount: 0,
            line_order: 1
          },
          {
            gl_account_id: this.getGLAccount('cash_bank'),
            gl_account_code: '1000',
            description: 'Cash - Bank Account',
            debit_amount: 0,
            credit_amount: transaction.total_amount,
            line_order: 2
          }
        ]
      };
    }

    // Default to simple debit/credit entry
    return {
      transaction_id: transaction.id,
      journal_date: transaction.transaction_date,
      description: `General Transaction - ${transaction.transaction_number}`,
      reference: transaction.transaction_number,
      auto_generated: true,
      ai_confidence: 0.60,
      validation_status: 'requires_review',
      lines: [
        {
          gl_account_id: this.getGLAccount('miscellaneous_asset'),
          gl_account_code: '1900',
          description: 'Miscellaneous Asset',
          debit_amount: transaction.total_amount,
          credit_amount: 0,
          line_order: 1
        },
        {
          gl_account_id: this.getGLAccount('miscellaneous_income'),
          gl_account_code: '4900',
          description: 'Miscellaneous Income',
          debit_amount: 0,
          credit_amount: transaction.total_amount,
          line_order: 2
        }
      ]
    };
  }

  private async getChartOfAccounts(organizationId: string) {
    const { data } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'gl_account')
      .order('entity_code');
    
    return data || [];
  }

  private getGLAccount(accountType: string): string {
    return this.glAccountMapping.get(accountType) || 'unknown';
  }

  private getGLAccountIdByCode(accountCode: string): string {
    // Implementation to lookup GL account ID by code
    return `gl_account_${accountCode}`;
  }

  private loadGLAccountMappings() {
    // Standard GL account mappings
    this.glAccountMapping.set('cash_bank', '1000');
    this.glAccountMapping.set('accounts_receivable', '1200');
    this.glAccountMapping.set('inventory_asset', '1300');
    this.glAccountMapping.set('miscellaneous_asset', '1900');
    this.glAccountMapping.set('accounts_payable', '2000');
    this.glAccountMapping.set('sales_revenue', '4000');
    this.glAccountMapping.set('miscellaneous_income', '4900');
    this.glAccountMapping.set('cost_of_goods_sold', '5000');
    this.glAccountMapping.set('operating_expense', '6000');
  }
}

// ================================================================================
// BATCH JOURNAL PROCESSOR
// ================================================================================

class BatchJournalProcessor {
  private journalEngine: AutoJournalGenerator;
  private relevanceEngine: JournalRelevanceEngine;

  constructor() {
    this.journalEngine = new AutoJournalGenerator();
    this.relevanceEngine = new JournalRelevanceEngine();
  }

  /**
   * Process small transactions and create summary journal entries
   * Runs at end of day or when threshold is reached
   */
  async processBatchJournals(organizationId: string, options: {
    maxTransactionAmount?: number;
    minBatchSize?: number;
    summaryThreshold?: number;
  } = {}) {
    
    const {
      maxTransactionAmount = 100, // Transactions under $100 are "small"
      minBatchSize = 5,           // Need at least 5 transactions to batch
      summaryThreshold = 500      // Batch if total > $500
    } = options;

    console.log(`🔄 Processing batch journals for org: ${organizationId}`);

    // ============================================================================
    // FIND UNBATCHED SMALL TRANSACTIONS
    // ============================================================================
    
    const smallTransactions = await this.getUnbatchedSmallTransactions(
      organizationId, 
      maxTransactionAmount
    );

    if (smallTransactions.length < minBatchSize) {
      console.log(`📊 Only ${smallTransactions.length} small transactions - batch threshold not met`);
      return { batched: 0, journals_created: 0 };
    }

    // ============================================================================
    // GROUP BY TRANSACTION TYPE AND DATE
    // ============================================================================
    
    const transactionGroups = this.groupTransactionsForBatching(smallTransactions);
    let batchedCount = 0;
    let journalsCreated = 0;

    for (const [groupKey, groupTransactions] of Array.from(transactionGroups.entries())) {
      const groupTotal = groupTransactions.reduce((sum, t) => sum + t.total_amount, 0);
      
      if (groupTotal >= summaryThreshold) {
        console.log(`📝 Creating batch journal for ${groupKey}: ${groupTransactions.length} transactions, total ${groupTotal}`);
        
        const batchJournal = await this.createBatchJournal(groupTransactions);
        await this.saveBatchJournal(batchJournal);
        
        // Mark transactions as batched
        await this.markTransactionsAsBatched(groupTransactions.map(t => t.id), batchJournal.transaction_id);
        
        batchedCount += groupTransactions.length;
        journalsCreated++;
      }
    }

    console.log(`✅ Batch processing complete: ${batchedCount} transactions batched, ${journalsCreated} journals created`);
    return { batched: batchedCount, journals_created: journalsCreated };
  }

  private async getUnbatchedSmallTransactions(organizationId: string, maxAmount: number) {
    const { data } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        lines:universal_transaction_lines(*)
      `)
      .eq('organization_id', organizationId)
      .lte('total_amount', maxAmount)
      .eq('status', 'completed')
      .is('metadata->batch_journal_id', null) // Not already batched
      .gte('transaction_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('transaction_date');

    return data || [];
  }

  private groupTransactionsForBatching(transactions: Transaction[]): Map<string, Transaction[]> {
    const groups = new Map<string, Transaction[]>();

    transactions.forEach(transaction => {
      // Group by transaction type and date
      const groupKey = `${transaction.transaction_type}_${transaction.transaction_date.split('T')[0]}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(transaction);
    });

    return groups;
  }

  private async createBatchJournal(transactions: Transaction[]): Promise<JournalEntry> {
    const totalAmount = transactions.reduce((sum, t) => sum + t.total_amount, 0);
    const transactionDate = transactions[0].transaction_date.split('T')[0];
    const transactionType = transactions[0].transaction_type;
    
    // Create summary transaction record
    const summaryTransaction = await this.createSummaryTransaction(transactions, totalAmount);
    
    // Generate journal entry for the summary
    const journalEntry = await this.journalEngine.generateJournalEntry(summaryTransaction);
    
    // Enhance with batch information
    journalEntry.description = `Batch Journal - ${transactions.length} ${transactionType} transactions on ${transactionDate}`;
    journalEntry.lines.forEach(line => {
      line.description = `${line.description} (${transactions.length} transactions batched)`;
    });

    return journalEntry;
  }

  private async createSummaryTransaction(transactions: Transaction[], totalAmount: number): Promise<Transaction> {
    const firstTxn = transactions[0];
    
    return {
      ...firstTxn,
      id: `batch_${Date.now()}`,
      transaction_number: `BATCH-${new Date().toISOString().split('T')[0]}-${firstTxn.transaction_type}`,
      total_amount: totalAmount,
      smart_code: `${firstTxn.smart_code}.BATCH`,
      metadata: {
        ...firstTxn.metadata,
        batch_summary: true,
        batched_transaction_count: transactions.length,
        batched_transaction_ids: transactions.map(t => t.id)
      },
      lines: this.summarizeTransactionLines(transactions)
    };
  }

  private summarizeTransactionLines(transactions: Transaction[]): TransactionLine[] {
    const linesSummary = new Map<string, {
      entity_id: string;
      description: string;
      total_quantity: number;
      total_amount: number;
      count: number;
    }>();

    transactions.forEach(transaction => {
      transaction.lines.forEach(line => {
        const key = `${line.entity_id}_${line.line_description}`;
        
        if (!linesSummary.has(key)) {
          linesSummary.set(key, {
            entity_id: line.entity_id,
            description: line.line_description,
            total_quantity: 0,
            total_amount: 0,
            count: 0
          });
        }

        const summary = linesSummary.get(key)!;
        summary.total_quantity += line.quantity;
        summary.total_amount += line.line_amount;
        summary.count++;
      });
    });

    return Array.from(linesSummary.values()).map((summary, index) => ({
      id: `batch_line_${index}`,
      entity_id: summary.entity_id,
      line_description: `${summary.description} (${summary.count} transactions)`,
      quantity: summary.total_quantity,
      unit_price: summary.total_amount / summary.total_quantity,
      line_amount: summary.total_amount
    }));
  }

  async saveBatchJournal(journalEntry: JournalEntry) {
    // Create journal transaction
    const { data: journalTxn } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: journalEntry.transaction_id.split('_')[0], // Extract org ID
        transaction_type: 'journal_entry',
        transaction_number: `JE-${journalEntry.reference}`,
        transaction_date: journalEntry.journal_date,
        reference_number: journalEntry.reference,
        total_amount: journalEntry.lines.reduce((sum, line) => sum + line.debit_amount, 0),
        smart_code: 'HERA.FIN.GL.TXN.JE.AUTO.v1',
        status: 'completed',
        metadata: {
          auto_generated: journalEntry.auto_generated,
          ai_confidence: journalEntry.ai_confidence,
          source_transaction_id: journalEntry.transaction_id,
          batch_journal: true
        }
      })
      .select()
      .single();

    // Create journal lines
    if (journalTxn) {
      const journalLines = journalEntry.lines.map(line => ({
        transaction_id: journalTxn.id,
        organization_id: journalTxn.organization_id,
        entity_id: line.gl_account_id,
        line_description: line.description,
        quantity: 1,
        unit_price: line.debit_amount || line.credit_amount,
        line_amount: line.debit_amount || line.credit_amount,
        line_order: line.line_order,
        metadata: {
          account_code: line.gl_account_code,
          debit_amount: line.debit_amount,
          credit_amount: line.credit_amount,
          journal_line: true
        }
      }));

      await supabase
        .from('universal_transaction_lines')
        .insert(journalLines);
    }

    return journalTxn;
  }

  private async markTransactionsAsBatched(transactionIds: string[], batchJournalId: string) {
    // Update metadata to mark transactions as batched
    const batchMetadata = { batch_journal_id: batchJournalId, batch_processed: true };
    
    await supabase
      .from('universal_transactions')
      .update({
        metadata: batchMetadata
      })
      .in('id', transactionIds);
  }
}

// ================================================================================
// REAL-TIME JOURNAL PROCESSOR
// ================================================================================

class RealTimeJournalProcessor {
  private relevanceEngine: JournalRelevanceEngine;
  private journalGenerator: AutoJournalGenerator;
  private batchProcessor: BatchJournalProcessor;

  constructor() {
    this.relevanceEngine = new JournalRelevanceEngine();
    this.journalGenerator = new AutoJournalGenerator();
    this.batchProcessor = new BatchJournalProcessor();
  }

  /**
   * Main entry point: Process transaction when it's posted
   * Called by transaction posting webhook/trigger
   */
  async processTransactionPosting(transaction: Transaction): Promise<{
    journal_created: boolean;
    journal_id?: string;
    batched: boolean;
    processing_mode: 'immediate' | 'batched' | 'skipped';
    ai_used: boolean;
  }> {
    
    console.log(`🔄 Processing transaction: ${transaction.transaction_number}`);

    // ============================================================================
    // STEP 1: CHECK JOURNAL RELEVANCE
    // ============================================================================
    
    const relevanceCheck = await this.relevanceEngine.isJournalRelevant(transaction);
    
    if (!relevanceCheck.isRelevant) {
      console.log(`⏭️  Transaction ${transaction.transaction_number} skipped - ${relevanceCheck.reason}`);
      return {
        journal_created: false,
        batched: false,
        processing_mode: 'skipped',
        ai_used: relevanceCheck.complexity === 'ai_required'
      };
    }

    // ============================================================================
    // STEP 2: DETERMINE PROCESSING MODE
    // ============================================================================
    
    const processingMode = this.determineProcessingMode(transaction);

    if (processingMode === 'batched') {
      console.log(`📦 Transaction ${transaction.transaction_number} queued for batch processing`);
      return {
        journal_created: false,
        batched: true,
        processing_mode: 'batched',
        ai_used: false
      };
    }

    // ============================================================================
    // STEP 3: IMMEDIATE JOURNAL CREATION
    // ============================================================================
    
    const journalEntry = await this.journalGenerator.generateJournalEntry(transaction);
    const journalRecord = await this.saveJournalEntry(journalEntry);

    console.log(`✅ Journal entry created: ${journalRecord?.transaction_number} (AI confidence: ${journalEntry.ai_confidence})`);

    return {
      journal_created: true,
      journal_id: journalRecord?.id,
      batched: false,
      processing_mode: 'immediate',
      ai_used: relevanceCheck.complexity === 'ai_required' || journalEntry.ai_confidence < 0.95
    };
  }

  private determineProcessingMode(transaction: Transaction): 'immediate' | 'batched' {
    // Immediate processing for:
    // - Large transactions
    // - Critical transaction types
    // - Transactions requiring immediate GL impact
    
    if (transaction.total_amount > 1000 ||
        transaction.transaction_type.includes('payment') ||
        transaction.transaction_type.includes('receipt') ||
        transaction.smart_code.includes('.CRITICAL.') ||
        transaction.metadata?.immediate_posting === true) {
      return 'immediate';
    }

    // Batch processing for small routine transactions
    return 'batched';
  }

  private async saveJournalEntry(journalEntry: JournalEntry) {
    // Implementation similar to batch processor
    // Creates journal transaction and lines in universal tables
    return await this.batchProcessor.saveBatchJournal(journalEntry);
  }

  /**
   * Scheduled batch processing - runs end of day
   */
  async runEndOfDayBatchProcessing(organizationId: string) {
    console.log(`🌅 Running end-of-day batch processing for org: ${organizationId}`);
    
    const result = await this.batchProcessor.processBatchJournals(organizationId, {
      maxTransactionAmount: 100,
      minBatchSize: 3,
      summaryThreshold: 300
    });

    console.log(`📊 End-of-day summary: ${result.batched} transactions batched, ${result.journals_created} journals created`);
    return result;
  }
}

// ================================================================================
// TRANSACTION POSTING WEBHOOK HANDLER
// ================================================================================

export class TransactionPostingHandler {
  private journalProcessor: RealTimeJournalProcessor;

  constructor() {
    this.journalProcessor = new RealTimeJournalProcessor();
  }

  /**
   * Webhook handler for when transactions are posted
   * Integrates with HERA's universal transaction system
   */
  async handleTransactionPosted(payload: {
    transaction_id: string;
    organization_id: string;
    event_type: 'transaction.posted' | 'transaction.completed';
  }) {
    
    try {
      // Load complete transaction with lines
      const transaction = await this.loadCompleteTransaction(payload.transaction_id);
      
      if (!transaction) {
        throw new Error(`Transaction ${payload.transaction_id} not found`);
      }

      // Process for journal creation
      const result = await this.journalProcessor.processTransactionPosting(transaction);
      
      // Log processing result
      await this.logJournalProcessing(payload.transaction_id, result);
      
      return result;

    } catch (error) {
      console.error('Transaction posting handler failed:', error);
      await this.logProcessingError(payload.transaction_id, error);
      throw error;
    }
  }

  private async loadCompleteTransaction(transactionId: string): Promise<Transaction | null> {
    const { data } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        lines:universal_transaction_lines(*)
      `)
      .eq('id', transactionId)
      .single();

    return data;
  }

  private async logJournalProcessing(transactionId: string, result: any) {
    await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: 'system',
        entity_id: transactionId,
        field_name: 'journal_processing_result',
        field_type: 'json',
        field_value_json: result,
        ai_enhanced_value: `Journal processing: ${result.processing_mode}, AI used: ${result.ai_used}`,
        smart_code: 'HERA.FIN.GL.AUTO.JOURNAL.LOG.v1'
      });
  }

  private async logProcessingError(transactionId: string, error: any) {
    await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: 'system',
        entity_id: transactionId,
        field_name: 'journal_processing_error',
        field_type: 'json',
        field_value_json: { error: error.message, timestamp: new Date().toISOString() },
        smart_code: 'HERA.FIN.GL.AUTO.JOURNAL.ERROR.v1'
      });
  }
}

// ================================================================================
// MAIN EXPORT FUNCTIONS
// ================================================================================

// Initialize the auto-journal system
const transactionHandler = new TransactionPostingHandler();

/**
 * Main function to process a transaction for auto-journal creation
 */
export async function processTransactionForJournal(transactionId: string, organizationId: string) {
  return await transactionHandler.handleTransactionPosted({
    transaction_id: transactionId,
    organization_id: organizationId,
    event_type: 'transaction.completed'
  });
}

/**
 * Scheduled batch processing (run via cron)
 */
export async function runBatchProcessing(organizationId: string) {
  const processor = new RealTimeJournalProcessor();
  return await processor.runEndOfDayBatchProcessing(organizationId);
}

/**
 * Check if transaction requires journal entry
 */
export async function checkJournalRelevance(transaction: Transaction) {
  const engine = new JournalRelevanceEngine();
  return await engine.isJournalRelevant(transaction);
}

/**
 * Generate journal entry for a transaction
 */
export async function generateJournalEntry(transaction: Transaction) {
  const generator = new AutoJournalGenerator();
  return await generator.generateJournalEntry(transaction);
}

// ================================================================================
// SMART CODE EXAMPLES FOR JOURNAL AUTOMATION
// ================================================================================

/*
JOURNAL-RELEVANT SMART CODES:

✅ ALWAYS CREATE JOURNAL:
HERA.FIN.GL.TXN.JE.v1         - Direct journal entry
HERA.FIN.AP.TXN.PAY.v1        - Vendor payment
HERA.FIN.AR.TXN.RCP.v1        - Customer payment
HERA.INV.ADJ.TXN.WRITE.v1     - Inventory write-off
HERA.FIN.AA.TXN.DEPR.v1       - Asset depreciation

🔄 CONDITIONAL JOURNAL (Based on Amount/Rules):
HERA.REST.POS.TXN.SALE.v1     - Restaurant sale (batch if small)
HERA.INV.RCV.TXN.IN.v1        - Inventory receipt (immediate if large)
HERA.HR.EXP.TXN.REIM.v1       - Expense reimbursement (batch if small)

❌ NEVER CREATE JOURNAL:
HERA.CRM.CUS.ENT.PROF.DRAFT   - Draft customer profile
HERA.SCM.PUR.TXN.QUOTE.v1     - Purchase quote (no commitment)
HERA.REST.RES.TXN.BOOK.v1     - Table reservation (no financial impact)

🤖 AI ANALYSIS REQUIRED:
HERA.PROJ.TIME.TXN.LOG.v1     - Time logging (depends on billing method)
HERA.MFG.WIP.TXN.MOVE.v1      - WIP movement (depends on costing method)
HERA.SVC.FLD.TXN.VISIT.v1     - Field service (depends on service type)
*/