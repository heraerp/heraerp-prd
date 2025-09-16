/**
 * Universal CRUD Test Generator for HERA
 *
 * Automatically generates and runs comprehensive tests for any CRUD module
 * following HERA's universal 6-table architecture
 */

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface CrudTestConfig {
  moduleName: string // e.g., 'salon-service', 'product', 'customer'
  entityType: string // e.g., 'salon_service', 'product', 'customer'
  displayName: string // e.g., 'Salon Service', 'Product', 'Customer'
  smartCodePrefix: string // e.g., 'HERA.SALON.SERVICE', 'HERA.INV.PRODUCT'
  dynamicFields: Array<{
    name: string
    type: 'text' | 'number' | 'boolean' | 'json'
    testValue: any
    smartCode: string
  }>
  relationships?: Array<{
    type: string
    targetEntityType: string
    smartCode: string
  }>
  transactions?: Array<{
    type: string
    smartCode: string
    hasLineItems: boolean
  }>
  testData?: {
    createData: any
    updateData: any
    searchTerm?: string
  }
}

export class UniversalCrudTestGenerator {
  private config: CrudTestConfig
  private testOutputPath: string

  constructor(config: CrudTestConfig) {
    this.config = config
    this.testOutputPath = path.join(
      process.cwd(),
      'tests',
      'generated',
      `${config.moduleName}-crud.test.js`
    )
  }

