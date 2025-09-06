import { universalApi } from '@/lib/universal-api';

describe('Salon Services API Tests', () => {
  const testOrganizationId = 'test-org-123';
  let createdServiceId: string;

  // Mock the fetch function
  global.fetch = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    universalApi.setOrganizationId(testOrganizationId);
  });

  describe('CREATE Operations', () => {
    test('should create a new salon service', async () => {
      const mockResponse = {
        id: 'service-123',
        entity_type: 'salon_service',
        entity_name: 'Premium Haircut',
        entity_code: 'SVC-001',
        organization_id: testOrganizationId,
        created_at: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockResponse })
      });

      const result = await universalApi.createEntity({
        entity_type: 'salon_service',
        entity_name: 'Premium Haircut',
        entity_code: 'SVC-001',
        smart_code: 'HERA.SALON.SERVICE.HAIRCUT.v1'
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/universal'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('salon_service')
        })
      );

      createdServiceId = result.id;
    });

    test('should add dynamic fields to service', async () => {
      const mockResponse = {
        entity_id: createdServiceId,
        field_name: 'price',
        field_value_number: 150.00,
        created_at: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockResponse })
      });

      const result = await universalApi.setDynamicField(
        createdServiceId,
        'price',
        150.00
      );

      expect(result.field_value_number).toBe(150.00);
    });
  });

  describe('READ Operations', () => {
    test('should fetch all salon services', async () => {
      const mockServices = [
        {
          id: 'service-1',
          entity_type: 'salon_service',
          entity_name: 'Haircut',
          entity_code: 'SVC-001'
        },
        {
          id: 'service-2',
          entity_type: 'salon_service',
          entity_name: 'Hair Color',
          entity_code: 'SVC-002'
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockServices })
      });

      const result = await universalApi.getEntities({
        entity_type: 'salon_service'
      });

      expect(result).toEqual(mockServices);
      expect(result).toHaveLength(2);
    });

    test('should fetch service with dynamic fields', async () => {
      const mockServiceWithFields = {
        entity: {
          id: createdServiceId,
          entity_type: 'salon_service',
          entity_name: 'Premium Haircut'
        },
        dynamic_fields: [
          { field_name: 'price', field_value_number: 150.00 },
          { field_name: 'duration', field_value_number: 45 }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockServiceWithFields })
      });

      const result = await universalApi.getEntityWithDynamicFields(createdServiceId);

      expect(result.entity.id).toBe(createdServiceId);
      expect(result.dynamic_fields).toHaveLength(2);
      expect(result.dynamic_fields[0].field_value_number).toBe(150.00);
    });
  });

  describe('UPDATE Operations', () => {
    test('should update service details', async () => {
      const updatedService = {
        id: createdServiceId,
        entity_name: 'Premium Haircut & Style',
        updated_at: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedService })
      });

      const result = await universalApi.updateEntity(createdServiceId, {
        entity_name: 'Premium Haircut & Style'
      });

      expect(result.entity_name).toBe('Premium Haircut & Style');
    });

    test('should update dynamic field values', async () => {
      const updatedField = {
        entity_id: createdServiceId,
        field_name: 'price',
        field_value_number: 180.00,
        updated_at: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedField })
      });

      const result = await universalApi.setDynamicField(
        createdServiceId,
        'price',
        180.00
      );

      expect(result.field_value_number).toBe(180.00);
    });
  });

  describe('DELETE Operations', () => {
    test('should delete a service', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await expect(
        universalApi.deleteEntity(createdServiceId)
      ).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/universal'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      });

      await expect(
        universalApi.createEntity({
          entity_type: 'salon_service',
          entity_name: 'Test Service'
        })
      ).rejects.toThrow('Internal Server Error');
    });

    test('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        universalApi.getEntities({ entity_type: 'salon_service' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Multi-tenant Validation', () => {
    test('should include organization_id in all requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'new-service' } })
      });

      await universalApi.createEntity({
        entity_type: 'salon_service',
        entity_name: 'Test Service'
      });

      const requestBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      );

      expect(requestBody.data.organization_id).toBe(testOrganizationId);
    });
  });
});