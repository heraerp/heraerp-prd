/**
 * Salon Products API V2 - Using HERA RPC Functions
 * Implements proper multi-tenant product management with smart codes
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

// Product creation schema
const createProductSchema = z.object({
  name: z.string().trim().min(1).max(255),
  code: z.string().trim().min(1).max(50).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).default('AED'),
  description: z.string().trim().max(1000).optional(),
  requires_inventory: z.boolean().default(true),
  reorder_point: z.number().min(0).optional(),
  brand: z.string().trim().max(100).optional(),
  barcode: z.string().trim().max(50).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get organization ID from token
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId
    const userId = authResult.userId
    const body = await request.json()

    // Validate the request body
    const productData = createProductSchema.parse(body)

    // Get Supabase service client
    const supabase = getSupabaseService()

    // Generate product code if not provided
    const productCode = productData.code || `SKU-${Date.now()}`

    // Step 1: Create/Update product entity using RPC
    const { data: entityResult, error: entityError } = await supabase.rpc('hera_entity_upsert_v1', {
      p_org_id: organizationId,
      p_entity_type: 'product',
      p_entity_name: productData.name,
      p_smart_code: 'HERA.SALON.CATALOG.PRODUCT.RETAIL.V1',
      p_entity_code: productCode,
      p_entity_id: null, // null for create
      p_metadata: {
        source: 'ui:/salon/products',
        created_via: 'API_V2',
        description: productData.description,
        category: productData.category || 'General',
        tax_code: 'VAT_STD',
        uom: 'EA'
      }
    })

    if (entityError || !entityResult) {
      console.error('Failed to create product entity:', entityError)
      return NextResponse.json(
        { error: 'Failed to create product', details: entityError?.message },
        { status: 500 }
      )
    }

    // Check if the result is successful and get the entity_id
    if (!entityResult || !entityResult.success) {
      console.error('Entity creation failed:', entityResult)
      return NextResponse.json({ error: 'Failed to create product entity' }, { status: 500 })
    }

    const productId = entityResult.data.id

    // Step 2: Add dynamic fields using hera_dynamic_data_upsert_v1
    const dynamicFieldsToCreate = []

    // Price
    if (productData.price !== undefined) {
      dynamicFieldsToCreate.push({
        field_name: 'price',
        field_type: 'number',
        field_value: productData.price,
        smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.PRICE.V1'
      })
    }

    // Currency
    dynamicFieldsToCreate.push({
      field_name: 'currency',
      field_type: 'text',
      field_value: productData.currency,
      smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.CURRENCY.V1'
    })

    // Brand
    if (productData.brand) {
      dynamicFieldsToCreate.push({
        field_name: 'brand',
        field_type: 'text',
        field_value: productData.brand,
        smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.BRAND.V1'
      })
    }

    // Barcode
    if (productData.barcode) {
      dynamicFieldsToCreate.push({
        field_name: 'barcode',
        field_type: 'text',
        field_value: productData.barcode,
        smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.BARCODE.V1'
      })
    }

    // Reorder Point
    if (productData.reorder_point !== undefined) {
      dynamicFieldsToCreate.push({
        field_name: 'reorder_point',
        field_type: 'number',
        field_value: productData.reorder_point,
        smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.REORDER.V1'
      })
    }

    // Requires Inventory
    dynamicFieldsToCreate.push({
      field_name: 'requires_inventory',
      field_type: 'boolean',
      field_value: productData.requires_inventory,
      smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.INVENTORY.V1'
    })

    // Insert all dynamic fields using RPC
    for (const field of dynamicFieldsToCreate) {
      const params: any = {
        p_organization_id: organizationId,
        p_entity_id: productId,
        p_field_name: field.field_name,
        p_field_type: field.field_type,
        p_smart_code: field.smart_code
      }

      // Set the appropriate value field based on type
      if (field.field_type === 'number') {
        params.p_field_value_number = field.field_value
      } else if (field.field_type === 'boolean') {
        params.p_field_value_boolean = field.field_value
      } else if (field.field_type === 'text') {
        params.p_field_value_text = field.field_value
      }

      const { error: dynamicError } = await supabase.rpc('hera_dynamic_data_set_v1', params)

      if (dynamicError) {
        console.error(`Warning: Failed to create field ${field.field_name}:`, dynamicError)
      }
    }

    // Step 3: Add initial inventory tracking as dynamic data
    if (productData.requires_inventory) {
      // Add stock quantity as dynamic fields
      const inventoryParams = {
        p_organization_id: organizationId,
        p_entity_id: productId,
        p_field_name: 'qty_on_hand',
        p_field_type: 'number',
        p_field_value_number: 0,
        p_smart_code: 'HERA.SALON.INVENTORY.QTY.ONHAND.V1'
      }

      const { error: invError } = await supabase.rpc('hera_dynamic_data_set_v1', inventoryParams)

      if (invError) {
        console.warn('Failed to create inventory tracking:', invError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: productId,
          entity_name: productData.name,
          entity_code: productCode,
          status: 'active',
          smart_code: 'HERA.SALON.CATALOG.PRODUCT.RETAIL.V1',
          ...productData
        }
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

// GET endpoint - Read products using hera_entity_read_v1
export async function GET(request: NextRequest) {
  try {
    // Authenticate and get organization ID from token
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId

    // Get query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const status = searchParams.status || 'active'
    const limit = parseInt(searchParams.limit || '50')
    const offset = parseInt(searchParams.offset || '0')

    // Get Supabase service client
    const supabase = getSupabaseService()

    // Use hera_entity_read_v1 to fetch products
    const { data: result, error } = await supabase.rpc('hera_entity_read_v1', {
      p_organization_id: organizationId,
      p_entity_id: null,
      p_entity_type: 'product',
      p_entity_code: null,
      p_smart_code: null,
      p_status: status === 'all' ? null : status,
      p_include_relationships: false,
      p_include_dynamic_data: true,
      p_limit: limit,
      p_offset: offset
    })

    if (error) {
      console.error('Failed to fetch products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products', details: error.message },
        { status: 500 }
      )
    }

    // Transform the result for UI consumption
    const products = (result?.entities || []).map((entity: any) => {
      const dynamicData = entity.dynamic_data || {}

      return {
        id: entity.id,
        entity_name: entity.entity_name,
        entity_code: entity.entity_code,
        status: entity.status,
        smart_code: entity.smart_code,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
        // Extract dynamic fields
        price: dynamicData.price || 0,
        currency: dynamicData.currency || 'AED',
        brand: dynamicData.brand || null,
        barcode: dynamicData.barcode || null,
        reorder_point: dynamicData.reorder_point || 0,
        requires_inventory: dynamicData.requires_inventory !== false,
        category: entity.business_rules?.category || 'General',
        // Stock info would come from inventory relationships
        qty_on_hand: 0 // TODO: Join with inventory
      }
    })

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        total: result?.total_count || products.length,
        limit: limit,
        offset: offset
      }
    })
  } catch (error) {
    console.error('Fetch products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE endpoint - Soft delete using hera_entity_delete_v1
export async function DELETE(request: NextRequest) {
  try {
    // Get product ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const productId = pathParts[pathParts.length - 1]

    if (!productId || productId === 'route.ts') {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Authenticate
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId

    // Get Supabase service client
    const supabase = getSupabaseService()

    // Soft delete the product
    const { data: result, error } = await supabase.rpc('hera_entity_delete_v1', {
      p_organization_id: organizationId,
      p_entity_id: productId,
      p_cascade_dynamic_data: true,
      p_cascade_relationships: true
    })

    if (error) {
      console.error('Failed to delete product:', error)
      return NextResponse.json(
        { error: 'Failed to delete product', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product archived successfully'
    })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
