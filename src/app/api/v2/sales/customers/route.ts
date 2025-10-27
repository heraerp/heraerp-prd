import { NextRequest, NextResponse } from 'next/server'
import { selectValue, selectRows } from '@/lib/db'
import { validateEntityUpsert } from '@/lib/guardrail'

export const runtime = 'nodejs'

/**
 * Sales Customer Management API v2
 * Smart Code: HERA.SALES.CRM.ENT.CUST.v1
 * 
 * Handles CRUD operations for customers with contact management,
 * relationship tracking, sales history, and account insights.
 */

interface CustomerRequest {
  organization_id: string
  customer_name: string
  customer_type?: string
  company_name?: string
  industry?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  website?: string
  assigned_to?: string
  territory_id?: string
  credit_limit?: number
  currency?: string
  payment_terms?: string
  tax_id?: string
  customer_since?: string
  status?: string
  priority?: string
  notes?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  actor_user_id?: string
}

interface CustomerQuery {
  organization_id: string
  customer_type?: string
  industry?: string
  assigned_to?: string
  territory_id?: string
  status?: string
  priority?: string
  city?: string
  state?: string
  country?: string
  search?: string
  created_after?: string
  created_before?: string
  has_active_opportunities?: boolean
  limit?: number
  offset?: number
}

const CUSTOMER_TYPES = [
  'PROSPECT', 'CUSTOMER', 'PARTNER', 'COMPETITOR', 'VENDOR', 'OTHER'
]

const CUSTOMER_PRIORITIES = [
  'LOW', 'MEDIUM', 'HIGH', 'STRATEGIC'
]

const CUSTOMER_STATUSES = [
  'ACTIVE', 'INACTIVE', 'PROSPECT', 'ON_HOLD', 'ARCHIVED'
]

// POST - Create or Update Customer
export async function POST(req: NextRequest) {
  try {
    const body: CustomerRequest = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    // Validate required fields
    if (!body.organization_id || !body.customer_name) {
      return NextResponse.json({
        error: 'missing_required_fields',
        required: ['organization_id', 'customer_name']
      }, { status: 400 })
    }

    // Validate customer type
    if (body.customer_type && !CUSTOMER_TYPES.includes(body.customer_type)) {
      return NextResponse.json({
        error: 'invalid_customer_type',
        valid_types: CUSTOMER_TYPES
      }, { status: 400 })
    }

    // Validate priority
    if (body.priority && !CUSTOMER_PRIORITIES.includes(body.priority)) {
      return NextResponse.json({
        error: 'invalid_priority',
        valid_priorities: CUSTOMER_PRIORITIES
      }, { status: 400 })
    }

    // Generate smart code and entity code
    const smart_code = 'HERA.SALES.CRM.ENT.CUST.v1'
    const entity_code = await generateCustomerCode(body.organization_id)

    // Prepare dynamic data for customer-specific fields
    const customerDynamicData = {
      customer_type: body.customer_type || 'CUSTOMER',
      company_name: body.company_name,
      industry: body.industry,
      contact_person: body.contact_person,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      state: body.state,
      country: body.country,
      postal_code: body.postal_code,
      website: body.website,
      territory_id: body.territory_id,
      credit_limit: body.credit_limit,
      currency: body.currency || 'USD',
      payment_terms: body.payment_terms,
      tax_id: body.tax_id,
      customer_since: body.customer_since || new Date().toISOString().split('T')[0],
      priority: body.priority || 'MEDIUM',
      notes: body.notes,
      ...body.custom_fields
    }

    // Enhanced metadata with customer-specific information
    const customerMetadata = {
      enterprise_module: 'SALES',
      sub_module: 'CRM',
      workflow_state: body.status || 'ACTIVE',
      assigned_to: body.assigned_to,
      customer_type: body.customer_type || 'CUSTOMER',
      priority: body.priority || 'MEDIUM',
      industry: body.industry,
      created_via: 'sales_api_v2',
      last_contact_date: null,
      total_revenue: 0,
      opportunity_count: 0,
      last_order_date: null
    }

    // Create entity using universal API
    const entitySql = `
      select hera_entity_upsert_v1(
        $1::uuid, $2::text, $3::text, $4::text,
        $5::uuid, $6::text, $7::text, $8::uuid, $9::text, $10::text[],
        $11::text, $12::jsonb, $13::jsonb, $14::numeric, $15::text, $16::jsonb, $17::jsonb, $18::uuid
      ) as entity_id;
    `

    const entityParams = [
      body.organization_id,
      'CUST',
      body.customer_name,
      smart_code,
      null, // entity_id (new customer)
      entity_code,
      `Customer: ${body.customer_name}${body.company_name ? ' (' + body.company_name + ')' : ''}`,
      null, // parent_entity_id
      'active',
      body.tags || null,
      'ACTIVE', // smart_code_status
      {}, // business_rules
      customerMetadata,
      0, // ai_confidence
      null, // ai_classification
      {}, // ai_insights
      customerDynamicData,
      body.actor_user_id || null
    ]

    const entity_id = await selectValue<string>(entitySql, entityParams)

    // Create customer-specific relationships
    await createCustomerRelationships(entity_id, body.organization_id, {
      territory_id: body.territory_id,
      assigned_to: body.assigned_to
    })

    // Create customer lifecycle entry
    await createCustomerLifecycleEntry(entity_id, 'CUSTOMER_CREATED', body.actor_user_id)

    return NextResponse.json({
      api_version: 'v2',
      customer_id: entity_id,
      entity_code,
      customer_type: customerMetadata.customer_type,
      priority: customerMetadata.priority,
      created_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Customer creation error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to create customer'
    }, { status: 500 })
  }
}

