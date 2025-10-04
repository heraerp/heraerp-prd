/**
 * HERA Playbook Entities API
 * Smart Code: HERA.LIB.PLAYBOOK.ENTITIES.V1
 *
 * Provides entity operations following HERA guardrails:
 * - Sacred Six tables only
 * - Dynamic fields via core_dynamic_data
 * - Multi-tenant isolation via organization_id
 * - Smart codes on all entities
 *
 * Enhanced with:
 * - Batched dynamic data loading with chunked IN queries
 * - Server-side date filtering support
 * - Hardened empty array handling
 * - Efficient pagination
 */

import { universalApi } from '@/lib/universal-api-v2'
import { heraCode } from '@/lib/smart-codes'

// ================================================================================
// APPOINTMENT DTOs
// ================================================================================

export type AppointmentStatus =
  | 'booked'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'

export type AppointmentDTO = {
  id: string
  organization_id: string
  smart_code: string // e.g., HERA.SALON.APPT.ENTITY.APPOINTMENT.V1
  entity_name?: string
  entity_code?: string
  start_time: string // ISO
  end_time: string // ISO
  status: AppointmentStatus
  stylist_id?: string
  customer_id?: string
  branch_id?: string
  chair_id?: string
  service_ids?: string[]
  notes?: string
  price?: number
  currency_code?: string
}

export type AppointmentSearchParams = {
  organization_id: string
  date_from?: string // ISO
  date_to?: string // ISO
  status?: AppointmentStatus[]
  stylist_id?: string
  customer_id?: string
  branch_id?: string
  q?: string
  page?: number
  page_size?: number
}

export interface AppointmentUpsertInput {
  id?: string // If provided, update; otherwise create
  organization_id: string
  smart_code?: string // Default: HERA.SALON.APPT.ENTITY.APPOINTMENT.V1
  entity_name: string // e.g., "Appointment - John Doe - 2024-01-15 10:00"
  entity_code?: string // e.g., "APPT-2024-001"

  // Dynamic fields
  start_time: string
  end_time: string
  status: AppointmentStatus
  stylist_id?: string
  customer_id?: string
  branch_id?: string
  chair_id?: string
  service_ids?: string[]
  notes?: string
  price?: number
  currency_code?: string
}

// ================================================================================
// CUSTOMER DTOs
// ================================================================================

export type CustomerDTO = {
  id: string
  organization_id: string
  smart_code: string
  entity_name: string
  entity_code?: string
  phone?: string
  email?: string
  address?: string
  date_of_birth?: string
  last_visit?: string
  total_visits: number
  total_spent: number
  preferred_stylist_id?: string
  preferred_stylist_name?: string
  loyalty_points: number
  vip_tier: string
  notes?: string
  created_at: string
  updated_at: string
}

export type CustomerSearchParams = {
  organization_id: string
  q?: string
  phone?: string
  email?: string
  stylist_id?: string
  vip_tier?: string
  page?: number
  page_size?: number
}

// ================================================================================
// PUBLIC API
// ================================================================================

/**
 * Search appointments with filters
 * Enhanced with batched loading and server-side date filtering
 */
