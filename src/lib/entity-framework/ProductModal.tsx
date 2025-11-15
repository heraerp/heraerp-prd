'use client'

import React, { useEffect, useState } from 'react'
import { EntityForm, EntityFormData } from './EntityForm'
import { PRODUCT_PRESET } from './entityPresets'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { UniversalModal } from '@/components/universal/forms/UniversalForm'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Types
export interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  productId?: string
  initialData?: Partial<EntityFormData>
  onSuccess?: (product: any) => void
  userRole?: string
}

export interface ProductData {
  id?: string
  entity_name: string
  entity_code?: string
  smart_code: string
  // Dynamic fields
  price_market: number
  price_cost: number
  sku?: string
  stock_quantity: number
  reorder_level: number
  size?: string
  barcode?: string
  // Relationships
  category_id?: string
  brand_id?: string
  supplier_ids?: string[]
}

/**
 * ProductModal - Example implementation of EntityForm for products
 *
 * This modal demonstrates how to use the EntityForm component with:
 * - Universal entity operations (create/update)
 * - Dynamic field handling
 * - Relationship management
 * - Proper error handling and loading states
 * - Role-based field visibility
 */
export function ProductModal({
  isOpen,
  onClose,
  mode,
  productId,
  initialData,
  onSuccess,
  userRole = 'user'
}: ProductModalProps) {
  const { user } = useHERAAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize universal entity hook with product configuration
  const products = useUniversalEntity({
    entity_type: 'PRODUCT',
    dynamicFields: PRODUCT_PRESET.dynamicFields,
    relationships: PRODUCT_PRESET.relationships,
    filters: { include_dynamic: true }
  })

  // Load existing product data for edit mode
  const [existingProduct, setExistingProduct] = React.useState<any>(null)

  React.useEffect(() => {
    if (mode === 'edit' && productId && isOpen) {
      const loadProduct = async () => {
        try {
          const result = await products.getById(productId)
          setExistingProduct(result)
        } catch (err) {
          console.error('Failed to load product:', err)
          setError('Failed to load product data')
        }
      }
      loadProduct()
    }
  }, [mode, productId, isOpen, products])

  // Convert existing product data to form format
  const getInitialFormData = (): Partial<EntityFormData> => {
    if (mode === 'create') {
      return {
        entity_name: '',
        smart_code: 'HERA.SALON.PRODUCT.ENTITY.ITEM.V1',
        dynamic_fields: {
          price_market: 0,
          price_cost: 0,
          stock_quantity: 0,
          reorder_level: 10
        },
        relationships: {},
        ...initialData
      }
    }

    if (existingProduct) {
      return {
        entity_name: existingProduct.entity.entity_name,
        entity_code: existingProduct.entity.entity_code,
        smart_code: existingProduct.entity.smart_code,
        dynamic_fields: existingProduct.dynamic,
        relationships: convertRelationshipsToForm(existingProduct.relationships)
      }
    }

    return initialData || {}
  }

  // Convert relationship data from API format to form format
  const convertRelationshipsToForm = (relationships: any[]): Record<string, string[]> => {
    const result: Record<string, string[]> = {}

    for (const rel of relationships || []) {
      const type = rel.relationship_type
      if (!result[type]) {
        result[type] = []
      }
      result[type].push(rel.to_entity_id)
    }

    return result
  }

  // Handle form submission
  const handleSubmit = async (formData: EntityFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      let result

      if (mode === 'create') {
        // Create new product
        result = await products.create({
          entity_type: 'PRODUCT',
          entity_name: formData.entity_name,
          entity_code: formData.entity_code,
          smart_code: formData.smart_code,
          dynamic_fields: convertDynamicFieldsToAPI(formData.dynamic_fields),
          metadata: {
            relationships: formData.relationships
          }
        })
      } else {
        // Update existing product
        result = await products.update({
          entity_id: productId!,
          entity_name: formData.entity_name,
          entity_code: formData.entity_code,
          smart_code: formData.smart_code,
          dynamic_patch: formData.dynamic_fields,
          relationships_patch: formData.relationships
        })
      }

      // Success callback
      if (onSuccess) {
        onSuccess(result)
      }

      // Close modal
      onClose()

      // Show success message (you might want to use a toast here)
      console.log(`Product ${mode === 'create' ? 'created' : 'updated'} successfully`)
    } catch (err: any) {
      console.error(`Failed to ${mode} product:`, err)
      setError(err.message || `Failed to ${mode} product`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Convert dynamic fields from form format to API format
  const convertDynamicFieldsToAPI = (fields: Record<string, any>) => {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(fields)) {
      if (value !== null && value !== undefined && value !== '') {
        const fieldDef = PRODUCT_PRESET.dynamicFields.find(f => f.name === key)
        if (fieldDef) {
          result[key] = {
            value: value,
            type: fieldDef.type,
            smart_code: fieldDef.smart_code
          }
        }
      }
    }

    return result
  }

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setError(null)
      setExistingProduct(null)
      onClose()
    }
  }

  // Don't render anything if not open
  if (!isOpen) return null

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Create New Product' : 'Edit Product'}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <EntityForm
          preset={PRODUCT_PRESET}
          mode={mode}
          initialData={getInitialFormData()}
          userRole={userRole}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isSubmitting={isSubmitting}
        />
      </div>
    </UniversalModal>
  )
}

// Hook for easier product modal management
export function useProductModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [productId, setProductId] = useState<string | undefined>()
  const [initialData, setInitialData] = useState<Partial<EntityFormData> | undefined>()

  const openCreateModal = (data?: Partial<EntityFormData>) => {
    setMode('create')
    setProductId(undefined)
    setInitialData(data)
    setIsOpen(true)
  }

  const openEditModal = (id: string, data?: Partial<EntityFormData>) => {
    setMode('edit')
    setProductId(id)
    setInitialData(data)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setProductId(undefined)
    setInitialData(undefined)
  }

  return {
    isOpen,
    mode,
    productId,
    initialData,
    openCreateModal,
    openEditModal,
    closeModal
  }
}

// Example usage component
export function ProductModalExample() {
  const { user } = useHERAAuth()
  const productModal = useProductModal()

  const handleProductSuccess = (product: any) => {
    console.log('Product operation successful:', product)
    // You might want to refresh a list, show a toast, etc.
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={() => productModal.openCreateModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Product
        </button>

        <button
          onClick={() => productModal.openEditModal('some-product-id')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Edit Product
        </button>
      </div>

      <ProductModal
        isOpen={productModal.isOpen}
        onClose={productModal.closeModal}
        mode={productModal.mode}
        productId={productModal.productId}
        initialData={productModal.initialData}
        onSuccess={handleProductSuccess}
        userRole={user?.role || 'user'}
      />
    </div>
  )
}
