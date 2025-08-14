import { readFileSync } from 'fs';
import { join } from 'path';
import { CoaTemplateService, CoaAccount } from './CoaTemplateService';

export interface ValidationRule {
  rule_id: string;
  rule_name: string;
  rule_type: 'system' | 'validation' | 'governance' | 'recommendation';
  priority: number;
  is_active: boolean;
  condition: any;
  action: any;
  description: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: ValidationRecommendation[];
}

export interface ValidationError {
  rule_id: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  field?: string;
}

export interface ValidationWarning {
  rule_id: string;
  message: string;
  suggestion?: string;
}

export interface ValidationRecommendation {
  rule_id: string;
  message: string;
  benefit: string;
  optional: boolean;
}

export interface OrganizationContext {
  organization_id: string;
  country?: string;
  industry?: string;
  status?: 'setup' | 'active' | 'live';
  has_transactions?: boolean;
  fiscal_year_end?: string;
  regulatory_requirements?: string[];
  has_multiple_locations?: boolean;
  parent_organization_id?: string;
}

export interface CoaAssignmentRequest {
  organization_id: string;
  country_template?: string;
  industry_template?: string;
  allow_custom_accounts?: boolean;
  assigned_by?: string;
}

export class CoaValidationService {
  private static instance: CoaValidationService;
  private templateService: CoaTemplateService;
  private validationRules: ValidationRule[];
  private configPath: string;

  constructor() {
    this.configPath = join(process.cwd(), 'config', 'coa');
    this.templateService = CoaTemplateService.getInstance();
    this.validationRules = this.loadValidationRules();
  }

  public static getInstance(): CoaValidationService {
    if (!CoaValidationService.instance) {
      CoaValidationService.instance = new CoaValidationService();
    }
    return CoaValidationService.instance;
  }

  /**
   * Load validation rules from configuration
   */
  private loadValidationRules(): ValidationRule[] {
    try {
      const rulesPath = join(this.configPath, 'rules', 'assignment-rules.json');
      const rulesContent = readFileSync(rulesPath, 'utf-8');
      const rulesConfig = JSON.parse(rulesContent);

      const rules: ValidationRule[] = [];
      
      // Flatten all rule categories into a single array
      for (const category of Object.values(rulesConfig.rule_definitions)) {
        if (Array.isArray(category)) {
          rules.push(...category);
        }
      }

      // Sort by priority (lower number = higher priority)
      return rules.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      console.error('Failed to load validation rules:', error);
      return [];
    }
  }

  /**
   * Validate a COA assignment request
   */
  public async validateCoaAssignment(
    request: CoaAssignmentRequest,
    organizationContext: OrganizationContext
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    // Execute validation rules in priority order
    for (const rule of this.validationRules.filter(r => r.is_active)) {
      try {
        const ruleResult = await this.executeValidationRule(rule, request, organizationContext);
        
        // Merge results
        result.errors.push(...ruleResult.errors);
        result.warnings.push(...ruleResult.warnings);
        result.recommendations.push(...ruleResult.recommendations);
        
        // Stop on critical errors for system rules
        if (rule.rule_type === 'system' && ruleResult.errors.some(e => e.severity === 'critical')) {
          result.valid = false;
          break;
        }
      } catch (error) {
        console.error(`Error executing validation rule ${rule.rule_id}:`, error);
        result.errors.push({
          rule_id: rule.rule_id,
          message: `Validation rule execution failed: ${error}`,
          severity: 'medium'
        });
      }
    }

    // Set overall validity
    result.valid = result.errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0;

    return result;
  }

