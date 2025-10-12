/**
 * HERA COA v2: Guardrails Engine
 * 
 * Policy-as-data guardrails applied at COA create/update and posting time.
 * Zero code changes required - all rules stored as JSON policies.
 * 
 * Smart Code: HERA.FIN.COA.GUARDRAILS.ENGINE.V2
 */

import {
  type COAAccount,
  type COACreateRequest,
  type COAUpdateRequest,
  type COAValidationError,
  type COAStructurePolicy,
  type COADimensionalPolicy,
  type IFRSPresentationPolicy,
  COA_ERROR_CODES,
  DEFAULT_COA_STRUCTURE_POLICY,
  DEFAULT_DIMENSIONAL_POLICY,
  DEFAULT_IFRS_POLICY,
  getAccountRange,
  inferNormalBalance,
  calculateDepth,
  validateAccountNumber,
  validateIFRSTags,
  validateSmartCode
} from './coa-v2-standard'

// ============================================================================
// Guardrails Engine Core
// ============================================================================

export class COAGuardrailsEngine {
  private structurePolicy: COAStructurePolicy
  private dimensionalPolicy: COADimensionalPolicy
  private ifrsPolicy: IFRSPresentationPolicy

  constructor(
    structurePolicy: COAStructurePolicy = DEFAULT_COA_STRUCTURE_POLICY,
    dimensionalPolicy: COADimensionalPolicy = DEFAULT_DIMENSIONAL_POLICY,
    ifrsPolicy: IFRSPresentationPolicy = DEFAULT_IFRS_POLICY
  ) {
    this.structurePolicy = structurePolicy
    this.dimensionalPolicy = dimensionalPolicy
    this.ifrsPolicy = ifrsPolicy
  }

