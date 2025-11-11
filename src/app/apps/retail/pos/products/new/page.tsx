/**
 * Retail POS Product Creation Wizard
 * Using HERA Master Data Template with Sacred Six Integration
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { HERAMasterDataTemplate, type FormSection, type FormField } from '@/components/hera/HERAMasterDataTemplate'
import { 
  Package, 
  DollarSign, 
  Tag, 
  Info,
  Barcode,
  Archive,
  Settings
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Product creation sections for the wizard
const productSections: FormSection[] = [
  {
    id: 'basic',
    label: 'Basic Information',
    icon: Package,
    required: true,
    description: 'Essential product details and identification'
  },
  {
    id: 'pricing',
    label: 'Pricing & Costs',
    icon: DollarSign,
    required: true,
    description: 'Retail prices, costs, and profit margins'
  },
  {
    id: 'inventory',
    label: 'Inventory & Stock',
    icon: Archive,
    required: false,
    description: 'Stock levels, suppliers, and tracking information'
  },
  {
    id: 'details',
    label: 'Additional Details',
    icon: Info,
    required: false,
    description: 'Category, tags, and other metadata'
  }
]

// Product form fields for the wizard
const productFields: FormField[] = [
  // Basic Information Section
  {
    id: 'name',
    label: 'Product Name',
    type: 'text',
    required: true,
    placeholder: 'Enter product name...',
    section: 'basic',
    validation: (value: string) => {
      if (!value || value.trim().length < 2) {
        return 'Product name must be at least 2 characters'
      }
      return null
    }
  },
  {
    id: 'sku',
    label: 'SKU (Product Code)',
    type: 'text',
    required: true,
    placeholder: 'e.g., PRD001',
    section: 'basic',
    validation: (value: string) => {
      if (!value || value.trim().length < 3) {
        return 'SKU must be at least 3 characters'
      }
      if (!/^[A-Z0-9]+$/.test(value.toUpperCase())) {
        return 'SKU can only contain letters and numbers'
      }
      return null
    }
  },
  {
    id: 'barcode',
    label: 'Barcode',
    type: 'text',
    required: false,
    placeholder: 'UPC/EAN barcode...',
    section: 'basic',
    validation: (value: string) => {
      if (value && value.length > 0 && (value.length < 8 || value.length > 14)) {
        return 'Barcode must be 8-14 digits'
      }
      return null
    }
  },
  {
    id: 'description',
    label: 'Description',
    type: 'textarea',
    required: false,
    placeholder: 'Product description and features...',
    section: 'basic'
  },

  // Pricing Section
  {
    id: 'price',
    label: 'Retail Price',
    type: 'number',
    required: true,
    placeholder: '0.00',
    section: 'pricing',
    validation: (value: string) => {
      const num = parseFloat(value)
      if (isNaN(num) || num < 0) {
        return 'Price must be a positive number'
      }
      return null
    }
  },
  {
    id: 'cost',
    label: 'Cost Price',
    type: 'number',
    required: false,
    placeholder: '0.00',
    section: 'pricing',
    validation: (value: string) => {
      if (value) {
        const num = parseFloat(value)
        if (isNaN(num) || num < 0) {
          return 'Cost must be a positive number'
        }
      }
      return null
    }
  },
  {
    id: 'tax_rate',
    label: 'Tax Rate (%)',
    type: 'number',
    required: false,
    placeholder: '0.00',
    section: 'pricing',
    validation: (value: string) => {
      if (value) {
        const num = parseFloat(value)
        if (isNaN(num) || num < 0 || num > 100) {
          return 'Tax rate must be between 0 and 100'
        }
      }
      return null
    }
  },
  {
    id: 'currency',
    label: 'Currency',
    type: 'select',
    required: true,
    section: 'pricing',
    options: [
      { value: 'USD', label: 'USD - US Dollar' },
      { value: 'EUR', label: 'EUR - Euro' },
      { value: 'GBP', label: 'GBP - British Pound' },
      { value: 'AED', label: 'AED - UAE Dirham' },
      { value: 'CAD', label: 'CAD - Canadian Dollar' }
    ]
  },

  // Inventory Section
  {
    id: 'initial_stock',
    label: 'Initial Stock Quantity',
    type: 'number',
    required: false,
    placeholder: '0',
    section: 'inventory',
    validation: (value: string) => {
      if (value) {
        const num = parseInt(value)
        if (isNaN(num) || num < 0) {
          return 'Stock quantity must be a positive integer'
        }
      }
      return null
    }
  },
  {
    id: 'reorder_level',
    label: 'Reorder Level',
    type: 'number',
    required: false,
    placeholder: '10',
    section: 'inventory',
    validation: (value: string) => {
      if (value) {
        const num = parseInt(value)
        if (isNaN(num) || num < 0) {
          return 'Reorder level must be a positive integer'
        }
      }
      return null
    }
  },
  {
    id: 'supplier',
    label: 'Primary Supplier',
    type: 'text',
    required: false,
    placeholder: 'Supplier name...',
    section: 'inventory'
  },
  {
    id: 'location',
    label: 'Storage Location',
    type: 'text',
    required: false,
    placeholder: 'e.g., Aisle 3, Shelf B',
    section: 'inventory'
  },

  // Additional Details Section
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    required: false,
    section: 'details',
    options: [
      { value: '', label: 'Select category...' },
      { value: 'beverages', label: 'Beverages' },
      { value: 'snacks', label: 'Snacks & Food' },
      { value: 'electronics', label: 'Electronics' },
      { value: 'clothing', label: 'Clothing & Accessories' },
      { value: 'health_beauty', label: 'Health & Beauty' },
      { value: 'home_garden', label: 'Home & Garden' },
      { value: 'books_media', label: 'Books & Media' },
      { value: 'toys_games', label: 'Toys & Games' },
      { value: 'sports_outdoor', label: 'Sports & Outdoor' },
      { value: 'other', label: 'Other' }
    ]
  },
  {
    id: 'brand',
    label: 'Brand',
    type: 'text',
    required: false,
    placeholder: 'Product brand...',
    section: 'details'
  },
  {
    id: 'weight',
    label: 'Weight (kg)',
    type: 'number',
    required: false,
    placeholder: '0.00',
    section: 'details',
    validation: (value: string) => {
      if (value) {
        const num = parseFloat(value)
        if (isNaN(num) || num < 0) {
          return 'Weight must be a positive number'
        }
      }
      return null
    }
  },
  {
    id: 'dimensions',
    label: 'Dimensions (L×W×H cm)',
    type: 'text',
    required: false,
    placeholder: 'e.g., 10×5×2',
    section: 'details'
  },
  {
    id: 'tags',
    label: 'Tags',
    type: 'text',
    required: false,
    placeholder: 'e.g., organic, bestseller, seasonal',
    section: 'details'
  },
  {
    id: 'notes',
    label: 'Internal Notes',
    type: 'textarea',
    required: false,
    placeholder: 'Internal notes and comments...',
    section: 'details'
  }
]

export default function NewProductPage() {
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Authentication guards
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-champagne mb-2">Authentication Required</h1>
          <p className="text-bronze">Please log in to create products</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-champagne mb-2">Organization Required</h1>
          <p className="text-bronze">Please select an organization to continue</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (formData: Record<string, any>) => {
    setIsSubmitting(true)
    
    try {
      console.log('Creating product with data:', formData)
      
      // Generate entity code from SKU
      const entityCode = formData.sku?.toUpperCase() || `PRD${Date.now()}`
      
      // Prepare entity data for Sacred Six tables
      const entityData = {
        entity_type: 'PRODUCT',
        entity_name: formData.name,
        entity_code: entityCode,
        entity_description: formData.description,
        smart_code: 'HERA.RETAIL.PRODUCT.ENTITY.POS.v1',
        organization_id: organization.id
      }

      // Prepare dynamic fields
      const dynamicFields = []

      // Basic fields
      if (formData.barcode) {
        dynamicFields.push({
          field_name: 'barcode',
          field_value_text: formData.barcode,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.BARCODE.v1'
        })
      }

      // Pricing fields
      if (formData.price) {
        dynamicFields.push({
          field_name: 'retail_price',
          field_value_number: parseFloat(formData.price),
          field_type: 'number',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.PRICE.v1'
        })
      }

      if (formData.cost) {
        dynamicFields.push({
          field_name: 'cost_price',
          field_value_number: parseFloat(formData.cost),
          field_type: 'number',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.COST.v1'
        })
      }

      if (formData.currency) {
        dynamicFields.push({
          field_name: 'currency',
          field_value_text: formData.currency,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.CURRENCY.v1'
        })
      }

      if (formData.tax_rate) {
        dynamicFields.push({
          field_name: 'tax_rate',
          field_value_number: parseFloat(formData.tax_rate),
          field_type: 'number',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.TAX_RATE.v1'
        })
      }

      // Inventory fields
      if (formData.initial_stock) {
        dynamicFields.push({
          field_name: 'stock_quantity',
          field_value_number: parseInt(formData.initial_stock),
          field_type: 'number',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.STOCK.v1'
        })
      }

      if (formData.reorder_level) {
        dynamicFields.push({
          field_name: 'reorder_level',
          field_value_number: parseInt(formData.reorder_level),
          field_type: 'number',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.REORDER_LEVEL.v1'
        })
      }

      if (formData.supplier) {
        dynamicFields.push({
          field_name: 'primary_supplier',
          field_value_text: formData.supplier,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.SUPPLIER.v1'
        })
      }

      if (formData.location) {
        dynamicFields.push({
          field_name: 'storage_location',
          field_value_text: formData.location,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.LOCATION.v1'
        })
      }

      // Detail fields
      if (formData.category) {
        dynamicFields.push({
          field_name: 'category',
          field_value_text: formData.category,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.CATEGORY.v1'
        })
      }

      if (formData.brand) {
        dynamicFields.push({
          field_name: 'brand',
          field_value_text: formData.brand,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.BRAND.v1'
        })
      }

      if (formData.weight) {
        dynamicFields.push({
          field_name: 'weight_kg',
          field_value_number: parseFloat(formData.weight),
          field_type: 'number',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.WEIGHT.v1'
        })
      }

      if (formData.dimensions) {
        dynamicFields.push({
          field_name: 'dimensions',
          field_value_text: formData.dimensions,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.DIMENSIONS.v1'
        })
      }

      if (formData.tags) {
        dynamicFields.push({
          field_name: 'tags',
          field_value_text: formData.tags,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.TAGS.v1'
        })
      }

      if (formData.notes) {
        dynamicFields.push({
          field_name: 'internal_notes',
          field_value_text: formData.notes,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.PRODUCT.FIELD.NOTES.v1'
        })
      }

      // TODO: In real implementation, call the Universal Masterdata API
      // const response = await apiV2.post('entities', {
      //   operation: 'CREATE',
      //   entity_data: entityData,
      //   dynamic_fields: dynamicFields,
      //   organization_id: organization.id
      // })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Product created successfully!')
      console.log('Product created:', { entityData, dynamicFields })
      
      // Navigate back to product list
      router.push('/apps/retail/pos/products')
      
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Failed to create product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultValues = {
    currency: 'USD',
    tax_rate: '0',
    initial_stock: '0',
    reorder_level: '10'
  }

  return (
    <HERAMasterDataTemplate
      entityType="PRODUCT"
      entityLabel="Product"
      sections={productSections}
      fields={productFields}
      backUrl="/apps/retail/pos/products"
      onSubmit={handleSubmit}
      defaultValues={defaultValues}
      className="min-h-screen bg-gradient-to-br from-black via-charcoal to-black"
    />
  )
}