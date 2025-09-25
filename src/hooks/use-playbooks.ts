import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'
import { api } from '@/lib/api-client'
import { queryKeys } from './query-keys'
import { useOrgStore } from '@/state/org'
import type {
  PlaybookListItem,
  PlaybookDef,
  PlaybookContracts,
  CreatePlaybookRequest,
  AddStepRequest,
  PlaybookDetail,
  PlaybookFilters,
  CreatePlaybookPayload,
  UpdatePlaybookPayload,
  PlaybookKpis,
  PlaybookStatus,
  PlaybookExportFormat
} from '@/types/playbooks'
import type { Paginated, ListQueryParams } from '@/types/api'
import type { OrgId } from '@/types/common'

// Query hooks
export function usePlaybookList(params?: ListQueryParams & { orgId?: OrgId }) {
  return useQuery({
    queryKey: queryKeys.playbooks.list(params?.orgId, params),
    queryFn: () => api.playbooks.list(params),
    enabled: !!params?.orgId
  })
}

export function usePlaybook(id: string, orgId?: OrgId) {
  return useQuery({
    queryKey: queryKeys.playbooks.detail(orgId, id),
    queryFn: () => api.playbooks.get(id),
    enabled: !!id && !!orgId
  })
}

// Mutation hooks
export function useCreatePlaybook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePlaybookRequest & { idempotencyKey?: string }) => {
      const { idempotencyKey = uuidv4(), ...body } = data
      return api.playbooks.create(body, { idempotent: true, idempotencyKey })
    },
    onSuccess: (result, variables) => {
      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.playbooks.lists()
      })

      // Invalidate the specific playbook detail if we have an ID
      if (result.data?.id && variables.organization_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.playbooks.detail(variables.organization_id, result.data.id)
        })
      }
    }
  })
}

export function useAddStep(playbookId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AddStepRequest & { orgId: OrgId; idempotencyKey?: string }) => {
      const { idempotencyKey = uuidv4(), orgId, ...step } = data
      return api.playbooks.addStep(playbookId, step, { idempotent: true, idempotencyKey })
    },
    onSuccess: (result, variables) => {
      // Invalidate the specific playbook
      queryClient.invalidateQueries({
        queryKey: queryKeys.playbooks.detail(variables.orgId, playbookId)
      })
    }
  })
}

export function usePublishPlaybook(playbookId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { orgId: OrgId }) => {
      return api.playbooks.publish(playbookId)
    },
    onSuccess: (result, variables) => {
      // Invalidate the specific playbook
      queryClient.invalidateQueries({
        queryKey: queryKeys.playbooks.detail(variables.orgId, playbookId)
      })

      // Invalidate list queries to show updated status
      queryClient.invalidateQueries({
        queryKey: queryKeys.playbooks.lists()
      })
    }
  })
}

// Additional query hooks for new UI requirements

interface PlaybookListResponse {
  items: PlaybookListItem[]
  total: number
  page: number
  pageSize: number
}

interface ExportPlaybooksParams {
  format: PlaybookExportFormat
  filters?: PlaybookFilters
}

// Get playbook KPIs
export function usePlaybookKpis() {
  const { currentOrgId } = useOrgStore()

  return useQuery({
    queryKey: ['playbooks', 'kpis', currentOrgId],
    queryFn: async () => {
      const response = await fetch('/api/civicflow/playbooks/kpis', {
        headers: {
          'X-Organization-Id': currentOrgId || ''
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch playbook KPIs')
      }

      return response.json() as Promise<PlaybookKpis>
    },
    enabled: !!currentOrgId
  })
}

// Update playbook status
export function useUpdatePlaybookStatus() {
  const { currentOrgId } = useOrgStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PlaybookStatus }) => {
      const response = await fetch(`/api/civicflow/playbooks/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': currentOrgId || ''
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update playbook status')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] })
      queryClient.invalidateQueries({ queryKey: ['playbooks', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['playbooks', 'kpis'] })
    }
  })
}

// Delete playbook
export function useDeletePlaybook() {
  const { currentOrgId } = useOrgStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/civicflow/playbooks/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Organization-Id': currentOrgId || ''
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete playbook')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] })
      queryClient.invalidateQueries({ queryKey: ['playbooks', 'kpis'] })
    }
  })
}

// Duplicate playbook
export function useDuplicatePlaybook() {
  const { currentOrgId } = useOrgStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/civicflow/playbooks/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'X-Organization-Id': currentOrgId || ''
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to duplicate playbook')
      }

      return response.json() as Promise<PlaybookDetail>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] })
      queryClient.invalidateQueries({ queryKey: ['playbooks', 'kpis'] })
    }
  })
}

// Export playbooks
export function useExportPlaybooks() {
  const { currentOrgId } = useOrgStore()

  return useMutation({
    mutationFn: async ({ format, filters }: ExportPlaybooksParams) => {
      const params = new URLSearchParams()
      params.append('format', format)
      if (filters?.q) params.append('q', filters.q)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.category) params.append('category', filters.category)
      if (filters?.service_id) params.append('service_id', filters.service_id)

      const response = await fetch(`/api/civicflow/playbooks/export?${params}`, {
        method: 'GET',
        headers: {
          'X-Organization-Id': currentOrgId || ''
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export playbooks')
      }

      // Handle file download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const filename =
        response.headers.get('Content-Disposition')?.split('filename=')[1] || `playbooks.${format}`

      const a = document.createElement('a')
      a.href = url
      a.download = filename.replace(/"/g, '')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  })
}

// Create playbook for new UI - using a different name to avoid conflict
export function useCreatePlaybookNew() {
  const { currentOrgId } = useOrgStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreatePlaybookPayload) => {
      const response = await fetch('/api/civicflow/playbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': currentOrgId || ''
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create playbook')
      }

      return response.json() as Promise<PlaybookDetail>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] })
      queryClient.invalidateQueries({ queryKey: ['playbooks', 'kpis'] })
    }
  })
}

// Update playbook
export function useUpdatePlaybook() {
  const { currentOrgId } = useOrgStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdatePlaybookPayload & { id: string }) => {
      const response = await fetch(`/api/civicflow/playbooks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': currentOrgId || ''
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update playbook')
      }

      return response.json() as Promise<PlaybookDetail>
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] })
      queryClient.invalidateQueries({ queryKey: ['playbooks', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['playbooks', 'kpis'] })
    }
  })
}

// Get playbook detail (new version for new UI)
export function usePlaybookDetail(id: string) {
  const { currentOrgId } = useOrgStore()

  return useQuery({
    queryKey: ['playbooks', id, currentOrgId],
    queryFn: async () => {
      const response = await fetch(`/api/civicflow/playbooks/${id}`, {
        headers: {
          'X-Organization-Id': currentOrgId || ''
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch playbook details')
      }

      return response.json() as Promise<PlaybookDetail>
    },
    enabled: !!currentOrgId && !!id
  })
}
