'use client'

import React from 'react'
import { useEntitiesList, useEntityUpsert, useHera } from '@/lib/hooks/hera'

export default function InventoryCatalogPage() {
  const { auth } = useHera()
  const [search, setSearch] = React.useState('')
  const { data, isLoading } = useEntitiesList({
    entity_type: 'PRODUCT',
    search,
    page: 1,
    page_size: 50
  })
  const upsert = useEntityUpsert()

  const items = (data as any)?.items || []

  async function onSaveRow(row: any) {
    await upsert.mutateAsync({
      organization_id: auth.organization_id,
      entity_type: 'PRODUCT',
      primary: {
        entity_id: row.entity_id || row.id,
        name: row.entity_name || row.name,
        sku: row.entity_code || row.sku,
        brand: row.brand
      },
      dynamic: {
        category: row.category,
        reorder_point: row.reorder_point
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Search products by name, code, or serial"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 border-b">Name</th>
                <th className="text-left p-2 border-b">Code</th>
                <th className="text-left p-2 border-b">Brand</th>
                <th className="text-left p-2 border-b">Category</th>
                <th className="text-left p-2 border-b">Reorder Point</th>
                <th className="text-left p-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any) => (
                <EditableRow key={it.id || it.entity_id} row={it} onSave={onSaveRow} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function EditableRow({ row, onSave }: { row: any; onSave: (r: any) => Promise<void> }) {
  const [state, setState] = React.useState(() => ({
    name: row.entity_name || row.name || '',
    code: row.entity_code || row.sku || '',
    brand: row.brand || '',
    category: row.attributes?.category || row.category || '',
    reorder_point: row.attributes?.reorder_point || row.reorder_point || ''
  }))
  const [saving, setSaving] = React.useState(false)

  async function save() {
    setSaving(true)
    try {
      await onSave({ ...row, ...state })
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="border-b">
      <td className="p-2">
        <input
          className="border rounded px-2 py-1 w-full"
          value={state.name}
          onChange={e => setState(s => ({ ...s, name: e.target.value }))}
        />
      </td>
      <td className="p-2">
        <input
          className="border rounded px-2 py-1 w-full"
          value={state.code}
          onChange={e => setState(s => ({ ...s, code: e.target.value }))}
        />
      </td>
      <td className="p-2">
        <input
          className="border rounded px-2 py-1 w-full"
          value={state.brand}
          onChange={e => setState(s => ({ ...s, brand: e.target.value }))}
        />
      </td>
      <td className="p-2">
        <input
          className="border rounded px-2 py-1 w-full"
          value={state.category}
          onChange={e => setState(s => ({ ...s, category: e.target.value }))}
        />
      </td>
      <td className="p-2">
        <input
          className="border rounded px-2 py-1 w-28"
          value={state.reorder_point}
          onChange={e => setState(s => ({ ...s, reorder_point: e.target.value }))}
        />
      </td>
      <td className="p-2">
        <button onClick={save} className="px-3 py-1 rounded bg-primary text-primary-foreground" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </td>
    </tr>
  )
}

