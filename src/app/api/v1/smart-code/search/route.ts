import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface SmartCodeSearchRequest {
  organization_id: string
  search_criteria: {
    pattern?: string           // Smart code pattern to match
    module?: string           // Specific module (REST, HLTH, MFG, etc.)
    sub_module?: string       // Specific sub-module (CRM, INV, FIN, etc.)
    function_type?: string    // Specific function (ENT, TXN, CALC, etc.)
    entity_type?: string      // Specific entity type
    version?: string          // Specific version
    status?: string           // Smart code status (DRAFT, PROD, DEPRECATED)
  }
  filters?: {
    include_system_org?: boolean  // Include system organization templates
    entity_types?: string[]       // Filter by entity types
    date_range?: {
      from: string
      to: string
    }
  }
  pagination?: {
    page: number
    limit: number
  }
  sort?: {
    field: 'smart_code' | 'entity_name' | 'created_at' | 'updated_at'
    direction: 'asc' | 'desc'
  }
}

interface SmartCodeSearchResponse {
  results: Array<{
    smart_code: string
    entity_id: string
    entity_name: string
    entity_type: string
    entity_code: string
    smart_code_status: string
    smart_code_version: string
    organization_id: string
    organization_name?: string
    created_at: string
    updated_at: string
    metadata?: any
    dynamic_fields?: Array<{
      field_name: string
      field_type: string
      field_value: any
    }>
  }>
  pagination: {
    page: number
    limit: number
    total_count: number
    total_pages: number
    has_next_page: boolean
    has_previous_page: boolean
  }
  aggregations: {
    by_module: Record<string, number>
    by_sub_module: Record<string, number>
    by_function_type: Record<string, number>
    by_status: Record<string, number>
  }
  suggestions: string[]
}

function buildSmartCodePattern(criteria: SmartCodeSearchRequest['search_criteria']): string {
  const { pattern, module, sub_module, function_type, entity_type, version } = criteria
  
  if (pattern) {
    return pattern
  }
  
  let smartCodePattern = 'HERA'
  smartCodePattern += module ? `.${module}` : '.%'
  smartCodePattern += sub_module ? `.${sub_module}` : '.%'  
  smartCodePattern += function_type ? `.${function_type}` : '.%'
  smartCodePattern += entity_type ? `.${entity_type}` : '.%'
  smartCodePattern += version ? `.${version}` : '.%'
  
  return smartCodePattern
}

function buildWhereClause(criteria: SmartCodeSearchRequest['search_criteria'], filters: SmartCodeSearchRequest['filters']) {
  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1

  // Smart code pattern matching
  const pattern = buildSmartCodePattern(criteria)
  if (pattern !== 'HERA.%.%.%.%.%') {
    conditions.push(`smart_code ILIKE $${paramIndex}`)
    params.push(pattern)
    paramIndex++
  }

  // Status filter
  if (criteria.status) {
    conditions.push(`smart_code_status = $${paramIndex}`)
    params.push(criteria.status)
    paramIndex++
  }

  // Entity type filter
  if (filters?.entity_types && filters.entity_types.length > 0) {
    conditions.push(`entity_type = ANY($${paramIndex})`)
    params.push(filters.entity_types)
    paramIndex++
  }

  // Date range filter
  if (filters?.date_range) {
    conditions.push(`created_at >= $${paramIndex} AND created_at <= $${paramIndex + 1}`)
    params.push(filters.date_range.from, filters.date_range.to)
    paramIndex += 2
  }

  return { conditions, params }
}

