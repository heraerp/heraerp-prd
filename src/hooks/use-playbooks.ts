import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'
import { api } from '@/lib/api-client'
import { queryKeys } from './query-keys'
import type {
  PlaybookListItem,
  PlaybookDef,
  PlaybookContracts,
  CreatePlaybookRequest,
  AddStepRequest
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
