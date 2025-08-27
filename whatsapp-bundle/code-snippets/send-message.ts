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

/**
 * Send list message
 */
export async function sendListMessage(
  to: string,
  headerText: string,
  bodyText: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>
  }>
) {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
  const API_VERSION = 'v18.0'
  
  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`
  
  const data = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'list',
    interactive: {
      type: 'list',
      header: {
        type: 'text',
        text: headerText
      },
      body: {
        text: bodyText
      },
      action: {
        button: buttonText,
        sections: sections
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
    console.error('Failed to send list message:', error)
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

// Send service list
await sendListMessage(
  '919945896033',
  '💅 Our Services',
  'Browse our complete service menu:',
  'View Services',
  [
    {
      title: 'Hair Services',
      rows: [
        { id: 'haircut', title: 'Haircut & Style', description: 'AED 150 • 45 min' },
        { id: 'color', title: 'Hair Color', description: 'AED 350 • 120 min' }
      ]
    },
    {
      title: 'Facial Treatments',
      rows: [
        { id: 'classic_facial', title: 'Classic Facial', description: 'AED 200 • 60 min' },
        { id: 'anti_aging', title: 'Anti-Aging Facial', description: 'AED 350 • 90 min' }
      ]
    }
  ]
)
*/