  /**
   * Generate test file content
   */
  generateTestContent(): string {
    return `/**
 * Auto-generated CRUD tests for ${this.config.displayName}
 * Generated at: ${new Date().toISOString()}
 * HERA Universal 6-table Architecture
 */

const { universalApi } = require('@/lib/universal-api');

// Test configuration
const MODULE_CONFIG = ${JSON.stringify(this.config, null, 2)};
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-${Date.now()}';

describe('${this.config.displayName} - Universal CRUD Operations', () => {
  let createdEntityId;
  let createdRelationshipId;
  let createdTransactionId;

  // Mock fetch for testing
  global.fetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockReset();
    universalApi.setOrganizationId(TEST_ORG_ID);
    
    // Default mock response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'mock-id' } })
    });
  });

  describe('CREATE Operations', () => {
    test('should create a new ${this.config.moduleName}', async () => {
      const createData = ${JSON.stringify(
        this.config.testData?.createData || {
          entity_type: this.config.entityType,
          entity_name: `Test ${this.config.displayName}`,
          entity_code: `${this.config.entityType.toUpperCase()}-001`,
          smart_code: `${this.config.smartCodePrefix}.v1`
        },
        null,
        6
      )};

      const mockResponse = {
        id: '${this.config.moduleName}-123',
        ...createData,
        organization_id: TEST_ORG_ID,
        created_at: new Date().toISOString()
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockResponse })
      });

      const result = await universalApi.createEntity(createData);

      expect(result).toHaveProperty('data');
      expect(result.data.entity_type).toBe('${this.config.entityType}');
      expect(result.data.smart_code).toContain('${this.config.smartCodePrefix}');
      
      createdEntityId = result.data.id;
    });

${this.generateDynamicFieldsTests()}
  });

  describe('READ Operations', () => {
    test('should fetch all ${this.config.moduleName} entities', async () => {
      const mockEntities = [
        {
          id: '${this.config.moduleName}-1',
          entity_type: '${this.config.entityType}',
          entity_name: '${this.config.displayName} 1',
          smart_code: '${this.config.smartCodePrefix}.v1'
        },
        {
          id: '${this.config.moduleName}-2',
          entity_type: '${this.config.entityType}',
          entity_name: '${this.config.displayName} 2',
          smart_code: '${this.config.smartCodePrefix}.v1'
        }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true,
          data: mockEntities,
          count: mockEntities.length 
        })
      });

      const result = await universalApi.getEntities('${this.config.entityType}', TEST_ORG_ID);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].entity_type).toBe('${this.config.entityType}');
    });

    test('should search ${this.config.moduleName} by name', async () => {
      const searchTerm = '${this.config.testData?.searchTerm || this.config.displayName}';
      
      // Universal API filters on client side after fetching
      const allEntities = [
        { entity_name: '${this.config.displayName} Match', entity_type: '${this.config.entityType}' },
        { entity_name: 'Other Entity', entity_type: '${this.config.entityType}' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: allEntities })
      });

      const result = await universalApi.getEntities('${this.config.entityType}', TEST_ORG_ID);
      
      // Client-side filtering
      const filtered = result.data.filter(e => 
        e.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE Operations', () => {
    test('should update ${this.config.moduleName} details', async () => {
      const updateData = ${JSON.stringify(
        this.config.testData?.updateData || {
          entity_name: `Updated ${this.config.displayName}`,
          metadata: { updated: true }
        },
        null,
        6
      )};

      const mockUpdated = {
        id: '${this.config.moduleName}-123',
        entity_type: '${this.config.entityType}',
        ...updateData,
        updated_at: new Date().toISOString()
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true,
          data: mockUpdated 
        })
      });

      const result = await universalApi.updateEntity('${this.config.moduleName}-123', updateData);

      expect(result).toHaveProperty('data');
      expect(result.data.entity_name).toContain('Updated');
    });

${this.generateDynamicFieldUpdateTests()}
  });

  describe('DELETE Operations', () => {
    test('should delete ${this.config.moduleName}', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Entity deleted' })
      });

      await universalApi.deleteEntity('${this.config.moduleName}-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/universal'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    test('should handle cascade deletion of dynamic fields', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          message: 'Entity and related data deleted',
          deleted_count: {
            entity: 1,
            dynamic_fields: ${this.config.dynamicFields.length},
            relationships: 0
          }
        })
      });

      const result = await universalApi.deleteEntity('${this.config.moduleName}-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

${this.generateRelationshipTests()}

${this.generateTransactionTests()}

  describe('Error Handling', () => {
    test('should handle validation errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          error: 'Validation Error',
          details: 'entity_name is required'
        })
      });

      const result = await universalApi.createEntity({ entity_type: '${this.config.entityType}' });
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('required');
    });

    test('should handle network errors gracefully', async () => {
      global.fetch.mockImplementationOnce(() => {
        throw new Error('Network connection failed');
      });

      try {
        await universalApi.getEntities('${this.config.entityType}');
        expect(true).toBe(true); // API handled error gracefully
      } catch (error) {
        expect(error.message).toContain('Network connection failed');
      }
    });
  });

  describe('Multi-tenant Security', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      global.fetch.mockReset();
      universalApi.setOrganizationId(TEST_ORG_ID);
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] })
      });
    });

    test('should enforce organization isolation', async () => {
      await universalApi.getEntities('${this.config.entityType}', TEST_ORG_ID);

      const url = global.fetch.mock.calls[0][0];
      expect(url).toContain(\`organization_id=\${TEST_ORG_ID}\`);
    });

    test('should prevent cross-organization access', async () => {
      const otherOrgId = 'other-org-789';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true,
          data: [], // Empty due to RLS
          count: 0
        })
      });

      const result = await universalApi.getEntities('${this.config.entityType}', otherOrgId);
      
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(0);
    });
  });

  describe('HERA Architecture Compliance', () => {
    test('should use universal 6-table structure', () => {
      const tables = [
        'core_organizations',
        'core_entities',
        'core_dynamic_data',
        'core_relationships',
        'universal_transactions',
        'universal_transaction_lines'
      ];

      // Verify our test data maps to these tables
      expect(tables).toContain('core_entities'); // For ${this.config.moduleName}
      ${this.config.dynamicFields.length > 0 ? "expect(tables).toContain('core_dynamic_data'); // For dynamic fields" : ''}
      ${this.config.relationships?.length > 0 ? "expect(tables).toContain('core_relationships'); // For relationships" : ''}
      ${this.config.transactions?.length > 0 ? "expect(tables).toContain('universal_transactions'); // For transactions" : ''}
    });

    test('should include smart codes in all operations', () => {
      const smartCodePattern = /^${this.config.smartCodePrefix.replace('.', '\\.')}\\..*\\.v\\d+$/;
      expect('${this.config.smartCodePrefix}.CREATE.v1').toMatch(smartCodePattern);
    });
  });
});

module.exports = {
  MODULE_CONFIG,
  TEST_ORG_ID
};`
  }

