'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Category } from '@/types/salon-category'
import { Loader2, Save, X, Tag, FileText, Palette, Hash, Sparkles } from 'lucide-react'
import {
  PrimaryButtonDNA,
  SecondaryButtonDNA,
  FormFieldDNA,
  ScrollAreaDNA,
  BadgeDNA
} from '@/lib/dna/components/ui'
import * as Icons from 'lucide-react'

// Form validation schema
const CategoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  code: z.string().optional(),
  description: z.string().max(200, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  icon: z.string().min(1, 'Icon is required'),
  sort_order: z.number().int().min(0)
})

type CategoryForm = z.infer<typeof CategoryFormSchema>

interface CategoryModalProps {
  open: boolean
  onClose: () => void
  category?: Category | null
  onSave: (data: CategoryForm) => Promise<void>
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

// Predefined colors for categories
const PRESET_COLORS = [
  '#D4AF37', // Gold
  '#8C7853', // Bronze
  '#E8B4B8', // Rose
  '#B794F4', // Purple
  '#0F6F5C', // Emerald
  '#4A90E2', // Blue
  '#F39C12', // Orange
  '#E74C3C', // Red
  '#95A5A6', // Gray
  '#27AE60' // Green
]

// Available icons for categories
const AVAILABLE_ICONS = [
  'Tag',
  'Scissors',
  'Sparkles',
  'Star',
  'Heart',
  'Palette',
  'Brush',
  'Droplet',
  'Sun',
  'Moon',
  'Zap',
  'Flame',
  'Gift',
  'Crown',
  'Diamond'
]

export function CategoryModal({ open, onClose, category, onSave }: CategoryModalProps) {
  const [saving, setSaving] = React.useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CategoryForm>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      color: '#D4AF37',
      icon: 'Tag',
      sort_order: 0
    }
  })

  // Watch form values for preview
  const watchedColor = watch('color')
  const watchedIcon = watch('icon')
  const watchedName = watch('name')

  // Reset form when category changes or modal opens/closes
  React.useEffect(() => {
    if (open) {
      if (category) {
        reset({
          name: category.entity_name,
          code: category.entity_code || '',
          description: category.description || '',
          color: category.color || '#D4AF37',
          icon: category.icon || 'Tag',
          sort_order: category.sort_order || 0
        })
      } else {
        reset({
          name: '',
          code: '',
          description: '',
          color: '#D4AF37',
          icon: 'Tag',
          sort_order: 0
        })
      }
    }
  }, [category, open, reset])

  const onSubmit = async (data: CategoryForm) => {
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

  // Get icon component
  const IconComponent = (Icons as any)[watchedIcon] || Icons.Tag

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
                <Tag className="w-5 h-5" style={{ color: COLORS.gold }} />
                {category ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
              <DialogDescription style={{ color: COLORS.lightText, opacity: 0.7 }} className="mt-1">
                Configure category details and appearance
              </DialogDescription>
            </div>
            {category && (
              <BadgeDNA variant="secondary" className="ml-4">
                ID: {category.entity_code || category.id.slice(0, 8)}
              </BadgeDNA>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <ScrollAreaDNA height="h-[calc(90vh-200px)]" className="px-6 py-4">
            <div className="space-y-6">
              {/* Preview Card */}
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: COLORS.black + '40',
                  borderColor: watchedColor + '40'
                }}
              >
                <Label
                  className="text-xs uppercase tracking-wider mb-3 block"
                  style={{ color: COLORS.bronze }}
                >
                  Preview
                </Label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: watchedColor + '20',
                      border: `1px solid ${watchedColor}`
                    }}
                  >
                    <IconComponent className="w-6 h-6" style={{ color: watchedColor }} />
                  </div>
                  <div>
                    <h3 className="font-medium" style={{ color: COLORS.champagne }}>
                      {watchedName || 'Category Name'}
                    </h3>
                    <p className="text-sm opacity-60">
                      {category ? `${category.service_count} services` : 'New category'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3
                  className="font-medium flex items-center gap-2 text-sm uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  <FileText className="w-4 h-4" />
                  Basic Information
                </h3>

                <FormFieldDNA
                  type="text"
                  label="Category Name"
                  value={watch('name')}
                  onChange={value => setValue('name', value)}
                  error={errors.name?.message}
                  required
                  placeholder="e.g., Hair Color"
                />

                <FormFieldDNA
                  type="text"
                  label="Category Code"
                  value={watch('code')}
                  onChange={value => setValue('code', value)}
                  error={errors.code?.message}
                  placeholder="Auto-generated if empty"
                  helper="Unique identifier for the category"
                  icon={Hash}
                />

                <FormFieldDNA
                  type="textarea"
                  label="Description"
                  value={watch('description') || ''}
                  onChange={value => setValue('description', value)}
                  error={errors.description?.message}
                  placeholder="Brief description of this category"
                  rows={2}
                />
              </div>

              {/* Appearance */}
              <div className="space-y-4">
                <h3
                  className="font-medium flex items-center gap-2 text-sm uppercase tracking-wider"
                  style={{ color: COLORS.bronze }}
                >
                  <Palette className="w-4 h-4" />
                  Appearance
                </h3>

                {/* Color Selection */}
                <div>
                  <Label className="text-sm mb-2 block">Category Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue('color', color)}
                        className="w-10 h-10 rounded-lg border-2 transition-all"
                        style={{
                          backgroundColor: color,
                          borderColor: watchedColor === color ? COLORS.champagne : 'transparent',
                          transform: watchedColor === color ? 'scale(1.1)' : 'scale(1)'
                        }}
                      />
                    ))}
                    <Controller
                      name="color"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="color"
                          {...field}
                          className="w-10 h-10 rounded-lg cursor-pointer"
                          style={{ backgroundColor: COLORS.black }}
                        />
                      )}
                    />
                  </div>
                  {errors.color && (
                    <p className="text-sm text-red-500 mt-1">{errors.color.message}</p>
                  )}
                </div>

                {/* Icon Selection */}
                <div>
                  <Label className="text-sm mb-2 block">Category Icon</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {AVAILABLE_ICONS.map(iconName => {
                      const Icon = (Icons as any)[iconName]
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setValue('icon', iconName)}
                          className="p-3 rounded-lg border transition-all"
                          style={{
                            backgroundColor:
                              watchedIcon === iconName ? watchedColor + '20' : COLORS.black + '40',
                            borderColor:
                              watchedIcon === iconName ? watchedColor : COLORS.bronze + '33'
                          }}
                        >
                          <Icon
                            className="w-5 h-5 mx-auto"
                            style={{
                              color: watchedIcon === iconName ? watchedColor : COLORS.lightText
                            }}
                          />
                        </button>
                      )
                    })}
                  </div>
                  {errors.icon && (
                    <p className="text-sm text-red-500 mt-1">{errors.icon.message}</p>
                  )}
                </div>

                {/* Sort Order */}
                <FormFieldDNA
                  type="number"
                  label="Sort Order"
                  value={watch('sort_order').toString()}
                  onChange={value => setValue('sort_order', parseInt(value) || 0)}
                  error={errors.sort_order?.message}
                  min={0}
                  helper="Lower numbers appear first"
                />
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
                      HERA.SALON.SVC.CATEGORY.MASTER.V1
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
              {category ? 'Update Category' : 'Create Category'}
            </PrimaryButtonDNA>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
