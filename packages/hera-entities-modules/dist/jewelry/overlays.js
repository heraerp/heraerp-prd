import { withOverlay, withMixins, TAGGABLE } from '@hera/entities-core';
import { PRODUCT_PRESET } from '@hera/entities-core/presets';
export const JEWELRY_PRODUCT = withMixins(withOverlay(PRODUCT_PRESET, {
    dynamicFields: [
        { name: 'carat', type: 'number', smart_code: 'HERA.JEWELRY.PRODUCT.DYN.CARAT.v1', ui: { label: 'Carat' } },
        { name: 'clarity', type: 'text', smart_code: 'HERA.JEWELRY.PRODUCT.DYN.CLARITY.v1', ui: { label: 'Clarity' } }
    ],
    relationships: [
        { type: 'HAS_CERT', smart_code: 'HERA.JEWELRY.PRODUCT.REL.HAS_CERT.v1', cardinality: 'one', target: 'CERTIFICATE' }
    ]
}), [TAGGABLE]);
