'use client'

import React from 'react'
import { useHera } from '@/lib/hooks/hera'

export default function StockByBranchPage() {
  const { client, auth } = useHera()
  const [branch, setBranch] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const res = await client.stockByBranch({ organization_id: auth.organization_id, branch_id: branch || undefined, search: search || undefined })
      setData(res)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input className="border rounded px-2 py-2" placeholder="Branch ID (optional)" value={branch} onChange={e => setBranch(e.target.value)} />
        <input className="border rounded px-2 py-2" placeholder="Search product" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={run} disabled={loading}>
          {loading ? 'Loading…' : 'Run'}
        </button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Branch</th>
              <th className="text-left p-2 border-b">Product</th>
              <th className="text-left p-2 border-b">Qty</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((r: any, idx: number) => (
              <tr key={idx} className="border-b">
                <td className="p-2">{r.branch_id}</td>
                <td className="p-2">{r.product_code}</td>
                <td className="p-2">{r.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

