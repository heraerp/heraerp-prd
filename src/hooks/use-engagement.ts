import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrgStore } from '@/state/org'
import type {
  EngagementStage,
  EngagementJourney,
  EngagementFunnel,
  EngagementFilters,
  UpdateScoreRequest,
  TransitionStageRequest,
  ScoringAction
} from '@/types/engagement'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// List all engagement stages
export function useEngagementStages() {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<EngagementStage[]>({
    queryKey: ['engagement-stages', orgId],
    queryFn: async () => {
      const response = await fetch('/api/engagement/stages', {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch engagement stages')
      return response.json()
    }
  })
}

// List engagement journeys with filters
export function useEngagementJourneys(filters?: EngagementFilters) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<{ items: EngagementJourney[]; total: number }>({
    queryKey: ['engagement-journeys', orgId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','))
            } else if (typeof value === 'object') {
              params.append(key, JSON.stringify(value))
            } else {
              params.append(key, String(value))
            }
          }
        })
      }

      const response = await fetch(`/api/engagement/journeys?${params}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch engagement journeys')
      return response.json()
    }
  })
}

// Get engagement funnel statistics
export function useEngagementFunnel(programIds?: string[]) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<EngagementFunnel>({
    queryKey: ['engagement-funnel', orgId, programIds],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (programIds?.length) {
        params.append('program_ids', programIds.join(','))
      }

      const response = await fetch(`/api/engagement/funnel?${params}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch engagement funnel')
      return response.json()
    }
  })
}

// Update journey score based on actions
export function useUpdateScore() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useMutation({
    mutationFn: async (request: UpdateScoreRequest) => {
      const response = await fetch('/api/engagement/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify(request)
      })
      if (!response.ok) throw new Error('Failed to update score')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate journey and funnel queries
      queryClient.invalidateQueries({ queryKey: ['engagement-journeys'] })
      queryClient.invalidateQueries({ queryKey: ['engagement-funnel'] })
    }
  })
}

// Move journey to new stage
export function useTransitionStage() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useMutation({
    mutationFn: async (request: TransitionStageRequest) => {
      const response = await fetch('/api/engagement/transition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify(request)
      })
      if (!response.ok) throw new Error('Failed to transition stage')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate journey and funnel queries
      queryClient.invalidateQueries({ queryKey: ['engagement-journeys'] })
      queryClient.invalidateQueries({ queryKey: ['engagement-funnel'] })
    }
  })
}

// Helper hook to track engagement from communications activity
export function useTrackEngagement() {
  const updateScore = useUpdateScore()
  const { currentOrgId } = useOrgStore()

  const trackAction = (
    subjectId: string,
    action: ScoringAction,
    metadata?: Record<string, any>
  ) => {
    // First find or create journey for subject
    fetch('/api/engagement/journeys/find-or-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': currentOrgId || CIVICFLOW_ORG_ID
      },
      body: JSON.stringify({
        subject_id: subjectId,
        subject_type: 'constituent' // Default to constituent
      })
    })
      .then(res => res.json())
      .then(journey => {
        // Update score for the action
        updateScore.mutate({
          journey_id: journey.id,
          action,
          metadata
        })
      })
      .catch(error => {
        console.error('Failed to track engagement:', error)
      })
  }

  return { trackAction }
}

// Get journey for a specific constituent/organization
export function useJourneyBySubject(
  subjectId: string | undefined,
  subjectType: 'constituent' | 'organization' = 'constituent'
) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<EngagementJourney | null>({
    queryKey: ['engagement-journey-subject', orgId, subjectId, subjectType],
    queryFn: async () => {
      if (!subjectId) return null

      const response = await fetch(
        `/api/engagement/journeys/by-subject?subject_id=${subjectId}&subject_type=${subjectType}`,
        {
          headers: { 'X-Organization-Id': orgId }
        }
      )
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch journey')
      }
      return response.json()
    },
    enabled: !!subjectId
  })
}

// Create initial stages for organization
export function useCreateDefaultStages() {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/engagement/stages/create-defaults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        }
      })
      if (!response.ok) throw new Error('Failed to create default stages')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-stages'] })
    }
  })
}
