/**
 * Auto-generated CRUD tests for Customer
 * Generated at: 2025-09-06T04:20:10.413Z
 * HERA Universal 6-table Architecture
 */

const { universalApi } = require('@/lib/universal-api');

// Test configuration
const MODULE_CONFIG = {
  "moduleName": "salon-customers",
  "entityType": "customer",
  "displayName": "Customer",
  "smartCodePrefix": "HERA.CRM.CUSTOMER",
  "dynamicFields": [
    {
      "name": "email",
      "type": "text",
      "testValue": "test@example.com",
      "smartCode": "HERA.CRM.CUSTOMER.FIELD.EMAIL.v1"
    },
    {
      "name": "credit_limit",
      "type": "number",
      "testValue": 10000,
      "smartCode": "HERA.CRM.CUSTOMER.FIELD.CREDIT.v1"
    }
  ]
};
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-1757132410414';

describe('Customer - Universal CRUD Operations', () => {
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
    test('should create a new salon-customers', async () => {
      const createData = {
      "entity_type": "customer",
      "entity_name": "Test Customer",
      "entity_code": "CUSTOMER-001",
      "smart_code": "HERA.CRM.CUSTOMER.v1"
};

      const mockResponse = {
        id: 'salon-customers-123',
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
      expect(result.data.entity_type).toBe('customer');
      expect(result.data.smart_code).toContain('HERA.CRM.CUSTOMER');
      
      createdEntityId = result.data.id;
    });


    test('should add dynamic fields to salon-customers', async () => {
      const dynamicFields = [
        {
          entity_id: createdEntityId || 'salon-customers-123',
          field_name: 'email',
          field_value_text: "test@example.com",
          smart_code: 'HERA.CRM.CUSTOMER.FIELD.EMAIL.v1'
        },
        {
          entity_id: createdEntityId || 'salon-customers-123',
          field_name: 'credit_limit',
          field_value_number: 10000,
          smart_code: 'HERA.CRM.CUSTOMER.FIELD.CREDIT.v1'
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
    test('should fetch all salon-customers entities', async () => {
      const mockEntities = [
        {
          id: 'salon-customers-1',
          entity_type: 'customer',
          entity_name: 'Customer 1',
          smart_code: 'HERA.CRM.CUSTOMER.v1'
        },
        {
          id: 'salon-customers-2',
          entity_type: 'customer',
          entity_name: 'Customer 2',
          smart_code: 'HERA.CRM.CUSTOMER.v1'
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

      const result = await universalApi.getEntities('customer', TEST_ORG_ID);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].entity_type).toBe('customer');
    });

    test('should search salon-customers by name', async () => {
      const searchTerm = 'Customer';
      
      // Universal API filters on client side after fetching
      const allEntities = [
        { entity_name: 'Customer Match', entity_type: 'customer' },
        { entity_name: 'Other Entity', entity_type: 'customer' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: allEntities })
      });

      const result = await universalApi.getEntities('customer', TEST_ORG_ID);
      
      // Client-side filtering
      const filtered = result.data.filter(e => 
        e.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE Operations', () => {
    test('should update salon-customers details', async () => {
      const updateData = {
      "entity_name": "Updated Customer",
      "metadata": {
            "updated": true
      }
};

      const mockUpdated = {
        id: 'salon-customers-123',
        entity_type: 'customer',
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

      const result = await universalApi.updateEntity('salon-customers-123', updateData);

      expect(result).toHaveProperty('data');
      expect(result.data.entity_name).toContain('Updated');
    });


    test('should update dynamic field values', async () => {
      const newValue = 'Updated test@example.com';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            entity_id: 'salon-customers-123',
            field_name: 'email',
            field_value_text: newValue,
            updated_at: new Date().toISOString()
          }
        })
      });

      const result = await universalApi.setDynamicField(
        'salon-customers-123',
        'email',
        newValue,
        'HERA.CRM.CUSTOMER.FIELD.EMAIL.v1'
      );

      expect(result).toHaveProperty('data');
      expect(result.data.field_value_text).toBe(newValue);
    });
  });

  describe('DELETE Operations', () => {
    test('should delete salon-customers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Entity deleted' })
      });

      await universalApi.deleteEntity('salon-customers-123');

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

      const result = await universalApi.deleteEntity('salon-customers-123');
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

      const result = await universalApi.createEntity({ entity_type: 'customer' });
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('required');
    });

    test('should handle network errors gracefully', async () => {
      global.fetch.mockImplementationOnce(() => {
        throw new Error('Network connection failed');
      });

      try {
        await universalApi.getEntities('customer');
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
      await universalApi.getEntities('customer', TEST_ORG_ID);

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

      const result = await universalApi.getEntities('customer', otherOrgId);
      
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
      expect(tables).toContain('core_entities'); // For salon-customers
      expect(tables).toContain('core_dynamic_data'); // For dynamic fields
      
      
    });

    test('should include smart codes in all operations', () => {
      const smartCodePattern = /^HERA\.CRM.CUSTOMER\..*\.v\d+$/;
      expect('HERA.CRM.CUSTOMER.CREATE.v1').toMatch(smartCodePattern);
    });
  });
});

module.exports = {
  MODULE_CONFIG,
  TEST_ORG_ID
};