// GET - Query Customers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query: CustomerQuery = {
      organization_id: searchParams.get('organization_id') || '',
      customer_type: searchParams.get('customer_type') || undefined,
      industry: searchParams.get('industry') || undefined,
      assigned_to: searchParams.get('assigned_to') || undefined,
      territory_id: searchParams.get('territory_id') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      country: searchParams.get('country') || undefined,
      search: searchParams.get('search') || undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
      has_active_opportunities: searchParams.get('has_active_opportunities') === 'true',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    if (!query.organization_id) {
      return NextResponse.json({ error: 'missing_organization_id' }, { status: 400 })
    }

    // Build dynamic WHERE clause
    const whereConditions = ['e.organization_id = $1', 'e.entity_type = $2', 'e.status = $3']
    const params: any[] = [query.organization_id, 'CUST', 'active']
    let paramIndex = 4

    if (query.customer_type) {
      whereConditions.push(`e.metadata->>'customer_type' = $${paramIndex}`)
      params.push(query.customer_type)
      paramIndex++
    }

    if (query.industry) {
      whereConditions.push(`dd_industry.field_value = $${paramIndex}`)
      params.push(query.industry)
      paramIndex++
    }

    if (query.assigned_to) {
      whereConditions.push(`e.metadata->>'assigned_to' = $${paramIndex}`)
      params.push(query.assigned_to)
      paramIndex++
    }

    if (query.territory_id) {
      whereConditions.push(`dd_territory.field_value = $${paramIndex}`)
      params.push(query.territory_id)
      paramIndex++
    }

    if (query.status) {
      whereConditions.push(`e.metadata->>'workflow_state' = $${paramIndex}`)
      params.push(query.status)
      paramIndex++
    }

    if (query.priority) {
      whereConditions.push(`e.metadata->>'priority' = $${paramIndex}`)
      params.push(query.priority)
      paramIndex++
    }

    if (query.city) {
      whereConditions.push(`dd_city.field_value ILIKE $${paramIndex}`)
      params.push(`%${query.city}%`)
      paramIndex++
    }

    if (query.state) {
      whereConditions.push(`dd_state.field_value ILIKE $${paramIndex}`)
      params.push(`%${query.state}%`)
      paramIndex++
    }

    if (query.country) {
      whereConditions.push(`dd_country.field_value ILIKE $${paramIndex}`)
      params.push(`%${query.country}%`)
      paramIndex++
    }

    if (query.search) {
      whereConditions.push(`(
        e.entity_name ILIKE $${paramIndex} OR 
        e.entity_description ILIKE $${paramIndex} OR
        dd_company.field_value ILIKE $${paramIndex} OR
        dd_email.field_value ILIKE $${paramIndex} OR
        dd_contact.field_value ILIKE $${paramIndex}
      )`)
      params.push(`%${query.search}%`)
      paramIndex++
    }

    if (query.created_after) {
      whereConditions.push(`e.created_at >= $${paramIndex}::timestamptz`)
      params.push(query.created_after)
      paramIndex++
    }

    if (query.created_before) {
      whereConditions.push(`e.created_at <= $${paramIndex}::timestamptz`)
      params.push(query.created_before)
      paramIndex++
    }

    if (query.has_active_opportunities) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM core_entities opp 
        WHERE opp.organization_id = e.organization_id 
        AND opp.entity_type = 'OPP' 
        AND opp.status = 'active'
        AND EXISTS (
          SELECT 1 FROM core_dynamic_data dd_cust_link 
          WHERE dd_cust_link.entity_id = opp.entity_id 
          AND dd_cust_link.field_name = 'customer_id' 
          AND dd_cust_link.field_value = e.entity_id::text
          AND dd_cust_link.status = 'active'
        )
        AND opp.metadata->>'stage' NOT IN ('WON', 'LOST')
      )`)
    }

    // Add limit and offset
    params.push(query.limit, query.offset)

    const sql = `
      SELECT 
        e.entity_id as customer_id,
        e.entity_name as customer_name,
        e.entity_code,
        e.entity_description,
        e.metadata->>'customer_type' as customer_type,
        e.metadata->>'priority' as priority,
        e.metadata->>'workflow_state' as status,
        e.metadata->>'assigned_to' as assigned_to,
        e.metadata->>'industry' as industry,
        e.metadata->>'total_revenue' as total_revenue,
        e.metadata->>'opportunity_count' as opportunity_count,
        e.metadata->>'last_contact_date' as last_contact_date,
        e.metadata->>'last_order_date' as last_order_date,
        e.tags,
        e.created_at,
        e.updated_at,
        -- Customer-specific dynamic data
        dd_company.field_value as company_name,
        dd_contact.field_value as contact_person,
        dd_email.field_value as email,
        dd_phone.field_value as phone,
        dd_address.field_value as address,
        dd_city.field_value as city,
        dd_state.field_value as state,
        dd_country.field_value as country,
        dd_postal.field_value as postal_code,
        dd_website.field_value as website,
        dd_credit.field_value as credit_limit,
        dd_currency.field_value as currency,
        dd_payment.field_value as payment_terms,
        dd_tax.field_value as tax_id,
        dd_since.field_value as customer_since,
        dd_notes.field_value as notes,
        dd_industry.field_value as industry_detail,
        -- Related entity information
        t_entity.entity_name as territory_name,
        -- Assigned user information
        u_profile.display_name as assigned_to_name,
        -- Aggregated metrics
        (
          SELECT COUNT(*) 
          FROM core_entities opp 
          WHERE opp.organization_id = e.organization_id 
          AND opp.entity_type = 'OPP' 
          AND opp.status = 'active'
          AND EXISTS (
            SELECT 1 FROM core_dynamic_data dd_cust_link 
            WHERE dd_cust_link.entity_id = opp.entity_id 
            AND dd_cust_link.field_name = 'customer_id' 
            AND dd_cust_link.field_value = e.entity_id::text
            AND dd_cust_link.status = 'active'
          )
        ) as active_opportunities,
        (
          SELECT COALESCE(SUM((opp.metadata->>'amount')::numeric), 0)
          FROM core_entities opp 
          WHERE opp.organization_id = e.organization_id 
          AND opp.entity_type = 'OPP' 
          AND opp.status = 'active'
          AND opp.metadata->>'stage' = 'WON'
          AND EXISTS (
            SELECT 1 FROM core_dynamic_data dd_cust_link 
            WHERE dd_cust_link.entity_id = opp.entity_id 
            AND dd_cust_link.field_name = 'customer_id' 
            AND dd_cust_link.field_value = e.entity_id::text
            AND dd_cust_link.status = 'active'
          )
        ) as won_revenue
      FROM core_entities e
      -- Dynamic data joins for customer fields
      LEFT JOIN core_dynamic_data dd_company ON e.entity_id = dd_company.entity_id 
        AND dd_company.field_name = 'company_name' AND dd_company.status = 'active'
      LEFT JOIN core_dynamic_data dd_contact ON e.entity_id = dd_contact.entity_id 
        AND dd_contact.field_name = 'contact_person' AND dd_contact.status = 'active'
      LEFT JOIN core_dynamic_data dd_email ON e.entity_id = dd_email.entity_id 
        AND dd_email.field_name = 'email' AND dd_email.status = 'active'
      LEFT JOIN core_dynamic_data dd_phone ON e.entity_id = dd_phone.entity_id 
        AND dd_phone.field_name = 'phone' AND dd_phone.status = 'active'
      LEFT JOIN core_dynamic_data dd_address ON e.entity_id = dd_address.entity_id 
        AND dd_address.field_name = 'address' AND dd_address.status = 'active'
      LEFT JOIN core_dynamic_data dd_city ON e.entity_id = dd_city.entity_id 
        AND dd_city.field_name = 'city' AND dd_city.status = 'active'
      LEFT JOIN core_dynamic_data dd_state ON e.entity_id = dd_state.entity_id 
        AND dd_state.field_name = 'state' AND dd_state.status = 'active'
      LEFT JOIN core_dynamic_data dd_country ON e.entity_id = dd_country.entity_id 
        AND dd_country.field_name = 'country' AND dd_country.status = 'active'
      LEFT JOIN core_dynamic_data dd_postal ON e.entity_id = dd_postal.entity_id 
        AND dd_postal.field_name = 'postal_code' AND dd_postal.status = 'active'
      LEFT JOIN core_dynamic_data dd_website ON e.entity_id = dd_website.entity_id 
        AND dd_website.field_name = 'website' AND dd_website.status = 'active'
      LEFT JOIN core_dynamic_data dd_credit ON e.entity_id = dd_credit.entity_id 
        AND dd_credit.field_name = 'credit_limit' AND dd_credit.status = 'active'
      LEFT JOIN core_dynamic_data dd_currency ON e.entity_id = dd_currency.entity_id 
        AND dd_currency.field_name = 'currency' AND dd_currency.status = 'active'
      LEFT JOIN core_dynamic_data dd_payment ON e.entity_id = dd_payment.entity_id 
        AND dd_payment.field_name = 'payment_terms' AND dd_payment.status = 'active'
      LEFT JOIN core_dynamic_data dd_tax ON e.entity_id = dd_tax.entity_id 
        AND dd_tax.field_name = 'tax_id' AND dd_tax.status = 'active'
      LEFT JOIN core_dynamic_data dd_since ON e.entity_id = dd_since.entity_id 
        AND dd_since.field_name = 'customer_since' AND dd_since.status = 'active'
      LEFT JOIN core_dynamic_data dd_notes ON e.entity_id = dd_notes.entity_id 
        AND dd_notes.field_name = 'notes' AND dd_notes.status = 'active'
      LEFT JOIN core_dynamic_data dd_industry ON e.entity_id = dd_industry.entity_id 
        AND dd_industry.field_name = 'industry' AND dd_industry.status = 'active'
      LEFT JOIN core_dynamic_data dd_territory ON e.entity_id = dd_territory.entity_id 
        AND dd_territory.field_name = 'territory_id' AND dd_territory.status = 'active'
      -- Territory entity lookup
      LEFT JOIN core_entities t_entity ON dd_territory.field_value = t_entity.entity_id::text
        AND t_entity.entity_type = 'TERR' AND t_entity.status = 'active'
      -- User profile lookup for assigned_to
      LEFT JOIN user_profiles u_profile ON e.metadata->>'assigned_to' = u_profile.user_id::text
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        CASE e.metadata->>'priority'
          WHEN 'STRATEGIC' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
          ELSE 5
        END,
        e.entity_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const customers = await selectRows(sql, params)

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM core_entities e
      LEFT JOIN core_dynamic_data dd_industry ON e.entity_id = dd_industry.entity_id 
        AND dd_industry.field_name = 'industry' AND dd_industry.status = 'active'
      LEFT JOIN core_dynamic_data dd_territory ON e.entity_id = dd_territory.entity_id 
        AND dd_territory.field_name = 'territory_id' AND dd_territory.status = 'active'
      LEFT JOIN core_dynamic_data dd_city ON e.entity_id = dd_city.entity_id 
        AND dd_city.field_name = 'city' AND dd_city.status = 'active'
      LEFT JOIN core_dynamic_data dd_state ON e.entity_id = dd_state.entity_id 
        AND dd_state.field_name = 'state' AND dd_state.status = 'active'
      LEFT JOIN core_dynamic_data dd_country ON e.entity_id = dd_country.entity_id 
        AND dd_country.field_name = 'country' AND dd_country.status = 'active'
      LEFT JOIN core_dynamic_data dd_company ON e.entity_id = dd_company.entity_id 
        AND dd_company.field_name = 'company_name' AND dd_company.status = 'active'
      LEFT JOIN core_dynamic_data dd_email ON e.entity_id = dd_email.entity_id 
        AND dd_email.field_name = 'email' AND dd_email.status = 'active'
      LEFT JOIN core_dynamic_data dd_contact ON e.entity_id = dd_contact.entity_id 
        AND dd_contact.field_name = 'contact_person' AND dd_contact.status = 'active'
      WHERE ${whereConditions.join(' AND ')}
    `
    
    const countParams = params.slice(0, -2) // Remove limit and offset
    const totalResult = await selectValue<number>(countSql, countParams)

    // Calculate customer statistics
    const stats = await calculateCustomerStatistics(query.organization_id)

    return NextResponse.json({
      api_version: 'v2',
      customers,
      pagination: {
        total: totalResult || 0,
        limit: query.limit,
        offset: query.offset,
        has_more: (query.offset || 0) + (query.limit || 50) < (totalResult || 0)
      },
      statistics: stats,
      filters: {
        customer_type: query.customer_type,
        industry: query.industry,
        assigned_to: query.assigned_to,
        territory_id: query.territory_id,
        status: query.status,
        priority: query.priority,
        has_active_opportunities: query.has_active_opportunities
      }
    })

  } catch (error) {
    console.error('Customer query error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to query customers'
    }, { status: 500 })
  }
}

// Helper functions
async function generateCustomerCode(organizationId: string): Promise<string> {
  const sql = `
    SELECT COUNT(*) + 1 as next_number
    FROM core_entities 
    WHERE organization_id = $1::uuid AND entity_type = 'CUST'
  `
  const nextNumber = await selectValue<number>(sql, [organizationId])
  return `CUST-${String(nextNumber).padStart(6, '0')}`
}

async function createCustomerRelationships(
  customerId: string, 
  organizationId: string, 
  relationships: { territory_id?: string; assigned_to?: string }
) {
  const relationshipPromises = []

  // Create territory relationship if specified
  if (relationships.territory_id) {
    const territoryRelSql = `
      INSERT INTO core_relationships (
        organization_id, from_entity_id, to_entity_id, relationship_type,
        relationship_metadata, status, created_at
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, 'CUSTOMER_TERRITORY',
        '{"description": "Customer assigned to territory"}'::jsonb, 'active', NOW()
      )
    `
    relationshipPromises.push(
      selectValue(territoryRelSql, [organizationId, customerId, relationships.territory_id])
    )
  }

  // Create user assignment relationship if specified
  if (relationships.assigned_to) {
    const userRelSql = `
      INSERT INTO core_relationships (
        organization_id, from_entity_id, to_entity_id, relationship_type,
        relationship_metadata, status, created_at
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, 'CUSTOMER_ASSIGNED_TO',
        '{"description": "Customer assigned to user"}'::jsonb, 'active', NOW()
      )
    `
    relationshipPromises.push(
      selectValue(userRelSql, [organizationId, customerId, relationships.assigned_to])
    )
  }

  await Promise.all(relationshipPromises)
}

async function createCustomerLifecycleEntry(
  customerId: string, 
  lifecycleEvent: string, 
  userId?: string
) {
  const sql = `
    INSERT INTO customer_lifecycle_events (
      customer_id, event_type, event_description, created_by, created_at
    ) VALUES (
      $1::uuid, $2, 'Customer lifecycle event: ' || $2, $3::uuid, NOW()
    )
  `
  await selectValue(sql, [customerId, lifecycleEvent, userId])
}

async function calculateCustomerStatistics(organizationId: string) {
  const sql = `
    SELECT 
      COUNT(*) as total_customers,
      COUNT(*) FILTER (WHERE e.metadata->>'customer_type' = 'CUSTOMER') as active_customers,
      COUNT(*) FILTER (WHERE e.metadata->>'customer_type' = 'PROSPECT') as prospects,
      COUNT(*) FILTER (WHERE e.metadata->>'customer_type' = 'PARTNER') as partners,
      COUNT(*) FILTER (WHERE e.metadata->>'priority' = 'STRATEGIC') as strategic_customers,
      COUNT(*) FILTER (WHERE e.metadata->>'priority' = 'HIGH') as high_priority_customers,
      COUNT(*) FILTER (WHERE e.metadata->>'workflow_state' = 'ACTIVE') as active_status,
      COUNT(*) FILTER (WHERE e.metadata->>'workflow_state' = 'INACTIVE') as inactive_status,
      COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '30 days') as customers_this_month,
      COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '7 days') as customers_this_week,
      -- Customer with opportunities
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM core_entities opp 
        WHERE opp.organization_id = e.organization_id 
        AND opp.entity_type = 'OPP' 
        AND opp.status = 'active'
        AND EXISTS (
          SELECT 1 FROM core_dynamic_data dd_cust_link 
          WHERE dd_cust_link.entity_id = opp.entity_id 
          AND dd_cust_link.field_name = 'customer_id' 
          AND dd_cust_link.field_value = e.entity_id::text
          AND dd_cust_link.status = 'active'
        )
        AND opp.metadata->>'stage' NOT IN ('WON', 'LOST')
      )) as customers_with_active_opportunities
    FROM core_entities e
    WHERE e.organization_id = $1::uuid 
      AND e.entity_type = 'CUST' 
      AND e.status = 'active'
  `
  
  return await selectValue(sql, [organizationId])
}