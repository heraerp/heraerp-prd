import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrgStore } from '@/state/org'
import { toast } from 'sonner'
import type {
  OrgProfile,
  OrgContact,
  OrgContactFilters,
  OrgFundingRow,
  OrgFundingFilters,
  OrgEventRow,
  OrgEventFilters,
  OrgCommRow,
  OrgCommFilters,
  OrgCaseRow,
  OrgCaseFilters,
  OrgDocument,
  OrgDocumentFilters,
  OrgActivity,
  OrgActivityFilters,
  OrgEngagementSummary,
  ExportRequest
} from '@/types/organizations'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Fetch organization profile with header data
export function useOrgProfile(id: string) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<OrgProfile>({
    queryKey: ['org-profile', id, orgId],
    queryFn: async () => {
      const response = await fetch(`/api/civicflow/organizations/${id}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch organization profile')
      return response.json()
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

// Fetch organization contacts
export function useOrgContacts(id: string, filters?: OrgContactFilters) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<{ data: OrgContact[]; total: number }>({
    queryKey: ['org-contacts', id, orgId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.search) params.append('search', filters.search)
      if (filters?.role) params.append('role', filters.role)
      if (filters?.primary_only) params.append('primary_only', 'true')

      const response = await fetch(`/api/civicflow/organizations/${id}/contacts?${params}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch contacts')
      return response.json()
    },
    keepPreviousData: true
  })
}

// Fetch organization engagement data
export function useOrgEngagement(id: string) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<OrgEngagementSummary & { history: any[] }>({
    queryKey: ['org-engagement', id, orgId],
    queryFn: async () => {
      const response = await fetch(`/api/civicflow/organizations/${id}/engagement`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch engagement data')
      return response.json()
    }
  })
}

// Fetch organization funding
export function useOrgFunding(id: string, filters?: OrgFundingFilters) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<{ data: OrgFundingRow[]; summary: any }>({
    queryKey: ['org-funding', id, orgId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.program) params.append('program', filters.program)
      if (filters?.year) params.append('year', filters.year.toString())

      const response = await fetch(`/api/civicflow/organizations/${id}/funding?${params}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch funding data')
      return response.json()
    },
    keepPreviousData: true
  })
}

// Fetch organization events
export function useOrgEvents(id: string, filters?: OrgEventFilters) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<{ data: OrgEventRow[]; stats: any }>({
    queryKey: ['org-events', id, orgId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.event_type) params.append('event_type', filters.event_type)
      if (filters?.date_from) params.append('date_from', filters.date_from)
      if (filters?.date_to) params.append('date_to', filters.date_to)

      const response = await fetch(`/api/civicflow/organizations/${id}/events?${params}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch events')
      return response.json()
    },
    keepPreviousData: true
  })
}

// Fetch organization communications
export function useOrgComms(id: string, filters?: OrgCommFilters) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<{ data: OrgCommRow[]; total: number }>({
    queryKey: ['org-comms', id, orgId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.direction) params.append('direction', filters.direction)
      if (filters?.channel) params.append('channel', filters.channel)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.date_from) params.append('date_from', filters.date_from)
      if (filters?.date_to) params.append('date_to', filters.date_to)

      const response = await fetch(`/api/civicflow/organizations/${id}/comms?${params}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch communications')
      return response.json()
    },
    keepPreviousData: true
  })
}

// Fetch organization cases
export function useOrgCases(id: string, filters?: OrgCaseFilters) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<{ data: OrgCaseRow[]; stats: any }>({
    queryKey: ['org-cases', id, orgId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.priority) params.append('priority', filters.priority)
      if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to)
      if (filters?.overdue_only) params.append('overdue_only', 'true')

      const response = await fetch(`/api/civicflow/organizations/${id}/cases?${params}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch cases')
      return response.json()
    },
    keepPreviousData: true
  })
}

