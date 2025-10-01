import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrgStore } from '@/state/org'
import { useToast } from '@/components/ui/use-toast'
import type {
  CivicFlowEvent,
  EventInvite,
  EventKPIs,
  EventFilters,
  EventInviteFilters,
  EventStats,
  CreateEventRequest,
  SendInvitationRequest,
  RecordCheckinRequest
} from '@/types/events'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// List events with filters
export function useEvents(filters?: EventFilters) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<{ items: CivicFlowEvent[]; total: number }>({
    queryKey: ['events', orgId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','))
            } else {
              params.append(key, String(value))
            }
          }
        })
      }

      const response = await fetch(`/api/civicflow/events?${params}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch events')
      return response.json()
    }
  })
}

// Get single event
export function useEvent(eventId: string | undefined) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<CivicFlowEvent>({
    queryKey: ['event', orgId, eventId],
    queryFn: async () => {
      const response = await fetch(`/api/civicflow/events/${eventId}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch event')
      return response.json()
    },
    enabled: !!eventId
  })
}

// Get event KPIs
export function useEventKPIs() {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<EventKPIs>({
    queryKey: ['event-kpis', orgId],
    queryFn: async () => {
      const response = await fetch('/api/civicflow/events/kpis', {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch event KPIs')
      return response.json()
    }
  })
}

// List event invitations
export function useEventInvites(filters?: EventInviteFilters) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<{ items: EventInvite[]; total: number }>({
    queryKey: ['event-invites', orgId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }

      const response = await fetch(`/api/civicflow/events/invites?${params}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch invitations')
      return response.json()
    }
  })
}

// Get event statistics
export function useEventStats(eventId: string | undefined) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<EventStats>({
    queryKey: ['event-stats', orgId, eventId],
    queryFn: async () => {
      const response = await fetch(`/api/civicflow/events/${eventId}/stats`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch event stats')
      return response.json()
    },
    enabled: !!eventId
  })
}

// Create event
export function useCreateEvent() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateEventRequest) => {
      const response = await fetch('/api/v2/universal/entity-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          entity_type: 'event',
          entity_name: data.entity_name,
          entity_code: `EVENT-${Date.now()}`,
          smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.V1',
          organization_id: orgId
        })
      })

      if (!response.ok) throw new Error('Failed to create event')
      const result = await response.json()
      const eventId = result.data.id

      // Add dynamic data
      const dynamicFields = [
        { field_name: 'event_type', field_value_text: data.event_type },
        { field_name: 'description', field_value_text: data.description },
        { field_name: 'start_datetime', field_value_text: data.start_datetime },
        { field_name: 'end_datetime', field_value_text: data.end_datetime },
        { field_name: 'timezone', field_value_text: data.timezone || 'UTC' },
        { field_name: 'venue_name', field_value_text: data.venue_name },
        { field_name: 'venue_address', field_value_text: data.venue_address },
        { field_name: 'online_url', field_value_text: data.online_url },
        { field_name: 'is_online', field_value_text: String(data.is_online) },
        { field_name: 'is_hybrid', field_value_text: String(data.is_hybrid) },
        { field_name: 'host_program_id', field_value_text: data.host_program_id },
        { field_name: 'capacity', field_value_number: data.capacity },
        { field_name: 'registration_deadline', field_value_text: data.registration_deadline },
        { field_name: 'tags', field_value_json: data.tags }
      ]

      // Store dynamic data
      for (const field of dynamicFields) {
        if (
          field.field_value_text ||
          field.field_value_number !== undefined ||
          field.field_value_json
        ) {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              entity_id: eventId,
              ...field,
              organization_id: orgId
            })
          })
        }
      }

      // Emit transaction
      await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.CREATED.V1',
          metadata: {
            event_id: eventId,
            event_type: data.event_type,
            event_name: data.entity_name,
            start_datetime: data.start_datetime
          }
        })
      })

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event-kpis'] })
      toast({ title: 'Event created successfully' })
    }
  })
}

// Update event
export function useUpdateEvent() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateEventRequest> & { id: string }) => {
      // Update entity
      const response = await fetch('/api/v2/universal/entity-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          id,
          entity_type: 'event',
          entity_name: data.entity_name,
          organization_id: orgId
        })
      })

      if (!response.ok) throw new Error('Failed to update event')

      // Update dynamic data
      const dynamicUpdates = Object.entries(data).filter(([key]) => key !== 'entity_name')
      for (const [key, value] of dynamicUpdates) {
        const fieldType =
          typeof value === 'number'
            ? 'field_value_number'
            : typeof value === 'object'
              ? 'field_value_json'
              : 'field_value_text'

        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            Prefer: 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            entity_id: id,
            field_name: key,
            [fieldType]: value,
            organization_id: orgId
          })
        })
      }

      // Emit transaction
      await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.UPDATED.V1',
          metadata: {
            event_id: id,
            updated_fields: Object.keys(data)
          }
        })
      })

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event'] })
      toast({ title: 'Event updated successfully' })
    }
  })
}

// Send invitations
export function useSendInvitations() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: SendInvitationRequest) => {
      const results = []

      for (const subjectId of data.subject_ids) {
        // Create invite entity
        const response = await fetch('/api/v2/universal/entity-upsert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-Id': orgId
          },
          body: JSON.stringify({
            entity_type: 'event_invite',
            entity_name: `Invitation - ${data.event_id}`,
            entity_code: `INVITE-${data.event_id}-${subjectId}`,
            smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.INVITE.V1',
            organization_id: orgId
          })
        })

        if (response.ok) {
          const result = await response.json()
          const inviteId = result.data.id

          // Add dynamic data
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              entity_id: inviteId,
              field_name: 'status',
              field_value_text: 'invited',
              organization_id: orgId
            })
          })

          // Create relationships
          await fetch('/api/v2/universal/relationship-upsert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Organization-Id': orgId
            },
            body: JSON.stringify({
              from_entity_id: inviteId,
              to_entity_id: data.event_id,
              relationship_type: 'invite_to_event',
              smart_code: 'HERA.PUBLICSECTOR.CRM.REL.INVITE_EVENT.v1'
            })
          })

          await fetch('/api/v2/universal/relationship-upsert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Organization-Id': orgId
            },
            body: JSON.stringify({
              from_entity_id: inviteId,
              to_entity_id: subjectId,
              relationship_type: 'invite_to_subject',
              smart_code: 'HERA.PUBLICSECTOR.CRM.REL.INVITE_SUBJECT.v1'
            })
          })

          // Emit transaction
          await fetch('/api/v2/universal/txn-emit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Organization-Id': orgId
            },
            body: JSON.stringify({
              smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.INVITE.SENT.V1',
              metadata: {
                event_id: data.event_id,
                invite_id: inviteId,
                subject_id: subjectId,
                subject_type: data.subject_type
              }
            })
          })

          results.push(result.data)
        }
      }

      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-invites'] })
      queryClient.invalidateQueries({ queryKey: ['event-stats'] })
      toast({ title: 'Invitations sent successfully' })
    }
  })
}

// Record check-in
export function useRecordCheckin() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: RecordCheckinRequest) => {
      const checkinTime = data.checkin_time || new Date().toISOString()

      // Update invite status
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          entity_id: data.invite_id,
          field_name: 'status',
          field_value_text: 'attended',
          organization_id: orgId
        })
      })

      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          entity_id: data.invite_id,
          field_name: 'checkin_time',
          field_value_text: checkinTime,
          organization_id: orgId
        })
      })

      // Emit transaction
      await fetch('/api/v2/universal/txn-emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.CHECKIN.RECORDED.V1',
          metadata: {
            event_id: data.event_id,
            invite_id: data.invite_id,
            checkin_time: checkinTime,
            notes: data.notes
          }
        })
      })

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-invites'] })
      queryClient.invalidateQueries({ queryKey: ['event-stats'] })
      toast({ title: 'Check-in recorded successfully' })
    }
  })
}

// Export event data
export function useExportEvent() {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ eventId, format }: { eventId: string; format: 'csv' | 'pdf' | 'zip' }) => {
      const response = await fetch(`/api/civicflow/events/${eventId}/export?format=${format}`, {
        headers: { 'X-Organization-Id': orgId }
      })

      if (!response.ok) throw new Error('Failed to export event data')

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `event-${eventId}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    },
    onSuccess: () => {
      toast({ title: 'Export completed successfully' })
    }
  })
}
