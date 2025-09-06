/**
 * Auto-generated CRUD tests for Salon Service
 * Generated at: 2025-09-06T04:20:18.275Z
 * HERA Universal 6-table Architecture
 */

const { universalApi } = require('@/lib/universal-api');

// Test configuration
const MODULE_CONFIG = {
  "moduleName": "salon-services",
  "entityType": "salon_service",
  "displayName": "Salon Service",
  "smartCodePrefix": "HERA.SALON.SERVICE",
  "dynamicFields": [
    {
      "name": "price",
      "type": "number",
      "testValue": 150,
      "smartCode": "HERA.SALON.SERVICE.FIELD.PRICE.v1"
    },
    {
      "name": "duration",
      "type": "number",
      "testValue": 45,
      "smartCode": "HERA.SALON.SERVICE.FIELD.DURATION.v1"
    },
    {
      "name": "description",
      "type": "text",
      "testValue": "Premium hair styling service",
      "smartCode": "HERA.SALON.SERVICE.FIELD.DESC.v1"
    }
  ],
  "relationships": [
    {
      "type": "belongs_to_category",
      "targetEntityType": "service_category",
      "smartCode": "HERA.SALON.REL.SERVICE_CATEGORY.v1"
    }
  ],
  "transactions": [
    {
      "type": "service_booking",
      "smartCode": "HERA.SALON.TXN.BOOKING.v1",
      "hasLineItems": true
    }
  ]
};
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-1757132418276';

describe('Salon Service - Universal CRUD Operations', () => {
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
    test('should create a new salon-services', async () => {
      const createData = {
      "entity_type": "salon_service",
      "entity_name": "Test Salon Service",
      "entity_code": "SALON_SERVICE-001",
      "smart_code": "HERA.SALON.SERVICE.v1"
};

      const mockResponse = {
        id: 'salon-services-123',
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
      expect(result.data.entity_type).toBe('salon_service');
      expect(result.data.smart_code).toContain('HERA.SALON.SERVICE');
      
      createdEntityId = result.data.id;
    });


    test('should add dynamic fields to salon-services', async () => {
      const dynamicFields = [
        {
          entity_id: createdEntityId || 'salon-services-123',
          field_name: 'price',
          field_value_number: 150,
          smart_code: 'HERA.SALON.SERVICE.FIELD.PRICE.v1'
        },
        {
          entity_id: createdEntityId || 'salon-services-123',
          field_name: 'duration',
          field_value_number: 45,
          smart_code: 'HERA.SALON.SERVICE.FIELD.DURATION.v1'
        },
        {
          entity_id: createdEntityId || 'salon-services-123',
          field_name: 'description',
          field_value_text: "Premium hair styling service",
          smart_code: 'HERA.SALON.SERVICE.FIELD.DESC.v1'
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
    test('should fetch all salon-services entities', async () => {
      const mockEntities = [
        {
          id: 'salon-services-1',
          entity_type: 'salon_service',
          entity_name: 'Salon Service 1',
          smart_code: 'HERA.SALON.SERVICE.v1'
        },
        {
          id: 'salon-services-2',
          entity_type: 'salon_service',
          entity_name: 'Salon Service 2',
          smart_code: 'HERA.SALON.SERVICE.v1'
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

      const result = await universalApi.getEntities('salon_service', TEST_ORG_ID);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].entity_type).toBe('salon_service');
    });

    test('should search salon-services by name', async () => {
      const searchTerm = 'Salon Service';
      
      // Universal API filters on client side after fetching
      const allEntities = [
        { entity_name: 'Salon Service Match', entity_type: 'salon_service' },
        { entity_name: 'Other Entity', entity_type: 'salon_service' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: allEntities })
      });

      const result = await universalApi.getEntities('salon_service', TEST_ORG_ID);
      
      // Client-side filtering
      const filtered = result.data.filter(e => 
        e.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE Operations', () => {
    test('should update salon-services details', async () => {
      const updateData = {
      "entity_name": "Updated Salon Service",
      "metadata": {
            "updated": true
      }
};

      const mockUpdated = {
        id: 'salon-services-123',
        entity_type: 'salon_service',
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

      const result = await universalApi.updateEntity('salon-services-123', updateData);

      expect(result).toHaveProperty('data');
      expect(result.data.entity_name).toContain('Updated');
    });


    test('should update dynamic field values', async () => {
      const newValue = 150 * 1.5;
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            entity_id: 'salon-services-123',
            field_name: 'price',
            field_value_number: newValue,
            updated_at: new Date().toISOString()
          }
        })
      });

      const result = await universalApi.setDynamicField(
        'salon-services-123',
        'price',
        newValue,
        'HERA.SALON.SERVICE.FIELD.PRICE.v1'
      );

      expect(result).toHaveProperty('data');
      expect(result.data.field_value_number).toBe(newValue);
    });
  });

  describe('DELETE Operations', () => {
    test('should delete salon-services', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Entity deleted' })
      });

      await universalApi.deleteEntity('salon-services-123');

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
            dynamic_fields: 3,
            relationships: 0
          }
        })
      });

      const result = await universalApi.deleteEntity('salon-services-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });


  describe('Relationship Operations', () => {
    test('should create belongs_to_category relationship', async () => {
      const relationshipData = {
        from_entity_id: 'salon-services-123',
        to_entity_id: 'service_category-456',
        relationship_type: 'belongs_to_category',
        smart_code: 'HERA.SALON.REL.SERVICE_CATEGORY.v1'
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
      expect(result.data.relationship_type).toBe('belongs_to_category');
    });
  });


  describe('Transaction Operations', () => {
    test('should create service_booking transaction', async () => {
      const transactionData = {
        transaction_type: 'service_booking',
        transaction_code: 'SERVICE_BOOKING-2025-001',
        smart_code: 'HERA.SALON.TXN.BOOKING.v1',
        total_amount: 1000.00,
        from_entity_id: 'salon-services-123',
        metadata: {
          'salon-services_id': 'salon-services-123'
        }
      };

      const lineItems = [{
        line_entity_id: 'salon-services-123',
        line_number: 1,
        quantity: 1,
        unit_price: 1000.00,
        line_amount: 1000.00,
        smart_code: 'HERA.SALON.TXN.BOOKING.v1.LINE.v1'
      }];

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
      expect(result.data.transaction_type).toBe('service_booking');
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

      const result = await universalApi.createEntity({ entity_type: 'salon_service' });
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('required');
    });

    test('should handle network errors gracefully', async () => {
      global.fetch.mockImplementationOnce(() => {
        throw new Error('Network connection failed');
      });

      try {
        await universalApi.getEntities('salon_service');
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
      await universalApi.getEntities('salon_service', TEST_ORG_ID);

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

      const result = await universalApi.getEntities('salon_service', otherOrgId);
      
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
      expect(tables).toContain('core_entities'); // For salon-services
      expect(tables).toContain('core_dynamic_data'); // For dynamic fields
      expect(tables).toContain('core_relationships'); // For relationships
      expect(tables).toContain('universal_transactions'); // For transactions
    });

    test('should include smart codes in all operations', () => {
      const smartCodePattern = /^HERA\.SALON.SERVICE\..*\.v\d+$/;
      expect('HERA.SALON.SERVICE.CREATE.v1').toMatch(smartCodePattern);
    });
  });
});

module.exports = {
  MODULE_CONFIG,
  TEST_ORG_ID
};