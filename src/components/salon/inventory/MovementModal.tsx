'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MovementForm, MovementFormSchema, ItemWithStock } from '@/schemas/inventory'
import { format } from 'date-fns'
import {
  Loader2,
  Save,
  X,
  Plus,
  Trash2,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  SettingsIcon,
  Search,
  Calculator,
  FileText,
  Package,
  AlertCircle
} from 'lucide-react'
import {
  PrimaryButtonDNA,
  SecondaryButtonDNA,
  FormFieldDNA,
  ScrollAreaDNA,
  BadgeDNA
} from '@/lib/dna/components/ui'
import { cn } from '@/lib/utils'

interface MovementModalProps {
  open: boolean
  onClose: () => void
  items: ItemWithStock[]
  branches: Array<{ id: string; name: string }>
  currentBranch: string
  onSave: (data: MovementForm) => Promise<void>
}

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#5A2A40',
  rose: '#E8B4B8',
  lightText: '#E0E0E0'
}

const typeConfig = {
  RECEIPT: {
    icon: ArrowDownIcon,
    color: '#10B981',
    label: 'Goods Receipt',
    description: 'Receive items into inventory',
    requiresCost: true
  },
  ISSUE: {
    icon: ArrowUpIcon,
    color: '#EF4444',
    label: 'Goods Issue',
    description: 'Issue items from inventory',
    requiresCost: false
  },
  TRANSFER: {
    icon: ArrowRightIcon,
    color: '#3B82F6',
    label: 'Transfer',
    description: 'Transfer between branches',
    requiresCost: false
  },
  ADJUST: {
    icon: SettingsIcon,
    color: '#F59E0B',
    label: 'Adjustment',
    description: 'Adjust stock levels',
    requiresCost: true
  }
}

