'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ServiceCategory,
  ServiceCategoryFormSchema,
  ServiceCategoryFormValues,
  SERVICE_COLORS
} from '@/types/salon-service'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tag, X } from 'lucide-react'

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

interface ServiceCategoryModalProps {
  open: boolean
  onClose: () => void
  category?: ServiceCategory | null
  onSave: (data: ServiceCategoryFormValues) => Promise<void>
}

export function ServiceCategoryModal({
  open,
  onClose,
  category,
  onSave
}: ServiceCategoryModalProps) {
  const form = useForm<ServiceCategoryFormValues>({
    resolver: zodResolver(ServiceCategoryFormSchema),
    defaultValues: {
      name: '',
      color: SERVICE_COLORS[0].value,
      description: ''
    }
  })

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.entity_name || '',
        color: category.color || SERVICE_COLORS[0].value,
        description: category.description || ''
      })
    } else {
      form.reset({
        name: '',
        color: SERVICE_COLORS[0].value,
        description: ''
      })
    }
  }, [category, form])

  const handleSubmit = async (data: ServiceCategoryFormValues) => {
    try {
      await onSave(data)
      form.reset()
    } catch (error) {
      console.error('Category save error:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
        style={{
          backgroundColor: COLORS.charcoal,
          border: `1px solid ${COLORS.bronze}40`,
          boxShadow: '0 20px 30px rgba(0,0,0,0.3)'
        }}
      >
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
                <p className="text-sm mt-1" style={{ color: COLORS.lightText }}>
                  {category
                    ? 'Update service category information'
                    : 'Add a new service category'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Name Field */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.charcoalLight + '50',
                borderColor: COLORS.bronze + '20'
              }}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: COLORS.lightText }}>Category Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Hair Services, Nail Care"
                        className="bg-background/50 border-border"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Color Picker */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.charcoalLight + '50',
                borderColor: COLORS.bronze + '20'
              }}
            >
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: COLORS.lightText }}>Category Color *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50 border-border">
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICE_COLORS.map(color => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{
                                  backgroundColor: color.value,
                                  borderColor: COLORS.lightText
                                }}
                              />
                              <span>{color.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color Preview */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm" style={{ color: COLORS.lightText }}>
                  Preview:
                </span>
                <div
                  className="px-3 py-1.5 rounded-lg border"
                  style={{
                    backgroundColor: form.watch('color') + '15',
                    borderColor: form.watch('color') + '40',
                    color: COLORS.champagne
                  }}
                >
                  <Tag
                    className="w-3 h-3 inline mr-1.5"
                    style={{ color: form.watch('color') }}
                  />
                  <span className="text-sm">{form.watch('name') || 'Category Name'}</span>
                </div>
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
                        className="bg-background/50 border-border min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
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
