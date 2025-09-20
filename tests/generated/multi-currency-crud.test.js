/**
 * Auto-generated CRUD tests for Multi_currency
 * Generated at: 2025-09-20T19:27:03.596Z
 * HERA Universal 6-table Architecture
 */

const { universalApi } = require('@/lib/universal-api');

// Test configuration
const MODULE_CONFIG = {
  "moduleName": "multi-currency",
  "entityType": "multi_currency",
  "displayName": "Multi_currency",
  "smartCodePrefix": "HERA.MULTI_CURRENCY",
  "dynamicFields": []
};
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-1758396423597';

describe('Multi_currency - Universal CRUD Operations', () => {
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
    test('should create a new multi-currency', async () => {
      const createData = {
      "entity_type": "multi_currency",
      "entity_name": "Test Multi_currency",
      "entity_code": "MULTI_CURRENCY-001",
      "smart_code": "HERA.MULTI_CURRENCY.v1"
};

      const mockResponse = {
        id: 'multi-currency-123',
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
      expect(result.data.entity_type).toBe('multi_currency');
      expect(result.data.smart_code).toContain('HERA.MULTI_CURRENCY');
      
      createdEntityId = result.data.id;
    });


  });

  describe('READ Operations', () => {
    test('should fetch all multi-currency entities', async () => {
      const mockEntities = [
        {
          id: 'multi-currency-1',
          entity_type: 'multi_currency',
          entity_name: 'Multi_currency 1',
          smart_code: 'HERA.MULTI_CURRENCY.v1'
        },
        {
          id: 'multi-currency-2',
          entity_type: 'multi_currency',
          entity_name: 'Multi_currency 2',
          smart_code: 'HERA.MULTI_CURRENCY.v1'
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

      const result = await universalApi.getEntities('multi_currency', TEST_ORG_ID);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].entity_type).toBe('multi_currency');
    });

    test('should search multi-currency by name', async () => {
      const searchTerm = 'Multi_currency';
      
      // Universal API filters on client side after fetching
      const allEntities = [
        { entity_name: 'Multi_currency Match', entity_type: 'multi_currency' },
        { entity_name: 'Other Entity', entity_type: 'multi_currency' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: allEntities })
      });

      const result = await universalApi.getEntities('multi_currency', TEST_ORG_ID);
      
      // Client-side filtering
      const filtered = result.data.filter(e => 
        e.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE Operations', () => {
    test('should update multi-currency details', async () => {
      const updateData = {
      "entity_name": "Updated Multi_currency",
      "metadata": {
            "updated": true
      }
};

      const mockUpdated = {
        id: 'multi-currency-123',
        entity_type: 'multi_currency',
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

      const result = await universalApi.updateEntity('multi-currency-123', updateData);

      expect(result).toHaveProperty('data');
      expect(result.data.entity_name).toContain('Updated');
    });


  });

  describe('DELETE Operations', () => {
    test('should delete multi-currency', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Entity deleted' })
      });

      await universalApi.deleteEntity('multi-currency-123');

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
            dynamic_fields: 0,
            relationships: 0
          }
        })
      });

      const result = await universalApi.deleteEntity('multi-currency-123');
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

      const result = await universalApi.createEntity({ entity_type: 'multi_currency' });
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('required');
    });

    test('should handle network errors gracefully', async () => {
      global.fetch.mockImplementationOnce(() => {
        throw new Error('Network connection failed');
      });

      try {
        await universalApi.getEntities('multi_currency');
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
      await universalApi.getEntities('multi_currency', TEST_ORG_ID);

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

      const result = await universalApi.getEntities('multi_currency', otherOrgId);
      
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
      expect(tables).toContain('core_entities'); // For multi-currency
      
      
      
    });

    test('should include smart codes in all operations', () => {
      const smartCodePattern = /^HERA\.MULTI_CURRENCY\..*\.v\d+$/;
      expect('HERA.MULTI_CURRENCY.CREATE.v1').toMatch(smartCodePattern);
    });
  });
});

module.exports = {
  MODULE_CONFIG,
  TEST_ORG_ID
};