async function searchSmartCodes(request: SmartCodeSearchRequest): Promise<SmartCodeSearchResponse> {
  const { organization_id, search_criteria, filters, pagination, sort } = request
  
  // Pagination defaults
  const page = pagination?.page || 1
  const limit = Math.min(pagination?.limit || 20, 100) // Max 100 results per page
  const offset = (page - 1) * limit

  // Sort defaults
  const sortField = sort?.field || 'smart_code'
  const sortDirection = sort?.direction || 'asc'

  // Build organization filter
  const orgFilters = [organization_id]
  if (filters?.include_system_org) {
    orgFilters.push('719dfed1-09b4-4ca8-bfda-f682460de945') // HERA System Org
  }

  try {
    // Build the base query
    let query = supabase
      .from('core_entities')
      .select(`
        id,
        smart_code,
        entity_name,
        entity_type,
        entity_code,
        smart_code_status,
        smart_code_version,
        organization_id,
        created_at,
        updated_at,
        metadata,
        core_organizations!core_entities_organization_id_fkey(organization_name)
      `)
      .in('organization_id', orgFilters)
      .not('smart_code', 'is', null)

    // Apply search criteria
    const pattern = buildSmartCodePattern(search_criteria)
    if (pattern !== 'HERA.%.%.%.%.%') {
      query = query.ilike('smart_code', pattern)
    }

    if (search_criteria.status) {
      query = query.eq('smart_code_status', search_criteria.status)
    }

    if (filters?.entity_types && filters.entity_types.length > 0) {
      query = query.in('entity_type', filters.entity_types)
    }

    if (filters?.date_range) {
      query = query
        .gte('created_at', filters.date_range.from)
        .lte('created_at', filters.date_range.to)
    }

    // Get total count for pagination
    const countQuery = query
    const { count: totalCount } = await countQuery.select('*', { count: 'exact', head: true })

    // Apply sorting and pagination
    query = query
      .order(sortField, { ascending: sortDirection === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: entities, error } = await query

    if (error) {
      throw error
    }

    // Get dynamic data for the found entities
    const entityIds = entities?.map(e => e.id) || []
    let dynamicData: any[] = []
    
    if (entityIds.length > 0) {
      const { data: dynData } = await supabase
        .from('core_dynamic_data')
        .select('entity_id, field_name, field_type, field_value_text, field_value_number, field_value_boolean, field_value_json')
        .in('entity_id', entityIds)
        .in('organization_id', orgFilters)

      dynamicData = dynData || []
    }

    // Process results
    const results = entities?.map(entity => ({
      smart_code: entity.smart_code,
      entity_id: entity.id,
      entity_name: entity.entity_name,
      entity_type: entity.entity_type,
      entity_code: entity.entity_code,
      smart_code_status: entity.smart_code_status || 'DRAFT',
      smart_code_version: entity.smart_code_version || 'v1',
      organization_id: entity.organization_id,
      organization_name: entity.core_organizations?.organization_name,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      metadata: entity.metadata,
      dynamic_fields: dynamicData
        .filter(d => d.entity_id === entity.id)
        .map(d => ({
          field_name: d.field_name,
          field_type: d.field_type,
          field_value: d.field_type === 'text' ? d.field_value_text :
                      d.field_type === 'number' ? d.field_value_number :
                      d.field_type === 'boolean' ? d.field_value_boolean :
                      d.field_value_json
        }))
    })) || []

    // Calculate aggregations
    const aggregations = {
      by_module: {} as Record<string, number>,
      by_sub_module: {} as Record<string, number>,
      by_function_type: {} as Record<string, number>,
      by_status: {} as Record<string, number>
    }

    results.forEach(result => {
      const parts = result.smart_code.split('.')
      if (parts.length >= 5) {
        const module = parts[1]
        const subModule = parts[2]
        const functionType = parts[3]
        const status = result.smart_code_status

        aggregations.by_module[module] = (aggregations.by_module[module] || 0) + 1
        aggregations.by_sub_module[subModule] = (aggregations.by_sub_module[subModule] || 0) + 1
        aggregations.by_function_type[functionType] = (aggregations.by_function_type[functionType] || 0) + 1
        aggregations.by_status[status] = (aggregations.by_status[status] || 0) + 1
      }
    })

    // Generate suggestions
    const suggestions: string[] = []
    if (results.length === 0) {
      suggestions.push('No smart codes found matching your criteria')
      suggestions.push('Try broadening your search or including system organization templates')
      suggestions.push('Use pattern matching with wildcards like "HERA.REST.%.%.%.%"')
    } else {
      suggestions.push(`Found ${results.length} smart codes`)
      if (Object.keys(aggregations.by_module).length > 1) {
        suggestions.push(`Multiple modules found: ${Object.keys(aggregations.by_module).join(', ')}`)
      }
    }

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return {
      results,
      pagination: {
        page,
        limit,
        total_count: totalCount || 0,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_previous_page: page > 1
      },
      aggregations,
      suggestions
    }

  } catch (error) {
    console.error('Smart code search error:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body: SmartCodeSearchRequest = await request.json()
    const { organization_id } = body

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    const results = await searchSmartCodes(body)
    return NextResponse.json(results)

  } catch (error) {
    console.error('Smart code search error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during search',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()

  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')

  if (!organizationId) {
    return NextResponse.json({
      endpoint: '/api/v1/smart-code/search',
      description: 'HERA Smart Code Search System',
      search_capabilities: [
        'pattern_matching',
        'module_filtering',
        'status_filtering',
        'date_range_filtering',
        'cross_organization_search',
        'aggregated_results'
      ],
      example_request: {
        organization_id: 'uuid-here',
        search_criteria: {
          pattern: 'HERA.REST.%.TXN.%.%',
          module: 'REST',
          status: 'PROD'
        },
        filters: {
          include_system_org: true,
          entity_types: ['transaction', 'calculation'],
          date_range: {
            from: '2025-01-01',
            to: '2025-12-31'
          }
        },
        pagination: {
          page: 1,
          limit: 20
        },
        sort: {
          field: 'smart_code',
          direction: 'asc'
        }
      }
    })
  }

  // Quick search with just organization_id
  try {
    const quickSearchRequest: SmartCodeSearchRequest = {
      organization_id: organizationId,
      search_criteria: {},
      filters: {
        include_system_org: searchParams.get('include_system') === 'true'
      },
      pagination: {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10')
      }
    }

    const results = await searchSmartCodes(quickSearchRequest)
    return NextResponse.json(results)

  } catch (error) {
    console.error('Quick search error:', error)
    return NextResponse.json(
      { error: 'Error performing quick search' },
      { status: 500 }
    )
  }
}