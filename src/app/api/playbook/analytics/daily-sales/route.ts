import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const orgId = searchParams.get('orgId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Fetch transactions with their lines
    let query = supabase
      .from('universal_transactions')
      .select(`
        id,
        transaction_date,
        total_amount,
        universal_transaction_lines!inner(
          line_amount,
          smart_code
        )
      `)
      .eq('organization_id', orgId)
      .eq('transaction_type', 'sale')
      // No status filtering - all completed sales are valid

    if (startDate) {
      query = query.gte('transaction_date', startDate)
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Failed to fetch transactions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch daily sales', details: error.message },
        { status: 500 }
      )
    }

    // Group by date and calculate totals
    const dailySales = new Map<string, {
      sale_date: string
      transaction_count: number
      gross_sales: number
      total_discounts: number
      total_tax: number
      net_sales: number
    }>()

    transactions?.forEach(transaction => {
      const date = new Date(transaction.transaction_date).toISOString().split('T')[0]
      
      if (!dailySales.has(date)) {
        dailySales.set(date, {
          sale_date: date,
          transaction_count: 0,
          gross_sales: 0,
          total_discounts: 0,
          total_tax: 0,
          net_sales: 0
        })
      }

      const dayData = dailySales.get(date)!
      dayData.transaction_count++
      dayData.gross_sales += transaction.total_amount || 0

      // Process lines for discounts and taxes
      transaction.universal_transaction_lines?.forEach((line: any) => {
        if (line.smart_code?.includes('DISCOUNT')) {
          dayData.total_discounts += Math.abs(line.line_amount || 0)
        } else if (line.smart_code?.includes('TAX')) {
          dayData.total_tax += line.line_amount || 0
        }
      })

      dayData.net_sales = dayData.gross_sales - dayData.total_discounts
    })

    // Convert to array and sort by date descending
    const items = Array.from(dailySales.values()).sort((a, b) => 
      b.sale_date.localeCompare(a.sale_date)
    )

    return NextResponse.json({
      items,
      total: items.length
    })
  } catch (error) {
    console.error('Unexpected error in daily sales:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}