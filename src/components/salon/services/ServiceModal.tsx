'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Service, ServiceFormValues, ServiceFormSchema } from '@/types/salon-service'
import { useHeraServiceCategories } from '@/hooks/useHeraServiceCategories'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { SalonLuxeModal, ValidationError } from '@/components/salon/shared/SalonLuxeModal'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
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
import {
  Sparkles,
  Clock,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  Building2,
  MapPin
} from 'lucide-react'

interface ServiceModalProps {
  open: boolean
  onClose: () => void
  service?: Service | null
  onSave: (data: ServiceFormValues) => Promise<void>
}

// Map SALON_LUXE_COLORS to flat structure for convenience
const COLORS = {
  black: SALON_LUXE_COLORS.charcoal.dark,      // #0F0F0F
  charcoal: SALON_LUXE_COLORS.charcoal.base,   // #1A1A1A
  gold: SALON_LUXE_COLORS.gold.base,           // #D4AF37
  goldDark: SALON_LUXE_COLORS.gold.dark,       // #B8860B
  champagne: SALON_LUXE_COLORS.champagne.base, // #f5e9b8
  bronze: '#8C7853',                            // Custom bronze (not in luxe colors)
  lightText: SALON_LUXE_COLORS.text.primary,   // #F5F7FA
  charcoalDark: SALON_LUXE_COLORS.charcoal.dark,   // #0F0F0F
  charcoalLight: SALON_LUXE_COLORS.charcoal.light  // #252525
}

