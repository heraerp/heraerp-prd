// src/ui/components/FilterBar.tsx
import React from 'react'

export function FilterBar({
  value,
  onChange,
  fields = ['q', 'status', 'date_from', 'date_to']
}: {
  value: Record<string, any>
  onChange: (v: Record<string, any>) => void
  fields?: Array<'q' | 'status' | 'date_from' | 'date_to'>
}) {
  const update = (k: string, v: any) => onChange({ ...value, [k]: v || undefined })

  return (
    <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
      {fields.includes('q') && (
        <input
          placeholder="Search…"
          className="rounded-lg border px-3 py-2"
          value={value.q ?? ''}
          onChange={e => update('q', e.target.value)}
        />
      )}
      {fields.includes('status') && (
        <select
          className="rounded-lg border px-3 py-2"
          value={value.status ?? ''}
          onChange={e => update('status', e.target.value || undefined)}
        >
          <option value="">All Status</option>
          {['draft', 'pending', 'approved', 'completed', 'cancelled'].map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
      {fields.includes('date_from') && (
        <input
          type="date"
          className="rounded-lg border px-3 py-2"
          value={value.date_from?.slice(0, 10) ?? ''}
          onChange={e =>
            update('date_from', e.target.value ? new Date(e.target.value).toISOString() : undefined)
          }
        />
      )}
      {fields.includes('date_to') && (
        <input
          type="date"
          className="rounded-lg border px-3 py-2"
          value={value.date_to?.slice(0, 10) ?? ''}
          onChange={e =>
            update('date_to', e.target.value ? new Date(e.target.value).toISOString() : undefined)
          }
        />
      )}
    </div>
  )
}
