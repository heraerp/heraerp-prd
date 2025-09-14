import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { 
  createConversation,
  postMessage,
  upsertCustomerByPhone,
  registerTemplate,
  createCampaign
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

    // Get organization ID from user's entities
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('organization_id')
      .eq('entity_type', 'user')
      .eq('entity_code', user.id)
      .single()

    if (!userEntity?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const organizationId = userEntity.organization_id
    const body = await request.json()
    const { scenario = 'basic' } = body

    let results = []

    switch (scenario) {
      case 'basic':
        // Demo: Create a conversation and send messages
        // 1. Create customer
        const customer1 = await upsertCustomerByPhone(
          organizationId,
          '+971501234567',
          'Sarah Thompson'
        )
        results.push({ step: 'Create Customer', ...customer1 })

        if (customer1.success && customer1.customer_id) {
          // 2. Create conversation
          const conv1 = await createConversation(
            organizationId,
            customer1.customer_id,
            '+971501234567'
          )
          results.push({ step: 'Create Conversation', ...conv1 })

          if (conv1.success && conv1.thread_id) {
            // 3. Send inbound message
            const msg1 = await postMessage(organizationId, conv1.thread_id, {
              direction: 'inbound',
              text: 'Hi, I would like to book an appointment for a haircut tomorrow at 3pm',
              channelMsgId: `wamid.${Date.now()}`
            })
            results.push({ step: 'Inbound Message', ...msg1 })

            // 4. Send outbound response
            const msg2 = await postMessage(organizationId, conv1.thread_id, {
              direction: 'outbound',
              text: 'Hello Sarah! I can help you with that. Let me check our availability for tomorrow at 3pm. One moment please...',
              cost: 0.005
            })
            results.push({ step: 'Outbound Response', ...msg2 })

            // 5. Send appointment confirmation
            const msg3 = await postMessage(organizationId, conv1.thread_id, {
              direction: 'outbound',
              interactive: {
                type: 'button',
                body: {
                  text: 'Good news! We have an opening tomorrow at 3pm for a haircut with Maria. The service will take approximately 45 minutes and costs AED 150.'
                },
                action: {
                  buttons: [
                    { type: 'reply', reply: { id: 'confirm', title: 'Confirm Booking' } },
                    { type: 'reply', reply: { id: 'change', title: 'Change Time' } }
                  ]
                }
              },
              cost: 0.005
            })
            results.push({ step: 'Interactive Confirmation', ...msg3 })
          }
        }
        break

      case 'template':
        // Demo: Register template and create campaign
        // 1. Register appointment reminder template
        const template1 = await registerTemplate(organizationId, {
          name: 'appointment_reminder',
          language: 'en',
          body: 'Hi {{1}}, this is a reminder for your {{2}} appointment tomorrow at {{3}}. Reply CONFIRM to confirm or CANCEL to cancel.',
          variables: ['customer_name', 'service_type', 'appointment_time'],
          category: 'appointment_update'
        })
        results.push({ step: 'Register Template', ...template1 })

        if (template1.success && template1.template_id) {
          // 2. Create campaign
          const campaign1 = await createCampaign(organizationId, {
            name: 'Tomorrow Appointment Reminders',
            templateEntityId: template1.template_id,
            audienceQuery: 'SELECT * FROM customers WHERE has_appointment_tomorrow = true',
            scheduleAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
          results.push({ step: 'Create Campaign', ...campaign1 })
        }
        break

      case 'booking_flow':
        // Demo: Complete booking flow
        // 1. Create customer
        const customer2 = await upsertCustomerByPhone(
          organizationId,
          '+971555555555',
          'Emma Wilson'
        )
        results.push({ step: 'Create Customer', ...customer2 })

        if (customer2.success && customer2.customer_id) {
          // 2. Create conversation
          const conv2 = await createConversation(
            organizationId,
            customer2.customer_id,
            '+971555555555'
          )
          results.push({ step: 'Create Conversation', ...conv2 })

          if (conv2.success && conv2.thread_id) {
            // 3. Send service menu
            const menuMsg = await postMessage(organizationId, conv2.thread_id, {
              direction: 'outbound',
              interactive: {
                type: 'list',
                header: {
                  type: 'text',
                  text: 'Welcome to Hair Talkz Salon!'
                },
                body: {
                  text: 'Please select a service from our menu:'
                },
                action: {
                  button: 'View Services',
                  sections: [
                    {
                      title: 'Hair Services',
                      rows: [
                        { id: 'haircut', title: 'Haircut & Style', description: 'AED 150 - 45 mins' },
                        { id: 'color', title: 'Hair Color', description: 'AED 350 - 2 hours' },
                        { id: 'highlights', title: 'Highlights', description: 'AED 450 - 2.5 hours' }
                      ]
                    },
                    {
                      title: 'Treatments',
                      rows: [
                        { id: 'keratin', title: 'Keratin Treatment', description: 'AED 800 - 3 hours' },
                        { id: 'deepcond', title: 'Deep Conditioning', description: 'AED 200 - 1 hour' }
                      ]
                    }
                  ]
                }
              },
              cost: 0.01
            })
            results.push({ step: 'Service Menu', ...menuMsg })
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid scenario', available_scenarios: ['basic', 'template', 'booking_flow'] },
          { status: 400 }
        )
    }

    return NextResponse.json({
      status: 'success',
      scenario,
      component: 'HERA.WHATSAPP.DEMO.SIX.TABLES.v1',
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total_operations: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    console.error('WhatsApp Demo API error:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'success',
    component: 'HERA.WHATSAPP.DEMO.API.v1',
    description: 'WhatsApp Six Tables Demo API',
    available_scenarios: {
      basic: 'Create conversation and exchange messages',
      template: 'Register template and create campaign',
      booking_flow: 'Complete salon booking flow with interactive messages'
    },
    usage: 'POST /api/v1/whatsapp/demo with { scenario: "basic" | "template" | "booking_flow" }'
  })
}