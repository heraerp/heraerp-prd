import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabase-admin'

// Steve Jobs Principle: "Simplicity is the ultimate sophistication"
// Universal table management that works for any restaurant configuration

interface TableData {
  table_number: string
  seating_capacity: number
  location: string
  status: 'active' | 'inactive' | 'maintenance'
  table_type?: string // 'indoor' | 'outdoor' | 'private' | 'bar'
  description?: string
  special_features?: string[] // ['wheelchair_accessible', 'window_view', 'quiet_zone']
  minimum_party_size?: number
  maximum_party_size?: number
  reservation_time_slots?: number[] // Available time slots in minutes from midnight
  pricing_tier?: string // 'standard' | 'premium' | 'vip'
}

// GET /api/v1/restaurant/table-management - Get all tables with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const status = searchParams.get('status') || 'all'
    const location = searchParams.get('location')
    const includeReservations = searchParams.get('include_reservations') === 'true'
    const date = searchParams.get('date') // For availability checking

    console.log('🪑 Table Management: Loading restaurant tables')

    // Get all tables (stored as entities with type 'restaurant_table')
    let query = supabaseAdmin
      .from('core_entities')
      .select(
        `
        *,
        dynamic_data:core_dynamic_data(
          field_name,
          field_value,
          field_value_number,
          field_value_boolean,
          field_type
        )
      `
      )
      .eq('organization_id', organizationId)
      .eq('entity_type', 'restaurant_table')
      .order('entity_name', { ascending: true })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: tables, error: tablesError } = await query

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch tables' },
        { status: 500 }
      )
    }

    // Transform tables with dynamic data
    const transformedTables =
      tables?.map(table => {
        const dynamicProps =
          table.dynamic_data?.reduce((acc: any, prop: any) => {
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
          id: table.id,
          table_number: table.entity_name,
          table_code: table.entity_code,
          status: table.status,
          description: table.description,
          created_at: table.created_at,
          updated_at: table.updated_at,

          // Table Configuration
          seating_capacity: parseInt(dynamicProps.seating_capacity || '4'),
          location: dynamicProps.location || 'indoor',
          table_type: dynamicProps.table_type || 'standard',
          minimum_party_size: parseInt(dynamicProps.minimum_party_size || '1'),
          maximum_party_size: parseInt(
            dynamicProps.maximum_party_size || dynamicProps.seating_capacity || '4'
          ),

          // Features & Amenities
          special_features: dynamicProps.special_features
            ? JSON.parse(dynamicProps.special_features)
            : [],
          pricing_tier: dynamicProps.pricing_tier || 'standard',
          wheelchair_accessible: dynamicProps.wheelchair_accessible === 'true',
          window_view: dynamicProps.window_view === 'true',
          quiet_zone: dynamicProps.quiet_zone === 'true',

          // Operational Settings
          allow_reservations: dynamicProps.allow_reservations !== 'false',
          advance_booking_days: parseInt(dynamicProps.advance_booking_days || '30'),
          minimum_booking_duration: parseInt(dynamicProps.minimum_booking_duration || '90'),
          maximum_booking_duration: parseInt(dynamicProps.maximum_booking_duration || '180'),

          // Current Status (if checking availability for specific date)
          ...(date && {
            availability_status: 'available', // Will be calculated based on reservations
            next_reservation: null,
            current_reservation: null
          })
        }
      }) || []

    // Filter by location if specified
    const filteredTables = location
      ? transformedTables.filter(table => table.location === location)
      : transformedTables

    // If date is provided, check availability for each table
    if (date && includeReservations) {
      console.log(`🗓️ Checking table availability for ${date}`)

      // Get reservations for the specified date
      const { data: reservations } = await supabaseAdmin
        .from('universal_transactions')
        .select('id, metadata, status, transaction_date')
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'reservation')
        .eq('transaction_date', date)
        .in('status', ['pending', 'confirmed'])

      // Update availability status for each table
      filteredTables.forEach(table => {
        const tableReservations =
          reservations?.filter(res => (res.metadata as any)?.table_id === table.id) || []

        ;(table as any).current_reservation =
          tableReservations.find(res => {
            const startTime = (res.metadata as any)?.start_time
            const endTime = (res.metadata as any)?.end_time
            const now = new Date()
            const currentTime = now.getHours() * 60 + now.getMinutes()

            if (startTime && endTime) {
              const start = parseInt(startTime)
              const end = parseInt(endTime)
              return currentTime >= start && currentTime <= end
            }
            return false
          }) || null

        ;(table as any).next_reservation =
          tableReservations
            .filter(res => {
              const startTime = (res.metadata as any)?.start_time
              const now = new Date()
              const currentTime = now.getHours() * 60 + now.getMinutes()
              return startTime && parseInt(startTime) > currentTime
            })
            .sort(
              (a, b) =>
                parseInt((a.metadata as any)?.start_time || '0') -
                parseInt((b.metadata as any)?.start_time || '0')
            )[0] || null

        ;(table as any).availability_status = (table as any).current_reservation
          ? 'occupied'
          : 'available'
        ;(table as any).reservations_today = tableReservations.length
      })
    }

    // Calculate summary statistics
    const summary = {
      total_tables: filteredTables.length,
      active_tables: filteredTables.filter(t => t.status === 'active').length,
      inactive_tables: filteredTables.filter(t => t.status === 'inactive').length,
      maintenance_tables: filteredTables.filter(t => t.status === 'maintenance').length,
      total_seating_capacity: filteredTables.reduce((sum, t) => sum + t.seating_capacity, 0),
      locations: [...new Set(filteredTables.map(t => t.location))],
      table_types: [...new Set(filteredTables.map(t => t.table_type))],
      ...(date && {
        available_tables: filteredTables.filter(t => t.availability_status === 'available').length,
        occupied_tables: filteredTables.filter(t => t.availability_status === 'occupied').length
      })
    }

    const response = {
      success: true,
      data: {
        tables: filteredTables,
        summary,
        filters_applied: {
          status,
          location,
          date,
          include_reservations: includeReservations
        }
      }
    }

    console.log(`✅ Loaded ${filteredTables.length} tables (${summary.active_tables} active)`)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Table management API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/restaurant/table-management - Create new table
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const tableData: TableData = await request.json()

    console.log('🪑 Table Management: Creating new table')

    // Steve Jobs: "Details are not details. They make the design."
    // Validate required fields with helpful error messages
    const requiredFields = ['table_number', 'seating_capacity', 'location']
    const missingFields = requiredFields.filter(field => !(tableData as any)[field])

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

    // Check for duplicate table numbers
    const { data: existingTable } = await supabaseAdmin
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'restaurant_table')
      .eq('entity_name', tableData.table_number)
      .single()

    if (existingTable) {
      return NextResponse.json(
        { success: false, message: `Table ${tableData.table_number} already exists` },
        { status: 409 }
      )
    }

    // Auto-generate table code if not provided
    const tableCode = `TABLE_${tableData.table_number.replace(/\s+/g, '_').toUpperCase()}`

    // Create table entity
    const { data: table, error: tableError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'restaurant_table',
        entity_name: tableData.table_number,
        entity_code: tableCode,
        status: tableData.status || 'active',
        description:
          tableData.description ||
          `Table ${tableData.table_number} - ${tableData.seating_capacity} seats`
      })
      .select()
      .single()

    if (tableError) {
      console.error('❌ Error creating table:', tableError)
      return NextResponse.json(
        { success: false, message: 'Failed to create table' },
        { status: 500 }
      )
    }

    // Store table properties with Steve Jobs attention to detail
    const tableProperties = [
      // Core Configuration
      { name: 'seating_capacity', value: tableData.seating_capacity.toString(), type: 'number' },
      { name: 'location', value: tableData.location, type: 'text' },
      { name: 'table_type', value: tableData.table_type || 'standard', type: 'text' },

      // Capacity Rules
      {
        name: 'minimum_party_size',
        value: (tableData.minimum_party_size || 1).toString(),
        type: 'number'
      },
      {
        name: 'maximum_party_size',
        value: (tableData.maximum_party_size || tableData.seating_capacity).toString(),
        type: 'number'
      },

      // Features & Amenities
      {
        name: 'special_features',
        value: JSON.stringify(tableData.special_features || []),
        type: 'text'
      },
      { name: 'pricing_tier', value: tableData.pricing_tier || 'standard', type: 'text' },
      {
        name: 'wheelchair_accessible',
        value: (tableData.special_features?.includes('wheelchair_accessible') || false).toString(),
        type: 'boolean'
      },
      {
        name: 'window_view',
        value: (tableData.special_features?.includes('window_view') || false).toString(),
        type: 'boolean'
      },
      {
        name: 'quiet_zone',
        value: (tableData.special_features?.includes('quiet_zone') || false).toString(),
        type: 'boolean'
      },

      // Operational Settings
      { name: 'allow_reservations', value: 'true', type: 'boolean' },
      { name: 'advance_booking_days', value: '30', type: 'number' },
      { name: 'minimum_booking_duration', value: '90', type: 'number' }, // 1.5 hours
      { name: 'maximum_booking_duration', value: '180', type: 'number' }, // 3 hours

      // System Fields
      { name: 'created_by', value: 'admin', type: 'text' },
      { name: 'last_updated_by', value: 'admin', type: 'text' }
    ].filter(prop => prop.value !== '' && prop.value !== 'undefined')

    if (tableProperties.length > 0) {
      const { error: dynamicError } = await supabaseAdmin.from('core_dynamic_data').insert(
        tableProperties.map(prop => {
          const baseProps = {
            organization_id: organizationId,
            entity_id: table.id,
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
        console.error('❌ Error storing table properties:', dynamicError)
      }
    }

    const response = {
      success: true,
      data: {
        id: table.id,
        table_number: table.entity_name,
        table_code: table.entity_code,
        status: table.status,
        seating_capacity: tableData.seating_capacity,
        location: tableData.location,
        created_at: table.created_at
      },
      message: `Table ${table.entity_name} created successfully`,
      next_steps: [
        'Configure reservation time slots',
        'Set special pricing rules if needed',
        'Add table to floor plan layout',
        'Test reservation booking flow'
      ]
    }

    console.log(
      `✅ Table created: ${table.entity_name} (${tableData.seating_capacity} seats, ${tableData.location})`
    )
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('❌ Create table API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/v1/restaurant/table-management - Update existing table
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const updateData = await request.json()

    if (!updateData.id) {
      return NextResponse.json(
        { success: false, message: 'Table ID is required for updates' },
        { status: 400 }
      )
    }

    console.log(`🪑 Table Management: Updating table ${updateData.id}`)

    // Update core entity if needed
    const entityUpdates: any = {}
    if (updateData.table_number) entityUpdates.entity_name = updateData.table_number
    if (updateData.status) entityUpdates.status = updateData.status
    if (updateData.description !== undefined) entityUpdates.description = updateData.description

    if (Object.keys(entityUpdates).length > 0) {
      const { error: entityError } = await supabaseAdmin
        .from('core_entities')
        .update(entityUpdates)
        .eq('id', updateData.id)
        .eq('organization_id', organizationId)
        .eq('entity_type', 'restaurant_table')

      if (entityError) {
        console.error('❌ Error updating table entity:', entityError)
        return NextResponse.json(
          { success: false, message: 'Failed to update table' },
          { status: 500 }
        )
      }
    }

    // Update dynamic properties with intelligent upsert
    const dynamicUpdates = [
      'seating_capacity',
      'location',
      'table_type',
      'minimum_party_size',
      'maximum_party_size',
      'special_features',
      'pricing_tier',
      'wheelchair_accessible',
      'window_view',
      'quiet_zone',
      'allow_reservations',
      'advance_booking_days',
      'minimum_booking_duration',
      'maximum_booking_duration'
    ]

    for (const property of dynamicUpdates) {
      if (updateData[property] !== undefined) {
        const value = updateData[property]
        const fieldType = [
          'seating_capacity',
          'minimum_party_size',
          'maximum_party_size',
          'advance_booking_days',
          'minimum_booking_duration',
          'maximum_booking_duration'
        ].includes(property)
          ? 'number'
          : ['wheelchair_accessible', 'window_view', 'quiet_zone', 'allow_reservations'].includes(
                property
              )
            ? 'boolean'
            : 'text'

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
          upsertData = {
            ...baseProps,
            field_value: typeof value === 'object' ? JSON.stringify(value) : value.toString()
          }
        }

        await supabaseAdmin.from('core_dynamic_data').upsert(upsertData, {
          onConflict: 'organization_id,entity_id,field_name'
        })
      }
    }

    console.log(`✅ Table ${updateData.id} updated successfully`)
    return NextResponse.json({
      success: true,
      message: 'Table updated successfully'
    })
  } catch (error) {
    console.error('❌ Update table API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/v1/restaurant/table-management - Soft delete table
export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const { searchParams } = new URL(request.url)
    const tableId = searchParams.get('id')

    if (!tableId) {
      return NextResponse.json({ success: false, message: 'Table ID is required' }, { status: 400 })
    }

    console.log(`🪑 Table Management: Deactivating table ${tableId}`)

    // Check for future reservations
    const { data: futureReservations } = await supabaseAdmin
      .from('universal_transactions')
      .select('id, transaction_date, metadata')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'reservation')
      .eq('metadata->>table_id', tableId)
      .gte('transaction_date', new Date().toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed'])

    if (futureReservations && futureReservations.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot deactivate table. ${futureReservations.length} future reservations exist.`,
          future_reservations: futureReservations.length
        },
        { status: 409 }
      )
    }

    // Soft delete by setting status to inactive
    const { error: updateError } = await supabaseAdmin
      .from('core_entities')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', tableId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'restaurant_table')

    if (updateError) {
      console.error('❌ Error deactivating table:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to deactivate table' },
        { status: 500 }
      )
    }

    console.log(`✅ Table ${tableId} deactivated successfully`)
    return NextResponse.json({
      success: true,
      message: 'Table deactivated successfully'
    })
  } catch (error) {
    console.error('❌ Delete table API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
