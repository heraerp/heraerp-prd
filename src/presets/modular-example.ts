/**
 * Example of using modular entity presets in the app
 * 
 * This shows how to migrate from the existing entityPresets.ts
 * to the new modular approach
 */

import { salon } from '@hera/entities-modules';
import { withOverlay } from '@hera/entities-core';

// Organization-specific overlay (no forking!)
export const PRODUCT_PRESET_FOR_ORG = withOverlay(salon.SALON_PRODUCT, {
  dynamicFields: [
    {
      name: 'price_cost',
      type: 'number',
      smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1',
      ui: { 
        visible: (role) => role === 'owner' || role === 'manager',
        helpText: 'Visible only to owners and managers'
      }
    }
  ],
  policy: { 
    canDelete: (role) => role === 'owner' 
  }
});

// Environment-specific overlay
const isDev = process.env.NODE_ENV === 'development';

export const PRODUCT_PRESET = isDev 
  ? withOverlay(PRODUCT_PRESET_FOR_ORG, {
      dynamicFields: [
        {
          name: 'debug_info',
          type: 'json',
          smart_code: 'HERA.DEV.DEBUG.INFO.v1',
          ui: { visible: true }
        }
      ]
    })
  : PRODUCT_PRESET_FOR_ORG;

// Example usage in a component
/*
import { useUniversalEntity } from '@/hooks/useUniversalEntity';
import { PRODUCT_PRESET } from '@/presets/modular-example';

export function ProductList() {
  const { entities, create, update, delete: destroy } = useUniversalEntity({
    entity_type: PRODUCT_PRESET.entity_type,
    dynamicFields: PRODUCT_PRESET.dynamicFields,
    relationships: PRODUCT_PRESET.relationships,
    filters: { include_dynamic: true, include_relationships: true }
  });

  // Check permissions
  const canCreate = PRODUCT_PRESET.policy?.canCreate?.(currentUserRole) ?? true;
  const canEdit = PRODUCT_PRESET.policy?.canEdit?.(currentUserRole) ?? true;
  
  // Rest of component...
}
*/