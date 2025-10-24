'use client'

import React from 'react'
import { useEntitiesList, useEntityUpsert, useHera } from '@/lib/hooks/hera'

export default function VendorsPage() {
  const { auth } = useHera()
  const [search, setSearch] = React.useState('')
  const { data, isLoading, refetch } = useEntitiesList({ entity_type: 'VENDOR', search, page: 1, page_size: 50 })
  const upsert = useEntityUpsert()
  const items = (data as any)?.items || []

  const [name, setName] = React.useState('')
  const [code, setCode] = React.useState('')

  async function addVendor() {
    await upsert.mutateAsync({
      organization_id: auth.organization_id,
      entity_type: 'VENDOR',
      primary: { name, code }
    })
    setName('')
    setCode('')
    refetch()
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="border rounded px-2 py-2 w-full" placeholder="Search vendors" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <input className="border rounded px-2 py-2" placeholder="Vendor Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="border rounded px-2 py-2" placeholder="Code" value={code} onChange={e => setCode(e.target.value)} />
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={addVendor} disabled={!name || !code || upsert.isLoading}>Add</button>
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <ul className="space-y-1">
          {items.map((v: any) => (
            <li key={v.id || v.entity_id} className="border rounded p-2 flex justify-between">
              <span>{v.entity_name}</span>
              <span className="text-xs text-muted-foreground">{v.entity_code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

