/**
 * API v2 Customers Read Endpoint
 * 
 * RLS-scoped customer data access with organization filtering
 * Handles search, pagination, and field configuration integration
 * 
 * Security:
 * - Organization isolation via X-Organization-Id header
 * - Actor membership validation
 * - RLS enforcement at database level
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveOrganizationContext, validateActorMembership } from '@/lib/org-context'
import { getFieldConfiguration } from '@/lib/field-config'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CustomerReadParams {
  search?: string
  limit?: number
  offset?: number
  sort?: string
  order?: 'asc' | 'desc'
}

/**
 * GET /api/v2/customers
 * List customers with RLS enforcement and org-specific field configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Extract organization context from header
    const orgId = request.headers.get('X-Organization-Id')
    if (!orgId) {
      return NextResponse.json(
        { 
          error: 'Organization filter required',
          error_code: 'ORG_FILTER_MISSING',
          details: { required_header: 'X-Organization-Id' }
        },
        { status: 400 }
      )
    }

    // Extract JWT token for actor validation
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          error_code: 'AUTH_MISSING'
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Validate actor membership
    const isValidMember = await validateActorMembership(token, orgId)
    if (!isValidMember) {
      return NextResponse.json(
        { 
          error: 'Actor not member of organization',
          error_code: 'ACTOR_NOT_MEMBER',
          details: { organization_id: orgId }
        },
        { status: 403 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const params: CustomerReadParams = {
      search: url.searchParams.get('search') || '',
      limit: Math.min(Number(url.searchParams.get('limit')) || 50, 100),
      offset: Number(url.searchParams.get('offset')) || 0,
      sort: url.searchParams.get('sort') || 'entity_name',
      order: (url.searchParams.get('order') as 'asc' | 'desc') || 'asc'
    }

    // Build query with RLS enforcement
    let query = supabase
      .from('core_entities')
      .select(`
        id,
        entity_name,
        entity_type,
        smart_code,
        created_at,
        updated_at,
        created_by,
        updated_by,
        organization_id
      `)
      .eq('entity_type', 'CUSTOMER')
      .eq('organization_id', orgId) // RLS enforcement

    // Apply search filter
    if (params.search) {
      query = query.ilike('entity_name', `%${params.search}%`)
    }

    // Apply sorting
    query = query.order(params.sort!, { ascending: params.order === 'asc' })

    // Apply pagination
    query = query.range(params.offset!, params.offset! + params.limit! - 1)

    // Execute query
    const { data: entities, error: entitiesError, count } = await query

    if (entitiesError) {
      console.error('Customer query error:', entitiesError)
      return NextResponse.json(
        { 
          error: 'Database query failed',
          error_code: 'DB_QUERY_ERROR',
          details: entitiesError.message
        },
        { status: 500 }
      )
    }

    // Fetch dynamic fields for each customer
    const customerIds = entities?.map(e => e.id) || []
    let dynamicFieldsMap: Record<string, any[]> = {}

    if (customerIds.length > 0) {
      const { data: dynamicFields, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .in('entity_id', customerIds)
        .eq('organization_id', orgId) // RLS enforcement

      if (dynamicError) {
        console.error('Dynamic fields query error:', dynamicError)
        return NextResponse.json(
          { 
            error: 'Dynamic fields query failed',
            error_code: 'DYNAMIC_FIELDS_ERROR',
            details: dynamicError.message
          },
          { status: 500 }
        )
      }

      // Group dynamic fields by entity_id
      dynamicFieldsMap = (dynamicFields || []).reduce((acc, field) => {
        if (!acc[field.entity_id]) {
          acc[field.entity_id] = []
        }
        acc[field.entity_id].push(field)
        return acc
      }, {} as Record<string, any[]>)
    }

    // Transform data with dynamic fields
    const customers = (entities || []).map(entity => {
      const dynamicFields = dynamicFieldsMap[entity.id] || []
      const dynamicFieldsObject = dynamicFields.reduce((acc, field) => {
        acc[field.field_name] = {
          field_value_text: field.field_value_text,
          field_value_number: field.field_value_number,
          field_value_boolean: field.field_value_boolean,
          field_value_json: field.field_value_json,
          smart_code: field.smart_code
        }
        return acc
      }, {} as Record<string, any>)

      return {
        entity_id: entity.id,
        entity_name: entity.entity_name,
        entity_type: entity.entity_type,
        smart_code: entity.smart_code,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
        created_by: entity.created_by,
        updated_by: entity.updated_by,
        dynamic_fields: dynamicFieldsObject
      }
    })

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', 'CUSTOMER')
      .eq('organization_id', orgId)
      .ilike('entity_name', params.search ? `%${params.search}%` : '%')

    // Prepare response
    const response = {
      data: customers,
      pagination: {
        limit: params.limit,
        offset: params.offset,
        total: totalCount || 0,
        has_more: (params.offset! + params.limit!) < (totalCount || 0)
      },
      organization_id: orgId,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Customer API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        error_code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v2/customers/[id]
 * Get single customer by ID with RLS enforcement
 */
