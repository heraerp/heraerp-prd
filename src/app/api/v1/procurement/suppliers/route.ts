import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Steve Jobs Principle: "Simplicity is the ultimate sophistication"
// One API endpoint that elegantly handles all supplier operations

// GET /api/v1/procurement/suppliers - List suppliers with intelligent filtering
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    
    // Steve Jobs: "Focus and simplicity" - smart defaults with powerful options
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'active'
    const category = searchParams.get('category') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeStats = searchParams.get('include_stats') === 'true'

    console.log('🏢 Procurement: Loading suppliers with intelligent filtering')

    // Universal architecture in action - suppliers are just entities with dynamic properties
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
      .eq('entity_type', 'supplier')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Add intelligent filtering
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`entity_name.ilike.%${search}%,entity_code.ilike.%${search}%`)
    }

    const { data: suppliers, error } = await query

    if (error) {
      console.error('❌ Error fetching suppliers:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch suppliers' },
        { status: 500 }
      )
    }

    // Transform to user-friendly format (Steve Jobs: "It just works")
    const transformedSuppliers = suppliers.map(supplier => {
      // Convert dynamic data to flat object
      const dynamicProps = supplier.dynamic_data?.reduce((acc: any, prop: any) => {
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
        id: supplier.id,
        name: supplier.entity_name,
        code: supplier.entity_code,
        status: supplier.status,
        created_at: supplier.created_at,
        updated_at: supplier.updated_at,
        
        // Contact Information
        contact_person: dynamicProps.contact_person || '',
        email: dynamicProps.email || '',
        phone: dynamicProps.phone || '',
        website: dynamicProps.website || '',
        
        // Business Details
        tax_id: dynamicProps.tax_id || '',
        registration_number: dynamicProps.registration_number || '',
        category: dynamicProps.category || 'general',
        payment_terms: dynamicProps.payment_terms || 'NET30',
        credit_limit: parseFloat(dynamicProps.credit_limit || '0'),
        currency: dynamicProps.currency || 'USD',
        
        // Address
        address_line1: dynamicProps.address_line1 || '',
        address_line2: dynamicProps.address_line2 || '',
        city: dynamicProps.city || '',
        state: dynamicProps.state || '',
        postal_code: dynamicProps.postal_code || '',
        country: dynamicProps.country || '',
        
        // Performance Metrics (if requested)
        ...(includeStats && {
          total_orders: parseInt(dynamicProps.total_orders || '0'),
          total_spent: parseFloat(dynamicProps.total_spent || '0'),
          last_order_date: dynamicProps.last_order_date || null,
          performance_rating: parseFloat(dynamicProps.performance_rating || '0'),
          on_time_delivery_rate: parseFloat(dynamicProps.on_time_delivery_rate || '0')
        })
      }
    })

    // Steve Jobs: "Details are not details. They make the design."
    const response = {
      success: true,
      data: transformedSuppliers,
      meta: {
        total: transformedSuppliers.length,
        search: search || null,
        status_filter: status,
        category_filter: category || null,
        includes_stats: includeStats
      }
    }

    console.log(`✅ Loaded ${transformedSuppliers.length} suppliers successfully`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Suppliers API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/procurement/suppliers - Create supplier with Jobs-level attention to UX
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const supplierData = await request.json()

    console.log('🏢 Procurement: Creating new supplier with universal architecture')

    // Steve Jobs: "Innovation distinguishes between a leader and a follower."
    // Validate required fields with helpful error messages
    const requiredFields = ['name', 'contact_person', 'email']
    const missingFields = requiredFields.filter(field => !supplierData[field]?.trim())
    
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

    // Auto-generate supplier code if not provided (Steve Jobs: "It just works")
    const supplierCode = supplierData.code || 
      'SUPP_' + supplierData.name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 20) + '_' + Date.now().toString().slice(-4)

    // Create supplier entity using universal architecture
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'supplier',
        entity_name: supplierData.name.trim(),
        entity_code: supplierCode,
        status: supplierData.status || 'active',
        description: supplierData.description || ''
      })
      .select()
      .single()

    if (supplierError) {
      console.error('❌ Error creating supplier entity:', supplierError)
      return NextResponse.json(
        { success: false, message: 'Failed to create supplier' },
        { status: 500 }
      )
    }

    // Store dynamic properties with elegant handling
    const dynamicProperties = [
      // Contact Information
      { name: 'contact_person', value: supplierData.contact_person, type: 'text' },
      { name: 'email', value: supplierData.email, type: 'text' },
      { name: 'phone', value: supplierData.phone || '', type: 'text' },
      { name: 'website', value: supplierData.website || '', type: 'text' },
      
      // Business Details
      { name: 'tax_id', value: supplierData.tax_id || '', type: 'text' },
      { name: 'registration_number', value: supplierData.registration_number || '', type: 'text' },
      { name: 'category', value: supplierData.category || 'general', type: 'text' },
      { name: 'payment_terms', value: supplierData.payment_terms || 'NET30', type: 'text' },
      { name: 'credit_limit', value: (supplierData.credit_limit || 0).toString(), type: 'number' },
      { name: 'currency', value: supplierData.currency || 'USD', type: 'text' },
      
      // Address
      { name: 'address_line1', value: supplierData.address_line1 || '', type: 'text' },
      { name: 'address_line2', value: supplierData.address_line2 || '', type: 'text' },
      { name: 'city', value: supplierData.city || '', type: 'text' },
      { name: 'state', value: supplierData.state || '', type: 'text' },
      { name: 'postal_code', value: supplierData.postal_code || '', type: 'text' },
      { name: 'country', value: supplierData.country || '', type: 'text' },
      
      // Initialize performance metrics
      { name: 'total_orders', value: '0', type: 'number' },
      { name: 'total_spent', value: '0', type: 'number' },
      { name: 'performance_rating', value: '0', type: 'number' },
      { name: 'on_time_delivery_rate', value: '0', type: 'number' }
    ].filter(prop => prop.value !== '') // Only store non-empty values

    // Insert dynamic properties
    if (dynamicProperties.length > 0) {
      const { error: dynamicError } = await supabaseAdmin
        .from('core_dynamic_data')
        .insert(
          dynamicProperties.map(prop => {
            const baseProps = {
              organization_id: organizationId,
              entity_id: supplier.id,
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
        console.error('❌ Error storing supplier properties:', dynamicError)
        // Don't fail the request, supplier entity is created
      }
    }

    const response = {
      success: true,
      data: {
        id: supplier.id,
        name: supplier.entity_name,
        code: supplier.entity_code,
        status: supplier.status,
        created_at: supplier.created_at
      },
      message: `Supplier "${supplier.entity_name}" created successfully`
    }

    console.log(`✅ Supplier created: ${supplier.entity_name} (${supplier.entity_code})`)
    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('❌ Create supplier API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/procurement/suppliers - Update supplier with seamless UX
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const updateData = await request.json()

    if (!updateData.id) {
      return NextResponse.json(
        { success: false, message: 'Supplier ID is required for updates' },
        { status: 400 }
      )
    }

    console.log(`🏢 Procurement: Updating supplier ${updateData.id}`)

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
        .eq('entity_type', 'supplier')

      if (entityError) {
        console.error('❌ Error updating supplier entity:', entityError)
        return NextResponse.json(
          { success: false, message: 'Failed to update supplier' },
          { status: 500 }
        )
      }
    }

    // Update dynamic properties with intelligent upsert
    const dynamicUpdates = [
      'contact_person', 'email', 'phone', 'website',
      'tax_id', 'registration_number', 'category', 'payment_terms', 'credit_limit', 'currency',
      'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country'
    ]

    for (const property of dynamicUpdates) {
      if (updateData[property] !== undefined) {
        // Upsert dynamic property
        const value = updateData[property]
        const fieldType = typeof value === 'number' ? 'number' : 'text'
        
        const baseProps = {
          organization_id: organizationId,
          entity_id: updateData.id,
          field_name: property,
          field_type: fieldType
        }
        
        let upsertData
        if (fieldType === 'number') {
          upsertData = { ...baseProps, field_value_number: parseFloat(value) || 0 }
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

    console.log(`✅ Supplier ${updateData.id} updated successfully`)
    return NextResponse.json({
      success: true,
      message: 'Supplier updated successfully'
    })

  } catch (error) {
    console.error('❌ Update supplier API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}