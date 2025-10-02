export const PRODUCT_PRESET = {
    version: '1.0.0',
    entity_type: 'PRODUCT',
    smart_code: 'HERA.SALON.PRODUCT.ENTITY.ITEM.v1',
    dynamicFields: [
        {
            name: 'price_market',
            type: 'number',
            smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1',
            ui: { label: 'Market Price', widget: 'currency' },
            required: true
        },
        {
            name: 'price_cost',
            type: 'number',
            smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1',
            ui: {
                label: 'Cost Price',
                widget: 'currency',
                visible: (role) => role === 'owner' || role === 'manager'
            }
        },
        {
            name: 'sku',
            type: 'text',
            smart_code: 'HERA.SALON.PRODUCT.DYN.SKU.v1',
            ui: { label: 'SKU' }
        }
    ],
    relationships: [
        { type: 'HAS_CATEGORY', smart_code: 'HERA.SALON.PRODUCT.REL.HAS_CATEGORY.v1', cardinality: 'one', target: 'CATEGORY' },
        { type: 'HAS_BRAND', smart_code: 'HERA.SALON.PRODUCT.REL.HAS_BRAND.v1', cardinality: 'one', target: 'BRAND' }
    ],
    policy: {
        canCreate: (role) => role !== 'viewer',
        canEdit: (role) => role === 'owner' || role === 'manager',
        canDelete: (role) => role === 'owner' || role === 'manager'
    }
};
// Validate smart codes immediately (CI will also do it)
// [PRODUCT_PRESET.smart_code, ...PRODUCT_PRESET.dynamicFields.map(f => f.smart_code), ...(PRODUCT_PRESET.relationships ?? []).map(r => r.smart_code)]
//   .forEach(code => assertSmartCode(code, 'PRODUCT_PRESET'));
