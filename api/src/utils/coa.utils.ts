// Chart of Accounts Utilities
// Helper functions for COA validation and processing

import { ACCOUNT_CODE_PATTERN, OrganizationNotFoundError } from '../types/coa.types';
import { DatabaseService } from '../services/database.service';

/**
 * Validate account code format (7-digit number)
 */
export function validateAccountCode(accountCode: string): boolean {
  return ACCOUNT_CODE_PATTERN.test(accountCode);
}

/**
 * Validate organization exists and user has access
 */
export async function validateOrganizationAccess(
  db: DatabaseService, 
  organizationId: string
): Promise<void> {
  const query = `
    SELECT COUNT(*) as count
    FROM core_organizations 
    WHERE id = $1::uuid
  `;
  
  try {
    const result = await db.query(query, [organizationId]);
    const count = parseInt(result.rows[0]?.count || '0');
    
    if (count === 0) {
      throw new OrganizationNotFoundError(organizationId);
    }
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      throw error;
    }
    throw new Error(`Failed to validate organization access: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate next available account code in a range
 */
export function generateNextAccountCode(
  existingCodes: string[], 
  rangeStart: number, 
  rangeEnd: number
): string {
  const existingNumbers = existingCodes
    .map(code => parseInt(code))
    .filter(num => num >= rangeStart && num <= rangeEnd)
    .sort((a, b) => a - b);

  // Find first gap in sequence
  for (let i = rangeStart; i <= rangeEnd; i++) {
    if (!existingNumbers.includes(i)) {
      return i.toString().padStart(7, '0');
    }
  }

  throw new Error(`No available account codes in range ${rangeStart}-${rangeEnd}`);
}

/**
 * Determine account type based on account code
 */
export function getAccountTypeFromCode(accountCode: string): string {
  const code = parseInt(accountCode);
  
  if (code >= 1000000 && code <= 1999999) return 'assets';
  if (code >= 2000000 && code <= 2999999) return 'liabilities';
  if (code >= 3000000 && code <= 3999999) return 'equity';
  if (code >= 4000000 && code <= 4999999) return 'revenue';
  if (code >= 5000000 && code <= 5999999) return 'expenses';
  
  throw new Error(`Invalid account code range: ${accountCode}`);
}

/**
 * Determine account subtype based on account code
 */
export function getAccountSubtypeFromCode(accountCode: string): string {
  const code = parseInt(accountCode);
  
  // Assets
  if (code >= 1100000 && code <= 1499999) return 'current_assets';
  if (code >= 1500000 && code <= 1999999) return 'non_current_assets';
  
  // Liabilities
  if (code >= 2100000 && code <= 2499999) return 'current_liabilities';
  if (code >= 2500000 && code <= 2999999) return 'non_current_liabilities';
  
  // Equity
  if (code >= 3000000 && code <= 3999999) return 'equity';
  
  // Revenue
  if (code >= 4000000 && code <= 4999999) return 'revenue';
  
  // Expenses
  if (code >= 5000000 && code <= 5099999) return 'cost_of_sales';
  if (code >= 5100000 && code <= 5899999) return 'operating_expenses';
  if (code >= 5900000 && code <= 5999999) return 'other_expenses';
  
  return 'other';
}

/**
 * Get normal balance for account type
 */
export function getNormalBalance(accountType: string): 'debit' | 'credit' {
  switch (accountType) {
    case 'assets':
    case 'expenses':
      return 'debit';
    case 'liabilities':
    case 'equity':
    case 'revenue':
      return 'credit';
    default:
      throw new Error(`Unknown account type: ${accountType}`);
  }
}

/**
 * Format account code with proper spacing for display
 */
export function formatAccountCode(accountCode: string): string {
  if (accountCode.length !== 7) {
    return accountCode;
  }
  
  // Format as X-XXX-XXX
  return `${accountCode[0]}-${accountCode.slice(1, 4)}-${accountCode.slice(4)}`;
}

/**
 * Parse formatted account code back to standard format
 */
export function parseFormattedAccountCode(formattedCode: string): string {
  return formattedCode.replace(/[-\s]/g, '');
}

/**
 * Validate account name
 */
export function validateAccountName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const trimmed = name.trim();
  
  // Must be between 2 and 100 characters
  if (trimmed.length < 2 || trimmed.length > 100) {
    return false;
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) {
    return false;
  }
  
  // Cannot start or end with special characters
  if (/^[^a-zA-Z0-9]|[^a-zA-Z0-9]$/.test(trimmed)) {
    return false;
  }
  
  return true;
}

/**
 * Sanitize account name for storage
 */
export function sanitizeAccountName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s&()-]/g, '') // Remove special characters except common business ones
    .substring(0, 100); // Limit length
}

/**
 * Sort accounts by code numerically
 */
export function sortAccountsByCode<T extends { account_code: string }>(accounts: T[]): T[] {
  return accounts.sort((a, b) => {
    const codeA = parseInt(a.account_code);
    const codeB = parseInt(b.account_code);
    return codeA - codeB;
  });
}

/**
 * Group accounts by type
 */
export function groupAccountsByType<T extends { metadata?: { account_type?: string } }>(
  accounts: T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  
  for (const account of accounts) {
    const type = account.metadata?.account_type || 'other';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(account);
  }
  
  return grouped;
}

/**
 * Filter accounts by template layer
 */
export function filterAccountsByLayer<T extends { metadata?: { template_layer?: string } }>(
  accounts: T[],
  layer: string
): T[] {
  return accounts.filter(account => account.metadata?.template_layer === layer);
}

/**
 * Check if account code conflicts with existing codes
 */
export function hasAccountCodeConflict(
  newCode: string, 
  existingCodes: string[]
): boolean {
  return existingCodes.includes(newCode);
}

/**
 * Generate account code suggestions based on account type
 */
export function suggestAccountCodes(
  accountType: string, 
  existingCodes: string[], 
  count: number = 5
): string[] {
  const suggestions: string[] = [];
  let rangeStart: number;
  let rangeEnd: number;
  
  // Define ranges for each account type
  switch (accountType) {
    case 'assets':
      rangeStart = 1000000;
      rangeEnd = 1999999;
      break;
    case 'liabilities':
      rangeStart = 2000000;
      rangeEnd = 2999999;
      break;
    case 'equity':
      rangeStart = 3000000;
      rangeEnd = 3999999;
      break;
    case 'revenue':
      rangeStart = 4000000;
      rangeEnd = 4999999;
      break;
    case 'expenses':
      rangeStart = 5000000;
      rangeEnd = 5999999;
      break;
    default:
      throw new Error(`Unknown account type: ${accountType}`);
  }
  
  const existingNumbers = existingCodes
    .map(code => parseInt(code))
    .filter(num => num >= rangeStart && num <= rangeEnd)
    .sort((a, b) => a - b);
  
  // Generate suggestions
  let current = rangeStart;
  while (suggestions.length < count && current <= rangeEnd) {
    if (!existingNumbers.includes(current)) {
      suggestions.push(current.toString());
    }
    current += 1000; // Increment by 1000 for spacing
  }
  
  // If we don't have enough suggestions, fill gaps
  if (suggestions.length < count) {
    for (let i = rangeStart; i <= rangeEnd && suggestions.length < count; i++) {
      if (!existingNumbers.includes(i) && !suggestions.includes(i.toString())) {
        suggestions.push(i.toString());
      }
    }
  }
  
  return suggestions;
}

/**
 * Calculate COA completeness score
 */
export function calculateCOACompleteness(
  accountCounts: Record<string, number>
): { score: number; recommendations: string[] } {
  const recommendations: string[] = [];
  let score = 0;
  
  // Check required account types
  const requiredTypes = ['assets', 'liabilities', 'equity', 'revenue', 'expenses'];
  let typesPresent = 0;
  
  for (const type of requiredTypes) {
    if (accountCounts[type] && accountCounts[type] > 0) {
      typesPresent++;
      score += 15; // 15 points per required type
    } else {
      recommendations.push(`Add ${type} accounts`);
    }
  }
  
  // Bonus points for good coverage
  if (accountCounts.assets >= 5) score += 5;
  if (accountCounts.liabilities >= 3) score += 5;
  if (accountCounts.revenue >= 2) score += 5;
  if (accountCounts.expenses >= 8) score += 5;
  
  // Recommendations for improvement
  if (accountCounts.assets < 5) {
    recommendations.push('Consider adding more asset accounts for better tracking');
  }
  if (accountCounts.expenses < 8) {
    recommendations.push('Add more expense accounts for detailed expense tracking');
  }
  
  return { score: Math.min(100, score), recommendations };
}