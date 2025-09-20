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
import { ItemForm, ItemFormSchema, ItemWithStock } from '@/schemas/inventory'
import {
  Loader2,
  Save,
  X,
  Package,
  Tag,
  Barcode,
  DollarSign,
  Percent,
  FileText,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import {
  PrimaryButtonDNA,
  SecondaryButtonDNA,
  FormFieldDNA,
  ScrollAreaDNA,
  BadgeDNA
} from '@/lib/dna/components/ui'

interface ItemModalProps {
  open: boolean
  onClose: () => void
  item?: ItemWithStock | null
  onSave: (data: ItemForm) => Promise<void>
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

const UOM_OPTIONS = [
  { value: 'unit', label: 'Unit' },
  { value: 'piece', label: 'Piece' },
  { value: 'box', label: 'Box' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'g', label: 'Gram (g)' }
]

export function ItemModal({
  open,
  onClose,
  item,
  onSave,
  categories = ['Hair Care', 'Color', 'Tools', 'Retail', 'Supplies', 'Equipment']
}: ItemModalProps) {
  const [saving, setSaving] = React.useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ItemForm>({
    resolver: zodResolver(ItemFormSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      category: '',
      uom: 'unit',
      track_stock: true,
      reorder_level: undefined,
      reorder_qty: undefined,
      status: 'active',
      cost: undefined,
      tax_rate: 5
    }
  })

  // Reset form when item changes
  React.useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        sku: item.sku || '',
        barcode: item.barcode || '',
        category: item.category || '',
        uom: item.uom || 'unit',
        track_stock: item.track_stock ?? true,
        reorder_level: item.metadata?.reorder_level,
        reorder_qty: item.metadata?.reorder_qty,
        status: item.status,
        cost: item.metadata?.cost,
        tax_rate: item.metadata?.tax_rate || 5
      })
    } else {
      reset()
    }
  }, [item, reset])

  const onSubmit = async (data: ItemForm) => {
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

  const trackStock = watch('track_stock')

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
                <Package className="w-5 h-5" style={{ color: COLORS.gold }} />
                {item ? 'Edit Item' : 'Create New Item'}
              </DialogTitle>
              <DialogDescription style={{ color: COLORS.lightText, opacity: 0.7 }} className="mt-1">
                Configure inventory item details and reorder settings
              </DialogDescription>
            </div>
            {item && (
              <BadgeDNA variant="secondary" className="ml-4">
                ID: {item.id.slice(0, 8)}
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
                    label="Item Name"
                    value={watch('name')}
                    onChange={value => setValue('name', value)}
                    placeholder="e.g., Professional Shampoo 1L"
                    error={errors.name?.message}
                    required
                  />

                  <FormFieldDNA
                    type="text"
                    label="SKU"
                    value={watch('sku') || ''}
                    onChange={value => setValue('sku', value.toUpperCase())}
                    placeholder="e.g., SHMP-PRO-1L"
                    error={errors.sku?.message}
                    helper="Stock Keeping Unit - unique identifier"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormFieldDNA
                    type="text"
                    label="Barcode"
                    value={watch('barcode') || ''}
                    onChange={value => setValue('barcode', value)}
                    placeholder="Scan or enter barcode"
                    icon={Barcode}
                    error={errors.barcode?.message}
                  />

                  <FormFieldDNA
                    type="select"
                    label="Category"
                    value={watch('category') || ''}
                    onChange={value => setValue('category', value)}
                    options={categories.map(cat => ({ value: cat, label: cat }))}
                    placeholder="Select category"
                  />
                </div>

                <FormFieldDNA
                  type="select"
                  label="Unit of Measure"
                  value={watch('uom') || 'unit'}
                  onChange={value => setValue('uom', value as any)}
                  options={UOM_OPTIONS}
                  required
                />
              </div>

              {/* Stock Management */}
              <div
                className="space-y-4 pt-6 border-t"
                style={{ borderColor: COLORS.bronze + '33' }}
              >
                <h3
                  className="font-medium flex items-center gap-2 text-sm uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  <AlertCircle className="w-4 h-4" />
                  Stock Management
                </h3>

                <div
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{
                    backgroundColor: COLORS.black + '30',
                    border: '1px solid ' + COLORS.bronze + '33'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5" style={{ color: COLORS.bronze }} />
                    <div>
                      <Label
                        htmlFor="track_stock"
                        className="font-medium cursor-pointer"
                        style={{ color: COLORS.champagne }}
                      >
                        Track stock levels
                      </Label>
                      <p className="text-xs mt-1" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                        Enable to track on-hand quantities and set reorder points
                      </p>
                    </div>
                  </div>
                  <Controller
                    name="track_stock"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="track_stock"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-gold"
                      />
                    )}
                  />
                </div>

                {trackStock && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormFieldDNA
                      type="number"
                      label="Reorder Level"
                      value={watch('reorder_level')?.toString() || ''}
                      onChange={value => setValue('reorder_level', parseInt(value) || undefined)}
                      min={0}
                      error={errors.reorder_level?.message}
                      helper="Stock level that triggers reorder alert"
                    />

                    <FormFieldDNA
                      type="number"
                      label="Reorder Quantity"
                      value={watch('reorder_qty')?.toString() || ''}
                      onChange={value => setValue('reorder_qty', parseInt(value) || undefined)}
                      min={0}
                      error={errors.reorder_qty?.message}
                      helper="Suggested quantity to order"
                    />
                  </div>
                )}
              </div>

              {/* Costing & Tax */}
              <div
                className="space-y-4 pt-6 border-t"
                style={{ borderColor: COLORS.bronze + '33' }}
              >
                <h3
                  className="font-medium flex items-center gap-2 text-sm uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  <DollarSign className="w-4 h-4" />
                  Costing & Tax
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormFieldDNA
                    type="number"
                    label="Default Cost"
                    value={watch('cost')?.toString() || ''}
                    onChange={value => setValue('cost', parseFloat(value) || undefined)}
                    min={0}
                    step={0.01}
                    error={errors.cost?.message}
                    icon={DollarSign}
                    suffix="AED"
                    helper="Default unit cost for new receipts"
                  />

                  <FormFieldDNA
                    type="number"
                    label="Tax Rate"
                    value={watch('tax_rate')?.toString() || '5'}
                    onChange={value => setValue('tax_rate', parseFloat(value) || 0)}
                    min={0}
                    max={100}
                    step={0.01}
                    error={errors.tax_rate?.message}
                    icon={Percent}
                    suffix="%"
                    helper="UAE VAT is 5%"
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
                      HERA.SALON.PRODUCT.V1
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
              {item ? 'Update Item' : 'Create Item'}
            </PrimaryButtonDNA>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