// Fetch organization documents
export function useOrgDocuments(id: string, filters?: OrgDocumentFilters) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<{ data: OrgDocument[]; total: number }>({
    queryKey: ['org-documents', id, orgId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.document_type) params.append('document_type', filters.document_type)
      if (filters?.tags?.length) params.append('tags', filters.tags.join(','))
      if (filters?.uploaded_by) params.append('uploaded_by', filters.uploaded_by)

      const response = await fetch(`/api/civicflow/organizations/${id}/documents?${params}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch documents')
      return response.json()
    },
    keepPreviousData: true
  })
}

// Mutation: Assign manager
export function useAssignManager(orgId: string) {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrgStore()
  const tenantOrgId = currentOrgId || CIVICFLOW_ORG_ID

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch('/api/v2/universal/relationship-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': tenantOrgId
        },
        body: JSON.stringify({
          from_entity_id: orgId,
          to_entity_id: userId,
          relationship_type: 'has_manager',
          smart_code: 'HERA.PUBLICSECTOR.CRM.ORG.REL.MANAGER.V1',
          metadata: {
            assigned_at: new Date().toISOString()
          }
        })
      })

      if (!response.ok) throw new Error('Failed to assign manager')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-profile', orgId] })
      toast.success('Manager assigned successfully')
    },
    onError: () => {
      toast.error('Failed to assign manager')
    }
  })
}

// Mutation: Link contact
export function useLinkContact(orgId: string) {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrgStore()
  const tenantOrgId = currentOrgId || CIVICFLOW_ORG_ID

  return useMutation({
    mutationFn: async ({
      contactId,
      role,
      isPrimary
    }: {
      contactId: string
      role: string
      isPrimary: boolean
    }) => {
      const response = await fetch('/api/v2/universal/relationship-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': tenantOrgId
        },
        body: JSON.stringify({
          from_entity_id: orgId,
          to_entity_id: contactId,
          relationship_type: 'has_contact',
          smart_code: 'HERA.PUBLICSECTOR.CRM.ORG.REL.CONTACT.V1',
          relationship_data: {
            role,
            is_primary: isPrimary
          }
        })
      })

      if (!response.ok) throw new Error('Failed to link contact')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-contacts', orgId] })
      toast.success('Contact linked successfully')
    },
    onError: () => {
      toast.error('Failed to link contact')
    }
  })
}

// Mutation: Unlink contact
export function useUnlinkContact(orgId: string) {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrgStore()
  const tenantOrgId = currentOrgId || CIVICFLOW_ORG_ID

  return useMutation({
    mutationFn: async (contactId: string) => {
      // Need to find and delete the relationship
      const response = await fetch(`/api/civicflow/organizations/${orgId}/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'X-Organization-Id': tenantOrgId
        }
      })

      if (!response.ok) throw new Error('Failed to unlink contact')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-contacts', orgId] })
      toast.success('Contact removed')
    },
    onError: () => {
      toast.error('Failed to remove contact')
    }
  })
}

// Mutation: Update organization stage
export function useUpdateOrgStage(orgId: string) {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrgStore()
  const tenantOrgId = currentOrgId || CIVICFLOW_ORG_ID

  return useMutation({
    mutationFn: async ({
      fromStage,
      toStage,
      reason
    }: {
      fromStage: string
      toStage: string
      reason?: string
    }) => {
      const response = await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': tenantOrgId
        },
        body: JSON.stringify({
          smart_code: 'ENGAGEMENT.STAGE.ENTERED.v1',
          reference_entity_id: orgId,
          metadata: {
            entity_type: 'ps_org',
            from_stage: fromStage,
            to_stage: toStage,
            reason,
            updated_at: new Date().toISOString()
          }
        })
      })

      if (!response.ok) throw new Error('Failed to update stage')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-engagement', orgId] })
      toast.success('Stage updated successfully')
    },
    onError: () => {
      toast.error('Failed to update stage')
    }
  })
}

// Mutation: Add organization note
export function useAddOrgNote(orgId: string) {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrgStore()
  const tenantOrgId = currentOrgId || CIVICFLOW_ORG_ID

  return useMutation({
    mutationFn: async ({
      text,
      visibility = 'internal'
    }: {
      text: string
      visibility?: 'internal' | 'shared'
    }) => {
      const response = await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': tenantOrgId
        },
        body: JSON.stringify({
          smart_code: 'HERA.PUBLICSECTOR.CRM.ORG.NOTE.CREATED.V1',
          reference_entity_id: orgId,
          metadata: {
            text,
            visibility,
            author: 'current_user', // Would be replaced with actual user
            created_at: new Date().toISOString()
          }
        })
      })

      if (!response.ok) throw new Error('Failed to add note')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-activity', orgId] })
      toast.success('Note added')
    },
    onError: () => {
      toast.error('Failed to add note')
    }
  })
}

// Mutation: Export organization data
export function useExportOrg(orgId: string) {
  const { currentOrgId } = useOrgStore()
  const tenantOrgId = currentOrgId || CIVICFLOW_ORG_ID

  return useMutation({
    mutationFn: async (request: ExportRequest) => {
      const response = await fetch(`/api/civicflow/organizations/${orgId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': tenantOrgId
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) throw new Error('Failed to export data')

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `org-${orgId}-export.${request.format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    },
    onSuccess: () => {
      toast.success('Export completed')
    },
    onError: () => {
      toast.error('Failed to export data')
    }
  })
}
