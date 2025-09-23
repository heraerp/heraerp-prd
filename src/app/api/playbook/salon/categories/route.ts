/**
 * Salon Categories API Route
 * Entity-based category management with service counting
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

// Request validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().optional(),
  sort_order: z.number().int().min(0).optional()
})

const queryParamsSchema = z.object({
  status: z.enum(['active', 'archived', 'all']).default('active'),
  sort: z.enum(['name_asc', 'name_desc', 'order_asc', 'order_desc']).default('order_asc'),
  q: z.string().optional()
})

// GET /api/playbook/salon/categories
export async function GET(request: NextRequest) {
  try {
    // Authenticate and get organization ID
    const authResult = await verifyAuth(request)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const params = queryParamsSchema.parse(searchParams)

    const supabase = getSupabaseService()

    // Step 1: Fetch categories
    let categoriesQuery = supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'service_category')

    // Apply status filter
    if (params.status !== 'all') {
      categoriesQuery = categoriesQuery.eq('status', params.status)
    }

    // Apply search filter
    if (params.q) {
      categoriesQuery = categoriesQuery.or(`entity_name.ilike.%${params.q}%,entity_code.ilike.%${params.q}%`)
    }

    const { data: categories, error: categoriesError } = await categoriesQuery

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json({ items: [], total_count: 0 })
    }

    // Step 2: Get service counts for each category
    const categoryIds = categories.map(c => c.id)
    
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('to_entity_id')
      .eq('organization_id', organizationId)
      .eq('relationship_type', 'BELONGS_TO_CATEGORY')
      .in('to_entity_id', categoryIds)

    if (relError) {
      console.error('Error fetching relationships:', relError)
    }

    // Count services per category
    const serviceCounts = new Map<string, number>()
    if (relationships) {
      relationships.forEach(rel => {
        const categoryId = rel.to_entity_id
        serviceCounts.set(categoryId, (serviceCounts.get(categoryId) || 0) + 1)
      })
    }

    // Step 3: Get dynamic data for categories
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_text, field_value_number')
      .eq('organization_id', organizationId)
      .in('entity_id', categoryIds)
      .in('field_name', ['category.color', 'category.icon', 'category.sort_order', 'category.description'])

    if (dynamicError) {
      console.error('Error fetching dynamic data:', dynamicError)
    }

    // Map dynamic data by entity
    const dynamicDataMap = new Map<string, any>()
    if (dynamicData) {
      dynamicData.forEach(dd => {
        if (!dynamicDataMap.has(dd.entity_id)) {
          dynamicDataMap.set(dd.entity_id, {})
        }
        const entityData = dynamicDataMap.get(dd.entity_id)
        
        switch (dd.field_name) {
          case 'category.color':
            entityData.color = dd.field_value_text
            break
          case 'category.icon':
            entityData.icon = dd.field_value_text
            break
          case 'category.sort_order':
            entityData.sort_order = dd.field_value_number || 0
            break
          case 'category.description':
            entityData.description = dd.field_value_text
            break
        }
      })
    }

    // Step 4: Format response
    const formattedCategories = categories.map(category => {
      const dynamicFields = dynamicDataMap.get(category.id) || {}
      return {
        id: category.id,
        entity_name: category.entity_name,
        entity_code: category.entity_code,
        status: category.status,
        smart_code: category.smart_code,
        created_at: category.created_at,
        updated_at: category.updated_at,
        service_count: serviceCounts.get(category.id) || 0,
        color: dynamicFields.color || '#D4AF37',
        icon: dynamicFields.icon || 'Tag',
        sort_order: dynamicFields.sort_order || 0,
        description: dynamicFields.description || null
      }
    })

    // Step 5: Sort results
    formattedCategories.sort((a, b) => {
      switch (params.sort) {
        case 'name_asc':
          return a.entity_name.localeCompare(b.entity_name)
        case 'name_desc':
          return b.entity_name.localeCompare(a.entity_name)
        case 'order_asc':
          return a.sort_order - b.sort_order
        case 'order_desc':
          return b.sort_order - a.sort_order
        default:
          return a.sort_order - b.sort_order
      }
    })

    return NextResponse.json({
      items: formattedCategories,
      total_count: formattedCategories.length
    })

  } catch (error) {
    console.error('Categories API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/playbook/salon/categories
export async function POST(request: NextRequest) {
  try {
    // Authenticate and get organization ID
    const authResult = await verifyAuth(request)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId
    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    const supabase = getSupabaseService()

    // Check for duplicate name
    const { data: existing } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'service_category')
      .eq('entity_name', validatedData.name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    // Create category entity
    const categoryCode = validatedData.code || `cat-${validatedData.name.toLowerCase().replace(/\s+/g, '-')}`
    
    const { data: category, error: createError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'service_category',
        entity_name: validatedData.name,
        entity_code: categoryCode,
        smart_code: 'HERA.SALON.SVC.CATEGORY.MASTER.V1',
        status: 'active'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating category:', createError)
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      )
    }

    // Add dynamic data
    const dynamicInserts = []
    
    if (validatedData.description) {
      dynamicInserts.push({
        organization_id: organizationId,
        entity_id: category.id,
        field_name: 'category.description',
        field_type: 'text',
        field_value_text: validatedData.description,
        smart_code: 'HERA.SALON.SVC.CATEGORY.FIELD.DESCRIPTION.V1'
      })
    }

    if (validatedData.color) {
      dynamicInserts.push({
        organization_id: organizationId,
        entity_id: category.id,
        field_name: 'category.color',
        field_type: 'text',
        field_value_text: validatedData.color,
        smart_code: 'HERA.SALON.SVC.CATEGORY.FIELD.COLOR.V1'
      })
    }

    if (validatedData.icon) {
      dynamicInserts.push({
        organization_id: organizationId,
        entity_id: category.id,
        field_name: 'category.icon',
        field_type: 'text',
        field_value_text: validatedData.icon,
        smart_code: 'HERA.SALON.SVC.CATEGORY.FIELD.ICON.V1'
      })
    }

    if (validatedData.sort_order !== undefined) {
      dynamicInserts.push({
        organization_id: organizationId,
        entity_id: category.id,
        field_name: 'category.sort_order',
        field_type: 'number',
        field_value_number: validatedData.sort_order,
        smart_code: 'HERA.SALON.SVC.CATEGORY.FIELD.SORT_ORDER.V1'
      })
    }

    if (dynamicInserts.length > 0) {
      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicInserts)

      if (dynamicError) {
        console.error('Error adding dynamic data:', dynamicError)
        // Don't fail the whole operation, category was created
      }
    }

    // Return formatted response
    return NextResponse.json({
      id: category.id,
      entity_name: category.entity_name,
      entity_code: category.entity_code,
      status: category.status,
      smart_code: category.smart_code,
      created_at: category.created_at,
      updated_at: category.updated_at,
      service_count: 0,
      color: validatedData.color || '#D4AF37',
      icon: validatedData.icon || 'Tag',
      sort_order: validatedData.sort_order || 0,
      description: validatedData.description || null
    })

  } catch (error) {
    console.error('Create category error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}