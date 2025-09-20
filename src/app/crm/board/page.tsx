'use client'

import React, { useEffect, useState } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { listStages } from '@/lib/playbook/crm/lookups'
import { playbookCrmApi } from '@/lib/api/playbook-crm'
import { Button } from '@/components/ui/button'

export default function CRMPipelineBoard() {
  const { currentOrganization, isAuthenticated, isLoading } = useMultiOrgAuth()
  const [stages, setStages] = useState<{ id: string; name: string }[]>([])
  const [columns, setColumns] = useState<Record<string, any[]>>({})
  const [dragged, setDragged] = useState<{ id: string; from: string } | null>(null)

  const orgId = currentOrganization?.id

  useEffect(() => {
    if (!orgId || !isAuthenticated) return
    ;(async () => {
      const s = await listStages(orgId)
      setStages(s)
      const byStage: Record<string, any[]> = {}
      for (const st of s) {
        const opps = await playbookCrmApi.opportunities({ orgId, stage: [st.id], page: 1, pageSize: 50 })
        byStage[st.id] = opps.items
      }
      setColumns(byStage)
    })()
  }, [orgId, isAuthenticated])

  const onDragStart = (id: string, from: string) => setDragged({ id, from })
  const onDrop = async (toStage: string) => {
    if (!dragged || !orgId) return
    const { id, from } = dragged
    if (from === toStage) return setDragged(null)
    // optimistic move
    setColumns(prev => {
      const next = { ...prev }
      next[from] = (next[from] || []).filter((o: any) => o.id !== id)
      const moved = Object.values(prev).flat().find((o: any) => o.id === id)
      next[toStage] = [{ ...(moved || { id, entity_name: 'Unknown' }), stage: toStage }, ...(next[toStage] || [])]
      return next
    })
    try {
      const payload = {
        orgId,
        smart_code: 'HERA.CRM.OPPORTUNITY.STAGE_CHANGED.V1',
        idempotency_key: `opp-stage-${id}-${toStage}`,
        actor_user_id: 'actor-unknown',
        opportunity_id: id,
        to_stage: toStage,
      }
      const res = await fetch('/api/playbook/crm/opportunity/update-stage', { method: 'POST', body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Update failed')
    } catch (e) {
      // revert on failure
      setColumns(prev => {
        const next = { ...prev }
        next[toStage] = (next[toStage] || []).filter((o: any) => o.id !== dragged.id)
        // naive: do not restore exact order
        const moved = Object.values(prev).flat().find((o: any) => o.id === dragged.id)
        next[dragged.from] = [moved || { id: dragged.id }, ...(next[dragged.from] || [])]
        return next
      })
    } finally {
      setDragged(null)
    }
  }

  if (isLoading) return null
  if (!orgId) return <div className="p-6">No organization</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">CRM Pipeline</h1>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(1, stages.length)}, minmax(240px, 1fr))` }}>
        {stages.map((st) => (
          <div key={st.id} className="rounded-lg border bg-background/5 p-3"
               onDragOver={(e) => e.preventDefault()}
               onDrop={() => onDrop(st.id)}>
            <div className="font-semibold mb-2">{st.name}</div>
            <div className="space-y-2 min-h-[100px]">
              {(columns[st.id] || []).map((opp) => (
                <div key={opp.id}
                     draggable
                     onDragStart={() => onDragStart(opp.id, st.id)}
                     className="p-3 rounded-md border bg-background/10 cursor-move">
                  <div className="font-medium">{opp.entity_name}</div>
                  <div className="text-xs text-muted-foreground">${(opp.amount || 0).toLocaleString()} • {opp.stage || st.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
