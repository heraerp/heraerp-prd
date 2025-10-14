'use client'

import React from 'react'
import { useEntitiesList, useEntityUpsert, useHera } from '@/lib/hooks/hera'

export default function AdminPage() {
  const { auth } = useHera()
  const { data, isLoading, refetch } = useEntitiesList({ entity_type: 'ROLE', page: 1, page_size: 50 })
  const upsert = useEntityUpsert()
  const [roleName, setRoleName] = React.useState('')

  async function addRole() {
    await upsert.mutateAsync({
      organization_id: auth.organization_id,
      entity_type: 'ROLE',
      primary: { name: roleName, code: roleName.toUpperCase() }
    })
    setRoleName('')
    refetch()
  }

  const items = (data as any)?.items || []
  return (
    <div className="space-y-3 max-w-xl">
      <h2 className="text-lg font-semibold">Admin • Roles</h2>
      <div className="flex gap-2">
        <input className="border rounded px-2 py-2 flex-1" placeholder="New role name" value={roleName} onChange={e => setRoleName(e.target.value)} />
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={addRole} disabled={!roleName || upsert.isLoading}>
          Add
        </button>
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <ul className="space-y-1">
          {items.map((r: any) => (
            <li key={r.id || r.entity_id} className="border rounded p-2 flex justify-between">
              <span>{r.entity_name}</span>
              <span className="text-xs text-muted-foreground">{r.entity_code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

