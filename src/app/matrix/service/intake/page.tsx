'use client'

import React from 'react'
import { useEmitTxn, useHera } from '@/lib/hooks/hera'

export default function ServiceIntakePage() {
  const { auth } = useHera()
  const emit = useEmitTxn()

  const [branchId, setBranchId] = React.useState('')
  const [customerId, setCustomerId] = React.useState('')
  const [deviceDesc, setDeviceDesc] = React.useState('')
  const [imei, setImei] = React.useState('')
  const [issue, setIssue] = React.useState('')
  const [notice, setNotice] = React.useState<string | null>(null)

  async function submit() {
    setNotice(null)
    try {
      const res = await emit.mutateAsync({
        organization_id: auth.organization_id,
        smart_code: 'HERA.ITD.SVC.INTAKE.POST.V1',
        transaction_type: 'SERVICE',
        header: {
          date: new Date().toISOString(),
          branch_id: branchId,
          customer_id: customerId,
          memo: 'Service Intake'
        },
        lines: [
          {
            line_number: 1,
            line_type: 'SERVICE',
            metadata: { device_description: deviceDesc, imei, issue }
          }
        ]
      })
      setNotice(`Intake created: ${(res as any)?.transaction_id || 'ok'}`)
      setDeviceDesc('')
      setImei('')
      setIssue('')
    } catch (e: any) {
      setNotice(e?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-3 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="border rounded px-2 py-2" placeholder="Branch ID" value={branchId} onChange={e => setBranchId(e.target.value)} />
        <input className="border rounded px-2 py-2" placeholder="Customer ID" value={customerId} onChange={e => setCustomerId(e.target.value)} />
      </div>
      <input className="border rounded px-2 py-2 w-full" placeholder="Device Description" value={deviceDesc} onChange={e => setDeviceDesc(e.target.value)} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="border rounded px-2 py-2" placeholder="IMEI/Serial" value={imei} onChange={e => setImei(e.target.value)} />
        <input className="border rounded px-2 py-2" placeholder="Issue" value={issue} onChange={e => setIssue(e.target.value)} />
      </div>
      <button className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={submit} disabled={emit.isLoading}>
        {emit.isLoading ? 'Submitting…' : 'Create Intake'}
      </button>
      {notice && <div className="text-sm text-muted-foreground">{notice}</div>}
    </div>
  )
}

