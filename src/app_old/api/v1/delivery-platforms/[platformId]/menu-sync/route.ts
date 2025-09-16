import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Steve Jobs Principle: "Simplicity is the ultimate sophistication"
// Universal menu synchronization that works with any delivery platform

interface MenuSyncRequest {
  sync_type: 'full' | 'incremental' | 'selective'
  menu_items?: string[] // Entity IDs for selective sync
  force_update?: boolean
}

interface PlatformMenuItem {
  platform_item_id?: string
  name: string
  description: string
  price: number
  category: string
  availability: boolean
  preparation_time?: number
  dietary_info?: string[]
  images?: string[]
  modifiers?: Array<{
    name: string
    options: Array<{
      name: string
      price: number
    }>
  }>
  platform_specific?: any
}

// Platform-specific menu transformers
const menuTransformers = {
  deliveroo: (menuItem: any): PlatformMenuItem => {
    const dynamicProps =
      menuItem.dynamic_data?.reduce((acc: any, prop: any) => {
        acc[prop.field_name] =
          prop.field_value || prop.field_value_number || prop.field_value_boolean
        return acc
      }, {}) || {}

    return {
      platform_item_id: dynamicProps.deliveroo_item_id || undefined,
      name: menuItem.entity_name,
      description: menuItem.description || '',
      price: Math.round((dynamicProps.price || 0) * 100), // Deliveroo uses cents
      category: dynamicProps.category || 'Main',
      availability: menuItem.status === 'active' && dynamicProps.in_stock !== false,
      preparation_time: parseInt(dynamicProps.prep_time || '15'),
      dietary_info: dynamicProps.dietary_info ? dynamicProps.dietary_info.split(',') : [],
      images: dynamicProps.image_url ? [dynamicProps.image_url] : [],
      platform_specific: {
        sku: menuItem.entity_code,
        tax_rate: dynamicProps.tax_rate || 0.1,
        allergens: dynamicProps.allergens || '',
        nutritional_info: dynamicProps.nutritional_info || {}
      }
    }
  },

  swiggy: (menuItem: any): PlatformMenuItem => {
    const dynamicProps =
      menuItem.dynamic_data?.reduce((acc: any, prop: any) => {
        acc[prop.field_name] =
          prop.field_value || prop.field_value_number || prop.field_value_boolean
        return acc
      }, {}) || {}

    return {
      platform_item_id: dynamicProps.swiggy_item_id || undefined,
      name: menuItem.entity_name,
      description: menuItem.description || '',
      price: dynamicProps.price || 0, // Swiggy uses regular currency
      category: dynamicProps.category || 'Main Course',
      availability: menuItem.status === 'active' && dynamicProps.in_stock !== false,
      preparation_time: parseInt(dynamicProps.prep_time || '20'),
      dietary_info: dynamicProps.is_veg ? ['vegetarian'] : ['non-vegetarian'],
      images: dynamicProps.image_url ? [dynamicProps.image_url] : [],
      platform_specific: {
        item_type: dynamicProps.is_veg ? 'VEG' : 'NON_VEG',
        spice_level: dynamicProps.spice_level || 'medium',
        serves: dynamicProps.serves || 1,
        cuisine_type: dynamicProps.cuisine_type || 'Indian'
      }
    }
  },

  ubereats: (menuItem: any): PlatformMenuItem => {
    const dynamicProps =
      menuItem.dynamic_data?.reduce((acc: any, prop: any) => {
        acc[prop.field_name] =
          prop.field_value || prop.field_value_number || prop.field_value_boolean
        return acc
      }, {}) || {}

    return {
      platform_item_id: dynamicProps.ubereats_item_id || undefined,
      name: menuItem.entity_name,
      description: menuItem.description || '',
      price: Math.round((dynamicProps.price || 0) * 100), // Uber Eats uses cents
      category: dynamicProps.category || 'Entrees',
      availability: menuItem.status === 'active' && dynamicProps.in_stock !== false,
      preparation_time: parseInt(dynamicProps.prep_time || '12'),
      dietary_info: dynamicProps.dietary_tags ? dynamicProps.dietary_tags.split(',') : [],
      images: dynamicProps.image_url ? [dynamicProps.image_url] : [],
      platform_specific: {
        external_id: menuItem.entity_code,
        tax_info: {
          tax_rate: dynamicProps.tax_rate || 0.0875,
          inclusive: false
        },
        fulfillment_availability: {
          delivery: true,
          pickup: true,
          dine_in: false
        }
      }
    }
  },

  // Generic transformer for custom platforms
  generic: (menuItem: any): PlatformMenuItem => {
    const dynamicProps =
      menuItem.dynamic_data?.reduce((acc: any, prop: any) => {
        acc[prop.field_name] =
          prop.field_value || prop.field_value_number || prop.field_value_boolean
        return acc
      }, {}) || {}

    return {
      name: menuItem.entity_name,
      description: menuItem.description || '',
      price: dynamicProps.price || 0,
      category: dynamicProps.category || 'General',
      availability: menuItem.status === 'active',
      platform_specific: dynamicProps
    }
  }
}

