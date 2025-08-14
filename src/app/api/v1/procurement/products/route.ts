import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Steve Jobs Principle: "Simplicity is the ultimate sophistication"
// Universal product catalog that elegantly handles any type of product or material

// GET /api/v1/procurement/products - List products with intelligent filtering
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    
    // Steve Jobs: "Focus and simplicity" - smart defaults with powerful options
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeSpecs = searchParams.get('include_specs') === 'true'

    console.log('📦 Procurement: Loading products with intelligent filtering')

    // Universal architecture - products are entities with dynamic specifications
    let query = supabaseAdmin
      .from('core_entities')
      .select(`
        *,
        dynamic_data:core_dynamic_data(
          field_name,
          field_value,
          field_value_number,
          field_value_boolean,
          field_type
        )
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'product')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Add intelligent filtering
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`entity_name.ilike.%${search}%,entity_code.ilike.%${search}%`)
    }

    const { data: products, error } = await query

    if (error) {
      console.error('❌ Error fetching products:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Transform to user-friendly format (Steve Jobs: "It just works")
    const transformedProducts = products.map(product => {
      // Convert dynamic data to flat object
      const dynamicProps = product.dynamic_data?.reduce((acc: any, prop: any) => {
        // Get the correct value based on field type
        let value = prop.field_value
        if (prop.field_type === 'number' && prop.field_value_number !== null) {
          value = prop.field_value_number
        } else if (prop.field_type === 'boolean' && prop.field_value_boolean !== null) {
          value = prop.field_value_boolean
        }
        acc[prop.field_name] = value
        return acc
      }, {}) || {}

      return {
        id: product.id,
        name: product.entity_name,
        code: product.entity_code,
        status: product.status,
        created_at: product.created_at,
        updated_at: product.updated_at,
        description: product.description,
        
        // Basic Product Information
        category: dynamicProps.category || 'general',
        brand: dynamicProps.brand || '',
        model: dynamicProps.model || '',
        manufacturer: dynamicProps.manufacturer || '',
        
        // Inventory Details
        unit_of_measure: dynamicProps.unit_of_measure || 'each',
        minimum_stock: parseInt(dynamicProps.minimum_stock || '0'),
        reorder_point: parseInt(dynamicProps.reorder_point || '0'),
        lead_time_days: parseInt(dynamicProps.lead_time_days || '0'),
        
        // Pricing
        standard_cost: parseFloat(dynamicProps.standard_cost || '0'),
        last_purchase_price: parseFloat(dynamicProps.last_purchase_price || '0'),
        list_price: parseFloat(dynamicProps.list_price || '0'),
        
        // Physical Specifications (if requested)
        ...(includeSpecs && {
          weight: parseFloat(dynamicProps.weight || '0'),
          dimensions: dynamicProps.dimensions || '',
          color: dynamicProps.color || '',
          material: dynamicProps.material || '',
          hazardous: dynamicProps.hazardous === 'true',
          perishable: dynamicProps.perishable === 'true',
          storage_requirements: dynamicProps.storage_requirements || '',
          
          // Custom specifications (flexible for any industry)
          specifications: Object.keys(dynamicProps)
            .filter(key => key.startsWith('spec_'))
            .reduce((specs: any, key) => {
              specs[key.replace('spec_', '')] = dynamicProps[key]
              return specs
            }, {})
        })
      }
    })

    // Steve Jobs: "Details are not details. They make the design."
    const response = {
      success: true,
      data: transformedProducts,
      meta: {
        total: transformedProducts.length,
        search: search || null,
        category_filter: category || null,
        status_filter: status,
        includes_specs: includeSpecs
      }
    }

    console.log(`✅ Loaded ${transformedProducts.length} products successfully`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Products API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/procurement/products - Create product with Jobs-level attention to detail
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const productData = await request.json()

    console.log('📦 Procurement: Creating new product with universal architecture')

    // Steve Jobs: "Innovation distinguishes between a leader and a follower."
    // Validate required fields with helpful error messages
    const requiredFields = ['name', 'category', 'unit_of_measure']
    const missingFields = requiredFields.filter(field => !productData[field]?.trim?.())
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}`,
          required_fields: requiredFields
        },
        { status: 400 }
      )
    }

    // Auto-generate product code if not provided (Steve Jobs: "It just works")
    const productCode = productData.code || 
      'PROD_' + productData.name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 20) + '_' + Date.now().toString().slice(-4)

    // Create product entity using universal architecture
    const { data: product, error: productError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'product',
        entity_name: productData.name.trim(),
        entity_code: productCode,
        status: productData.status || 'active',
        description: productData.description || ''
      })
      .select()
      .single()

    if (productError) {
      console.error('❌ Error creating product entity:', productError)
      return NextResponse.json(
        { success: false, message: 'Failed to create product' },
        { status: 500 }
      )
    }

    // Store dynamic properties with elegant handling
    const dynamicProperties = [
      // Basic Product Information
      { name: 'category', value: productData.category, type: 'text' },
      { name: 'brand', value: productData.brand || '', type: 'text' },
      { name: 'model', value: productData.model || '', type: 'text' },
      { name: 'manufacturer', value: productData.manufacturer || '', type: 'text' },
      
      // Inventory Details
      { name: 'unit_of_measure', value: productData.unit_of_measure, type: 'text' },
      { name: 'minimum_stock', value: (productData.minimum_stock || 0).toString(), type: 'number' },
      { name: 'reorder_point', value: (productData.reorder_point || 0).toString(), type: 'number' },
      { name: 'lead_time_days', value: (productData.lead_time_days || 0).toString(), type: 'number' },
      
      // Pricing
      { name: 'standard_cost', value: (productData.standard_cost || 0).toString(), type: 'number' },
      { name: 'list_price', value: (productData.list_price || 0).toString(), type: 'number' },
      
      // Physical Specifications
      { name: 'weight', value: (productData.weight || 0).toString(), type: 'number' },
      { name: 'dimensions', value: productData.dimensions || '', type: 'text' },
      { name: 'color', value: productData.color || '', type: 'text' },
      { name: 'material', value: productData.material || '', type: 'text' },
      { name: 'hazardous', value: productData.hazardous ? 'true' : 'false', type: 'boolean' },
      { name: 'perishable', value: productData.perishable ? 'true' : 'false', type: 'boolean' },
      { name: 'storage_requirements', value: productData.storage_requirements || '', type: 'text' },
      
      // Initialize inventory counters
      { name: 'current_stock', value: '0', type: 'number' },
      { name: 'reserved_stock', value: '0', type: 'number' },
      { name: 'available_stock', value: '0', type: 'number' }
    ].filter(prop => prop.value !== '') // Only store non-empty values

    // Handle custom specifications (flexible for any industry)
    if (productData.specifications) {
      Object.entries(productData.specifications).forEach(([key, value]) => {
        dynamicProperties.push({
          name: `spec_${key}`,
          value: String(value),
          type: typeof value === 'number' ? 'number' : 'text'
        })
      })
    }

    // Insert dynamic properties
    if (dynamicProperties.length > 0) {
      const { error: dynamicError } = await supabaseAdmin
        .from('core_dynamic_data')
        .insert(
          dynamicProperties.map(prop => {
            const baseProps = {
              organization_id: organizationId,
              entity_id: product.id,
              field_name: prop.name,
              field_type: prop.type
            }
            
            // Set the appropriate value column based on type
            if (prop.type === 'number') {
              return { ...baseProps, field_value_number: parseFloat(prop.value) || 0 }
            } else if (prop.type === 'boolean') {
              return { ...baseProps, field_value_boolean: prop.value === 'true' }
            } else {
              return { ...baseProps, field_value: prop.value }
            }
          })
        )

      if (dynamicError) {
        console.error('❌ Error storing product properties:', dynamicError)
        // Don't fail the request, product entity is created
      }
    }

    const response = {
      success: true,
      data: {
        id: product.id,
        name: product.entity_name,
        code: product.entity_code,
        status: product.status,
        created_at: product.created_at
      },
      message: `Product "${product.entity_name}" created successfully`
    }

    console.log(`✅ Product created: ${product.entity_name} (${product.entity_code})`)
    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('❌ Create product API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/procurement/products - Update product with seamless UX
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const updateData = await request.json()

    if (!updateData.id) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required for updates' },
        { status: 400 }
      )
    }

    console.log(`📦 Procurement: Updating product ${updateData.id}`)

    // Update core entity
    const entityUpdates: any = {}
    if (updateData.name) entityUpdates.entity_name = updateData.name
    if (updateData.status) entityUpdates.status = updateData.status
    if (updateData.description !== undefined) entityUpdates.description = updateData.description

    if (Object.keys(entityUpdates).length > 0) {
      const { error: entityError } = await supabaseAdmin
        .from('core_entities')
        .update(entityUpdates)
        .eq('id', updateData.id)
        .eq('organization_id', organizationId)
        .eq('entity_type', 'product')

      if (entityError) {
        console.error('❌ Error updating product entity:', entityError)
        return NextResponse.json(
          { success: false, message: 'Failed to update product' },
          { status: 500 }
        )
      }
    }

    // Update dynamic properties with intelligent upsert
    const dynamicUpdates = [
      'category', 'brand', 'model', 'manufacturer',
      'unit_of_measure', 'minimum_stock', 'reorder_point', 'lead_time_days',
      'standard_cost', 'list_price', 'last_purchase_price',
      'weight', 'dimensions', 'color', 'material', 'hazardous', 'perishable', 'storage_requirements'
    ]

    for (const property of dynamicUpdates) {
      if (updateData[property] !== undefined) {
        // Upsert dynamic property
        const value = updateData[property]
        const fieldType = typeof value === 'number' ? 'number' : 
                         typeof value === 'boolean' ? 'boolean' : 'text'
        
        const baseProps = {
          organization_id: organizationId,
          entity_id: updateData.id,
          field_name: property,
          field_type: fieldType
        }
        
        let upsertData
        if (fieldType === 'number') {
          upsertData = { ...baseProps, field_value_number: parseFloat(value) || 0 }
        } else if (fieldType === 'boolean') {
          upsertData = { ...baseProps, field_value_boolean: Boolean(value) }
        } else {
          upsertData = { ...baseProps, field_value: value.toString() }
        }
        
        await supabaseAdmin
          .from('core_dynamic_data')
          .upsert(upsertData, {
            onConflict: 'organization_id,entity_id,field_name'
          })
      }
    }

    // Handle custom specifications updates
    if (updateData.specifications) {
      for (const [key, value] of Object.entries(updateData.specifications)) {
        const fieldType = typeof value === 'number' ? 'number' : 'text'
        const baseProps = {
          organization_id: organizationId,
          entity_id: updateData.id,
          field_name: `spec_${key}`,
          field_type: fieldType
        }
        
        let upsertData
        if (fieldType === 'number') {
          upsertData = { ...baseProps, field_value_number: parseFloat(String(value)) || 0 }
        } else {
          upsertData = { ...baseProps, field_value: String(value) }
        }
        
        await supabaseAdmin
          .from('core_dynamic_data')
          .upsert(upsertData, {
            onConflict: 'organization_id,entity_id,field_name'
          })
      }
    }

    console.log(`✅ Product ${updateData.id} updated successfully`)
    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    })

  } catch (error) {
    console.error('❌ Update product API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}