export function MovementModal({
  open,
  onClose,
  items,
  branches,
  currentBranch,
  onSave
}: MovementModalProps) {
  const [saving, setSaving] = useState(false)
  const [itemSearch, setItemSearch] = useState('')
  const [showItemPicker, setShowItemPicker] = useState<number | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger
  } = useForm<MovementForm>({
    resolver: zodResolver(MovementFormSchema),
    defaultValues: {
      type: 'RECEIPT',
      when_ts: new Date(),
      branch_id: currentBranch,
      reference: '',
      lines: []
    }
  })

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'lines'
  })

  const movementType = watch('type')
  const selectedBranch = watch('branch_id')
  const lines = watch('lines')

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      reset({
        type: 'RECEIPT',
        when_ts: new Date(),
        branch_id: currentBranch,
        reference: '',
        lines: []
      })
    }
  }, [open, reset, currentBranch])

  const onSubmit = async (data: MovementForm) => {
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

  const addLine = () => {
    append({
      item_id: '',
      item_name: '',
      qty: 1,
      unit_cost: undefined,
      note: ''
    })
  }

  const selectItem = (lineIndex: number, item: ItemWithStock) => {
    update(lineIndex, {
      ...fields[lineIndex],
      item_id: item.id,
      item_name: item.name,
      unit_cost: typeConfig[movementType].requiresCost ? item.avg_cost || 0 : undefined
    })
    setShowItemPicker(null)
    setItemSearch('')
  }

  const filteredItems = items.filter(
    item =>
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(itemSearch.toLowerCase()))
  )

  // Calculate totals
  const totalQty = lines.reduce((sum, line) => sum + (line.qty || 0), 0)
  const totalValue = lines.reduce((sum, line) => {
    const cost = line.unit_cost || 0
    return sum + (line.qty || 0) * cost
  }, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] p-0 overflow-hidden"
        style={{ backgroundColor: COLORS.charcoal, color: COLORS.lightText }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle style={{ color: COLORS.champagne }} className="text-xl">
            Create Inventory Movement
          </DialogTitle>
          <DialogDescription style={{ color: COLORS.lightText, opacity: 0.7 }}>
            Record stock movements and track inventory changes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <ScrollAreaDNA height="h-[calc(90vh-200px)]" className="px-6 py-4">
            <div className="space-y-6">
              {/* Movement Type Selection */}
              <div className="space-y-3">
                <label
                  className="text-sm font-medium uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  Movement Type
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(typeConfig).map(([type, config]) => {
                    const Icon = config.icon
                    const isSelected = movementType === type
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue('type', type as any)}
                        className={cn(
                          'p-4 rounded-lg border-2 transition-all',
                          isSelected
                            ? 'border-current shadow-lg'
                            : 'border-transparent hover:border-current/30'
                        )}
                        style={{
                          backgroundColor: isSelected ? config.color + '20' : COLORS.black + '30',
                          borderColor: isSelected ? config.color : 'transparent',
                          color: isSelected ? config.color : COLORS.lightText
                        }}
                      >
                        <Icon className="w-6 h-6 mx-auto mb-2" />
                        <div className="font-medium">{config.label}</div>
                        <div className="text-xs mt-1 opacity-70">{config.description}</div>
                      </button>
                    )
                  })}
                </div>
                {errors.type && <p className="text-sm text-red-400">{errors.type.message}</p>}
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <FormFieldDNA
                  type="datetime-local"
                  label="Date & Time"
                  value={format(watch('when_ts') || new Date(), "yyyy-MM-dd'T'HH:mm")}
                  onChange={value => setValue('when_ts', new Date(value))}
                  error={errors.when_ts?.message}
                  required
                />

                <FormFieldDNA
                  type="text"
                  label="Reference"
                  value={watch('reference') || ''}
                  onChange={value => setValue('reference', value)}
                  placeholder="e.g., PO-2024-001"
                  error={errors.reference?.message}
                />
              </div>

              {/* Branch Selection */}
              <div className="grid grid-cols-2 gap-4">
                {movementType === 'TRANSFER' ? (
                  <>
                    <FormFieldDNA
                      type="select"
                      label="From Branch"
                      value={watch('from_branch_id') || ''}
                      onChange={value => setValue('from_branch_id', value)}
                      options={branches.map(b => ({ value: b.id, label: b.name }))}
                      error={errors.from_branch_id?.message}
                      required
                    />
                    <FormFieldDNA
                      type="select"
                      label="To Branch"
                      value={watch('to_branch_id') || ''}
                      onChange={value => setValue('to_branch_id', value)}
                      options={branches.map(b => ({ value: b.id, label: b.name }))}
                      error={errors.to_branch_id?.message}
                      required
                    />
                  </>
                ) : (
                  <FormFieldDNA
                    type="select"
                    label="Branch"
                    value={watch('branch_id') || ''}
                    onChange={value => setValue('branch_id', value)}
                    options={branches.map(b => ({ value: b.id, label: b.name }))}
                    error={errors.branch_id?.message}
                    required
                  />
                )}
              </div>

              {/* Line Items */}
              <div
                className="space-y-4 pt-6 border-t"
                style={{ borderColor: COLORS.bronze + '33' }}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="font-medium flex items-center gap-2 text-sm uppercase tracking-wider"
                    style={{ color: COLORS.bronze }}
                  >
                    <Package className="w-4 h-4" />
                    Line Items
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLine}
                    className="gap-2"
                    style={{
                      borderColor: COLORS.bronze,
                      color: COLORS.champagne
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <div
                    className="text-center py-8 border-2 border-dashed rounded-lg"
                    style={{ borderColor: COLORS.bronze + '33' }}
                  >
                    <Package className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.bronze }} />
                    <p style={{ color: COLORS.lightText, opacity: 0.7 }}>
                      No items added yet. Click "Add Item" to start.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 rounded-lg border"
                        style={{
                          backgroundColor: COLORS.black + '30',
                          borderColor: COLORS.bronze + '33'
                        }}
                      >
                        <div className="grid grid-cols-12 gap-3">
                          {/* Item Selector */}
                          <div className="col-span-5 relative">
                            <label
                              className="text-xs uppercase tracking-wider"
                              style={{ color: COLORS.bronze }}
                            >
                              Item
                            </label>
                            <div className="mt-1 relative">
                              <input
                                type="text"
                                value={field.item_name}
                                onClick={() => setShowItemPicker(index)}
                                readOnly
                                placeholder="Click to select item"
                                className="w-full px-3 py-2 rounded-lg border cursor-pointer"
                                style={{
                                  backgroundColor: COLORS.charcoal,
                                  borderColor: COLORS.bronze + '33',
                                  color: COLORS.lightText
                                }}
                              />
                              {showItemPicker === index && (
                                <div
                                  className="absolute z-10 top-full mt-1 w-full rounded-lg border shadow-xl"
                                  style={{
                                    backgroundColor: COLORS.charcoal,
                                    borderColor: COLORS.bronze + '33',
                                    maxHeight: '300px'
                                  }}
                                >
                                  <div
                                    className="p-2 border-b"
                                    style={{ borderColor: COLORS.bronze + '33' }}
                                  >
                                    <input
                                      type="text"
                                      value={itemSearch}
                                      onChange={e => setItemSearch(e.target.value)}
                                      placeholder="Search items..."
                                      className="w-full px-3 py-1.5 rounded-md"
                                      style={{
                                        backgroundColor: COLORS.black,
                                        color: COLORS.lightText
                                      }}
                                      autoFocus
                                    />
                                  </div>
                                  <ScrollAreaDNA height="h-[250px]">
                                    {filteredItems.length === 0 ? (
                                      <div
                                        className="p-4 text-center"
                                        style={{ color: COLORS.lightText }}
                                      >
                                        No items found
                                      </div>
                                    ) : (
                                      filteredItems.map(item => (
                                        <button
                                          key={item.id}
                                          type="button"
                                          onClick={() => selectItem(index, item)}
                                          className="w-full px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <div style={{ color: COLORS.champagne }}>
                                                {item.name}
                                              </div>
                                              {item.sku && (
                                                <div
                                                  className="text-xs"
                                                  style={{ color: COLORS.lightText, opacity: 0.7 }}
                                                >
                                                  {item.sku}
                                                </div>
                                              )}
                                            </div>
                                            <div
                                              className="text-sm"
                                              style={{ color: COLORS.lightText }}
                                            >
                                              Stock: {item.on_hand || 0}
                                            </div>
                                          </div>
                                        </button>
                                      ))
                                    )}
                                  </ScrollAreaDNA>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quantity */}
                          <div className="col-span-2">
                            <FormFieldDNA
                              type="number"
                              label="Qty"
                              value={field.qty?.toString() || ''}
                              onChange={value => {
                                const qty = parseInt(value) || 0
                                update(index, { ...field, qty })
                              }}
                              min={1}
                              required
                            />
                          </div>

                          {/* Unit Cost */}
                          {typeConfig[movementType].requiresCost && (
                            <div className="col-span-2">
                              <FormFieldDNA
                                type="number"
                                label="Cost"
                                value={field.unit_cost?.toString() || ''}
                                onChange={value => {
                                  const cost = parseFloat(value) || 0
                                  update(index, { ...field, unit_cost: cost })
                                }}
                                min={0}
                                step={0.01}
                                required
                              />
                            </div>
                          )}

                          {/* Note */}
                          <div
                            className={cn(
                              typeConfig[movementType].requiresCost ? 'col-span-2' : 'col-span-4'
                            )}
                          >
                            <FormFieldDNA
                              type="text"
                              label="Note"
                              value={field.note || ''}
                              onChange={value => update(index, { ...field, note: value })}
                              placeholder="Optional"
                            />
                          </div>

                          {/* Remove */}
                          <div className="col-span-1 flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {errors.lines && <p className="text-sm text-red-400">{errors.lines.message}</p>}
              </div>

              {/* Summary Section */}
              {fields.length > 0 && (
                <div
                  className="mt-6 p-4 rounded-lg"
                  style={{
                    backgroundColor: COLORS.black + '20',
                    border: '1px solid ' + COLORS.bronze + '33'
                  }}
                >
                  <h3 className="font-medium mb-3" style={{ color: COLORS.champagne }}>
                    Movement Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.bronze }}
                      >
                        Total Items
                      </p>
                      <p className="text-lg font-medium mt-1" style={{ color: COLORS.lightText }}>
                        {fields.length}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.bronze }}
                      >
                        Total Quantity
                      </p>
                      <p className="text-lg font-medium mt-1" style={{ color: COLORS.lightText }}>
                        {totalQty}
                      </p>
                    </div>
                    {typeConfig[movementType].requiresCost && (
                      <div>
                        <p
                          className="text-xs uppercase tracking-wider"
                          style={{ color: COLORS.bronze }}
                        >
                          Total Value
                        </p>
                        <p className="text-lg font-medium mt-1" style={{ color: COLORS.champagne }}>
                          {formatCurrency(totalValue)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Journal Preview */}
              {fields.length > 0 && (
                <div
                  className="mt-4 p-4 rounded-lg"
                  style={{
                    backgroundColor: COLORS.black + '10',
                    border: '1px solid ' + COLORS.bronze + '20'
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4" style={{ color: COLORS.bronze }} />
                    <h4 className="font-medium" style={{ color: COLORS.champagne }}>
                      Journal Entry Preview
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {movementType === 'RECEIPT' && (
                      <>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.lightText }}>DR: Inventory</span>
                          <span style={{ color: COLORS.champagne }}>
                            {formatCurrency(totalValue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.lightText }}>CR: Accounts Payable</span>
                          <span style={{ color: COLORS.champagne }}>
                            {formatCurrency(totalValue)}
                          </span>
                        </div>
                      </>
                    )}
                    {movementType === 'ISSUE' && (
                      <>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.lightText }}>DR: Cost of Goods Sold</span>
                          <span style={{ color: COLORS.champagne }}>
                            {formatCurrency(totalValue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.lightText }}>CR: Inventory</span>
                          <span style={{ color: COLORS.champagne }}>
                            {formatCurrency(totalValue)}
                          </span>
                        </div>
                      </>
                    )}
                    {movementType === 'ADJUST' && totalValue !== 0 && (
                      <>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.lightText }}>
                            DR: {totalValue > 0 ? 'Inventory' : 'Inventory Variance'}
                          </span>
                          <span style={{ color: COLORS.champagne }}>
                            {formatCurrency(Math.abs(totalValue))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.lightText }}>
                            CR: {totalValue > 0 ? 'Inventory Variance' : 'Inventory'}
                          </span>
                          <span style={{ color: COLORS.champagne }}>
                            {formatCurrency(Math.abs(totalValue))}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
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
              loadingText="Posting..."
              className="min-w-[140px]"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                color: COLORS.black,
                fontWeight: '600'
              }}
              disabled={fields.length === 0}
            >
              Post Movement
            </PrimaryButtonDNA>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
