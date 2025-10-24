import { NextRequest, NextResponse } from 'next/server'
import { selectRows, selectRow } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/v2/universal/analytics-tiles
 *
 * Generate business intelligence tiles/KPIs for dashboard display
 *
 * Body parameters:
 * - organization_id: Required for multi-tenancy
 * - from: Start date for time-based metrics (ISO string)
 * - to: End date for time-based metrics (ISO string)
 * - tile_types: Array of specific tiles to generate (optional)
 * - currency: Currency code for formatting (default: 'INR')
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const {
    organization_id,
    from = new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    to = new Date().toISOString(),
    tile_types = [],
    currency = 'INR'
  } = body

  if (!organization_id) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
  }

  try {
    const tiles: any[] = []

    // Generate default tiles or specific ones
    const tilesToGenerate = tile_types.length > 0 ? tile_types : [
      'SalesToday',
      'OrdersToday', 
      'ActiveCustomers',
      'InventoryValue',
      'OpenTickets',
      'LowStock',
      'CashSnapshot'
    ]

    // Sales Today
    if (tilesToGenerate.includes('SalesToday')) {
      const salesSql = `
        SELECT 
          COALESCE(SUM(total_amount), 0) as sales_today,
          COUNT(*) as transaction_count
        FROM universal_transactions t
        WHERE t.organization_id = $1 
          AND t.transaction_type IN ('SALE', 'INVOICE')
          AND t.created_at >= $2 
          AND t.created_at <= $3
          AND t.status != 'CANCELLED'
      `
      const salesResult = await selectRow(salesSql, [organization_id, from, to])
      
      tiles.push({
        key: 'SalesToday',
        title: 'Sales Today',
        value: parseFloat(salesResult?.sales_today || 0),
        format: 'currency',
        currency,
        metadata: {
          transaction_count: parseInt(salesResult?.transaction_count || 0),
          period: 'today'
        }
      })
    }

    // Orders Today
    if (tilesToGenerate.includes('OrdersToday')) {
      const ordersSql = `
        SELECT COUNT(*) as orders_today
        FROM universal_transactions t
        WHERE t.organization_id = $1 
          AND t.transaction_type IN ('SALE', 'ORDER', 'INVOICE')
          AND t.created_at >= $2 
          AND t.created_at <= $3
          AND t.status != 'CANCELLED'
      `
      const ordersResult = await selectRow(ordersSql, [organization_id, from, to])
      
      tiles.push({
        key: 'OrdersToday',
        title: 'Orders Today',
        value: parseInt(ordersResult?.orders_today || 0),
        format: 'number'
      })
    }

    // Active Customers (customers with activity in the time period)
    if (tilesToGenerate.includes('ActiveCustomers')) {
      const customersSql = `
        SELECT COUNT(DISTINCT 
          CASE 
            WHEN t.source_entity_id IN (
              SELECT id FROM core_entities 
              WHERE entity_type = 'CUSTOMER' 
              AND organization_id = $1
            ) THEN t.source_entity_id
            WHEN t.target_entity_id IN (
              SELECT id FROM core_entities 
              WHERE entity_type = 'CUSTOMER' 
              AND organization_id = $1
            ) THEN t.target_entity_id
            ELSE NULL
          END
        ) as active_customers
        FROM universal_transactions t
        WHERE t.organization_id = $1 
          AND t.created_at >= $2 
          AND t.created_at <= $3
      `
      const customersResult = await selectRow(customersSql, [organization_id, from, to])
      
      tiles.push({
        key: 'ActiveCustomers',
        title: 'Active Customers',
        value: parseInt(customersResult?.active_customers || 0),
        format: 'number'
      })
    }

    // Inventory Value
    if (tilesToGenerate.includes('InventoryValue')) {
      const inventorySql = `
        SELECT 
          COALESCE(
            SUM(
              CASE 
                WHEN d.field_name = 'cost_price' THEN 
                  COALESCE(d.field_value_number, 0) * COALESCE(stock.field_value_number, 1)
                ELSE 0
              END
            ), 0
          ) as inventory_value
        FROM core_entities e
        LEFT JOIN core_dynamic_data d ON d.entity_id = e.id AND d.field_name = 'cost_price'
        LEFT JOIN core_dynamic_data stock ON stock.entity_id = e.id AND stock.field_name = 'stock_quantity'
        WHERE e.organization_id = $1 
          AND e.entity_type = 'PRODUCT'
          AND e.status = 'ACTIVE'
      `
      const inventoryResult = await selectRow(inventorySql, [organization_id])
      
      tiles.push({
        key: 'InventoryValue',
        title: 'Inventory Value',
        value: parseFloat(inventoryResult?.inventory_value || 0),
        format: 'currency',
        currency
      })
    }

    // Open Service Tickets
    if (tilesToGenerate.includes('OpenTickets')) {
      const ticketsSql = `
        SELECT COUNT(*) as open_tickets
        FROM core_entities e
        WHERE e.organization_id = $1 
          AND e.entity_type = 'SERVICE_JOB'
          AND e.status IN ('OPEN', 'IN_PROGRESS', 'PENDING')
      `
      const ticketsResult = await selectRow(ticketsSql, [organization_id])
      
      tiles.push({
        key: 'OpenTickets',
        title: 'Open Service Tickets',
        value: parseInt(ticketsResult?.open_tickets || 0),
        format: 'number'
      })
    }

    // Low Stock Items
    if (tilesToGenerate.includes('LowStock')) {
      const lowStockSql = `
        SELECT COUNT(DISTINCT e.id) as low_stock_count
        FROM core_entities e
        LEFT JOIN core_dynamic_data stock ON stock.entity_id = e.id AND stock.field_name = 'stock_quantity'
        LEFT JOIN core_dynamic_data reorder ON reorder.entity_id = e.id AND reorder.field_name = 'reorder_point'
        WHERE e.organization_id = $1 
          AND e.entity_type = 'PRODUCT'
          AND e.status = 'ACTIVE'
          AND COALESCE(stock.field_value_number, 0) <= COALESCE(reorder.field_value_number, 5)
          AND COALESCE(stock.field_value_number, 0) > 0
      `
      const lowStockResult = await selectRow(lowStockSql, [organization_id])
      
      tiles.push({
        key: 'LowStock',
        title: 'Low Stock Items',
        value: parseInt(lowStockResult?.low_stock_count || 0),
        format: 'number',
        alert_level: parseInt(lowStockResult?.low_stock_count || 0) > 0 ? 'warning' : 'normal'
      })
    }

    // Cash Snapshot (cash transactions today)
    if (tilesToGenerate.includes('CashSnapshot')) {
      const cashSql = `
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN tl.line_type = 'PAYMENT' 
                AND tl.metadata->>'method' IN ('CASH', 'cash')
              THEN tl.line_amount 
              ELSE 0 
            END
          ), 0) as cash_total
        FROM universal_transactions t
        LEFT JOIN universal_transaction_lines tl ON tl.transaction_id = t.id
        WHERE t.organization_id = $1 
          AND t.created_at >= $2 
          AND t.created_at <= $3
          AND t.status != 'CANCELLED'
      `
      const cashResult = await selectRow(cashSql, [organization_id, from, to])
      
      tiles.push({
        key: 'CashSnapshot',
        title: 'Cash Today',
        value: parseFloat(cashResult?.cash_total || 0),
        format: 'currency',
        currency
      })
    }

    // Calculate trends if we have previous period data
    for (const tile of tiles) {
      if (tile.format === 'currency' || tile.format === 'number') {
        try {
          // Get previous period (same duration before the from date)
          const duration = new Date(to).getTime() - new Date(from).getTime()
          const prevFrom = new Date(new Date(from).getTime() - duration).toISOString()
          const prevTo = from

          // Simple trend calculation - this could be expanded per tile type
          const trendSql = `
            SELECT 
              COALESCE(SUM(total_amount), 0) as prev_value,
              COUNT(*) as prev_count
            FROM universal_transactions t
            WHERE t.organization_id = $1 
              AND t.transaction_type IN ('SALE', 'INVOICE')
              AND t.created_at >= $2 
              AND t.created_at <= $3
              AND t.status != 'CANCELLED'
          `
          
          if (tile.key === 'SalesToday' || tile.key === 'CashSnapshot') {
            const trendResult = await selectRow(trendSql, [organization_id, prevFrom, prevTo])
            const prevValue = parseFloat(trendResult?.prev_value || 0)
            
            if (prevValue > 0) {
              const change = ((tile.value - prevValue) / prevValue) * 100
              tile.trend = {
                change_percent: Math.round(change * 100) / 100,
                direction: change >= 0 ? 'up' : 'down',
                previous_value: prevValue
              }
            }
          }
        } catch (trendError) {
          // Trend calculation failed, but don't fail the whole request
          console.warn('Trend calculation failed for', tile.key, trendError)
        }
      }
    }

    return NextResponse.json({
      api_version: 'v2',
      tiles,
      metadata: {
        organization_id,
        period: {
          from,
          to,
          duration_ms: new Date(to).getTime() - new Date(from).getTime()
        },
        currency,
        generated_at: new Date().toISOString(),
        tile_count: tiles.length
      }
    })

  } catch (error: any) {
    console.error('Error generating analytics tiles:', error)
    return NextResponse.json({ 
      error: 'analytics_error', 
      message: error.message 
    }, { status: 500 })
  }
}

