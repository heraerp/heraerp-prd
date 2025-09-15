import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Steve Jobs Principle: "Innovation distinguishes between a leader and a follower."
// Universal delivery platform integration that works with any delivery service

// GET /api/v1/delivery-platforms - List all configured delivery platforms
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const status = searchParams.get('status') || 'active'
    const includeStats = searchParams.get('include_stats') === 'true'

    console.log('🚀 Delivery Platforms: Loading platform integrations')

    // Get all delivery platforms (stored as entities)
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
      .eq('entity_type', 'delivery_platform')
      .order('entity_name', { ascending: true })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: platforms, error: platformsError } = await query

    if (platformsError) {
      console.error('❌ Error fetching delivery platforms:', platformsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch delivery platforms' },
        { status: 500 }
      )
    }

    // Get recent orders from platforms if stats requested
    let platformStats = {}
    if (includeStats) {
      const today = new Date().toISOString().split('T')[0]
      const { data: todayOrders } = await supabaseAdmin
        .from('universal_transactions')
        .select('metadata, total_amount, status')
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'order')
        .gte('transaction_date', today)
        .not('metadata->>delivery_platform_id', 'is', null)

      // Calculate stats per platform
      platformStats = (todayOrders || []).reduce((stats: any, order: any) => {
        const platformId = (order.metadata as any)?.delivery_platform_id
        if (platformId) {
          if (!stats[platformId]) {
            stats[platformId] = {
              total_orders: 0,
              total_revenue: 0,
              pending_orders: 0,
              completed_orders: 0
            }
          }
          stats[platformId].total_orders++
          stats[platformId].total_revenue += order.total_amount || 0
          if (order.status === 'pending') stats[platformId].pending_orders++
          if (order.status === 'completed') stats[platformId].completed_orders++
        }
        return stats
      }, {})
    }

    // Transform platforms with dynamic data
    const transformedPlatforms =
      platforms?.map(platform => {
        const dynamicProps =
          platform.dynamic_data?.reduce((acc: any, prop: any) => {
            let value = prop.field_value
            if (prop.field_type === 'number' && prop.field_value_number !== null) {
              value = prop.field_value_number
            } else if (prop.field_type === 'boolean' && prop.field_value_boolean !== null) {
              value = prop.field_value_boolean
            }
            acc[prop.field_name] = value
            return acc
          }, {}) || {}

        const platformData = {
          id: platform.id,
          name: platform.entity_name,
          code: platform.entity_code,
          status: platform.status,
          created_at: platform.created_at,
          updated_at: platform.updated_at,

          // Platform Configuration
          platform_type: dynamicProps.platform_type || 'delivery_app',
          api_endpoint: dynamicProps.api_endpoint || '',
          webhook_url: dynamicProps.webhook_url || '',
          api_key: dynamicProps.api_key ? '***HIDDEN***' : '',
          secret_key: dynamicProps.secret_key ? '***HIDDEN***' : '',

          // Business Configuration
          commission_rate: parseFloat(dynamicProps.commission_rate || '0.15'),
          delivery_fee: parseFloat(dynamicProps.delivery_fee || '0'),
          minimum_order_value: parseFloat(dynamicProps.minimum_order_value || '0'),
          max_delivery_distance: parseFloat(dynamicProps.max_delivery_distance || '10'),

          // Operational Settings
          is_active: dynamicProps.is_active !== false,
          auto_accept_orders: dynamicProps.auto_accept_orders === true,
          sync_menu: dynamicProps.sync_menu !== false,
          sync_inventory: dynamicProps.sync_inventory === true,

          // Integration Status
          last_sync_at: dynamicProps.last_sync_at || null,
          sync_status: dynamicProps.sync_status || 'not_configured',
          webhook_verified: dynamicProps.webhook_verified === true,

          // Platform-specific Settings
          restaurant_id: dynamicProps.restaurant_id || '',
          store_id: dynamicProps.store_id || '',
          delivery_zones: dynamicProps.delivery_zones
            ? JSON.parse(dynamicProps.delivery_zones)
            : [],

          // Performance Stats (if requested)
          ...(includeStats &&
            (platformStats as any)[platform.id] && {
              stats: (platformStats as any)[platform.id]
            })
        }

        return platformData
      }) || []

    // Calculate overall stats
    const overallStats = {
      total_platforms: transformedPlatforms.length,
      active_platforms: transformedPlatforms.filter(p => p.is_active && p.status === 'active')
        .length,
      configured_platforms: transformedPlatforms.filter(p => p.sync_status === 'connected').length,
      total_today_orders: Object.values(platformStats).reduce(
        (sum: number, stats: any) => sum + stats.total_orders,
        0
      ),
      total_today_revenue: Object.values(platformStats).reduce(
        (sum: number, stats: any) => sum + stats.total_revenue,
        0
      )
    }

    const response = {
      success: true,
      data: {
        platforms: transformedPlatforms,
        stats: overallStats,
        supported_platforms: [
          'deliveroo',
          'ubereats',
          'swiggy',
          'zomato',
          'doordash',
          'grubhub',
          'foodpanda',
          'talabat',
          'custom'
        ]
      }
    }

    console.log(
      `✅ Loaded ${transformedPlatforms.length} delivery platforms (${overallStats.active_platforms} active)`
    )
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Delivery Platforms API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/delivery-platforms - Configure new delivery platform integration
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const platformData = await request.json()

    console.log('🚀 Delivery Platforms: Configuring new platform integration')

    // Steve Jobs: "Innovation distinguishes between a leader and a follower."
    // Validate required fields with helpful error messages
    const requiredFields = ['name', 'platform_type', 'api_endpoint']
    const missingFields = requiredFields.filter(field => !platformData[field]?.trim?.())

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

    // Auto-generate platform code if not provided
    const platformCode =
      platformData.code ||
      platformData.platform_type.toUpperCase() + '_' + Date.now().toString().slice(-6)

    // Create delivery platform entity
    const { data: platform, error: platformError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'delivery_platform',
        entity_name: platformData.name.trim(),
        entity_code: platformCode,
        status: platformData.status || 'active',
        description: platformData.description || `${platformData.platform_type} integration`
      })
      .select()
      .single()

    if (platformError) {
      console.error('❌ Error creating delivery platform:', platformError)
      return NextResponse.json(
        { success: false, message: 'Failed to create delivery platform' },
        { status: 500 }
      )
    }

    // Store platform properties with Steve Jobs attention to security
    const platformProperties = [
      // Platform Configuration
      { name: 'platform_type', value: platformData.platform_type, type: 'text' },
      { name: 'api_endpoint', value: platformData.api_endpoint, type: 'text' },
      { name: 'webhook_url', value: platformData.webhook_url || '', type: 'text' },
      { name: 'api_key', value: platformData.api_key || '', type: 'text' },
      { name: 'secret_key', value: platformData.secret_key || '', type: 'text' },

      // Business Configuration
      {
        name: 'commission_rate',
        value: (platformData.commission_rate || 0.15).toString(),
        type: 'number'
      },
      { name: 'delivery_fee', value: (platformData.delivery_fee || 0).toString(), type: 'number' },
      {
        name: 'minimum_order_value',
        value: (platformData.minimum_order_value || 0).toString(),
        type: 'number'
      },
      {
        name: 'max_delivery_distance',
        value: (platformData.max_delivery_distance || 10).toString(),
        type: 'number'
      },

      // Operational Settings
      { name: 'is_active', value: 'true', type: 'boolean' },
      {
        name: 'auto_accept_orders',
        value: (platformData.auto_accept_orders || false).toString(),
        type: 'boolean'
      },
      { name: 'sync_menu', value: (platformData.sync_menu !== false).toString(), type: 'boolean' },
      {
        name: 'sync_inventory',
        value: (platformData.sync_inventory !== false).toString(),
        type: 'boolean'
      },

      // Integration Status
      { name: 'sync_status', value: 'configuring', type: 'text' },
      { name: 'webhook_verified', value: 'false', type: 'boolean' },

      // Platform-specific Settings
      { name: 'restaurant_id', value: platformData.restaurant_id || '', type: 'text' },
      { name: 'store_id', value: platformData.store_id || '', type: 'text' },
      {
        name: 'delivery_zones',
        value: JSON.stringify(platformData.delivery_zones || []),
        type: 'text'
      }
    ].filter(prop => prop.value !== '')

    if (platformProperties.length > 0) {
      const { error: dynamicError } = await supabaseAdmin.from('core_dynamic_data').insert(
        platformProperties.map(prop => {
          const baseProps = {
            organization_id: organizationId,
            entity_id: platform.id,
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
        console.error('❌ Error storing platform properties:', dynamicError)
      }
    }

    // Generate webhook URL for this platform
    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/v1/delivery-platforms/${platform.id}/webhook`

    const response = {
      success: true,
      data: {
        id: platform.id,
        name: platform.entity_name,
        code: platform.entity_code,
        platform_type: platformData.platform_type,
        status: platform.status,
        webhook_url: webhookUrl,
        created_at: platform.created_at
      },
      message: `Delivery platform "${platform.entity_name}" configured successfully`,
      next_steps: [
        'Configure webhook URL in the delivery platform dashboard',
        'Test webhook connection',
        'Sync menu items with the platform',
        'Enable order receiving'
      ]
    }

    console.log(
      `✅ Delivery platform configured: ${platform.entity_name} (${platformData.platform_type})`
    )
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('❌ Create delivery platform API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/v1/delivery-platforms - Update platform configuration
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const updateData = await request.json()

    if (!updateData.id) {
      return NextResponse.json(
        { success: false, message: 'Platform ID is required for updates' },
        { status: 400 }
      )
    }

    console.log(`🚀 Delivery Platforms: Updating platform ${updateData.id}`)

    // Update core entity if needed
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
        .eq('entity_type', 'delivery_platform')

      if (entityError) {
        console.error('❌ Error updating delivery platform entity:', entityError)
        return NextResponse.json(
          { success: false, message: 'Failed to update delivery platform' },
          { status: 500 }
        )
      }
    }

    // Update dynamic properties with intelligent upsert
    const dynamicUpdates = [
      'api_endpoint',
      'webhook_url',
      'api_key',
      'secret_key',
      'commission_rate',
      'delivery_fee',
      'minimum_order_value',
      'max_delivery_distance',
      'is_active',
      'auto_accept_orders',
      'sync_menu',
      'sync_inventory',
      'sync_status',
      'webhook_verified',
      'restaurant_id',
      'store_id',
      'delivery_zones',
      'last_sync_at'
    ]

    for (const property of dynamicUpdates) {
      if (updateData[property] !== undefined) {
        const value = updateData[property]
        const fieldType = [
          'commission_rate',
          'delivery_fee',
          'minimum_order_value',
          'max_delivery_distance'
        ].includes(property)
          ? 'number'
          : [
                'is_active',
                'auto_accept_orders',
                'sync_menu',
                'sync_inventory',
                'webhook_verified'
              ].includes(property)
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

    console.log(`✅ Delivery platform ${updateData.id} updated successfully`)
    return NextResponse.json({
      success: true,
      message: 'Delivery platform updated successfully'
    })
  } catch (error) {
    console.error('❌ Update delivery platform API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