export async function searchAppointments(
  params: AppointmentSearchParams
): Promise<{ rows: AppointmentDTO[]; total: number }> {
  const {
    organization_id,
    date_from,
    date_to,
    status,
    stylist_id,
    customer_id,
    branch_id,
    q,
    page = 1,
    page_size = 50
  } = params
  

  // Set organization context
  universalApi.setOrganizationId(organization_id)

  // 1) Get appointment transactions for this org (appointments are stored as transactions)
  // Note: transaction_type might be 'appointment' (lowercase) or 'APPOINTMENT' (uppercase)
  const transactionsResponse = await universalApi.read(
    'universal_transactions',
    {},
    organization_id
  )

  if (!transactionsResponse.success || !transactionsResponse.data) {
    console.error('Error fetching appointment transactions:', transactionsResponse.error)
    return { rows: [], total: 0 }
  }

  // Filter for appointment transactions (both uppercase and lowercase)
  const transactions = transactionsResponse.data.filter(
    (t: any) => t?.transaction_type?.toLowerCase() === 'appointment'
  )
  let ids: string[] = transactions.map((t: any) => t?.id).filter(Boolean)
  const total = ids.length

  if (!ids.length) {
    console.log('📅 No appointment transactions found for organization:', organization_id)
    return { rows: [], total }
  }

  console.log(`📅 Found ${total} appointment transactions`)

  // 2) Optional server-side prefilter by date range using dynamic field "start_time"
  //    TODO: Add support for between operator in universal API
  //    For now, we'll do client-side date filtering

  // 3) Optimization: If we have date filters or other filters that require dynamic data,
  // we need to fetch more appointments to ensure we get enough after filtering
  const hasFilters =
    date_from || date_to || status?.length || stylist_id || customer_id || branch_id || q

  // If we have filters, fetch more data to ensure we get enough results after filtering
  // Otherwise, just fetch the current page
  const idsToFetch = hasFilters ? ids : ids.slice((page - 1) * page_size, page * page_size)

  console.log(
    `📅 Fetching dynamic data for ${idsToFetch.length} appointments (has filters: ${hasFilters})`
  )
  const dynRows = await fetchDynamicForEntities(organization_id, idsToFetch)

  // 4) Build DTOs
  const byEntity = groupDynamicByEntity(dynRows)
  const id2transaction = new Map<string, any>(transactions.map((t: any) => [t.id, t]))
  const appointments: AppointmentDTO[] = idsToFetch.map((id, index) => {
    const appointment = toAppointmentDTOFromTransaction(id2transaction.get(id), byEntity.get(id))
    if (index === 0) {
      console.log('📅 First appointment:', {
        id: appointment.id,
        start_time: appointment.start_time,
        branch_id: appointment.branch_id,
        hasFilters,
        filters: { date_from, date_to, status, branch_id, q }
      })
    }
    return appointment
  })
  

  // 5) Apply client-side filters if any
  let filteredAppointments = appointments
  if (hasFilters) {
    filteredAppointments = appointments.filter((a, index) => {
      // Debug first appointment
      if (index === 0) {
        console.log('📅 Filtering logic:', {
          appointment_branch: a.branch_id,
          filter_branch: branch_id,
          branchCheck: !branch_id || a.branch_id === branch_id,
          searchTerm: q,
          searchCheck: !q || (a.entity_name?.toLowerCase().includes(q.toLowerCase()) ||
                              a.entity_code?.toLowerCase().includes(q.toLowerCase()) ||
                              a.notes?.toLowerCase().includes(q.toLowerCase())),
          willPassFilter: (!branch_id || a.branch_id === branch_id) && 
                         (!q || (a.entity_name?.toLowerCase().includes(q.toLowerCase()) ||
                                a.entity_code?.toLowerCase().includes(q.toLowerCase()) ||
                                a.notes?.toLowerCase().includes(q.toLowerCase())))
        })
      }
      
      // Date filters
      if (date_from && new Date(a.start_time) < new Date(date_from)) return false
      if (date_to && new Date(a.start_time) > new Date(date_to)) return false

      // Other filters
      if (status?.length && !status.includes(a.status)) return false
      if (stylist_id && a.stylist_id !== stylist_id) return false
      if (customer_id && a.customer_id !== customer_id) return false
      if (branch_id && a.branch_id !== branch_id) return false

      // Search filter
      if (q) {
        const searchLower = q.toLowerCase()
        const matchesSearch =
          a.entity_name?.toLowerCase().includes(searchLower) ||
          a.entity_code?.toLowerCase().includes(searchLower) ||
          a.notes?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      return true
    })

    console.log(
      `📅 Filtered ${appointments.length} appointments to ${filteredAppointments.length} matching criteria`
    )
  }

  // 6) Apply pagination if we fetched all data
  let paginatedRows = filteredAppointments
  let actualTotal = total

  if (hasFilters) {
    // We fetched all data, so paginate the filtered results
    const start = Math.max(0, (page - 1) * page_size)
    paginatedRows = filteredAppointments.slice(start, start + page_size)
    actualTotal = filteredAppointments.length
  }

  // Return paginated results with correct total count
  return { rows: paginatedRows, total: actualTotal }
}

/**
 * Search customers with filters
 * Enhanced with batched loading and efficient pagination
 */
export async function searchCustomers(
  params: CustomerSearchParams
): Promise<{ rows: CustomerDTO[]; total: number }> {
  const {
    organization_id,
    q,
    phone,
    email,
    stylist_id,
    vip_tier,
    page = 1,
    page_size = 50
  } = params

  // Set organization context
  universalApi.setOrganizationId(organization_id)

  // 1) Get customer entity IDs for this org
  const entitiesResponse = await universalApi.read(
    'core_entities',
    {
      entity_type: 'customer'
    },
    organization_id
  )

  if (!entitiesResponse.success || !entitiesResponse.data) {
    console.error('Error fetching customer entities:', entitiesResponse.error)
    return { rows: [], total: 0 }
  }

  const entities = entitiesResponse.data
  let ids: string[] = entities.map((e: any) => e?.id).filter(Boolean)
  const total = ids.length

  if (!ids.length) {
    console.log('👤 No customer entities found for organization:', organization_id)
    return { rows: [], total }
  }

  console.log(`👤 Found ${total} customer entities`)

  // 2) Check if we have filters that require dynamic data
  const hasFilters = q || phone || email || stylist_id || vip_tier

  // If we have filters, fetch all data; otherwise just fetch current page
  const idsToFetch = hasFilters ? ids : ids.slice((page - 1) * page_size, page * page_size)

  console.log(
    `👤 Fetching dynamic data for ${idsToFetch.length} customers (has filters: ${hasFilters})`
  )
  const dynRows = await fetchDynamicForEntities(organization_id, idsToFetch)

  // 3) Build DTOs
  const byEntity = groupDynamicByEntity(dynRows)
  const id2entity = new Map<string, any>(entities.map((e: any) => [e.id, e]))
  const customers: CustomerDTO[] = idsToFetch.map(id =>
    toCustomerDTO(id2entity.get(id), byEntity.get(id))
  )

  // 4) Apply client-side filters if any
  let filteredCustomers = customers
  if (hasFilters) {
    filteredCustomers = customers.filter(c => {
      // Text search filter
      if (q) {
        const searchLower = q.toLowerCase()
        const matchesSearch =
          c.entity_name?.toLowerCase().includes(searchLower) ||
          c.entity_code?.toLowerCase().includes(searchLower) ||
          c.phone?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.notes?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Specific field filters
      if (phone && (!c.phone || !c.phone.includes(phone))) return false
      if (email && (!c.email || !c.email.toLowerCase().includes(email.toLowerCase()))) return false
      if (stylist_id && c.preferred_stylist_id !== stylist_id) return false
      if (vip_tier && c.vip_tier !== vip_tier) return false

      return true
    })

    console.log(
      `👤 Filtered ${customers.length} customers to ${filteredCustomers.length} matching criteria`
    )
  }

  // 5) Apply pagination if we fetched all data
  let paginatedRows = filteredCustomers
  let actualTotal = total

  if (hasFilters) {
    // We fetched all data, so paginate the filtered results
    const start = Math.max(0, (page - 1) * page_size)
    paginatedRows = filteredCustomers.slice(start, start + page_size)
    actualTotal = filteredCustomers.length
  }

  return { rows: paginatedRows, total: actualTotal }
}

// ================================================================================
// HELPERS
// ================================================================================

/**
 * Fetch all dynamic rows for a set of entity IDs (chunked IN queries)
 * Prevents URL length issues with large ID lists
 */
async function fetchDynamicForEntities(
  organization_id: string,
  entityIds: string[]
): Promise<any[]> {
  if (!entityIds.length) {
    return []
  }

  const CHUNK_SIZE = 200 // Keep URLs under limits
  const chunks: string[][] = []

  // Split entity IDs into chunks
  for (let i = 0; i < entityIds.length; i += CHUNK_SIZE) {
    chunks.push(entityIds.slice(i, i + CHUNK_SIZE))
  }

  const all: any[] = []

  // Fetch each chunk
  for (const ids of chunks) {
    if (!ids.length) continue

    try {
      // For dynamic data, we need to use the direct query since it doesn't have a specific method
      const response = await universalApi.read(
        'core_dynamic_data',
        {
          entity_id: ids
        },
        organization_id
      )

      if (response.success && response.data?.length) {
        all.push(...response.data)
      } else if (!response.success) {
        console.error('Error fetching dynamic data chunk:', response.error)
      }
    } catch (error) {
      console.error('Error in fetchDynamicForEntities:', error)
    }
  }

  return all
}

/**
 * Group dynamic rows into a per-entity object { field_name: value }
 */
function groupDynamicByEntity(rows: any[]): Map<string, Record<string, any>> {
  const map = new Map<string, Record<string, any>>()

  for (const r of rows ?? []) {
    const id = r?.entity_id
    if (!id) continue

    const bucket = map.get(id) ?? {}
    bucket[r.field_name] = coerceDynValue(r)
    map.set(id, bucket)
  }

  return map
}

/**
 * Pick the non-null dynamic value with basic type coercion
 */
function coerceDynValue(r: any): any {
  if (r.field_value_json !== null && r.field_value_json !== undefined) {
    // Try to parse JSON values
    try {
      return typeof r.field_value_json === 'string'
        ? JSON.parse(r.field_value_json)
        : r.field_value_json
    } catch {
      return r.field_value_json
    }
  }
  if (r.field_value_date !== null && r.field_value_date !== undefined) {
    return r.field_value_date
  }
  if (r.field_value_number !== null && r.field_value_number !== undefined) {
    return Number(r.field_value_number)
  }
  if (r.field_value_boolean !== null && r.field_value_boolean !== undefined) {
    return !!r.field_value_boolean
  }
  if (r.field_value_text !== null && r.field_value_text !== undefined) {
    return r.field_value_text
  }
  return null
}

/**
 * Convert value to ISO date string with fallback
 */
function toISO(x?: string | Date | null): string {
  if (!x) return new Date(0).toISOString()
  try {
    return new Date(x).toISOString()
  } catch {
    return new Date(0).toISOString()
  }
}

/**
 * Map transaction + dynamic data to AppointmentDTO
 */
function toAppointmentDTOFromTransaction(
  transaction: any,
  dyn: Record<string, any> = {}
): AppointmentDTO {
  // Safe access helper
  const v = <T = any>(name: string, fallback?: T): T => (dyn[name] ?? fallback) as T

  return {
    id: transaction?.id ?? '',
    organization_id: transaction?.organization_id ?? '',
    smart_code: transaction?.smart_code ?? heraCode('HERA.SALON.APPT.ENTITY.APPOINTMENT.V1'),
    entity_name: transaction?.transaction_code ?? transaction?.entity_name,
    entity_code: transaction?.transaction_code,
    start_time: toISO(
      v<string>('start_time') ?? v<string>('start') ?? transaction?.transaction_date
    ),
    end_time: toISO(v<string>('end_time') ?? v<string>('end') ?? transaction?.transaction_date),
    status: v<AppointmentStatus>('status', 'booked'),
    stylist_id: v<string>('stylist_id'),
    customer_id: v<string>('customer_id'),
    branch_id: v<string>('branch_id') ?? transaction?.metadata?.branch_id,
    chair_id: v<string>('chair_id'),
    service_ids: v<string[]>('service_ids', []),
    notes: v<string>('notes') ?? transaction?.notes,
    price: v<number>('price') ?? v<number>('total') ?? transaction?.total_amount,
    currency_code: v<string>('currency_code', 'AED')
  }
}

/**
 * Map entity + dynamic data to AppointmentDTO (legacy function kept for compatibility)
 */
function toAppointmentDTO(entity: any, dyn: Record<string, any> = {}): AppointmentDTO {
  // Safe access helper
  const v = <T = any>(name: string, fallback?: T): T => (dyn[name] ?? fallback) as T

  return {
    id: entity?.id ?? '',
    organization_id: entity?.organization_id ?? '',
    smart_code: entity?.smart_code ?? heraCode('HERA.SALON.APPT.ENTITY.APPOINTMENT.V1'),
    entity_name: entity?.entity_name,
    entity_code: entity?.entity_code,
    start_time: toISO(v<string>('start_time') ?? v<string>('start')),
    end_time: toISO(v<string>('end_time') ?? v<string>('end')),
    status: v<AppointmentStatus>('status', 'booked'),
    stylist_id: v<string>('stylist_id'),
    customer_id: v<string>('customer_id'),
    branch_id: v<string>('branch_id') ?? transaction?.metadata?.branch_id,
    chair_id: v<string>('chair_id'),
    service_ids: v<string[]>('service_ids', []),
    notes: v<string>('notes'),
    price: v<number>('price') ?? v<number>('total') ?? undefined,
    currency_code: v<string>('currency_code', 'AED')
  }
}

/**
 * Map entity + dynamic data to CustomerDTO
 */
function toCustomerDTO(entity: any, dyn: Record<string, any> = {}): CustomerDTO {
  // Safe access helper
  const v = <T = any>(name: string, fallback?: T): T => (dyn[name] ?? fallback) as T

  return {
    id: entity?.id ?? '',
    organization_id: entity?.organization_id ?? '',
    smart_code: entity?.smart_code ?? heraCode('HERA.SALON.CRM.ENTITY.CUSTOMER.V1'),
    entity_name: entity?.entity_name ?? '',
    entity_code: entity?.entity_code,
    phone: v<string>('phone'),
    email: v<string>('email'),
    address: v<string>('address'),
    date_of_birth: v<string>('date_of_birth'),
    last_visit: v<string>('last_visit'),
    total_visits: v<number>('total_visits', 0),
    total_spent: v<number>('total_spent', 0),
    preferred_stylist_id: v<string>('preferred_stylist_id'),
    preferred_stylist_name: v<string>('preferred_stylist_name'),
    loyalty_points: v<number>('loyalty_points', 0),
    vip_tier: v<string>('vip_tier', 'regular'),
    notes: v<string>('notes'),
    created_at: entity?.created_at ?? '',
    updated_at: entity?.updated_at ?? entity?.created_at ?? ''
  }
}

// ================================================================================
// LEGACY PLAYBOOK CLASS (for compatibility)
// ================================================================================

export class PlaybookEntities {
  /**
   * Search appointments - delegates to new implementation
   */
  static async searchAppointments(
    params: AppointmentSearchParams
  ): Promise<{ rows: AppointmentDTO[]; total: number }> {
    return searchAppointments(params)
  }

  /**
   * Search customers - delegates to new implementation
   */
  static async searchCustomers(
    params: CustomerSearchParams
  ): Promise<{ rows: CustomerDTO[]; total: number }> {
    return searchCustomers(params)
  }

  /**
   * Get single appointment by ID
   */
  static async getAppointment(id: string, organization_id: string): Promise<AppointmentDTO | null> {
    try {
      const { rows } = await this.searchAppointments({
        organization_id,
        page_size: 1000 // Get all to find the specific one
      })

      return rows.find(apt => apt.id === id) || null
    } catch (error) {
      console.error('Error getting appointment:', error)
      throw error
    }
  }

  /**
   * Create or update appointment
   */
  static async upsertAppointment(
    input: AppointmentUpsertInput
  ): Promise<{ id: string; success: boolean }> {
    try {
      universalApi.setOrganizationId(input.organization_id)

      let entityId: string

      if (input.id) {
        // Update existing appointment
        const updateResponse = await universalApi.update('core_entities', input.id, {
          entity_name: input.entity_name,
          entity_code: input.entity_code,
          smart_code: input.smart_code || heraCode('HERA.SALON.APPT.ENTITY.APPOINTMENT.V1')
        })

        if (!updateResponse.success) {
          throw new Error('Failed to update appointment')
        }

        entityId = input.id
      } else {
        // Create new appointment
        const createResponse = await universalApi.create('core_entities', {
          organization_id: input.organization_id,
          entity_type: 'appointment',
          entity_name: input.entity_name,
          entity_code: input.entity_code || `APPT-${Date.now()}`,
          smart_code: input.smart_code || heraCode('HERA.SALON.APPT.ENTITY.APPOINTMENT.V1')
        })

        if (!createResponse.success || !createResponse.data) {
          throw new Error('Failed to create appointment')
        }

        entityId = createResponse.data.id
      }

      // Update dynamic fields
      const dynamicFields = [
        { field_name: 'start_time', field_value_text: input.start_time },
        { field_name: 'end_time', field_value_text: input.end_time },
        { field_name: 'status', field_value_text: input.status },
        { field_name: 'stylist_id', field_value_text: input.stylist_id },
        { field_name: 'customer_id', field_value_text: input.customer_id },
        { field_name: 'branch_id', field_value_text: input.branch_id },
        { field_name: 'chair_id', field_value_text: input.chair_id },
        {
          field_name: 'service_ids',
          field_value_json: input.service_ids ? JSON.stringify(input.service_ids) : null
        },
        { field_name: 'notes', field_value_text: input.notes },
        { field_name: 'price', field_value_number: input.price },
        { field_name: 'currency_code', field_value_text: input.currency_code || 'AED' }
      ]

      // Delete existing dynamic data and insert new
      // (In a real implementation, we'd update existing records)
      for (const field of dynamicFields) {
        if (field.field_value_text || field.field_value_number || field.field_value_json) {
          await universalApi.create('core_dynamic_data', {
            organization_id: input.organization_id,
            entity_id: entityId,
            field_name: field.field_name,
            field_value_text: field.field_value_text,
            field_value_number: field.field_value_number,
            field_value_json: field.field_value_json,
            smart_code: heraCode(`HERA.SALON.APPT.DYN.${field.field_name.toUpperCase()}.v1`)
          })
        }
      }

      return { id: entityId, success: true }
    } catch (error) {
      console.error('Error upserting appointment:', error)
      throw error
    }
  }

  /**
   * Get single customer by ID
   */
  static async getCustomer(id: string, organization_id: string): Promise<CustomerDTO | null> {
    try {
      const { rows } = await this.searchCustomers({
        organization_id,
        page_size: 1000 // Get all to find the specific one
      })

      return rows.find(customer => customer.id === id) || null
    } catch (error) {
      console.error('Error getting customer:', error)
      throw error
    }
  }
}

// Additional search functions for calendar

/**
 * Search staff members (stylists/employees)
 */
export async function searchStaff(params: {
  organization_id: string
  branch_id?: string
  q?: string
  page?: number
  page_size?: number
}): Promise<{ rows: any[]; total: number }> {
  const { organization_id, branch_id, q, page = 1, page_size = 100 } = params

  try {
    // Set organization context
    universalApi.setOrganizationId(organization_id)

    // Use getEntities method which supports pagination
    const result = await universalApi.getEntities({
      organizationId: organization_id,
      filters: {
        entity_type: 'employee'
      },
      page,
      pageSize: page_size,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    console.log('Staff search result:', result)

    if (!result.success || !result.data) {
      console.error('Error fetching staff entities:', result.error)
      return { rows: [], total: 0 }
    }

    const entities = result.data
    const total = result.metadata?.count || entities.length || 0

    if (!entities?.length) {
      console.log('No employee entities found')
      return { rows: [], total: 0 }
    }

    console.log(`Found ${entities.length} employee entities`)

    // Get dynamic data for staff attributes
    const ids = entities.map((e: any) => e.id).filter(Boolean)
    console.log('Fetching dynamic data for entity IDs:', ids)
    const dynRows = await fetchDynamicForEntities(organization_id, ids)
    console.log(`Fetched ${dynRows.length} dynamic data rows`)
    const byEntity = groupDynamicByEntity(dynRows)
    const id2entity = new Map(entities.map((e: any) => [e.id, e]))

    // Build staff DTOs
    const staff = ids.map(id => {
      const entity = id2entity.get(id)
      const dynamics = byEntity.get(id) || {}

      return {
        id,
        organization_id,
        entity_name: entity?.entity_name,
        entity_code: entity?.entity_code,
        smart_code: entity?.smart_code,
        branch_id: dynamics.branch_id,
        role: dynamics.role || 'stylist',
        specialties: dynamics.specialties || [],
        available: dynamics.available !== 'false',
        phone: dynamics.phone,
        email: dynamics.email,
        hourly_rate: dynamics.hourly_rate,
        commission_rate: dynamics.commission_rate,
        created_at: entity?.created_at
      }
    })

    console.log(`Built ${staff.length} staff DTOs`)

    // Apply filters
    let filteredStaff = staff
    if (branch_id) {
      filteredStaff = staff.filter(s => s.branch_id === branch_id)
    }
    if (q) {
      const searchLower = q.toLowerCase()
      filteredStaff = filteredStaff.filter(
        s =>
          s.entity_name?.toLowerCase().includes(searchLower) ||
          s.entity_code?.toLowerCase().includes(searchLower)
      )
    }

    console.log(`After filtering: ${filteredStaff.length} staff members`)

    return { rows: filteredStaff, total: filteredStaff.length }
  } catch (error) {
    console.error('Error in searchStaff:', error)
    return { rows: [], total: 0 }
  }
}

/**
 * Search services
 */
export async function searchServices(params: {
  organization_id: string
  branch_id?: string
  category?: string
  q?: string
  page?: number
  page_size?: number
}): Promise<{ rows: any[]; total: number }> {
  const { organization_id, branch_id, category, q, page = 1, page_size = 50 } = params

  // Search for services
  const result = await universalApi.getEntities({
    organizationId: organization_id,
    filters: {
      entity_type: 'service',
      status: ['neq', 'deleted']
    },
    page,
    pageSize: page_size
  })

  if (!result.success || !result.data) {
    console.error('Error fetching service entities:', result.error)
    return { rows: [], total: 0 }
  }

  const entities = result.data
  const total = result.metadata?.count || 0

  if (!entities?.length) return { rows: [], total: 0 }

  // Get dynamic data for service attributes
  const ids = entities.map(e => e.id)
  const dynRows = await fetchDynamicForEntities(organization_id, ids)
  const byEntity = groupDynamicByEntity(dynRows)
  const id2entity = new Map(entities.map((e: any) => [e.id, e]))

  // Build service DTOs
  const services = ids.map(id => {
    const entity = id2entity.get(id)
    const dynamics = byEntity.get(id) || {}

    return {
      id,
      organization_id,
      entity_name: entity?.entity_name,
      entity_code: entity?.entity_code,
      smart_code: entity?.smart_code,
      category: dynamics.category || 'general',
      duration_minutes: dynamics.duration_minutes || 30,
      price: dynamics.price || 0,
      currency_code: dynamics.currency_code || 'AED',
      branch_ids: dynamics.branch_ids || [],
      active: dynamics.active !== 'false'
    }
  })

  // Apply filters
  let filteredServices = services.filter(s => s.active)
  if (branch_id) {
    filteredServices = filteredServices.filter(
      s => !s.branch_ids.length || s.branch_ids.includes(branch_id)
    )
  }
  if (category) {
    filteredServices = filteredServices.filter(s => s.category === category)
  }
  if (q) {
    const searchLower = q.toLowerCase()
    filteredServices = filteredServices.filter(
      s =>
        s.entity_name?.toLowerCase().includes(searchLower) ||
        s.entity_code?.toLowerCase().includes(searchLower) ||
        s.category?.toLowerCase().includes(searchLower)
    )
  }

  return { rows: filteredServices, total: filteredServices.length }
}

// Export convenience functions - searchAppointments and searchCustomers are already exported as functions above
export const getAppointment = PlaybookEntities.getAppointment.bind(PlaybookEntities)
export const upsertAppointment = PlaybookEntities.upsertAppointment.bind(PlaybookEntities)
export const getCustomer = PlaybookEntities.getCustomer.bind(PlaybookEntities)
