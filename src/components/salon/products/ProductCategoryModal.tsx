'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ProductCategory, ProductCategoryFormValues } from '@/types/salon-product-category'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tag, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface ProductCategoryModalProps {
  open: boolean
  onClose: () => void
  category?: ProductCategory | null
  onSave: (data: ProductCategoryFormValues) => Promise<void>
}

// Icon options for categories
const ICON_OPTIONS = [
  { value: 'Tag', label: 'Tag' },
  { value: 'Scissors', label: 'Scissors' },
  { value: 'Sparkles', label: 'Sparkles' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Star', label: 'Star' },
  { value: 'Crown', label: 'Crown' },
  { value: 'Palette', label: 'Palette' },
  { value: 'Wand2', label: 'Wand' },
  { value: 'Flower2', label: 'Flower' },
  { value: 'Gem', label: 'Gem' }
]

// Color options with salon luxe palette
const COLOR_OPTIONS = [
  { value: '#D4AF37', label: 'Gold', color: '#D4AF37' },
  { value: '#d946ef', label: 'Purple', color: '#d946ef' },
  { value: '#ec4899', label: 'Pink', color: '#ec4899' },
  { value: '#f59e0b', label: 'Amber', color: '#f59e0b' },
  { value: '#0F6F5C', label: 'Emerald', color: '#0F6F5C' },
  { value: '#B794F4', label: 'Plum', color: '#B794F4' },
  { value: '#E8B4B8', label: 'Rose', color: '#E8B4B8' },
  { value: '#8C7853', label: 'Bronze', color: '#8C7853' },
  { value: '#F5E6C8', label: 'Champagne', color: '#F5E6C8' }
]

// Form validation schema
const CategoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sort_order: z.number().int().min(0).optional()
})

export function ProductCategoryModal({
  open,
  onClose,
  category,
  onSave
}: ProductCategoryModalProps) {
  const { toast } = useToast()
  const form = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      color: '#D4AF37',
      icon: 'Tag',
      sort_order: 0
    }
  })

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.entity_name || '',
        code: category.entity_code || '',
        description: category.description || '',
        color: category.color || '#D4AF37',
        icon: category.icon || 'Tag',
        sort_order: category.sort_order || 0
      })
    } else {
      form.reset({
        name: '',
        code: '',
        description: '',
        color: '#D4AF37',
        icon: 'Tag',
        sort_order: 0
      })
    }
  }, [category, form])

  const handleSubmit = async (data: ProductCategoryFormValues) => {
    try {
      await onSave(data)

      // Success toast
      toast({
        title: category ? 'Category Updated' : 'Category Created',
        description: category
          ? `${data.name} has been updated successfully.`
          : `${data.name} has been created successfully.`,
        variant: 'default'
      })

      form.reset()
      onClose()
    } catch (error) {
      console.error('Category save error:', error)

      // Error toast
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save category. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const selectedColor = form.watch('color')

  return (
    <SalonLuxeModal
      open={open}
      onClose={handleClose}
      title={category ? 'Edit Category' : 'Create Category'}
      description={category ? 'Update category information' : 'Add a new product category'}
      icon={<Tag className="w-6 h-6" />}
      size="lg"
      footer={
        <div className="flex items-center gap-3 w-full justify-end">
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
            {form.formState.isSubmitting
              ? category
                ? 'Updating...'
                : 'Creating...'
              : category
                ? 'Update Category'
                : 'Create Category'}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
            {/* Basic Information */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: SALON_LUXE_COLORS.charcoal.lighter + '50',
                borderColor: '#8C7853' + '20'
              }}
            >
              <h3 className="font-medium mb-4" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                Basic Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Hair Services"
                          className="transition-all focus:ring-2 focus:ring-gold-500/20"
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
                      <FormLabel>Category Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Auto-generated if empty"
                          className="transition-all focus:ring-2 focus:ring-gold-500/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter category description..."
                          className="min-h-[80px] transition-all focus:ring-2 focus:ring-gold-500/20 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Appearance Settings */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: SALON_LUXE_COLORS.charcoal.lighter + '50',
                borderColor: '#8C7853' + '20'
              }}
            >
              <h3 className="font-medium mb-4" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                Appearance
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select value={field.value || '#D4AF37'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="transition-all focus:ring-2 focus:ring-gold-500/20 hera-select-trigger">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{
                                  backgroundColor: selectedColor || '#D4AF37',
                                  borderColor: SALON_LUXE_COLORS.gold.base + '60'
                                }}
                              />
                              <SelectValue placeholder="Select color" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="hera-select-content">
                          {COLOR_OPTIONS.map(option => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="hera-select-item"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full border"
                                  style={{
                                    backgroundColor: option.color,
                                    borderColor: SALON_LUXE_COLORS.gold.base + '60'
                                  }}
                                />
                                {option.label}
                              </div>
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
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <Select value={field.value || 'Tag'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="transition-all focus:ring-2 focus:ring-gold-500/20 hera-select-trigger">
                            <SelectValue placeholder="Select icon" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="hera-select-content">
                          {ICON_OPTIONS.map(option => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="hera-select-item"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          className="transition-all focus:ring-2 focus:ring-gold-500/20"
                          onChange={e => {
                            const value = e.target.value
                            field.onChange(value === '' ? 0 : parseInt(value))
                          }}
                          value={field.value ?? 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
    </SalonLuxeModal>
  )
}
