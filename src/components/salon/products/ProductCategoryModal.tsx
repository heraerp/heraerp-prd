'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ProductCategory, ProductCategoryFormValues } from '@/types/salon-product-category'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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
import { Tag, X, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface ProductCategoryModalProps {
  open: boolean
  onClose: () => void
  category?: ProductCategory | null
  onSave: (data: ProductCategoryFormValues) => Promise<void>
}

// Salon Luxe Theme Colors
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  purple: '#d946ef',
  pink: '#ec4899',
  amber: '#f59e0b'
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

export function ProductCategoryModal({ open, onClose, category, onSave }: ProductCategoryModalProps) {
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
        description: error instanceof Error
          ? error.message
          : 'Failed to save category. Please try again.',
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
                <Tag className="w-5 h-5" style={{ color: COLORS.gold }} />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold" style={{ color: COLORS.champagne }}>
                  {category ? 'Edit Category' : 'Create Category'}
                </DialogTitle>
                <DialogDescription className="text-sm mt-1" style={{ color: COLORS.lightText }}>
                  {category ? 'Update category information' : 'Add a new product category'}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="hover:bg-white/5 transition-colors"
              style={{ color: COLORS.lightText }}
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
                      <FormLabel style={{ color: COLORS.lightText }}>Category Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Hair Services"
                          className="transition-all focus:ring-2 focus:ring-gold-500/20"
                          style={{
                            backgroundColor: COLORS.charcoalDark + '80',
                            borderColor: COLORS.bronze + '40',
                            color: COLORS.champagne
                          }}
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
                      <FormLabel style={{ color: COLORS.lightText }}>Category Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Auto-generated if empty"
                          className="transition-all focus:ring-2 focus:ring-gold-500/20"
                          style={{
                            backgroundColor: COLORS.charcoalDark + '80',
                            borderColor: COLORS.bronze + '40',
                            color: COLORS.champagne
                          }}
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
                      <FormLabel style={{ color: COLORS.lightText }}>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter category description..."
                          className="min-h-[80px] transition-all focus:ring-2 focus:ring-gold-500/20 resize-none"
                          style={{
                            backgroundColor: COLORS.charcoalDark + '80',
                            borderColor: COLORS.bronze + '40',
                            color: COLORS.champagne
                          }}
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
                backgroundColor: COLORS.charcoalLight + '50',
                borderColor: COLORS.bronze + '20'
              }}
            >
              <h3 className="font-medium mb-4" style={{ color: COLORS.champagne }}>
                Appearance
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: COLORS.lightText }}>Color</FormLabel>
                      <Select value={field.value || '#D4AF37'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger
                            className="transition-all focus:ring-2 focus:ring-gold-500/20"
                            style={{
                              backgroundColor: COLORS.charcoalDark + '80',
                              borderColor: COLORS.bronze + '40',
                              color: COLORS.champagne
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{
                                  backgroundColor: selectedColor || '#D4AF37',
                                  borderColor: COLORS.gold + '60'
                                }}
                              />
                              <SelectValue placeholder="Select color" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="hera-select-content" style={{ backgroundColor: COLORS.charcoal, borderColor: COLORS.bronze + '40' }}>
                          {COLOR_OPTIONS.map(option => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="hera-select-item"
                              style={{ color: COLORS.champagne }}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full border"
                                  style={{
                                    backgroundColor: option.color,
                                    borderColor: COLORS.gold + '60'
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
                      <FormLabel style={{ color: COLORS.lightText }}>Icon</FormLabel>
                      <Select value={field.value || 'Tag'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger
                            className="transition-all focus:ring-2 focus:ring-gold-500/20"
                            style={{
                              backgroundColor: COLORS.charcoalDark + '80',
                              borderColor: COLORS.bronze + '40',
                              color: COLORS.champagne
                            }}
                          >
                            <SelectValue placeholder="Select icon" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="hera-select-content" style={{ backgroundColor: COLORS.charcoal, borderColor: COLORS.bronze + '40' }}>
                          {ICON_OPTIONS.map(option => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="hera-select-item"
                              style={{ color: COLORS.champagne }}
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
                      <FormLabel style={{ color: COLORS.lightText }}>Sort Order</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          className="transition-all focus:ring-2 focus:ring-gold-500/20"
                          style={{
                            backgroundColor: COLORS.charcoalDark + '80',
                            borderColor: COLORS.bronze + '40',
                            color: COLORS.champagne
                          }}
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

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="hover:bg-white/5 transition-all"
                style={{
                  borderColor: COLORS.bronze + '40',
                  color: COLORS.lightText
                }}
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
                  ? category
                    ? 'Updating...'
                    : 'Creating...'
                  : category
                    ? 'Update Category'
                    : 'Create Category'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
