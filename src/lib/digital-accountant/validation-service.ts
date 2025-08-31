/**
 * 🛡️ HERA Digital Accountant Validation Service
 * 
 * Comprehensive validation for accounting operations
 * Ensures data integrity, compliance, and business rule enforcement
 * 
 * Smart Code: HERA.FIN.ACCT.VALIDATE.v1
 */

import { supabase } from '@/lib/supabase';
import {
  JournalEntry,
  JournalLine,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationInfo,
  PeriodStatus,
  ACCOUNTANT_SMART_CODES
} from '@/types/digital-accountant.types';
import { IValidationService } from './contracts';
import { SQLGuardrailValidator, QuerySanitizer } from './sql-guardrails';

// ================================================================================
// VALIDATION RULES
// ================================================================================

export const VALIDATION_RULES = {
  // Journal validation
  JOURNAL_MUST_BALANCE: 'Journal entry must balance (debits = credits)',
  JOURNAL_MIN_LINES: 'Journal entry must have at least 2 lines',
  JOURNAL_DATE_REQUIRED: 'Journal entry must have a valid date',
  JOURNAL_DESCRIPTION_REQUIRED: 'Journal entry must have a description',
  JOURNAL_DUPLICATE_ACCOUNTS: 'Same account should not appear multiple times with same debit/credit',
  
  // GL Account validation
  GL_ACCOUNT_EXISTS: 'GL account must exist and be active',
  GL_ACCOUNT_POSTABLE: 'GL account must be postable (not a header account)',
  GL_ACCOUNT_RESTRICTED: 'GL account has posting restrictions',
  GL_ACCOUNT_CURRENCY_MATCH: 'GL account currency must match transaction currency',
  
  // Period validation
  PERIOD_MUST_BE_OPEN: 'Accounting period must be open for posting',
  PERIOD_SOFT_CLOSE_WARNING: 'Period is soft-closed, requires approval',
  PERIOD_FUTURE_DATE: 'Cannot post to future periods',
  PERIOD_BACKDATING_LIMIT: 'Backdating exceeds allowed limit',
  
  // Amount validation
  AMOUNT_NON_NEGATIVE: 'Amounts must be non-negative',
  AMOUNT_PRECISION: 'Amounts must have maximum 2 decimal places',
  AMOUNT_THRESHOLD: 'Amount exceeds automatic posting threshold',
  
  // Business rules
  BUSINESS_RULE_VIOLATION: 'Business rule violation detected',
  APPROVAL_REQUIRED: 'Transaction requires approval',
  SUPPORTING_DOC_REQUIRED: 'Supporting documentation required',
  
  // System validation
  SMART_CODE_INVALID: 'Invalid or deprecated smart code',
  ORG_CONTEXT_MISSING: 'Organization context is required',
  USER_PERMISSION_DENIED: 'User lacks permission for this operation'
} as const;

// ================================================================================
// BUSINESS RULE DEFINITIONS
// ================================================================================

interface BusinessRule {
  id: string;
  name: string;
  condition: (entry: JournalEntry) => boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

const BUSINESS_RULES: BusinessRule[] = [
  {
    id: 'large_amount_approval',
    name: 'Large Amount Approval',
    condition: (entry) => {
      const totalAmount = entry.metadata?.total_debits || 0;
      return totalAmount > 10000;
    },
    message: 'Journal entries over $10,000 require approval',
    severity: 'warning'
  },
  {
    id: 'intercompany_balance',
    name: 'Intercompany Must Balance',
    condition: (entry) => {
      // Check if it's an intercompany transaction
      const hasIntercompany = entry.smart_code?.includes('INTERCO');
      if (!hasIntercompany) return false;
      
      // For intercompany, specific validation would apply
      return true;
    },
    message: 'Intercompany transactions must balance by company',
    severity: 'error'
  },
  {
    id: 'cash_account_restriction',
    name: 'Cash Account Posting Restriction',
    condition: (entry) => {
      // Check if any line posts to restricted cash accounts
      return false; // Would need to check lines
    },
    message: 'Direct posting to cash accounts requires treasury approval',
    severity: 'warning'
  }
];

// ================================================================================
// VALIDATION SERVICE IMPLEMENTATION
// ================================================================================

export class ValidationService implements IValidationService {
  private organizationId: string;
  private userId: string;
  private guardrailValidator: SQLGuardrailValidator;

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId;
    this.userId = userId;
    this.guardrailValidator = new SQLGuardrailValidator(organizationId, userId);
  }

