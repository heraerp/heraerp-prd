'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ServiceCategory,
  ServiceCategoryFormSchema,
  ServiceCategoryFormValues
} from '@/types/salon-service'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
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
import { Tag, Sparkles } from 'lucide-react'

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
      description: '', // Always initialize as empty string
      color: '#D4AF37'
    },
    mode: 'onChange' // Enable real-time validation
  })

  // Reset form when category changes or modal opens/closes
  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.entity_name || '',
          description: category.description || '', // Ensure always a string
          color: category.color || '#D4AF37'
        })
      } else {
        form.reset({
          name: '',
          description: '', // Empty string for new categories
          color: '#D4AF37'
        })
      }
    }
  }, [category, open, form])

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

  const selectedColor = form.watch('color')

  return (
    <SalonLuxeModal
      open={open}
      onClose={handleClose}
      title={category ? 'Edit Category' : 'Create New Category'}
      description={
        category
          ? 'Update service category information'
          : 'Organize your services with custom categories'
      }
      icon={<Tag className="w-6 h-6" />}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
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
              className="outline-button h-12 px-8 rounded-lg"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !form.formState.isValid}
              onClick={form.handleSubmit(handleSubmit)}
              className="primary-button h-12 px-10 rounded-lg"
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
      }
    >
      {/* Form Content */}
      <div className="space-y-6">
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
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
                              placeholder="e.g., Hair Services"
                              maxLength={50}
                              className="h-12 rounded-lg text-base"
                            />
                          </FormControl>
                          <div className="flex items-center justify-between mt-1.5">
                            <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.6 }}>
                              Clear, descriptive name
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

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-sm font-semibold tracking-wide"
                          style={{ color: COLORS.champagne }}
                        >
                          Color
                        </FormLabel>
                        <Select value={field.value || '#D4AF37'} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger
                              className="h-12 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 hera-select-trigger"
                              style={
                                {
                                  backgroundColor: COLORS.charcoalLight + '80',
                                  borderColor: COLORS.bronze + '40',
                                  color: COLORS.champagne,
                                  '--tw-ring-color': COLORS.gold + '60'
                                } as React.CSSProperties
                              }
                            >
                              <div className="flex items-center justify-center">
                                <div
                                  className="w-6 h-6 rounded-full border-2"
                                  style={{
                                    backgroundColor: selectedColor || '#D4AF37',
                                    borderColor: COLORS.gold + '60',
                                    boxShadow: `0 0 8px ${selectedColor || '#D4AF37'}40`
                                  }}
                                />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent
                            className="hera-select-content animate-in fade-in slide-in-from-top-2 duration-200"
                            style={{
                              backgroundColor: COLORS.charcoal,
                              borderColor: COLORS.bronze + '40',
                              boxShadow: `0 8px 24px ${COLORS.black}60`
                            }}
                          >
                            {COLOR_OPTIONS.map(option => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="hera-select-item"
                                style={{
                                  color: COLORS.champagne
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded-full border-2"
                                    style={{
                                      backgroundColor: option.color,
                                      borderColor: COLORS.gold + '60',
                                      boxShadow: `0 0 6px ${option.color}40`
                                    }}
                                  />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs mt-1.5" style={{ color: COLORS.lightText, opacity: 0.6 }}>
                          Visual identifier
                        </p>
                        <FormMessage />
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
                          value={field.value || ''}
                          placeholder="Add a brief description of this category (e.g., 'Premium hair coloring and styling services for all hair types')"
                          maxLength={200}
                          className="min-h-[110px] rounded-lg resize-none"
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
                        <span>Group related services together for better organization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: COLORS.gold }} />
                        <span>Keep category names concise and easy to scan</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>
    </SalonLuxeModal>
  )
}
