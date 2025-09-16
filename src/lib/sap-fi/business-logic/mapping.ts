import { UniversalTransaction, UniversalTransactionLine } from '@/src/types/hera-database.types'

// SAP Document structure
export interface SAPDocumentHeader {
  CompanyCode: string
  DocumentDate: string
  PostingDate: string
  DocumentType: string
  Reference: string
  HeaderText: string
  DocumentCurrency: string
  ExchangeRate?: number
  TransactionType?: string
}

export interface SAPDocumentLine {
  ItemNumber: number
  GLAccount?: string
  Customer?: string
  Vendor?: string
  Amount: number
  DebitCreditCode: 'S' | 'H' // S=Debit, H=Credit
  CostCenter?: string
  ProfitCenter?: string
  TaxCode?: string
  ItemText?: string
  Assignment?: string
  DueDate?: string
  PaymentTerms?: string
}

export class SAPMappingService {
  // Document type mapping
  private static readonly DOC_TYPE_MAP: Record<string, string> = {
    'HERA.ERP.FI.JE.POST.v1': 'SA',
    'HERA.ERP.FI.JE.REVERSE.v1': 'SA',
    'HERA.ERP.FI.JE.RECURRING.v1': 'SA',
    'HERA.ERP.FI.AP.INVOICE.v1': 'KR',
    'HERA.ERP.FI.AP.PAYMENT.v1': 'KZ',
    'HERA.ERP.FI.AP.CREDIT.v1': 'KG',
    'HERA.ERP.FI.AR.INVOICE.v1': 'DR',
    'HERA.ERP.FI.AR.RECEIPT.v1': 'DZ',
    'HERA.ERP.FI.AR.CREDIT.v1': 'DG'
  }

  // Map HERA transaction to SAP format
  static mapToSAPDocument(
    transaction: UniversalTransaction,
    lines: UniversalTransactionLine[],
    companyCode: string
  ): { header: SAPDocumentHeader; lines: SAPDocumentLine[] } {
    const header = this.mapHeader(transaction, companyCode)
    const sapLines = this.mapLines(transaction, lines)

    return { header, lines: sapLines }
  }

  // Map transaction header
  private static mapHeader(
    transaction: UniversalTransaction,
    companyCode: string
  ): SAPDocumentHeader {
    return {
      CompanyCode: companyCode,
      DocumentDate: this.formatDate(transaction.transaction_date),
      PostingDate: this.formatDate(transaction.posting_date || transaction.transaction_date),
      DocumentType: this.DOC_TYPE_MAP[transaction.smart_code] || 'SA',
      Reference: transaction.transaction_code,
      HeaderText: transaction.description || '',
      DocumentCurrency: transaction.currency || 'USD',
      ExchangeRate: (transaction.metadata as any)?.exchange_rate,
      TransactionType: transaction.transaction_type
    }
  }

  // Map transaction lines
  private static mapLines(
    transaction: UniversalTransaction,
    lines: UniversalTransactionLine[]
  ): SAPDocumentLine[] {
    const sapLines: SAPDocumentLine[] = []

    // Handle different transaction types
    if (transaction.smart_code.includes('.AP.INVOICE.')) {
      sapLines.push(...this.mapAPInvoiceLines(transaction, lines))
    } else if (transaction.smart_code.includes('.AR.INVOICE.')) {
      sapLines.push(...this.mapARInvoiceLines(transaction, lines))
    } else if (transaction.smart_code.includes('.JE.')) {
      sapLines.push(...this.mapJournalEntryLines(lines))
    } else {
      // Default mapping
      sapLines.push(...this.mapDefaultLines(lines))
    }

    return sapLines
  }

  // Map AP Invoice lines
  private static mapAPInvoiceLines(
    transaction: UniversalTransaction,
    lines: UniversalTransactionLine[]
  ): SAPDocumentLine[] {
    const sapLines: SAPDocumentLine[] = []

    // Vendor line (credit)
    const vendorTotal = lines.reduce((sum, line) => sum + (line.line_amount || 0), 0)
    sapLines.push({
      ItemNumber: 1,
      Vendor: transaction.source_entity_id,
      Amount: vendorTotal,
      DebitCreditCode: 'H', // Credit
      ItemText: transaction.description || 'Vendor invoice',
      DueDate: (transaction.metadata as any)?.due_date,
      PaymentTerms: (transaction.metadata as any)?.payment_terms
    })

    // GL lines (debit)
    lines.forEach((line, index) => {
      sapLines.push({
        ItemNumber: index + 2,
        GLAccount: line.gl_account_code,
        Amount: line.line_amount || 0,
        DebitCreditCode: 'S', // Debit
        CostCenter: line.cost_center,
        ProfitCenter: line.profit_center,
        TaxCode: line.tax_code,
        ItemText: line.description || '',
        Assignment: line.reference
      })
    })

    return sapLines
  }

