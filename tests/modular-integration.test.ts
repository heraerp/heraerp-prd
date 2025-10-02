import { describe, it, expect } from 'vitest'
import { withOverlay, withMixins, TAGGABLE, isVisible } from '@hera/entities-core'
import { salon, jewelry } from '@hera/entities-modules'

describe('Modular Entity Presets', () => {
  describe('Overlay System', () => {
    it('should overlay salon product with custom fields', () => {
      const customProduct = withOverlay(salon.SALON_PRODUCT, {
        dynamicFields: [
          {
            name: 'custom_field',
            type: 'text',
            smart_code: 'HERA.CUSTOM.FIELD.v1'
          }
        ]
      })

      expect(customProduct.entity_type).toBe('PRODUCT')
      expect(customProduct.dynamicFields).toHaveLength(4) // 3 original + 1 new
      expect(customProduct.dynamicFields.find(f => f.name === 'custom_field')).toBeDefined()
    })

    it('should merge UI properties correctly', () => {
      const customProduct = withOverlay(salon.SALON_PRODUCT, {
        dynamicFields: [
          {
            name: 'sku',
            type: 'text',
            smart_code: 'HERA.SALON.PRODUCT.DYN.SKU.v1',
            ui: { 
              help: 'Custom help text',
              required: true 
            }
          }
        ]
      })

      const skuField = customProduct.dynamicFields.find(f => f.name === 'sku')
      expect(skuField?.ui?.label).toBe('SKU / Barcode') // From salon overlay
      expect(skuField?.ui?.placeholder).toBe('Scan or type') // From salon overlay
      expect(skuField?.ui?.help).toBe('Custom help text') // From custom overlay
    })

    it('should override policy functions', () => {
      const restrictedProduct = withOverlay(salon.SALON_PRODUCT, {
        policy: {
          canDelete: (role) => role === 'owner'
        }
      })

      expect(restrictedProduct.policy?.canDelete?.('owner')).toBe(true)
      expect(restrictedProduct.policy?.canDelete?.('manager')).toBe(false)
      expect(restrictedProduct.policy?.canEdit?.('receptionist')).toBe(true) // From salon overlay
    })
  })

  describe('Mixin System', () => {
    it('should add taggable mixin to jewelry product', () => {
      expect(jewelry.JEWELRY_PRODUCT.relationships).toContainEqual({
        type: 'HAS_TAG',
        smart_code: 'HERA.CORE.REL.HAS_TAG.v1',
        cardinality: 'many'
      })
    })

    it('should compose multiple overlays and mixins', () => {
      const baseProduct = salon.SALON_PRODUCT
      const enhancedProduct = withMixins(
        withOverlay(baseProduct, {
          dynamicFields: [
            { name: 'warranty', type: 'text', smart_code: 'HERA.PROD.WARRANTY.v1' }
          ]
        }),
        [
          TAGGABLE,
          {
            relationships: [
              { type: 'HAS_SUPPLIER', smart_code: 'HERA.PROD.SUPPLIER.v1', cardinality: 'many' }
            ]
          }
        ]
      )

      expect(enhancedProduct.dynamicFields).toHaveLength(4)
      expect(enhancedProduct.relationships).toHaveLength(4) // 2 original + 2 from mixins
    })
  })

  describe('Field Visibility', () => {
    it('should evaluate static visibility', () => {
      const field = { 
        name: 'test', 
        type: 'text' as const, 
        smart_code: 'TEST.v1',
        ui: { visible: false } 
      }
      expect(isVisible(field, 'owner')).toBe(false)
    })

    it('should evaluate function visibility', () => {
      const field = { 
        name: 'cost', 
        type: 'number' as const, 
        smart_code: 'COST.v1',
        ui: { 
          visible: (role) => role === 'owner' || role === 'manager' 
        } 
      }
      
      expect(isVisible(field, 'owner')).toBe(true)
      expect(isVisible(field, 'receptionist')).toBe(false)
    })

    it('should default to visible when not specified', () => {
      const field = { 
        name: 'name', 
        type: 'text' as const, 
        smart_code: 'NAME.v1' 
      }
      expect(isVisible(field, 'viewer')).toBe(true)
    })
  })
})