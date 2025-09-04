import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppBookingService } from '@/lib/salon/whatsapp-booking-service'

/**
 * WhatsApp Business API Webhook Handler
 * Processes incoming messages and booking requests
 */

// Webhook verification (GET request from WhatsApp)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verify token matches
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 })
}

// Handle incoming WhatsApp messages (POST request)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract organization ID from metadata or use default
    const organizationId = body.metadata?.organization_id || process.env.DEFAULT_ORGANIZATION_ID!
    
    // Initialize booking service
    const bookingService = new WhatsAppBookingService(organizationId)
    
    // Process WhatsApp webhook payload
    const { entry } = body
    
    if (!entry || !entry[0]?.changes) {
      return NextResponse.json({ status: 'no_changes' }, { status: 200 })
    }

    for (const change of entry[0].changes) {
      if (change.field === 'messages') {
        const { messages, contacts } = change.value
        
        if (messages && messages.length > 0) {
          for (const message of messages) {
            await processMessage(message, contacts, bookingService)
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Process individual WhatsApp message
 */
async function processMessage(
  message: any,
  contacts: any[],
  bookingService: WhatsAppBookingService
) {
  const contact = contacts.find(c => c.wa_id === message.from)
  const customerName = contact?.profile?.name || 'Guest'
  const customerPhone = message.from

  // Handle different message types
  switch (message.type) {
    case 'text':
      await handleTextMessage(message, customerName, customerPhone, bookingService)
      break
      
    case 'interactive':
      await handleInteractiveMessage(message, customerName, customerPhone, bookingService)
      break
      
    case 'button':
      await handleButtonResponse(message, customerName, customerPhone, bookingService)
      break
      
    default:
      console.log(`Unsupported message type: ${message.type}`)
  }
}

/**
 * Handle text messages
 */
async function handleTextMessage(
  message: any,
  customerName: string,
  customerPhone: string,
  bookingService: WhatsAppBookingService
) {
  const response = await bookingService.processIncomingMessage({
    text: { body: message.text.body },
    from: customerPhone,
    name: customerName
  })
  
  // Send response via WhatsApp API
  await sendWhatsAppMessage(customerPhone, response)
}

/**
 * Handle interactive list/button messages
 */
async function handleInteractiveMessage(
  message: any,
  customerName: string,
  customerPhone: string,
  bookingService: WhatsAppBookingService
) {
  const { type } = message.interactive
  
  if (type === 'list_reply') {
    const selectedId = message.interactive.list_reply.id
    // Process list selection (e.g., service selection)
    await processListSelection(selectedId, customerPhone, bookingService)
  } else if (type === 'button_reply') {
    const selectedId = message.interactive.button_reply.id
    // Process button selection
    await processButtonSelection(selectedId, customerPhone, bookingService)
  }
}

/**
 * Handle button responses
 */
async function handleButtonResponse(
  message: any,
  customerName: string,
  customerPhone: string,
  bookingService: WhatsAppBookingService
) {
  const buttonId = message.button.payload
  await processButtonSelection(buttonId, customerPhone, bookingService)
}

/**
 * Process list selection (e.g., service categories)
 */
async function processListSelection(
  selectionId: string,
  customerPhone: string,
  bookingService: WhatsAppBookingService
) {
  // Map selection IDs to actions
  const serviceMap: Record<string, string> = {
    'hair_services': 'Hair Services',
    'nail_services': 'Nail Services',
    'spa_treatments': 'Spa Treatments',
    'packages': 'Packages & Offers'
  }
  
  const selectedService = serviceMap[selectionId]
  if (selectedService) {
    // Send next step in booking flow
    const message = getServiceOptionsMessage(selectedService)
    await sendWhatsAppMessage(customerPhone, message)
  }
}

/**
 * Process button selection
 */
async function processButtonSelection(
  buttonId: string,
  customerPhone: string,
  bookingService: WhatsAppBookingService
) {
  // Handle different button actions
  switch (buttonId) {
    case 'book_now':
      await sendServiceCategoriesMessage(customerPhone)
      break
      
    case 'confirm_booking':
      // Process booking confirmation
      break
      
    case 'cancel':
      await sendWhatsAppMessage(customerPhone, 'No problem! Feel free to reach out when you\'re ready to book.')
      break
      
    default:
      console.log(`Unknown button ID: ${buttonId}`)
  }
}

/**
 * Get service options for a category
 */
function getServiceOptionsMessage(category: string): string {
  const services: Record<string, string[]> = {
    'Hair Services': [
      '💇‍♀️ Premium Cut & Style - AED 150',
      '🎨 Hair Color & Highlights - AED 280',
      '✨ Brazilian Blowout - AED 500',
      '🔥 Keratin Treatment - AED 350'
    ],
    'Nail Services': [
      '💅 Classic Manicure - AED 80',
      '✨ Gel Manicure - AED 120',
      '🦶 Luxury Pedicure - AED 150',
      '💎 Nail Art Design - AED 50+'
    ]
  }
  
  const serviceList = services[category] || []
  return `${category}:\n\n${serviceList.join('\n')}\n\nWhich service would you like to book?`
}

/**
 * Send service categories as interactive list
 */
async function sendServiceCategoriesMessage(customerPhone: string) {
  const message = {
    type: 'interactive',
    interactive: {
      type: 'list',
      header: {
        type: 'text',
        text: 'Our Services'
      },
      body: {
        text: 'Please select a service category:'
      },
      action: {
        button: 'View Categories',
        sections: [
          {
            title: 'Service Categories',
            rows: [
              {
                id: 'hair_services',
                title: 'Hair Services',
                description: 'Cuts, colors, treatments'
              },
              {
                id: 'nail_services',
                title: 'Nail Services',
                description: 'Manicure, pedicure, nail art'
              },
              {
                id: 'spa_treatments',
                title: 'Spa Treatments',
                description: 'Facials, massages, body treatments'
              },
              {
                id: 'packages',
                title: 'Packages & Offers',
                description: 'Special deals and combos'
              }
            ]
          }
        ]
      }
    }
  }
  
  await sendWhatsAppInteractiveMessage(customerPhone, message)
}

/**
 * Send WhatsApp text message
 */
async function sendWhatsAppMessage(to: string, text: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text }
        })
      }
    )
    
    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
  }
}

/**
 * Send WhatsApp interactive message
 */
async function sendWhatsAppInteractiveMessage(to: string, interactiveMessage: any) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          ...interactiveMessage
        })
      }
    )
    
    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to send WhatsApp interactive message:', error)
  }
}