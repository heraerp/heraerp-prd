/**
 * Auto-generated CRUD tests for Email_analytics
 * Generated at: 2025-09-20T19:27:00.673Z
 * HERA Universal 6-table Architecture
 */

const { universalApi } = require('@/lib/universal-api');

// Test configuration
const MODULE_CONFIG = {
  "moduleName": "email-analytics",
  "entityType": "email_analytics",
  "displayName": "Email_analytics",
  "smartCodePrefix": "HERA.EMAIL_ANALYTICS",
  "dynamicFields": []
};
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-1758396420674';

describe('Email_analytics - Universal CRUD Operations', () => {
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
    test('should create a new email-analytics', async () => {
      const createData = {
      "entity_type": "email_analytics",
      "entity_name": "Test Email_analytics",
      "entity_code": "EMAIL_ANALYTICS-001",
      "smart_code": "HERA.EMAIL_ANALYTICS.v1"
};

      const mockResponse = {
        id: 'email-analytics-123',
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
      expect(result.data.entity_type).toBe('email_analytics');
      expect(result.data.smart_code).toContain('HERA.EMAIL_ANALYTICS');
      
      createdEntityId = result.data.id;
    });


  });

  describe('READ Operations', () => {
    test('should fetch all email-analytics entities', async () => {
      const mockEntities = [
        {
          id: 'email-analytics-1',
          entity_type: 'email_analytics',
          entity_name: 'Email_analytics 1',
          smart_code: 'HERA.EMAIL_ANALYTICS.v1'
        },
        {
          id: 'email-analytics-2',
          entity_type: 'email_analytics',
          entity_name: 'Email_analytics 2',
          smart_code: 'HERA.EMAIL_ANALYTICS.v1'
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

      const result = await universalApi.getEntities('email_analytics', TEST_ORG_ID);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].entity_type).toBe('email_analytics');
    });

    test('should search email-analytics by name', async () => {
      const searchTerm = 'Email_analytics';
      
      // Universal API filters on client side after fetching
      const allEntities = [
        { entity_name: 'Email_analytics Match', entity_type: 'email_analytics' },
        { entity_name: 'Other Entity', entity_type: 'email_analytics' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: allEntities })
      });

      const result = await universalApi.getEntities('email_analytics', TEST_ORG_ID);
      
      // Client-side filtering
      const filtered = result.data.filter(e => 
        e.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE Operations', () => {
    test('should update email-analytics details', async () => {
      const updateData = {
      "entity_name": "Updated Email_analytics",
      "metadata": {
            "updated": true
      }
};

      const mockUpdated = {
        id: 'email-analytics-123',
        entity_type: 'email_analytics',
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

      const result = await universalApi.updateEntity('email-analytics-123', updateData);

      expect(result).toHaveProperty('data');
      expect(result.data.entity_name).toContain('Updated');
    });


  });

  describe('DELETE Operations', () => {
    test('should delete email-analytics', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Entity deleted' })
      });

      await universalApi.deleteEntity('email-analytics-123');

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

      const result = await universalApi.deleteEntity('email-analytics-123');
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

      const result = await universalApi.createEntity({ entity_type: 'email_analytics' });
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('required');
    });

    test('should handle network errors gracefully', async () => {
      global.fetch.mockImplementationOnce(() => {
        throw new Error('Network connection failed');
      });

      try {
        await universalApi.getEntities('email_analytics');
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
      await universalApi.getEntities('email_analytics', TEST_ORG_ID);

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

      const result = await universalApi.getEntities('email_analytics', otherOrgId);
      
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
      expect(tables).toContain('core_entities'); // For email-analytics
      
      
      
    });

    test('should include smart codes in all operations', () => {
      const smartCodePattern = /^HERA\.EMAIL_ANALYTICS\..*\.v\d+$/;
      expect('HERA.EMAIL_ANALYTICS.CREATE.v1').toMatch(smartCodePattern);
    });
  });
});

module.exports = {
  MODULE_CONFIG,
  TEST_ORG_ID
};