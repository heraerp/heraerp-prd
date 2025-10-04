'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Product, ProductForm, ProductFormSchema } from '@/types/salon-product'
import { useHeraProductCategories } from '@/hooks/useHeraProductCategories'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  X,
  Sparkles,
  DollarSign,
  Tag,
  Box,
  TrendingUp,
  AlertCircle,
  BarChart3
} from 'lucide-react'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

interface ProductModalProps {
  open: boolean
  onClose: () => void
  product?: Product | null
  onSave: (data: ProductForm) => Promise<void>
}

export function ProductModal({ open, onClose, product, onSave }: ProductModalProps) {
  const { organizationId } = useSecuredSalonContext()

  // Fetch product categories for dropdown
  const { categories: categoryList, isLoading: categoriesLoading } = useHeraProductCategories({
    organizationId,
    includeArchived: false
  })

  console.log('[ProductModal] Categories received:', {
    count: categoryList?.length || 0,
    isLoading: categoriesLoading,
    organizationId,
    sample: categoryList?.[0]
  })

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
      stock_level: undefined,
      reorder_level: undefined,
      description: '',
      requires_inventory: false
    }
  })

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.entity_name || '',
        code: product.entity_code || '',
        category: product.category || '',
        // Check both field name conventions: price_cost (storage) and cost_price (UI)
        cost_price: product.price_cost || product.cost_price || undefined,
        selling_price: product.price_market || product.selling_price || product.price || undefined,
        stock_level:
          product.stock_quantity || product.stock_level || product.qty_on_hand || undefined,
        reorder_level: product.reorder_level || undefined,
        description: product.description || '',
        requires_inventory: product.requires_inventory || false
      })
    } else {
      form.reset({
        name: '',
        code: '',
        category: '',
        cost_price: undefined,
        selling_price: undefined,
        stock_level: undefined,
        reorder_level: undefined,
        description: '',
        requires_inventory: false
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

  const stockLevel = form.watch('stock_level')
  const reorderLevel = form.watch('reorder_level')
  const needsReorder =
    stockLevel !== undefined && reorderLevel !== undefined && stockLevel <= reorderLevel

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0"
        aria-describedby={undefined}
        style={{
          backgroundColor: COLORS.black,
          border: `1px solid ${COLORS.gold}30`,
          boxShadow: `0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px ${COLORS.gold}20`,
          borderRadius: '16px'
        }}
      >
        {/* Luxe Header with Gradient */}
        <div
          className="relative px-8 py-6"
          style={{
            background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.black} 100%)`,
            borderBottom: `1px solid ${COLORS.bronze}30`
          }}
        >
          {/* Decorative Gold Accent Line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`
            }}
          />

          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Luxe Icon Badge */}
                <div
                  className="relative w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}10 100%)`,
                    border: `2px solid ${COLORS.gold}50`,
                    boxShadow: `0 8px 16px ${COLORS.gold}20`
                  }}
                >
                  <Package className="w-7 h-7" style={{ color: COLORS.gold }} />

                  {/* Sparkle Effect */}
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: COLORS.gold }}
                  />
                </div>

                <div className="space-y-1.5">
                  <DialogTitle
                    className="text-2xl font-bold tracking-tight"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {product ? 'Edit Product' : 'Create New Product'}
                  </DialogTitle>
                  <p className="text-sm" style={{ color: COLORS.lightText, opacity: 0.8 }}>
                    {product
                      ? 'Update product details, pricing and inventory'
                      : 'Add a premium product with complete financial tracking'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 transition-all duration-200 hover:bg-muted/50"
                style={{ color: COLORS.lightText }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6" style={{ backgroundColor: COLORS.black }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm"
                style={{
                  backgroundColor: COLORS.charcoalDark + 'E6',
                  borderColor: COLORS.bronze + '30',
                  boxShadow: `0 4px 12px ${COLORS.black}40`
                }}
              >
                {/* Section Header with Icon */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                  <h3
                    className="text-lg font-semibold tracking-wide"
                    style={{ color: COLORS.champagne }}
                  >
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-sm font-medium tracking-wide"
                          style={{ color: COLORS.champagne }}
                        >
                          Product Name <span style={{ color: COLORS.gold }}>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Premium Shampoo"
                            className="h-11 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                            style={
                              {
                                backgroundColor: COLORS.charcoalLight + '80',
                                borderColor: COLORS.bronze + '40',
                                color: COLORS.champagne,
                                '--tw-ring-color': COLORS.gold + '60'
                              } as React.CSSProperties
                            }
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
                        <FormLabel
                          className="text-sm font-medium tracking-wide"
                          style={{ color: COLORS.champagne }}
                        >
                          Product Code / SKU
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Auto-generated if empty"
                            className="h-11 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                            style={
                              {
                                backgroundColor: COLORS.charcoalLight + '80',
                                borderColor: COLORS.bronze + '40',
                                color: COLORS.champagne,
                                '--tw-ring-color': COLORS.gold + '60'
                              } as React.CSSProperties
                            }
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
                        <FormLabel
                          className="text-sm font-medium tracking-wide flex items-center gap-2"
                          style={{ color: COLORS.champagne }}
                        >
                          <Tag className="w-4 h-4" style={{ color: COLORS.gold }} />
                          Category
                        </FormLabel>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          disabled={categoriesLoading}
                        >
                          <FormControl>
                            <SelectTrigger
                              className="h-11 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                              aria-describedby={undefined}
                              style={
                                {
                                  backgroundColor: COLORS.charcoalLight + '80',
                                  borderColor: COLORS.bronze + '40',
                                  color: COLORS.champagne,
                                  '--tw-ring-color': COLORS.gold + '60'
                                } as React.CSSProperties
                              }
                            >
                              <SelectValue
                                placeholder={categoriesLoading ? 'Loading...' : 'Select category'}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryOptions.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                No categories found
                              </div>
                            ) : (
                              categoryOptions.map(cat => (
                                <SelectItem key={cat.id} value={cat.entity_name}>
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

              {/* Financial Management Section */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm"
                style={{
                  backgroundColor: COLORS.charcoalDark + 'E6',
                  borderColor: COLORS.emerald + '30',
                  boxShadow: `0 4px 12px ${COLORS.black}40`
                }}
              >
                {/* Section Header with Icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1 h-6 rounded-full"
                      style={{ backgroundColor: COLORS.emerald }}
                    />
                    <h3
                      className="text-lg font-semibold tracking-wide"
                      style={{ color: COLORS.champagne }}
                    >
                      Financial Management
                    </h3>
                  </div>
                  {margin !== null && (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{
                        backgroundColor:
                          parseFloat(margin) >= 30 ? COLORS.emerald + '20' : COLORS.gold + '20',
                        border: `1px solid ${parseFloat(margin) >= 30 ? COLORS.emerald : COLORS.gold}40`
                      }}
                    >
                      <TrendingUp
                        className="w-4 h-4"
                        style={{ color: parseFloat(margin) >= 30 ? COLORS.emerald : COLORS.gold }}
                      />
                      <span className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
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
                          style={{ color: COLORS.champagne }}
                        >
                          <DollarSign className="w-4 h-4" style={{ color: COLORS.bronze }} />
                          Cost Price
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold"
                              style={{ color: COLORS.bronze }}
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
                                  backgroundColor: COLORS.charcoalLight + '80',
                                  borderColor: COLORS.bronze + '40',
                                  color: COLORS.champagne,
                                  '--tw-ring-color': COLORS.emerald + '60'
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
                          style={{ color: COLORS.bronze, opacity: 0.7 }}
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
                          style={{ color: COLORS.champagne }}
                        >
                          <DollarSign className="w-4 h-4" style={{ color: COLORS.gold }} />
                          Selling Price
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold"
                              style={{ color: COLORS.gold }}
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
                                  backgroundColor: COLORS.charcoalLight + '80',
                                  borderColor: COLORS.gold + '40',
                                  color: COLORS.champagne,
                                  '--tw-ring-color': COLORS.emerald + '60'
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
                          style={{ color: COLORS.gold, opacity: 0.7 }}
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
                        style={{ color: COLORS.champagne, opacity: 0.9 }}
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

              {/* Inventory Management Section */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm"
                style={{
                  backgroundColor: COLORS.charcoalDark + 'E6',
                  borderColor: needsReorder ? '#ef4444' + '40' : COLORS.bronze + '30',
                  boxShadow: `0 4px 12px ${COLORS.black}40`
                }}
              >
                {/* Section Header with Icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1 h-6 rounded-full"
                      style={{ backgroundColor: needsReorder ? '#ef4444' : COLORS.gold }}
                    />
                    <h3
                      className="text-lg font-semibold tracking-wide"
                      style={{ color: COLORS.champagne }}
                    >
                      Inventory Management
                    </h3>
                  </div>
                  {needsReorder && (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg animate-pulse"
                      style={{
                        backgroundColor: '#ef444420',
                        border: '1px solid #ef444440'
                      }}
                    >
                      <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                      <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                        Low Stock Alert
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="stock_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-sm font-medium tracking-wide flex items-center gap-2"
                          style={{ color: COLORS.champagne }}
                        >
                          <Box className="w-4 h-4" style={{ color: COLORS.gold }} />
                          Current Stock Level
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="number"
                              placeholder="0"
                              className="h-12 rounded-lg pr-16 text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                              style={
                                {
                                  backgroundColor: COLORS.charcoalLight + '80',
                                  borderColor: needsReorder ? '#ef444440' : COLORS.bronze + '40',
                                  color: COLORS.champagne,
                                  '--tw-ring-color': COLORS.gold + '60'
                                } as React.CSSProperties
                              }
                              onChange={e => {
                                const value = e.target.value
                                field.onChange(value === '' ? undefined : parseInt(value))
                              }}
                              value={field.value ?? ''}
                            />
                            <span
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                              style={{ color: COLORS.bronze }}
                            >
                              units
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription
                          className="text-xs"
                          style={{ color: COLORS.bronze, opacity: 0.7 }}
                        >
                          Available inventory quantity
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reorder_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-sm font-medium tracking-wide flex items-center gap-2"
                          style={{ color: COLORS.champagne }}
                        >
                          <BarChart3 className="w-4 h-4" style={{ color: COLORS.bronze }} />
                          Reorder Level
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="number"
                              placeholder="0"
                              className="h-12 rounded-lg pr-16 text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                              style={
                                {
                                  backgroundColor: COLORS.charcoalLight + '80',
                                  borderColor: COLORS.bronze + '40',
                                  color: COLORS.champagne,
                                  '--tw-ring-color': COLORS.gold + '60'
                                } as React.CSSProperties
                              }
                              onChange={e => {
                                const value = e.target.value
                                field.onChange(value === '' ? undefined : parseInt(value))
                              }}
                              value={field.value ?? ''}
                            />
                            <span
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                              style={{ color: COLORS.bronze }}
                            >
                              units
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription
                          className="text-xs"
                          style={{ color: COLORS.bronze, opacity: 0.7 }}
                        >
                          Minimum stock before reorder
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-6">
                  <FormField
                    control={form.control}
                    name="requires_inventory"
                    render={({ field }) => (
                      <FormItem
                        className="flex flex-row items-center justify-between rounded-xl border p-5"
                        style={{
                          backgroundColor: COLORS.charcoalLight + '50',
                          borderColor: COLORS.bronze + '40'
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: COLORS.gold + '20',
                              border: `1px solid ${COLORS.gold}40`
                            }}
                          >
                            <Box className="w-5 h-5" style={{ color: COLORS.gold }} />
                          </div>
                          <div className="space-y-0.5">
                            <FormLabel
                              className="text-sm font-semibold cursor-pointer"
                              style={{ color: COLORS.champagne }}
                            >
                              Track Inventory
                            </FormLabel>
                            <p
                              className="text-xs"
                              style={{ color: COLORS.lightText, opacity: 0.7 }}
                            >
                              Enable stock tracking and low stock alerts
                            </p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            style={{
                              backgroundColor: field.value ? COLORS.gold : COLORS.bronze + '40'
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Description Section */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm"
                style={{
                  backgroundColor: COLORS.charcoalDark + 'E6',
                  borderColor: COLORS.bronze + '30',
                  boxShadow: `0 4px 12px ${COLORS.black}40`
                }}
              >
                {/* Section Header with Icon */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                  <h3
                    className="text-lg font-semibold tracking-wide"
                    style={{ color: COLORS.champagne }}
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
                              backgroundColor: COLORS.charcoalLight + '80',
                              borderColor: COLORS.bronze + '40',
                              color: COLORS.champagne,
                              '--tw-ring-color': COLORS.gold + '60'
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
        </div>

        {/* Luxe Footer with Actions */}
        <div
          className="px-8 py-5 border-t"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: COLORS.bronze + '30'
          }}
        >
          <div className="flex items-center justify-between">
            {/* Helper Text */}
            <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.6 }}>
              <span style={{ color: COLORS.gold }}>*</span> Required fields
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-11 px-6 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: COLORS.bronze + '50',
                  color: COLORS.lightText
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                onClick={form.handleSubmit(handleSubmit)}
                className="h-11 px-8 rounded-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black,
                  border: 'none',
                  boxShadow: `0 4px 12px ${COLORS.gold}30`
                }}
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
