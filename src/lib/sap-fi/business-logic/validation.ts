import { UniversalTransaction, UniversalTransactionLine } from '@/types/hera-database.types'

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
}

export class SAPValidationService {
  // Main validation entry point
  static async validateTransaction(
    transaction: UniversalTransaction,
    lines: UniversalTransactionLine[]
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Run all validations
    this.validateGLBalance(transaction, lines, errors)
    this.validateRequiredFields(transaction, errors)
    this.validateSmartCode(transaction, errors)
    this.validatePostingDate(transaction, warnings)
    this.validateDocumentType(transaction, errors)
    
    // Additional validations based on transaction type
    if (transaction.smart_code.includes('.AP.INVOICE.')) {
      this.validateAPInvoice(transaction, errors, warnings)
    } else if (transaction.smart_code.includes('.AR.INVOICE.')) {
      this.validateARInvoice(transaction, errors, warnings)
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  // GL Balance validation
  private static validateGLBalance(
    transaction: UniversalTransaction,
    lines: UniversalTransactionLine[],
    errors: ValidationError[]
  ): void {
    const totalDebits = lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0)
    const totalCredits = lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0)
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push({
        field: 'lines',
        message: `Document not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`,
        code: 'HERA.ERP.FI.ERROR.BALANCE.v1'
      })
    }
  }
  
  // Required fields validation
  private static validateRequiredFields(
    transaction: UniversalTransaction,
    errors: ValidationError[]
  ): void {
    if (!transaction.transaction_date) {
      errors.push({
        field: 'transaction_date',
        message: 'Transaction date is required',
        code: 'REQUIRED_FIELD'
      })
    }
    
    if (!transaction.organization_id) {
      errors.push({
        field: 'organization_id',
        message: 'Organization ID is required',
        code: 'REQUIRED_FIELD'
      })
    }
    
    if (!transaction.smart_code) {
      errors.push({
        field: 'smart_code',
        message: 'Smart code is required',
        code: 'REQUIRED_FIELD'
      })
    }
  }
  
  // Smart code validation
  private static validateSmartCode(
    transaction: UniversalTransaction,
    errors: ValidationError[]
  ): void {
    const validSmartCodes = [
      'HERA.ERP.FI.JE.POST.v1',
      'HERA.ERP.FI.AP.INVOICE.v1',
      'HERA.ERP.FI.AR.INVOICE.v1',
      'HERA.ERP.FI.AP.PAYMENT.v1',
      'HERA.ERP.FI.AR.RECEIPT.v1'
    ]
    
    if (!validSmartCodes.includes(transaction.smart_code)) {
      errors.push({
        field: 'smart_code',
        message: `Invalid smart code: ${transaction.smart_code}`,
        code: 'INVALID_SMART_CODE'
      })
    }
  }
  
  // Posting date validation
  private static validatePostingDate(
    transaction: UniversalTransaction,
    warnings: ValidationWarning[]
  ): void {
    const postingDate = new Date(transaction.posting_date || transaction.transaction_date)
    const today = new Date()
    
    // Warn if posting date is in the future
    if (postingDate > today) {
      warnings.push({
        field: 'posting_date',
        message: 'Posting date is in the future',
        code: 'FUTURE_POSTING_DATE'
      })
    }
    
    // Warn if posting date is too old (more than 90 days)
    const daysDiff = Math.floor((today.getTime() - postingDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 90) {
      warnings.push({
        field: 'posting_date',
        message: `Posting date is ${daysDiff} days in the past`,
        code: 'OLD_POSTING_DATE'
      })
    }
  }
  
  // Document type validation
  private static validateDocumentType(
    transaction: UniversalTransaction,
    errors: ValidationError[]
  ): void {
    // Validate based on smart code
    const smartCodeToDocType: Record<string, string[]> = {
      'HERA.ERP.FI.JE.POST.v1': ['SA', 'AB', 'DR'],
      'HERA.ERP.FI.AP.INVOICE.v1': ['KR', 'RE'],
      'HERA.ERP.FI.AR.INVOICE.v1': ['DR', 'RV']
    }
    
    const allowedTypes = smartCodeToDocType[transaction.smart_code]
    if (allowedTypes && transaction.metadata?.document_type) {
      if (!allowedTypes.includes(transaction.metadata.document_type)) {
        errors.push({
          field: 'document_type',
          message: `Invalid document type for ${transaction.smart_code}`,
          code: 'INVALID_DOC_TYPE'
        })
      }
    }
  }
  
  // AP Invoice specific validation
  private static validateAPInvoice(
    transaction: UniversalTransaction,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Vendor is required
    if (!transaction.source_entity_id) {
      errors.push({
        field: 'source_entity_id',
        message: 'Vendor is required for AP invoice',
        code: 'VENDOR_REQUIRED'
      })
    }
    
    // Invoice number recommended
    if (!transaction.metadata?.invoice_number) {
      warnings.push({
        field: 'invoice_number',
        message: 'Invoice number is recommended',
        code: 'INVOICE_NUMBER_MISSING'
      })
    }
    
    // Due date validation
    if (transaction.metadata?.due_date) {
      const dueDate = new Date(transaction.metadata.due_date)
      const invoiceDate = new Date(transaction.transaction_date)
      
      if (dueDate < invoiceDate) {
        errors.push({
          field: 'due_date',
          message: 'Due date cannot be before invoice date',
          code: 'INVALID_DUE_DATE'
        })
      }
    }
  }
  
  // AR Invoice specific validation
  private static validateARInvoice(
    transaction: UniversalTransaction,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Customer is required
    if (!transaction.source_entity_id) {
      errors.push({
        field: 'source_entity_id',
        message: 'Customer is required for AR invoice',
        code: 'CUSTOMER_REQUIRED'
      })
    }
    
    // Payment terms validation
    if (!transaction.metadata?.payment_terms) {
      warnings.push({
        field: 'payment_terms',
        message: 'Payment terms are recommended',
        code: 'PAYMENT_TERMS_MISSING'
      })
    }
  }
  
  // Duplicate check
  static async checkDuplicate(
    transaction: UniversalTransaction,
    existingTransactions: UniversalTransaction[]
  ): Promise<{
    isDuplicate: boolean
    confidence: number
    matches: UniversalTransaction[]
  }> {
    const matches: UniversalTransaction[] = []
    let maxConfidence = 0
    
    for (const existing of existingTransactions) {
      let confidence = 0
      
      // Same vendor/customer
      if (existing.source_entity_id === transaction.source_entity_id) {
        confidence += 0.3
      }
      
      // Same amount
      if (Math.abs(existing.total_amount - transaction.total_amount) < 0.01) {
        confidence += 0.3
      }
      
      // Same invoice number
      if (existing.metadata?.invoice_number === transaction.metadata?.invoice_number &&
          transaction.metadata?.invoice_number) {
        confidence += 0.4
      }
      
      // Close dates (within 7 days)
      const daysDiff = Math.abs(
        new Date(existing.transaction_date).getTime() - 
        new Date(transaction.transaction_date).getTime()
      ) / (1000 * 60 * 60 * 24)
      
      if (daysDiff < 7) {
        confidence += 0.1
      }
      
      if (confidence > 0.7) {
        matches.push(existing)
        maxConfidence = Math.max(maxConfidence, confidence)
      }
    }
    
    return {
      isDuplicate: maxConfidence > 0.85,
      confidence: maxConfidence,
      matches
    }
  }
}