  /**
   * Validate COA account creation request
   */
  async validateCreate(
    request: COACreateRequest,
    organizationId: string,
    existingAccounts: COAAccount[] = []
  ): Promise<{ valid: boolean; errors: COAValidationError[] }> {
    const errors: COAValidationError[] = []

    // 1. Validate account number format
    const numberValidation = validateAccountNumber(request.account_number)
    if (!numberValidation.valid) {
      errors.push({
        code: 'ERR_COA_INVALID_NUMBER_FORMAT',
        message: numberValidation.errors.join(', '),
        field: 'account_number',
        value: request.account_number
      })
    }

    // 2. Check uniqueness per organization
    if (this.isRuleEnforced('unique_account_number')) {
      const duplicate = existingAccounts.find(
        acc => acc.account_number === request.account_number && acc.status === 'ACTIVE'
      )
      if (duplicate) {
        errors.push({
          code: 'ERR_COA_DUPLICATE_NUMBER',
          message: `Account number ${request.account_number} already exists`,
          field: 'account_number',
          value: request.account_number
        })
      }
    }

    // 3. Validate normal balance matches range
    if (this.isRuleEnforced('normal_balance_by_range')) {
      const expectedBalance = this.getExpectedNormalBalance(request.account_number)
      const requestedBalance = request.normal_balance || expectedBalance
      
      if (requestedBalance !== expectedBalance) {
        errors.push({
          code: 'ERR_COA_INVALID_NORMAL_BALANCE',
          message: `Account ${request.account_number} in range ${getAccountRange(request.account_number)} must have normal balance ${expectedBalance}`,
          field: 'normal_balance',
          value: requestedBalance
        })
      }
    }

    // 4. Validate depth limits
    const maxDepth = this.getMaxDepth()
    const accountDepth = calculateDepth(request.account_number)
    if (accountDepth > maxDepth) {
      errors.push({
        code: 'ERR_COA_MAX_DEPTH_EXCEEDED',
        message: `Account depth ${accountDepth} exceeds maximum allowed depth ${maxDepth}`,
        field: 'account_number',
        value: request.account_number
      })
    }

    // 5. Validate parent relationship (if parent_id provided)
    if (request.parent_id) {
      const parent = existingAccounts.find(acc => acc.id === request.parent_id)
      if (!parent) {
        errors.push({
          code: 'ERR_COA_PARENT_NOT_FOUND',
          message: `Parent account ${request.parent_id} not found`,
          field: 'parent_id',
          value: request.parent_id
        })
      } else {
        // Check if parent-child relationship creates proper hierarchy
        const parentDepth = calculateDepth(parent.account_number)
        if (accountDepth !== parentDepth + 1) {
          errors.push({
            code: 'ERR_COA_INVALID_NUMBER_FORMAT',
            message: `Account ${request.account_number} depth (${accountDepth}) must be parent depth + 1 (${parentDepth + 1})`,
            field: 'account_number',
            value: request.account_number
          })
        }
      }
    }

    // 6. Validate postable leaf only rule
    if (this.isRuleEnforced('is_postable_leaf_only') && request.is_postable) {
      // Check if this account would have children (not a leaf)
      const wouldHaveChildren = existingAccounts.some(acc => 
        acc.account_number.startsWith(request.account_number + '.') && acc.status === 'ACTIVE'
      )
      if (wouldHaveChildren) {
        errors.push({
          code: 'ERR_COA_POSTABLE_NOT_LEAF',
          message: `Account ${request.account_number} cannot be postable as it has child accounts`,
          field: 'is_postable',
          value: request.is_postable
        })
      }
    }

    // 7. Validate IFRS tags for postable accounts
    if (request.is_postable && this.isIFRSValidationEnabled('must_have_ifrs_tag_on_postable')) {
      const tagsValidation = validateIFRSTags(request.ifrs_tags)
      if (!tagsValidation.valid) {
        errors.push({
          code: 'ERR_COA_MISSING_IFRS_TAGS',
          message: tagsValidation.errors.join(', '),
          field: 'ifrs_tags',
          value: request.ifrs_tags
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate COA account update request
   */
  async validateUpdate(
    accountId: string,
    request: COAUpdateRequest,
    existingAccount: COAAccount,
    allAccounts: COAAccount[] = []
  ): Promise<{ valid: boolean; errors: COAValidationError[] }> {
    const errors: COAValidationError[] = []

    // 1. If changing account number, validate new number
    if (request.account_number && request.account_number !== existingAccount.account_number) {
      const numberValidation = validateAccountNumber(request.account_number)
      if (!numberValidation.valid) {
        errors.push({
          code: 'ERR_COA_INVALID_NUMBER_FORMAT',
          message: numberValidation.errors.join(', '),
          field: 'account_number',
          value: request.account_number
        })
      }

      // Check uniqueness
      if (this.isRuleEnforced('unique_account_number')) {
        const duplicate = allAccounts.find(
          acc => acc.account_number === request.account_number && 
                 acc.id !== accountId && 
                 acc.status === 'ACTIVE'
        )
        if (duplicate) {
          errors.push({
            code: 'ERR_COA_DUPLICATE_NUMBER',
            message: `Account number ${request.account_number} already exists`,
            field: 'account_number',
            value: request.account_number
          })
        }
      }
    }

    // 2. If changing normal balance, validate against range
    if (request.normal_balance) {
      const accountNumber = request.account_number || existingAccount.account_number
      const expectedBalance = this.getExpectedNormalBalance(accountNumber)
      
      if (request.normal_balance !== expectedBalance && this.isRuleEnforced('normal_balance_by_range')) {
        errors.push({
          code: 'ERR_COA_INVALID_NORMAL_BALANCE',
          message: `Account ${accountNumber} must have normal balance ${expectedBalance}`,
          field: 'normal_balance',
          value: request.normal_balance
        })
      }
    }

    // 3. If changing to postable, ensure it's a leaf
    if (request.is_postable === true && this.isRuleEnforced('is_postable_leaf_only')) {
      const children = allAccounts.filter(acc => 
        acc.parent_id === accountId && acc.status === 'ACTIVE'
      )
      if (children.length > 0) {
        errors.push({
          code: 'ERR_COA_POSTABLE_NOT_LEAF',
          message: `Account cannot be postable as it has ${children.length} child accounts`,
          field: 'is_postable',
          value: request.is_postable
        })
      }
    }

    // 4. If changing IFRS tags on postable account, validate
    if (request.ifrs_tags && (request.is_postable || existingAccount.is_postable)) {
      if (this.isIFRSValidationEnabled('must_have_ifrs_tag_on_postable')) {
        const tagsValidation = validateIFRSTags(request.ifrs_tags)
        if (!tagsValidation.valid) {
          errors.push({
            code: 'ERR_COA_MISSING_IFRS_TAGS',
            message: tagsValidation.errors.join(', '),
            field: 'ifrs_tags',
            value: request.ifrs_tags
          })
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate dimensional completeness for posting transactions
   */
  validateDimensionalCompleteness(
    accountNumber: string,
    dimensions: Record<string, any> = {}
  ): { valid: boolean; errors: COAValidationError[] } {
    const errors: COAValidationError[] = []
    const range = getAccountRange(accountNumber)
    
    // Find dimensional requirements for this range
    const rangePolicy = this.dimensionalPolicy.ranges.find(r => r.range === range)
    if (!rangePolicy) {
      return { valid: true, errors: [] } // No requirements for this range
    }

    // Check required dimensions
    for (const requiredDim of rangePolicy.requires) {
      if (!dimensions[requiredDim] || dimensions[requiredDim] === null || dimensions[requiredDim] === '') {
        errors.push({
          code: 'ERR_COA_DIM_REQUIREMENT_MISSING',
          message: `Required dimension '${requiredDim}' missing for account ${accountNumber} (range ${range})`,
          field: requiredDim,
          value: dimensions[requiredDim]
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate account archive request
   */
  validateArchive(
    account: COAAccount,
    allAccounts: COAAccount[],
    hasTransactions: boolean = false
  ): { valid: boolean; errors: COAValidationError[] } {
    const errors: COAValidationError[] = []

    // Check if account has active child accounts
    const activeChildren = allAccounts.filter(acc => 
      acc.parent_id === account.id && acc.status === 'ACTIVE'
    )
    
    if (activeChildren.length > 0) {
      errors.push({
        code: 'ERR_COA_ACCOUNT_IN_USE',
        message: `Cannot archive account with ${activeChildren.length} active child accounts`,
        field: 'status',
        value: 'ARCHIVED'
      })
    }

    // Check if account has transactions (if policy enforces)
    if (hasTransactions && this.isRuleEnforced('no_archive_with_transactions')) {
      errors.push({
        code: 'ERR_COA_ACCOUNT_IN_USE',
        message: `Cannot archive account with existing transactions`,
        field: 'status',
        value: 'ARCHIVED'
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private isRuleEnforced(ruleName: string): boolean {
    const rule = this.structurePolicy.rules.find(r => r.name === ruleName)
    return rule?.enforce === true
  }

  private getExpectedNormalBalance(accountNumber: string): 'Dr' | 'Cr' {
    const rule = this.structurePolicy.rules.find(r => r.name === 'normal_balance_by_range')
    if (!rule?.map) return inferNormalBalance(accountNumber)
    
    const range = getAccountRange(accountNumber)
    return rule.map[range] || inferNormalBalance(accountNumber)
  }

  private getMaxDepth(): number {
    const rule = this.structurePolicy.rules.find(r => r.name === 'max_depth')
    return rule?.value || 8
  }

  private isIFRSValidationEnabled(validationType: string): boolean {
    return this.ifrsPolicy.validation.includes(validationType)
  }
}

// ============================================================================
// Guardrails Application Functions
// ============================================================================

/**
 * Apply all COA guardrails before create/update operations
 */
export async function applyCOAGuardrails(
  operation: 'create' | 'update',
  request: COACreateRequest | COAUpdateRequest,
  organizationId: string,
  existingAccounts: COAAccount[] = [],
  accountId?: string
): Promise<{ valid: boolean; errors: COAValidationError[] }> {
  const guardrails = new COAGuardrailsEngine()

  if (operation === 'create') {
    return guardrails.validateCreate(request as COACreateRequest, organizationId, existingAccounts)
  } else {
    const existingAccount = existingAccounts.find(acc => acc.id === accountId)
    if (!existingAccount) {
      return {
        valid: false,
        errors: [{
          code: 'ERR_COA_PARENT_NOT_FOUND',
          message: `Account ${accountId} not found`,
          field: 'id',
          value: accountId
        }]
      }
    }
    return guardrails.validateUpdate(accountId!, request as COAUpdateRequest, existingAccount, existingAccounts)
  }
}

/**
 * Validate posting transaction against dimensional requirements
 */
export function validatePostingDimensions(
  accountNumber: string,
  dimensions: Record<string, any> = {}
): { valid: boolean; errors: COAValidationError[] } {
  const guardrails = new COAGuardrailsEngine()
  return guardrails.validateDimensionalCompleteness(accountNumber, dimensions)
}

/**
 * Check if account can be safely archived
 */
export function validateAccountArchive(
  account: COAAccount,
  allAccounts: COAAccount[],
  hasTransactions: boolean = false
): { valid: boolean; errors: COAValidationError[] } {
  const guardrails = new COAGuardrailsEngine()
  return guardrails.validateArchive(account, allAccounts, hasTransactions)
}

/**
 * Batch validate multiple accounts
 */
export async function batchValidateCOAAccounts(
  accounts: (COACreateRequest | COAUpdateRequest)[],
  organizationId: string,
  existingAccounts: COAAccount[] = []
): Promise<Array<{ valid: boolean; errors: COAValidationError[]; index: number }>> {
  const results = []
  
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i]!
    const operation = 'id' in account ? 'update' : 'create'
    
    const validation = await applyCOAGuardrails(
      operation,
      account,
      organizationId,
      existingAccounts,
      'id' in account ? (account as any).id : undefined
    )
    
    results.push({
      ...validation,
      index: i
    })
  }
  
  return results
}

export default COAGuardrailsEngine