import {
  BaseSAPConnector,
  SAPDocument,
  GLBalance,
  MasterDataResult,
  SAPIntegrationError
} from './base'
import { UniversalTransaction } from '@/src/types/hera-database.types'

export class S4HANACloudConnector extends BaseSAPConnector {
  private apiVersion = 'v1'

  // OAuth token management
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken
    }

    const tokenUrl = `${this.config.baseUrl}/oauth/token`
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${this.config.credentials.clientId}:${this.config.credentials.clientSecret}`
        ).toString('base64')}`
      },
      body: 'grant_type=client_credentials&scope=API_JOURNAL_ENTRY_SRV'
    })

    if (!response.ok) {
      throw new SAPIntegrationError('OAuth authentication failed', await response.json())
    }

    const tokenData = await response.json()
    this.accessToken = tokenData.access_token
    this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in - 60) * 1000)

    return this.accessToken!
  }

  // Headers for API calls
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken()
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'sap-client': this.config.client || '100',
      'sap-language': this.config.language || 'EN'
    }
  }

  // Post document to SAP
  async postDocument(transaction: UniversalTransaction): Promise<SAPDocument> {
    const url = `${this.config.baseUrl}/sap/opu/odata4/sap/api_journal_entry_srv/srvd_a2x/${this.apiVersion}/JournalEntry`

    // Map HERA transaction to S/4HANA format
    const sapPayload = {
      CompanyCode: this.config.companyCode,
      DocumentDate: transaction.transaction_date,
      PostingDate: transaction.posting_date || transaction.transaction_date,
      DocumentType: this.getDocumentType(transaction.smart_code),
      Reference: transaction.transaction_code,
      HeaderText: transaction.description || '',
      DocumentCurrency: transaction.currency || 'USD',
      JournalEntryItems: await this.mapTransactionItems(transaction)
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(sapPayload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new SAPIntegrationError(
          error.error?.message?.value || 'Document posting failed',
          error,
          this.isRetryableError(error)
        )
      }

      const result = await response.json()

      return {
        documentNumber: result.AccountingDocument,
        fiscalYear: result.FiscalYear,
        companyCode: result.CompanyCode,
        documentType: result.AccountingDocumentType,
        postingDate: result.PostingDate,
        reference: transaction.transaction_code,
        status: 'posted'
      }
    } catch (error) {
      return this.handleSAPError(error)
    }
  }

  // Reverse document
  async reverseDocument(documentNumber: string, reason: string): Promise<SAPDocument> {
    const url = `${this.config.baseUrl}/sap/opu/odata4/sap/api_journal_entry_srv/srvd_a2x/${this.apiVersion}/Reverse`

    const payload = {
      ReversalReason: reason,
      OriginalDocument: documentNumber,
      ReversalDate: new Date().toISOString().split('T')[0]
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new SAPIntegrationError('Document reversal failed', error)
    }

    const result = await response.json()

    return {
      documentNumber: result.ReversalDocument,
      fiscalYear: result.FiscalYear,
      companyCode: this.config.companyCode,
      documentType: result.DocumentType,
      postingDate: result.PostingDate,
      reference: `REV-${documentNumber}`,
      status: 'posted'
    }
  }

  // Park document (save as draft)
  async parkDocument(transaction: UniversalTransaction): Promise<SAPDocument> {
    // S/4HANA Cloud uses a different endpoint for parked documents
    const url = `${this.config.baseUrl}/sap/opu/odata4/sap/api_parked_journal_entry_srv/srvd_a2x/${this.apiVersion}/ParkedJournalEntry`

    const sapPayload = this.mapTransactionToSAP(transaction)
    sapPayload.IsParked = true

    const response = await fetch(url, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(sapPayload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new SAPIntegrationError('Document parking failed', error)
    }

    const result = await response.json()

    return {
      documentNumber: result.ParkedDocument,
      fiscalYear: result.FiscalYear,
      companyCode: this.config.companyCode,
      documentType: result.DocumentType,
      postingDate: result.PostingDate,
      reference: transaction.transaction_code,
      status: 'parked'
    }
  }

  // Sync master data
  async syncMasterData(entityType: string): Promise<MasterDataResult> {
    const endpoints: Record<string, string> = {
      gl_account: '/GLAccountInChartOfAccounts',
      cost_center: '/CostCenter',
      profit_center: '/ProfitCenter',
      customer: '/BusinessPartner',
      vendor: '/Supplier'
    }

    const endpoint = endpoints[entityType]
    if (!endpoint) {
      throw new Error(`Unsupported entity type: ${entityType}`)
    }

    const url = `${this.config.baseUrl}/sap/opu/odata4/sap/api_business_partner_srv/srvd_a2x/${this.apiVersion}${endpoint}`

    const response = await fetch(url, {
      headers: await this.getHeaders()
    })

    if (!response.ok) {
      throw new SAPIntegrationError('Master data sync failed', await response.json())
    }

    const data = await response.json()
    const records = data.value || []

    return {
      entityType,
      recordsSync: records.length,
      recordsFailed: 0,
      errors: [],
      lastSyncTime: new Date()
    }
  }

  // Get specific master data record
  async getMasterDataRecord(entityType: string, key: string): Promise<any> {
    const endpoints: Record<string, string> = {
      gl_account: `/GLAccountInChartOfAccounts('${key}')`,
      cost_center: `/CostCenter('${key}')`,
      customer: `/BusinessPartner('${key}')`
    }

    const endpoint = endpoints[entityType]
    const url = `${this.config.baseUrl}/sap/opu/odata4/sap/api_business_partner_srv/srvd_a2x/${this.apiVersion}${endpoint}`

    const response = await fetch(url, {
      headers: await this.getHeaders()
    })

    if (!response.ok) {
      throw new SAPIntegrationError('Master data fetch failed', await response.json())
    }

    return await response.json()
  }

  // Get GL balance
  async getBalance(glAccount: string, period: string): Promise<GLBalance> {
    const url = `${this.config.baseUrl}/sap/opu/odata4/sap/api_glaccountbalance_srv/srvd_a2x/${this.apiVersion}/GLAccountBalance`
    const params = new URLSearchParams({
      GLAccount: glAccount,
      CompanyCode: this.config.companyCode,
      FiscalYear: new Date().getFullYear().toString(),
      FiscalPeriod: period
    })

    const response = await fetch(`${url}?${params}`, {
      headers: await this.getHeaders()
    })

    if (!response.ok) {
      throw new SAPIntegrationError('Balance fetch failed', await response.json())
    }

    const data = await response.json()
    const balance = data.value?.[0] || {}

    return {
      glAccount,
      companyCode: this.config.companyCode,
      fiscalYear: balance.FiscalYear,
      period: balance.FiscalPeriod,
      debitBalance: parseFloat(balance.DebitAmountInCompanyCodeCurrency || 0),
      creditBalance: parseFloat(balance.CreditAmountInCompanyCodeCurrency || 0),
      balance: parseFloat(balance.EndingBalanceInCompanyCodeCurrency || 0),
      currency: balance.CompanyCodeCurrency || 'USD'
    }
  }

  // Get open items
  async getOpenItems(accountType: 'customer' | 'vendor', accountId: string): Promise<any[]> {
    const endpoint = accountType === 'customer' ? 'CustomerOpenItem' : 'SupplierOpenItem'

    const url = `${this.config.baseUrl}/sap/opu/odata4/sap/api_openitems_srv/srvd_a2x/${this.apiVersion}/${endpoint}`
    const params = new URLSearchParams({
      CompanyCode: this.config.companyCode,
      [accountType === 'customer' ? 'Customer' : 'Supplier']: accountId
    })

    const response = await fetch(`${url}?${params}`, {
      headers: await this.getHeaders()
    })

    if (!response.ok) {
      throw new SAPIntegrationError('Open items fetch failed', await response.json())
    }

    const data = await response.json()
    return data.value || []
  }

  // Get document details
  async getDocument(documentNumber: string, fiscalYear: string): Promise<any> {
    const url = `${this.config.baseUrl}/sap/opu/odata4/sap/api_journal_entry_srv/srvd_a2x/${this.apiVersion}/JournalEntry`
    const params = new URLSearchParams({
      AccountingDocument: documentNumber,
      FiscalYear: fiscalYear,
      CompanyCode: this.config.companyCode
    })

    const response = await fetch(`${url}?${params}`, {
      headers: await this.getHeaders()
    })

    if (!response.ok) {
      throw new SAPIntegrationError('Document fetch failed', await response.json())
    }

    return await response.json()
  }

  // Validate connection
  async validateConnection(): Promise<boolean> {
    try {
      await this.getAccessToken()

      // Try to fetch company code details
      const url = `${this.config.baseUrl}/sap/opu/odata4/sap/api_companycode_srv/srvd_a2x/${this.apiVersion}/CompanyCode('${this.config.companyCode}')`

      const response = await fetch(url, {
        headers: await this.getHeaders()
      })

      return response.ok
    } catch {
      return false
    }
  }

  // Get system info
  async getSystemInfo(): Promise<any> {
    const url = `${this.config.baseUrl}/sap/opu/odata4/sap/api_companycode_srv/srvd_a2x/${this.apiVersion}/CompanyCode('${this.config.companyCode}')`

    const response = await fetch(url, {
      headers: await this.getHeaders()
    })

    if (!response.ok) {
      throw new SAPIntegrationError('System info fetch failed', await response.json())
    }

    const companyData = await response.json()

    return {
      systemType: 'S/4HANA Cloud',
      companyCode: companyData.CompanyCode,
      companyName: companyData.CompanyCodeName,
      currency: companyData.Currency,
      chartOfAccounts: companyData.ChartOfAccounts,
      fiscalYearVariant: companyData.FiscalYearVariant
    }
  }

  // Helper methods
  private getDocumentType(smartCode: string): string {
    const mapping: Record<string, string> = {
      'HERA.ERP.FI.JE.POST.v1': 'SA',
      'HERA.ERP.FI.AP.INVOICE.v1': 'KR',
      'HERA.ERP.FI.AR.INVOICE.v1': 'DR',
      'HERA.ERP.FI.AP.PAYMENT.v1': 'KZ',
      'HERA.ERP.FI.AR.RECEIPT.v1': 'DZ'
    }
    return mapping[smartCode] || 'SA'
  }

  private async mapTransactionItems(transaction: UniversalTransaction): Promise<any[]> {
    // Fetch transaction lines
    const lines = transaction.universal_transaction_lines || []

    return lines.map((line, index) => ({
      GLAccount: line.gl_account_code,
      AmountInTransactionCurrency: line.debit_amount
        ? line.debit_amount
        : -Math.abs(line.credit_amount || 0),
      DebitCreditCode: line.debit_amount ? 'S' : 'H', // S=Debit, H=Credit in SAP
      DocumentItemText: line.description || '',
      CostCenter: line.cost_center,
      ProfitCenter: line.profit_center,
      TaxCode: line.tax_code || '',
      Assignment: line.reference || '',
      ItemNumber: index + 1
    }))
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'POSTING_PERIOD_CLOSED',
      'TIMEOUT',
      'SERVICE_UNAVAILABLE',
      'RATE_LIMIT_EXCEEDED'
    ]
    return retryableCodes.includes(error.code)
  }
}
