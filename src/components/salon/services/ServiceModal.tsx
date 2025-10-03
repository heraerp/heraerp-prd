'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Service, ServiceFormValues, ServiceFormSchema } from '@/types/salon-service'
import { useHeraServiceCategories } from '@/hooks/useHeraServiceCategories'
import { useSalonContext } from '@/app/salon/SalonProvider'
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
import { Sparkles, X, Clock, CalendarCheck, CalendarX, CheckCircle2 } from 'lucide-react'

interface ServiceModalProps {
  open: boolean
  onClose: () => void
  service?: Service | null
  onSave: (data: ServiceFormValues) => Promise<void>
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

export function ServiceModal({ open, onClose, service, onSave }: ServiceModalProps) {
  const { organizationId, currency } = useSalonContext()

  // Fetch categories for dropdown
  const { categories: categoryList, isLoading: categoriesLoading } = useHeraServiceCategories({
    organizationId,
    includeArchived: false
  })

  // Deduplicate categories by ID and sort by name
  const categories = categoryList
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

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: {
      name: '',
      code: '',
      category: '',
      price: undefined,
      duration_minutes: undefined,
      requires_booking: false,
      description: '',
      status: 'active',
      currency: currency || 'AED'
    }
  })

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.entity_name || '',
        code: service.entity_code || '',
        category: service.category || '',
        price: service.price || undefined,
        duration_minutes: service.duration_minutes || undefined,
        requires_booking: service.requires_booking || false,
        description: service.entity_description || '',
        status: service.status || 'active',
        currency: service.currency || currency || 'AED'
      })
    } else {
      form.reset({
        name: '',
        code: '',
        category: '',
        price: undefined,
        duration_minutes: undefined,
        requires_booking: false,
        description: '',
        status: 'active',
        currency: currency || 'AED'
      })
    }
  }, [service, form, currency])

  const handleSubmit = async (data: ServiceFormValues) => {
    try {
      await onSave(data)
      form.reset()
    } catch (error) {
      console.error('Service save error:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  // Format duration display
  const formatDuration = (minutes?: number) => {
    if (!minutes) return ''
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
    if (hours > 0) return `${hours}h`
    return `${mins}m`
  }

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
                  <Sparkles className="w-7 h-7" style={{ color: COLORS.gold }} />

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
                    {service ? 'Edit Service' : 'Create New Service'}
                  </DialogTitle>
                  <p className="text-sm" style={{ color: COLORS.lightText, opacity: 0.8 }}>
                    {service
                      ? 'Update service details and pricing'
                      : 'Add a premium service to elevate your offerings'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 transition-all duration-200 hover:bg-white/10"
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
                          Service Name <span style={{ color: COLORS.gold }}>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Premium Cut & Style"
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
                          Service Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Auto-generated"
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

                <div className="grid grid-cols-2 gap-5 mt-5">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-sm font-medium tracking-wide"
                          style={{ color: COLORS.champagne }}
                        >
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
                                  {cat.entity_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-sm font-medium tracking-wide flex items-center gap-2"
                          style={{ color: COLORS.champagne }}
                        >
                          <Clock className="w-4 h-4" style={{ color: COLORS.gold }} />
                          Duration
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="number"
                              placeholder="0"
                              className="h-11 rounded-lg pr-20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
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
                              value={field.value || ''}
                            />
                            <span
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                              style={{ color: COLORS.bronze }}
                            >
                              minutes
                            </span>
                          </div>
                        </FormControl>
                        {field.value && (
                          <p className="text-xs mt-1.5 font-medium" style={{ color: COLORS.gold }}>
                            ≈ {formatDuration(field.value)}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Pricing Section */}
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
                    Pricing
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-sm font-medium tracking-wide"
                        style={{ color: COLORS.champagne }}
                      >
                        Service Price
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold"
                            style={{ color: COLORS.gold }}
                          >
                            {currency || 'AED'}
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
                                '--tw-ring-color': COLORS.gold + '60'
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description & Settings Section */}
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
                    Additional Details
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
                          placeholder="Describe what makes this service special..."
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

                <div className="mt-6 space-y-4">
                  {/* Enterprise-grade Booking Requirement Selector */}
                  <FormField
                    control={form.control}
                    name="requires_booking"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel
                          className="text-sm font-medium tracking-wide"
                          style={{ color: COLORS.champagne }}
                        >
                          Booking Requirement
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-3">
                            {/* Walk-in Option */}
                            <button
                              type="button"
                              onClick={() => field.onChange(false)}
                              className="relative group transition-all duration-200"
                              style={{
                                backgroundColor: !field.value
                                  ? COLORS.charcoalDark
                                  : COLORS.charcoalLight + '50',
                                border: `2px solid ${!field.value ? COLORS.gold : COLORS.bronze + '40'}`,
                                borderRadius: '12px',
                                padding: '16px',
                                cursor: 'pointer',
                                boxShadow: !field.value ? `0 0 20px ${COLORS.gold}40` : 'none'
                              }}
                            >
                              {/* Selection Indicator */}
                              {!field.value && (
                                <div
                                  className="absolute top-3 right-3"
                                  style={{ color: COLORS.gold }}
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                              )}

                              {/* Icon */}
                              <div
                                className="mb-3 flex items-center justify-center w-12 h-12 rounded-lg mx-auto"
                                style={{
                                  backgroundColor: !field.value
                                    ? COLORS.gold + '20'
                                    : COLORS.bronze + '20',
                                  border: `1px solid ${!field.value ? COLORS.gold : COLORS.bronze}40`
                                }}
                              >
                                <CalendarX
                                  className="w-6 h-6"
                                  style={{ color: !field.value ? COLORS.gold : COLORS.bronze }}
                                />
                              </div>

                              {/* Label */}
                              <div className="text-center">
                                <p
                                  className="font-semibold text-base mb-1"
                                  style={{
                                    color: !field.value ? COLORS.champagne : COLORS.lightText
                                  }}
                                >
                                  Walk-in Service
                                </p>
                                <p
                                  className="text-xs"
                                  style={{
                                    color: COLORS.lightText,
                                    opacity: !field.value ? 0.9 : 0.6
                                  }}
                                >
                                  No advance booking required
                                </p>
                              </div>
                            </button>

                            {/* Booking Required Option */}
                            <button
                              type="button"
                              onClick={() => field.onChange(true)}
                              className="relative group transition-all duration-200"
                              style={{
                                backgroundColor: field.value
                                  ? COLORS.charcoalDark
                                  : COLORS.charcoalLight + '50',
                                border: `2px solid ${field.value ? COLORS.gold : COLORS.bronze + '40'}`,
                                borderRadius: '12px',
                                padding: '16px',
                                cursor: 'pointer',
                                boxShadow: field.value ? `0 0 20px ${COLORS.gold}40` : 'none'
                              }}
                            >
                              {/* Selection Indicator */}
                              {field.value && (
                                <div
                                  className="absolute top-3 right-3"
                                  style={{ color: COLORS.gold }}
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                              )}

                              {/* Icon */}
                              <div
                                className="mb-3 flex items-center justify-center w-12 h-12 rounded-lg mx-auto"
                                style={{
                                  backgroundColor: field.value
                                    ? COLORS.gold + '20'
                                    : COLORS.bronze + '20',
                                  border: `1px solid ${field.value ? COLORS.gold : COLORS.bronze}40`
                                }}
                              >
                                <CalendarCheck
                                  className="w-6 h-6"
                                  style={{ color: field.value ? COLORS.gold : COLORS.bronze }}
                                />
                              </div>

                              {/* Label */}
                              <div className="text-center">
                                <p
                                  className="font-semibold text-base mb-1"
                                  style={{
                                    color: field.value ? COLORS.champagne : COLORS.lightText
                                  }}
                                >
                                  Booking Required
                                </p>
                                <p
                                  className="text-xs"
                                  style={{
                                    color: COLORS.lightText,
                                    opacity: field.value ? 0.9 : 0.6
                                  }}
                                >
                                  Requires advance appointment
                                </p>
                              </div>
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-sm font-medium tracking-wide"
                          style={{ color: COLORS.champagne }}
                        >
                          Status
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
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    {service ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {service ? 'Update Service' : 'Create Service'}
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
