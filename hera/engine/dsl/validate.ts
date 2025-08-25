import { PostingSchema, PostingSchemaType } from './posting_schema';
import { ZodError } from 'zod';

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validates a posting schema configuration
 */
export function validatePostingSchema(schema: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  try {
    // Parse with Zod
    const parsed = PostingSchema.parse(schema);
    
    // Additional business validations
    const businessErrors = validateBusinessRules(parsed);
    errors.push(...businessErrors);
    
    // Generate warnings
    const businessWarnings = generateWarnings(parsed);
    warnings.push(...businessWarnings);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    if (error instanceof ZodError) {
      // Transform Zod errors to our format
      for (const issue of error.issues) {
        errors.push({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        });
      }
    } else {
      errors.push({
        path: '',
        message: 'Unknown validation error',
        code: 'UNKNOWN_ERROR'
      });
    }
    
    return {
      valid: false,
      errors,
      warnings
    };
  }
}

/**
 * Additional business rule validations
 */
function validateBusinessRules(schema: PostingSchemaType): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for duplicate dimension requirements
  const accountPatterns = new Set<string>();
  schema.dimension_requirements.forEach((req, index) => {
    if (accountPatterns.has(req.account_pattern)) {
      errors.push({
        path: `dimension_requirements[${index}].account_pattern`,
        message: `Duplicate account pattern: ${req.account_pattern}`,
        code: 'DUPLICATE_PATTERN'
      });
    }
    accountPatterns.add(req.account_pattern);
  });
  
  // Check split rules reference valid dimensions
  schema.splits.rules.forEach((rule, index) => {
    if (!schema.splits.dimensions.includes(rule.split_by as any)) {
      errors.push({
        path: `splits.rules[${index}].split_by`,
        message: `Split dimension '${rule.split_by}' not in available dimensions`,
        code: 'INVALID_DIMENSION'
      });
    }
  });
  
  // Validate regex patterns
  schema.dimension_requirements.forEach((req, index) => {
    try {
      new RegExp(req.account_pattern);
    } catch {
      errors.push({
        path: `dimension_requirements[${index}].account_pattern`,
        message: `Invalid regex pattern: ${req.account_pattern}`,
        code: 'INVALID_REGEX'
      });
    }
  });
  
  schema.splits.rules.forEach((rule, index) => {
    try {
      new RegExp(rule.event_pattern);
    } catch {
      errors.push({
        path: `splits.rules[${index}].event_pattern`,
        message: `Invalid regex pattern: ${rule.event_pattern}`,
        code: 'INVALID_REGEX'
      });
    }
  });
  
  return errors;
}

/**
 * Generate warnings for potential issues
 */
function generateWarnings(schema: PostingSchemaType): string[] {
  const warnings: string[] = [];
  
  // Warn if no payment configuration
  if (!schema.payments) {
    warnings.push('No payment configuration specified. Using defaults.');
  }
  
  // Warn if no validation configuration
  if (!schema.validations) {
    warnings.push('No validation configuration specified. Using defaults.');
  }
  
  // Warn about missing common accounts
  if (!schema.accounts.fees) {
    warnings.push('No fees account configured. Payment fees will not be recorded.');
  }
  
  if (!schema.accounts.discount) {
    warnings.push('No discount account configured. Discounts will reduce revenue directly.');
  }
  
  if (!schema.accounts.rounding) {
    warnings.push('No rounding account configured. Rounding differences will affect revenue.');
  }
  
  // Warn about auto_default without defaults
  schema.dimension_requirements.forEach((req, index) => {
    if (req.enforcement === 'auto_default' && !req.default_values) {
      warnings.push(
        `Dimension requirement at index ${index} uses auto_default but has no default values`
      );
    }
  });
  
  // Warn about broad patterns
  if (schema.dimension_requirements.some(req => req.account_pattern === '.*')) {
    warnings.push('Using wildcard pattern .* will apply to all accounts');
  }
  
  return warnings;
}

/**
 * Get human-readable error messages
 */
export function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.map(error => {
    if (error.path) {
      return `${error.path}: ${error.message}`;
    }
    return error.message;
  });
}

/**
 * Check if a specific account requires dimensions
 */
export function getRequiredDimensions(
  schema: PostingSchemaType,
  accountCode: string
): { dimensions: string[]; enforcement: string } | null {
  for (const req of schema.dimension_requirements) {
    const regex = new RegExp(req.account_pattern);
    if (regex.test(accountCode)) {
      return {
        dimensions: req.required_dimensions,
        enforcement: req.enforcement
      };
    }
  }
  return null;
}

/**
 * Check if an event matches a split rule
 */
export function matchSplitRule(
  schema: PostingSchemaType,
  eventSmartCode: string
): SplitRuleType | null {
  for (const rule of schema.splits.rules) {
    const regex = new RegExp(rule.event_pattern);
    if (regex.test(eventSmartCode)) {
      return rule;
    }
  }
  return null;
}