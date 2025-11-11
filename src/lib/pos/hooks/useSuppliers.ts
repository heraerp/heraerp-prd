/**
 * HERA POS Suppliers Hook
 * Smart Code: HERA.RETAIL.POS.HOOK.SUPPLIERS.v1
 * 
 * React hook for managing supplier entities with real Supabase data
 */

import { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { createUniversalPOSService, POS_SMART_CODES, POSServiceResponse, POSEntity } from '../universal-pos-service'

// ==================== Types ====================

export interface Supplier {
  id?: string
  name: string
  email?: string
  phone?: string
  gstNumber?: string
  paymentTerms?: string
  address?: string
  status?: 'active' | 'inactive' | 'blocked'
  createdAt?: string
  updatedAt?: string
}

export interface SupplierFilters {
  search?: string
  status?: string
  paymentTerms?: string
  hasGst?: boolean
}

// ==================== Hook ====================

export function useSuppliers() {
  const { organization } = useHERAAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create service instance
  const posService = organization ? createUniversalPOSService(organization.id) : null

  // ============ Load Suppliers ============

  const loadSuppliers = async (filters?: SupplierFilters) => {
    if (!posService) {
      setError('Organization context required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await posService.searchEntities('SUPPLIER', {
        search: filters?.search,
        limit: 100,
        offset: 0
      })

      if (response.success && response.data) {
        const formattedSuppliers = response.data.map(supplier => 
          posService.convertToUIFormat(supplier)
        )
        
        // Apply client-side filters
        let filteredSuppliers = formattedSuppliers
        
        if (filters?.status && filters.status !== 'all') {
          filteredSuppliers = filteredSuppliers.filter(s => s.status === filters.status)
        }

        if (filters?.hasGst) {
          filteredSuppliers = filteredSuppliers.filter(s => s.gstNumber)
        }

        if (filters?.paymentTerms && filters.paymentTerms !== 'all') {
          filteredSuppliers = filteredSuppliers.filter(s => s.paymentTerms === filters.paymentTerms)
        }

        setSuppliers(filteredSuppliers)
      } else {
        setError(response.error || 'Failed to load suppliers')
        setSuppliers([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  // ============ Create Supplier ============

  const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<POSServiceResponse<POSEntity>> => {
    if (!posService) {
      return { success: false, error: 'Organization context required' }
    }

    const dynamicFields = []

    if (supplierData.email) {
      dynamicFields.push({
        field_name: 'email',
        field_type: 'email' as const,
        field_value_text: supplierData.email,
        smart_code: POS_SMART_CODES.FIELDS.SUPPLIER.EMAIL
      })
    }

    if (supplierData.phone) {
      dynamicFields.push({
        field_name: 'phone',
        field_type: 'phone' as const,
        field_value_text: supplierData.phone,
        smart_code: POS_SMART_CODES.FIELDS.SUPPLIER.PHONE
      })
    }

    if (supplierData.gstNumber) {
      dynamicFields.push({
        field_name: 'gst_number',
        field_type: 'text' as const,
        field_value_text: supplierData.gstNumber,
        smart_code: POS_SMART_CODES.FIELDS.SUPPLIER.GST_NUMBER
      })
    }

    if (supplierData.paymentTerms) {
      dynamicFields.push({
        field_name: 'payment_terms',
        field_type: 'text' as const,
        field_value_text: supplierData.paymentTerms,
        smart_code: POS_SMART_CODES.FIELDS.SUPPLIER.PAYMENT_TERMS
      })
    }

    if (supplierData.address) {
      dynamicFields.push({
        field_name: 'address',
        field_type: 'text' as const,
        field_value_text: supplierData.address,
        smart_code: POS_SMART_CODES.FIELDS.SUPPLIER.ADDRESS
      })
    }

    const result = await posService.createEntity({
      entity_type: 'SUPPLIER',
      entity_name: supplierData.name,
      smart_code: POS_SMART_CODES.SUPPLIER,
      organization_id: organization!.id,
      dynamic_fields: dynamicFields
    })

    // Refresh suppliers list if successful
    if (result.success) {
      loadSuppliers()
    }

    return result
  }

  // ============ Update Supplier ============

  const updateSupplier = async (supplierId: string, updates: Partial<Supplier>): Promise<POSServiceResponse<POSEntity>> => {
    if (!posService) {
      return { success: false, error: 'Organization context required' }
    }

    const dynamicFields = []

    if (updates.email !== undefined) {
      dynamicFields.push({
        field_name: 'email',
        field_type: 'email' as const,
        field_value_text: updates.email,
        smart_code: POS_SMART_CODES.FIELDS.SUPPLIER.EMAIL
      })
    }

    if (updates.phone !== undefined) {
      dynamicFields.push({
        field_name: 'phone',
        field_type: 'phone' as const,
        field_value_text: updates.phone,
        smart_code: POS_SMART_CODES.FIELDS.SUPPLIER.PHONE
      })
    }

    if (updates.gstNumber !== undefined) {
      dynamicFields.push({
        field_name: 'gst_number',
        field_type: 'text' as const,
        field_value_text: updates.gstNumber,
        smart_code: POS_SMART_CODES.FIELDS.SUPPLIER.GST_NUMBER
      })
    }

    if (updates.paymentTerms !== undefined) {
      dynamicFields.push({
        field_name: 'payment_terms',
        field_type: 'text' as const,
        field_value_text: updates.paymentTerms,
        smart_code: POS_SMART_CODES.FIELDS.SUPPLIER.PAYMENT_TERMS
      })
    }

    if (updates.address !== undefined) {
      dynamicFields.push({
        field_name: 'address',
        field_type: 'text' as const,
        field_value_text: updates.address,
        smart_code: POS_SMART_CODES.FIELDS.SUPPLIER.ADDRESS
      })
    }

    const result = await posService.updateEntity(supplierId, {
      entity_name: updates.name,
      dynamic_fields: dynamicFields
    })

    // Refresh suppliers list if successful
    if (result.success) {
      loadSuppliers()
    }

    return result
  }

  // ============ Delete Supplier ============

  const deleteSupplier = async (supplierId: string): Promise<POSServiceResponse<boolean>> => {
    if (!posService) {
      return { success: false, error: 'Organization context required' }
    }

    const result = await posService.deleteEntity(supplierId)

    // Refresh suppliers list if successful
    if (result.success) {
      loadSuppliers()
    }

    return result
  }

  // ============ Get Supplier by ID ============

  const getSupplier = async (supplierId: string): Promise<Supplier | null> => {
    if (!posService) {
      return null
    }

    const response = await posService.getEntity(supplierId)
    
    if (response.success && response.data) {
      return posService.convertToUIFormat(response.data)
    }

    return null
  }

  // ============ Auto-load on mount ============

  useEffect(() => {
    if (organization) {
      loadSuppliers()
    }
  }, [organization])

  // ============ Return Hook Interface ============

  return {
    // Data
    suppliers,
    loading,
    error,

    // Actions
    loadSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplier,

    // Utilities
    refresh: () => loadSuppliers()
  }
}