  /**
   * Execute a single validation rule
   */
  private async executeValidationRule(
    rule: ValidationRule,
    request: CoaAssignmentRequest,
    context: OrganizationContext
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    // Check if rule conditions are met
    const conditionMet = this.evaluateRuleCondition(rule.condition, request, context);
    
    if (!conditionMet) {
      return result; // Rule doesn't apply
    }

    // Execute rule actions based on rule type
    switch (rule.rule_type) {
      case 'system':
        this.executeSystemRule(rule, request, context, result);
        break;
      case 'validation':
        this.executeValidationRule_Internal(rule, request, context, result);
        break;
      case 'governance':
        this.executeGovernanceRule(rule, request, context, result);
        break;
      case 'recommendation':
        this.executeRecommendationRule(rule, request, context, result);
        break;
    }

    return result;
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateRuleCondition(
    condition: any,
    request: CoaAssignmentRequest,
    context: OrganizationContext
  ): boolean {
    // Simple condition evaluation - can be enhanced with a proper expression engine
    try {
      if (condition.organization) {
        const orgConditions = condition.organization;
        
        // Check country requirement
        if (orgConditions.country?.required && !context.country) {
          return true; // Condition met for missing country
        }
        
        // Check status
        if (orgConditions.status && context.status !== orgConditions.status) {
          return false;
        }
        
        // Check has_transactions
        if (orgConditions.has_transactions !== undefined && context.has_transactions !== orgConditions.has_transactions) {
          return false;
        }
        
        // Check industry existence
        if (orgConditions.industry?.exists && !context.industry) {
          return false;
        }
        
        // Check multiple locations
        if (orgConditions.has_multiple_locations !== undefined && context.has_multiple_locations !== orgConditions.has_multiple_locations) {
          return false;
        }
      }

      if (condition.template_assignment) {
        const templateConditions = condition.template_assignment;
        
        // Check country template existence
        if (templateConditions.country_template?.exists && !request.country_template) {
          return false;
        }
        
        // Check industry template existence
        if (templateConditions.industry_template?.exists && !request.industry_template) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error evaluating rule condition:', error);
      return false;
    }
  }

  /**
   * Execute system rules (cannot be overridden)
   */
  private executeSystemRule(
    rule: ValidationRule,
    request: CoaAssignmentRequest,
    context: OrganizationContext,
    result: ValidationResult
  ): void {
    switch (rule.rule_id) {
      case 'base_template_immutable':
        // Ensure base template is always universal_base
        if (rule.action.force_base_template) {
          // This would be handled in the assignment logic
          result.warnings.push({
            rule_id: rule.rule_id,
            message: rule.action.info_message || rule.description
          });
        }
        break;
        
      default:
        console.warn(`Unknown system rule: ${rule.rule_id}`);
    }
  }

  /**
   * Execute validation rules (data integrity)
   */
  private executeValidationRule_Internal(
    rule: ValidationRule,
    request: CoaAssignmentRequest,
    context: OrganizationContext,
    result: ValidationResult
  ): void {
    switch (rule.rule_id) {
      case 'country_template_required':
        if (!context.country) {
          result.errors.push({
            rule_id: rule.rule_id,
            message: rule.action.error_message || 'Country template is required',
            severity: 'critical',
            field: 'country_template'
          });
        }
        break;
        
      case 'template_compatibility':
        if (request.country_template && request.industry_template) {
          const compatibility = this.templateService.validateTemplateCompatibility(
            request.country_template,
            request.industry_template
          );
          
          if (!compatibility.valid) {
            result.errors.push({
              rule_id: rule.rule_id,
              message: `Template compatibility issues: ${compatibility.conflicts.join(', ')}`,
              severity: 'high'
            });
          }
        }
        break;
        
      case 'regulatory_compliance':
        if (context.regulatory_requirements?.length) {
          // Check if selected templates meet regulatory requirements
          const missingRequirements = this.checkRegulatoryCompliance(request, context);
          if (missingRequirements.length > 0) {
            result.errors.push({
              rule_id: rule.rule_id,
              message: `Missing regulatory requirements: ${missingRequirements.join(', ')}`,
              severity: 'high'
            });
          }
        }
        break;
        
      default:
        console.warn(`Unknown validation rule: ${rule.rule_id}`);
    }
  }

  /**
   * Execute governance rules (business rules)
   */
  private executeGovernanceRule(
    rule: ValidationRule,
    request: CoaAssignmentRequest,
    context: OrganizationContext,
    result: ValidationResult
  ): void {
    switch (rule.rule_id) {
      case 'lock_after_golive':
        if (context.status === 'live' && context.has_transactions) {
          result.warnings.push({
            rule_id: rule.rule_id,
            message: rule.action.error_message || 'Template changes require approval after go-live',
            suggestion: 'Contact system administrator for approval'
          });
        }
        break;
        
      case 'fiscal_year_alignment':
        if (context.fiscal_year_end && this.isDuringFiscalYear(context.fiscal_year_end)) {
          result.warnings.push({
            rule_id: rule.rule_id,
            message: rule.action.warning_message || 'Template changes during fiscal year may impact reporting'
          });
        }
        break;
        
      case 'multi_location_governance':
        if (context.has_multiple_locations && context.parent_organization_id) {
          result.warnings.push({
            rule_id: rule.rule_id,
            message: rule.action.warning_message || 'Consider template consistency across locations'
          });
        }
        break;
        
      default:
        console.warn(`Unknown governance rule: ${rule.rule_id}`);
    }
  }

  /**
   * Execute recommendation rules
   */
  private executeRecommendationRule(
    rule: ValidationRule,
    request: CoaAssignmentRequest,
    context: OrganizationContext,
    result: ValidationResult
  ): void {
    switch (rule.rule_id) {
      case 'industry_template_suggested':
        if (context.industry && !request.industry_template) {
          result.recommendations.push({
            rule_id: rule.rule_id,
            message: rule.action.info_message || 'Industry-specific template recommended',
            benefit: 'Industry templates provide specialized accounts and reporting capabilities',
            optional: true
          });
        }
        break;
        
      default:
        console.warn(`Unknown recommendation rule: ${rule.rule_id}`);
    }
  }

  /**
   * Check regulatory compliance for templates
   */
  private checkRegulatoryCompliance(
    request: CoaAssignmentRequest,
    context: OrganizationContext
  ): string[] {
    const missing: string[] = [];
    
    // This would be enhanced based on actual regulatory requirements
    if (context.regulatory_requirements) {
      for (const requirement of context.regulatory_requirements) {
        // Placeholder logic - would check if templates satisfy requirements
        if (requirement === 'GST_COMPLIANCE' && context.country === 'india' && !request.country_template) {
          missing.push('GST compliance requires India country template');
        }
      }
    }
    
    return missing;
  }

  /**
   * Check if current date is during fiscal year
   */
  private isDuringFiscalYear(fiscalYearEnd: string): boolean {
    // Simple check - would be enhanced with proper fiscal year logic
    const today = new Date();
    const fyEnd = new Date(fiscalYearEnd);
    const fyStart = new Date(fyEnd.getFullYear() - 1, fyEnd.getMonth(), fyEnd.getDate());
    
    return today >= fyStart && today <= fyEnd;
  }

  /**
   * Validate account structure integrity
   */
  public validateAccountStructure(accounts: CoaAccount[]): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    // Check for required accounts
    const requiredAccounts = ['1100000', '1200000', '2100000', '3100000', '3300000', '4100000', '5000000'];
    const existingCodes = new Set(accounts.map(acc => acc.code));
    
    for (const requiredCode of requiredAccounts) {
      if (!existingCodes.has(requiredCode)) {
        result.errors.push({
          rule_id: 'required_accounts',
          message: `Required account ${requiredCode} is missing`,
          severity: 'high',
          field: 'accounts'
        });
      }
    }

    // Check for duplicate codes
    const codeCounts = new Map<string, number>();
    accounts.forEach(acc => {
      codeCounts.set(acc.code, (codeCounts.get(acc.code) || 0) + 1);
    });

    for (const [code, count] of codeCounts) {
      if (count > 1) {
        result.errors.push({
          rule_id: 'duplicate_codes',
          message: `Duplicate account code: ${code}`,
          severity: 'critical',
          field: 'accounts'
        });
      }
    }

    // Check normal balance consistency
    for (const account of accounts) {
      const expectedBalance = this.getExpectedNormalBalance(account.code);
      if (expectedBalance && account.normal_balance !== expectedBalance) {
        result.warnings.push({
          rule_id: 'normal_balance_check',
          message: `Account ${account.code} has unexpected normal balance: ${account.normal_balance}, expected: ${expectedBalance}`
        });
      }
    }

    result.valid = result.errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0;
    return result;
  }

  /**
   * Get expected normal balance based on account code
   */
  private getExpectedNormalBalance(code: string): 'debit' | 'credit' | null {
    const codeNum = parseInt(code);
    
    if (codeNum >= 1000000 && codeNum <= 1999999) return 'debit';  // Assets
    if (codeNum >= 2000000 && codeNum <= 2999999) return 'credit'; // Liabilities
    if (codeNum >= 3000000 && codeNum <= 3999999) return 'credit'; // Equity
    if (codeNum >= 4000000 && codeNum <= 4999999) return 'credit'; // Revenue
    if (codeNum >= 5000000 && codeNum <= 5999999) return 'debit';  // Expenses
    
    return null;
  }

  /**
   * Get validation summary for display
   */
  public getValidationSummary(result: ValidationResult): string {
    const criticalErrors = result.errors.filter(e => e.severity === 'critical').length;
    const highErrors = result.errors.filter(e => e.severity === 'high').length;
    const warnings = result.warnings.length;
    const recommendations = result.recommendations.length;

    if (criticalErrors > 0) {
      return `Validation failed: ${criticalErrors} critical error(s)`;
    }
    
    if (highErrors > 0) {
      return `Validation issues: ${highErrors} error(s), ${warnings} warning(s)`;
    }
    
    if (warnings > 0) {
      return `Validation passed with ${warnings} warning(s), ${recommendations} recommendation(s)`;
    }
    
    return 'Validation passed successfully';
  }
}

export default CoaValidationService;