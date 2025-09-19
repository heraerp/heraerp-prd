'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ServiceForm, ServiceFormSchema, ServiceWithDynamicData } from '@/schemas/service'
import { Loader2, Save, X } from 'lucide-react'

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
  lightText: '#E0E0E0'
}

export function ServiceModal({
  open,
  onClose,
  service,
  onSave,
  categories = ['Hair', 'Color', 'Treatment', 'Styling', 'Nail', 'Spa']
}: ServiceModalProps) {
  const [saving, setSaving] = React.useState(false)

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
      tax_rate: 5,
      commission_type: 'percent',
      commission_value: 20,
      description: '',
      requires_equipment: false
    }
  })

  // Reset form when service changes
  React.useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        code: service.code || '',
        duration_mins: service.duration_mins || 30,
        category: service.category || '',
        price: service.price || 0,
        currency: service.currency || 'AED',
        tax_rate: service.tax_rate || 5,
        commission_type: service.commission_type || 'percent',
        commission_value: service.commission_value || 20,
        description: service.metadata?.description || '',
        requires_equipment: service.metadata?.requires_equipment || false
      })
    } else {
      reset()
    }
  }, [service, reset])

  const onSubmit = async (data: ServiceForm) => {
    setSaving(true)
    try {
      await onSave(data)
      onClose()
    } catch (error) {
      // Error handled by parent
    } finally {
      setSaving(false)
    }
  }

  const commissionType = watch('commission_type')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl"
        style={{ backgroundColor: COLORS.charcoal, color: COLORS.lightText }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: COLORS.champagne }}>
            {service ? 'Edit Service' : 'Create New Service'}
          </DialogTitle>
          <DialogDescription style={{ color: COLORS.lightText, opacity: 0.7 }}>
            Add or update service details. Pricing and commission settings will be saved separately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" style={{ color: COLORS.champagne }}>
                  Service Name *
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Premium Cut & Style"
                  className="bg-background/30 border-border text-foreground"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <Label htmlFor="code" style={{ color: COLORS.champagne }}>
                  Service Code
                </Label>
                <Input
                  id="code"
                  {...register('code')}
                  placeholder="e.g., SVC001"
                  className="bg-background/30 border-border text-foreground uppercase"
                />
                {errors.code && <p className="text-red-400 text-sm mt-1">{errors.code.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" style={{ color: COLORS.champagne }}>
                  Category
                </Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-background/30 border-border text-foreground">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="duration_mins" style={{ color: COLORS.champagne }}>
                  Duration (minutes) *
                </Label>
                <Input
                  id="duration_mins"
                  type="number"
                  {...register('duration_mins', { valueAsNumber: true })}
                  min={5}
                  max={480}
                  className="bg-background/30 border-border text-foreground"
                />
                {errors.duration_mins && (
                  <p className="text-red-400 text-sm mt-1">{errors.duration_mins.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4 border-t border-border pt-4">
            <h3 style={{ color: COLORS.champagne }} className="font-medium">
              Pricing
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" style={{ color: COLORS.champagne }}>
                  Price *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                    min={0}
                    className="bg-background/30 border-border text-foreground"
                  />
                  <Select value="AED" disabled>
                    <SelectTrigger className="w-20 bg-background/30 border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AED">AED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.price && (
                  <p className="text-red-400 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tax_rate" style={{ color: COLORS.champagne }}>
                  Tax Rate (%)
                </Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  {...register('tax_rate', { valueAsNumber: true })}
                  min={0}
                  max={100}
                  className="bg-background/30 border-border text-foreground"
                />
                {errors.tax_rate && (
                  <p className="text-red-400 text-sm mt-1">{errors.tax_rate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Commission */}
          <div className="space-y-4 border-t border-border pt-4">
            <h3 style={{ color: COLORS.champagne }} className="font-medium">
              Commission
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="commission_type" style={{ color: COLORS.champagne }}>
                  Commission Type
                </Label>
                <Controller
                  name="commission_type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-background/30 border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentage</SelectItem>
                        <SelectItem value="flat">Flat Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="commission_value" style={{ color: COLORS.champagne }}>
                  Commission Value {commissionType === 'percent' ? '(%)' : `(${watch('currency')})`}
                </Label>
                <Input
                  id="commission_value"
                  type="number"
                  step="0.01"
                  {...register('commission_value', { valueAsNumber: true })}
                  min={0}
                  max={commissionType === 'percent' ? 100 : undefined}
                  className="bg-background/30 border-border text-foreground"
                />
                {errors.commission_value && (
                  <p className="text-red-400 text-sm mt-1">{errors.commission_value.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4 border-t border-border pt-4">
            <div>
              <Label htmlFor="description" style={{ color: COLORS.champagne }}>
                Description
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Service details, benefits, or special notes..."
                rows={3}
                className="bg-background/30 border-border text-foreground"
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requires_equipment" style={{ color: COLORS.champagne }}>
                Requires special room or equipment
              </Label>
              <Controller
                name="requires_equipment"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="requires_equipment"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          {/* Smart Code Display */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.black }}>
            <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.7 }}>
              Smart Code: <span className="font-mono">HERA.SALON.SERVICE.V1</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="border-border hover:bg-muted"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="font-semibold"
              style={{
                background: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                color: COLORS.black
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save Service
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
