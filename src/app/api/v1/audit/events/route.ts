import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/client'

/**
 * GET /api/v1/audit/events
 * Retrieve audit events with filtering
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')
  const eventType = searchParams.get('eventType') || 'all'
  const result = searchParams.get('result') || 'all'
  const timeRange = searchParams.get('timeRange') || '24h'
  const limit = parseInt(searchParams.get('limit') || '100')

  if (!organizationId) {
    return NextResponse.json(
      { error: 'organization_id is required' },
      { status: 400 }
    )
  }

  try {
    const supabase = getSupabase()
    
    // Calculate time filter
    const now = new Date()
    let startTime = new Date()
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1)
        break
      case '24h':
        startTime.setDate(now.getDate() - 1)
        break
      case '7d':
        startTime.setDate(now.getDate() - 7)
        break
      case '30d':
        startTime.setDate(now.getDate() - 30)
        break
    }

    // Build query
    let query = supabase
      .from('universal_transactions')
      .select(`
        id,
        transaction_date,
        transaction_type,
        smart_code,
        metadata
      `)
      .eq('organization_id', organizationId)
      .in('transaction_type', ['audit', 'security_event', 'policy_check', 'data_access'])
      .gte('transaction_date', startTime.toISOString())
      .order('transaction_date', { ascending: false })
      .limit(limit)

    // Apply filters
    if (eventType !== 'all') {
      query = query.ilike('smart_code', `%${eventType.toUpperCase()}%`)
    }

    const { data: rawEvents, error } = await query

    if (error) throw error

    // Transform to audit event format
    const events = (rawEvents || []).map(event => ({
      id: event.id,
      timestamp: event.transaction_date,
      event_type: getEventType(event.smart_code),
      user_id: (event.metadata as any)?.user_id || 'system',
      user_name: (event.metadata as any)?.user_name || 'System',
      action: (event.metadata as any)?.action || event.transaction_type,
      resource: (event.metadata as any)?.resource || 'unknown',
      result: (event.metadata as any)?.decision === 'DENY' || (event.metadata as any)?.result === 'failure' ? 'failure' : 'success',
      ip_address: (event.metadata as any)?.ip_address || 'unknown',
      smart_code: event.smart_code,
      details: (event.metadata as any)?.details || {}
    }))

    // Apply result filter
    const filteredEvents = result === 'all' 
      ? events 
      : events.filter(e => e.result === result)

    return NextResponse.json({
      success: true,
      events: filteredEvents,
      total: filteredEvents.length
    })
  } catch (error) {
    console.error('Error fetching audit events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit events' },
      { status: 500 }
    )
  }
}

function getEventType(smartCode: string): string {
  if (smartCode.includes('.AUTH.')) return 'auth'
  if (smartCode.includes('.SECURITY.')) return 'security'
  if (smartCode.includes('.ADMIN.')) return 'admin'
  if (smartCode.includes('.DATA.')) return 'data'
  if (smartCode.includes('.RBAC.')) return 'security'
  if (smartCode.includes('.AUDIT.')) return 'admin'
  return 'other'
}