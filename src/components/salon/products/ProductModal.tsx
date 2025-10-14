'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Product, ProductForm, ProductFormSchema } from '@/types/salon-product'
import { useHeraProductCategories } from '@/hooks/useHeraProductCategories'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Package,
  Sparkles,
  DollarSign,
  Tag,
  Box,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Building2,
  MapPin,
  Check,
  Barcode
} from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface ProductModalProps {
  open: boolean
  onClose: () => void
  product?: Product | null
  onSave: (data: ProductForm) => Promise<void>
}

export function ProductModal({ open, onClose, product, onSave }: ProductModalProps) {
  const { organizationId, availableBranches } = useSecuredSalonContext()

  // Fetch product categories for dropdown
  const { categories: categoryList, isLoading: categoriesLoading } = useHeraProductCategories({
    organizationId,
    includeArchived: false
  })

  // console.log('[ProductModal] Categories received:', {
  //   count: categoryList?.length || 0,
  //   isLoading: categoriesLoading,
  //   organizationId,
  //   sample: categoryList?.[0]
  // })

  // Deduplicate categories by ID and sort by name
  const categories = (categoryList || [])
    .filter(cat => cat?.id && cat?.entity_name)
    .reduce(
      (acc, cat) => {
        acc[cat.id] = cat
        return acc
      },
      {} as Record<string, (typeof categoryList)[0]>
    )

  const categoryOptions = Object.values(categories).sort((a, b) =>
    (a.entity_name || '').localeCompare(b.entity_name || '', undefined, { sensitivity: 'base' })
  )

  const form = useForm<ProductForm>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: '',
      code: '',
      category: '',
      cost_price: undefined,
      selling_price: undefined,
      description: '',
      branch_ids: [], // Branch selection support
      barcode_primary: '',
      barcode_type: 'EAN13',
      barcodes_alt: [],
      gtin: ''
    }
  })

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      // Extract branch IDs from STOCK_AT relationships
      const stockAtRels =
        (product as any).relationships?.stock_at ||
        (product as any).relationships?.STOCK_AT ||
        (product as any).relationships?.stockAt
      let branchIds: string[] = []

      if (Array.isArray(stockAtRels)) {
        branchIds = stockAtRels.filter(rel => rel?.to_entity?.id).map(rel => rel.to_entity.id)
      } else if (stockAtRels?.to_entity?.id) {
        branchIds = [stockAtRels.to_entity.id]
      }

      form.reset({
        name: product.entity_name || '',
        code: product.entity_code || '',
        category: product.category || '',
        // Check both field name conventions: price_cost (storage) and cost_price (UI)
        cost_price: product.price_cost || product.cost_price || undefined,
        selling_price: product.price_market || product.selling_price || product.price || undefined,
        description: product.description || '',
        branch_ids: branchIds, // Set branch IDs from relationships
        barcode_primary: (product as any).barcode_primary || '',
        barcode_type: (product as any).barcode_type || 'EAN13',
        barcodes_alt: (product as any).barcodes_alt || [],
        gtin: (product as any).gtin || ''
      })
    } else {
      form.reset({
        name: '',
        code: '',
        category: '',
        cost_price: undefined,
        selling_price: undefined,
        description: '',
        branch_ids: [], // Empty array for new products
        barcode_primary: '',
        barcode_type: 'EAN13',
        barcodes_alt: [],
        gtin: ''
      })
    }
  }, [product, form])

  const handleSubmit = async (data: ProductForm) => {
    try {
      await onSave(data)
      form.reset()
    } catch (error) {
      console.error('Product save error:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // Calculate margin
  const costPrice = form.watch('cost_price')
  const sellingPrice = form.watch('selling_price')
  const margin =
    costPrice && sellingPrice && costPrice > 0
      ? (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1)
      : null

  // Check for negative margin (cost > selling)
  const hasNegativeMargin = costPrice && sellingPrice && costPrice > sellingPrice

  return (
    <SalonLuxeModal
      open={open}
      onClose={handleClose}
      title={product ? 'Edit Product' : 'Create New Product'}
      description={
        product
          ? 'Update product details, pricing and branch availability'
          : 'Add a premium product with pricing and branch availability'
      }
      icon={<Package className="w-7 h-7" />}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-xs" style={{ color: SALON_LUXE_COLORS.text.secondary, opacity: 0.7 }}>
            <span style={{ color: SALON_LUXE_COLORS.gold.base }}>*</span> Required fields
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="outline-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              onClick={form.handleSubmit(handleSubmit)}
              className="primary-button"
            >
              {form.formState.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 rounded-full animate-spin border-t-transparent" />
                  {product ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {product ? 'Update Product' : 'Create Product'}
                </span>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
              {/* Basic Information Section */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm"
                style={{
                  backgroundColor: SALON_LUXE_COLORS.charcoal.dark + 'E6',
                  borderColor: '#8C7853' + '30',
                  boxShadow: `0 4px 12px rgba(0,0,0,0.4)`
                }}
              >
                {/* Section Header with Icon */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: SALON_LUXE_COLORS.gold.base }} />
                  <h3 className="text-lg font-semibold tracking-wide">
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium tracking-wide">
                          Product Name <span style={{ color: SALON_LUXE_COLORS.gold.base }}>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Premium Shampoo"
                            className="h-11 rounded-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium tracking-wide">
                          Product Code / SKU
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Auto-generated if empty"
                            className="h-11 rounded-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-5">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium tracking-wide flex items-center gap-2">
                          <Tag className="w-4 h-4" style={{ color: SALON_LUXE_COLORS.gold.base }} />
                          Category
                        </FormLabel>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          disabled={categoriesLoading}
                        >
                          <FormControl>
                            <SelectTrigger
                              className="h-11 rounded-lg hera-select-trigger"
                              aria-describedby={undefined}
                            >
                              <SelectValue
                                placeholder={categoriesLoading ? 'Loading...' : 'Select category'}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="hera-select-content">
                            {categoryOptions.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                No categories found
                              </div>
                            ) : (
                              categoryOptions.map(cat => (
                                <SelectItem key={cat.id} value={cat.entity_name} className="hera-select-item">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: cat.color }}
                                    />
                                    {cat.entity_name}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Barcode Information Section */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm"
                style={{
                  backgroundColor: SALON_LUXE_COLORS.charcoal.dark + 'E6',
                  borderColor: '#8C7853' + '30',
                  boxShadow: `0 4px 12px rgba(0,0,0,0.4)`
                }}
              >
                {/* Section Header with Icon */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: SALON_LUXE_COLORS.gold.base }} />
                  <h3 className="text-lg font-semibold tracking-wide">
                    Barcode Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="barcode_primary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium tracking-wide flex items-center gap-2">
                          <Barcode className="w-4 h-4" style={{ color: SALON_LUXE_COLORS.gold.base }} />
                          Primary Barcode
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Scan or enter barcode"
                            className="h-11 rounded-lg"
                          />
                        </FormControl>
                        <FormDescription className="text-xs" style={{ color: '#8C7853', opacity: 0.7 }}>
                          Main barcode for product identification
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium tracking-wide">
                          Barcode Type
                        </FormLabel>
                        <Select value={field.value || 'EAN13'} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-lg hera-select-trigger" aria-describedby={undefined}>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="hera-select-content">
                            <SelectItem value="EAN13" className="hera-select-item">EAN-13</SelectItem>
                            <SelectItem value="UPC" className="hera-select-item">UPC</SelectItem>
                            <SelectItem value="CODE128" className="hera-select-item">CODE-128</SelectItem>
                            <SelectItem value="QR" className="hera-select-item">QR Code</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs" style={{ color: '#8C7853', opacity: 0.7 }}>
                          Format of the primary barcode
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-5">
                  <FormField
                    control={form.control}
                    name="gtin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium tracking-wide">
                          GTIN (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="8-14 digits"
                            className="h-11 rounded-lg"
                          />
                        </FormControl>
                        <FormDescription className="text-xs" style={{ color: '#8C7853', opacity: 0.7 }}>
                          Global Trade Item Number for international tracking
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Financial Management Section */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm"
                style={{
                  backgroundColor: SALON_LUXE_COLORS.charcoal.dark + 'E6',
                  borderColor: SALON_LUXE_COLORS.emerald.base + '30',
                  boxShadow: `0 4px 12px ${SALON_LUXE_COLORS.charcoal.dark}40`
                }}
              >
                {/* Section Header with Icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1 h-6 rounded-full"
                      style={{ backgroundColor: SALON_LUXE_COLORS.emerald.base }}
                    />
                    <h3
                      className="text-lg font-semibold tracking-wide"
                      style={{ color: SALON_LUXE_COLORS.champagne.base }}
                    >
                      Financial Management
                    </h3>
                  </div>
                  {margin !== null && (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{
                        backgroundColor:
                          parseFloat(margin) >= 30 ? SALON_LUXE_COLORS.emerald.base + '20' : SALON_LUXE_COLORS.gold.base + '20',
                        border: `1px solid ${parseFloat(margin) >= 30 ? SALON_LUXE_COLORS.emerald.base : SALON_LUXE_COLORS.gold.base}40`
                      }}
                    >
                      <TrendingUp
                        className="w-4 h-4"
                        style={{ color: parseFloat(margin) >= 30 ? SALON_LUXE_COLORS.emerald.base : SALON_LUXE_COLORS.gold.base }}
                      />
                      <span className="text-sm font-semibold" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                        {margin}% Margin
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="cost_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-sm font-medium tracking-wide flex items-center gap-2"
                          style={{ color: SALON_LUXE_COLORS.champagne.base }}
                        >
                          <DollarSign className="w-4 h-4" style={{ color: '#8C7853' }} />
                          Cost Price
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold"
                              style={{ color: '#8C7853' }}
                            >
                              AED
                            </span>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="h-12 rounded-lg pl-20 text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                              style={
                                {
                                  backgroundColor: SALON_LUXE_COLORS.charcoal.lighter + '80',
                                  borderColor: '#8C7853' + '40',
                                  color: SALON_LUXE_COLORS.champagne.base,
                                  '--tw-ring-color': SALON_LUXE_COLORS.emerald.base + '60'
                                } as React.CSSProperties
                              }
                              onChange={e => {
                                const value = e.target.value
                                field.onChange(value === '' ? undefined : parseFloat(value))
                              }}
                              value={field.value || ''}
                            />
                          </div>
                        </FormControl>
                        <FormDescription
                          className="text-xs"
                          style={{ color: '#8C7853', opacity: 0.7 }}
                        >
                          Your purchase/wholesale cost
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="selling_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-sm font-medium tracking-wide flex items-center gap-2"
                          style={{ color: SALON_LUXE_COLORS.champagne.base }}
                        >
                          <DollarSign className="w-4 h-4" style={{ color: SALON_LUXE_COLORS.gold.base }} />
                          Selling Price
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold"
                              style={{ color: SALON_LUXE_COLORS.gold.base }}
                            >
                              AED
                            </span>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="h-12 rounded-lg pl-20 text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                              style={
                                {
                                  backgroundColor: SALON_LUXE_COLORS.charcoal.lighter + '80',
                                  borderColor: SALON_LUXE_COLORS.gold.base + '40',
                                  color: SALON_LUXE_COLORS.champagne.base,
                                  '--tw-ring-color': SALON_LUXE_COLORS.emerald.base + '60'
                                } as React.CSSProperties
                              }
                              onChange={e => {
                                const value = e.target.value
                                field.onChange(value === '' ? undefined : parseFloat(value))
                              }}
                              value={field.value || ''}
                            />
                          </div>
                        </FormControl>
                        <FormDescription
                          className="text-xs"
                          style={{ color: SALON_LUXE_COLORS.gold.base, opacity: 0.7 }}
                        >
                          Customer retail price
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Negative Margin Warning */}
              {hasNegativeMargin && (
                <div
                  className="relative p-5 rounded-xl border backdrop-blur-sm animate-pulse"
                  style={{
                    backgroundColor: '#ef4444' + '15',
                    borderColor: '#ef4444' + '50',
                    boxShadow: `0 4px 12px #ef444420`
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: '#ef4444' + '30',
                        border: `2px solid #ef4444`
                      }}
                    >
                      <AlertCircle className="w-6 h-6" style={{ color: '#ef4444' }} />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <h4 className="text-base font-bold" style={{ color: '#ef4444' }}>
                        Negative Margin Warning
                      </h4>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: SALON_LUXE_COLORS.champagne.base, opacity: 0.9 }}
                      >
                        Cost Price (AED {costPrice?.toFixed(2)}) is higher than Selling Price (AED{' '}
                        {sellingPrice?.toFixed(2)}). This will result in a loss of AED{' '}
                        {(costPrice! - sellingPrice!).toFixed(2)} per unit sold.
                      </p>
                      <p className="text-xs" style={{ color: '#ef4444', opacity: 0.8 }}>
                        Please review your pricing to ensure profitability.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Branch Availability Section */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm"
                style={{
                  backgroundColor: SALON_LUXE_COLORS.charcoal.dark + 'E6',
                  borderColor: '#8C7853' + '30',
                  boxShadow: `0 4px 12px ${SALON_LUXE_COLORS.charcoal.dark}40`
                }}
              >
                {/* Section Header with Icon */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: SALON_LUXE_COLORS.gold.base }} />
                  <h3
                    className="text-lg font-semibold tracking-wide"
                    style={{ color: SALON_LUXE_COLORS.champagne.base }}
                  >
                    Branch Availability
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="branch_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-sm font-medium tracking-wide flex items-center gap-2"
                        style={{ color: SALON_LUXE_COLORS.champagne.base }}
                      >
                        <Building2 className="w-4 h-4" style={{ color: SALON_LUXE_COLORS.gold.base }} />
                        Select Locations Where This Product is Stocked
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {availableBranches.length === 0 ? (
                            <div
                              className="col-span-2 p-4 rounded-lg text-center"
                              style={{
                                backgroundColor: SALON_LUXE_COLORS.charcoal.lighter + '50',
                                border: `1px dashed ${'#8C7853'}40`,
                                color: SALON_LUXE_COLORS.text.primary
                              }}
                            >
                              <Building2
                                className="w-8 h-8 mx-auto mb-2 opacity-50"
                                style={{ color: '#8C7853' }}
                              />
                              <p className="text-sm opacity-70">No branches available</p>
                            </div>
                          ) : (
                            availableBranches.map(branch => {
                              const isSelected = field.value?.includes(branch.id)
                              return (
                                <button
                                  key={branch.id}
                                  type="button"
                                  onClick={() => {
                                    const currentValue = field.value || []
                                    if (isSelected) {
                                      field.onChange(currentValue.filter(id => id !== branch.id))
                                    } else {
                                      field.onChange([...currentValue, branch.id])
                                    }
                                  }}
                                  className="relative group transition-all duration-200 hover:scale-102"
                                  style={{
                                    backgroundColor: isSelected
                                      ? SALON_LUXE_COLORS.charcoal.dark
                                      : SALON_LUXE_COLORS.charcoal.lighter + '50',
                                    border: `2px solid ${isSelected ? SALON_LUXE_COLORS.gold.base : '#8C7853' + '40'}`,
                                    borderRadius: '12px',
                                    padding: '14px',
                                    cursor: 'pointer',
                                    boxShadow: isSelected ? `0 0 20px ${SALON_LUXE_COLORS.gold.base}30` : 'none'
                                  }}
                                >
                                  {/* Selection Indicator */}
                                  {isSelected && (
                                    <div
                                      className="absolute top-2 right-2"
                                      style={{ color: SALON_LUXE_COLORS.gold.base }}
                                    >
                                      <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                        style={{
                                          backgroundColor: SALON_LUXE_COLORS.gold.base,
                                          boxShadow: `0 0 10px ${SALON_LUXE_COLORS.gold.base}60`
                                        }}
                                      >
                                        <Check
                                          className="w-4 h-4"
                                          style={{ color: SALON_LUXE_COLORS.charcoal.dark }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Branch Info */}
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                                      style={{
                                        backgroundColor: isSelected
                                          ? SALON_LUXE_COLORS.gold.base + '20'
                                          : '#8C7853' + '20',
                                        border: `1px solid ${isSelected ? SALON_LUXE_COLORS.gold.base + '40' : '#8C7853' + '30'}`
                                      }}
                                    >
                                      <MapPin
                                        className="w-5 h-5"
                                        style={{
                                          color: isSelected ? SALON_LUXE_COLORS.gold.base : '#8C7853'
                                        }}
                                      />
                                    </div>
                                    <div className="text-left flex-1">
                                      <p
                                        className="text-sm font-semibold line-clamp-1"
                                        style={{
                                          color: isSelected ? SALON_LUXE_COLORS.champagne.base : SALON_LUXE_COLORS.text.primary
                                        }}
                                      >
                                        {branch.entity_name}
                                      </p>
                                      {branch.entity_code && (
                                        <p
                                          className="text-xs opacity-70 mt-0.5"
                                          style={{ color: '#8C7853' }}
                                        >
                                          {branch.entity_code}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              )
                            })
                          )}
                        </div>
                      </FormControl>
                      <FormDescription
                        className="text-xs mt-3"
                        style={{ color: '#8C7853', opacity: 0.7 }}
                      >
                        {field.value && field.value.length > 0
                          ? `Product will be available at ${field.value.length} selected ${field.value.length === 1 ? 'location' : 'locations'}`
                          : 'No branches selected - product will be available at ALL locations by default'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description Section */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm"
                style={{
                  backgroundColor: SALON_LUXE_COLORS.charcoal.dark + 'E6',
                  borderColor: '#8C7853' + '30',
                  boxShadow: `0 4px 12px ${SALON_LUXE_COLORS.charcoal.dark}40`
                }}
              >
                {/* Section Header with Icon */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: SALON_LUXE_COLORS.gold.base }} />
                  <h3
                    className="text-lg font-semibold tracking-wide"
                    style={{ color: SALON_LUXE_COLORS.champagne.base }}
                  >
                    Product Description
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe this product, its features, benefits, and usage instructions..."
                          className="min-h-[120px] rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none"
                          style={
                            {
                              backgroundColor: SALON_LUXE_COLORS.charcoal.lighter + '80',
                              borderColor: '#8C7853' + '40',
                              color: SALON_LUXE_COLORS.champagne.base,
                              '--tw-ring-color': SALON_LUXE_COLORS.gold.base + '60'
                            } as React.CSSProperties
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
        </form>
      </Form>
    </SalonLuxeModal>
  )
}
