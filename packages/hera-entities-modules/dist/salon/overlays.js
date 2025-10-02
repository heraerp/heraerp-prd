import { withOverlay } from '@hera/entities-core/overlay';
import { PRODUCT_PRESET, CATEGORY_PRESET } from '@hera/entities-core/presets';
// Example: tighten product policy for salon module and add UI labels
export const SALON_PRODUCT = withOverlay(PRODUCT_PRESET, {
    policy: {
        canEdit: (role) => role === 'owner' || role === 'manager' || role === 'receptionist'
    },
    dynamicFields: [
        {
            name: 'sku',
            type: 'text',
            smart_code: 'HERA.SALON.PRODUCT.DYN.SKU.v1',
            ui: { label: 'SKU / Barcode', placeholder: 'Scan or type' }
        }
    ]
});
export const SALON_CATEGORY = CATEGORY_PRESET; // unchanged, re-export
