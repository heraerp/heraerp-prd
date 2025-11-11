'use client';

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Package } from 'lucide-react'
import { useSecuredSalonContext } from '../../SecuredSalonProvider'
import { useHeraProducts } from '@/hooks/useHeraProducts'
import { useHeraProductCategories } from '@/hooks/useHeraProductCategories'
import { Product } from '@/types/salon-product'
import { useToast } from '@/components/ui/use-toast'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

function ProductDetailContent() {
  const router = useRouter()
  const params = useParams()
  const { organizationId } = useSecuredSalonContext()
  const { toast } = useToast()

  const productId = params.id as string
  const isNewProduct = productId === 'new'

  const { products, createProduct, updateProduct, isCreating, isUpdating } = useHeraProducts({
    organizationId
  })

  const { categories } = useHeraProductCategories({
    organizationId
  })

  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    description: '',
    category: '',
    price: '',
    cost: '',
    qty_on_hand: '',
    barcode: '',
    sku: '',
    brand: '',
    size: '',
    supplier_name: '',
    currency: 'AED',
    requires_inventory: true,
    status: 'active'
  })

  const [isSaving, setIsSaving] = useState(false)

  // Load product data if editing
  useEffect(() => {
    if (!isNewProduct && products.length > 0 && organizationId) {
      const product = products.find(p => p.id === productId)
      if (product) {
        // Load dynamic data for the product
        const loadDynamicData = async () => {
          try {
            const response = await fetch(
              `/api/universal/dynamic-data?p_organization_id=${organizationId}&p_entity_id=${productId}`,
              { cache: 'no-store' }
            )
            const json = await response.json()
            const dynamicFields = Array.isArray(json?.data) ? json.data : []

            // Map dynamic fields
            const fieldMap: Record<string, any> = {}
            dynamicFields.forEach((field: any) => {
              const value =
                field.field_value_number ??
                field.field_value_text ??
                field.field_value_boolean ??
                field.field_value_json ??
                null
              fieldMap[field.field_name] = value
            })

            setFormData({
              entity_name: product.entity_name || '',
              entity_code: product.entity_code || '',
              description: product.description || fieldMap.description || '',
              category: product.category || fieldMap.category || '',
              price: (product.price || fieldMap.price || fieldMap.selling_price || '').toString(),
              cost: (fieldMap.cost || '').toString(),
              qty_on_hand: (product.qty_on_hand || fieldMap.qty_on_hand || '0').toString(),
              barcode: fieldMap.barcode || '',
              sku: fieldMap.sku || '',
              brand: fieldMap.brand || '',
              size: fieldMap.size || '',
              supplier_name: fieldMap.supplier_name || '',
              currency: product.currency || 'AED',
              requires_inventory: product.requires_inventory !== false,
              status: product.status || 'active'
            })
          } catch (error) {
            console.error('[Product Detail] Failed to load dynamic data:', error)
            // Fallback to basic product data
            setFormData({
              entity_name: product.entity_name || '',
              entity_code: product.entity_code || '',
              description: product.description || '',
              category: product.category || '',
              price: product.price?.toString() || '',
              cost: '',
              qty_on_hand: product.qty_on_hand?.toString() || '0',
              barcode: '',
              sku: '',
              brand: '',
              size: '',
              supplier_name: '',
              currency: product.currency || 'AED',
              requires_inventory: product.requires_inventory !== false,
              status: product.status || 'active'
            })
          }
        }

        loadDynamicData()
      }
    }
  }, [isNewProduct, productId, products, organizationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.entity_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Product name is required',
        variant: 'destructive'
      })
      return
    }

    // Validate prices
    const costPrice = parseFloat(formData.cost) || 0
    const sellingPrice = parseFloat(formData.price) || 0

    if (costPrice < 0 || sellingPrice < 0) {
      toast({
        title: 'Validation Error',
        description: 'Prices must be non-negative',
        variant: 'destructive'
      })
      return
    }

    // Warning if selling price is below cost (but don't block submission)
    if (sellingPrice > 0 && sellingPrice < costPrice) {
      toast({
        title: 'Warning: Selling price is below cost',
        description: 'Saving anyway...',
        duration: 2000
      })
    }

    setIsSaving(true)

    try {
      const productData = {
        name: formData.entity_name,
        code: formData.entity_code,
        description: formData.description,
        category: formData.category,
        price: formData.price ? parseFloat(formData.price) : null,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        selling_price: formData.price ? parseFloat(formData.price) : 0,
        qty_on_hand: formData.qty_on_hand ? parseInt(formData.qty_on_hand) : 0,
        barcode: formData.barcode,
        sku: formData.sku,
        brand: formData.brand,
        size: formData.size,
        supplier_name: formData.supplier_name,
        currency: formData.currency,
        requires_inventory: formData.requires_inventory,
        status: formData.status
      }

      if (isNewProduct) {
        await createProduct(productData)
        toast({
          title: 'Product created',
          description: `${formData.entity_name} has been created successfully`
        })
      } else {
        await updateProduct(productId, productData)
        toast({
          title: 'Product updated',
          description: `${formData.entity_name} has been updated successfully`
        })
      }

      router.push('/salon/products')
    } catch (error: any) {
      toast({
        title: isNewProduct ? 'Failed to create product' : 'Failed to update product',
        description: error.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!organizationId) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: COLORS.black }}
      >
        <div style={{ color: COLORS.lightText }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.black }}>
      {/* Header */}
      <div
        className="border-b"
        style={{ backgroundColor: COLORS.charcoal, borderColor: COLORS.bronze + '33' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/salon/products')}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  color: COLORS.champagne
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: COLORS.gold + '20',
                    border: `1px solid ${COLORS.gold}40`
                  }}
                >
                  <Package className="w-5 h-5" style={{ color: COLORS.gold }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
                    {isNewProduct ? 'New Product' : 'Edit Product'}
                  </h1>
                  <p className="text-sm" style={{ color: COLORS.lightText }}>
                    {isNewProduct ? 'Create a new product' : 'Update product details'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSaving || isCreating || isUpdating}
              className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              style={{
                backgroundColor: COLORS.gold,
                color: COLORS.black
              }}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div
            className="rounded-lg border p-6"
            style={{
              backgroundColor: COLORS.charcoal + 'F0',
              borderColor: COLORS.bronze + '33'
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.champagne }}>
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.entity_name}
                  onChange={e => handleChange('entity_name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.bronze + '33',
                    color: COLORS.champagne
                  }}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  Product Code
                </label>
                <input
                  type="text"
                  value={formData.entity_code}
                  onChange={e => handleChange('entity_code', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.bronze + '33',
                    color: COLORS.champagne
                  }}
                  placeholder="Enter product code"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.bronze + '33',
                    color: COLORS.champagne
                  }}
                  placeholder="Enter product description"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={e => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.bronze + '33',
                    color: COLORS.champagne
                  }}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.entity_name}>
                      {cat.entity_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={e => handleChange('brand', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.bronze + '33',
                    color: COLORS.champagne
                  }}
                  placeholder="Enter brand name"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div
            className="rounded-lg border p-6"
            style={{
              backgroundColor: COLORS.charcoal + 'F0',
              borderColor: COLORS.bronze + '33'
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.champagne }}>
              Pricing & Inventory
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  Cost Price
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={e => handleChange('cost', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: COLORS.charcoalLight,
                      borderColor: COLORS.bronze + '33',
                      color: COLORS.champagne
                    }}
                    placeholder="0.00"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: COLORS.lightText }}
                  >
                    {formData.currency}
                  </span>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  Selling Price
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={e => handleChange('price', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: COLORS.charcoalLight,
                      borderColor: COLORS.bronze + '33',
                      color: COLORS.champagne
                    }}
                    placeholder="0.00"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: COLORS.lightText }}
                  >
                    {formData.currency}
                  </span>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  Profit Margin
                </label>
                <div
                  className="w-full px-3 py-2 rounded-lg border flex items-center justify-between"
                  style={{
                    backgroundColor: COLORS.charcoalDark,
                    borderColor: COLORS.bronze + '33',
                    color: COLORS.gold
                  }}
                >
                  <span className="font-semibold">
                    {(() => {
                      const cost = parseFloat(formData.cost) || 0
                      const price = parseFloat(formData.price) || 0
                      if (price === 0) return '0%'
                      const margin = (((price - cost) / price) * 100).toFixed(1)
                      return `${margin}%`
                    })()}
                  </span>
                  <span className="text-xs" style={{ color: COLORS.lightText }}>
                    {(() => {
                      const cost = parseFloat(formData.cost) || 0
                      const price = parseFloat(formData.price) || 0
                      const profit = price - cost
                      return `${formData.currency} ${profit.toFixed(2)}`
                    })()}
                  </span>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  Quantity on Hand
                </label>
                <input
                  type="number"
                  value={formData.qty_on_hand}
                  onChange={e => handleChange('qty_on_hand', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.bronze + '33',
                    color: COLORS.champagne
                  }}
                  placeholder="0"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={e => handleChange('sku', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.bronze + '33',
                    color: COLORS.champagne
                  }}
                  placeholder="Enter SKU"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  Barcode
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={e => handleChange('barcode', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.bronze + '33',
                    color: COLORS.champagne
                  }}
                  placeholder="Enter barcode"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  Size
                </label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={e => handleChange('size', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.bronze + '33',
                    color: COLORS.champagne
                  }}
                  placeholder="Enter size"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requires_inventory}
                  onChange={e => handleChange('requires_inventory', e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{
                    accentColor: COLORS.gold
                  }}
                />
                <span className="text-sm" style={{ color: COLORS.lightText }}>
                  Track inventory for this product
                </span>
              </label>
            </div>
          </div>

          {/* Supplier Information */}
          <div
            className="rounded-lg border p-6"
            style={{
              backgroundColor: COLORS.charcoal + 'F0',
              borderColor: COLORS.bronze + '33'
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.champagne }}>
              Supplier Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.lightText }}
                >
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={formData.supplier_name}
                  onChange={e => handleChange('supplier_name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.bronze + '33',
                    color: COLORS.champagne
                  }}
                  placeholder="Enter supplier name"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  return <ProductDetailContent />
}
