export const CATEGORY_PRESET = {
    version: '1.0.0',
    entity_type: 'CATEGORY',
    smart_code: 'HERA.SALON.CATEGORY.ENTITY.ITEM.v1',
    dynamicFields: [
        { name: 'code', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.CODE.v1', ui: { label: 'Code' }, required: true },
        { name: 'color', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.COLOR.v1', ui: { label: 'Color' } }
    ],
    relationships: [],
    policy: { canCreate: () => true, canEdit: () => true, canDelete: (r) => r === 'owner' || r === 'manager' }
};
// [ CATEGORY_PRESET.smart_code, ...CATEGORY_PRESET.dynamicFields.map(f => f.smart_code) ]
//   .forEach(code => assertSmartCode(code, 'CATEGORY_PRESET'));