// POST /api/v1/delivery-platforms/[platformId]/menu-sync - Sync menu to platform
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ platformId: string }> }
) {
  const params = await context.params
  try {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const platformId = params.platformId
    const syncRequest: MenuSyncRequest = await request.json()

    console.log(`🔄 Menu Sync: Starting ${syncRequest.sync_type} sync for platform ${platformId}`)

    // Get platform configuration
    const { data: platform, error: platformError } = await getSupabaseAdmin()
      .from('core_entities')
      .select(
        `
        *,
        dynamic_data:core_dynamic_data(
          field_name,
          field_value,
          field_value_boolean,
          field_type
        )
      `
      )
      .eq('id', platformId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'delivery_platform')
      .single()

    if (platformError || !platform) {
      console.error('❌ Platform not found:', platformError)
      return NextResponse.json({ success: false, message: 'Platform not found' }, { status: 404 })
    }

    // Extract platform properties
    const platformProps =
      platform.dynamic_data?.reduce((acc: any, prop: any) => {
        let value = prop.field_value
        if (prop.field_type === 'boolean' && prop.field_value_boolean !== null) {
          value = prop.field_value_boolean
        }
        acc[prop.field_name] = value
        return acc
      }, {}) || {}

    // Check if platform is active and menu sync is enabled
    if (!platformProps.is_active || !platformProps.sync_menu) {
      console.log('⚠️ Platform menu sync is disabled')
      return NextResponse.json(
        {
          success: false,
          message: 'Menu sync is disabled for this platform'
        },
        { status: 400 }
      )
    }

    // Get menu items to sync
    let menuQuery = getSupabaseAdmin()
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
      .eq('entity_type', 'menu_item')
      .order('entity_name', { ascending: true })

    // Apply selective filtering if specified
    if (syncRequest.sync_type === 'selective' && syncRequest.menu_items) {
      menuQuery = menuQuery.in('id', syncRequest.menu_items)
    }

    // For incremental sync, only get items modified in last 24 hours
    if (syncRequest.sync_type === 'incremental' && !syncRequest.force_update) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      menuQuery = menuQuery.gte('updated_at', yesterday)
    }

    const { data: menuItems, error: menuError } = await menuQuery

    if (menuError) {
      console.error('❌ Error fetching menu items:', menuError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch menu items' },
        { status: 500 }
      )
    }

    if (!menuItems || menuItems.length === 0) {
      console.log('ℹ️ No menu items to sync')
      return NextResponse.json({
        success: true,
        message: 'No menu items found to sync',
        synced_items: 0
      })
    }

    // Transform menu items for the specific platform
    const transformer =
      menuTransformers[platformProps.platform_type as keyof typeof menuTransformers] ||
      menuTransformers.generic
    const transformedItems = menuItems.map(transformer)

    console.log(
      `🍽️ Transformed ${transformedItems.length} menu items for ${platformProps.platform_type}`
    )

    // Here you would normally call the platform's API to sync the menu
    // For demonstration, we'll simulate the API calls and store sync results

    const syncResults = {
      total_items: transformedItems.length,
      synced_items: 0,
      failed_items: 0,
      skipped_items: 0,
      errors: [] as string[],
      platform_responses: [] as any[]
    }

    // Simulate platform API calls
    for (const item of transformedItems) {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100))

        // Simulate different outcomes
        const random = Math.random()
        if (random > 0.9) {
          // 10% failure rate for demonstration
          syncResults.failed_items++
          syncResults.errors.push(`Failed to sync ${item.name}: Platform API error`)
        } else if (random > 0.8) {
          // 10% skip rate (already up to date)
          syncResults.skipped_items++
        } else {
          // 80% success rate
          syncResults.synced_items++
          syncResults.platform_responses.push({
            item_name: item.name,
            platform_item_id: `${platformProps.platform_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'synced'
          })
        }
      } catch (error) {
        syncResults.failed_items++
        syncResults.errors.push(`Failed to sync ${item.name}: ${error}`)
      }
    }

    // Update platform sync status
    await getSupabaseAdmin().from('core_dynamic_data').upsert(
      {
        organization_id: organizationId,
        entity_id: platformId,
        field_name: 'last_sync_at',
        field_value: new Date().toISOString(),
        field_type: 'text'
      },
      {
        onConflict: 'organization_id,entity_id,field_name'
      }
    )

    // Update sync status
    const syncStatus = syncResults.failed_items > 0 ? 'error' : 'connected'
    await getSupabaseAdmin().from('core_dynamic_data').upsert(
      {
        organization_id: organizationId,
        entity_id: platformId,
        field_name: 'sync_status',
        field_value: syncStatus,
        field_type: 'text'
      },
      {
        onConflict: 'organization_id,entity_id,field_name'
      }
    )

    // Store sync log for debugging
    await getSupabaseAdmin()
      .from('core_dynamic_data')
      .upsert(
        {
          organization_id: organizationId,
          entity_id: platformId,
          field_name: 'last_sync_result',
          field_value: JSON.stringify(syncResults),
          field_type: 'text'
        },
        {
          onConflict: 'organization_id,entity_id,field_name'
        }
      )

    const response = {
      success: true,
      message: `Menu sync completed: ${syncResults.synced_items} synced, ${syncResults.failed_items} failed, ${syncResults.skipped_items} skipped`,
      data: {
        platform_id: platformId,
        platform_name: platform.entity_name,
        platform_type: platformProps.platform_type,
        sync_type: syncRequest.sync_type,
        sync_timestamp: new Date().toISOString(),
        results: syncResults,
        next_steps:
          syncResults.failed_items > 0
            ? [
                'Review failed items in platform dashboard',
                'Check platform API credentials',
                'Retry sync for failed items'
              ]
            : ['Monitor platform for order updates', 'Schedule regular incremental syncs']
      }
    }

    console.log(
      `✅ Menu sync completed: ${syncResults.synced_items}/${syncResults.total_items} items synced`
    )
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Menu sync error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/v1/delivery-platforms/[platformId]/menu-sync - Get sync status and history
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platformId: string }> }
) {
  const params = await context.params
  try {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const platformId = params.platformId

    console.log(`📊 Menu Sync: Getting sync status for platform ${platformId}`)

    // Get platform with sync data
    const { data: platform, error: platformError } = await getSupabaseAdmin()
      .from('core_entities')
      .select(
        `
        *,
        dynamic_data:core_dynamic_data(
          field_name,
          field_value,
          field_type
        )
      `
      )
      .eq('id', platformId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'delivery_platform')
      .single()

    if (platformError || !platform) {
      console.error('❌ Platform not found:', platformError)
      return NextResponse.json({ success: false, message: 'Platform not found' }, { status: 404 })
    }

    // Extract sync-related properties
    const syncData =
      platform.dynamic_data?.reduce((acc: any, prop: any) => {
        if (
          ['last_sync_at', 'sync_status', 'last_sync_result', 'sync_menu'].includes(prop.field_name)
        ) {
          acc[prop.field_name] = prop.field_value
        }
        return acc
      }, {}) || {}

    // Get total menu items available for sync
    const { data: menuItems, error: menuError } = await getSupabaseAdmin()
      .from('core_entities')
      .select('id, entity_name, status, updated_at')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'menu_item')
      .order('updated_at', { ascending: false })

    if (menuError) {
      console.error('❌ Error fetching menu items:', menuError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch menu items' },
        { status: 500 }
      )
    }

    // Calculate sync statistics
    const totalItems = menuItems?.length || 0
    const activeItems = menuItems?.filter(item => item.status === 'active').length || 0
    const recentlyUpdated =
      menuItems?.filter(item => {
        const updatedAt = new Date(item.updated_at)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return updatedAt > oneDayAgo
      }).length || 0

    // Parse last sync result
    let lastSyncResult = null
    if (syncData.last_sync_result) {
      try {
        lastSyncResult = JSON.parse(syncData.last_sync_result)
      } catch (e) {
        console.warn('⚠️ Failed to parse last sync result')
      }
    }

    const response = {
      success: true,
      data: {
        platform_id: platformId,
        platform_name: platform.entity_name,
        sync_enabled: syncData.sync_menu !== 'false',
        sync_status: syncData.sync_status || 'not_configured',
        last_sync_at: syncData.last_sync_at || null,
        last_sync_result: lastSyncResult,
        menu_statistics: {
          total_items: totalItems,
          active_items: activeItems,
          recently_updated: recentlyUpdated,
          sync_pending: recentlyUpdated
        },
        recommendations: [
          ...(totalItems === 0 ? ['Add menu items to enable synchronization'] : []),
          ...(syncData.sync_status === 'error' ? ['Review and resolve sync errors'] : []),
          ...(recentlyUpdated > 0
            ? [`${recentlyUpdated} items updated, consider incremental sync`]
            : []),
          ...(!syncData.last_sync_at ? ['Perform initial full sync'] : [])
        ]
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Menu sync status error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
