import { Intent } from '@/lib/whatsapp/processor'

/**
 * Custom intent recognition for your business
 */
export function parseCustomIntents(text: string, senderType: string): Intent {
  const lowerText = text.toLowerCase()
  
  // Add your custom intents here
  
  // Promotional intents
  if (lowerText.includes('offer') || lowerText.includes('discount')) {
    return {
      action: 'view_promotions',
      confidence: 0.9
    }
  }
  
  // Location/directions
  if (lowerText.includes('where') || lowerText.includes('location') || lowerText.includes('address')) {
    return {
      action: 'get_location',
      confidence: 0.95
    }
  }
  
  // Operating hours
  if (lowerText.includes('open') || lowerText.includes('hours') || lowerText.includes('timing')) {
    return {
      action: 'get_hours',
      confidence: 0.9
    }
  }
  
  // Reviews/testimonials
  if (lowerText.includes('review') || lowerText.includes('rating')) {
    return {
      action: 'view_reviews',
      confidence: 0.85
    }
  }
  
  // Gift cards
  if (lowerText.includes('gift') || lowerText.includes('voucher')) {
    return {
      action: 'gift_cards',
      confidence: 0.9
    }
  }
  
  // Membership/packages
  if (lowerText.includes('membership') || lowerText.includes('package')) {
    return {
      action: 'view_memberships',
      confidence: 0.9
    }
  }
  
  // Product catalog
  if (lowerText.includes('product') || lowerText.includes('buy')) {
    return {
      action: 'view_products',
      confidence: 0.85
    }
  }
  
  // Appointment status
  if (lowerText.includes('status') || lowerText.includes('confirm')) {
    return {
      action: 'check_appointment_status',
      confidence: 0.9
    }
  }
  
  // Emergency/urgent
  if (lowerText.includes('urgent') || lowerText.includes('emergency')) {
    return {
      action: 'urgent_request',
      confidence: 1.0
    }
  }
  
  // Feedback/complaints
  if (lowerText.includes('feedback') || lowerText.includes('complaint')) {
    return {
      action: 'submit_feedback',
      confidence: 0.9
    }
  }
  
  // Default to unknown
  return {
    action: 'unknown',
    confidence: 0.0
  }
}

/**
 * Execute custom intent actions
 */
export async function executeCustomIntent(intent: Intent, sender: any, conversation: any) {
  switch (intent.action) {
    case 'view_promotions':
      return {
        type: 'text',
        text: {
          body: `🎉 *Current Promotions*\n\n` +
                `• 20% off all hair services on Tuesdays\n` +
                `• Buy 3 facials, get 1 free\n` +
                `• Refer a friend and get AED 50 credit\n\n` +
                `Valid until end of month. T&C apply.`
        }
      }
      
    case 'get_location':
      return {
        type: 'location',
        location: {
          latitude: 25.2048,
          longitude: 55.2708,
          name: 'Glamour Salon',
          address: 'Dubai Mall, Level 2, Dubai, UAE'
        }
      }
      
    case 'get_hours':
      return {
        type: 'text',
        text: {
          body: `🕐 *Operating Hours*\n\n` +
                `Monday - Thursday: 10 AM - 9 PM\n` +
                `Friday - Saturday: 10 AM - 10 PM\n` +
                `Sunday: 11 AM - 8 PM\n\n` +
                `_Last appointment 1 hour before closing_`
        }
      }
      
    case 'view_reviews':
      return {
        type: 'text',
        text: {
          body: `⭐ *Customer Reviews*\n\n` +
                `Rating: 4.8/5 (324 reviews)\n\n` +
                `"Best salon in Dubai!" - Sarah M.\n` +
                `"Amazing service, highly recommended" - Fatima A.\n\n` +
                `See more reviews on Google Maps`
        }
      }
      
    case 'gift_cards':
      return {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: '🎁 Gift cards available from AED 100 to AED 1000. Perfect for any occasion!'
          },
          action: {
            buttons: [
              { type: 'reply', reply: { id: 'gift_100', title: 'AED 100' }},
              { type: 'reply', reply: { id: 'gift_250', title: 'AED 250' }},
              { type: 'reply', reply: { id: 'gift_500', title: 'AED 500' }}
            ]
          }
        }
      }
      
    case 'urgent_request':
      return {
        type: 'text',
        text: {
          body: `🚨 For urgent matters, please call us directly at:\n` +
                `☎️ +971 4 123 4567\n\n` +
                `We're here to help!`
        }
      }
      
    default:
      return {
        type: 'text',
        text: {
          body: 'I understand you need help with that. Let me connect you with our team.'
        }
      }
  }
}

/**
 * Multi-language intent recognition
 */
export function parseMultilingualIntent(text: string): { language: string; intent: Intent } {
  // Arabic keywords
  const arabicKeywords = {
    'حجز': 'book_appointment',
    'موعد': 'book_appointment',
    'خدمات': 'view_services',
    'سعر': 'view_services',
    'إلغاء': 'cancel_appointment'
  }
  
  // Hindi keywords
  const hindiKeywords = {
    'बुकिंग': 'book_appointment',
    'अपॉइंटमेंट': 'book_appointment',
    'सेवाएं': 'view_services',
    'कीमत': 'view_services',
    'रद्द': 'cancel_appointment'
  }
  
  // Check for Arabic
  for (const [keyword, action] of Object.entries(arabicKeywords)) {
    if (text.includes(keyword)) {
      return {
        language: 'ar',
        intent: { action, confidence: 0.9 }
      }
    }
  }
  
  // Check for Hindi
  for (const [keyword, action] of Object.entries(hindiKeywords)) {
    if (text.includes(keyword)) {
      return {
        language: 'hi',
        intent: { action, confidence: 0.9 }
      }
    }
  }
  
  // Default to English
  return {
    language: 'en',
    intent: { action: 'unknown', confidence: 0.0 }
  }
}