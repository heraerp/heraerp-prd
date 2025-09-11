import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Steve Jobs Principle: "Design is not just what it looks like and feels like. Design is how it works."
// Universal driver management that scales from single location to enterprise fleet

// GET /api/v1/restaurant/drivers - List drivers with current assignments
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const status = searchParams.get('status') || 'active'
    const includeAssignments = searchParams.get('include_assignments') === 'true'
    
    console.log('🚗 Drivers: Loading driver management data')

    // Get all drivers (stored as entities)
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
      .eq('entity_type', 'driver')
      .order('entity_name', { ascending: true })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: drivers, error: driversError } = await query

    if (driversError) {
      console.error('❌ Error fetching drivers:', driversError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch drivers' },
        { status: 500 }
      )
    }

    // Get current delivery assignments if requested
    let currentAssignments = []
    if (includeAssignments) {
      const { data: assignments, error: assignmentsError } = await supabaseAdmin
        .from('universal_transactions')
        .select(`
          *,
          lines:universal_transaction_lines(
            id,
            line_description,
            quantity,
            line_amount
          )
        `)
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'order')
        .in('status', ['processing', 'approved'])
        .not('metadata->>driver_id', 'is', null)

      if (!assignmentsError) {
        currentAssignments = assignments || []
      }
    }

    // Transform drivers with dynamic data and current assignments
    const transformedDrivers = drivers?.map(driver => {
      const dynamicProps = driver.dynamic_data?.reduce((acc: any, prop: any) => {
        let value = prop.field_value
        if (prop.field_type === 'number' && prop.field_value_number !== null) {
          value = prop.field_value_number
        } else if (prop.field_type === 'boolean' && prop.field_value_boolean !== null) {
          value = prop.field_value_boolean
        }
        acc[prop.field_name] = value
        return acc
      }, {}) || {}

      // Find current assignments for this driver
      const driverAssignments = currentAssignments.filter((order: any) => 
        (order.metadata as any)?.driver_id === driver.id
      )

      const driverData = {
        id: driver.id,
        name: driver.entity_name,
        code: driver.entity_code,
        status: driver.status,
        created_at: driver.created_at,
        
        // Contact Information
        phone: dynamicProps.phone || '',
        email: dynamicProps.email || '',
        emergency_contact: dynamicProps.emergency_contact || '',
        
        // Driver Details
        license_number: dynamicProps.license_number || '',
        vehicle_type: dynamicProps.vehicle_type || 'car',
        vehicle_model: dynamicProps.vehicle_model || '',
        vehicle_plate: dynamicProps.vehicle_plate || '',
        vehicle_color: dynamicProps.vehicle_color || '',
        
        // Operational Status
        is_available: dynamicProps.is_available !== false,
        shift_start: dynamicProps.shift_start || '09:00',
        shift_end: dynamicProps.shift_end || '21:00',
        max_orders: parseInt(dynamicProps.max_orders || '3'),
        
        // Performance Metrics
        rating: parseFloat(dynamicProps.rating || '5.0'),
        total_deliveries: parseInt(dynamicProps.total_deliveries || '0'),
        completed_today: parseInt(dynamicProps.completed_today || '0'),
        average_delivery_time: parseInt(dynamicProps.average_delivery_time || '25'),
        on_time_percentage: parseFloat(dynamicProps.on_time_percentage || '95.0'),
        
        // Location & Route
        current_location: dynamicProps.current_location ? 
          JSON.parse(dynamicProps.current_location) : null,
        home_base: dynamicProps.home_base || 'Restaurant',
        delivery_zone: dynamicProps.delivery_zone || 'all',
        
        // Current assignments
        current_orders: driverAssignments.length,
        assigned_orders: driverAssignments.map((order: any) => ({
          id: order.id,
          order_number: order.transaction_code,
          status: order.status,
          total_amount: order.total_amount || 0,
          customer_name: (order.metadata as any)?.customer_name || 'Customer',
          delivery_address: (order.metadata as any)?.delivery_address || '',
          estimated_delivery_time: (order.metadata as any)?.estimated_delivery_time,
          items_count: order.lines?.length || 0
        })),
        
        // Financial
        earnings_today: parseFloat(dynamicProps.earnings_today || '0'),
        earnings_week: parseFloat(dynamicProps.earnings_week || '0'),
        commission_rate: parseFloat(dynamicProps.commission_rate || '0.15')
      }

      return driverData
    }) || []

    // Calculate driver statistics
    const stats = {
      total_drivers: transformedDrivers.length,
      available_drivers: transformedDrivers.filter(d => d.is_available && d.status === 'active').length,
      on_shift_drivers: transformedDrivers.filter(d => {
        const now = new Date()
        const currentTime = now.getHours() * 100 + now.getMinutes()
        const shiftStart = parseInt(d.shift_start.replace(':', ''))
        const shiftEnd = parseInt(d.shift_end.replace(':', ''))
        return currentTime >= shiftStart && currentTime <= shiftEnd && d.status === 'active'
      }).length,
      total_active_orders: transformedDrivers.reduce((sum, d) => sum + d.current_orders, 0),
      average_rating: transformedDrivers.length > 0 
        ? transformedDrivers.reduce((sum, d) => sum + d.rating, 0) / transformedDrivers.length 
        : 0,
      total_deliveries_today: transformedDrivers.reduce((sum, d) => sum + d.completed_today, 0),
      average_delivery_time: transformedDrivers.length > 0 
        ? transformedDrivers.reduce((sum, d) => sum + d.average_delivery_time, 0) / transformedDrivers.length 
        : 0
    }

    const response = {
      success: true,
      data: {
        drivers: transformedDrivers,
        stats,
        vehicle_types: [...new Set(transformedDrivers.map(d => d.vehicle_type))],
        delivery_zones: [...new Set(transformedDrivers.map(d => d.delivery_zone))]
      }
    }

    console.log(`✅ Loaded ${transformedDrivers.length} drivers (${stats.available_drivers} available)`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Drivers API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/restaurant/drivers - Add new driver
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const driverData = await request.json()

    console.log('🚗 Drivers: Adding new driver')

    // Validate required fields
    if (!driverData.name || !driverData.phone) {
      return NextResponse.json(
        { success: false, message: 'Driver name and phone are required' },
        { status: 400 }
      )
    }

    // Auto-generate driver code if not provided
    const driverCode = driverData.code || 
      'DRV_' + driverData.name
        .toUpperCase()
        .replace(/[^A-Z0-9\\s]/g, '')
        .replace(/\\s+/g, '_')
        .substring(0, 15) + '_' + Date.now().toString().slice(-4)

    // Create driver entity
    const { data: driver, error: driverError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'driver',
        entity_name: driverData.name.trim(),
        entity_code: driverCode,
        status: driverData.status || 'active',
        description: driverData.description || ''
      })
      .select()
      .single()

    if (driverError) {
      console.error('❌ Error creating driver:', driverError)
      return NextResponse.json(
        { success: false, message: 'Failed to create driver' },
        { status: 500 }
      )
    }

    // Store driver properties
    const driverProperties = [
      // Contact Information
      { name: 'phone', value: driverData.phone, type: 'text' },
      { name: 'email', value: driverData.email || '', type: 'text' },
      { name: 'emergency_contact', value: driverData.emergency_contact || '', type: 'text' },
      
      // Driver Details
      { name: 'license_number', value: driverData.license_number || '', type: 'text' },
      { name: 'vehicle_type', value: driverData.vehicle_type || 'car', type: 'text' },
      { name: 'vehicle_model', value: driverData.vehicle_model || '', type: 'text' },
      { name: 'vehicle_plate', value: driverData.vehicle_plate || '', type: 'text' },
      { name: 'vehicle_color', value: driverData.vehicle_color || '', type: 'text' },
      
      // Operational Settings
      { name: 'is_available', value: 'true', type: 'boolean' },
      { name: 'shift_start', value: driverData.shift_start || '09:00', type: 'text' },
      { name: 'shift_end', value: driverData.shift_end || '21:00', type: 'text' },
      { name: 'max_orders', value: (driverData.max_orders || 3).toString(), type: 'number' },
      { name: 'delivery_zone', value: driverData.delivery_zone || 'all', type: 'text' },
      { name: 'home_base', value: driverData.home_base || 'Restaurant', type: 'text' },
      
      // Initialize performance metrics
      { name: 'rating', value: '5.0', type: 'number' },
      { name: 'total_deliveries', value: '0', type: 'number' },
      { name: 'completed_today', value: '0', type: 'number' },
      { name: 'average_delivery_time', value: '25', type: 'number' },
      { name: 'on_time_percentage', value: '95.0', type: 'number' },
      { name: 'earnings_today', value: '0', type: 'number' },
      { name: 'earnings_week', value: '0', type: 'number' },
      { name: 'commission_rate', value: '0.15', type: 'number' }
    ].filter(prop => prop.value !== '')

    if (driverProperties.length > 0) {
      const { error: dynamicError } = await supabaseAdmin
        .from('core_dynamic_data')
        .insert(
          driverProperties.map(prop => {
            const baseProps = {
              organization_id: organizationId,
              entity_id: driver.id,
              field_name: prop.name,
              field_type: prop.type
            }
            
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
        console.error('❌ Error storing driver properties:', dynamicError)
      }
    }

    const response = {
      success: true,
      data: {
        id: driver.id,
        name: driver.entity_name,
        code: driver.entity_code,
        status: driver.status,
        created_at: driver.created_at
      },
      message: `Driver "${driver.entity_name}" added successfully`
    }

    console.log(`✅ Driver created: ${driver.entity_name} (${driver.entity_code})`)
    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('❌ Create driver API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/restaurant/drivers - Update driver status or assignment
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const updateData = await request.json()

    if (!updateData.id) {
      return NextResponse.json(
        { success: false, message: 'Driver ID is required for updates' },
        { status: 400 }
      )
    }

    console.log(`🚗 Drivers: Updating driver ${updateData.id}`)

    // Update dynamic properties
    const dynamicUpdates = [
      'phone', 'email', 'emergency_contact', 'license_number',
      'vehicle_type', 'vehicle_model', 'vehicle_plate', 'vehicle_color',
      'is_available', 'shift_start', 'shift_end', 'max_orders',
      'delivery_zone', 'home_base', 'current_location'
    ]

    for (const property of dynamicUpdates) {
      if (updateData[property] !== undefined) {
        const value = updateData[property]
        const fieldType = property === 'max_orders' ? 'number' : 
                         property === 'is_available' ? 'boolean' : 'text'
        
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
          upsertData = { ...baseProps, field_value: typeof value === 'object' ? JSON.stringify(value) : value.toString() }
        }
        
        await supabaseAdmin
          .from('core_dynamic_data')
          .upsert(upsertData, {
            onConflict: 'organization_id,entity_id,field_name'
          })
      }
    }

    // Handle special updates like performance metrics
    if (updateData.complete_delivery) {
      // Update completion metrics
      const metricsToUpdate = ['completed_today', 'total_deliveries', 'earnings_today']
      // Implementation would increment these values
    }

    console.log(`✅ Driver ${updateData.id} updated successfully`)
    return NextResponse.json({
      success: true,
      message: 'Driver updated successfully'
    })

  } catch (error) {
    console.error('❌ Update driver API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}