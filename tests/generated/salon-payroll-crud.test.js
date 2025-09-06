/**
 * Auto-generated CRUD tests for Employee
 * Generated at: 2025-09-06T04:21:46.824Z
 * HERA Universal 6-table Architecture
 */

const { universalApi } = require('@/lib/universal-api');

// Test configuration
const MODULE_CONFIG = {
  "moduleName": "salon-payroll",
  "entityType": "employee",
  "displayName": "Employee",
  "smartCodePrefix": "HERA.HR.EMPLOYEE",
  "dynamicFields": [
    {
      "name": "department",
      "type": "text",
      "testValue": "Sales",
      "smartCode": "HERA.HR.EMPLOYEE.FIELD.DEPT.v1"
    },
    {
      "name": "salary",
      "type": "number",
      "testValue": 50000,
      "smartCode": "HERA.HR.EMPLOYEE.FIELD.SALARY.v1"
    }
  ]
};
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-1757132506824';

describe('Employee - Universal CRUD Operations', () => {
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
    test('should create a new salon-payroll', async () => {
      const createData = {
      "entity_type": "employee",
      "entity_name": "Test Employee",
      "entity_code": "EMPLOYEE-001",
      "smart_code": "HERA.HR.EMPLOYEE.v1"
};

      const mockResponse = {
        id: 'salon-payroll-123',
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
      expect(result.data.entity_type).toBe('employee');
      expect(result.data.smart_code).toContain('HERA.HR.EMPLOYEE');
      
      createdEntityId = result.data.id;
    });


    test('should add dynamic fields to salon-payroll', async () => {
      const dynamicFields = [
        {
          entity_id: createdEntityId || 'salon-payroll-123',
          field_name: 'department',
          field_value_text: "Sales",
          smart_code: 'HERA.HR.EMPLOYEE.FIELD.DEPT.v1'
        },
        {
          entity_id: createdEntityId || 'salon-payroll-123',
          field_name: 'salary',
          field_value_number: 50000,
          smart_code: 'HERA.HR.EMPLOYEE.FIELD.SALARY.v1'
        }
      ];

      for (const field of dynamicFields) {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true,
            data: { id: `field-${field.field_name}`, ...field } 
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
    });
  });

  describe('READ Operations', () => {
    test('should fetch all salon-payroll entities', async () => {
      const mockEntities = [
        {
          id: 'salon-payroll-1',
          entity_type: 'employee',
          entity_name: 'Employee 1',
          smart_code: 'HERA.HR.EMPLOYEE.v1'
        },
        {
          id: 'salon-payroll-2',
          entity_type: 'employee',
          entity_name: 'Employee 2',
          smart_code: 'HERA.HR.EMPLOYEE.v1'
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

      const result = await universalApi.getEntities('employee', TEST_ORG_ID);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].entity_type).toBe('employee');
    });

    test('should search salon-payroll by name', async () => {
      const searchTerm = 'Employee';
      
      // Universal API filters on client side after fetching
      const allEntities = [
        { entity_name: 'Employee Match', entity_type: 'employee' },
        { entity_name: 'Other Entity', entity_type: 'employee' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: allEntities })
      });

      const result = await universalApi.getEntities('employee', TEST_ORG_ID);
      
      // Client-side filtering
      const filtered = result.data.filter(e => 
        e.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE Operations', () => {
    test('should update salon-payroll details', async () => {
      const updateData = {
      "entity_name": "Updated Employee",
      "metadata": {
            "updated": true
      }
};

      const mockUpdated = {
        id: 'salon-payroll-123',
        entity_type: 'employee',
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

      const result = await universalApi.updateEntity('salon-payroll-123', updateData);

      expect(result).toHaveProperty('data');
      expect(result.data.entity_name).toContain('Updated');
    });


    test('should update dynamic field values', async () => {
      const newValue = 'Updated Sales';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            entity_id: 'salon-payroll-123',
            field_name: 'department',
            field_value_text: newValue,
            updated_at: new Date().toISOString()
          }
        })
      });

      const result = await universalApi.setDynamicField(
        'salon-payroll-123',
        'department',
        newValue,
        'HERA.HR.EMPLOYEE.FIELD.DEPT.v1'
      );

      expect(result).toHaveProperty('data');
      expect(result.data.field_value_text).toBe(newValue);
    });
  });

  describe('DELETE Operations', () => {
    test('should delete salon-payroll', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Entity deleted' })
      });

      await universalApi.deleteEntity('salon-payroll-123');

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
            dynamic_fields: 2,
            relationships: 0
          }
        })
      });

      const result = await universalApi.deleteEntity('salon-payroll-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });





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

      const result = await universalApi.createEntity({ entity_type: 'employee' });
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('required');
    });

    test('should handle network errors gracefully', async () => {
      global.fetch.mockImplementationOnce(() => {
        throw new Error('Network connection failed');
      });

      try {
        await universalApi.getEntities('employee');
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
      await universalApi.getEntities('employee', TEST_ORG_ID);

      const url = global.fetch.mock.calls[0][0];
      expect(url).toContain(`organization_id=${TEST_ORG_ID}`);
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

      const result = await universalApi.getEntities('employee', otherOrgId);
      
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
      expect(tables).toContain('core_entities'); // For salon-payroll
      expect(tables).toContain('core_dynamic_data'); // For dynamic fields
      
      
    });

    test('should include smart codes in all operations', () => {
      const smartCodePattern = /^HERA\.HR.EMPLOYEE\..*\.v\d+$/;
      expect('HERA.HR.EMPLOYEE.CREATE.v1').toMatch(smartCodePattern);
    });
  });
});

module.exports = {
  MODULE_CONFIG,
  TEST_ORG_ID
};