  // Map AR Invoice lines
  private static mapARInvoiceLines(
    transaction: UniversalTransaction,
    lines: UniversalTransactionLine[]
  ): SAPDocumentLine[] {
    const sapLines: SAPDocumentLine[] = []

    // Customer line (debit)
    const customerTotal = lines.reduce((sum, line) => sum + (line.line_amount || 0), 0)
    sapLines.push({
      ItemNumber: 1,
      Customer: transaction.source_entity_id,
      Amount: customerTotal,
      DebitCreditCode: 'S', // Debit
      ItemText: transaction.description || 'Customer invoice',
      DueDate: (transaction.metadata as any)?.due_date,
      PaymentTerms: (transaction.metadata as any)?.payment_terms
    })

    // GL lines (credit)
    lines.forEach((line, index) => {
      sapLines.push({
        ItemNumber: index + 2,
        GLAccount: line.gl_account_code,
        Amount: line.line_amount || 0,
        DebitCreditCode: 'H', // Credit
        CostCenter: line.cost_center,
        ProfitCenter: line.profit_center,
        TaxCode: line.tax_code,
        ItemText: line.description || '',
        Assignment: line.reference
      })
    })

    return sapLines
  }

  // Map Journal Entry lines
  private static mapJournalEntryLines(lines: UniversalTransactionLine[]): SAPDocumentLine[] {
    return lines.map((line, index) => ({
      ItemNumber: index + 1,
      GLAccount: line.gl_account_code,
      Amount: line.debit_amount || line.credit_amount || 0,
      DebitCreditCode: line.debit_amount ? 'S' : 'H',
      CostCenter: line.cost_center,
      ProfitCenter: line.profit_center,
      TaxCode: line.tax_code,
      ItemText: line.description || '',
      Assignment: line.reference
    }))
  }

  // Default line mapping
  private static mapDefaultLines(lines: UniversalTransactionLine[]): SAPDocumentLine[] {
    return lines.map((line, index) => ({
      ItemNumber: index + 1,
      GLAccount: line.gl_account_code,
      Amount: Math.abs(line.line_amount || line.debit_amount || line.credit_amount || 0),
      DebitCreditCode: (line.debit_amount || line.line_amount || 0) > 0 ? 'S' : 'H',
      CostCenter: line.cost_center,
      ProfitCenter: line.profit_center,
      TaxCode: line.tax_code,
      ItemText: line.description || '',
      Assignment: line.reference
    }))
  }

  // Map SAP response back to HERA format
  static mapFromSAPDocument(sapDoc: any): Partial<UniversalTransaction> {
    return {
      metadata: {
        sap_document_number: sapDoc.AccountingDocument,
        sap_fiscal_year: sapDoc.FiscalYear,
        sap_company_code: sapDoc.CompanyCode,
        sap_document_type: sapDoc.AccountingDocumentType,
        sap_posting_date: sapDoc.PostingDate,
        sap_created_by: sapDoc.CreatedByUser,
        sap_creation_date: sapDoc.CreationDate
      },
      transaction_status: 'posted'
    }
  }

  // Utility functions
  private static formatDate(date: string | Date): string {
    const d = new Date(date)
    return d.toISOString().split('T')[0] // YYYY-MM-DD format
  }

  // Regional specific mappings
  static applyRegionalMapping(sapDoc: any, region: string): any {
    switch (region) {
      case 'IN': // India
        return this.applyIndiaMapping(sapDoc)
      case 'EU': // Europe
        return this.applyEUMapping(sapDoc)
      case 'US': // United States
        return this.applyUSMapping(sapDoc)
      default:
        return sapDoc
    }
  }

  private static applyIndiaMapping(sapDoc: any): any {
    // Add GST specific fields
    if (sapDoc.lines) {
      sapDoc.lines.forEach((line: any) => {
        if (line.TaxCode && line.TaxCode.startsWith('GST')) {
          line.GSTTaxCode = line.TaxCode
          line.HSNCode = line.HSNCode || '9999'
          line.PlaceOfSupply = line.PlaceOfSupply || 'IN'
        }
      })
    }
    return sapDoc
  }

  private static applyEUMapping(sapDoc: any): any {
    // Add VAT specific fields
    if (sapDoc.lines) {
      sapDoc.lines.forEach((line: any) => {
        if (line.TaxCode && line.TaxCode.includes('VAT')) {
          line.VATRegistrationNumber = line.VATRegistrationNumber
          line.IntrastatCode = line.IntrastatCode
        }
      })
    }
    return sapDoc
  }

  private static applyUSMapping(sapDoc: any): any {
    // Add US sales tax fields
    if (sapDoc.lines) {
      sapDoc.lines.forEach((line: any) => {
        if (line.TaxCode && line.TaxCode.includes('SALES')) {
          line.StateTaxCode = line.StateTaxCode
          line.TaxJurisdiction = line.TaxJurisdiction
        }
      })
    }
    return sapDoc
  }
}
