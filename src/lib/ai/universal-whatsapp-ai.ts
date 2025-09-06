/**
 * Universal WhatsApp AI Service
 * Provides multi-provider AI with automatic fallback
 * Primary: Claude, Fallback: OpenAI
 */

import { ClaudeWhatsAppService, ClaudeIntent, ClaudeTemplateDecision } from './claude-whatsapp-service'
import OpenAI from 'openai'

export interface AIProvider {
  name: 'claude' | 'openai' | 'gemini'
  available: boolean
  priority: number
}

export class UniversalWhatsAppAI {
  private claudeService: ClaudeWhatsAppService | null = null
  private openaiClient: OpenAI | null = null
  private organizationId: string
  private providers: AIProvider[] = []

  constructor(organizationId: string) {
    this.organizationId = organizationId
    this.initializeProviders()
  }

  private initializeProviders() {
    // Initialize Claude if API key exists
    if (process.env.CLAUDE_API_KEY) {
      this.claudeService = new ClaudeWhatsAppService(
        this.organizationId,
        process.env.CLAUDE_API_KEY
      )
      this.providers.push({
        name: 'claude',
        available: true,
        priority: 1
      })
    }

    // Initialize OpenAI if API key exists
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
      this.providers.push({
        name: 'openai',
        available: true,
        priority: 2
      })
    }

    // Sort providers by priority
    this.providers.sort((a, b) => a.priority - b.priority)
    
