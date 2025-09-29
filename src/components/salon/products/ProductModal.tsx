'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Product, ProductForm, ProductFormSchema } from '@/types/salon-product'
import { useCategoriesPlaybook } from '@/hooks/useCategoriesPlaybook'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
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
import { Package, X } from 'lucide-react'

interface ProductModalProps {
  open: boolean
  onClose: () => void
  product?: Product | null
  onSave: (data: ProductForm) => Promise<void>
}

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

export function ProductModal({ open, onClose, product, onSave }: ProductModalProps) {
  const { organization } = useHERAAuth()
  const organizationId = organization?.id || ''

  // Fetch categories for dropdown
  const { categories: categoryList } = useCategoriesPlaybook({
    organizationId,
    includeArchived: false
  })
  const categories = categoryList.map(cat => cat.entity_name)

  const form = useForm<ProductForm>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: '',
      code: '',
      category: '',
      price: undefined,
      currency: 'AED',
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
        price: product.price || undefined,
        currency: product.currency || 'AED',
        description: product.description || '',
        requires_inventory: product.requires_inventory || false
      })
    } else {
      form.reset({
        name: '',
        code: '',
        category: '',
        price: undefined,
        currency: 'AED',
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
      // Error handling is done in the parent component
      console.error('Product save error:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: COLORS.charcoal,
          border: `1px solid ${COLORS.bronze}40`,
          boxShadow: '0 20px 30px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header */}
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
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
                <DialogTitle className="text-xl font-semibold" style={{ color: COLORS.champagne }}>
                  {product ? 'Edit Product' : 'Create Product'}
                </DialogTitle>
                <p className="text-sm mt-1" style={{ color: COLORS.lightText }}>
                  {product ? 'Update product information' : 'Add a new product to your inventory'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.charcoalLight + '50',
                borderColor: COLORS.bronze + '20'
              }}
            >
              <h3 className="font-medium mb-4" style={{ color: COLORS.champagne }}>
                Basic Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: COLORS.lightText }}>Product Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter product name"
                          className="bg-background/50 border-border"
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
                      <FormLabel style={{ color: COLORS.lightText }}>Product Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Auto-generated if empty"
                          className="bg-background/50 border-border"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: COLORS.lightText }}>Category</FormLabel>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-border">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No category</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: COLORS.lightText }}>Price (AED)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="bg-background/50 border-border"
                          onChange={e => {
                            const value = e.target.value
                            field.onChange(value === '' ? undefined : parseFloat(value))
                          }}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Description */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.charcoalLight + '50',
                borderColor: COLORS.bronze + '20'
              }}
            >
              <h3 className="font-medium mb-4" style={{ color: COLORS.champagne }}>
                Description
              </h3>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter product description..."
                        className="bg-background/50 border-border min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Inventory Settings */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.charcoalLight + '50',
                borderColor: COLORS.bronze + '20'
              }}
            >
              <h3 className="font-medium mb-4" style={{ color: COLORS.champagne }}>
                Inventory Settings
              </h3>

              <FormField
                control={form.control}
                name="requires_inventory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel style={{ color: COLORS.lightText }}>Track Inventory</FormLabel>
                      <p className="text-sm" style={{ color: COLORS.lightText }}>
                        Enable stock tracking for this product
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-border text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black,
                  border: 'none'
                }}
                className="hover:opacity-90 transition-opacity"
              >
                {form.formState.isSubmitting
                  ? product
                    ? 'Updating...'
                    : 'Creating...'
                  : product
                    ? 'Update Product'
                    : 'Create Product'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
