/**
 * 🛡️ HERA Digital Accountant SQL Guardrails
 * 
 * Enforces sacred 6-table architecture and prevents schema violations
 * Ensures multi-tenant isolation and data integrity for accounting operations
 * 
 * Smart Code: HERA.FIN.ACCT.DIGITAL.GUARDRAILS.v1
 */

import { ValidationError, ValidationResult } from '@/types/digital-accountant.types';

// ================================================================================
// SACRED TABLES
// ================================================================================

export const SACRED_TABLES = [
  'core_organizations',
  'core_entities', 
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
] as const;

export type SacredTable = typeof SACRED_TABLES[number];

// ================================================================================
// GUARDRAIL RULES
// ================================================================================

export const GUARDRAIL_RULES = {
  // Table constraints
  SACRED_TABLES_ONLY: 'Only the 6 sacred tables are allowed',
  NO_DDL_OPERATIONS: 'DDL operations (CREATE, ALTER, DROP) are forbidden',
  NO_SCHEMA_CHANGES: 'Schema modifications are not permitted',
  
  // Security constraints
  ORG_FILTER_REQUIRED: 'organization_id filter is mandatory for all queries',
  NO_CROSS_ORG_ACCESS: 'Cross-organization data access is forbidden',
  USER_CONTEXT_REQUIRED: 'User context must be provided for audit trail',
  
  // Data integrity
  GL_BALANCE_REQUIRED: 'Journal entries must balance (debits = credits)',
  SMART_CODE_REQUIRED: 'Smart code is required for all accounting entries',
  PERIOD_VALIDATION: 'Transactions must be within valid accounting periods',
  
  // Query constraints
  MAX_RECORDS_LIMIT: 'Query must include reasonable LIMIT clause',
  NO_FULL_TABLE_SCAN: 'Full table scans without filters are forbidden',
  INDEXED_COLUMNS_ONLY: 'WHERE clauses should use indexed columns',
  
  // Relationship constraints
  MAX_JOIN_DEPTH: 'Maximum 3 levels of joins allowed',
  VALID_RELATIONSHIPS: 'Only valid relationship types allowed',
  NO_CIRCULAR_REFS: 'Circular references are forbidden'
} as const;

// ================================================================================
// SQL VALIDATOR
// ================================================================================

export class SQLGuardrailValidator {
  private organizationId: string;
  private userId: string;

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  /**
   * Validates SQL query against guardrail rules
   */
  validateQuery(sql: string, operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'): ValidationResult {
    const errors: ValidationError[] = [];
    const normalizedSql = sql.toLowerCase().trim();

    // Check for DDL operations
    if (this.containsDDL(normalizedSql)) {
      errors.push({
        code: 'DDL_VIOLATION',
        message: GUARDRAIL_RULES.NO_DDL_OPERATIONS,
        severity: 'critical'
      });
    }

    // Check for sacred tables only
    if (!this.usesSacredTablesOnly(normalizedSql)) {
      errors.push({
        code: 'TABLE_VIOLATION',
        message: GUARDRAIL_RULES.SACRED_TABLES_ONLY,
        severity: 'critical'
      });
    }

    // Check for organization filter
    if (operation !== 'INSERT' && !this.hasOrganizationFilter(normalizedSql)) {
      errors.push({
        code: 'ORG_FILTER_MISSING',
        message: GUARDRAIL_RULES.ORG_FILTER_REQUIRED,
        severity: 'critical'
      });
    }

    // Check for reasonable limits on SELECT
    if (operation === 'SELECT' && !this.hasReasonableLimit(normalizedSql)) {
      errors.push({
        code: 'LIMIT_MISSING',
        message: GUARDRAIL_RULES.MAX_RECORDS_LIMIT,
        severity: 'error',
        suggestion: 'Add LIMIT clause (max 1000 records)'
      });
    }

    // Check for complex joins
    if (this.hasExcessiveJoins(normalizedSql)) {
      errors.push({
        code: 'JOIN_DEPTH_EXCEEDED',
        message: GUARDRAIL_RULES.MAX_JOIN_DEPTH,
        severity: 'error'
      });
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings: [],
      info: []
    };
  }

