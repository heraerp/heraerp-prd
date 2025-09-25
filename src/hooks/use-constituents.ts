import { useQuery } from '@tanstack/react-query'
import { useOrgStore } from '@/state/org'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

interface ConstituentFilters {
  search?: string
  tags?: string[]
  program_ids?: string[]
  page?: number
  page_size?: number
}

export function useConstituents(filters?: ConstituentFilters) {
  const { currentOrgId } = useOrgStore()
  const orgId = currentOrgId || CIVICFLOW_ORG_ID

  return useQuery<{ items: any[]; total: number }>({
    queryKey: ['constituents', orgId, filters],
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

      const response = await fetch(`/api/civicflow/constituents?${params}`, {
        headers: { 'X-Organization-Id': orgId }
      })
      if (!response.ok) throw new Error('Failed to fetch constituents')
      return response.json()
    }
  })
}
