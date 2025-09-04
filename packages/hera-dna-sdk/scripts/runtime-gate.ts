#!/usr/bin/env ts-node

/**
 * HERA DNA Runtime Gates
 * Enforces sacred principles at runtime
 */

import {
  SmartCode,
  OrganizationId,
  SacredTable,
  SACRED_TABLES,
  DNAViolationError,
  OrganizationIsolationError,
  isSmartCode,
  isOrganizationId,
  isSacredTable
} from '../src/types';

const CONFIG = require('../hera.dna.json');

export interface RuntimeGateConfig {
  enableSmartCodeValidation?: boolean;
  enableOrganizationIsolation?: boolean;
  enableSacredTableCheck?: boolean;
  enableAuditLogging?: boolean;
  currentOrganizationId?: OrganizationId;
}

export class DNARuntimeGate {
  private config: RuntimeGateConfig;
  private auditLog: any[] = [];

  constructor(config: RuntimeGateConfig = {}) {
    this.config = {
      enableSmartCodeValidation: true,
      enableOrganizationIsolation: true,
      enableSacredTableCheck: true,
      enableAuditLogging: true,
      ...config
    };
  }

  /**
   * Validate operation before execution
   */
  validateOperation(params: {
    table: string;
    operation: 'create' | 'read' | 'update' | 'delete';
    organizationId?: string;
    smartCode?: string;
    data?: any;
  }): void {
    const startTime = Date.now();

    try {
      // Check sacred table
      if (this.config.enableSacredTableCheck) {
        this.validateSacredTable(params.table);
      }

      // Check smart code
      if (this.config.enableSmartCodeValidation && params.smartCode) {
        this.validateSmartCode(params.smartCode);
      }

      // Check organization isolation
      if (this.config.enableOrganizationIsolation && params.organizationId) {
        this.validateOrganizationIsolation(params.organizationId);
      }

      // Validate data integrity
      if (params.data) {
        this.validateDataIntegrity(params.table, params.data);
      }

      // Log successful validation
      if (this.config.enableAuditLogging) {
        this.logOperation({
          ...params,
          status: 'validated',
          duration: Date.now() - startTime
        });
      }
    } catch (error) {
      // Log failed validation
      if (this.config.enableAuditLogging) {
        this.logOperation({
          ...params,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime
        });
      }
      throw error;
    }
  }

  /**
   * Validate sacred table
   */
  private validateSacredTable(table: string): void {
    if (!isSacredTable(table)) {
      throw new DNAViolationError(
        `Invalid table: ${table}. Only sacred tables allowed: ${Object.values(SACRED_TABLES).join(', ')}`,
        table as SacredTable
      );
    }
  }

  /**
   * Validate smart code format
   */
  private validateSmartCode(code: string): void {
    if (!isSmartCode(code)) {
      throw new DNAViolationError(
        `Invalid smart code format: ${code}. Must match: HERA.{INDUSTRY}.{MODULE}.{FUNCTION}.{TYPE}.v{VERSION}`,
        undefined,
        code as SmartCode
      );
    }
  }

  /**
   * Validate organization isolation
   */
  private validateOrganizationIsolation(orgId: string): void {
    if (!isOrganizationId(orgId)) {
      throw new DNAViolationError(`Invalid organization ID format: ${orgId}`);
    }

    if (this.config.currentOrganizationId && orgId !== this.config.currentOrganizationId) {
      throw new OrganizationIsolationError(orgId, this.config.currentOrganizationId);
    }
  }

  /**
   * Validate data integrity based on table
   */
  private validateDataIntegrity(table: string, data: any): void {
    switch (table) {
      case SACRED_TABLES.ENTITIES:
        this.validateEntityData(data);
        break;
      case SACRED_TABLES.TRANSACTIONS:
        this.validateTransactionData(data);
        break;
      case SACRED_TABLES.DYNAMIC_DATA:
        this.validateDynamicData(data);
        break;
      case SACRED_TABLES.RELATIONSHIPS:
        this.validateRelationshipData(data);
        break;
    }
  }

