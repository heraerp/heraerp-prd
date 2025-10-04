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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tag, X, Sparkles } from 'lucide-react'

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
        className="max-w-2xl max-h-[92vh] overflow-hidden flex flex-col p-0"
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
                  <Tag className="w-7 h-7" style={{ color: COLORS.gold }} />

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
                    {category ? 'Edit Category' : 'Create New Category'}
                  </DialogTitle>
                  <p className="text-sm" style={{ color: COLORS.lightText, opacity: 0.8 }}>
                    {category
                      ? 'Update service category information'
                      : 'Organize your services with custom categories'}
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
        <div className="flex-1 overflow-y-auto px-8 py-6">
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
                    Category Details
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-sm font-medium tracking-wide"
                        style={{ color: COLORS.champagne }}
                      >
                        Category Name <span style={{ color: COLORS.gold }}>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Hair Services, Nail Care, Spa Treatments"
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

              {/* Color Picker Section */}
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
                    Visual Identity
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-sm font-medium tracking-wide"
                        style={{ color: COLORS.champagne }}
                      >
                        Category Color <span style={{ color: COLORS.gold }}>*</span>
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger
                            className="h-11 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                            style={
                              {
                                backgroundColor: COLORS.charcoalLight + '80',
                                borderColor: COLORS.bronze + '40',
                                color: COLORS.champagne,
                                '--tw-ring-color': COLORS.gold + '60'
                              } as React.CSSProperties
                            }
                          >
                            <SelectValue placeholder="Select a color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SERVICE_COLORS.map(color => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full border-2"
                                  style={{
                                    backgroundColor: color.value,
                                    borderColor: COLORS.gold + '40'
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

                {/* Live Color Preview */}
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" style={{ color: COLORS.gold }} />
                    <span className="text-sm font-medium" style={{ color: COLORS.lightText }}>
                      Live Preview
                    </span>
                  </div>
                  <div
                    className="relative px-6 py-4 rounded-xl border-2 backdrop-blur-sm transition-all duration-300"
                    style={{
                      backgroundColor: form.watch('color') + '10',
                      borderColor: form.watch('color') + '50',
                      boxShadow: `0 4px 16px ${form.watch('color')}30`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300"
                        style={{
                          backgroundColor: form.watch('color') + '20',
                          border: `2px solid ${form.watch('color')}60`
                        }}
                      >
                        <Tag className="w-5 h-5" style={{ color: form.watch('color') }} />
                      </div>
                      <div>
                        <p className="font-semibold text-base" style={{ color: COLORS.champagne }}>
                          {form.watch('name') || 'Category Name'}
                        </p>
                        <p className="text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                          Category preview
                        </p>
                      </div>
                    </div>
                  </div>
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
                    Additional Information
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-sm font-medium tracking-wide"
                        style={{ color: COLORS.champagne }}
                      >
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe this category and what services it includes..."
                          className="min-h-[100px] rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none"
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
                    {category ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {category ? 'Update Category' : 'Create Category'}
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