  /**
   * Validates journal entry balance
   */
  validateJournalBalance(lines: Array<{ debit_amount: number; credit_amount: number }>): ValidationResult {
    const totalDebits = lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
    
    const errors: ValidationError[] = [];
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push({
        code: 'JOURNAL_UNBALANCED',
        message: `${GUARDRAIL_RULES.GL_BALANCE_REQUIRED}. Debits: ${totalDebits}, Credits: ${totalCredits}`,
        severity: 'critical',
        field: 'journal_lines'
      });
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings: [],
      info: [{
        code: 'BALANCE_CHECK',
        message: `Total Debits: ${totalDebits}, Total Credits: ${totalCredits}`
      }]
    };
  }

  /**
   * Builds safe query with guardrails
   */
  buildSafeQuery(table: SacredTable, operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE', conditions?: any): string {
    // Validate table
    if (!SACRED_TABLES.includes(table)) {
      throw new Error(`Invalid table: ${table}. ${GUARDRAIL_RULES.SACRED_TABLES_ONLY}`);
    }

    let query = '';

    switch (operation) {
      case 'SELECT':
        query = `SELECT * FROM ${table} WHERE organization_id = $1`;
        if (conditions) {
          Object.entries(conditions).forEach(([key, value], index) => {
            query += ` AND ${key} = $${index + 2}`;
          });
        }
        query += ' LIMIT 1000';
        break;

      case 'INSERT':
        query = `INSERT INTO ${table} (organization_id, ${Object.keys(conditions || {}).join(', ')}) VALUES ($1, ${Object.keys(conditions || {}).map((_, i) => `$${i + 2}`).join(', ')}) RETURNING *`;
        break;

      case 'UPDATE':
        const setClauses = Object.keys(conditions || {}).map((key, i) => `${key} = $${i + 2}`).join(', ');
        query = `UPDATE ${table} SET ${setClauses}, updated_at = NOW(), updated_by = $2 WHERE organization_id = $1`;
        break;

      case 'DELETE':
        query = `UPDATE ${table} SET status = 'deleted', updated_at = NOW(), updated_by = $2 WHERE organization_id = $1`;
        break;
    }

    return query;
  }

  /**
   * Sanitizes smart code
   */
  validateSmartCode(smartCode: string): boolean {
    const pattern = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/;
    return pattern.test(smartCode);
  }

  // Private helper methods
  private containsDDL(sql: string): boolean {
    const ddlPatterns = [
      /\bcreate\s+(table|index|view|function|trigger)\b/,
      /\balter\s+table\b/,
      /\bdrop\s+(table|index|view|function|trigger)\b/,
      /\btruncate\b/
    ];
    return ddlPatterns.some(pattern => pattern.test(sql));
  }

  private usesSacredTablesOnly(sql: string): boolean {
    // Extract table names from FROM and JOIN clauses
    const tablePattern = /(?:from|join)\s+(\w+)/gi;
    const matches = sql.matchAll(tablePattern);
    
    for (const match of matches) {
      const tableName = match[1];
      if (!SACRED_TABLES.includes(tableName as SacredTable)) {
        return false;
      }
    }
    
    return true;
  }

  private hasOrganizationFilter(sql: string): boolean {
    return sql.includes('organization_id');
  }

  private hasReasonableLimit(sql: string): boolean {
    if (!sql.includes('limit')) return false;
    
    const limitMatch = sql.match(/limit\s+(\d+)/);
    if (!limitMatch) return false;
    
    const limit = parseInt(limitMatch[1]);
    return limit > 0 && limit <= 1000;
  }

  private hasExcessiveJoins(sql: string): boolean {
    const joinCount = (sql.match(/\bjoin\b/g) || []).length;
    return joinCount > 3;
  }
}

// ================================================================================
// RLS POLICY BUILDER
// ================================================================================

export class RLSPolicyBuilder {
  /**
   * Builds RLS policy for accounting operations
   */
  static buildAccountingPolicy(table: SacredTable, operation: string): string {
    return `
      CREATE POLICY "${table}_${operation}_accounting_policy"
      ON ${table}
      FOR ${operation}
      TO authenticated
      USING (
        organization_id = auth.jwt() ->> 'organization_id'
        AND (
          auth.jwt() ->> 'role' IN ('owner', 'admin', 'accountant')
          OR EXISTS (
            SELECT 1 FROM core_entities e
            WHERE e.id = auth.jwt() ->> 'entity_id'
            AND e.entity_type = 'user'
            AND e.metadata ->> 'accounting_access' = 'true'
          )
        )
      )
      WITH CHECK (
        organization_id = auth.jwt() ->> 'organization_id'
        AND (
          auth.jwt() ->> 'role' IN ('owner', 'admin', 'accountant')
          OR EXISTS (
            SELECT 1 FROM core_entities e
            WHERE e.id = auth.jwt() ->> 'entity_id'
            AND e.entity_type = 'user'
            AND e.metadata ->> 'accounting_access' = 'true'
          )
        )
      );
    `;
  }

  /**
   * Builds journal-specific RLS policy
   */
  static buildJournalPolicy(): string {
    return `
      CREATE POLICY "journal_entry_approval_policy"
      ON core_entities
      FOR UPDATE
      TO authenticated
      USING (
        entity_type = 'journal_entry'
        AND organization_id = auth.jwt() ->> 'organization_id'
        AND (
          -- Owners and admins can approve any journal
          auth.jwt() ->> 'role' IN ('owner', 'admin')
          -- Accountants can approve journals below threshold
          OR (
            auth.jwt() ->> 'role' = 'accountant'
            AND (metadata ->> 'total_amount')::numeric < 10000
          )
          -- Specific approval permissions
          OR EXISTS (
            SELECT 1 FROM core_dynamic_data dd
            WHERE dd.entity_id = auth.jwt() ->> 'entity_id'
            AND dd.field_name = 'journal_approval_limit'
            AND dd.field_value_number >= (metadata ->> 'total_amount')::numeric
          )
        )
      );
    `;
  }
}

// ================================================================================
// QUERY SANITIZER
// ================================================================================

export class QuerySanitizer {
  /**
   * Sanitizes user input for safe SQL usage
   */
  static sanitizeInput(input: string): string {
    // Remove SQL injection attempts
    return input
      .replace(/'/g, "''") // Escape single quotes
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove comments
      .replace(/\/\*/g, '') // Remove block comments
      .replace(/\*\//g, '')
      .trim();
  }

  /**
   * Sanitizes smart code
   */
  static sanitizeSmartCode(smartCode: string): string {
    // Only allow valid smart code characters
    return smartCode.replace(/[^A-Z0-9._v]/g, '');
  }

  /**
   * Sanitizes numeric input
   */
  static sanitizeNumber(input: any): number {
    const num = parseFloat(input);
    if (isNaN(num) || !isFinite(num)) {
      throw new Error('Invalid numeric input');
    }
    return num;
  }

  /**
   * Sanitizes date input
   */
  static sanitizeDate(input: string): string {
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date input');
    }
    return date.toISOString();
  }
}