  private validateEntityData(data: any): void {
    if (!data.entity_type || !data.entity_name || !data.smart_code) {
      throw new DNAViolationError('Entity must have entity_type, entity_name, and smart_code');
    }
  }

  private validateTransactionData(data: any): void {
    if (!data.transaction_type || !data.transaction_code || !data.smart_code) {
      throw new DNAViolationError('Transaction must have transaction_type, transaction_code, and smart_code');
    }
  }

  private validateDynamicData(data: any): void {
    if (!data.entity_id || !data.field_name || !data.smart_code) {
      throw new DNAViolationError('Dynamic data must have entity_id, field_name, and smart_code');
    }

    // At least one value field must be present
    const hasValue = 
      data.field_value_text !== undefined ||
      data.field_value_number !== undefined ||
      data.field_value_date !== undefined ||
      data.field_value_boolean !== undefined ||
      data.field_value_json !== undefined;

    if (!hasValue) {
      throw new DNAViolationError('Dynamic data must have at least one field_value_* field');
    }
  }

  private validateRelationshipData(data: any): void {
    if (!data.from_entity_id || !data.to_entity_id || !data.relationship_type || !data.smart_code) {
      throw new DNAViolationError('Relationship must have from_entity_id, to_entity_id, relationship_type, and smart_code');
    }
  }

  /**
   * Log operation for audit trail
   */
  private logOperation(operation: any): void {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      ...operation
    });
  }

  /**
   * Get audit log
   */
  getAuditLog(): any[] {
    return [...this.auditLog];
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Export runtime gate metrics
   */
  getMetrics(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    violationsByType: Record<string, number>;
  } {
    const total = this.auditLog.length;
    const successful = this.auditLog.filter(op => op.status === 'validated').length;
    const failed = this.auditLog.filter(op => op.status === 'failed').length;
    
    const totalDuration = this.auditLog.reduce((sum, op) => sum + (op.duration || 0), 0);
    const averageDuration = total > 0 ? totalDuration / total : 0;

    const violationsByType = this.auditLog
      .filter(op => op.status === 'failed')
      .reduce((acc, op) => {
        const type = op.error?.includes('smart code') ? 'smart_code' :
                    op.error?.includes('organization') ? 'organization' :
                    op.error?.includes('table') ? 'table' : 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalOperations: total,
      successfulOperations: successful,
      failedOperations: failed,
      averageDuration,
      violationsByType
    };
  }
}

// Export singleton instance
export const runtimeGate = new DNARuntimeGate();

// Example usage and testing
if (require.main === module) {
  console.log('🧬 HERA DNA Runtime Gate Test\n');

  const gate = new DNARuntimeGate({
    currentOrganizationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' as OrganizationId
  });

  // Test valid operation
  try {
    gate.validateOperation({
      table: SACRED_TABLES.ENTITIES,
      operation: 'create',
      organizationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      smartCode: 'HERA.CRM.CUST.ENT.PROF.v1',
      data: {
        entity_type: 'customer',
        entity_name: 'Test Customer',
        smart_code: 'HERA.CRM.CUST.ENT.PROF.v1'
      }
    });
    console.log('✅ Valid operation passed');
  } catch (error) {
    console.error('❌ Valid operation failed:', error);
  }

  // Test invalid table
  try {
    gate.validateOperation({
      table: 'invalid_table',
      operation: 'read'
    });
  } catch (error) {
    console.log('✅ Invalid table correctly rejected:', error.message);
  }

  // Test invalid smart code
  try {
    gate.validateOperation({
      table: SACRED_TABLES.ENTITIES,
      operation: 'create',
      smartCode: 'INVALID.CODE'
    });
  } catch (error) {
    console.log('✅ Invalid smart code correctly rejected:', error.message);
  }

  // Test organization isolation violation
  try {
    gate.validateOperation({
      table: SACRED_TABLES.ENTITIES,
      operation: 'read',
      organizationId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479'
    });
  } catch (error) {
    console.log('✅ Organization isolation correctly enforced:', error.message);
  }

  // Print metrics
  console.log('\n📊 Runtime Gate Metrics:');
  console.log(gate.getMetrics());
}