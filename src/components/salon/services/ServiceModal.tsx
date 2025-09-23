'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ServiceForm, ServiceFormSchema, ServiceWithDynamicData } from '@/schemas/service'
import {
  Loader2,
  Save,
  X,
  Clock,
  DollarSign,
  Percent,
  Tag,
  FileText,
  Wrench,
  Sparkles
} from 'lucide-react'
import {
  PrimaryButtonDNA,
  SecondaryButtonDNA,
  FormFieldDNA,
  ScrollAreaDNA,
  BadgeDNA
} from '@/lib/dna/components/ui'
import { useCategoriesPlaybook } from '@/hooks/useCategoriesPlaybook'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import * as Icons from 'lucide-react'

interface ServiceModalProps {
  open: boolean
  onClose: () => void
  service?: ServiceWithDynamicData | null
  onSave: (data: ServiceForm) => Promise<void>
  categories?: string[]
}

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0'
}

export function ServiceModal({
  open,
  onClose,
  service,
  onSave,
  categories = []
}: ServiceModalProps) {
  const [saving, setSaving] = React.useState(false)
  
  // Get organization context
  const { organization } = useHERAAuth()
  const organizationId = organization?.id || ''
  
  // Fetch categories dynamically
  const { categories: dynamicCategories, isLoading: categoriesLoading } = useCategoriesPlaybook({
    organizationId,
    includeArchived: false
  })
  
  // Use dynamic categories or fallback to provided categories
  const categoryOptions = dynamicCategories.length > 0 
    ? dynamicCategories.map(cat => ({
        value: cat.entity_name,
        label: cat.entity_name,
        color: cat.color,
        icon: cat.icon
      }))
    : categories.map(cat => ({ value: cat, label: cat }))

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ServiceForm>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: {
      name: '',
      code: '',
      duration_mins: 30,
      category: '',
      price: 0,
      currency: 'AED',
      description: '',
      requires_equipment: false
    }
  })

  // Reset form when service changes or modal opens/closes
  React.useEffect(() => {
    if (open) {
      if (service) {
        reset({
          name: service.name,
          code: service.code || '',
          duration_mins: service.duration_mins || 30,
          category: service.category || '',
          price: service.price || 0,
          currency: service.currency || 'AED',
          description: service.metadata?.description || '',
          requires_equipment: service.metadata?.requires_equipment || false
        })
      } else {
        // Reset to default values for new service
        reset({
          name: '',
          code: '',
          duration_mins: 30,
          category: '',
          price: 0,
          currency: 'AED',
          description: '',
          requires_equipment: false
        })
      }
    }
  }, [service, open, reset])

  const onSubmit = async (data: ServiceForm) => {
    setSaving(true)
    try {
      await onSave(data)
      onClose()
    } catch (error) {
      // Error handled by parent component
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] p-0 overflow-hidden"
        style={{ backgroundColor: COLORS.charcoal, color: COLORS.lightText }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle
                style={{ color: COLORS.champagne }}
                className="text-xl flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" style={{ color: COLORS.gold }} />
                {service ? 'Edit Service' : 'Create New Service'}
              </DialogTitle>
              <DialogDescription style={{ color: COLORS.lightText, opacity: 0.7 }} className="mt-1">
                Configure service details, pricing, and commission settings
              </DialogDescription>
            </div>
            {service && (
              <BadgeDNA variant="secondary" className="ml-4">
                ID: {service.code || service.id.slice(0, 8)}
              </BadgeDNA>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <ScrollAreaDNA height="h-[calc(90vh-200px)]" className="px-6 py-4">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3
                  className="font-medium flex items-center gap-2 text-sm uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  <Tag className="w-4 h-4" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormFieldDNA
                    type="text"
                    label="Service Name"
                    value={watch('name')}
                    onChange={value => setValue('name', value)}
                    placeholder="e.g., Premium Cut & Style"
                    error={errors.name?.message}
                    required
                  />

                  <FormFieldDNA
                    type="text"
                    label="Service Code"
                    value={watch('code') || ''}
                    onChange={value => setValue('code', value.toUpperCase())}
                    placeholder="e.g., SVC001"
                    error={errors.code?.message}
                    helper="Optional unique identifier"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormFieldDNA
                    type="select"
                    label="Category"
                    value={watch('category') || ''}
                    onChange={value => setValue('category', value)}
                    options={categoryOptions}
                    placeholder={categoriesLoading ? "Loading categories..." : "Select category"}
                    disabled={categoriesLoading}
                    renderOption={(option) => {
                      if (option.icon && option.color) {
                        const IconComponent = (Icons as any)[option.icon] || Icons.Tag
                        return (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded flex items-center justify-center"
                              style={{
                                backgroundColor: option.color + '20',
                                border: `1px solid ${option.color}40`
                              }}
                            >
                              <IconComponent className="w-2.5 h-2.5" style={{ color: option.color }} />
                            </div>
                            <span>{option.label}</span>
                          </div>
                        )
                      }
                      return option.label
                    }}
                  />

                  <FormFieldDNA
                    type="number"
                    label="Duration (minutes)"
                    value={watch('duration_mins').toString()}
                    onChange={value => setValue('duration_mins', parseInt(value) || 30)}
                    min={5}
                    max={480}
                    error={errors.duration_mins?.message}
                    icon={Clock}
                    required
                    helper="Service duration in minutes"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div
                className="space-y-4 pt-6 border-t"
                style={{ borderColor: COLORS.bronze + '33' }}
              >
                <h3
                  className="font-medium text-sm uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  Pricing Configuration
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormFieldDNA
                    type="number"
                    label="Service Price"
                    value={watch('price').toString()}
                    onChange={value => setValue('price', parseFloat(value) || 0)}
                    min={0}
                    step={0.01}
                    error={errors.price?.message}
                    suffix="AED"
                    required
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div
                className="space-y-4 pt-6 border-t"
                style={{ borderColor: COLORS.bronze + '33' }}
              >
                <h3
                  className="font-medium flex items-center gap-2 text-sm uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  <FileText className="w-4 h-4" />
                  Additional Details
                </h3>

                <FormFieldDNA
                  type="textarea"
                  label="Service Description"
                  value={watch('description') || ''}
                  onChange={value => setValue('description', value)}
                  placeholder="Describe the service, what's included, benefits..."
                  rows={3}
                  error={errors.description?.message}
                  helper="This description will be visible to customers"
                />

                <div
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{
                    backgroundColor: COLORS.black + '30',
                    border: '1px solid ' + COLORS.bronze + '33'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Wrench className="w-5 h-5" style={{ color: COLORS.bronze }} />
                    <div>
                      <Label
                        htmlFor="requires_equipment"
                        className="font-medium cursor-pointer"
                        style={{ color: COLORS.champagne }}
                      >
                        Requires special equipment
                      </Label>
                      <p className="text-xs mt-1" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                        Enable if this service needs specific equipment or a designated room
                      </p>
                    </div>
                  </div>
                  <Controller
                    name="requires_equipment"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="requires_equipment"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-gold"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Smart Code Display */}
              <div
                className="mt-6 p-4 rounded-lg"
                style={{
                  backgroundColor: COLORS.black + '20',
                  border: '1px solid ' + COLORS.bronze + '33'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-xs uppercase tracking-wider"
                      style={{ color: COLORS.bronze }}
                    >
                      Smart Code
                    </p>
                    <p className="font-mono text-sm mt-1" style={{ color: COLORS.champagne }}>
                      HERA.SALON.SERVICE.V1
                    </p>
                  </div>
                  <BadgeDNA variant="secondary" className="text-xs">
                    Auto-generated
                  </BadgeDNA>
                </div>
              </div>
            </div>
          </ScrollAreaDNA>

          {/* Fixed Footer with Actions */}
          <div
            className="flex-shrink-0 px-6 py-4 border-t flex justify-end gap-3"
            style={{ backgroundColor: COLORS.charcoal, borderColor: COLORS.bronze + '33' }}
          >
            <SecondaryButtonDNA type="button" icon={X} onClick={onClose} disabled={saving}>
              Cancel
            </SecondaryButtonDNA>
            <PrimaryButtonDNA
              type="submit"
              icon={Save}
              loading={saving}
              loadingText="Saving..."
              className="min-w-[140px]"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                color: COLORS.black,
                fontWeight: '600'
              }}
            >
              {service ? 'Update Service' : 'Create Service'}
            </PrimaryButtonDNA>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
