/**
 * Salon API Client for Playbook Server Integration
 * Smart Code: HERA.API.CLIENT.SALON.V1
 */

import { z } from 'zod'

// Price schema matching dynamic data structure
export const PriceSchema = z
  .object({
    amount: z.number(),
    currency_code: z.string(),
    tax_inclusive: z.boolean().optional()
  })
  .nullable()
  .optional()

// Raw row from Playbook API with snake_case fields
export const ServiceApiRowSchema = z.object({
  id: z.string().uuid(),
  entity_name: z.string(),
  entity_code: z.string().nullable().optional(),
  status: z.string(),
  smart_code: z.string(),
  price: PriceSchema,
  duration_minutes: z.number().nullable().optional(),
  category: z.string().nullable().optional(),
  tax: z.record(z.any()).nullable().optional(),
  commission: z.record(z.any()).nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional()
})
export type ServiceApiRow = z.infer<typeof ServiceApiRowSchema>

// UI-facing shape (must match what the page already expects)
export type Service = {
  id: string
  name: string
  code?: string | null
  status: string // "active" | "archived" | etc.
  smartCode: string
  price?: Record<string, any> | null
  tax?: Record<string, any> | null
  commission?: Record<string, any> | null
  category?: string | null
  duration?: Record<string, any> | null
  duration_minutes?: number | null // Added for direct access
  base_fee?: number | null // Added for direct access
  created_at?: string | null
  updated_at?: string | null
}

export function mapRowToService(r: ServiceApiRow): Service {
  return {
    id: r.id,
    name: r.entity_name,
    code: r.entity_code ?? null,
    status: r.status,
    smartCode: r.smart_code,
    price: r.price ?? null,
    tax: r.tax ?? null,
    commission: r.commission ?? null,
    category: r.category ?? null,
    duration: r.duration_minutes ? { duration_mins: r.duration_minutes } : null,
    duration_minutes: r.duration_minutes ?? null,
    base_fee: r.price?.amount ?? null,
    created_at: r.created_at ?? null,
    updated_at: r.updated_at ?? null
  }
}

export async function fetchSalonServices(params: {
  token: string
  q?: string
  status?: 'active' | 'archived' | 'all'
  category?: string
  branchId?: string
  sort?: 'name_asc' | 'name_desc' | 'updated_desc' | 'updated_asc'
  limit?: number
  offset?: number
}): Promise<{ items: Service[]; total_count: number; limit: number; offset: number }> {
  const { token, q, status, category, branchId, sort, limit = 100, offset = 0 } = params
  const base = process.env['NEXT_PUBLIC_PLAYBOOK_BASE_URL'] ?? '/api/playbook'
  const url = new URL(
    `${base}/salon/services`,
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin
  )

  // Add query parameters
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))
  if (q) url.searchParams.set('q', q)
  if (status) url.searchParams.set('status', status)
  if (category) url.searchParams.set('category', category)
  if (branchId) url.searchParams.set('branch_id', branchId)
  if (sort) url.searchParams.set('sort', sort)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  })
  if (!res.ok) throw new Error(`Failed to fetch services: ${res.status}`)

  // Response is { items: ServiceApiRow[], total_count, limit, offset }
  const json = await res.json()
  const rows = (json?.items ?? []) as unknown[]
  const parsed = rows.map(r => ServiceApiRowSchema.parse(r))
  return {
    items: parsed.map(mapRowToService),
    total_count: json?.total_count ?? parsed.length,
    limit: json?.limit ?? limit,
    offset: json?.offset ?? offset
  }
}

/**
 * Get auth token from current session
 * This supports both demo sessions and real authenticated sessions
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // Check for demo session first
    const demoSessionCookie = getCookie('hera-demo-session')
    if (demoSessionCookie) {
      // For demo sessions, we'll use a demo token
      // The Playbook server should accept this and derive org from it
      return 'demo-token-salon-receptionist'
    }

    // For real sessions, try to get from Supabase
    const { getSupabase } = await import('@/lib/supabase')
    const supabase = getSupabase()
    const {
      data: { session }
    } = await supabase!.auth.getSession()

    if (session?.access_token) {
      return session.access_token
    }

    // No token available
    return null
  } catch (error) {
    console.error('Failed to get auth token:', error)
    return null
  }
}

// Helper function to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}
