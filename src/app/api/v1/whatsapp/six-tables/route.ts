import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { 
  createConversation,
  postMessage,
  assignConversation,
  addInternalNote,
  linkThreadToCustomer,
  getConversations,
  getWhatsAppAnalytics,
  upsertCustomerByPhone,
  togglePin,
  toggleArchive,
  WHATSAPP_SMART_CODES
} from '@/lib/mcp/whatsapp-six-tables-mcp'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use environment variable for organization ID in development
    // In production, this should come from the authenticated user's context
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'missing-org-id'
    
    if (organizationId === 'missing-org-id') {
      return NextResponse.json({ 
        error: 'Organization ID not configured. Set DEFAULT_ORGANIZATION_ID in .env' 
      }, { status: 400 })
    }
    const body = await request.json()
    const { action, ...params } = body

    let result: any

    switch (action) {
      case 'createConversation':
        // First ensure customer exists
        if (params.phoneNumber && params.displayName) {
          const customerResult = await upsertCustomerByPhone(
            organizationId,
            params.phoneNumber,
            params.displayName
          )
          if (customerResult.success && customerResult.customer_id) {
            result = await createConversation(
              organizationId,
              customerResult.customer_id,
              params.phoneNumber,
              params.agentQueueId
            )
          } else {
            result = customerResult
          }
        } else {
          result = { success: false, error: 'Phone number and display name required' }
        }
        break

      case 'postMessage':
        result = await postMessage(
          organizationId,
          params.threadId,
          {
            direction: params.direction || 'outbound',
            text: params.text,
            media: params.media,
            interactive: params.interactive,
            channelMsgId: params.channelMsgId,
            cost: params.cost
          }
        )
        break

      case 'assignConversation':
        result = await assignConversation(
          organizationId,
          params.threadId,
          params.assigneeEntityId
        )
        break

      case 'addInternalNote':
        result = await addInternalNote(
          organizationId,
          params.threadId,
          params.noteText,
          params.authorEntityId
        )
        break

      case 'linkThreadToCustomer':
        result = await linkThreadToCustomer(
          organizationId,
          params.threadId,
          params.customerId
        )
        break

      case 'getConversations':
        result = await getConversations(organizationId, {
          status: params.status,
          assigneeEntityId: params.assigneeEntityId,
          search: params.search
        })
        break

      case 'getAnalytics':
        result = await getWhatsAppAnalytics(organizationId, {
          startDate: params.startDate ? new Date(params.startDate) : undefined,
          endDate: params.endDate ? new Date(params.endDate) : undefined
        })
        break

      case 'togglePin':
        result = await togglePin(
          organizationId,
          params.threadId,
          params.shouldPin
        )
        break

      case 'toggleArchive':
        result = await toggleArchive(
          organizationId,
          params.threadId,
          params.shouldArchive
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action', available_actions: [
            'createConversation',
            'postMessage',
            'assignConversation',
            'addInternalNote',
            'linkThreadToCustomer',
            'getConversations',
            'getAnalytics',
            'togglePin',
            'toggleArchive'
          ]},
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      action,
      ...result
    })

  } catch (error) {
    console.error('WhatsApp Six Tables API error:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use environment variable for organization ID in development
    // In production, this should come from the authenticated user's context
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'missing-org-id'
    
    if (organizationId === 'missing-org-id') {
      return NextResponse.json({ 
        error: 'Organization ID not configured. Set DEFAULT_ORGANIZATION_ID in .env' 
      }, { status: 400 })
    }
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    if (action === 'conversations') {
      const result = await getConversations(organizationId, {
        status: searchParams.get('status') as any,
        assigneeEntityId: searchParams.get('assigneeEntityId') || undefined,
        search: searchParams.get('search') || undefined
      })
      
      return NextResponse.json({
        status: result.success ? 'success' : 'error',
        ...result
      })
    }

    if (action === 'analytics') {
      const result = await getWhatsAppAnalytics(organizationId, {
        startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
        endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
      })
      
      return NextResponse.json({
        status: result.success ? 'success' : 'error',
        ...result
      })
    }

    // Return smart codes reference
    return NextResponse.json({
      status: 'success',
      component: 'HERA.WHATSAPP.SIX.TABLES.API.v1',
      description: 'WhatsApp Business Integration using Six Sacred Tables',
      smart_codes: WHATSAPP_SMART_CODES,
      available_actions: {
        POST: [
          'createConversation',
          'postMessage',
          'assignConversation',
          'addInternalNote',
          'linkThreadToCustomer',
          'getConversations',
          'getAnalytics'
        ],
        GET: [
          'conversations',
          'analytics'
        ]
      }
    })

  } catch (error) {
    console.error('WhatsApp Six Tables API error:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}