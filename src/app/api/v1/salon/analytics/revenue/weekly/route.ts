import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const searchParams = request.nextUrl.searchParams
    const weeks = parseInt(searchParams.get('weeks') || '12')
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get all transactions first to determine the date range
    const { data: allTransactions, error: allError } = await supabase
      .from('universal_transactions')
      .select('transaction_date')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'sale')
      .order('transaction_date', { ascending: false })
      .limit(1)
    
    if (allError) throw allError

    // Use the most recent transaction date as the end date, or today if no transactions
    const mostRecentDate = allTransactions && allTransactions.length > 0 
      ? new Date(allTransactions[0].transaction_date)
      : new Date()
    
    // Calculate date range from the most recent transaction
    const endDate = new Date(mostRecentDate)
    const startDate = new Date(mostRecentDate)
    startDate.setDate(startDate.getDate() - (weeks * 7))

    // Get transactions for the time period
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select('total_amount, transaction_date')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'sale')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString())

    if (error) {
      console.error('Weekly revenue error:', error)
      throw error
    }

    // Group revenue by week
    const weeklyRevenue: Record<string, number> = {}
    const labels: string[] = []

    // Generate week labels and initialize data based on the adjusted end date
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(endDate)
      weekStart.setDate(weekStart.getDate() - (i * 7))
      const weekKey = `Week ${weeks - i}`
      labels.push(weekKey)
      weeklyRevenue[weekKey] = 0
    }

    // Group transactions by week
    transactions?.forEach(txn => {
      const txnDate = new Date(txn.transaction_date)
      const weeksAgo = Math.floor((endDate.getTime() - txnDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const weekIndex = weeks - weeksAgo - 1
      
      if (weekIndex >= 0 && weekIndex < weeks) {
        const weekKey = `Week ${weekIndex + 1}`
        if (weeklyRevenue[weekKey] !== undefined) {
          weeklyRevenue[weekKey] += txn.total_amount || 0
        }
      }
    })

    // Convert to chart data format
    const data = labels.map(label => weeklyRevenue[label])

    return NextResponse.json({
      success: true,
      data: {
        labels,
        datasets: [
          {
            label: 'Weekly Revenue',
            data,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true
          }
        ]
      }
    })
  } catch (error) {
    console.error('Weekly revenue API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weekly revenue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}