"use client"

import React, { useMemo } from 'react'
import { useHera } from '@/lib/hooks/hera'

export default function MatrixHomePage() {
  const { client, auth } = useHera()
  const now = useMemo(() => new Date(), [])
  const from = new Date(now)
  from.setHours(0, 0, 0, 0)

  const [tiles, setTiles] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    if (!auth.organization_id) return
    setLoading(true)
    client
      .analyticsTiles({
        organization_id: auth.organization_id,
        from: from.toISOString(),
        to: now.toISOString()
      })
      .then(res => {
        if (mounted) setTiles(res)
      })
      .catch(e => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [auth.organization_id, client, from, now])

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {loading && <div className="text-sm text-muted-foreground">Loading KPIs…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {tiles?.tiles?.map((t: any) => (
        <div key={t.key} className="rounded border p-4 bg-card">
          <div className="text-xs text-muted-foreground">{t.key}</div>
          <div className="text-2xl font-semibold mt-1">
            {typeof t.value === 'number' ? t.value.toLocaleString() : String(t.value)}
          </div>
        </div>
      ))}
    </div>
  )
}
