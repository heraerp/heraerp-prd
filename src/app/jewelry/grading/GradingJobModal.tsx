'use client'

import React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { GRADING_JOB_PRESET } from '@/hooks/entityPresets'
import '@/styles/jewelry-glassmorphism.css'

type Mode = 'create' | 'edit'

const schema = z.object({
  entity_name: z.string().min(1, 'Name is required'),
  status: z.enum(['pipeline', 'in_progress', 'graded', 'pending_review']).default('pipeline'),
  priority: z.enum(['low', 'normal', 'urgent']).default('normal'),
  carat: z.coerce.number().min(0).optional(),
  cut: z.enum(['EX', 'VG', 'G', 'F']).optional(),
  color: z.enum(['D', 'E', 'F', 'G', 'H', 'I', 'J']).optional(),
  clarity: z.enum(['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1']).optional(),
  measurements: z.string().optional(),
  itemId: z.string().uuid().optional(),
  graderId: z.string().uuid().optional()
})

export interface GradingJobModalProps {
  open: boolean
  mode: Mode
  onClose: () => void
  entity?: any | null
}

export default function GradingJobModal({ open, mode, onClose, entity }: GradingJobModalProps) {
  const { create, update, isCreating, isUpdating } = useUniversalEntity({
    entity_type: GRADING_JOB_PRESET.entity_type,
    dynamicFields: GRADING_JOB_PRESET.dynamicFields,
    relationships: GRADING_JOB_PRESET.relationships,
    filters: { include_dynamic: true, limit: 1 }
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      entity_name: entity?.entity_name ?? '',
      status: entity?.dynamic_fields?.status?.value ?? entity?.dynamic_fields?.status ?? 'pipeline',
      priority:
        entity?.dynamic_fields?.priority?.value ?? entity?.dynamic_fields?.priority ?? 'normal',
      carat:
        Number(entity?.dynamic_fields?.carat?.value ?? entity?.dynamic_fields?.carat ?? 0) ||
        undefined,
      cut: entity?.dynamic_fields?.cut?.value ?? entity?.dynamic_fields?.cut,
      color: entity?.dynamic_fields?.color?.value ?? entity?.dynamic_fields?.color,
      clarity: entity?.dynamic_fields?.clarity?.value ?? entity?.dynamic_fields?.clarity,
      measurements:
        entity?.dynamic_fields?.measurements?.value ?? entity?.dynamic_fields?.measurements
    }
  })

  useEffect(() => {
    if (!open) return
    reset({
      entity_name: entity?.entity_name ?? '',
      status: entity?.dynamic_fields?.status?.value ?? entity?.dynamic_fields?.status ?? 'pipeline',
      priority:
        entity?.dynamic_fields?.priority?.value ?? entity?.dynamic_fields?.priority ?? 'normal',
      carat:
        Number(entity?.dynamic_fields?.carat?.value ?? entity?.dynamic_fields?.carat ?? 0) ||
        undefined,
      cut: entity?.dynamic_fields?.cut?.value ?? entity?.dynamic_fields?.cut,
      color: entity?.dynamic_fields?.color?.value ?? entity?.dynamic_fields?.color,
      clarity: entity?.dynamic_fields?.clarity?.value ?? entity?.dynamic_fields?.clarity,
      measurements:
        entity?.dynamic_fields?.measurements?.value ?? entity?.dynamic_fields?.measurements
    })
  }, [open, entity, reset])

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const relationships_patch: Record<string, string[]> = {}
    if (values.itemId) relationships_patch['OF_ITEM'] = [values.itemId]
    if (values.graderId) relationships_patch['ASSIGNED_TO'] = [values.graderId]

    if (mode === 'create') {
      await create({
        entity_type: 'GRADING_JOB',
        entity_name: values.entity_name,
        smart_code: 'HERA.JEWELRY.GRADING.ENTITY.JOB.V1',
        dynamic_fields: {
          status: {
            value: values.status,
            type: 'text',
            smart_code: 'HERA.JEWELRY.GRADING.DYN.STATUS.V1'
          },
          priority: {
            value: values.priority,
            type: 'text',
            smart_code: 'HERA.JEWELRY.GRADING.DYN.PRIORITY.V1'
          },
          ...(values.carat != null
            ? {
                carat: {
                  value: values.carat,
                  type: 'number',
                  smart_code: 'HERA.JEWELRY.GRADING.DYN.CARAT.V1'
                }
              }
            : {}),
          ...(values.cut
            ? {
                cut: {
                  value: values.cut,
                  type: 'text',
                  smart_code: 'HERA.JEWELRY.GRADING.DYN.CUT.V1'
                }
              }
            : {}),
          ...(values.color
            ? {
                color: {
                  value: values.color,
                  type: 'text',
                  smart_code: 'HERA.JEWELRY.GRADING.DYN.COLOR.V1'
                }
              }
            : {}),
          ...(values.clarity
            ? {
                clarity: {
                  value: values.clarity,
                  type: 'text',
                  smart_code: 'HERA.JEWELRY.GRADING.DYN.CLARITY.V1'
                }
              }
            : {}),
          ...(values.measurements
            ? {
                measurements: {
                  value: values.measurements,
                  type: 'text',
                  smart_code: 'HERA.JEWELRY.GRADING.DYN.MEASUREMENTS.V1'
                }
              }
            : {})
        },
        metadata: Object.keys(relationships_patch).length
          ? { relationships: relationships_patch }
          : undefined
      })
    } else if (entity?.id || entity?.entity_id) {
      await update({
        entity_id: entity.id || entity.entity_id,
        entity_name: values.entity_name,
        dynamic_patch: {
          status: values.status,
          priority: values.priority,
          ...(values.carat != null ? { carat: values.carat } : {}),
          ...(values.cut ? { cut: values.cut } : {}),
          ...(values.color ? { color: values.color } : {}),
          ...(values.clarity ? { clarity: values.clarity } : {}),
          ...(values.measurements ? { measurements: values.measurements } : {})
        },
        relationships_patch: relationships_patch
      })
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-full max-w-xl rounded-2xl p-6 jewelry-glass-panel">
        <h3 className="text-lg font-semibold mb-4">
          {mode === 'create' ? 'New Grading Job' : 'Edit Grading Job'}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="jewelry-text-high-contrast">Name</label>
            <input {...register('entity_name')} className="w-full rounded-xl p-2 bg-white/10" />
            {errors.entity_name && (
              <p className="text-red-400 text-sm">{errors.entity_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Status</label>
              <select {...register('status')} className="w-full rounded-xl p-2 bg-white/10">
                <option value="pipeline">Pipeline</option>
                <option value="in_progress">In Progress</option>
                <option value="graded">Graded</option>
                <option value="pending_review">Pending Review</option>
              </select>
            </div>
            <div>
              <label>Priority</label>
              <select {...register('priority')} className="w-full rounded-xl p-2 bg-white/10">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label>Carat</label>
              <input
                type="number"
                step="0.01"
                {...register('carat')}
                className="w-full rounded-xl p-2 bg-white/10"
              />
            </div>
            <div>
              <label>Cut</label>
              <select {...register('cut')} className="w-full rounded-xl p-2 bg-white/10">
                <option value="">—</option>
                <option value="EX">EX</option>
                <option value="VG">VG</option>
                <option value="G">G</option>
                <option value="F">F</option>
              </select>
            </div>
            <div>
              <label>Color</label>
              <select {...register('color')} className="w-full rounded-xl p-2 bg-white/10">
                {['', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(c => (
                  <option key={c} value={c}>
                    {c || '—'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Clarity</label>
              <select {...register('clarity')} className="w-full rounded-xl p-2 bg-white/10">
                {['', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'].map(c => (
                  <option key={c} value={c}>
                    {c || '—'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label>Measurements</label>
            <input {...register('measurements')} className="w-full rounded-xl p-2 bg-white/10" />
          </div>

          {/* Optional relationship inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Item ID (OF_ITEM)</label>
              <input
                {...register('itemId')}
                className="w-full rounded-xl p-2 bg-white/10"
                placeholder="UUID"
              />
            </div>
            <div>
              <label>Grader ID (ASSIGNED_TO)</label>
              <input
                {...register('graderId')}
                className="w-full rounded-xl p-2 bg-white/10"
                placeholder="UUID"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl bg-white/10">
              Cancel
            </button>
            <button
              disabled={isCreating || isUpdating}
              className="px-4 py-2 rounded-xl jewelry-btn-primary"
            >
              {mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