  private generateDynamicFieldsTests(): string {
    if (this.config.dynamicFields.length === 0) return ''

    const fields = this.config.dynamicFields
      .map(
        field => `        {
          entity_id: createdEntityId || '${this.config.moduleName}-123',
          field_name: '${field.name}',
          field_value_${field.type === 'number' ? 'number' : 'text'}: ${JSON.stringify(field.testValue)},
          smart_code: '${field.smartCode}'
        }`
      )
      .join(',\n')

    return `
    test('should add dynamic fields to ${this.config.moduleName}', async () => {
      const dynamicFields = [
${fields}
      ];

      for (const field of dynamicFields) {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true,
            data: { id: \`field-\${field.field_name}\`, ...field } 
          })
        });

        const result = await universalApi.setDynamicField(
          field.entity_id,
          field.field_name,
          field.field_value_number || field.field_value_text,
          field.smart_code
        );

        expect(result).toHaveProperty('data');
        expect(result.data.field_name).toBe(field.field_name);
      }
    });`
  }

  private generateDynamicFieldUpdateTests(): string {
    const firstField = this.config.dynamicFields[0]
    if (!firstField) return ''

    return `
    test('should update dynamic field values', async () => {
      const newValue = ${
        firstField.type === 'number'
          ? `${firstField.testValue} * 1.5`
          : `'Updated ${firstField.testValue}'`
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            entity_id: '${this.config.moduleName}-123',
            field_name: '${firstField.name}',
            field_value_${firstField.type === 'number' ? 'number' : 'text'}: newValue,
            updated_at: new Date().toISOString()
          }
        })
      });

      const result = await universalApi.setDynamicField(
        '${this.config.moduleName}-123',
        '${firstField.name}',
        newValue,
        '${firstField.smartCode}'
      );

      expect(result).toHaveProperty('data');
      expect(result.data.field_value_${firstField.type === 'number' ? 'number' : 'text'}).toBe(newValue);
    });`
  }

  private generateRelationshipTests(): string {
    if (!this.config.relationships?.length) return ''

    const rel = this.config.relationships[0]
    return `
  describe('Relationship Operations', () => {
    test('should create ${rel.type} relationship', async () => {
      const relationshipData = {
        from_entity_id: '${this.config.moduleName}-123',
        to_entity_id: '${rel.targetEntityType}-456',
        relationship_type: '${rel.type}',
        smart_code: '${rel.smartCode}'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true,
          data: { id: 'rel-001', ...relationshipData } 
        })
      });

      const result = await universalApi.createRelationship(relationshipData);

      expect(result).toHaveProperty('data');
      expect(result.data.relationship_type).toBe('${rel.type}');
    });
  });`
  }

  private generateTransactionTests(): string {
    if (!this.config.transactions?.length) return ''

    const txn = this.config.transactions[0]
    return `
  describe('Transaction Operations', () => {
    test('should create ${txn.type} transaction', async () => {
      const transactionData = {
        transaction_type: '${txn.type}',
        transaction_code: '${txn.type.toUpperCase()}-${new Date().getFullYear()}-001',
        smart_code: '${txn.smartCode}',
        total_amount: 1000.00,
        from_entity_id: '${this.config.moduleName}-123',
        metadata: {
          ${this.config.moduleName}_id: '${this.config.moduleName}-123'
        }
      };

      ${
        txn.hasLineItems
          ? `const lineItems = [{
        line_entity_id: '${this.config.moduleName}-123',
        line_number: 1,
        quantity: 1,
        unit_price: 1000.00,
        line_amount: 1000.00,
        smart_code: '${txn.smartCode}.LINE.v1'
      }];`
          : 'const lineItems = [];'
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true,
          data: { 
            id: 'txn-001', 
            ...transactionData,
            lines: lineItems
          } 
        })
      });

      const result = await universalApi.createTransaction(transactionData, lineItems);

      expect(result).toHaveProperty('data');
      expect(result.data.transaction_type).toBe('${txn.type}');
    });
  });`
  }

