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
      description: ''
    }
  })

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.entity_name || '',
        description: category.description || ''
      })
    } else {
      form.reset({
        name: '',
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
                          className="h-12 rounded-lg text-base"
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
