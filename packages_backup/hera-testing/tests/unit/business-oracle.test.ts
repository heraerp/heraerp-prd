import { BusinessOracle } from '../../src/oracles/business-oracle';

describe('BusinessOracle', () => {
  describe('validateAccountingEquation', () => {
    it('should validate correct accounting equation', () => {
      const result = BusinessOracle.validateAccountingEquation(100000, 60000, 40000);
      expect(result).toBe(true);
    });

    it('should reject incorrect accounting equation', () => {
      const result = BusinessOracle.validateAccountingEquation(100000, 60000, 50000);
      expect(result).toBe(false);
    });

    it('should handle tolerance for rounding errors', () => {
      const result = BusinessOracle.validateAccountingEquation(100000, 60000, 39999.99);
      expect(result).toBe(true);
    });
  });

  describe('validateJournalBalance', () => {
    it('should validate balanced journal entries', () => {
      const lines = [
        { debit: 1000, credit: 0 },
        { debit: 0, credit: 1000 },
      ];

      const result = BusinessOracle.validateJournalBalance(lines);
      expect(result).toBe(true);
    });

    it('should reject unbalanced journal entries', () => {
      const lines = [
        { debit: 1000, credit: 0 },
        { debit: 0, credit: 500 },
      ];

      const result = BusinessOracle.validateJournalBalance(lines);
      expect(result).toBe(false);
    });

    it('should handle multiple line entries', () => {
      const lines = [
        { debit: 500, credit: 0 },
        { debit: 500, credit: 0 },
        { debit: 0, credit: 800 },
        { debit: 0, credit: 200 },
      ];

      const result = BusinessOracle.validateJournalBalance(lines);
      expect(result).toBe(true);
    });
  });

  describe('calculateProfitability', () => {
    it('should calculate positive profit and margin', () => {
      const result = BusinessOracle.calculateProfitability(1000, 600, 200);

      expect(result.profit).toBe(200);
      expect(result.margin).toBe(20);
      expect(result.isValid).toBe(true);
    });

    it('should calculate negative profit', () => {
      const result = BusinessOracle.calculateProfitability(1000, 800, 300);

      expect(result.profit).toBe(-100);
      expect(result.margin).toBe(-10);
      expect(result.isValid).toBe(true);
    });

    it('should handle zero revenue', () => {
      const result = BusinessOracle.calculateProfitability(0, 100, 50);

      expect(result.profit).toBe(-150);
      expect(result.margin).toBe(0);
      expect(result.isValid).toBe(true);
    });

    it('should validate input parameters', () => {
      const result = BusinessOracle.calculateProfitability(-100, 50, 25);

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateInventoryTransaction', () => {
    it('should validate inbound inventory transaction', () => {
      const result = BusinessOracle.validateInventoryTransaction(100, 50, 'in', 10);

      expect(result.newStock).toBe(150);
      expect(result.isValid).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('should validate outbound inventory transaction', () => {
      const result = BusinessOracle.validateInventoryTransaction(100, 30, 'out', 10);

      expect(result.newStock).toBe(70);
      expect(result.isValid).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('should warn about low stock levels', () => {
      const result = BusinessOracle.validateInventoryTransaction(20, 15, 'out', 10);

      expect(result.newStock).toBe(5);
      expect(result.isValid).toBe(true);
      expect(result.warning).toContain('below minimum level');
    });

    it('should reject negative stock transactions', () => {
      const result = BusinessOracle.validateInventoryTransaction(10, 15, 'out', 5);

      expect(result.newStock).toBe(-5);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateSmartCode', () => {
    it('should validate correct smart code format', () => {
      const result = BusinessOracle.validateSmartCode('HERA.REST.CRM.CUST.ENT.v1');

      expect(result.isValid).toBe(true);
      expect(result.components).toEqual({
        system: 'HERA',
        industry: 'REST',
        module: 'CRM',
        function: 'CUST',
        type: 'ENT',
        version: '1',
      });
    });

    it('should reject invalid smart code format', () => {
      const result = BusinessOracle.validateSmartCode('INVALID.CODE');

      expect(result.isValid).toBe(false);
      expect(result.components).toBeUndefined();
    });

    it('should handle different version numbers', () => {
      const result = BusinessOracle.validateSmartCode('HERA.HLTH.PAT.MED.REC.v5');

      expect(result.isValid).toBe(true);
      expect(result.components!.version).toBe('5');
    });
  });

  describe('validateStatusProgression', () => {
    const allowedTransitions = {
      draft: ['pending', 'cancelled'],
      pending: ['approved', 'rejected'],
      approved: ['completed', 'cancelled'],
      rejected: ['draft'],
      completed: [],
      cancelled: [],
    };

    it('should allow valid status transitions', () => {
      const result = BusinessOracle.validateStatusProgression(
        'draft', 
        'pending', 
        allowedTransitions
      );

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject invalid status transitions', () => {
      const result = BusinessOracle.validateStatusProgression(
        'completed', 
        'draft', 
        allowedTransitions
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Cannot transition');
    });

    it('should handle unknown status', () => {
      const result = BusinessOracle.validateStatusProgression(
        'unknown', 
        'pending', 
        allowedTransitions
      );

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCreditLimit', () => {
    it('should allow transactions within credit limit', () => {
      const result = BusinessOracle.validateCreditLimit(5000, 2000, 10000);

      expect(result.isValid).toBe(true);
      expect(result.availableCredit).toBe(5000);
      expect(result.exceedsBy).toBeUndefined();
    });

    it('should reject transactions exceeding credit limit', () => {
      const result = BusinessOracle.validateCreditLimit(8000, 3000, 10000);

      expect(result.isValid).toBe(false);
      expect(result.availableCredit).toBe(2000);
      expect(result.exceedsBy).toBe(1000);
    });
  });

  describe('calculateTax', () => {
    it('should calculate exclusive tax correctly', () => {
      const result = BusinessOracle.calculateTax(100, 0.05, false);

      expect(result.netAmount).toBe(100);
      expect(result.taxAmount).toBe(5);
      expect(result.grossAmount).toBe(105);
    });

    it('should calculate inclusive tax correctly', () => {
      const result = BusinessOracle.calculateTax(105, 0.05, true);

      expect(result.netAmount).toBe(100);
      expect(result.taxAmount).toBe(5);
      expect(result.grossAmount).toBe(105);
    });
  });

  describe('applyDiscount', () => {
    it('should apply percentage discount correctly', () => {
      const result = BusinessOracle.applyDiscount(100, 'percentage', 10);

      expect(result.discountAmount).toBe(10);
      expect(result.finalPrice).toBe(90);
      expect(result.isValid).toBe(true);
    });

    it('should apply fixed discount correctly', () => {
      const result = BusinessOracle.applyDiscount(100, 'fixed', 15);

      expect(result.discountAmount).toBe(15);
      expect(result.finalPrice).toBe(85);
      expect(result.isValid).toBe(true);
    });

    it('should limit discount to maximum amount', () => {
      const result = BusinessOracle.applyDiscount(100, 'percentage', 20, 10);

      expect(result.discountAmount).toBe(10);
      expect(result.finalPrice).toBe(90);
      expect(result.isValid).toBe(true);
    });

    it('should reject negative discount', () => {
      const result = BusinessOracle.applyDiscount(100, 'percentage', -10);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Invalid discount');
    });
  });

  describe('validateRestaurantOrder', () => {
    it('should validate valid restaurant order', () => {
      const order = {
        items: [
          { quantity: 2, price: 15.50 },
          { quantity: 1, price: 8.00 },
        ],
        tableNumber: 5,
      };

      const result = BusinessOracle.validateRestaurantOrder(order);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should require items in order', () => {
      const order = {
        items: [],
        tableNumber: 5,
      };

      const result = BusinessOracle.validateRestaurantOrder(order);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Order must contain at least one item');
    });

    it('should require table number or delivery address', () => {
      const order = {
        items: [{ quantity: 1, price: 10.00 }],
      };

      const result = BusinessOracle.validateRestaurantOrder(order);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Order must have either table number or delivery address');
    });

    it('should validate item quantities and prices', () => {
      const order = {
        items: [
          { quantity: 0, price: 10.00 },
          { quantity: 1, price: -5.00 },
        ],
        tableNumber: 5,
      };

      const result = BusinessOracle.validateRestaurantOrder(order);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Item 1: Quantity must be positive');
      expect(result.errors).toContain('Item 2: Price cannot be negative');
    });
  });

  describe('validateHealthcareAppointment', () => {
    it('should validate valid healthcare appointment', () => {
      const appointment = {
        patientId: 'PAT-001',
        providerId: 'PROV-001',
        startTime: new Date(Date.now() + 86400000), // Tomorrow
        duration: 30,
        serviceType: 'consultation',
      };

      const result = BusinessOracle.validateHealthcareAppointment(appointment);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should require patient and provider IDs', () => {
      const appointment = {
        patientId: '',
        providerId: '',
        startTime: new Date(Date.now() + 86400000),
        duration: 30,
        serviceType: 'consultation',
      };

      const result = BusinessOracle.validateHealthcareAppointment(appointment);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Patient ID is required');
      expect(result.errors).toContain('Provider ID is required');
    });

    it('should validate appointment duration', () => {
      const appointment = {
        patientId: 'PAT-001',
        providerId: 'PROV-001',
        startTime: new Date(Date.now() + 86400000),
        duration: 10, // Too short
        serviceType: 'consultation',
      };

      const result = BusinessOracle.validateHealthcareAppointment(appointment);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Appointment duration must be at least 15 minutes');
    });

    it('should reject appointments in the past', () => {
      const appointment = {
        patientId: 'PAT-001',
        providerId: 'PROV-001',
        startTime: new Date(Date.now() - 86400000), // Yesterday
        duration: 30,
        serviceType: 'consultation',
      };

      const result = BusinessOracle.validateHealthcareAppointment(appointment);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Appointment cannot be scheduled in the past');
    });
  });
});