/**
 * GET /api/v2/universal/analytics-tiles/schema
 *
 * Get available tile types and their schemas
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    api_version: 'v2',
    available_tiles: {
      SalesToday: {
        title: 'Sales Today',
        description: 'Total sales revenue for the current day',
        format: 'currency',
        category: 'financial'
      },
      OrdersToday: {
        title: 'Orders Today',
        description: 'Number of orders/transactions today',
        format: 'number', 
        category: 'operational'
      },
      ActiveCustomers: {
        title: 'Active Customers',
        description: 'Unique customers with activity in the period',
        format: 'number',
        category: 'customer'
      },
      InventoryValue: {
        title: 'Inventory Value',
        description: 'Total value of current inventory at cost',
        format: 'currency',
        category: 'inventory'
      },
      OpenTickets: {
        title: 'Open Service Tickets',
        description: 'Number of active service requests',
        format: 'number',
        category: 'service'
      },
      LowStock: {
        title: 'Low Stock Items',
        description: 'Products below reorder point',
        format: 'number',
        category: 'inventory',
        alert_levels: ['normal', 'warning', 'critical']
      },
      CashSnapshot: {
        title: 'Cash Today',
        description: 'Cash payments received today',
        format: 'currency',
        category: 'financial'
      }
    },
    supported_currencies: ['INR', 'USD', 'EUR', 'GBP'],
    trend_calculation: {
      enabled: true,
      comparison_period: 'previous_same_duration'
    }
  })
}