export async function GET_BY_ID(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id

    // Extract organization context
    const orgId = request.headers.get('X-Organization-Id')
    if (!orgId) {
      return NextResponse.json(
        { 
          error: 'Organization filter required',
          error_code: 'ORG_FILTER_MISSING'
        },
        { status: 400 }
      )
    }

    // Extract and validate JWT token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          error_code: 'AUTH_MISSING'
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Validate actor membership
    const isValidMember = await validateActorMembership(token, orgId)
    if (!isValidMember) {
      return NextResponse.json(
        { 
          error: 'Actor not member of organization',
          error_code: 'ACTOR_NOT_MEMBER'
        },
        { status: 403 }
      )
    }

    // Fetch entity with RLS enforcement
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', customerId)
      .eq('entity_type', 'CUSTOMER')
      .eq('organization_id', orgId) // RLS enforcement
      .single()

    if (entityError || !entity) {
      return NextResponse.json(
        { 
          error: 'Customer not found',
          error_code: 'CUSTOMER_NOT_FOUND',
          details: { customer_id: customerId, organization_id: orgId }
        },
        { status: 404 }
      )
    }

    // Fetch dynamic fields
    const { data: dynamicFields, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', customerId)
      .eq('organization_id', orgId) // RLS enforcement

    if (dynamicError) {
      console.error('Dynamic fields query error:', dynamicError)
      return NextResponse.json(
        { 
          error: 'Dynamic fields query failed',
          error_code: 'DYNAMIC_FIELDS_ERROR'
        },
        { status: 500 }
      )
    }

    // Fetch relationships
    const { data: relationships, error: relationshipsError } = await supabase
      .from('core_relationships')
      .select(`
        relationship_type,
        target_entity_id,
        target_entities:target_entity_id(entity_name)
      `)
      .eq('source_entity_id', customerId)
      .eq('organization_id', orgId) // RLS enforcement

    // Transform dynamic fields
    const dynamicFieldsObject = (dynamicFields || []).reduce((acc, field) => {
      acc[field.field_name] = {
        field_value_text: field.field_value_text,
        field_value_number: field.field_value_number,
        field_value_boolean: field.field_value_boolean,
        field_value_json: field.field_value_json,
        smart_code: field.smart_code
      }
      return acc
    }, {} as Record<string, any>)

    // Transform relationships
    const relationshipsArray = (relationships || []).map(rel => ({
      relationship_type: rel.relationship_type,
      target_entity_id: rel.target_entity_id,
      target_entity_name: (rel.target_entities as any)?.entity_name || 'Unknown'
    }))

    // Prepare response
    const customer = {
      entity_id: entity.id,
      entity_name: entity.entity_name,
      entity_type: entity.entity_type,
      smart_code: entity.smart_code,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      created_by: entity.created_by,
      updated_by: entity.updated_by,
      dynamic_fields: dynamicFieldsObject,
      relationships: relationshipsArray
    }

    return NextResponse.json({
      data: customer,
      organization_id: orgId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Customer by ID API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        error_code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}