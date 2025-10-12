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
                        className="text-sm font-semibold tracking-wide flex items-center gap-2"
                        style={{ color: COLORS.champagne }}
                      >
                        Category Name
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: COLORS.gold + '20',
                            color: COLORS.gold,
                            border: `1px solid ${COLORS.gold}40`
                          }}
                        >
                          <span className="text-base">*</span>
                          Required
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter category name (e.g., Hair Services, Nail Care, Spa Treatments)"
                          maxLength={50}
                          className="h-12 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 text-base"
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
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.6 }}>
                          Choose a clear, descriptive name for your category
                        </p>
                        <span
                          className="text-xs font-medium"
                          style={{
                            color:
                              field.value.length > 40
                                ? COLORS.gold
                                : COLORS.lightText,
                            opacity: 0.6
                          }}
                        >
                          {field.value.length}/50
                        </span>
                      </div>
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
                        className="text-sm font-semibold tracking-wide flex items-center gap-2"
                        style={{ color: COLORS.champagne }}
                      >
                        Category Color
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: COLORS.gold + '20',
                            color: COLORS.gold,
                            border: `1px solid ${COLORS.gold}40`
                          }}
                        >
                          <span className="text-base">*</span>
                          Required
                        </span>
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger
                            className="h-12 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                            style={
                              {
                                backgroundColor: COLORS.charcoalLight + '80',
                                borderColor: COLORS.bronze + '40',
                                color: COLORS.champagne,
                                '--tw-ring-color': COLORS.gold + '60'
                              } as React.CSSProperties
                            }
                          >
                            <SelectValue placeholder="Select a color for this category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="hera-select-content">
                          {SERVICE_COLORS.map(color => (
                            <SelectItem key={color.value} value={color.value} className="hera-select-item">
                              <div className="flex items-center gap-3 py-1">
                                <div
                                  className="w-6 h-6 rounded-lg border-2 shadow-sm transition-transform hover:scale-110"
                                  style={{
                                    backgroundColor: color.value,
                                    borderColor: COLORS.gold + '40'
                                  }}
                                />
                                <span className="font-medium">{color.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs mt-1.5" style={{ color: COLORS.lightText, opacity: 0.6 }}>
                        Select a color to visually identify this category throughout the app
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Live Color Preview */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 animate-pulse" style={{ color: COLORS.gold }} />
                    <span className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                      Live Preview
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: COLORS.gold + '15',
                        color: COLORS.gold
                      }}
                    >
                      Real-time
                    </span>
                  </div>
                  <div
                    className="relative px-6 py-5 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      backgroundColor: form.watch('color') + '10',
                      borderColor: form.watch('color') + '50',
                      boxShadow: `0 8px 24px ${form.watch('color')}25`
                    }}
                  >
                    {/* Glow effect */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-50"
                      style={{
                        background: `radial-gradient(circle at center, ${form.watch('color')}20, transparent 70%)`
                      }}
                    />

                    <div className="relative flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg"
                        style={{
                          backgroundColor: form.watch('color') + '25',
                          border: `2px solid ${form.watch('color')}70`,
                          boxShadow: `0 4px 12px ${form.watch('color')}40`
                        }}
                      >
                        <Tag className="w-7 h-7" style={{ color: form.watch('color') }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg mb-0.5" style={{ color: COLORS.champagne }}>
                          {form.watch('name') || 'Your Category Name'}
                        </p>
                        <p className="text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                          This is how your category will appear in the app
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: COLORS.lightText, opacity: 0.6 }}>
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                    Changes update instantly as you type
                  </p>
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
                        className="text-sm font-semibold tracking-wide flex items-center gap-2"
                        style={{ color: COLORS.champagne }}
                      >
                        Description
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: COLORS.bronze + '20',
                            color: COLORS.bronze,
                            border: `1px solid ${COLORS.bronze}40`
                          }}
                        >
                          Optional
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Add a brief description of this category (e.g., 'Premium hair coloring and styling services for all hair types')"
                          maxLength={200}
                          className="min-h-[110px] rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none"
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
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.6 }}>
                          Help your team understand what services belong in this category
                        </p>
                        <span
                          className="text-xs font-medium"
                          style={{
                            color:
                              field.value && field.value.length > 180
                                ? COLORS.gold
                                : COLORS.lightText,
                            opacity: 0.6
                          }}
                        >
                          {field.value?.length || 0}/200
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Best Practices Tip */}
              <div
                className="relative p-5 rounded-xl border backdrop-blur-sm mt-6"
                style={{
                  backgroundColor: COLORS.gold + '08',
                  borderColor: COLORS.gold + '25',
                  boxShadow: `0 2px 8px ${COLORS.gold}10`
                }}
              >
                <div className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: COLORS.gold + '20',
                      border: `1px solid ${COLORS.gold}40`
                    }}
                  >
                    <Sparkles className="w-5 h-5" style={{ color: COLORS.gold }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold mb-2" style={{ color: COLORS.champagne }}>
                      Best Practices
                    </h4>
                    <ul className="space-y-1.5 text-xs" style={{ color: COLORS.lightText, opacity: 0.8 }}>
                      <li className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: COLORS.gold }} />
                        <span>Use clear, descriptive names that staff can easily understand</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: COLORS.gold }} />
                        <span>Choose distinct colors to help differentiate categories at a glance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: COLORS.gold }} />
                        <span>Group related services together for better organization</span>
                      </li>
                    </ul>
                  </div>
                </div>
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
            <div className="flex items-center gap-4">
              <p className="text-xs flex items-center gap-1.5" style={{ color: COLORS.lightText, opacity: 0.6 }}>
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: COLORS.gold + '20',
                    color: COLORS.gold,
                    border: `1px solid ${COLORS.gold}40`
                  }}
                >
                  <span className="text-base">*</span>
                </span>
                Required fields
              </p>
              {form.formState.errors && Object.keys(form.formState.errors).length > 0 && (
                <p className="text-xs flex items-center gap-1.5" style={{ color: '#FF6B6B' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#FF6B6B' }} />
                  Please fill in all required fields
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={form.formState.isSubmitting}
                className="h-12 px-8 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: COLORS.charcoalLight + '80',
                  borderColor: COLORS.bronze + '50',
                  color: COLORS.lightText
                }}
                onMouseEnter={e => {
                  if (!form.formState.isSubmitting) {
                    e.currentTarget.style.borderColor = COLORS.gold + '60'
                    e.currentTarget.style.backgroundColor = COLORS.charcoalLight
                  }
                }}
                onMouseLeave={e => {
                  if (!form.formState.isSubmitting) {
                    e.currentTarget.style.borderColor = COLORS.bronze + '50'
                    e.currentTarget.style.backgroundColor = COLORS.charcoalLight + '80'
                  }
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !form.formState.isValid}
                onClick={form.handleSubmit(handleSubmit)}
                className="h-12 px-10 rounded-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: form.formState.isValid
                    ? `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                    : `linear-gradient(135deg, ${COLORS.bronze}60 0%, ${COLORS.bronze}40 100%)`,
                  color: COLORS.black,
                  border: 'none',
                  boxShadow: form.formState.isValid
                    ? `0 6px 20px ${COLORS.gold}40`
                    : `0 4px 12px ${COLORS.bronze}20`
                }}
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center gap-2.5">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>{category ? 'Updating Category...' : 'Creating Category...'}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5" />
                    <span>{category ? 'Update Category' : 'Create Category'}</span>
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
