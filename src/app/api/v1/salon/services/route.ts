import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Enterprise-grade configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('CRITICAL: Supabase configuration missing')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// HERA Universal Architecture Constants
const ENTITY_TYPE = 'salon_service'
const SERVICE_CATEGORY_TYPE = 'salon_service_category'
const SMART_CODE_PREFIX = 'HERA.SALON.SERVICE'

// Helper function to get authorization header
function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get('authorization')
}

// GET: Fetch all services with categories and analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
    }

    // Fetch services with metadata
    const { data: services, error: servicesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', ENTITY_TYPE)
      .neq('status', 'deleted')
      .order('entity_name')

    if (servicesError) throw servicesError

    // Fetch service categories from database
    const { data: categories, error: categoriesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', SERVICE_CATEGORY_TYPE)
      .neq('status', 'deleted')
      .order('entity_name')

    if (categoriesError) throw categoriesError

    // Fetch dynamic data for all services
    const serviceIds = services?.map(s => s.id) || []
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .in('entity_id', serviceIds)

    if (dynamicError) throw dynamicError

    // Merge dynamic data with services
    const enrichedServices =
      services?.map(service => {
        const serviceDynamicData = dynamicData?.filter(d => d.entity_id === service.id) || []
        const dynamicFields: any = {}

        serviceDynamicData.forEach(field => {
          if (field.field_value_text) dynamicFields[field.field_name] = field.field_value_text
          if (field.field_value_number !== null)
            dynamicFields[field.field_name] = field.field_value_number
          if (field.field_value_boolean !== null)
            dynamicFields[field.field_name] = field.field_value_boolean
          if (field.field_value_date) dynamicFields[field.field_name] = field.field_value_date
          if (field.field_value_json) dynamicFields[field.field_name] = field.field_value_json
        })

        return {
          ...service,
          ...dynamicFields
        }
      }) || []

    // Calculate analytics
    const activeServices = enrichedServices.filter(s => s.is_active !== false)
    const pricesArray = enrichedServices.map(s => s.price || 0).filter(p => p > 0)

    const averagePrice =
      pricesArray.length > 0 ? pricesArray.reduce((a, b) => a + b, 0) / pricesArray.length : 0

    // Category breakdown
    const categoryBreakdown =
      categories?.map(cat => {
        const categoryServices = enrichedServices.filter(s => s.category === cat.entity_code)
        return {
          category: cat.entity_name,
          category_code: cat.entity_code,
          count: categoryServices.length,
          revenue: categoryServices.reduce((sum, s) => sum + (s.price || 0), 0)
        }
      }) || []

    const analytics = {
      total_services: enrichedServices.length,
      active_services: activeServices.length,
      average_price: averagePrice,
      revenue_contribution: 0, // Calculate based on actual bookings
      popular_services: [], // Calculate from transaction data
      category_breakdown: categoryBreakdown
    }

    return NextResponse.json({
      services: enrichedServices,
      categories,
      analytics
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Failed to fetch services', details: error }, { status: 500 })
  }
}

// POST: Create new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      service_name,
      category,
      price,
      cost,
      duration,
      description,
      is_active,
      requires_consultation,
      commission_rate,
      max_daily_bookings,
      booking_buffer_minutes,
      organization_id
    } = body

    if (!service_name || !organization_id) {
      return NextResponse.json(
        { error: 'service_name and organization_id are required' },
        { status: 400 }
      )
    }

    // Generate service code
    const timestamp = Date.now()
    const serviceCode = `SVC-${timestamp}`
    const smartCode = `${SMART_CODE_PREFIX}.${serviceCode}.v1`

    // Create service entity
    const { data: service, error: serviceError } = await supabase
      .from('core_entities')
      .insert({
        entity_type: ENTITY_TYPE,
        entity_name: service_name,
        entity_code: serviceCode,
        organization_id,
        smart_code: smartCode,
        metadata: {
          category,
          is_active,
          requires_consultation
        }
      })
      .select()
      .single()

    if (serviceError) throw serviceError

    // Store dynamic fields
    const dynamicFields = [
      { field_name: 'price', field_value_number: parseFloat(price) || 0 },
      { field_name: 'cost', field_value_number: parseFloat(cost) || 0 },
      { field_name: 'duration', field_value_number: parseInt(duration) || 60 },
      { field_name: 'commission_rate', field_value_number: parseFloat(commission_rate) || 0 },
      { field_name: 'max_daily_bookings', field_value_number: parseInt(max_daily_bookings) || 10 },
      {
        field_name: 'booking_buffer_minutes',
        field_value_number: parseInt(booking_buffer_minutes) || 0
      }
    ]

    if (description) {
      dynamicFields.push({
        field_name: 'description',
        field_value_text: description,
        field_value_number: null
      })
    }

    if (category) {
      dynamicFields.push({
        field_name: 'category',
        field_value_text: category,
        field_value_number: null
      })
    }

    const dynamicInserts = dynamicFields.map(field => ({
      entity_id: service.id,
      organization_id,
      ...field,
      smart_code: `${smartCode}.${field.field_name.toUpperCase()}`
    }))

    const { error: dynamicError } = await supabase.from('core_dynamic_data').insert(dynamicInserts)

    if (dynamicError) throw dynamicError

    return NextResponse.json({
      message: 'Service created successfully',
      service: {
        ...service,
        ...body
      }
    })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Failed to create service', details: error }, { status: 500 })
  }
}

// PUT: Update service
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { id: serviceId } = await params

    const {
      service_name,
      category,
      price,
      cost,
      duration,
      description,
      is_active,
      requires_consultation,
      commission_rate,
      max_daily_bookings,
      booking_buffer_minutes
    } = body

    // Update service entity
    const { error: updateError } = await supabase
      .from('core_entities')
      .update({
        entity_name: service_name,
        metadata: {
          category,
          is_active,
          requires_consultation
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)

    if (updateError) throw updateError

    // Update dynamic fields
    const fieldsToUpdate = [
      { field_name: 'price', field_value_number: parseFloat(price) || 0 },
      { field_name: 'cost', field_value_number: parseFloat(cost) || 0 },
      { field_name: 'duration', field_value_number: parseInt(duration) || 60 },
      { field_name: 'commission_rate', field_value_number: parseFloat(commission_rate) || 0 },
      { field_name: 'max_daily_bookings', field_value_number: parseInt(max_daily_bookings) || 10 },
      {
        field_name: 'booking_buffer_minutes',
        field_value_number: parseInt(booking_buffer_minutes) || 0
      },
      { field_name: 'description', field_value_text: description || '', field_value_number: null },
      { field_name: 'category', field_value_text: category || '', field_value_number: null }
    ]

    for (const field of fieldsToUpdate) {
      const { error: upsertError } = await supabase.from('core_dynamic_data').upsert(
        {
          entity_id: serviceId,
          field_name: field.field_name,
          ...field,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'entity_id,field_name'
        }
      )

      if (upsertError) throw upsertError
    }

    return NextResponse.json({
      message: 'Service updated successfully'
    })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ error: 'Failed to update service', details: error }, { status: 500 })
  }
}

// DELETE: Soft delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params

    // Soft delete the service
    const { error } = await supabase
      .from('core_entities')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)

    if (error) throw error

    return NextResponse.json({
      message: 'Service deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Failed to delete service', details: error }, { status: 500 })
  }
}
