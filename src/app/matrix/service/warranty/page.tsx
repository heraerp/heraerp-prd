'use client'

import React from 'react'
import { useEmitTxn, useHera } from '@/lib/hooks/hera'

export default function ServiceWarrantyPage() {
  const { auth } = useHera()
  const emit = useEmitTxn()
  const [deviceId, setDeviceId] = React.useState('')
  const [customerId, setCustomerId] = React.useState('')
  const [notice, setNotice] = React.useState<string | null>(null)

  async function createWarranty() {
    setNotice(null)
    try {
      const res = await emit.mutateAsync({
        organization_id: auth.organization_id,
        smart_code: 'HERA.ITD.SVC.WARRANTY.POST.V1',
        transaction_type: 'SERVICE',
        header: { date: new Date().toISOString(), customer_id: customerId, memo: 'Warranty' },
        lines: [{ line_number: 1, line_type: 'SERVICE', metadata: { device_id: deviceId } }]
      })
      setNotice(`Warranty record created: ${(res as any)?.transaction_id || 'ok'}`)
    } catch (e: any) {
      setNotice(e?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-3 max-w-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input className="border rounded px-2 py-2" placeholder="Device Entity ID" value={deviceId} onChange={e => setDeviceId(e.target.value)} />
        <input className="border rounded px-2 py-2" placeholder="Customer ID" value={customerId} onChange={e => setCustomerId(e.target.value)} />
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={createWarranty} disabled={emit.isLoading}>
          {emit.isLoading ? 'Creating…' : 'Create Warranty'}
        </button>
      </div>
      {notice && <div className="text-sm text-muted-foreground">{notice}</div>}
    </div>
  )
}

