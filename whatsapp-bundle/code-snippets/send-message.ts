import axios from 'axios'

/**
 * Send a WhatsApp message using the Cloud API
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
  type: 'text' | 'interactive' = 'text'
) {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
  const API_VERSION = 'v18.0'
  
  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`
  
  // Text message
  if (type === 'text') {
    const data = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: message
      }
    }
    
    try {
      const response = await axios.post(url, data, {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error)
      throw error
    }
  }
}

/**
 * Send interactive button message
 */
export async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
) {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
  const API_VERSION = 'v18.0'
  
  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`
  
  const data = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: bodyText
      },
      action: {
        buttons: buttons.map(btn => ({
          type: 'reply',
          reply: {
            id: btn.id,
            title: btn.title
          }
        }))
      }
    }
  }
  
  try {
    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    return response.data
  } catch (error) {
    console.error('Failed to send interactive message:', error)
    throw error
  }
}

// Example usage:
/*
// Send text message
await sendWhatsAppMessage(
  '919945896033',
  'Hello! Your appointment is confirmed for tomorrow at 2 PM.'
)

// Send interactive buttons
await sendInteractiveButtons(
  '919945896033',
  'What would you like to do?',
  [
    { id: 'book_appointment', title: '📅 Book Appointment' },
    { id: 'view_services', title: '💅 Our Services' },
    { id: 'contact_us', title: '📞 Contact Us' }
  ]
)
*/