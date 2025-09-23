/**
 * Salon Products API Route
 * Uses fn_entities_with_soh RPC to fetch products with stock-on-hand and attributes
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

// Query parameters schema
const queryParamsSchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  status: z.enum(['active', 'archived', 'all']).default('active'),
  category: z.string().trim().min(1).max(120).optional(),
  branch_id: z.string().uuid().optional(),
  sort: z.enum(['name_asc', 'name_desc', 'updated_desc', 'updated_asc']).default('name_asc'),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0)
})

// Product creation schema
const createProductSchema = z.object({
  name: z.string().trim().min(1).max(255),
  code: z.string().trim().min(1).max(50).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).default('AED'),
  description: z.string().trim().max(1000).optional(),
  requires_inventory: z.boolean().default(false)
})

// Product update schema
const updateProductSchema = createProductSchema.partial()

export async function GET(request: NextRequest) {
  try {
    // Authenticate and get organization ID from token
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const params = queryParamsSchema.parse(searchParams)

    // Get Supabase service client
    const supabase = getSupabaseService()

    // Use the playbook entities endpoint for products
    const url = new URL('/api/playbook/entities', request.url)
    url.searchParams.set('type', 'HERA.SALON.PRODUCT.V1')
    url.searchParams.set('organization_id', organizationId)
    url.searchParams.set('limit', params.limit.toString())
    url.searchParams.set('offset', params.offset.toString())

    if (params.status !== 'all') {
      url.searchParams.set('status', params.status)
    }

    if (params.branch_id) {
      url.searchParams.set('branch_entity_id', params.branch_id)
    }

    // Forward the request to the entities endpoint
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-correlation-id': request.headers.get('x-correlation-id') || `prod-${Date.now()}`
      }
    })

    if (!response.ok) {
      throw new Error(`Entities API failed: ${response.statusText}`)
    }

    const data = await response.json()

    // Transform the response to match expected product format
    const items = (data.items || []).map((product: any) => {
      const attributes = product.attributes || {}

      return {
        id: product.id,
        entity_name: product.entity_name,
        entity_code: product.entity_code || null,
        status: product.status,
        smart_code: product.smart_code || 'HERA.SALON.PRODUCT.V1',
        qty_on_hand: product.qty_on_hand || 0,
        // Extract from dynamic data/attributes
        price: attributes['product.price'] || null,
        category: attributes['product.category'] || null,
        description: attributes['product.description'] || null,
        currency: attributes['product.currency'] || 'AED',
        requires_inventory: attributes['product.requires_inventory'] || false,
        created_at: product.created_at || null,
        updated_at: product.updated_at || null
      }
    })

    // Apply client-side filtering for category if needed
    const filteredItems = params.category
      ? items.filter((item: any) => item.category === params.category)
      : items

    // Apply client-side search if needed
    const searchedItems = params.q
      ? filteredItems.filter(
          (item: any) =>
            item.entity_name.toLowerCase().includes(params.q!.toLowerCase()) ||
            (item.entity_code && item.entity_code.toLowerCase().includes(params.q!.toLowerCase()))
        )
      : filteredItems

    // Apply client-side sorting
    const sortedItems = [...searchedItems].sort((a: any, b: any) => {
      const field = params.sort.includes('name') ? 'entity_name' : 'updated_at'
      const order = params.sort.includes('desc') ? -1 : 1

      if (a[field] < b[field]) return -1 * order
      if (a[field] > b[field]) return 1 * order
      return 0
    })

    return NextResponse.json({
      items: sortedItems,
      total_count: data.page?.total || sortedItems.length,
      limit: params.limit,
      offset: params.offset
    })
  } catch (error) {
    console.error('Salon products API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get organization ID from token
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId
    const body = await request.json()

    // Validate the request body
    const productData = createProductSchema.parse(body)

    // Get Supabase service client
    const supabase = getSupabaseService()

    // Generate product code if not provided
    const productCode = productData.code || `PROD-${Date.now()}`

    // Create the product entity
    const { data: product, error: createError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'product',
        entity_name: productData.name,
        entity_code: productCode,
        smart_code: 'HERA.SALON.PRODUCT.V1',
        status: 'active'
      })
      .select('*')
      .single()

    if (createError || !product) {
      console.error('Failed to create product entity:', createError)
      return NextResponse.json(
        { error: 'Failed to create product', details: createError?.message },
        { status: 500 }
      )
    }

    // Create dynamic data fields for product attributes
    const dynamicFields = []

    if (productData.price !== undefined) {
      dynamicFields.push({
        organization_id: organizationId,
        entity_id: product.id,
        field_name: 'product.price',
        field_type: 'number',
        field_value_number: productData.price,
        smart_code: 'HERA.SALON.PRODUCT.PRICE.V1'
      })
    }

    if (productData.category) {
      dynamicFields.push({
        organization_id: organizationId,
        entity_id: product.id,
        field_name: 'product.category',
        field_type: 'text',
        field_value_text: productData.category,
        smart_code: 'HERA.SALON.PRODUCT.CATEGORY.V1'
      })
    }

    if (productData.description) {
      dynamicFields.push({
        organization_id: organizationId,
        entity_id: product.id,
        field_name: 'product.description',
        field_type: 'text',
        field_value_text: productData.description,
        smart_code: 'HERA.SALON.PRODUCT.DESCRIPTION.V1'
      })
    }

    if (productData.currency) {
      dynamicFields.push({
        organization_id: organizationId,
        entity_id: product.id,
        field_name: 'product.currency',
        field_type: 'text',
        field_value_text: productData.currency,
        smart_code: 'HERA.SALON.PRODUCT.CURRENCY.V1'
      })
    }

    if (productData.requires_inventory !== undefined) {
      dynamicFields.push({
        organization_id: organizationId,
        entity_id: product.id,
        field_name: 'product.requires_inventory',
        field_type: 'text',
        field_value_text: productData.requires_inventory.toString(),
        smart_code: 'HERA.SALON.PRODUCT.INVENTORY.V1'
      })
    }

    // Insert dynamic fields if any
    if (dynamicFields.length > 0) {
      const { error: dynamicError } = await supabase.from('core_dynamic_data').insert(dynamicFields)

      if (dynamicError) {
        console.error('Failed to create product dynamic data:', dynamicError)
        // Don't fail the request, but log the error
      }
    }

    return NextResponse.json(
      {
        id: product.id,
        entity_name: product.entity_name,
        entity_code: product.entity_code,
        status: product.status,
        smart_code: product.smart_code,
        ...productData
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create product error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid product data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Authenticate and get organization ID from token
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId
    const body = await request.json()

    // Extract product ID from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const productId = pathSegments[pathSegments.length - 1]

    if (!productId || !productId.match(/^[0-9a-f-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    // Validate the request body
    const productData = updateProductSchema.parse(body)

    // Get Supabase service client
    const supabase = getSupabaseService()

    // Update the product entity
    const entityUpdates: any = {}
    if (productData.name) entityUpdates.entity_name = productData.name
    if (productData.code) entityUpdates.entity_code = productData.code

    if (Object.keys(entityUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('core_entities')
        .update(entityUpdates)
        .eq('id', productId)
        .eq('organization_id', organizationId)

      if (updateError) {
        console.error('Failed to update product entity:', updateError)
        return NextResponse.json(
          { error: 'Failed to update product', details: updateError.message },
          { status: 500 }
        )
      }
    }

    // Update dynamic data fields
    const dynamicUpdates = []

    if (productData.price !== undefined) {
      dynamicUpdates.push({
        field_name: 'product.price',
        field_type: 'number',
        field_value_number: productData.price,
        field_value_text: null,
        field_value_json: null
      })
    }

    if (productData.category !== undefined) {
      dynamicUpdates.push({
        field_name: 'product.category',
        field_type: 'text',
        field_value_text: productData.category,
        field_value_number: null,
        field_value_json: null
      })
    }

    if (productData.description !== undefined) {
      dynamicUpdates.push({
        field_name: 'product.description',
        field_type: 'text',
        field_value_text: productData.description,
        field_value_number: null,
        field_value_json: null
      })
    }

    if (productData.currency !== undefined) {
      dynamicUpdates.push({
        field_name: 'product.currency',
        field_type: 'text',
        field_value_text: productData.currency,
        field_value_number: null,
        field_value_json: null
      })
    }

    if (productData.requires_inventory !== undefined) {
      dynamicUpdates.push({
        field_name: 'product.requires_inventory',
        field_type: 'text',
        field_value_text: productData.requires_inventory.toString(),
        field_value_number: null,
        field_value_json: null
      })
    }

    // Update each dynamic field
    for (const update of dynamicUpdates) {
      await supabase.from('core_dynamic_data').upsert({
        organization_id: organizationId,
        entity_id: productId,
        ...update,
        smart_code: `HERA.SALON.PRODUCT.${update.field_name.split('.')[1].toUpperCase()}.V1`
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update product error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid product data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate and get organization ID from token
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId

    // Extract product ID from URL
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const productId = pathSegments[pathSegments.length - 1]

    if (!productId || !productId.match(/^[0-9a-f-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    // Get Supabase service client
    const supabase = getSupabaseService()

    // Check if product exists and belongs to organization
    const { data: product, error: fetchError } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('id', productId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'product')
      .single()

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete dynamic data first
    await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('entity_id', productId)
      .eq('organization_id', organizationId)

    // Delete the product entity
    const { error: deleteError } = await supabase
      .from('core_entities')
      .delete()
      .eq('id', productId)
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.error('Failed to delete product:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete product', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
