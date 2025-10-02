import { useQuery } from '@tanstack/react-query'

type Option = { value: string; label: string }

// Helper to get authentication headers (reuse from useUniversalEntity)
async function getAuthHeaders(): Promise<Record<string, string>> {
  // For demo purposes, use the demo token
  return {
    'Content-Type': 'application/json',
    Authorization: 'Bearer demo-token-salon-receptionist'
  }
}

export function useEntityOptions(key?: string) {
  return useQuery({
    queryKey: ['entity-options', key],
    enabled: !!key,
    queryFn: async () => {
      if (!key) return [] as Option[]

      const headers = await getAuthHeaders()

      // Route to appropriate entity type based on key
      try {
        if (key === 'product_categories' || key === 'service_categories') {
          const res = await fetch(
            '/api/v2/entities?entity_type=CATEGORY&limit=500&include_dynamic=false',
            { headers }
          )
          const json = await res.json()
          const items = Array.isArray(json?.data) ? json.data : []
          return items.map((x: any) => ({
            value: x.id,
            label: x.entity_name || x.name || 'Untitled'
          })) as Option[]
        }

        if (key === 'brands') {
          const res = await fetch(
            '/api/v2/entities?entity_type=BRAND&limit=500&include_dynamic=false',
            { headers }
          )
          const json = await res.json()
          const items = Array.isArray(json?.data) ? json.data : []
          return items.map((x: any) => ({
            value: x.id,
            label: x.entity_name || x.name || 'Untitled'
          })) as Option[]
        }

        if (key === 'vendors' || key === 'suppliers') {
          const res = await fetch(
            '/api/v2/entities?entity_type=VENDOR&limit=500&include_dynamic=false',
            { headers }
          )
          const json = await res.json()
          const items = Array.isArray(json?.data) ? json.data : []
          return items.map((x: any) => ({
            value: x.id,
            label: x.entity_name || x.name || 'Untitled'
          })) as Option[]
        }

        if (key === 'employees' || key === 'staff') {
          const res = await fetch(
            '/api/v2/entities?entity_type=EMPLOYEE&limit=500&include_dynamic=false',
            { headers }
          )
          const json = await res.json()
          const items = Array.isArray(json?.data) ? json.data : []
          return items.map((x: any) => ({
            value: x.id,
            label: x.entity_name || x.name || 'Untitled'
          })) as Option[]
        }

        if (key === 'customers') {
          const res = await fetch(
            '/api/v2/entities?entity_type=CUSTOMER&limit=500&include_dynamic=false',
            { headers }
          )
          const json = await res.json()
          const items = Array.isArray(json?.data) ? json.data : []
          return items.map((x: any) => ({
            value: x.id,
            label: x.entity_name || x.name || 'Untitled'
          })) as Option[]
        }

        if (key === 'roles') {
          const res = await fetch(
            '/api/v2/entities?entity_type=ROLE&limit=500&include_dynamic=false',
            { headers }
          )
          const json = await res.json()
          const items = Array.isArray(json?.data) ? json.data : []
          return items.map((x: any) => ({
            value: x.id,
            label: x.entity_name || x.name || 'Untitled'
          })) as Option[]
        }

        // Fallback - try to extract entity type from key
        const entityType = key.toUpperCase().replace(/S$/, '') // Remove plural 's'
        const res = await fetch(
          `/api/v2/entities?entity_type=${entityType}&limit=500&include_dynamic=false`,
          { headers }
        )
        const json = await res.json()
        const items = Array.isArray(json?.data) ? json.data : []
        return items.map((x: any) => ({
          value: x.id,
          label: x.entity_name || x.name || 'Untitled'
        })) as Option[]
      } catch (error) {
        console.warn(`Failed to load options for key: ${key}`, error)
        return [] as Option[]
      }
    }
  })
}