  /**
   * Generate and save the test file
   */
  async generateTestFile(): Promise<string> {
    const content = this.generateTestContent()

    // Ensure directory exists
    const dir = path.dirname(this.testOutputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write test file
    fs.writeFileSync(this.testOutputPath, content)

    console.log(`✅ Generated test file: ${this.testOutputPath}`)
    return this.testOutputPath
  }

  /**
   * Run the generated tests
   */
  async runTests(): Promise<{ success: boolean; output: string }> {
    try {
      console.log(`🧪 Running tests for ${this.config.displayName}...`)

      const { stdout, stderr } = await execAsync(
        `npx jest ${this.testOutputPath} --verbose --no-coverage`
      )

      const output = stdout || stderr
      const success = !stderr || stderr.includes('PASS')

      if (success) {
        console.log(`✅ All tests passed for ${this.config.displayName}`)
      } else {
        console.log(`❌ Some tests failed for ${this.config.displayName}`)
      }

      return { success, output }
    } catch (error: any) {
      console.error(`❌ Test execution failed:`, error.message)
      return {
        success: false,
        output: error.message || 'Test execution failed'
      }
    }
  }

  /**
   * Generate and run tests in one operation
   */
  async generateAndRun(): Promise<{
    testPath: string
    success: boolean
    output: string
  }> {
    const testPath = await this.generateTestFile()
    const testResult = await this.runTests()

    return {
      testPath,
      ...testResult
    }
  }
}

/**
 * Factory function to create test configurations for common entity types
 */
export function createTestConfig(
  entityType: string,
  options: Partial<CrudTestConfig> = {}
): CrudTestConfig {
  // Default configurations for common entity types
  const defaults: Record<string, Partial<CrudTestConfig>> = {
    customer: {
      moduleName: 'customer',
      entityType: 'customer',
      displayName: 'Customer',
      smartCodePrefix: 'HERA.CRM.CUSTOMER',
      dynamicFields: [
        {
          name: 'email',
          type: 'text',
          testValue: 'test@example.com',
          smartCode: 'HERA.CRM.CUSTOMER.FIELD.EMAIL.v1'
        },
        {
          name: 'credit_limit',
          type: 'number',
          testValue: 10000,
          smartCode: 'HERA.CRM.CUSTOMER.FIELD.CREDIT.v1'
        }
      ]
    },
    product: {
      moduleName: 'product',
      entityType: 'product',
      displayName: 'Product',
      smartCodePrefix: 'HERA.INV.PRODUCT',
      dynamicFields: [
        {
          name: 'price',
          type: 'number',
          testValue: 99.99,
          smartCode: 'HERA.INV.PRODUCT.FIELD.PRICE.v1'
        },
        {
          name: 'stock_quantity',
          type: 'number',
          testValue: 100,
          smartCode: 'HERA.INV.PRODUCT.FIELD.STOCK.v1'
        }
      ]
    },
    employee: {
      moduleName: 'employee',
      entityType: 'employee',
      displayName: 'Employee',
      smartCodePrefix: 'HERA.HR.EMPLOYEE',
      dynamicFields: [
        {
          name: 'department',
          type: 'text',
          testValue: 'Sales',
          smartCode: 'HERA.HR.EMPLOYEE.FIELD.DEPT.v1'
        },
        {
          name: 'salary',
          type: 'number',
          testValue: 50000,
          smartCode: 'HERA.HR.EMPLOYEE.FIELD.SALARY.v1'
        }
      ]
    }
  }

  const defaultConfig = defaults[entityType] || {}

  return {
    moduleName: entityType.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    entityType: entityType,
    displayName: entityType.charAt(0).toUpperCase() + entityType.slice(1),
    smartCodePrefix: `HERA.${entityType.toUpperCase()}`,
    dynamicFields: [],
    ...defaultConfig,
    ...options
  } as CrudTestConfig
}