export function ServiceModal({ open, onClose, service, onSave }: ServiceModalProps) {
  const { organization, currency, availableBranches } = useSecuredSalonContext()
  const organizationId = organization?.id
  const [showValidationSummary, setShowValidationSummary] = useState(false)
  const [shakeButton, setShakeButton] = useState(false)

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
      currency: currency || 'AED',
      branch_ids: [] // Default to no branches selected
    },
    mode: 'onChange' // ✅ Enable real-time form updates
  })

  // Reset form when service changes or modal opens/closes
  useEffect(() => {
    if (open) {
      if (service) {
        // ✅ ENTERPRISE FIX: Extract branch IDs from AVAILABLE_AT relationships
        // Relationships have to_entity_id (UUID), not populated to_entity object
        // ✅ HERA STANDARD: Use UPPERCASE relationship keys only
        const availableAtRels = (service as any).relationships?.AVAILABLE_AT
        let branchIds: string[] = []

        if (Array.isArray(availableAtRels)) {
          branchIds = availableAtRels
            .filter(rel => rel?.to_entity_id || rel?.to_entity?.id)
            .map(rel => rel.to_entity_id || rel.to_entity?.id)
        } else if (availableAtRels?.to_entity_id || availableAtRels?.to_entity?.id) {
          branchIds = [availableAtRels.to_entity_id || availableAtRels.to_entity?.id]
        }

        // Extract category ID from HAS_CATEGORY relationship
        // ✅ HERA STANDARD: Use UPPERCASE relationship keys only
        const categoryRels = (service as any).relationships?.HAS_CATEGORY
        let categoryId = ''

        if (Array.isArray(categoryRels) && categoryRels.length > 0) {
          categoryId = categoryRels[0].to_entity?.id || categoryRels[0].to_entity_id || ''
        } else if (categoryRels?.to_entity?.id) {
          categoryId = categoryRels.to_entity.id
        } else if (categoryRels?.to_entity_id) {
          categoryId = categoryRels.to_entity_id
        }

        // Map service dynamic fields to form fields
        // Service has: price_market, duration_min, description (dynamic field), status (entity field)
        // Form expects: price, duration_minutes, status, description
        form.reset({
          name: service.entity_name || '',
          code: service.entity_code || '',
          category: categoryId, // Use category ID from relationship
          price: service.price_market || service.price || undefined,
          duration_minutes: service.duration_min || service.duration_minutes || undefined,
          requires_booking: service.requires_booking || false,
          description: service.description || service.entity_description || '',
          // 🎯 CRITICAL FIX: Use entity-level status field directly (not active dynamic field)
          status: service.status || 'active',
          currency: service.currency || currency || 'AED',
          branch_ids: branchIds
        })
      } else {
        // Creating new service - initialize with defaults
        form.reset({
          name: '',
          code: '',
          category: '',
          price: undefined,
          duration_minutes: undefined,
          requires_booking: false,
          description: '',
          status: 'active',
          currency: currency || 'AED',
          branch_ids: []
        })
      }
    }
  }, [service, open, form, currency])

  const handleSubmit = async (data: ServiceFormValues) => {
    try {
      // Hide validation summary on successful submission attempt
      setShowValidationSummary(false)
      await onSave(data)
      form.reset()
    } catch (error) {
      console.error('Service save error:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    setShowValidationSummary(false)
    onClose()
  }

  // Convert react-hook-form errors to ValidationError array for SalonLuxeModal
  const validationErrors: ValidationError[] = Object.entries(form.formState.errors).map(
    ([field, error]) => ({
      field,
      message: error?.message || 'Invalid value'
    })
  )

  // Show validation summary when there are errors and user tried to submit
  useEffect(() => {
    if (form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0) {
      setShowValidationSummary(true)
      setShakeButton(true)
      setTimeout(() => setShakeButton(false), 500)
    }
  }, [form.formState.isSubmitted, form.formState.errors])

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
    <>
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
      <SalonLuxeModal
        open={open}
        onClose={handleClose}
        title={service ? 'Edit Service' : 'Create New Service'}
        description={
          service
            ? 'Update service details and pricing'
            : 'Add a premium service to elevate your offerings'
        }
        icon={<Sparkles className="w-7 h-7" />}
        size="lg"
        validationErrors={validationErrors}
        showValidationSummary={showValidationSummary}
        footer={
        <div className="flex items-center justify-between w-full">
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
              className="h-11 px-6 rounded-lg outline-button"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              onClick={form.handleSubmit(handleSubmit)}
              className={`h-11 px-8 rounded-lg font-semibold primary-button ${shakeButton ? 'animate-shake' : ''}`}
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
      }
    >
      <div className="py-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  backgroundColor: COLORS.charcoalDark + 'E6',
                  borderColor: COLORS.bronze + '30',
                  boxShadow: `0 4px 12px ${COLORS.black}40`,
                  animationDelay: '0ms'
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
                            value={field.value || ''} // ✅ Always ensure it's a string
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
                            value={field.value || ''} // ✅ Always ensure it's a string
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
                          <SelectContent
                            className="hera-select-content animate-in fade-in slide-in-from-top-2 duration-200"
                            style={{
                              backgroundColor: COLORS.charcoal,
                              borderColor: COLORS.bronze + '40',
                              boxShadow: `0 8px 24px ${COLORS.black}60`
                            }}
                          >
                            {categoryOptions.length === 0 ? (
                              <div
                                className="px-3 py-2 text-sm"
                                style={{ color: COLORS.lightText, opacity: 0.6 }}
                              >
                                No categories found
                              </div>
                            ) : (
                              categoryOptions.map(cat => (
                                <SelectItem
                                  key={cat.id}
                                  value={cat.id}
                                  className="hera-select-item"
                                  style={{
                                    color: COLORS.champagne
                                  }}
                                >
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

              {/* Branch Availability Section */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  backgroundColor: COLORS.charcoalDark + 'E6',
                  borderColor: COLORS.bronze + '30',
                  boxShadow: `0 4px 12px ${COLORS.black}40`,
                  animationDelay: '50ms'
                }}
              >
                {/* Section Header with Icon */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                  <h3
                    className="text-lg font-semibold tracking-wide"
                    style={{ color: COLORS.champagne }}
                  >
                    Branch Availability
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="branch_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-sm font-medium tracking-wide flex items-center gap-2"
                        style={{ color: COLORS.champagne }}
                      >
                        <Building2 className="w-4 h-4" style={{ color: COLORS.gold }} />
                        Select Locations Where This Service is Available
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {availableBranches.length === 0 ? (
                            <div
                              className="col-span-2 p-4 rounded-lg text-center"
                              style={{
                                backgroundColor: COLORS.charcoalLight + '50',
                                border: `1px dashed ${COLORS.bronze}40`,
                                color: COLORS.lightText
                              }}
                            >
                              <Building2
                                className="w-8 h-8 mx-auto mb-2 opacity-50"
                                style={{ color: COLORS.bronze }}
                              />
                              <p className="text-sm opacity-70">No branches available</p>
                            </div>
                          ) : (
                            availableBranches.map(branch => {
                              const isSelected = field.value?.includes(branch.id)
                              return (
                                <button
                                  key={branch.id}
                                  type="button"
                                  onClick={() => {
                                    const currentValue = field.value || []
                                    if (isSelected) {
                                      field.onChange(currentValue.filter(id => id !== branch.id))
                                    } else {
                                      field.onChange([...currentValue, branch.id])
                                    }
                                  }}
                                  className="relative group transition-all duration-200 hover:scale-102"
                                  style={{
                                    backgroundColor: isSelected
                                      ? COLORS.charcoalDark
                                      : COLORS.charcoalLight + '50',
                                    border: `2px solid ${isSelected ? COLORS.gold : COLORS.bronze + '40'}`,
                                    borderRadius: '12px',
                                    padding: '14px',
                                    cursor: 'pointer',
                                    boxShadow: isSelected ? `0 0 20px ${COLORS.gold}30` : 'none'
                                  }}
                                >
                                  {/* Selection Indicator */}
                                  {isSelected && (
                                    <div
                                      className="absolute top-2 right-2 animate-in zoom-in duration-200"
                                      style={{ color: COLORS.gold }}
                                    >
                                      <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                  )}

                                  {/* Branch Icon */}
                                  <div
                                    className="mb-2 flex items-center justify-center w-10 h-10 rounded-lg mx-auto"
                                    style={{
                                      backgroundColor: isSelected
                                        ? COLORS.gold + '20'
                                        : COLORS.bronze + '20',
                                      border: `1px solid ${isSelected ? COLORS.gold : COLORS.bronze}40`
                                    }}
                                  >
                                    <MapPin
                                      className="w-5 h-5"
                                      style={{ color: isSelected ? COLORS.gold : COLORS.bronze }}
                                    />
                                  </div>

                                  {/* Branch Name */}
                                  <div className="text-center">
                                    <p
                                      className="font-semibold text-sm mb-0.5 truncate"
                                      style={{
                                        color: isSelected ? COLORS.champagne : COLORS.lightText
                                      }}
                                    >
                                      {branch.entity_name}
                                    </p>
                                    {branch.entity_code && (
                                      <p
                                        className="text-xs truncate"
                                        style={{
                                          color: COLORS.bronze,
                                          opacity: isSelected ? 0.9 : 0.6
                                        }}
                                      >
                                        {branch.entity_code}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              )
                            })
                          )}
                        </div>
                      </FormControl>
                      <p className="text-xs mt-3" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                        {field.value && field.value.length > 0 ? (
                          <span>
                            Selected:{' '}
                            <span style={{ color: COLORS.gold, fontWeight: 600 }}>
                              {field.value.length} location{field.value.length > 1 ? 's' : ''}
                            </span>
                          </span>
                        ) : (
                          <span style={{ color: COLORS.bronze }}>
                            No locations selected - service will not appear in any branch
                          </span>
                        )}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pricing Section */}
              <div
                className="relative p-6 rounded-xl border backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  backgroundColor: COLORS.charcoalDark + 'E6',
                  borderColor: COLORS.bronze + '30',
                  boxShadow: `0 4px 12px ${COLORS.black}40`,
                  animationDelay: '100ms'
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
                className="relative p-6 rounded-xl border backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  backgroundColor: COLORS.charcoalDark + 'E6',
                  borderColor: COLORS.bronze + '30',
                  boxShadow: `0 4px 12px ${COLORS.black}40`,
                  animationDelay: '150ms'
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
                          value={field.value || ''} // ✅ Always ensure it's a string
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
                          <SelectContent
                            className="hera-select-content animate-in fade-in slide-in-from-top-2 duration-200"
                            style={{
                              backgroundColor: COLORS.charcoal,
                              borderColor: COLORS.bronze + '40',
                              boxShadow: `0 8px 24px ${COLORS.black}60`
                            }}
                          >
                            <SelectItem
                              value="active"
                              className="hera-select-item"
                              style={{ color: COLORS.champagne }}
                            >
                              Active
                            </SelectItem>
                            <SelectItem
                              value="archived"
                              className="hera-select-item"
                              style={{ color: COLORS.champagne }}
                            >
                              Archived
                            </SelectItem>
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
    </SalonLuxeModal>
    </>
  )
}