  /**
   * Validate journal entry
   */
  async validateJournalEntry(entry: JournalEntry): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    // Basic validation
    if (!entry.metadata?.journal_date) {
      errors.push({
        code: 'JOURNAL_DATE_MISSING',
        message: VALIDATION_RULES.JOURNAL_DATE_REQUIRED,
        severity: 'error',
        field: 'journal_date'
      });
    }

    if (!entry.metadata?.description || entry.metadata.description.trim() === '') {
      errors.push({
        code: 'JOURNAL_DESC_MISSING',
        message: VALIDATION_RULES.JOURNAL_DESCRIPTION_REQUIRED,
        severity: 'error',
        field: 'description'
      });
    }

    // Get journal lines
    const { data: lines, error: linesError } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('transaction_id', entry.id);

    if (linesError || !lines || lines.length < 2) {
      errors.push({
        code: 'JOURNAL_INSUFFICIENT_LINES',
        message: VALIDATION_RULES.JOURNAL_MIN_LINES,
        severity: 'error'
      });
    } else {
      // Validate balance
      const balanceValidation = await this.validateJournalBalance(lines);
      errors.push(...balanceValidation.errors);
      warnings.push(...balanceValidation.warnings);

      // Validate GL accounts
      for (const line of lines) {
        const accountValidation = await this.validateGLAccount(
          line.metadata?.gl_account_id || '',
          this.organizationId
        );
        
        if (!accountValidation) {
          errors.push({
            code: 'GL_ACCOUNT_INVALID',
            message: `${VALIDATION_RULES.GL_ACCOUNT_EXISTS}: ${line.metadata?.gl_account_code}`,
            severity: 'error',
            field: `line_${line.line_number}`
          });
        }
      }

      // Check for duplicate accounts
      const accountUsage = new Map<string, number>();
      lines.forEach(line => {
        const key = `${line.metadata?.gl_account_code}_${line.metadata?.debit_amount > 0 ? 'D' : 'C'}`;
        accountUsage.set(key, (accountUsage.get(key) || 0) + 1);
      });

      accountUsage.forEach((count, key) => {
        if (count > 1) {
          warnings.push({
            code: 'DUPLICATE_GL_ACCOUNT',
            message: `${VALIDATION_RULES.JOURNAL_DUPLICATE_ACCOUNTS}: ${key.split('_')[0]}`,
            can_override: true
          });
        }
      });
    }

    // Validate posting period
    if (entry.metadata?.journal_date) {
      const periodValidation = await this.validatePostingDate(
        entry.metadata.journal_date,
        this.organizationId
      );
      errors.push(...periodValidation.errors);
      warnings.push(...periodValidation.warnings);
    }

    // Apply business rules
    const businessRuleValidation = await this.validateBusinessRules(entry);
    errors.push(...businessRuleValidation.errors);
    warnings.push(...businessRuleValidation.warnings);
    info.push(...businessRuleValidation.info);

