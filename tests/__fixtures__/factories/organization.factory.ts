/**
 * Test data factory for organizations
 */

export interface OrganizationData {
  id?: string;
  name: string;
  subdomain: string;
  businessType: string;
  industry?: string;
  country?: string;
  modules: string[];
  settings?: Record<string, any>;
}

export class OrganizationFactory {
  private static counter = 0;

  static create(overrides: Partial<OrganizationData> = {}): OrganizationData {
    const timestamp = Date.now();
    const uniqueId = `${timestamp}-${this.counter++}`;
    
    const defaults: OrganizationData = {
      name: `Test Organization ${uniqueId}`,
      subdomain: `test-org-${uniqueId}`,
      businessType: 'salon',
      industry: 'beauty_wellness',
      country: 'US',
      modules: ['HERA.SALON.POS.MODULE.v1', 'HERA.SALON.APPOINTMENTS.MODULE.v1'],
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        language: 'en'
      }
    };

    return { ...defaults, ...overrides };
  }

  static createSalon(overrides: Partial<OrganizationData> = {}): OrganizationData {
    return this.create({
      businessType: 'salon',
      industry: 'beauty_wellness',
      modules: [
        'HERA.SALON.POS.MODULE.v1',
        'HERA.SALON.APPOINTMENTS.MODULE.v1',
        'HERA.SALON.CLIENTS.MODULE.v1',
        'HERA.SALON.INVENTORY.MODULE.v1'
      ],
      ...overrides
    });
  }

  static createRestaurant(overrides: Partial<OrganizationData> = {}): OrganizationData {
    return this.create({
      businessType: 'restaurant',
      industry: 'food_beverage',
      modules: [
        'HERA.RESTAURANT.POS.MODULE.v1',
        'HERA.RESTAURANT.KITCHEN.MODULE.v1',
        'HERA.RESTAURANT.INVENTORY.MODULE.v1',
        'HERA.RESTAURANT.TABLES.MODULE.v1'
      ],
      ...overrides
    });
  }

  static createHealthcare(overrides: Partial<OrganizationData> = {}): OrganizationData {
    return this.create({
      businessType: 'clinic',
      industry: 'healthcare',
      modules: [
        'HERA.HEALTHCARE.PATIENTS.MODULE.v1',
        'HERA.HEALTHCARE.APPOINTMENTS.MODULE.v1',
        'HERA.HEALTHCARE.BILLING.MODULE.v1',
        'HERA.HEALTHCARE.EMR.MODULE.v1'
      ],
      ...overrides
    });
  }

  static createRetail(overrides: Partial<OrganizationData> = {}): OrganizationData {
    return this.create({
      businessType: 'retail',
      industry: 'retail_general',
      modules: [
        'HERA.RETAIL.POS.MODULE.v1',
        'HERA.RETAIL.INVENTORY.MODULE.v1',
        'HERA.RETAIL.ECOMMERCE.MODULE.v1',
        'HERA.RETAIL.CRM.MODULE.v1'
      ],
      ...overrides
    });
  }

  static createManufacturing(overrides: Partial<OrganizationData> = {}): OrganizationData {
    return this.create({
      businessType: 'manufacturing',
      industry: 'manufacturing',
      modules: [
        'HERA.MFG.PRODUCTION.MODULE.v1',
        'HERA.MFG.BOM.MODULE.v1',
        'HERA.MFG.INVENTORY.MODULE.v1',
        'HERA.MFG.QUALITY.MODULE.v1'
      ],
      ...overrides
    });
  }

  static createBatch(count: number, overrides: Partial<OrganizationData> = {}): OrganizationData[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static reset() {
    this.counter = 0;
  }
}