import { UniversalTransaction, UniversalTransactionLine } from '@/types/hera-database.types'

// SAP Document Types
export interface SAPDocument {
  documentNumber: string
  fiscalYear: string
  companyCode: string
  documentType: string
  postingDate: string
  reference: string
  headerText?: string
  status: 'posted' | 'parked' | 'error'
  sapSystemId?: string
  errorMessage?: string
}

// GL Balance Response
export interface GLBalance {
  glAccount: string
  companyCode: string
  fiscalYear: string
  period: string
  debitBalance: number
  creditBalance: number
  balance: number
  currency: string
}

// Master Data Result
export interface MasterDataResult {
  entityType: string
  recordsSync: number
  recordsFailed: number
  errors: Array<{ record: string; error: string }>
  lastSyncTime: Date
}

// SAP Configuration
export interface SAPConfig {
  organizationId: string
  systemType: 'S4HANA_CLOUD' | 'S4HANA_ONPREM' | 'ECC' | 'B1'
  baseUrl?: string
  host?: string
  client?: string
  systemNumber?: string
  credentials: {
    type: 'oauth' | 'basic' | 'certificate'
    clientId?: string
    clientSecret?: string
    username?: string
    password?: string
    certificatePath?: string
  }
  companyCode: string
  chartOfAccounts: string
  language?: string
}

// Universal SAP Connector Interface
export interface ISAPConnector {
  // Document Posting
  postDocument(transaction: UniversalTransaction): Promise<SAPDocument>
  reverseDocument(documentNumber: string, reason: string): Promise<SAPDocument>
  parkDocument(transaction: UniversalTransaction): Promise<SAPDocument>

  // Master Data
  syncMasterData(entityType: string): Promise<MasterDataResult>
  getMasterDataRecord(entityType: string, key: string): Promise<any>

  // Queries
  getBalance(glAccount: string, period: string): Promise<GLBalance>
  getOpenItems(accountType: 'customer' | 'vendor', accountId: string): Promise<any[]>
  getDocument(documentNumber: string, fiscalYear: string): Promise<any>

  // Utilities
  validateConnection(): Promise<boolean>
  getSystemInfo(): Promise<any>
}

// Base Connector with common functionality
export abstract class BaseSAPConnector implements ISAPConnector {
  protected config: SAPConfig
  protected accessToken?: string
  protected tokenExpiry?: Date

  constructor(config: SAPConfig) {
    this.config = config
  }

  // Abstract methods to be implemented by specific connectors
  abstract postDocument(transaction: UniversalTransaction): Promise<SAPDocument>
  abstract reverseDocument(documentNumber: string, reason: string): Promise<SAPDocument>
  abstract parkDocument(transaction: UniversalTransaction): Promise<SAPDocument>
  abstract syncMasterData(entityType: string): Promise<MasterDataResult>
  abstract getMasterDataRecord(entityType: string, key: string): Promise<any>
  abstract getBalance(glAccount: string, period: string): Promise<GLBalance>
  abstract getOpenItems(accountType: 'customer' | 'vendor', accountId: string): Promise<any[]>
  abstract getDocument(documentNumber: string, fiscalYear: string): Promise<any>
  abstract validateConnection(): Promise<boolean>
  abstract getSystemInfo(): Promise<any>

  // Common helper methods
  protected mapTransactionToSAP(transaction: UniversalTransaction): any {
    // Map HERA transaction to SAP format
    const sapDoc: any = {
      CompanyCode: this.config.companyCode,
      DocumentDate: transaction.transaction_date,
      PostingDate: transaction.posting_date || transaction.transaction_date,
      Reference: transaction.transaction_code,
      HeaderText: transaction.description || '',
      DocumentCurrency: transaction.currency || 'USD'
    }

    // Map based on Smart Code
    const docTypeMapping: Record<string, string> = {
      'HERA.ERP.FI.JE.POST.v1': 'SA',
      'HERA.ERP.FI.AP.INVOICE.v1': 'KR',
      'HERA.ERP.FI.AR.INVOICE.v1': 'DR',
      'HERA.ERP.FI.AP.PAYMENT.v1': 'KZ',
      'HERA.ERP.FI.AR.RECEIPT.v1': 'DZ'
    }

    sapDoc.DocumentType = docTypeMapping[transaction.smart_code] || 'SA'

    return sapDoc
  }

  protected mapTransactionLines(lines: UniversalTransactionLine[]): any[] {
    return lines.map((line, index) => ({
      ItemNumber: index + 1,
      GLAccount: line.gl_account_code,
      Amount: line.debit_amount || -line.credit_amount,
      CostCenter: line.cost_center,
      ProfitCenter: line.profit_center,
      ItemText: line.description || '',
      TaxCode: line.tax_code
    }))
  }

  protected handleSAPError(error: any): never {
    // Standardize error handling across connectors
    const errorMessage = error.message || error.toString()
    const sapError = {
      code: error.code || 'UNKNOWN',
      message: errorMessage,
      details: error.details || {}
    }

    throw new SAPIntegrationError(errorMessage, sapError)
  }
}

// Custom Error Class
export class SAPIntegrationError extends Error {
  public sapError: any
  public retryable: boolean

  constructor(message: string, sapError: any, retryable: boolean = false) {
    super(message)
    this.name = 'SAPIntegrationError'
    this.sapError = sapError
    this.retryable = retryable
  }
}
