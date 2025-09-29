'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'

export type EmailFolder = 'inbox' | 'outbox' | 'drafts' | 'sent' | 'trash'

interface EmailFilters {
  search: string
  dateRange: string
  priority: string
  tags: string[]
}

interface UseEmailListParams {
  folder: EmailFolder
  filters: EmailFilters
  organizationId?: string
  enabled?: boolean
}

interface EmailCounts {
  inbox: number
  outbox: number
  drafts: number
  sent: number
  trash: number
}

interface EmailDraft {
  to: string[]
  cc: string[]
  bcc: string[]
  subject: string
  body_html: string
  body_text: string
  priority: 'urgent' | 'normal' | 'low'
  tags: string[]
  attachments: File[]
}

// Email List Hook
export function useEmailList({
  folder,
  filters,
  organizationId,
  enabled = true
}: UseEmailListParams) {
  return useQuery({
    queryKey: ['emails', folder, filters, organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required')

      const searchParams = new URLSearchParams({
        organizationId,
        folder,
        search: filters.search || '',
        dateRange: filters.dateRange || '',
        priority: filters.priority || '',
        tags: filters.tags.join(','),
        limit: '50',
        offset: '0'
      })

      const response = await fetch(`/api/v1/communications/emails?${searchParams}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch emails')
      }

      const data = await response.json()
      return data.emails
    },
    enabled: enabled && !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000 // 1 minute
  })
}

// Individual Email Hook
export function useEmail(emailId: string | null, options?: { enabled?: boolean }) {
  const { enabled = true } = options || {}

  return useQuery({
    queryKey: ['email', emailId],
    queryFn: async () => {
      if (!emailId) throw new Error('Email ID is required')

      const response = await fetch('/api/v1/communications/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emailId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch email')
      }

      return response.json()
    },
    enabled: enabled && !!emailId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

// Email Counts Hook
export function useEmailCounts(organizationId: string) {
  return useQuery({
    queryKey: ['email-counts', organizationId],
    queryFn: async (): Promise<EmailCounts> => {
      if (!organizationId) throw new Error('Organization ID is required')

      // For demo purposes, return mock counts
      // In production, this would query the API
      return {
        inbox: 12,
        outbox: 2,
        drafts: 5,
        sent: 48,
        trash: 7
      }
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000 // 2 minutes
  })
}

// Send Email Hook
export function useSendEmail() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (params: {
      organizationId: string
      to: string[]
      cc?: string[]
      bcc?: string[]
      subject: string
      body_html?: string
      body_text: string
      priority?: string
      tags?: string[]
      attachments?: Array<{
        filename: string
        content: string // base64
        type?: string
      }>
    }) => {
      const response = await fetch('/api/v1/communications/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId: params.organizationId,
          from: 'CivicFlow <onboarding@resend.dev>', // Resend test domain
          to: params.to,
          cc: params.cc || [],
          bcc: params.bcc || [],
          subject: params.subject,
          html: params.body_html,
          text: params.body_text,
          tags: params.tags || [],
          attachments: params.attachments || []
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['emails', 'sent', variables.organizationId]
      })
      queryClient.invalidateQueries({
        queryKey: ['email-counts', variables.organizationId]
      })

      toast({
        title: 'Email sent',
        description: 'Your email has been sent successfully.'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Send failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Save Draft Hook
export function useSaveDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { organizationId: string; draft: EmailDraft; draftId?: string }) => {
      const response = await fetch('/api/civicflow/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': params.organizationId
        },
        body: JSON.stringify({
          to: params.draft.to,
          cc: params.draft.cc,
          bcc: params.draft.bcc,
          subject: params.draft.subject,
          body_html: params.draft.body_html,
          body_text: params.draft.body_text,
          priority: params.draft.priority,
          tags: params.draft.tags,
          is_draft: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save draft')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate drafts queries
      queryClient.invalidateQueries({
        queryKey: ['emails', 'drafts', variables.organizationId]
      })
      queryClient.invalidateQueries({
        queryKey: ['email-counts', variables.organizationId]
      })
    }
  })
}

// Update Email Hook (star, flag, move, etc.)
export function useUpdateEmail() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (params: {
      emailId: string
      organizationId: string
      updates: {
        status?: string
        is_starred?: boolean
        is_flagged?: boolean
        tags?: string[]
        priority?: string
        folder?: string
      }
    }) => {
      const response = await fetch(`/api/civicflow/emails/${params.emailId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': params.organizationId
        },
        body: JSON.stringify(params.updates)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update email')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['emails']
      })
      queryClient.invalidateQueries({
        queryKey: ['email', variables.emailId]
      })
      queryClient.invalidateQueries({
        queryKey: ['email-counts', variables.organizationId]
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Delete Email Hook
export function useDeleteEmail() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (params: { emailId: string; organizationId: string }) => {
      const response = await fetch(`/api/civicflow/emails/${params.emailId}`, {
        method: 'DELETE',
        headers: {
          'x-organization-id': params.organizationId
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete email')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['emails']
      })
      queryClient.invalidateQueries({
        queryKey: ['email-counts', variables.organizationId]
      })

      toast({
        title: 'Email deleted',
        description: 'Email has been moved to trash.'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// AI Assist Hook
export function useAiAssist() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (params: {
      emailId: string
      task: 'summarize' | 'classify' | 'suggest' | 'analyze' | 'extract'
      organizationId?: string
    }) => {
      const organizationId = params.organizationId || getOrganizationIdFromStorage()

      const response = await fetch('/api/civicflow/emails/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': organizationId
        },
        body: JSON.stringify({
          emailId: params.emailId,
          task: params.task
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'AI assistance failed')
      }

      return response.json()
    },
    onError: (error: Error) => {
      toast({
        title: 'AI assistance failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Move Email Hook
export function useMoveEmail() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (params: {
      emailIds: string[]
      folder: EmailFolder
      organizationId: string
    }) => {
      const statusMap: Record<EmailFolder, string> = {
        inbox: 'read',
        outbox: 'queued',
        drafts: 'draft',
        sent: 'sent',
        trash: 'deleted'
      }

      const promises = params.emailIds.map(emailId =>
        fetch(`/api/civicflow/emails/${emailId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-organization-id': params.organizationId
          },
          body: JSON.stringify({
            status: statusMap[params.folder]
          })
        })
      )

      const responses = await Promise.all(promises)
      const failed = responses.filter(r => !r.ok)

      if (failed.length > 0) {
        throw new Error(`Failed to move ${failed.length} emails`)
      }

      return { moved: params.emailIds.length }
    },
    onSuccess: (data, variables) => {
      // Invalidate all email queries
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      queryClient.invalidateQueries({ queryKey: ['email-counts', variables.organizationId] })

      toast({
        title: 'Emails moved',
        description: `${data.moved} email${data.moved > 1 ? 's' : ''} moved to ${variables.folder}.`
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Move failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

// Helper function to get organization ID from storage/context
function getOrganizationIdFromStorage(): string {
  // Get from localStorage or use demo org ID
  const storedOrgId = typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null
  return storedOrgId || '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77' // CivicFlow demo org
}