    console.log('🤖 AI Providers initialized:', this.providers.map(p => p.name))
  }

  /**
   * Extract intent with automatic fallback
   */
  async extractIntent(message: string, context?: any): Promise<ClaudeIntent> {
    // Try Claude first
    if (this.claudeService) {
      try {
        console.log('🧠 Attempting intent extraction with Claude...')
        const result = await this.claudeService.extractIntent(message, context)
        console.log('✅ Claude intent extraction successful')
        return result
      } catch (error) {
        console.error('❌ Claude intent extraction failed:', error)
        // Continue to fallback
      }
    }

    // Fallback to OpenAI
    if (this.openaiClient) {
      try {
        console.log('🧠 Attempting intent extraction with OpenAI...')
        return await this.extractIntentWithOpenAI(message, context)
      } catch (error) {
        console.error('❌ OpenAI intent extraction failed:', error)
      }
    }

    // Final fallback: rule-based extraction
    console.log('⚠️ All AI providers failed, using rule-based extraction')
    return this.ruleBasedIntentExtraction(message, context)
  }

  /**
   * OpenAI implementation of intent extraction
   */
  private async extractIntentWithOpenAI(message: string, context?: any): Promise<ClaudeIntent> {
    const systemPrompt = `You are an AI assistant for a salon/spa booking system. 
    Extract the intent and entities from customer messages.
    
    Possible intents:
    - book_appointment: Customer wants to book a service
    - cancel_appointment: Customer wants to cancel
    - reschedule_appointment: Customer wants to change timing
    - check_availability: Customer asking about available times
    - general_inquiry: Other questions
    
    Extract entities like:
    - services: hair_color, cut, blow_dry, manicure, pedicure, etc.
    - date_hint: today, tomorrow, this_week, specific dates
    - time_hint: morning, afternoon, specific times
    - preferred_stylist: stylist name if mentioned
    
    Respond in JSON format only.`

    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract intent and entities from: "${message}"` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    // Transform to ClaudeIntent format
    return {
      intent: result.intent || 'general_inquiry',
      entities: result.entities || {},
      confidence: result.confidence || 0.7,
      next_action: this.determineNextAction(result.intent, result.entities)
    }
  }

  /**
   * Select template with fallback
   */
  async selectTemplate(intent: ClaudeIntent, context: any): Promise<ClaudeTemplateDecision> {
    // Try Claude first
    if (this.claudeService) {
      try {
        return await this.claudeService.selectTemplate(intent, context)
      } catch (error) {
        console.error('❌ Claude template selection failed:', error)
      }
    }

    // Fallback to OpenAI
    if (this.openaiClient) {
      try {
        return await this.selectTemplateWithOpenAI(intent, context)
      } catch (error) {
        console.error('❌ OpenAI template selection failed:', error)
      }
    }

    // Final fallback
    return this.defaultTemplateSelection(intent, context)
  }

  /**
   * OpenAI implementation of template selection
   */
  private async selectTemplateWithOpenAI(
    intent: ClaudeIntent, 
    context: any
  ): Promise<ClaudeTemplateDecision> {
    const systemPrompt = `You are selecting the best WhatsApp template for a customer.
    Available templates:
    - APPOINTMENT_CONFIRM_v1: For confirmed appointments
    - BOOKING_PROMPT_v1: To prompt booking
    - APPOINTMENT_REMINDER_24H_v1: 24h reminders
    - WINBACK_30D_v1: Win back inactive customers
    - GENERAL_RESPONSE_v1: General utility
    
    Consider the intent, context, and WhatsApp's 24-hour window policy.
    Respond in JSON format with template_id, category, variables, and optional buttons.`

    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Intent: ${JSON.stringify(intent)}\nContext: ${JSON.stringify(context)}` 
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }

  /**
   * Craft response message with fallback
   */
  async craftResponse(
    slots: any[], 
    intent: ClaudeIntent,
    preferredProvider?: 'claude' | 'openai'
  ): Promise<string> {
    // Use preferred provider if specified
    if (preferredProvider === 'openai' && this.openaiClient) {
      return await this.craftResponseWithOpenAI(slots, intent)
    }

    // Try Claude first
    if (this.claudeService) {
      try {
        return this.claudeService.craftLowestTurnMessage(slots, intent)
      } catch (error) {
        console.error('❌ Claude response generation failed:', error)
      }
    }

    // Fallback to OpenAI
    if (this.openaiClient) {
      try {
        return await this.craftResponseWithOpenAI(slots, intent)
      } catch (error) {
        console.error('❌ OpenAI response generation failed:', error)
      }
    }

    // Final fallback
    return this.defaultResponseGeneration(slots, intent)
  }

  /**
   * OpenAI implementation of response crafting
   */
  private async craftResponseWithOpenAI(slots: any[], intent: ClaudeIntent): Promise<string> {
    const systemPrompt = `You are a friendly salon booking assistant. 
    Create concise WhatsApp messages that:
    1. Acknowledge the customer's request
    2. Provide specific options when available
    3. Ask for missing information if needed
    4. Keep messages under 160 characters when possible
    5. Use emojis sparingly for friendliness
    
    The goal is to complete bookings in minimal messages.`

    const userPrompt = `Customer intent: ${intent.intent}
    Entities: ${JSON.stringify(intent.entities)}
    Available slots: ${slots.length > 0 ? `${slots.length} slots available` : 'No slots found'}
    
    Generate an appropriate response message.`

    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 200
    })

    return response.choices[0].message.content || this.defaultResponseGeneration(slots, intent)
  }

  /**
   * Determine next action based on intent and entities
   */
  private determineNextAction(intent: string, entities: any) {
    if (intent === 'book_appointment') {
      if (!entities.services) {
        return {
          type: 'ask_service',
          question: 'What service would you like to book?',
          needs_window_open: true
        }
      }
      if (!entities.date_hint && !entities.time_hint) {
        return {
          type: 'ask_datetime',
          question: 'When would you like to come in?',
          needs_window_open: true
        }
      }
      return {
        type: 'show_slots',
        question: 'Let me check availability for you.',
        needs_window_open: true
      }
    }

    return {
      type: 'show_options',
      question: 'How can I help you today?',
      needs_window_open: true
    }
  }

  /**
   * Rule-based intent extraction (fallback)
   */
  private ruleBasedIntentExtraction(message: string, context?: any): ClaudeIntent {
    const lowerMessage = message.toLowerCase()
    
    // Simple keyword matching
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
      return {
        intent: 'book_appointment',
        entities: {},
        confidence: 0.6,
        next_action: {
          type: 'ask_service',
          question: 'What service would you like to book?',
          needs_window_open: true
        }
      }
    }

    if (lowerMessage.includes('cancel')) {
      return {
        intent: 'cancel_appointment',
        entities: {},
        confidence: 0.7,
        next_action: {
          type: 'ask_booking_id',
          question: 'Please provide your booking ID.',
          needs_window_open: true
        }
      }
    }

    return {
      intent: 'general_inquiry',
      entities: {},
      confidence: 0.5,
      next_action: {
        type: 'show_options',
        question: 'How can I help you today?',
        needs_window_open: true
      }
    }
  }

  /**
   * Default template selection (fallback)
   */
  private defaultTemplateSelection(intent: ClaudeIntent, context: any): ClaudeTemplateDecision {
    return {
      template_id: 'GENERAL_RESPONSE_v1',
      category: 'utility',
      variables: {
        name: context.customer_name || 'there',
        salon_name: 'Hair Talkz',
        booking_link: 'https://heraerp.com/book'
      },
      buttons: ['Book Now']
    }
  }

  /**
   * Default response generation (fallback)
   */
  private defaultResponseGeneration(slots: any[], intent: ClaudeIntent): string {
    if (intent.intent === 'book_appointment') {
      if (slots.length > 0) {
        return "I found available slots for you. Would you like to see the times?"
      }
      return "I'd be happy to help you book an appointment. What service are you looking for?"
    }

    return "Hi! I'm here to help with your salon appointments. Would you like to book a service?"
  }

  /**
   * Get current AI provider status
   */
  getProviderStatus(): AIProvider[] {
    return this.providers
  }

  /**
   * Test AI providers
   */
  async testProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    // Test Claude
    if (this.claudeService) {
      try {
        await this.claudeService.extractIntent('test message')
        results.claude = true
      } catch {
        results.claude = false
      }
    }

    // Test OpenAI
    if (this.openaiClient) {
      try {
        await this.openaiClient.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
        results.openai = true
      } catch {
        results.openai = false
      }
    }

    return results
  }
}

// Export singleton factory
export function createUniversalWhatsAppAI(organizationId: string): UniversalWhatsAppAI {
  return new UniversalWhatsAppAI(organizationId)
}