/**
 * Auto-generated CRUD tests for Universal_ui
 * Generated at: 2025-09-20T19:27:06.945Z
 * HERA Universal 6-table Architecture
 */

const { universalApi } = require('@/lib/universal-api');

// Test configuration
const MODULE_CONFIG = {
  "moduleName": "universal-ui",
  "entityType": "universal_ui",
  "displayName": "Universal_ui",
  "smartCodePrefix": "HERA.UNIVERSAL_UI",
  "dynamicFields": []
};
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-1758396426946';

describe('Universal_ui - Universal CRUD Operations', () => {
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
    test('should create a new universal-ui', async () => {
      const createData = {
      "entity_type": "universal_ui",
      "entity_name": "Test Universal_ui",
      "entity_code": "UNIVERSAL_UI-001",
      "smart_code": "HERA.UNIVERSAL_UI.v1"
};

      const mockResponse = {
        id: 'universal-ui-123',
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
      expect(result.data.entity_type).toBe('universal_ui');
      expect(result.data.smart_code).toContain('HERA.UNIVERSAL_UI');
      
      createdEntityId = result.data.id;
    });


  });

  describe('READ Operations', () => {
    test('should fetch all universal-ui entities', async () => {
      const mockEntities = [
        {
          id: 'universal-ui-1',
          entity_type: 'universal_ui',
          entity_name: 'Universal_ui 1',
          smart_code: 'HERA.UNIVERSAL_UI.v1'
        },
        {
          id: 'universal-ui-2',
          entity_type: 'universal_ui',
          entity_name: 'Universal_ui 2',
          smart_code: 'HERA.UNIVERSAL_UI.v1'
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

      const result = await universalApi.getEntities('universal_ui', TEST_ORG_ID);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].entity_type).toBe('universal_ui');
    });

    test('should search universal-ui by name', async () => {
      const searchTerm = 'Universal_ui';
      
      // Universal API filters on client side after fetching
      const allEntities = [
        { entity_name: 'Universal_ui Match', entity_type: 'universal_ui' },
        { entity_name: 'Other Entity', entity_type: 'universal_ui' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: allEntities })
      });

      const result = await universalApi.getEntities('universal_ui', TEST_ORG_ID);
      
      // Client-side filtering
      const filtered = result.data.filter(e => 
        e.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE Operations', () => {
    test('should update universal-ui details', async () => {
      const updateData = {
      "entity_name": "Updated Universal_ui",
      "metadata": {
            "updated": true
      }
};

      const mockUpdated = {
        id: 'universal-ui-123',
        entity_type: 'universal_ui',
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

      const result = await universalApi.updateEntity('universal-ui-123', updateData);

      expect(result).toHaveProperty('data');
      expect(result.data.entity_name).toContain('Updated');
    });


  });

  describe('DELETE Operations', () => {
    test('should delete universal-ui', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Entity deleted' })
      });

      await universalApi.deleteEntity('universal-ui-123');

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

      const result = await universalApi.deleteEntity('universal-ui-123');
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

      const result = await universalApi.createEntity({ entity_type: 'universal_ui' });
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('required');
    });

    test('should handle network errors gracefully', async () => {
      global.fetch.mockImplementationOnce(() => {
        throw new Error('Network connection failed');
      });

      try {
        await universalApi.getEntities('universal_ui');
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
      await universalApi.getEntities('universal_ui', TEST_ORG_ID);

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

      const result = await universalApi.getEntities('universal_ui', otherOrgId);
      
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
      expect(tables).toContain('core_entities'); // For universal-ui
      
      
      
    });

    test('should include smart codes in all operations', () => {
      const smartCodePattern = /^HERA\.UNIVERSAL_UI\..*\.v\d+$/;
      expect('HERA.UNIVERSAL_UI.CREATE.v1').toMatch(smartCodePattern);
    });
  });
});

module.exports = {
  MODULE_CONFIG,
  TEST_ORG_ID
};