    // Add summary info
    if (errors.length === 0 && warnings.length === 0) {
      info.push({
        code: 'VALIDATION_PASSED',
        message: 'All validation checks passed successfully'
      });
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  /**
   * Validate journal balance
   */
  async validateJournalBalance(lines: JournalLine[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Calculate totals
    let totalDebits = 0;
    let totalCredits = 0;

    lines.forEach(line => {
      const debit = line.metadata?.debit_amount || line.debit_amount || 0;
      const credit = line.metadata?.credit_amount || line.credit_amount || 0;

      // Validate amounts
      if (debit < 0 || credit < 0) {
        errors.push({
          code: 'NEGATIVE_AMOUNT',
          message: `${VALIDATION_RULES.AMOUNT_NON_NEGATIVE} on line ${line.line_number}`,
          severity: 'error',
          field: `line_${line.line_number}`
        });
      }

      // Check precision
      if (!this.isValidPrecision(debit) || !this.isValidPrecision(credit)) {
        warnings.push({
          code: 'AMOUNT_PRECISION',
          message: `${VALIDATION_RULES.AMOUNT_PRECISION} on line ${line.line_number}`,
          can_override: true
        });
      }

      // Both debit and credit on same line
      if (debit > 0 && credit > 0) {
        errors.push({
          code: 'BOTH_DEBIT_CREDIT',
          message: `Line ${line.line_number} has both debit and credit amounts`,
          severity: 'error',
          field: `line_${line.line_number}`
        });
      }

      totalDebits += debit;
      totalCredits += credit;
    });

    // Check balance
    const difference = Math.abs(totalDebits - totalCredits);
    if (difference > 0.01) {
      errors.push({
        code: 'JOURNAL_UNBALANCED',
        message: `${VALIDATION_RULES.JOURNAL_MUST_BALANCE}. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
        severity: 'critical',
        suggestion: `Adjust by ${difference.toFixed(2)} to balance`
      });
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      info: [{
        code: 'BALANCE_SUMMARY',
        message: `Total Debits: ${totalDebits.toFixed(2)}, Total Credits: ${totalCredits.toFixed(2)}`
      }]
    };
  }

  /**
   * Validate posting date against period
   */
  async validatePostingDate(date: string, organizationId: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const postingDate = new Date(date);
    const today = new Date();

    // Check future date
    if (postingDate > today) {
      errors.push({
        code: 'FUTURE_DATE',
        message: VALIDATION_RULES.PERIOD_FUTURE_DATE,
        severity: 'error',
        field: 'posting_date'
      });
    }

    // Check backdating limit (e.g., 90 days)
    const backdatingLimit = new Date();
    backdatingLimit.setDate(backdatingLimit.getDate() - 90);
    
    if (postingDate < backdatingLimit) {
      warnings.push({
        code: 'EXCESSIVE_BACKDATING',
        message: `${VALIDATION_RULES.PERIOD_BACKDATING_LIMIT} (90 days)`,
        can_override: true
      });
    }

    // Get period status
    const periodCode = `${postingDate.getFullYear()}-${String(postingDate.getMonth() + 1).padStart(2, '0')}`;
    const periodValidation = await this.validatePeriod(periodCode, organizationId);
    
    errors.push(...periodValidation.errors);
    warnings.push(...periodValidation.warnings);

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      info: [{
        code: 'POSTING_PERIOD',
        message: `Posting to period: ${periodCode}`
      }]
    };
  }

  /**
   * Validate GL account
   */
  async validateGLAccount(accountId: string, organizationId: string): Promise<boolean> {
    if (!accountId) return false;

    const { data: account, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', accountId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'gl_account')
      .single();

    if (error || !account) return false;

    // Check if active
    if (account.status === 'inactive' || account.status === 'deleted') {
      return false;
    }

    // Check if postable (not a header account)
    if (account.metadata?.is_header_account === true) {
      return false;
    }

    return true;
  }

  /**
   * Validate account combination
   */
  async validateAccountCombination(accounts: string[]): Promise<ValidationResult> {
    const warnings: ValidationWarning[] = [];

    // Check for restricted combinations
    const restrictedPairs = [
      ['1100', '1100'], // Cash to cash
      ['9999', '9999'], // Suspense to suspense
    ];

    for (const [acc1, acc2] of restrictedPairs) {
      if (accounts.includes(acc1) && accounts.includes(acc2)) {
        warnings.push({
          code: 'RESTRICTED_COMBINATION',
          message: `Posting between ${acc1} and ${acc2} requires review`,
          can_override: true
        });
      }
    }

    return {
      is_valid: true,
      errors: [],
      warnings,
      info: []
    };
  }

  /**
   * Validate accounting period
   */
  async validatePeriod(periodCode: string, organizationId: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Get period entity
    const { data: period, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'accounting_period')
      .eq('entity_code', periodCode)
      .single();

    if (error || !period) {
      // Period doesn't exist - check if it should be auto-created
      const [year, month] = periodCode.split('-').map(Number);
      const periodDate = new Date(year, month - 1, 1);
      const today = new Date();
      
      if (periodDate <= today) {
        // Auto-create period as open
        await this.createAccountingPeriod(organizationId, periodCode, 'open');
        
        return {
          is_valid: true,
          errors: [],
          warnings: [],
          info: [{
            code: 'PERIOD_CREATED',
            message: `Period ${periodCode} created automatically`
          }]
        };
      } else {
        errors.push({
          code: 'INVALID_PERIOD',
          message: `Period ${periodCode} does not exist`,
          severity: 'error'
        });
      }
    } else {
      // Check period status
      const status = period.metadata?.status as PeriodStatus;
      
      switch (status) {
        case 'hard_closed':
        case 'archived':
          errors.push({
            code: 'PERIOD_CLOSED',
            message: `${VALIDATION_RULES.PERIOD_MUST_BE_OPEN}: ${periodCode} is ${status}`,
            severity: 'error'
          });
          break;
        
        case 'soft_closed':
          warnings.push({
            code: 'PERIOD_SOFT_CLOSED',
            message: VALIDATION_RULES.PERIOD_SOFT_CLOSE_WARNING,
            can_override: true
          });
          break;
        
        case 'open':
          // All good
          break;
        
        default:
          warnings.push({
            code: 'PERIOD_STATUS_UNKNOWN',
            message: `Period ${periodCode} has unknown status: ${status}`,
            can_override: false
          });
      }
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      info: []
    };
  }

  /**
   * Check if period is open
   */
  async isPeriodOpen(periodCode: string, organizationId: string): Promise<boolean> {
    const validation = await this.validatePeriod(periodCode, organizationId);
    return validation.is_valid && validation.warnings.length === 0;
  }

  /**
   * Validate business rules
   */
  async validateBusinessRules(entry: JournalEntry): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    for (const rule of BUSINESS_RULES) {
      if (rule.condition(entry)) {
        if (rule.severity === 'error') {
          errors.push({
            code: `BUSINESS_RULE_${rule.id.toUpperCase()}`,
            message: rule.message,
            severity: 'error'
          });
        } else {
          warnings.push({
            code: `BUSINESS_RULE_${rule.id.toUpperCase()}`,
            message: rule.message,
            can_override: rule.severity === 'warning'
          });
        }
      }
    }

    // Check smart code validity
    if (entry.smart_code && !this.guardrailValidator.validateSmartCode(entry.smart_code)) {
      warnings.push({
        code: 'SMART_CODE_FORMAT',
        message: VALIDATION_RULES.SMART_CODE_INVALID,
        can_override: true
      });
    }

    // Add applicable rules info
    const applicableRules = await this.getApplicableRules(entry);
    if (applicableRules.length > 0) {
      info.push({
        code: 'APPLICABLE_RULES',
        message: `${applicableRules.length} business rules applied`,
        help_url: '/docs/accounting/business-rules'
      });
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  /**
   * Get applicable business rules for an entry
   */
  async getApplicableRules(entry: JournalEntry): Promise<any[]> {
    return BUSINESS_RULES.filter(rule => {
      try {
        return rule.condition(entry);
      } catch {
        return false;
      }
    });
  }

  // ================================================================================
  // HELPER METHODS
  // ================================================================================

  private isValidPrecision(amount: number): boolean {
    // Check if amount has at most 2 decimal places
    const decimalStr = amount.toString().split('.')[1];
    return !decimalStr || decimalStr.length <= 2;
  }

  private async createAccountingPeriod(
    organizationId: string, 
    periodCode: string, 
    status: PeriodStatus
  ): Promise<void> {
    const [year, month] = periodCode.split('-').map(Number);
    
    await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'accounting_period',
        entity_code: periodCode,
        entity_name: `Period ${periodCode}`,
        smart_code: 'HERA.FIN.PERIOD.v1',
        metadata: {
          period_code: periodCode,
          status,
          year,
          month,
          created_at: new Date().toISOString()
        },
        status: 'active'
      });
  }
}