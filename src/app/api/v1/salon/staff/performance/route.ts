import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || 'today'
    const organizationId = searchParams.get('organization_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get staff members
    const { data: staffMembers, error: staffError } = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee')

    if (staffError) {
      console.error('Staff error:', staffError)
      throw staffError
    }

    // Create performance data with sample metrics
    const performanceData = (staffMembers || []).map((staff, index) => {
      const baseMetrics = {
        appointments: [8, 12, 6, 10][index % 4],
        revenue: [850, 1200, 680, 920][index % 4],
        rating: [4.8, 4.9, 4.6, 4.7][index % 4]
      }

      const commissionRate = staff.metadata?.commission_rate || 0.4
      const commission = baseMetrics.revenue * commissionRate

      return {
        id: staff.id,
        name: staff.entity_name,
        appointments: baseMetrics.appointments,
        revenue: baseMetrics.revenue,
        commission,
        rating: baseMetrics.rating,
        specialties: staff.metadata?.specialties || ['Hair Styling'],
        utilization: 75 + index * 5 // Sample utilization
      }
    })

    // Sort by revenue (highest first) and limit results
    const sortedData = performanceData.sort((a, b) => b.revenue - a.revenue).slice(0, limit)

    return NextResponse.json({
      success: true,
      data: sortedData
    })
  } catch (error) {
    console.error('Staff performance API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch staff performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
