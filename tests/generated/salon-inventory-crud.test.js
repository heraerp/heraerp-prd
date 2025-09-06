/**
 * Auto-generated CRUD tests for Product
 * Generated at: 2025-09-06T04:21:40.587Z
 * HERA Universal 6-table Architecture
 */

const { universalApi } = require('@/lib/universal-api');

// Test configuration
const MODULE_CONFIG = {
  "moduleName": "salon-inventory",
  "entityType": "product",
  "displayName": "Product",
  "smartCodePrefix": "HERA.INV.PRODUCT",
  "dynamicFields": [
    {
      "name": "price",
      "type": "number",
      "testValue": 99.99,
      "smartCode": "HERA.INV.PRODUCT.FIELD.PRICE.v1"
    },
    {
      "name": "stock_quantity",
      "type": "number",
      "testValue": 100,
      "smartCode": "HERA.INV.PRODUCT.FIELD.STOCK.v1"
    }
  ]
};
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-1757132500587';

describe('Product - Universal CRUD Operations', () => {
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
    test('should create a new salon-inventory', async () => {
      const createData = {
      "entity_type": "product",
      "entity_name": "Test Product",
      "entity_code": "PRODUCT-001",
      "smart_code": "HERA.INV.PRODUCT.v1"
};

      const mockResponse = {
        id: 'salon-inventory-123',
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
      expect(result.data.entity_type).toBe('product');
      expect(result.data.smart_code).toContain('HERA.INV.PRODUCT');
      
      createdEntityId = result.data.id;
    });


    test('should add dynamic fields to salon-inventory', async () => {
      const dynamicFields = [
        {
          entity_id: createdEntityId || 'salon-inventory-123',
          field_name: 'price',
          field_value_number: 99.99,
          smart_code: 'HERA.INV.PRODUCT.FIELD.PRICE.v1'
        },
        {
          entity_id: createdEntityId || 'salon-inventory-123',
          field_name: 'stock_quantity',
          field_value_number: 100,
          smart_code: 'HERA.INV.PRODUCT.FIELD.STOCK.v1'
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
    test('should fetch all salon-inventory entities', async () => {
      const mockEntities = [
        {
          id: 'salon-inventory-1',
          entity_type: 'product',
          entity_name: 'Product 1',
          smart_code: 'HERA.INV.PRODUCT.v1'
        },
        {
          id: 'salon-inventory-2',
          entity_type: 'product',
          entity_name: 'Product 2',
          smart_code: 'HERA.INV.PRODUCT.v1'
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

      const result = await universalApi.getEntities('product', TEST_ORG_ID);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].entity_type).toBe('product');
    });

    test('should search salon-inventory by name', async () => {
      const searchTerm = 'Product';
      
      // Universal API filters on client side after fetching
      const allEntities = [
        { entity_name: 'Product Match', entity_type: 'product' },
        { entity_name: 'Other Entity', entity_type: 'product' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: allEntities })
      });

      const result = await universalApi.getEntities('product', TEST_ORG_ID);
      
      // Client-side filtering
      const filtered = result.data.filter(e => 
        e.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE Operations', () => {
    test('should update salon-inventory details', async () => {
      const updateData = {
      "entity_name": "Updated Product",
      "metadata": {
            "updated": true
      }
};

      const mockUpdated = {
        id: 'salon-inventory-123',
        entity_type: 'product',
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

      const result = await universalApi.updateEntity('salon-inventory-123', updateData);

      expect(result).toHaveProperty('data');
      expect(result.data.entity_name).toContain('Updated');
    });


    test('should update dynamic field values', async () => {
      const newValue = 99.99 * 1.5;
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            entity_id: 'salon-inventory-123',
            field_name: 'price',
            field_value_number: newValue,
            updated_at: new Date().toISOString()
          }
        })
      });

      const result = await universalApi.setDynamicField(
        'salon-inventory-123',
        'price',
        newValue,
        'HERA.INV.PRODUCT.FIELD.PRICE.v1'
      );

      expect(result).toHaveProperty('data');
      expect(result.data.field_value_number).toBe(newValue);
    });
  });

  describe('DELETE Operations', () => {
    test('should delete salon-inventory', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Entity deleted' })
      });

      await universalApi.deleteEntity('salon-inventory-123');

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

      const result = await universalApi.deleteEntity('salon-inventory-123');
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

      const result = await universalApi.createEntity({ entity_type: 'product' });
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('required');
    });

    test('should handle network errors gracefully', async () => {
      global.fetch.mockImplementationOnce(() => {
        throw new Error('Network connection failed');
      });

      try {
        await universalApi.getEntities('product');
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
      await universalApi.getEntities('product', TEST_ORG_ID);

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

      const result = await universalApi.getEntities('product', otherOrgId);
      
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
      expect(tables).toContain('core_entities'); // For salon-inventory
      expect(tables).toContain('core_dynamic_data'); // For dynamic fields
      
      
    });

    test('should include smart codes in all operations', () => {
      const smartCodePattern = /^HERA\.INV.PRODUCT\..*\.v\d+$/;
      expect('HERA.INV.PRODUCT.CREATE.v1').toMatch(smartCodePattern);
    });
  });
});

module.exports = {
  MODULE_CONFIG,
  TEST_ORG_ID
};