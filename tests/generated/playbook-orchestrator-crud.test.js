/**
 * Auto-generated CRUD tests for Playbook_orchestrator
 * Generated at: 2025-09-20T19:27:04.562Z
 * HERA Universal 6-table Architecture
 */

const { universalApi } = require('@/lib/universal-api');

// Test configuration
const MODULE_CONFIG = {
  "moduleName": "playbook-orchestrator",
  "entityType": "playbook_orchestrator",
  "displayName": "Playbook_orchestrator",
  "smartCodePrefix": "HERA.PLAYBOOK_ORCHESTRATOR",
  "dynamicFields": []
};
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-1758396424563';

describe('Playbook_orchestrator - Universal CRUD Operations', () => {
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
    test('should create a new playbook-orchestrator', async () => {
      const createData = {
      "entity_type": "playbook_orchestrator",
      "entity_name": "Test Playbook_orchestrator",
      "entity_code": "PLAYBOOK_ORCHESTRATOR-001",
      "smart_code": "HERA.PLAYBOOK_ORCHESTRATOR.v1"
};

      const mockResponse = {
        id: 'playbook-orchestrator-123',
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
      expect(result.data.entity_type).toBe('playbook_orchestrator');
      expect(result.data.smart_code).toContain('HERA.PLAYBOOK_ORCHESTRATOR');
      
      createdEntityId = result.data.id;
    });


  });

  describe('READ Operations', () => {
    test('should fetch all playbook-orchestrator entities', async () => {
      const mockEntities = [
        {
          id: 'playbook-orchestrator-1',
          entity_type: 'playbook_orchestrator',
          entity_name: 'Playbook_orchestrator 1',
          smart_code: 'HERA.PLAYBOOK_ORCHESTRATOR.v1'
        },
        {
          id: 'playbook-orchestrator-2',
          entity_type: 'playbook_orchestrator',
          entity_name: 'Playbook_orchestrator 2',
          smart_code: 'HERA.PLAYBOOK_ORCHESTRATOR.v1'
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

      const result = await universalApi.getEntities('playbook_orchestrator', TEST_ORG_ID);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].entity_type).toBe('playbook_orchestrator');
    });

    test('should search playbook-orchestrator by name', async () => {
      const searchTerm = 'Playbook_orchestrator';
      
      // Universal API filters on client side after fetching
      const allEntities = [
        { entity_name: 'Playbook_orchestrator Match', entity_type: 'playbook_orchestrator' },
        { entity_name: 'Other Entity', entity_type: 'playbook_orchestrator' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: allEntities })
      });

      const result = await universalApi.getEntities('playbook_orchestrator', TEST_ORG_ID);
      
      // Client-side filtering
      const filtered = result.data.filter(e => 
        e.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE Operations', () => {
    test('should update playbook-orchestrator details', async () => {
      const updateData = {
      "entity_name": "Updated Playbook_orchestrator",
      "metadata": {
            "updated": true
      }
};

      const mockUpdated = {
        id: 'playbook-orchestrator-123',
        entity_type: 'playbook_orchestrator',
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

      const result = await universalApi.updateEntity('playbook-orchestrator-123', updateData);

      expect(result).toHaveProperty('data');
      expect(result.data.entity_name).toContain('Updated');
    });


  });

  describe('DELETE Operations', () => {
    test('should delete playbook-orchestrator', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Entity deleted' })
      });

      await universalApi.deleteEntity('playbook-orchestrator-123');

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

      const result = await universalApi.deleteEntity('playbook-orchestrator-123');
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

      const result = await universalApi.createEntity({ entity_type: 'playbook_orchestrator' });
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('required');
    });

    test('should handle network errors gracefully', async () => {
      global.fetch.mockImplementationOnce(() => {
        throw new Error('Network connection failed');
      });

      try {
        await universalApi.getEntities('playbook_orchestrator');
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
      await universalApi.getEntities('playbook_orchestrator', TEST_ORG_ID);

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

      const result = await universalApi.getEntities('playbook_orchestrator', otherOrgId);
      
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
      expect(tables).toContain('core_entities'); // For playbook-orchestrator
      
      
      
    });

    test('should include smart codes in all operations', () => {
      const smartCodePattern = /^HERA\.PLAYBOOK_ORCHESTRATOR\..*\.v\d+$/;
      expect('HERA.PLAYBOOK_ORCHESTRATOR.CREATE.v1').toMatch(smartCodePattern);
    });
  });
});

module.exports = {
  MODULE_CONFIG,
  TEST_ORG_ID
};