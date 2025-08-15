/**
 * IFRS Validation and Rollup Functions
 * Validates IFRS compliance and provides rollup calculations
 * Smart Code: HERA.GLOBAL.IFRS.VALIDATION.ROLLUP.v1
 */

export interface IFRSValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  compliance_score: number
}

export interface IFRSRollupResult {
  account_code: string
  account_name: string
  balance: number
  children: IFRSRollupResult[]
  level: number
  ifrs_statement: 'SFP' | 'SPL' | 'SCE' | 'SCF' | 'NOTES'
  ifrs_subcategory: string
}

export class IFRSValidator {
  
  /**
   * Validate IFRS compliance for a Chart of Accounts
   */
  static validateIFRSCompliance(accounts: any[]): IFRSValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    let validationScore = 100

    // Check mandatory IFRS fields
    const mandatoryFields = [
      'ifrs_classification',
      'parent_account',
      'account_level',
      'ifrs_category',
      'presentation_order',
      'is_header',
      'rollup_account'
    ]

    accounts.forEach(account => {
      // Check mandatory fields
      mandatoryFields.forEach(field => {
        if (account[field] === undefined || account[field] === null) {
          errors.push(`Account ${account.entity_code}: Missing mandatory IFRS field '${field}'`)
          validationScore -= 2
        }
      })

      // Validate account level hierarchy
      if (account.account_level && (account.account_level < 1 || account.account_level > 5)) {
        errors.push(`Account ${account.entity_code}: Invalid account level ${account.account_level}. Must be 1-5`)
        validationScore -= 3
      }

      // Validate parent account relationships
      if (account.parent_account && account.parent_account !== '') {
        const parentExists = accounts.some(acc => acc.entity_code === account.parent_account)
        if (!parentExists) {
          errors.push(`Account ${account.entity_code}: Parent account '${account.parent_account}' not found`)
          validationScore -= 5
        }
      }

      // Validate account numbering structure
      const firstDigit = account.entity_code.charAt(0)
      const expectedTypes: { [key: string]: string } = {
        '1': 'assets',
        '2': 'liabilities',
        '3': 'equity',
        '4': 'revenue',
        '5': 'cost_of_sales',
        '6': 'direct_expenses',
        '7': 'indirect_expenses',
        '8': 'taxes_extraordinary',
        '9': 'statistical'
      }

      if (expectedTypes[firstDigit] && account.account_type !== expectedTypes[firstDigit]) {
        errors.push(`Account ${account.entity_code}: Account type '${account.account_type}' doesn't match numbering structure. Expected '${expectedTypes[firstDigit]}'`)
        validationScore -= 3
      }

      // Validate IFRS statement mapping
      if (account.ifrs_statement) {
        const validStatements = ['SFP', 'SPL', 'SCE', 'SCF', 'NOTES']
        if (!validStatements.includes(account.ifrs_statement)) {
          errors.push(`Account ${account.entity_code}: Invalid IFRS statement '${account.ifrs_statement}'. Must be one of: ${validStatements.join(', ')}`)
          validationScore -= 2
        }

        // Check statement mapping consistency
        if ((firstDigit === '1' || firstDigit === '2' || firstDigit === '3') && account.ifrs_statement !== 'SFP') {
          warnings.push(`Account ${account.entity_code}: Balance sheet account should map to SFP statement`)
          validationScore -= 1
        }
        if ((firstDigit === '4' || firstDigit === '5' || firstDigit === '6' || firstDigit === '7' || firstDigit === '8') && account.ifrs_statement !== 'SPL') {
          warnings.push(`Account ${account.entity_code}: Income statement account should map to SPL statement`)
          validationScore -= 1
        }
      }

      // Validate normal balance
      const debitAccounts = ['assets', 'cost_of_sales', 'direct_expenses', 'indirect_expenses', 'taxes_extraordinary', 'statistical']
      const expectedBalance = debitAccounts.includes(account.account_type) ? 'debit' : 'credit'
      if (account.normal_balance && account.normal_balance !== expectedBalance) {
        warnings.push(`Account ${account.entity_code}: Normal balance '${account.normal_balance}' may be incorrect. Expected '${expectedBalance}'`)
        validationScore -= 1
      }

      // Validate header accounts
      if (account.is_header && account.entity_code && !account.entity_code.endsWith('000') && !account.entity_code.endsWith('00') && !account.entity_code.endsWith('0')) {
        warnings.push(`Account ${account.entity_code}: Marked as header but doesn't follow header naming convention`)
        validationScore -= 1
      }
    })

