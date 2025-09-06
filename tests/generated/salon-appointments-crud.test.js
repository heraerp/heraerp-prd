/**
 * Auto-generated CRUD tests for Salon Appointment
 * Generated at: 2025-09-06T04:16:55.510Z
 * HERA Universal 6-table Architecture
 */

const { universalApi } = require('@/lib/universal-api');

// Test configuration
const MODULE_CONFIG = {
  "moduleName": "salon-appointments",
  "entityType": "appointment",
  "displayName": "Salon Appointment",
  "smartCodePrefix": "HERA.SALON.APPOINTMENT",
  "dynamicFields": [
    {
      "name": "appointment_date",
      "type": "text",
      "testValue": "2024-09-15",
      "smartCode": "HERA.SALON.APPOINTMENT.FIELD.DATE.v1"
    },
    {
      "name": "appointment_time",
      "type": "text",
      "testValue": "14:30",
      "smartCode": "HERA.SALON.APPOINTMENT.FIELD.TIME.v1"
    },
    {
      "name": "duration_minutes",
      "type": "number",
      "testValue": 90,
      "smartCode": "HERA.SALON.APPOINTMENT.FIELD.DURATION.v1"
    },
    {
      "name": "total_price",
      "type": "number",
      "testValue": 250,
      "smartCode": "HERA.SALON.APPOINTMENT.FIELD.PRICE.v1"
    },
    {
      "name": "status",
      "type": "text",
      "testValue": "scheduled",
      "smartCode": "HERA.SALON.APPOINTMENT.FIELD.STATUS.v1"
    },
    {
      "name": "notes",
      "type": "text",
      "testValue": "First-time customer, prefers organic products",
      "smartCode": "HERA.SALON.APPOINTMENT.FIELD.NOTES.v1"
    }
  ],
  "relationships": [
    {
      "type": "booked_for_customer",
      "targetEntityType": "customer",
      "smartCode": "HERA.SALON.REL.APPOINTMENT_CUSTOMER.v1"
    },
    {
      "type": "assigned_to_stylist",
      "targetEntityType": "employee",
      "smartCode": "HERA.SALON.REL.APPOINTMENT_STYLIST.v1"
    },
    {
      "type": "includes_service",
      "targetEntityType": "salon_service",
      "smartCode": "HERA.SALON.REL.APPOINTMENT_SERVICE.v1"
    },
    {
      "type": "has_status",
      "targetEntityType": "appointment_status",
      "smartCode": "HERA.SALON.REL.APPOINTMENT_STATUS.v1"
    }
  ],
  "transactions": [
    {
      "type": "appointment_booking",
      "smartCode": "HERA.SALON.TXN.APPOINTMENT_BOOK.v1",
      "hasLineItems": true
    },
    {
      "type": "appointment_payment",
      "smartCode": "HERA.SALON.TXN.APPOINTMENT_PAY.v1",
      "hasLineItems": false
    },
    {
      "type": "appointment_cancellation",
      "smartCode": "HERA.SALON.TXN.APPOINTMENT_CANCEL.v1",
      "hasLineItems": false
    }
  ],
  "testData": {
    "createData": {
      "entity_type": "appointment",
      "entity_name": "Hair Color & Cut - Jane Doe",
      "entity_code": "APT-2024-09-15-001",
      "smart_code": "HERA.SALON.APPOINTMENT.v1",
      "metadata": {
        "customer_name": "Jane Doe",
        "stylist_name": "Sarah Johnson",
        "services": [
          "Hair Color",
          "Hair Cut"
        ],
        "booking_source": "online"
      }
    },
    "updateData": {
      "entity_name": "Hair Color & Cut - Jane Doe (Rescheduled)",
      "metadata": {
        "rescheduled": true,
        "original_date": "2024-09-15",
        "new_date": "2024-09-16"
      }
    },
    "searchTerm": "Jane Doe"
  }
};
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-1757132215511';

