import { NextRequest } from 'next/server'
import { getSupabase } from '@/src/lib/supabase/client'

/**
 * Server-Sent Events endpoint for real-time audit streaming
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')
  const since = searchParams.get('since') || new Date().toISOString()

  if (!organizationId) {
    return new Response('Missing organization_id', { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  })

  // Start streaming
  const streamAuditEvents = async () => {
    const supabase = getSupabase()
    let lastEventTime = since

    // Send initial ping
    await writer.write(encoder.encode(':ok\n\n'))

    // Poll for new events every 2 seconds
    const interval = setInterval(async () => {
      try {
        const { data: events } = await supabase
          .from('universal_transactions')
          .select(
            `
            id,
            transaction_date,
            transaction_type,
            smart_code,
            metadata
          `
          )
          .eq('organization_id', organizationId)
          .in('transaction_type', ['audit', 'security_event', 'policy_check', 'data_access'])
          .gt('transaction_date', lastEventTime)
          .order('transaction_date', { ascending: false })
          .limit(10)

        if (events && events.length > 0) {
          // Update last event time
          lastEventTime = events[0].transaction_date

          // Send each event
          for (const event of events.reverse()) {
            const auditEvent = {
              id: event.id,
              timestamp: event.transaction_date,
              event_type: getEventType(event.smart_code),
              user_id: (event.metadata as any)?.user_id || 'system',
              user_name: (event.metadata as any)?.user_name || 'System',
              action: (event.metadata as any)?.action || event.transaction_type,
              resource: (event.metadata as any)?.resource || 'unknown',
              result: (event.metadata as any)?.result === 'DENY' ? 'failure' : 'success',
              ip_address: (event.metadata as any)?.ip_address || 'unknown',
              smart_code: event.smart_code,
              details: (event.metadata as any)?.details || {}
            }

            const data = `data: ${JSON.stringify(auditEvent)}\n\n`
            await writer.write(encoder.encode(data))
          }
        }

        // Send heartbeat
        await writer.write(encoder.encode(':heartbeat\n\n'))
      } catch (error) {
        console.error('Error streaming audit events:', error)
      }
    }, 2000)

    // Clean up on disconnect
    request.signal.addEventListener('abort', () => {
      clearInterval(interval)
      writer.close()
    })
  }

  // Start streaming in background
  streamAuditEvents()

  return new Response(stream.readable, { headers })
}

function getEventType(smartCode: string): string {
  if (smartCode.includes('.AUTH.')) return 'auth'
  if (smartCode.includes('.SECURITY.')) return 'security'
  if (smartCode.includes('.ADMIN.')) return 'admin'
  if (smartCode.includes('.DATA.')) return 'data'
  return 'other'
}
