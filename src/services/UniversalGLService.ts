/**
 * Universal GL Service - Dave Patel's Business-First Accounting
 * 
 * Core principle: "Record business events, accounting happens automatically"
 * 
 * This service transforms business transactions into proper journal entries
 * using HERA's universal 6-table architecture - no separate GL system needed.
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Universal transaction types that generate GL entries
export interface BusinessTransaction {
  organizationId: string
  transactionType: 'sale' | 'purchase' | 'payment' | 'receipt' | 'expense' | 'transfer' | 'payroll' | 'inventory_adjustment'
  entityId?: string // Related entity (customer, vendor, employee, etc.)
  amount: number
  description: string
  referenceNumber?: string
  transactionDate: Date
  metadata?: Record<string, any>
  
  // Business-specific details that drive account mapping
  details: {
    // For sales
    customerId?: string
    items?: Array<{itemId: string, quantity: number, unitPrice: number}>
    taxAmount?: number
    
    // For purchases  
    vendorId?: string
    invoiceNumber?: string
    
    // For payments
    paymentMethod?: 'cash' | 'check' | 'card' | 'bank_transfer'
    fromAccount?: string
    toAccount?: string
    
    // For payroll
    employeeId?: string
    payPeriod?: string
    
    // For inventory
    warehouseId?: string
    adjustmentReason?: string
  }
}

// Generated journal entry
export interface JournalEntry {
  id: string
  organizationId: string
  transactionId: string
  entryDate: Date
  referenceNumber: string
  description: string
  totalDebits: number
  totalCredits: number
  isBalanced: boolean
  postingLines: JournalEntryLine[]
  metadata: Record<string, any>
}

export interface JournalEntryLine {
  accountId: string
  accountCode: string
  accountName: string
  debitAmount: number
  creditAmount: number
  description: string
  entityId?: string
  metadata?: Record<string, any>
}

// Dave Patel's Smart Account Mapping Rules
interface AccountMappingRule {
  transactionType: string
  conditions: Record<string, any>
  debitAccount: string
  creditAccount: string
  description: string
  priority: number
}

export class UniversalGLService {
  private supabase = getSupabaseAdmin()
  
  /**
   * Main entry point: Record business transaction and generate GL entries automatically
   * Dave Patel principle: "Business event first, accounting second"
   */
  async recordBusinessTransaction(transaction: BusinessTransaction): Promise<{
    transactionId: string
    journalEntry: JournalEntry
    success: boolean
    message: string
  }> {
    try {
      console.log('🏗️ Recording business transaction:', transaction.transactionType)
      
      // Step 1: Create the business transaction record
      const transactionRecord = await this.createUniversalTransaction(transaction)
      
      // Step 2: Generate journal entry automatically using smart mapping
      const journalEntry = await this.generateJournalEntry(transactionRecord, transaction)
      
      // Step 3: Post to GL (create journal entry lines in universal schema)
      await this.postJournalEntry(journalEntry)
      
      // Step 4: Update business transaction with GL reference
      await this.linkTransactionToGL(transactionRecord.id, journalEntry.id)
      
      console.log('✅ Business transaction recorded with automatic GL posting')
      
      return {
        transactionId: transactionRecord.id,
        journalEntry,
        success: true,
        message: `${transaction.transactionType} recorded with automatic journal entry`
      }
      
    } catch (error) {
      console.error('❌ Failed to record business transaction:', error)
      return {
        transactionId: '',
        journalEntry: null as any,
        success: false,
        message: error.message
      }
    }
  }
  
  /**
   * Create universal transaction record in HERA's 6-table schema with Smart Code integration
   */
  private async createUniversalTransaction(transaction: BusinessTransaction) {
    // Generate smart code for the transaction
    const smartCode = this.generateFinancialSmartCode(transaction.transactionType, 'TXN')
    
    const { data, error } = await this.supabase
      .from('universal_transactions')
      .insert({
        organization_id: transaction.organizationId,
        transaction_type: transaction.transactionType,
        entity_id: transaction.entityId,
        transaction_date: transaction.transactionDate.toISOString(),
        total_amount: transaction.amount,
        reference_number: transaction.referenceNumber || this.generateReferenceNumber(transaction.transactionType),
        description: transaction.description,
        status: 'posted',
        created_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          business_details: transaction.details,
          auto_generated_gl: true,
          smart_code: smartCode,
          smart_code_context: {
            module: 'FIN',
            sub_module: this.getSubModuleFromTransactionType(transaction.transactionType),
            validation_level: 'L4_INTEGRATION'
          }
        }
      })
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create transaction: ${error.message}`)
    return data
  }
  
  /**
   * Dave Patel's Smart Journal Entry Generation
   * Automatically determines correct accounts based on business transaction type
   */
  private async generateJournalEntry(transactionRecord: any, businessTransaction: BusinessTransaction): Promise<JournalEntry> {
    console.log('🧠 Generating smart journal entry for:', businessTransaction.transactionType)
    
    // Get organization's chart of accounts
    const accounts = await this.getOrganizationAccounts(businessTransaction.organizationId)
    
    // Apply Dave Patel's smart mapping rules
    const mappingRules = await this.getAccountMappingRules(businessTransaction)
    const accountMapping = this.determineAccountMapping(businessTransaction, accounts, mappingRules)
    
    // Generate journal entry lines
    const postingLines = await this.generateJournalLines(businessTransaction, accountMapping, accounts)
    
    // Validate entry is balanced
    const totalDebits = postingLines.reduce((sum, line) => sum + line.debitAmount, 0)
    const totalCredits = postingLines.reduce((sum, line) => sum + line.creditAmount, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01
    
    if (!isBalanced) {
      throw new Error(`Journal entry not balanced: Debits ${totalDebits}, Credits ${totalCredits}`)
    }
    
    return {
      id: this.generateId(),
      organizationId: businessTransaction.organizationId,
      transactionId: transactionRecord.id,
      entryDate: businessTransaction.transactionDate,
      referenceNumber: transactionRecord.reference_number,
      description: businessTransaction.description,
      totalDebits,
      totalCredits,
      isBalanced,
      postingLines,
      metadata: {
        autoGenerated: true,
        businessTransactionType: businessTransaction.transactionType,
        mappingRulesApplied: mappingRules.map(r => r.description)
      }
    }
  }
  
  /**
   * Dave Patel's Business-Smart Account Mapping
   * No manual account selection - system learns from business context
   */
  private determineAccountMapping(transaction: BusinessTransaction, accounts: any[], rules: AccountMappingRule[]) {
    // Find the best matching rule based on transaction type and conditions
    const applicableRules = rules.filter(rule => {
      if (rule.transactionType !== transaction.transactionType) return false
      
      // Check conditions
      for (const [key, value] of Object.entries(rule.conditions)) {
        if (transaction.details[key] !== value && rule.conditions[key] !== '*') {
          return false
        }
      }
      return true
    })
    
    // Sort by priority (higher priority first)
    applicableRules.sort((a, b) => b.priority - a.priority)
    
    if (applicableRules.length === 0) {
      throw new Error(`No account mapping rule found for transaction type: ${transaction.transactionType}`)
    }
    
    const selectedRule = applicableRules[0]
    
    return {
      debitAccount: this.findAccountByCode(accounts, selectedRule.debitAccount),
      creditAccount: this.findAccountByCode(accounts, selectedRule.creditAccount),
      rule: selectedRule
    }
  }
  
  /**
   * Generate journal entry lines with business intelligence
   */
  private async generateJournalLines(
    transaction: BusinessTransaction, 
    mapping: any, 
    accounts: any[]
  ): Promise<JournalEntryLine[]> {
    const lines: JournalEntryLine[] = []
    
    // Handle different transaction types with business-specific logic
    switch (transaction.transactionType) {
      case 'sale':
        lines.push(...this.generateSalesJournalLines(transaction, mapping))
        break
        
      case 'purchase':
        lines.push(...this.generatePurchaseJournalLines(transaction, mapping))
        break
        
      case 'payment':
        lines.push(...this.generatePaymentJournalLines(transaction, mapping))
        break
        
      case 'receipt':
        lines.push(...this.generateReceiptJournalLines(transaction, mapping))
        break
        
      case 'expense':
        lines.push(...this.generateExpenseJournalLines(transaction, mapping))
        // Also handle asset acquisitions as expenses
        break
        
      case 'payroll':
        lines.push(...this.generatePayrollJournalLines(transaction, mapping))
        break
        
      case 'sale':
        // Handle invoices as sales
        lines.push(...this.generateSalesJournalLines(transaction, mapping))
        break
        
      default:
        // Generic two-line entry
        lines.push(
          {
            accountId: mapping.debitAccount.id,
            accountCode: mapping.debitAccount.entity_code,
            accountName: mapping.debitAccount.entity_name,
            debitAmount: transaction.amount,
            creditAmount: 0,
            description: transaction.description
          },
          {
            accountId: mapping.creditAccount.id,
            accountCode: mapping.creditAccount.entity_code,
            accountName: mapping.creditAccount.entity_name,
            debitAmount: 0,
            creditAmount: transaction.amount,
            description: transaction.description
          }
        )
    }
    
    return lines
  }
  
  /**
   * Sales transaction journal lines with tax and multi-item support
   */
  private generateSalesJournalLines(transaction: BusinessTransaction, mapping: any): JournalEntryLine[] {
    const lines: JournalEntryLine[] = []
    const { details } = transaction
    
    // Accounts Receivable (or Cash) - Debit
    lines.push({
      accountId: mapping.debitAccount.id,
      accountCode: mapping.debitAccount.entity_code,
      accountName: mapping.debitAccount.entity_name,
      debitAmount: transaction.amount,
      creditAmount: 0,
      description: `Sale to customer - ${transaction.description}`,
      entityId: details.customerId
    })
    
    // Sales Revenue - Credit (minus tax)
    const taxAmount = details.taxAmount || 0
    const revenueAmount = transaction.amount - taxAmount
    
    lines.push({
      accountId: mapping.creditAccount.id,
      accountCode: mapping.creditAccount.entity_code,
      accountName: mapping.creditAccount.entity_name,
      debitAmount: 0,
      creditAmount: revenueAmount,
      description: `Sales revenue - ${transaction.description}`,
      entityId: details.customerId
    })
    
    // Sales Tax Payable - Credit (if tax exists)
    if (taxAmount > 0) {
      // TODO: Get sales tax account from chart of accounts
      lines.push({
        accountId: 'sales-tax-account', // Will be resolved from COA
        accountCode: '2150',
        accountName: 'Sales Tax Payable',
        debitAmount: 0,
        creditAmount: taxAmount,
        description: `Sales tax collected - ${transaction.description}`,
        entityId: details.customerId
      })
    }
    
    return lines
  }
  
  /**
   * Purchase transaction journal lines  
   */
  private generatePurchaseJournalLines(transaction: BusinessTransaction, mapping: any): JournalEntryLine[] {
    const lines: JournalEntryLine[] = []
    const { details } = transaction
    
    // Expense or Asset Account - Debit
    lines.push({
      accountId: mapping.debitAccount.id,
      accountCode: mapping.debitAccount.entity_code,
      accountName: mapping.debitAccount.entity_name,
      debitAmount: transaction.amount,
      creditAmount: 0,
      description: `Purchase from vendor - ${transaction.description}`,
      entityId: details.vendorId
    })
    
    // Accounts Payable - Credit
    lines.push({
      accountId: mapping.creditAccount.id,
      accountCode: mapping.creditAccount.entity_code,
      accountName: mapping.creditAccount.entity_name,
      debitAmount: 0,
      creditAmount: transaction.amount,
      description: `Amount owed to vendor - ${transaction.description}`,
      entityId: details.vendorId
    })
    
    return lines
  }
  
  /**
   * Payment transaction journal lines
   */
  private generatePaymentJournalLines(transaction: BusinessTransaction, mapping: any): JournalEntryLine[] {
    const lines: JournalEntryLine[] = []
    const { details } = transaction
    
    // What we're paying (AP, Expense, etc.) - Debit
    lines.push({
      accountId: mapping.debitAccount.id,
      accountCode: mapping.debitAccount.entity_code,
      accountName: mapping.debitAccount.entity_name,
      debitAmount: transaction.amount,
      creditAmount: 0,
      description: `Payment made - ${transaction.description}`,
      entityId: transaction.entityId
    })
    
    // Cash/Bank Account - Credit
    lines.push({
      accountId: mapping.creditAccount.id,
      accountCode: mapping.creditAccount.entity_code,
      accountName: mapping.creditAccount.entity_name,
      debitAmount: 0,
      creditAmount: transaction.amount,
      description: `Payment via ${details.paymentMethod} - ${transaction.description}`,
      entityId: transaction.entityId
    })
    
    return lines
  }
  
  /**
   * Receipt transaction journal lines
   */
  private generateReceiptJournalLines(transaction: BusinessTransaction, mapping: any): JournalEntryLine[] {
    const lines: JournalEntryLine[] = []
    const { details } = transaction
    
    // Cash/Bank Account - Debit
    lines.push({
      accountId: mapping.debitAccount.id,
      accountCode: mapping.debitAccount.entity_code,
      accountName: mapping.debitAccount.entity_name,
      debitAmount: transaction.amount,
      creditAmount: 0,
      description: `Receipt via ${details.paymentMethod} - ${transaction.description}`,
      entityId: transaction.entityId
    })
    
    // Accounts Receivable - Credit
    lines.push({
      accountId: mapping.creditAccount.id,
      accountCode: mapping.creditAccount.entity_code,
      accountName: mapping.creditAccount.entity_name,
      debitAmount: 0,
      creditAmount: transaction.amount,
      description: `Customer payment received - ${transaction.description}`,
      entityId: transaction.entityId
    })
    
    return lines
  }
  
  /**
   * Expense transaction journal lines
   */
  private generateExpenseJournalLines(transaction: BusinessTransaction, mapping: any): JournalEntryLine[] {
    const lines: JournalEntryLine[] = []
    
    // Expense Account - Debit
    lines.push({
      accountId: mapping.debitAccount.id,
      accountCode: mapping.debitAccount.entity_code,
      accountName: mapping.debitAccount.entity_name,
      debitAmount: transaction.amount,
      creditAmount: 0,
      description: transaction.description,
      entityId: transaction.entityId
    })
    
    // Cash/AP Account - Credit
    lines.push({
      accountId: mapping.creditAccount.id,
      accountCode: mapping.creditAccount.entity_code,
      accountName: mapping.creditAccount.entity_name,
      debitAmount: 0,
      creditAmount: transaction.amount,
      description: transaction.description,
      entityId: transaction.entityId
    })
    
    return lines
  }
  
  /**
   * Post journal entry to universal schema with Smart Code integration
   */
  private async postJournalEntry(entry: JournalEntry) {
    // Generate smart code for journal entry
    const smartCode = this.generateFinancialSmartCode('journal_entry', 'ENT')
    
    // Create journal entry header
    const { data: headerData, error: headerError } = await this.supabase
      .from('core_entities')
      .insert({
        organization_id: entry.organizationId,
        entity_type: 'journal_entry',
        entity_name: `JE-${entry.referenceNumber}`,
        entity_code: entry.referenceNumber,
        status: 'posted',
        created_at: entry.entryDate.toISOString(),
        metadata: {
          smart_code: smartCode,
          journal_entry_type: 'auto_generated',
          entry_date: entry.entryDate.toISOString()
        }
      })
      .select()
      .single()
    
    if (headerError) throw new Error(`Failed to create journal entry header: ${headerError.message}`)
    
    // Store journal entry details in dynamic data
    const { error: detailsError } = await this.supabase
      .from('core_dynamic_data')
      .insert([
        {
          organization_id: entry.organizationId,
          entity_id: headerData.id,
          field_name: 'total_debits',
          field_type: 'number',
          field_value_number: entry.totalDebits
        },
        {
          organization_id: entry.organizationId,
          entity_id: headerData.id,
          field_name: 'total_credits',
          field_type: 'number',
          field_value_number: entry.totalCredits
        },
        {
          organization_id: entry.organizationId,
          entity_id: headerData.id,
          field_name: 'is_balanced',
          field_type: 'text',
          field_value_text: entry.isBalanced.toString()
        },
        {
          organization_id: entry.organizationId,
          entity_id: headerData.id,
          field_name: 'transaction_id',
          field_type: 'text',
          field_value_text: entry.transactionId
        },
        {
          organization_id: entry.organizationId,
          entity_id: headerData.id,
          field_name: 'posting_lines',
          field_type: 'json',
          field_value_json: entry.postingLines
        },
        {
          organization_id: entry.organizationId,
          entity_id: headerData.id,
          field_name: 'metadata',
          field_type: 'json',
          field_value_json: entry.metadata
        }
      ])
    
    if (detailsError) throw new Error(`Failed to store journal entry details: ${detailsError.message}`)
    
    // Create journal entry lines as transaction lines
    const lineInserts = entry.postingLines.map(line => ({
      organization_id: entry.organizationId,
      transaction_id: headerData.id,
      line_type: 'journal_entry_line',
      entity_id: line.accountId,
      description: line.description,
      debit_amount: line.debitAmount,
      credit_amount: line.creditAmount,
      metadata: {
        account_code: line.accountCode,
        account_name: line.accountName,
        related_entity_id: line.entityId,
        ...line.metadata
      }
    }))
    
    const { error: linesError } = await this.supabase
      .from('universal_transaction_lines')
      .insert(lineInserts)
    
    if (linesError) throw new Error(`Failed to create journal entry lines: ${linesError.message}`)
  }
  
  /**
   * Link business transaction to generated journal entry
   */
  private async linkTransactionToGL(transactionId: string, journalEntryId: string) {
    const { error } = await this.supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: '',
        entity_id: transactionId,
        field_name: 'journal_entry_id',
        field_type: 'text',
        field_value_text: journalEntryId
      })
    
    if (error) console.warn('Failed to link transaction to GL:', error.message)
  }
  
  /**
   * Get organization's chart of accounts with Smart Code filtering
   */
  private async getOrganizationAccounts(organizationId: string) {
    const { data, error } = await this.supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'gl_account')
      .eq('status', 'active')
      .like('smart_code', 'HERA.FIN.GL.ENT.ACC.%')
    
    if (error) throw new Error(`Failed to load chart of accounts: ${error.message}`)
    return data || []
  }
  
  /**
   * Dave Patel's Smart Mapping Rules
   * These rules learn and adapt based on business patterns
   */
  private async getAccountMappingRules(transaction: BusinessTransaction): Promise<AccountMappingRule[]> {
    // Default rules - in production, these would be learned from patterns
    const defaultRules: AccountMappingRule[] = [
      // Sales transactions
      {
        transactionType: 'sale',
        conditions: { paymentMethod: 'cash' },
        debitAccount: '1100', // Cash
        creditAccount: '4000', // Sales Revenue
        description: 'Cash sale',
        priority: 100
      },
      {
        transactionType: 'sale',
        conditions: { paymentMethod: '*' },
        debitAccount: '1200', // Accounts Receivable
        creditAccount: '4000', // Sales Revenue
        description: 'Credit sale',
        priority: 90
      },
      
      // Purchase transactions
      {
        transactionType: 'purchase',
        conditions: { paymentMethod: 'cash' },
        debitAccount: '5000', // Purchases
        creditAccount: '1100', // Cash
        description: 'Cash purchase',
        priority: 100
      },
      {
        transactionType: 'purchase',
        conditions: { paymentMethod: '*' },
        debitAccount: '5000', // Purchases
        creditAccount: '2100', // Accounts Payable
        description: 'Credit purchase',
        priority: 90
      },
      
      // Payment transactions
      {
        transactionType: 'payment',
        conditions: { paymentMethod: '*' },
        debitAccount: '2100', // Accounts Payable
        creditAccount: '1100', // Cash
        description: 'Vendor payment',
        priority: 100
      },
      
      // Receipt transactions
      {
        transactionType: 'receipt',
        conditions: { paymentMethod: '*' },
        debitAccount: '1100', // Cash
        creditAccount: '1200', // Accounts Receivable
        description: 'Customer payment',
        priority: 100
      },
      
      // Expense transactions
      {
        transactionType: 'expense',
        conditions: { paymentMethod: '*' },
        debitAccount: '6000', // Operating Expenses
        creditAccount: '1100', // Cash
        description: 'Operating expense',
        priority: 100
      }
    ]
    
    return defaultRules
  }
  
  /**
   * Utility methods
   */
  private findAccountByCode(accounts: any[], code: string) {
    const account = accounts.find(acc => acc.entity_code === code)
    if (!account) {
      throw new Error(`Account not found: ${code}`)
    }
    return account
  }
  
  private generateReferenceNumber(transactionType: string): string {
    const prefix = {
      'sale': 'INV',
      'purchase': 'PUR',
      'payment': 'PMT',
      'receipt': 'RCP',
      'expense': 'EXP',
      'transfer': 'TRF',
      'payroll': 'PAY',
      'inventory_adjustment': 'ADJ'
    }[transactionType] || 'TXN'
    
    return `${prefix}-${Date.now().toString().slice(-6)}`
  }
  
  private generateId(): string {
    return `je_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Generate Financial Smart Code based on transaction type and function
   */
  private generateFinancialSmartCode(transactionType: string, functionType: 'TXN' | 'ENT' | 'RPT' = 'TXN'): string {
    const subModule = this.getSubModuleFromTransactionType(transactionType)
    const typeCode = this.getTypeCodeFromTransactionType(transactionType, functionType)
    
    return `HERA.FIN.${subModule}.${functionType}.${typeCode}.v1`
  }
  
  /**
   * Get sub-module code from transaction type
   */
  private getSubModuleFromTransactionType(transactionType: string): string {
    const mapping = {
      'sale': 'AR',                    // Accounts Receivable
      'receipt': 'AR',                 // Accounts Receivable
      'invoice': 'AR',                 // Accounts Receivable
      'customer_payment': 'AR',        // Accounts Receivable
      'purchase': 'AP',                // Accounts Payable
      'payment': 'AP',                 // Accounts Payable
      'vendor_bill': 'AP',             // Accounts Payable
      'vendor_payment': 'AP',          // Accounts Payable
      'journal_entry': 'GL',           // General Ledger
      'expense': 'GL',                 // General Ledger
      'transfer': 'GL',                // General Ledger
      'payroll': 'GL',                 // General Ledger
      'inventory_adjustment': 'GL',    // General Ledger
      'asset_acquisition': 'FA',       // Fixed Assets
      'asset_disposal': 'FA',          // Fixed Assets
      'depreciation': 'FA',            // Fixed Assets
      'cash_receipt': 'AR',            // Accounts Receivable
      'cash_payment': 'AP'             // Accounts Payable
    }
    
    return mapping[transactionType as keyof typeof mapping] || 'GL'
  }
  
  /**
   * Get type code from transaction type and function
   */
  private getTypeCodeFromTransactionType(transactionType: string, functionType: string): string {
    if (functionType === 'ENT') {
      // Entity type codes
      const entityMapping = {
        'sale': 'CUS',               // Customer
        'receipt': 'CUS',            // Customer
        'invoice': 'CUS',            // Customer
        'customer_payment': 'CUS',   // Customer
        'purchase': 'VEN',           // Vendor
        'payment': 'VEN',            // Vendor
        'vendor_bill': 'VEN',        // Vendor
        'vendor_payment': 'VEN',     // Vendor
        'journal_entry': 'JE',       // Journal Entry
        'payroll': 'EMP',            // Employee
        'asset_acquisition': 'AST',  // Asset
        'asset_disposal': 'AST',     // Asset
        'depreciation': 'AST'        // Asset
      }
      return entityMapping[transactionType as keyof typeof entityMapping] || 'GEN'
    } else if (functionType === 'TXN') {
      // Transaction type codes
      const transactionMapping = {
        'sale': 'SAL',                   // Sale
        'receipt': 'RCP',                // Receipt
        'invoice': 'INV',                // Invoice
        'customer_payment': 'PMT',       // Customer Payment
        'purchase': 'PUR',               // Purchase
        'payment': 'PAY',                // Payment
        'vendor_bill': 'BIL',            // Vendor Bill
        'vendor_payment': 'PMT',         // Vendor Payment
        'journal_entry': 'JE',           // Journal Entry
        'expense': 'EXP',                // Expense
        'transfer': 'TRF',               // Transfer
        'payroll': 'PAY',                // Payroll
        'inventory_adjustment': 'ADJ',   // Adjustment
        'asset_acquisition': 'ACQ',      // Asset Acquisition
        'asset_disposal': 'DIS',         // Asset Disposal
        'depreciation': 'DEP',           // Depreciation
        'cash_receipt': 'CSH',           // Cash Receipt
        'cash_payment': 'CSH'            // Cash Payment
      }
      return transactionMapping[transactionType as keyof typeof transactionMapping] || 'GEN'
    } else if (functionType === 'RPT') {
      // Report type codes
      return 'GEN' // Generic report
    }
    
    return 'GEN'
  }
  
  /**
   * Validate Smart Code format and business rules
   */
  private async validateSmartCode(smartCode: string, organizationId: string): Promise<boolean> {
    try {
      // Basic format validation
      const parts = smartCode.split('.')
      if (parts.length !== 6 || parts[0] !== 'HERA' || parts[1] !== 'FIN') {
        return false
      }
      
      // In production, this would call the smart code validation API
      // For now, return true for valid format
      return true
    } catch (error) {
      console.error('Smart code validation error:', error)
      return false
    }
  }
  
  /**
   * Asset acquisition journal lines - Fixed Assets module
   */
  private generateAssetAcquisitionJournalLines(transaction: BusinessTransaction, mapping: any): JournalEntryLine[] {
    const lines: JournalEntryLine[] = []
    
    // Fixed Asset - Debit
    lines.push({
      accountId: mapping.debitAccount.id,
      accountCode: mapping.debitAccount.entity_code,
      accountName: mapping.debitAccount.entity_name,
      debitAmount: transaction.amount,
      creditAmount: 0,
      description: `Asset acquisition: ${transaction.description}`
    })
    
    // Cash/Accounts Payable - Credit
    lines.push({
      accountId: mapping.creditAccount.id,
      accountCode: mapping.creditAccount.entity_code,
      accountName: mapping.creditAccount.entity_name,
      debitAmount: 0,
      creditAmount: transaction.amount,
      description: `Payment for asset: ${transaction.description}`
    })
    
    return lines
  }
  
  /**
   * Payroll journal lines - HR/Payroll module
   */
  private generatePayrollJournalLines(transaction: BusinessTransaction, mapping: any): JournalEntryLine[] {
    const lines: JournalEntryLine[] = []
    
    // Salary Expense - Debit
    lines.push({
      accountId: mapping.debitAccount.id,
      accountCode: mapping.debitAccount.entity_code,
      accountName: mapping.debitAccount.entity_name,
      debitAmount: transaction.amount,
      creditAmount: 0,
      description: `Payroll expense: ${transaction.description}`
    })
    
    // Cash/Payroll Payable - Credit
    lines.push({
      accountId: mapping.creditAccount.id,
      accountCode: mapping.creditAccount.entity_code,
      accountName: mapping.creditAccount.entity_name,
      debitAmount: 0,
      creditAmount: transaction.amount,
      description: `Payroll payment: ${transaction.description}`
    })
    
    return lines
  }
}

// Export singleton instance
export const universalGL = new UniversalGLService()