/**
 * 🔐 HERA COA and Document Number Enforcement System
 * Smart Code: HERA.CORE.ENFORCEMENT.COA.DOCUMENT.v1
 * 
 * Ensures ALL transactions always use proper COA and document numbering
 */

interface DocumentNumberConfig {
  prefix: string
  sequence: 'timestamp' | 'sequential' | 'uuid'
  format: string
  zeropad?: number
}

interface COAValidationResult {
  valid: boolean
  errors: string[]
  missing_accounts: string[]
  organization_has_coa: boolean
}

interface DocumentNumberResult {
  transaction_code: string
  reference_number: string
  external_reference?: string
}

export class COADocumentEnforcer {
  private organizationId: string
  private businessType: string

  constructor(organizationId: string, businessType: string = 'universal') {
    this.organizationId = organizationId
    this.businessType = businessType
  }

  /**
   * 🔐 ENFORCE: Validate COA exists for organization
   */
  async validateCOAExists(): Promise<COAValidationResult> {
    try {
      const response = await fetch('/api/v1/universal', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'read',
          table: 'core_entities',
          filters: {
            organization_id: this.organizationId,
            entity_type: 'gl_account'
          },
          limit: 1
        })
      })

      const result = await response.json()
      
      if (!result.success || !result.data || result.data.length === 0) {
        return {
          valid: false,
          errors: ['No Chart of Accounts found for organization'],
          missing_accounts: [],
          organization_has_coa: false
        }
      }

      // Check for minimum required accounts
      const requiredAccounts = this.getRequiredAccountsByBusinessType()
      const existingAccounts = await this.getExistingGLAccounts()
      const missingAccounts = requiredAccounts.filter(
        req => !existingAccounts.some(existing => 
          existing.entity_code.startsWith(req.prefix)
        )
      )

      return {
        valid: missingAccounts.length === 0,
        errors: missingAccounts.length > 0 ? 
          [`Missing required account categories: ${missingAccounts.map(m => m.name).join(', ')}`] : [],
        missing_accounts: missingAccounts.map(m => m.name),
        organization_has_coa: true
      }

    } catch (error) {
      return {
        valid: false,
        errors: [`COA validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        missing_accounts: [],
        organization_has_coa: false
      }
    }
  }

  /**
   * 🔐 ENFORCE: Generate document numbers with business intelligence
   */
  generateDocumentNumbers(transactionType: string): DocumentNumberResult {
    const timestamp = Date.now()
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    const config = this.getDocumentNumberConfig(transactionType)
    
    let transactionNumber: string
    let referenceNumber: string

    // Generate system transaction number
    switch (config.sequence) {
      case 'timestamp':
        transactionNumber = `TXN-${timestamp}`
        break
      case 'sequential':
        transactionNumber = `${config.prefix}-${year}-${this.getNextSequence(transactionType, year)}`
        break
      case 'uuid':
        transactionNumber = `${config.prefix}-${crypto.randomUUID().split('-')[0]}`
        break
      default:
        transactionNumber = `TXN-${timestamp}`
    }

    // Generate business reference number
    switch (transactionType.toLowerCase()) {
      case 'journal_entry':
        referenceNumber = `JE-${year}-${month}-${this.getNextJournalSequence()}`
        break
      case 'sale':
        referenceNumber = `INV-${year}${month}${day}-${this.getNextSalesSequence()}`
        break
      case 'purchase':
        referenceNumber = `PO-${year}-${this.getNextPurchaseSequence()}`
        break
      case 'payment':
        referenceNumber = `PAY-${year}${month}-${this.getNextPaymentSequence()}`
        break
      case 'receipt':
        referenceNumber = `RCP-${year}${month}-${this.getNextReceiptSequence()}`
        break
      default:
        referenceNumber = `DOC-${year}${month}${day}-${timestamp.toString().slice(-4)}`
    }

    return {
      transaction_code: transactionNumber,
      reference_number: referenceNumber,
      external_reference: `${this.businessType.toUpperCase()}-${timestamp}`
    }
  }

  /**
   * 🔐 ENFORCE: Validate GL accounts in transaction lines
   */
  async validateGLAccountsInLines(lineItems: any[]): Promise<{valid: boolean, errors: string[]}> {
    const errors: string[] = []

    for (const line of lineItems) {
      // Check if GL account is provided
      if (!line.gl_account_code && !line.entity_id) {
        errors.push(`Line ${line.line_number || 'unknown'}: No GL account specified`)
        continue
      }

      // Validate GL account exists in organization's COA
      if (line.gl_account_code) {
        const accountExists = await this.validateGLAccountExists(line.gl_account_code)
        if (!accountExists) {
          errors.push(`Line ${line.line_number || 'unknown'}: GL account ${line.gl_account_code} not found in COA`)
        }
      }

      // Validate entity_id points to valid GL account
      if (line.entity_id) {
        const entityIsGLAccount = await this.validateEntityIsGLAccount(line.entity_id)
        if (!entityIsGLAccount) {
          errors.push(`Line ${line.line_number || 'unknown'}: Entity ${line.entity_id} is not a GL account`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 🔐 ENFORCE: Auto-assign GL accounts based on smart codes
   */
  async autoAssignGLAccounts(transactionType: string, smartCode: string, lineItems: any[]): Promise<any[]> {
    const enhancedLines = []

    for (const line of lineItems) {
      let glAccountCode = line.gl_account_code
      let entityId = line.entity_id

      // Auto-assign if not provided
      if (!glAccountCode && !entityId) {
        const autoAssignment = await this.determineGLAccountFromSmartCode(
          transactionType, 
          smartCode, 
          line.description || '',
          line.line_type || 'DEBIT'
        )
        
        glAccountCode = autoAssignment.account_code
        entityId = autoAssignment.entity_id
      }

      enhancedLines.push({
        ...line,
        gl_account_code: glAccountCode,
        entity_id: entityId,
        smart_code: line.smart_code || this.generateLineSmartCode(transactionType, glAccountCode)
      })
    }

    return enhancedLines
  }

  // Private helper methods

  private getRequiredAccountsByBusinessType() {
    const universal = [
      { prefix: '11', name: 'Cash and Bank Accounts' },
      { prefix: '21', name: 'Accounts Payable' },
      { prefix: '41', name: 'Revenue Accounts' },
      { prefix: '51', name: 'Operating Expenses' }
    ]

    const businessSpecific = {
      salon: [
        { prefix: '4110', name: 'Service Revenue' },
        { prefix: '2400', name: 'VAT Payable' },
        { prefix: '5110', name: 'Commission Expense' }
      ],
      restaurant: [
        { prefix: '4110', name: 'Food Sales' },
        { prefix: '5210', name: 'Cost of Food Sales' },
        { prefix: '2400', name: 'Sales Tax Payable' }
      ],
      healthcare: [
        { prefix: '4210', name: 'Patient Service Revenue' },
        { prefix: '1210', name: 'Patient Receivables' },
        { prefix: '2310', name: 'Insurance Payables' }
      ]
    }

    return [...universal, ...(businessSpecific[this.businessType as keyof typeof businessSpecific] || [])]
  }

  private async getExistingGLAccounts() {
    const response = await fetch('/api/v1/universal', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'read',
        table: 'core_entities',
        filters: {
          organization_id: this.organizationId,
          entity_type: 'gl_account'
        }
      })
    })

    const result = await response.json()
    return result.data || []
  }

  private getDocumentNumberConfig(transactionType: string): DocumentNumberConfig {
    const configs: Record<string, DocumentNumberConfig> = {
      journal_entry: { prefix: 'JE', sequence: 'sequential', format: 'JE-YYYY-MM-NNN', zeropad: 3 },
      sale: { prefix: 'INV', sequence: 'sequential', format: 'INV-YYYYMMDD-NNN', zeropad: 3 },
      purchase: { prefix: 'PO', sequence: 'sequential', format: 'PO-YYYY-NNNN', zeropad: 4 },
      payment: { prefix: 'PAY', sequence: 'sequential', format: 'PAY-YYYYMM-NNN', zeropad: 3 },
      receipt: { prefix: 'RCP', sequence: 'sequential', format: 'RCP-YYYYMM-NNN', zeropad: 3 }
    }

    return configs[transactionType] || { prefix: 'DOC', sequence: 'timestamp', format: 'DOC-timestamp' }
  }

  private getNextSequence(type: string, year: number): string {
    // In production, this would query the database for the next sequence
    // For now, return a timestamp-based sequence
    return String(Date.now()).slice(-4).padStart(3, '0')
  }

  private getNextJournalSequence(): string {
    return String(Date.now()).slice(-3).padStart(3, '0')
  }

  private getNextSalesSequence(): string {
    return String(Date.now()).slice(-3).padStart(3, '0')
  }

  private getNextPurchaseSequence(): string {
    return String(Date.now()).slice(-4).padStart(4, '0')
  }

  private getNextPaymentSequence(): string {
    return String(Date.now()).slice(-3).padStart(3, '0')
  }

  private getNextReceiptSequence(): string {
    return String(Date.now()).slice(-3).padStart(3, '0')
  }

  private async validateGLAccountExists(accountCode: string): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/universal', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'read',
          table: 'core_entities',
          filters: {
            organization_id: this.organizationId,
            entity_type: 'gl_account',
            entity_code: accountCode
          },
          limit: 1
        })
      })

      const result = await response.json()
      return result.success && result.data && result.data.length > 0
    } catch {
      return false
    }
  }

  private async validateEntityIsGLAccount(entityId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/universal', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'read',
          table: 'core_entities',
          filters: {
            id: entityId,
            organization_id: this.organizationId,
            entity_type: 'gl_account'
          },
          limit: 1
        })
      })

      const result = await response.json()
      return result.success && result.data && result.data.length > 0
    } catch {
      return false
    }
  }

  private async determineGLAccountFromSmartCode(
    transactionType: string, 
    smartCode: string, 
    description: string, 
    lineType: string
  ) {
    // Smart code-based GL account determination
    const smartCodeMappings = {
      'HERA.SALON.SALE': {
        'DEBIT': { account_code: '1100000', account_type: 'cash' },
        'CREDIT': { account_code: '4110000', account_type: 'service_revenue' }
      },
      'HERA.RESTAURANT.SALE': {
        'DEBIT': { account_code: '1100000', account_type: 'cash' },
        'CREDIT': { account_code: '4110000', account_type: 'food_sales' }
      },
      'HERA.EXPENSE': {
        'DEBIT': { account_code: '5130000', account_type: 'operating_expense' },
        'CREDIT': { account_code: '2100000', account_type: 'accounts_payable' }
      }
    }

    // Find matching smart code pattern
    const smartCodePrefix = smartCode.split('.').slice(0, 3).join('.')
    const mapping = smartCodeMappings[smartCodePrefix as keyof typeof smartCodeMappings]
    
    if (mapping && mapping[lineType as keyof typeof mapping]) {
      const accountInfo = mapping[lineType as keyof typeof mapping] as any
      
      // Find the actual entity_id for this account
      const accountEntity = await this.findGLAccountByCode(accountInfo.account_code)
      
      return {
        account_code: accountInfo.account_code,
        entity_id: accountEntity?.id || null,
        account_type: accountInfo.account_type
      }
    }

    // Fallback to default accounts
    return {
      account_code: lineType === 'DEBIT' ? '1100000' : '4110000',
      entity_id: null,
      account_type: 'auto_assigned'
    }
  }

  private async findGLAccountByCode(accountCode: string) {
    const accounts = await this.getExistingGLAccounts()
    return accounts.find((acc: any) => acc.entity_code === accountCode)
  }

  private generateLineSmartCode(transactionType: string, accountCode: string): string {
    const accountType = this.getAccountTypeFromCode(accountCode)
    return `HERA.${this.businessType.toUpperCase()}.GL.${accountType.toUpperCase()}.${accountCode}.v1`
  }

  private getAccountTypeFromCode(accountCode: string): string {
    const firstDigit = accountCode.charAt(0)
    const mapping = {
      '1': 'asset',
      '2': 'liability', 
      '3': 'equity',
      '4': 'revenue',
      '5': 'expense'
    }
    return mapping[firstDigit as keyof typeof mapping] || 'unknown'
  }
}

/**
 * 🔐 UNIVERSAL ENFORCEMENT MIDDLEWARE
 * Use this in ALL transaction creation workflows
 */
export async function enforceTransactionStandards(
  organizationId: string,
  transactionType: string,
  businessType: string,
  lineItems: any[] = []
): Promise<{
  valid: boolean
  errors: string[]
  documentNumbers: DocumentNumberResult | null
  enhancedLines: any[]
}> {
  const enforcer = new COADocumentEnforcer(organizationId, businessType)
  
  // 1. Validate COA exists
  const coaValidation = await enforcer.validateCOAExists()
  if (!coaValidation.valid) {
    return {
      valid: false,
      errors: coaValidation.errors,
      documentNumbers: null,
      enhancedLines: []
    }
  }

  // 2. Generate document numbers
  const documentNumbers = enforcer.generateDocumentNumbers(transactionType)

  // 3. Validate and enhance GL accounts in lines
  let enhancedLines = lineItems
  if (lineItems.length > 0) {
    const lineValidation = await enforcer.validateGLAccountsInLines(lineItems)
    if (!lineValidation.valid) {
      return {
        valid: false,
        errors: lineValidation.errors,
        documentNumbers,
        enhancedLines: []
      }
    }

    // Auto-assign GL accounts where missing
    enhancedLines = await enforcer.autoAssignGLAccounts(
      transactionType,
      `HERA.${businessType.toUpperCase()}.${transactionType.toUpperCase()}.v1`,
      lineItems
    )
  }

  return {
    valid: true,
    errors: [],
    documentNumbers,
    enhancedLines
  }
}