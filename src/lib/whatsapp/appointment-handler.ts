/**
 * WhatsApp Appointment Booking Handler
 * Processes incoming messages and manages appointment bookings via WhatsApp
 */

import { universalApi } from '@/lib/universal-api'
import { formatDate, parseDateSafe } from '@/lib/date-utils'
import { addDays, isValid } from 'date-fns'

export interface WhatsAppMessage {
  from: string
  text: {
    body: string
  }
  type: 'text' | 'interactive' | 'button'
  timestamp: string
}

export interface AppointmentSession {
  phone: string
  step: 'greeting' | 'service' | 'staff' | 'date' | 'time' | 'confirm' | 'completed'
  data: {
    service?: string
    staff?: string
    date?: string
    time?: string
    customerName?: string
  }
}

// In-memory session storage (use Redis in production)
const sessions = new Map<string, AppointmentSession>()

// Available services
const SERVICES = [
  { id: '1', name: 'Haircut & Style', duration: 60, price: 150 },
  { id: '2', name: 'Hair Color', duration: 180, price: 280 },
  { id: '3', name: 'Keratin Treatment', duration: 180, price: 350 },
  { id: '4', name: 'Bridal Package', duration: 360, price: 800 },
  { id: '5', name: 'Spa Treatment', duration: 120, price: 300 }
]

// Available staff
const STAFF = [
  { id: '1', name: 'Rocky', title: 'Senior Stylist' },
  { id: '2', name: 'Maya', title: 'Color Specialist' },
  { id: '3', name: 'Sophia', title: 'Bridal Specialist' },
  { id: '4', name: 'Any Available', title: 'First Available' }
]

// Available time slots
const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]

export async function handleIncomingMessage(
  message: WhatsAppMessage,
  sendReply: (phone: string, text: string) => Promise<void>
) {
  const phone = message.from
  const text = message.text.body.toLowerCase().trim()
  
  // Get or create session
  let session = sessions.get(phone)
  
  // Check for restart commands
  if (text === 'restart' || text === 'cancel') {
    sessions.delete(phone)
    await sendReply(phone, "Booking cancelled. Send 'book' to start a new appointment.")
    return
  }
  
  // Start new booking
  if (!session && (text.includes('book') || text.includes('appointment'))) {
    session = {
      phone,
      step: 'greeting',
      data: {}
    }
    sessions.set(phone, session)
    
    await sendReply(phone, 
      "Welcome to Hair Talkz! 💇‍♀️\n\n" +
      "I'll help you book an appointment.\n\n" +
      "Please select a service:\n" +
      SERVICES.map((s, i) => `${i + 1}. ${s.name} (${s.duration}min - AED ${s.price})`).join('\n') +
      "\n\nReply with the number of your choice."
    )
    session.step = 'service'
    return
  }
  
  if (!session) {
    await sendReply(phone, 
      "Hello! Welcome to Hair Talkz. 👋\n\n" +
      "To book an appointment, please send 'book' or 'appointment'.\n\n" +
      "For other inquiries, please call us at +971 4 123 4567."
    )
    return
  }
  
  // Process based on current step
  switch (session.step) {
    case 'service':
      const serviceNum = parseInt(text)
      if (serviceNum >= 1 && serviceNum <= SERVICES.length) {
        session.data.service = SERVICES[serviceNum - 1].name
        session.step = 'staff'
        
        await sendReply(phone,
          `Great! You selected ${session.data.service}.\n\n` +
          "Please select your preferred stylist:\n" +
          STAFF.map((s, i) => `${i + 1}. ${s.name} - ${s.title}`).join('\n') +
          "\n\nReply with the number."
        )
      } else {
        await sendReply(phone, "Please reply with a valid service number (1-5).")
      }
      break
      
    case 'staff':
      const staffNum = parseInt(text)
      if (staffNum >= 1 && staffNum <= STAFF.length) {
        session.data.staff = STAFF[staffNum - 1].name
        session.step = 'date'
        
        // Generate next 7 days
        const dates = Array.from({ length: 7 }, (_, i) => {
          const date = addDays(new Date(), i)
          return `${i + 1}. ${formatDate(date, 'EEEE, MMM dd')}`
        })
        
        await sendReply(phone,
          `Perfect! ${session.data.staff} will take care of you.\n\n` +
          "Please select a date:\n" +
          dates.join('\n') +
          "\n\nReply with the number."
        )
      } else {
        await sendReply(phone, "Please reply with a valid stylist number (1-4).")
      }
      break
      
    case 'date':
      const dateNum = parseInt(text)
      if (dateNum >= 1 && dateNum <= 7) {
        const selectedDate = addDays(new Date(), dateNum - 1)
        session.data.date = formatDate(selectedDate, 'yyyy-MM-dd')
        session.step = 'time'
        
        await sendReply(phone,
          `Great! Booking for ${formatDate(selectedDate, 'EEEE, MMM dd')}.\n\n` +
          "Available time slots:\n" +
          TIME_SLOTS.map((t, i) => `${i + 1}. ${t}`).join('\n') +
          "\n\nReply with the number."
        )
      } else {
        await sendReply(phone, "Please reply with a valid date number (1-7).")
      }
      break
      
    case 'time':
      const timeNum = parseInt(text)
      if (timeNum >= 1 && timeNum <= TIME_SLOTS.length) {
        session.data.time = TIME_SLOTS[timeNum - 1]
        session.step = 'confirm'
        
        const service = SERVICES.find(s => s.name === session.data.service)
        
        await sendReply(phone,
          "📅 *Booking Summary*\n\n" +
          `Service: ${session.data.service}\n` +
          `Stylist: ${session.data.staff}\n` +
          `Date: ${formatDate(new Date(session.data.date!), 'EEEE, MMM dd')}\n` +
          `Time: ${session.data.time}\n` +
          `Duration: ${service?.duration} minutes\n` +
          `Price: AED ${service?.price}\n\n` +
          "Reply 'YES' to confirm or 'NO' to cancel."
        )
      } else {
        await sendReply(phone, "Please reply with a valid time slot number.")
      }
      break
      
    case 'confirm':
      if (text === 'yes' || text === 'y') {
        // Create appointment in database
        try {
          // In production, create actual appointment via universalApi
          session.step = 'completed'
          sessions.delete(phone) // Clear session
          
          await sendReply(phone,
            "✅ *Appointment Confirmed!*\n\n" +
            `Your appointment for ${session.data.service} with ${session.data.staff} ` +
            `on ${formatDate(new Date(session.data.date!), 'EEEE, MMM dd')} at ${session.data.time} has been booked.\n\n` +
            "You'll receive a reminder 24 hours before your appointment.\n\n" +
            "Thank you for choosing Hair Talkz! 💇‍♀️\n\n" +
            "To manage your booking, reply 'manage'."
          )
        } catch (error) {
          await sendReply(phone, "Sorry, there was an error booking your appointment. Please call us at +971 4 123 4567.")
        }
      } else if (text === 'no' || text === 'n') {
        sessions.delete(phone)
        await sendReply(phone, "Booking cancelled. Send 'book' to start a new appointment.")
      } else {
        await sendReply(phone, "Please reply 'YES' to confirm or 'NO' to cancel.")
      }
      break
  }
}

// Helper function to send WhatsApp message
export async function sendWhatsAppMessage(
  phone: string, 
  message: string,
  phoneNumberId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message }
    })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to send WhatsApp message: ${response.statusText}`)
  }
}