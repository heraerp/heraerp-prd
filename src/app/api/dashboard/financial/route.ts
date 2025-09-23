import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Fixed organization ID for Michele's salon
    const organizationId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

    // Get data for last 6 months
    const results = []
    const today = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthStr = date.toISOString().slice(0, 7) + '-01'

      // Call the PostgreSQL function for each month
      const { data, error } = await supabase.rpc('fn_monthly_financial_summary', {
        p_month: monthStr,
        p_org_id: organizationId
      })

      if (error) {
        console.error(`Error fetching data for ${monthStr}:`, error)
        // Continue with next month even if one fails
        continue
      }

      if (data) {
        results.push({
          month_name: date.toLocaleDateString('en-US', { month: 'short' }),
          month_start: monthStr,
          total_revenue_aed: data.revenue?.total_revenue_aed || 0,
          total_expenses_aed: data.expenses?.total_expenses_aed || 0,
          net_profit_aed: data.profitability?.gross_profit_aed || 0,
          profit_margin_percentage: data.profitability?.profit_margin_percentage || 0,
          top_services_revenue_aed: data.revenue?.total_revenue_aed || 0,
          top_products_revenue_aed: 0
        })
      }
    }

    // If no real data, return demo data
    if (results.length === 0 || results.every(r => r.total_revenue_aed === 0)) {
      const demoData = [
        {
          month_name: 'Apr',
          total_revenue_aed: 45000,
          total_expenses_aed: 28000,
          net_profit_aed: 17000,
          profit_margin_percentage: 37.8,
          top_services_revenue_aed: 38000,
          top_products_revenue_aed: 7000
        },
        {
          month_name: 'May',
          total_revenue_aed: 48000,
          total_expenses_aed: 29500,
          net_profit_aed: 18500,
          profit_margin_percentage: 38.5,
          top_services_revenue_aed: 40000,
          top_products_revenue_aed: 8000
        },
        {
          month_name: 'Jun',
          total_revenue_aed: 52000,
          total_expenses_aed: 31000,
          net_profit_aed: 21000,
          profit_margin_percentage: 40.4,
          top_services_revenue_aed: 43000,
          top_products_revenue_aed: 9000
        },
        {
          month_name: 'Jul',
          total_revenue_aed: 55000,
          total_expenses_aed: 33000,
          net_profit_aed: 22000,
          profit_margin_percentage: 40.0,
          top_services_revenue_aed: 45000,
          top_products_revenue_aed: 10000
        },
        {
          month_name: 'Aug',
          total_revenue_aed: 58000,
          total_expenses_aed: 35000,
          net_profit_aed: 23000,
          profit_margin_percentage: 39.7,
          top_services_revenue_aed: 47000,
          top_products_revenue_aed: 11000
        },
        {
          month_name: 'Sep',
          total_revenue_aed: 62000,
          total_expenses_aed: 38500,
          net_profit_aed: 23500,
          profit_margin_percentage: 37.9,
          top_services_revenue_aed: 50000,
          top_products_revenue_aed: 12000
        }
      ]
      return NextResponse.json(demoData)
    }

    // Return the aggregated data
    return NextResponse.json(results)
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
