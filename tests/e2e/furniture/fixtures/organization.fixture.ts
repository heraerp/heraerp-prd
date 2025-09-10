/**
 * Organization setup fixture for Furniture Module tests
 */

import { test as base } from '@playwright/test';

export interface OrganizationFixture {
  setupFurnitureOrganization: () => Promise<void>;
  seedFurnitureData: () => Promise<void>;
}

export const test = base.extend<OrganizationFixture>({
  setupFurnitureOrganization: async ({ request }, use) => {
    const setup = async () => {
      // Setup furniture-specific organization data
      const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'test-org';
      
      // Initialize furniture module settings
      await request.post('/api/v1/universal', {
        headers: {
          'x-organization-id': orgId
        },
        data: {
          action: 'create',
          table: 'core_dynamic_data',
          data: {
            entity_type: 'organization_settings',
            field_name: 'furniture_module_enabled',
            field_value_text: 'true',
            organization_id: orgId
          }
        }
      });

      // Create default workstations
      const workstations = [
        'Cutting Station A',
        'Assembly Line 1',
        'Finishing Station',
        'QC Station',
        'Packing Station'
      ];

      for (const ws of workstations) {
        await request.post('/api/v1/universal', {
          headers: {
            'x-organization-id': orgId
          },
          data: {
            action: 'create',
            table: 'core_entities',
            data: {
              entity_type: 'workstation',
              entity_name: ws,
              entity_code: `WS-${ws.replace(/\s+/g, '-').toUpperCase()}`,
              organization_id: orgId,
              smart_code: 'HERA.FURN.PROD.WORKSTATION.v1'
            }
          }
        });
      }

      // Create product categories
      const categories = [
        { name: 'Seating', code: 'CAT-SEAT' },
        { name: 'Desks', code: 'CAT-DESK' },
        { name: 'Storage', code: 'CAT-STOR' },
        { name: 'Tables', code: 'CAT-TABL' }
      ];

      for (const cat of categories) {
        await request.post('/api/v1/universal', {
          headers: {
            'x-organization-id': orgId
          },
          data: {
            action: 'create',
            table: 'core_entities',
            data: {
              entity_type: 'product_category',
              entity_name: cat.name,
              entity_code: cat.code,
              organization_id: orgId,
              smart_code: 'HERA.FURN.PROD.CATEGORY.v1'
            }
          }
        });
      }
    };

    await use(setup);
  },

  seedFurnitureData: async ({ request }, use) => {
    const seed = async () => {
      const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'test-org';
      
      // Seed sample products
      const sampleProducts = [
        {
          entity_name: 'Basic Office Chair',
          entity_code: 'PROD-CHAIR-BASIC',
          smart_code: 'HERA.FURN.PROD.CHAIR.v1'
        },
        {
          entity_name: 'Executive Desk',
          entity_code: 'PROD-DESK-EXEC',
          smart_code: 'HERA.FURN.PROD.DESK.v1'
        },
        {
          entity_name: '2-Drawer Filing Cabinet',
          entity_code: 'PROD-CAB-2D',
          smart_code: 'HERA.FURN.PROD.CABINET.v1'
        }
      ];

      for (const product of sampleProducts) {
        const response = await request.post('/api/v1/universal', {
          headers: {
            'x-organization-id': orgId
          },
          data: {
            action: 'create',
            table: 'core_entities',
            data: {
              entity_type: 'product',
              entity_name: product.entity_name,
              entity_code: product.entity_code,
              organization_id: orgId,
              smart_code: product.smart_code
            }
          }
        });

        const productData = await response.json();
        const productId = productData.data.id;

        // Add product details via dynamic data
        await request.post('/api/v1/universal', {
          headers: {
            'x-organization-id': orgId
          },
          data: {
            action: 'batch_create',
            table: 'core_dynamic_data',
            data: [
              {
                entity_id: productId,
                field_name: 'selling_price',
                field_value_number: Math.floor(Math.random() * 500) + 100,
                organization_id: orgId
              },
              {
                entity_id: productId,
                field_name: 'standard_cost',
                field_value_number: Math.floor(Math.random() * 200) + 50,
                organization_id: orgId
              },
              {
                entity_id: productId,
                field_name: 'category',
                field_value_text: 'seating',
                organization_id: orgId
              }
            ]
          }
        });
      }

      // Seed sample raw materials
      const materials = [
        { name: 'Pine Wood', code: 'MAT-WOOD-PINE', unit: 'board_feet' },
        { name: 'Steel Tubing', code: 'MAT-STEEL-TUBE', unit: 'meters' },
        { name: 'Fabric - Blue', code: 'MAT-FABRIC-BLUE', unit: 'yards' },
        { name: 'Screws - M6', code: 'MAT-SCREW-M6', unit: 'pieces' }
      ];

      for (const mat of materials) {
        await request.post('/api/v1/universal', {
          headers: {
            'x-organization-id': orgId
          },
          data: {
            action: 'create',
            table: 'core_entities',
            data: {
              entity_type: 'raw_material',
              entity_name: mat.name,
              entity_code: mat.code,
              organization_id: orgId,
              smart_code: 'HERA.FURN.INV.MATERIAL.v1',
              metadata: {
                unit_of_measure: mat.unit
              }
            }
          }
        });
      }
    };

    await use(seed);
  }
});

export { expect } from '@playwright/test';