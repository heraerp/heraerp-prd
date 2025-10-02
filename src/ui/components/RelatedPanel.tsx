// src/ui/components/RelatedPanel.tsx
import React from 'react'
import { useRelationships } from '../hooks/useHera'

export function RelatedPanel({ fromId, toId }: { fromId?: string; toId?: string }) {
  const { data, isLoading } = useRelationships({
    p_from_entity_id: fromId,
    p_to_entity_id: toId
  })

  if (isLoading) return <div className="text-sm text-gray-500">Loading related…</div>
  if (!data?.length) return null

  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-2 text-sm font-medium text-gray-700">Related</div>
      <ul className="space-y-1 text-sm">
        {data.map((r: any) => (
          <li key={r.id} className="flex items-center justify-between">
            <span className="text-gray-800">{r.relationship_type}</span>
            <span className="text-gray-500">
              {r.from_entity_name} → {r.to_entity_name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
