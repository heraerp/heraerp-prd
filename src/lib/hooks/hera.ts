'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HeraClient, type ListParams, type UpsertEntityInput, type EmitTxnInput } from '@/lib/heraClient'
import { HeraClientMock } from '@/lib/heraClient.mock'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export function useHera() {
  const authCtx = useHERAAuth()
  const accessToken = authCtx?.session?.access_token || ''
  const organization_id = authCtx?.currentOrganization?.id || authCtx?.organization?.id || ''
  const roles = authCtx?.roles || authCtx?.userRoles || []

  const client = useMemo(() => {
    const useMock = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_HERA_MOCK === '1'
    if (useMock) return new HeraClientMock({ accessToken, organization_id, roles }) as any
    return new HeraClient({ accessToken, organization_id, roles })
  }, [accessToken, organization_id, Array.isArray(roles) ? roles.join(',') : '', process.env.NEXT_PUBLIC_HERA_MOCK])

  return { client, auth: { accessToken, organization_id, roles } }
}

export function useEntitiesList(params: Omit<ListParams, 'organization_id'> & { enabled?: boolean }) {
  const { client, auth } = useHera()
  const effective = { ...params, organization_id: auth.organization_id }
  return useQuery({
    queryKey: ['entities', effective],
    queryFn: () => client.listEntities(effective as ListParams),
    enabled: !!auth.organization_id && (params.enabled ?? true)
  })
}

export function useEntityUpsert() {
  const { client, auth } = useHera()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: Omit<UpsertEntityInput, 'organization_id'> & { organization_id?: string }) =>
      client.upsertEntity({ ...p, organization_id: p.organization_id || auth.organization_id } as UpsertEntityInput),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entities'] })
    }
  })
}

export function useEmitTxn() {
  const { client, auth } = useHera()
  return useMutation({
    mutationFn: (p: Omit<EmitTxnInput, 'organization_id'> & { organization_id?: string }) =>
      client.emitTxn({ ...p, organization_id: p.organization_id || auth.organization_id } as EmitTxnInput)
  })
}

export function useLedgerReport(params: {
  report: 'TB' | 'PL' | 'BS'
  from: string
  to: string
  branch_id?: string
  dims?: any
  enabled?: boolean
}) {
  const { client, auth } = useHera()
  const p = { ...params, organization_id: auth.organization_id }
  return useQuery({
    queryKey: ['ledger', p],
    queryFn: () => client.ledgerReport(p as any),
    enabled: !!auth.organization_id && (params.enabled ?? true)
  })
}
