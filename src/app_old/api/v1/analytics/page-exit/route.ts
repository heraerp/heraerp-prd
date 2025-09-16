import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { pageId, docType, slug, timeOnPage, maxScroll } = data

    // Create analytics transaction via HERA universal transactions
    const analyticsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Add authentication headers as needed
        },
        body: JSON.stringify({
          transaction_type: 'doc_page_exit',
          description: `Documentation page exit: ${slug}`,
          transaction_data: {
            page_id: pageId,
            doc_type: docType,
            slug: slug,
            time_on_page: timeOnPage,
            max_scroll: maxScroll,
            session_id: request.headers.get('x-session-id') || 'anonymous',
            user_agent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          },
          transaction_lines: [
            {
              line_type: 'page_exit_metrics',
              entity_id: pageId,
              quantity: 1,
              line_data: {
                time_on_page: timeOnPage,
                max_scroll: maxScroll,
                exit_type: 'beforeunload'
              }
            }
          ]
        })
      }
    )

    if (analyticsResponse.ok) {
      return NextResponse.json({ success: true })
    } else {
      console.error('Failed to record page exit analytics')
      return NextResponse.json({ error: 'Analytics recording failed' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error recording page exit analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