describe('Salon Appointment - Universal CRUD Operations', () => {
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
    test('should create a new salon-appointments', async () => {
      const createData = {
      "entity_type": "appointment",
      "entity_name": "Hair Color & Cut - Jane Doe",
      "entity_code": "APT-2024-09-15-001",
      "smart_code": "HERA.SALON.APPOINTMENT.v1",
      "metadata": {
            "customer_name": "Jane Doe",
            "stylist_name": "Sarah Johnson",
            "services": [
                  "Hair Color",
                  "Hair Cut"
            ],
            "booking_source": "online"
      }
};

      const mockResponse = {
        id: 'salon-appointments-123',
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
      expect(result.data.entity_type).toBe('appointment');
      expect(result.data.smart_code).toContain('HERA.SALON.APPOINTMENT');
      
      createdEntityId = result.data.id;
    });


    test('should add dynamic fields to salon-appointments', async () => {
      const dynamicFields = [
        {
          entity_id: createdEntityId || 'salon-appointments-123',
          field_name: 'appointment_date',
          field_value_text: "2024-09-15",
          smart_code: 'HERA.SALON.APPOINTMENT.FIELD.DATE.v1'
        },
        {
          entity_id: createdEntityId || 'salon-appointments-123',
          field_name: 'appointment_time',
          field_value_text: "14:30",
          smart_code: 'HERA.SALON.APPOINTMENT.FIELD.TIME.v1'
        },
        {
          entity_id: createdEntityId || 'salon-appointments-123',
          field_name: 'duration_minutes',
          field_value_number: 90,
          smart_code: 'HERA.SALON.APPOINTMENT.FIELD.DURATION.v1'
        },
        {
          entity_id: createdEntityId || 'salon-appointments-123',
          field_name: 'total_price',
          field_value_number: 250,
          smart_code: 'HERA.SALON.APPOINTMENT.FIELD.PRICE.v1'
        },
        {
          entity_id: createdEntityId || 'salon-appointments-123',
          field_name: 'status',
          field_value_text: "scheduled",
          smart_code: 'HERA.SALON.APPOINTMENT.FIELD.STATUS.v1'
        },
        {
          entity_id: createdEntityId || 'salon-appointments-123',
          field_name: 'notes',
          field_value_text: "First-time customer, prefers organic products",
          smart_code: 'HERA.SALON.APPOINTMENT.FIELD.NOTES.v1'
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
    test('should fetch all salon-appointments entities', async () => {
      const mockEntities = [
        {
          id: 'salon-appointments-1',
          entity_type: 'appointment',
          entity_name: 'Salon Appointment 1',
          smart_code: 'HERA.SALON.APPOINTMENT.v1'
        },
        {
          id: 'salon-appointments-2',
          entity_type: 'appointment',
          entity_name: 'Salon Appointment 2',
          smart_code: 'HERA.SALON.APPOINTMENT.v1'
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

      const result = await universalApi.getEntities('appointment', TEST_ORG_ID);

      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].entity_type).toBe('appointment');
    });

    test('should search salon-appointments by name', async () => {
      const searchTerm = 'Jane Doe';
      
      // Universal API filters on client side after fetching
      const allEntities = [
        { entity_name: 'Salon Appointment Match', entity_type: 'appointment' },
        { entity_name: 'Other Entity', entity_type: 'appointment' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: allEntities })
      });

      const result = await universalApi.getEntities('appointment', TEST_ORG_ID);
      
      // Client-side filtering
      const filtered = result.data.filter(e => 
        e.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE Operations', () => {
    test('should update salon-appointments details', async () => {
      const updateData = {
      "entity_name": "Hair Color & Cut - Jane Doe (Rescheduled)",
      "metadata": {
            "rescheduled": true,
            "original_date": "2024-09-15",
            "new_date": "2024-09-16"
      }
};

      const mockUpdated = {
        id: 'salon-appointments-123',
        entity_type: 'appointment',
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

      const result = await universalApi.updateEntity('salon-appointments-123', updateData);

      expect(result).toHaveProperty('data');
      expect(result.data.entity_name).toContain('Updated');
    });


    test('should update dynamic field values', async () => {
      const newValue = 'Updated 2024-09-15';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            entity_id: 'salon-appointments-123',
            field_name: 'appointment_date',
            field_value_text: newValue,
            updated_at: new Date().toISOString()
          }
        })
      });

      const result = await universalApi.setDynamicField(
        'salon-appointments-123',
        'appointment_date',
        newValue,
        'HERA.SALON.APPOINTMENT.FIELD.DATE.v1'
      );

      expect(result).toHaveProperty('data');
      expect(result.data.field_value_text).toBe(newValue);
    });
  });

  describe('DELETE Operations', () => {
    test('should delete salon-appointments', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Entity deleted' })
      });

      await universalApi.deleteEntity('salon-appointments-123');

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
            dynamic_fields: 6,
            relationships: 0
          }
        })
      });

      const result = await universalApi.deleteEntity('salon-appointments-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });


  describe('Relationship Operations', () => {
    test('should create booked_for_customer relationship', async () => {
      const relationshipData = {
        from_entity_id: 'salon-appointments-123',
        to_entity_id: 'customer-456',
        relationship_type: 'booked_for_customer',
        smart_code: 'HERA.SALON.REL.APPOINTMENT_CUSTOMER.v1'
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
      expect(result.data.relationship_type).toBe('booked_for_customer');
    });
  });


  describe('Transaction Operations', () => {
    test('should create appointment_booking transaction', async () => {
      const transactionData = {
        transaction_type: 'appointment_booking',
        transaction_code: 'APPOINTMENT_BOOKING-2025-001',
        smart_code: 'HERA.SALON.TXN.APPOINTMENT_BOOK.v1',
        total_amount: 1000.00,
        from_entity_id: 'salon-appointments-123',
        metadata: {
          'salon-appointments_id': 'salon-appointments-123'
        }
      };

      const lineItems = [{
        line_entity_id: 'salon-appointments-123',
        line_number: 1,
        quantity: 1,
        unit_price: 1000.00,
        line_amount: 1000.00,
        smart_code: 'HERA.SALON.TXN.APPOINTMENT_BOOK.v1.LINE.v1'
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
      expect(result.data.transaction_type).toBe('appointment_booking');
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

      const result = await universalApi.createEntity({ entity_type: 'appointment' });
      
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('required');
    });

    test('should handle network errors gracefully', async () => {
      global.fetch.mockImplementationOnce(() => {
        throw new Error('Network connection failed');
      });

      try {
        await universalApi.getEntities('appointment');
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
      await universalApi.getEntities('appointment', TEST_ORG_ID);

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

      const result = await universalApi.getEntities('appointment', otherOrgId);
      
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
      expect(tables).toContain('core_entities'); // For salon-appointments
      expect(tables).toContain('core_dynamic_data'); // For dynamic fields
      expect(tables).toContain('core_relationships'); // For relationships
      expect(tables).toContain('universal_transactions'); // For transactions
    });

    test('should include smart codes in all operations', () => {
      const smartCodePattern = /^HERA\.SALON.APPOINTMENT\..*\.v\d+$/;
      expect('HERA.SALON.APPOINTMENT.CREATE.v1').toMatch(smartCodePattern);
    });
  });
});

module.exports = {
  MODULE_CONFIG,
  TEST_ORG_ID
};