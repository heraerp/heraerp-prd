import { DSLRunner } from '../../src/runners/dsl-runner';
import { BusinessProcessTest } from '../../src/dsl/schema';
import { universalApi } from '@/lib/universal-api';

// Mock the universal API
jest.mock('@/lib/universal-api');
const mockUniversalApi = universalApi as jest.Mocked<typeof universalApi>;

describe('DSLRunner Integration Tests', () => {
  let runner: DSLRunner;

  beforeEach(() => {
    runner = new DSLRunner({ verbose: false, dryRun: false });
    jest.clearAllMocks();

    // Setup default mocks
    mockUniversalApi.setupBusiness.mockResolvedValue({
      organization: { id: 'test-org-id' },
      success: true,
    } as any);

    mockUniversalApi.createEntity.mockResolvedValue({
      id: 'test-entity-id',
      entity_code: 'TEST-001',
      entity_name: 'Test Entity',
    } as any);

    mockUniversalApi.createTransaction.mockResolvedValue({
      id: 'test-transaction-id',
      transaction_code: 'TXN-001',
      total_amount: 100,
    } as any);

    mockUniversalApi.createRelationship.mockResolvedValue({
      id: 'test-relationship-id',
      relationship_type: 'has_status',
    } as any);
  });

  describe('Simple Business Process Test', () => {
    it('should run a simple customer creation test successfully', async () => {
      const test: BusinessProcessTest = {
        version: '1.0',
        metadata: {
          name: 'Simple Customer Test',
          description: 'Create a customer entity',
          industry: 'restaurant',
          process_type: 'custom',
        },
        setup: {
          organization: {
            name: 'Test Restaurant',
            business_type: 'restaurant',
          },
        },
        steps: [
          {
            id: 'customer',
            name: 'Create customer',
            type: 'create_entity',
            data: {
              entity_type: 'customer',
              entity_name: 'John Doe',
              entity_code: 'CUST-001',
              smart_code: 'HERA.REST.CUST.ENT.DINER.v1',
            },
            validations: [
              {
                type: 'exists',
                field: 'id',
                expected: true,
              },
              {
                type: 'equals',
                field: 'entity_code',
                expected: 'CUST-001',
              },
            ],
          },
        ],
      };

      const result = await runner.run(test);

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].success).toBe(true);
      expect(result.errors).toHaveLength(0);

      expect(mockUniversalApi.setupBusiness).toHaveBeenCalledWith({
        organization_name: 'Test Restaurant',
        business_type: 'restaurant',
        owner_name: 'Test Runner',
      });

      expect(mockUniversalApi.createEntity).toHaveBeenCalledWith({
        entity_type: 'customer',
        entity_name: 'John Doe',
        entity_code: 'CUST-001',
        smart_code: 'HERA.REST.CUST.ENT.DINER.v1',
      });
    });

    it('should handle validation failures', async () => {
      const test: BusinessProcessTest = {
        version: '1.0',
        metadata: {
          name: 'Validation Failure Test',
          description: 'Test validation failure handling',
          industry: 'restaurant',
          process_type: 'custom',
        },
        setup: {
          organization: {
            name: 'Test Restaurant',
            business_type: 'restaurant',
          },
        },
        steps: [
          {
            id: 'customer',
            name: 'Create customer with validation',
            type: 'create_entity',
            data: {
              entity_type: 'customer',
              entity_name: 'John Doe',
              entity_code: 'CUST-001',
              smart_code: 'HERA.REST.CUST.ENT.DINER.v1',
            },
            validations: [
              {
                type: 'equals',
                field: 'entity_code',
                expected: 'CUST-002', // This will fail
              },
            ],
          },
        ],
      };

      const result = await runner.run(test);

      expect(result.success).toBe(false);
      expect(result.steps[0].success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Complex Order-to-Cash Process', () => {
    it('should run complete restaurant order process', async () => {
      const test: BusinessProcessTest = {
        version: '1.0',
        metadata: {
          name: 'Restaurant Order Process',
          description: 'Complete order-to-cash process',
          industry: 'restaurant',
          process_type: 'order-to-cash',
        },
        setup: {
          organization: {
            name: 'Mario\'s Restaurant',
            business_type: 'restaurant',
          },
          entities: [
            {
              entity_type: 'product',
              entity_name: 'Margherita Pizza',
              entity_code: 'PIZZA-001',
              smart_code: 'HERA.REST.MENU.ENT.ITEM.v1',
            },
          ],
        },
        steps: [
          {
            id: 'customer',
            name: 'Create customer',
            type: 'create_entity',
            data: {
              entity_type: 'customer',
              entity_name: 'Walk-in Customer',
              entity_code: 'WALKIN-001',
              smart_code: 'HERA.REST.CUST.ENT.DINER.v1',
            },
          },
          {
            id: 'order',
            name: 'Create order',
            type: 'create_transaction',
            data: {
              transaction_type: 'sale',
              transaction_code: 'ORDER-001',
              smart_code: 'HERA.REST.SALE.TXN.ORDER.v1',
              total_amount: 28.50,
              from_entity_id: '{{customer.id}}',
              line_items: [
                {
                  line_entity_id: 'pizza-id',
                  quantity: 1,
                  unit_price: 28.50,
                  line_amount: 28.50,
                  smart_code: 'HERA.REST.SALE.LINE.ITEM.v1',
                },
              ],
            },
          },
          {
            id: 'payment',
            name: 'Process payment',
            type: 'create_transaction',
            data: {
              transaction_type: 'payment',
              transaction_code: 'PAY-001',
              smart_code: 'HERA.REST.PAY.TXN.CASH.v1',
              total_amount: 28.50,
              from_entity_id: '{{customer.id}}',
            },
          },
        ],
      };

      // Mock specific responses for each step
      mockUniversalApi.createEntity
        .mockResolvedValueOnce({
          id: 'customer-id',
          entity_code: 'WALKIN-001',
        } as any)
        .mockResolvedValueOnce({
          id: 'pizza-id',
          entity_code: 'PIZZA-001',
        } as any);

      mockUniversalApi.createTransaction
        .mockResolvedValueOnce({
          id: 'order-id',
          transaction_code: 'ORDER-001',
          total_amount: 28.50,
        } as any)
        .mockResolvedValueOnce({
          id: 'payment-id',
          transaction_code: 'PAY-001',
          total_amount: 28.50,
        } as any);

      const result = await runner.run(test);

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(3);
      expect(result.steps.every(step => step.success)).toBe(true);

      // Verify all API calls were made
      expect(mockUniversalApi.setupBusiness).toHaveBeenCalledTimes(1);
      expect(mockUniversalApi.createEntity).toHaveBeenCalledTimes(2); // Customer + setup pizza
      expect(mockUniversalApi.createTransaction).toHaveBeenCalledTimes(2); // Order + payment
    });
  });

  describe('Reference Resolution', () => {
    it('should resolve references between steps', async () => {
      const test: BusinessProcessTest = {
        version: '1.0',
        metadata: {
          name: 'Reference Resolution Test',
          description: 'Test step reference resolution',
          industry: 'restaurant',
          process_type: 'custom',
        },
        setup: {
          organization: {
            name: 'Test Restaurant',
            business_type: 'restaurant',
          },
        },
        steps: [
          {
            id: 'customer',
            name: 'Create customer',
            type: 'create_entity',
            data: {
              entity_type: 'customer',
              entity_name: 'John Doe',
              entity_code: 'CUST-001',
              smart_code: 'HERA.REST.CUST.ENT.DINER.v1',
            },
          },
          {
            id: 'order',
            name: 'Create order for customer',
            type: 'create_transaction',
            data: {
              transaction_type: 'sale',
              transaction_code: 'ORDER-001',
              smart_code: 'HERA.REST.SALE.TXN.ORDER.v1',
              total_amount: 50.00,
              from_entity_id: '{{customer.id}}', // Reference to previous step
            },
          },
        ],
      };

      mockUniversalApi.createEntity.mockResolvedValue({
        id: 'customer-123',
        entity_code: 'CUST-001',
      } as any);

      const result = await runner.run(test);

      expect(result.success).toBe(true);

      // Verify that the reference was resolved
      expect(mockUniversalApi.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          from_entity_id: 'customer-123',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const test: BusinessProcessTest = {
        version: '1.0',
        metadata: {
          name: 'Error Handling Test',
          description: 'Test error handling',
          industry: 'restaurant',
          process_type: 'custom',
        },
        setup: {
          organization: {
            name: 'Test Restaurant',
            business_type: 'restaurant',
          },
        },
        steps: [
          {
            id: 'failing_step',
            name: 'Create entity that will fail',
            type: 'create_entity',
            data: {
              entity_type: 'customer',
              entity_name: 'Failing Customer',
              entity_code: 'FAIL-001',
              smart_code: 'HERA.REST.CUST.ENT.DINER.v1',
            },
          },
        ],
      };

      mockUniversalApi.createEntity.mockRejectedValue(new Error('API Error'));

      const result = await runner.run(test);

      expect(result.success).toBe(false);
      expect(result.steps[0].success).toBe(false);
      expect(result.steps[0].error).toBeDefined();
      expect(result.steps[0].error!.message).toBe('API Error');
    });

    it('should continue on error when configured', async () => {
      const runnerWithContinue = new DSLRunner({ 
        verbose: false,
        continueOnError: true,
      });

      const test: BusinessProcessTest = {
        version: '1.0',
        metadata: {
          name: 'Continue On Error Test',
          description: 'Test continue on error behavior',
          industry: 'restaurant',
          process_type: 'custom',
        },
        setup: {
          organization: {
            name: 'Test Restaurant',
            business_type: 'restaurant',
          },
        },
        steps: [
          {
            id: 'failing_step',
            name: 'Failing step',
            type: 'create_entity',
            data: {
              entity_type: 'customer',
              entity_name: 'Failing Customer',
              entity_code: 'FAIL-001',
              smart_code: 'HERA.REST.CUST.ENT.DINER.v1',
            },
          },
          {
            id: 'success_step',
            name: 'Successful step',
            type: 'create_entity',
            data: {
              entity_type: 'customer',
              entity_name: 'Successful Customer',
              entity_code: 'SUCCESS-001',
              smart_code: 'HERA.REST.CUST.ENT.DINER.v1',
            },
          },
        ],
      };

      mockUniversalApi.createEntity
        .mockRejectedValueOnce(new Error('First step failed'))
        .mockResolvedValueOnce({
          id: 'success-id',
          entity_code: 'SUCCESS-001',
        } as any);

      const result = await runnerWithContinue.run(test);

      expect(result.success).toBe(false); // Overall failure due to errors
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].success).toBe(false);
      expect(result.steps[1].success).toBe(true);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Dry Run Mode', () => {
    it('should skip actual operations in dry run mode', async () => {
      const dryRunner = new DSLRunner({
        verbose: false,
        dryRun: true,
      });

      const test: BusinessProcessTest = {
        version: '1.0',
        metadata: {
          name: 'Dry Run Test',
          description: 'Test dry run mode',
          industry: 'restaurant',
          process_type: 'custom',
        },
        setup: {
          organization: {
            name: 'Test Restaurant',
            business_type: 'restaurant',
          },
        },
        steps: [
          {
            id: 'customer',
            name: 'Create customer',
            type: 'create_entity',
            data: {
              entity_type: 'customer',
              entity_name: 'Dry Run Customer',
              entity_code: 'DRY-001',
              smart_code: 'HERA.REST.CUST.ENT.DINER.v1',
            },
          },
        ],
      };

      const result = await dryRunner.run(test);

      expect(result.success).toBe(true);
      expect(result.steps[0].success).toBe(true);
      
      // No API calls should have been made
      expect(mockUniversalApi.setupBusiness).not.toHaveBeenCalled();
      expect(mockUniversalApi.createEntity).not.toHaveBeenCalled();
    });
  });
});