    // Check for duplicate account codes
    const accountCodes = accounts.map(acc => acc.entity_code)
    const duplicates = accountCodes.filter((code, index) => accountCodes.indexOf(code) !== index)
    if (duplicates.length > 0) {
      errors.push(`Duplicate account codes found: ${[...new Set(duplicates)].join(', ')}`)
      validationScore -= 10
    }

    // Ensure minimum compliance score
    validationScore = Math.max(0, validationScore)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance_score: validationScore
    }
  }

  /**
   * Generate IFRS-compliant rollup calculations
   */
  static generateIFRSRollup(accounts: any[], balances: { [accountCode: string]: number } = {}): IFRSRollupResult[] {
    // Sort accounts by presentation order
    const sortedAccounts = [...accounts].sort((a, b) => (a.presentation_order || 0) - (b.presentation_order || 0))
    
    // Build hierarchy map
    const accountMap = new Map<string, any>()
    const childrenMap = new Map<string, string[]>()
    
    sortedAccounts.forEach(account => {
      accountMap.set(account.entity_code, account)
      
      if (account.parent_account && account.parent_account !== '') {
        if (!childrenMap.has(account.parent_account)) {
          childrenMap.set(account.parent_account, [])
        }
        childrenMap.get(account.parent_account)!.push(account.entity_code)
      }
    })

    // Calculate rollup balances
    const calculateBalance = (accountCode: string): number => {
      const account = accountMap.get(accountCode)
      if (!account) return 0

      // If it's a header account, sum children
      if (account.is_header && childrenMap.has(accountCode)) {
        const children = childrenMap.get(accountCode) || []
        return children.reduce((sum, childCode) => sum + calculateBalance(childCode), 0)
      }

      // Otherwise return the account's balance
      return balances[accountCode] || 0
    }

    // Build rollup structure
    const buildRollupTree = (accountCode: string): IFRSRollupResult => {
      const account = accountMap.get(accountCode)!
      const children = childrenMap.get(accountCode) || []
      
      return {
        account_code: accountCode,
        account_name: account.entity_name,
        balance: calculateBalance(accountCode),
        children: children.map(childCode => buildRollupTree(childCode)),
        level: account.account_level || 4,
        ifrs_statement: account.ifrs_statement || 'SPL',
        ifrs_subcategory: account.ifrs_subcategory || account.ifrs_category || ''
      }
    }

    // Get top-level accounts (those without parents)
    const topLevelAccounts = sortedAccounts
      .filter(account => !account.parent_account || account.parent_account === '')
      .map(account => buildRollupTree(account.entity_code))

    return topLevelAccounts
  }

  /**
   * Generate IFRS Financial Statements
   */
  static generateFinancialStatements(rollupData: IFRSRollupResult[]) {
    const statements = {
      SFP: rollupData.filter(item => item.ifrs_statement === 'SFP'),
      SPL: rollupData.filter(item => item.ifrs_statement === 'SPL'),
      SCE: rollupData.filter(item => item.ifrs_statement === 'SCE'),
      SCF: rollupData.filter(item => item.ifrs_statement === 'SCF'),
      NOTES: rollupData.filter(item => item.ifrs_statement === 'NOTES')
    }

    return {
      balance_sheet: statements.SFP,
      income_statement: statements.SPL,
      equity_statement: statements.SCE,
      cash_flow_statement: statements.SCF,
      notes: statements.NOTES
    }
  }

  /**
   * Validate account hierarchy consistency
   */
  static validateHierarchy(accounts: any[]): string[] {
    const errors: string[] = []
    const accountMap = new Map(accounts.map(acc => [acc.entity_code, acc]))

    accounts.forEach(account => {
      // Check parent-child level consistency
      if (account.parent_account && account.parent_account !== '') {
        const parent = accountMap.get(account.parent_account)
        if (parent) {
          if (parent.account_level >= account.account_level) {
            errors.push(`Account ${account.entity_code}: Level ${account.account_level} should be greater than parent ${parent.entity_code} level ${parent.account_level}`)
          }
        }
      }

      // Check rollup account consistency
      if (account.rollup_account && account.rollup_account !== account.parent_account) {
        const rollupAccount = accountMap.get(account.rollup_account)
        if (!rollupAccount) {
          errors.push(`Account ${account.entity_code}: Rollup account '${account.rollup_account}' not found`)
        }
      }
    })

    return errors
  }
}

export default IFRSValidator