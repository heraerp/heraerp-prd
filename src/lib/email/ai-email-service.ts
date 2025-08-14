import { universalApi } from '@/lib/universal-api'

interface AIEmailRequest {
  prompt: string
  context?: {
    recipientName?: string
    recipientCompany?: string
    senderName?: string
    senderCompany?: string
    previousEmails?: string[]
    businessContext?: string
    tone?: 'professional' | 'friendly' | 'formal' | 'casual'
    length?: 'short' | 'medium' | 'long'
    purpose?: 'follow_up' | 'introduction' | 'proposal' | 'thank_you' | 'reminder' | 'apology' | 'announcement'
  }
  templateId?: string
  organizationId: string
}

interface AIEmailResponse {
  success: boolean
  data?: {
    subject: string
    body_html: string
    body_text: string
    suggestions?: string[]
    confidence_score?: number
  }
  error?: string
}

interface AIEmailTemplate {
  id: string
  name: string
  purpose: string
  template: string
  variables: string[]
  tone: string
}

/**
 * AI-powered Email Service using HERA Universal AI System
 */
export class AIEmailService {
  private organizationId: string
  
  constructor(organizationId: string) {
    this.organizationId = organizationId
    universalApi.setOrganizationId(organizationId)
  }

  /**
   * Generate email content using AI
   */
  async generateEmailContent(request: AIEmailRequest): Promise<AIEmailResponse> {
    try {
      // Use HERA Universal AI API
      const aiResponse = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'custom_request',
          smart_code: 'HERA.EMAIL.AI.COMPOSE.v1',
          task_type: 'email_composition',
          prompt: this.buildEmailPrompt(request),
          temperature: 0.7,
          max_tokens: 1000,
          fallback_enabled: true,
          context: {
            organization_id: this.organizationId,
            email_context: request.context
          }
        })
      })

      if (!aiResponse.ok) {
        throw new Error('Failed to generate email content')
      }

      const result = await aiResponse.json()
      
      // Parse AI response and structure email content
      const emailContent = this.parseAIResponse(result.data.content)
      
      // Store generated content for learning
      await this.saveGeneratedContent(request, emailContent)
      
      return {
        success: true,
        data: {
          subject: emailContent.subject,
          body_html: emailContent.body_html,
          body_text: emailContent.body_text,
          suggestions: emailContent.suggestions,
          confidence_score: result.data.confidence_score || 0.85
        }
      }
    } catch (error) {
      console.error('AI Email Generation Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate email'
      }
    }
  }

  /**
   * Generate smart reply suggestions
   */
  async generateSmartReply(emailContent: string, context?: any): Promise<string[]> {
    try {
      const aiResponse = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'custom_request',
          smart_code: 'HERA.EMAIL.AI.REPLY.v1',
          task_type: 'email_reply',
          prompt: `Generate 3 professional reply suggestions for this email:\n\n${emailContent}`,
          temperature: 0.6,
          max_tokens: 500,
          context: {
            organization_id: this.organizationId,
            reply_context: context
          }
        })
      })

      const result = await aiResponse.json()
      return this.parseReplySuggestions(result.data.content)
    } catch (error) {
      console.error('Smart Reply Generation Error:', error)
      return [
        'Thank you for your email. I will review this and get back to you soon.',
        'I appreciate you reaching out. Let me look into this and respond shortly.',
        'Thanks for the information. I\'ll follow up with next steps.'
      ]
    }
  }

  /**
   * Improve existing email content
   */
  async improveEmail(content: string, improvements: string[]): Promise<AIEmailResponse> {
    try {
      const improvementPrompt = `
        Improve this email based on these suggestions: ${improvements.join(', ')}
        
        Original email:
        ${content}
        
        Please provide an improved version that addresses the suggestions while maintaining the original intent.
      `

      const aiResponse = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'custom_request',
          smart_code: 'HERA.EMAIL.AI.IMPROVE.v1',
          task_type: 'email_improvement',
          prompt: improvementPrompt,
          temperature: 0.5,
          max_tokens: 800,
          context: {
            organization_id: this.organizationId
          }
        })
      })

      const result = await aiResponse.json()
      const improvedContent = this.parseAIResponse(result.data.content)

      return {
        success: true,
        data: improvedContent
      }
    } catch (error) {
      console.error('Email Improvement Error:', error)
      return {
        success: false,
        error: 'Failed to improve email content'
      }
    }
  }

  /**
   * Analyze email sentiment and tone
   */
  async analyzeEmailTone(content: string): Promise<{
    tone: string
    sentiment: 'positive' | 'neutral' | 'negative'
    suggestions: string[]
    professionalism_score: number
  }> {
    try {
      const aiResponse = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'custom_request',
          smart_code: 'HERA.EMAIL.AI.ANALYZE.v1',
          task_type: 'email_analysis',
          prompt: `Analyze the tone, sentiment, and professionalism of this email and provide suggestions for improvement:\n\n${content}`,
          temperature: 0.3,
          max_tokens: 400,
          context: {
            organization_id: this.organizationId
          }
        })
      })

      const result = await aiResponse.json()
      return this.parseToneAnalysis(result.data.content)
    } catch (error) {
      console.error('Email Tone Analysis Error:', error)
      return {
        tone: 'neutral',
        sentiment: 'neutral',
        suggestions: ['Consider adding a warm greeting', 'End with a clear call-to-action'],
        professionalism_score: 7.0
      }
    }
  }

  /**
   * Generate email templates using AI
   */
  async generateTemplate(purpose: string, industry?: string): Promise<AIEmailTemplate> {
    try {
      const templatePrompt = `
        Create a professional email template for: ${purpose}
        ${industry ? `Industry context: ${industry}` : ''}
        
        Include:
        - Subject line with variables
        - Email body with personalization variables
        - Professional tone appropriate for business communication
        - Clear structure and call-to-action
      `

      const aiResponse = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'custom_request',
          smart_code: 'HERA.EMAIL.AI.TEMPLATE.v1',
          task_type: 'template_generation',
          prompt: templatePrompt,
          temperature: 0.6,
          max_tokens: 600,
          context: {
            organization_id: this.organizationId,
            purpose,
            industry
          }
        })
      })

      const result = await aiResponse.json()
      
      // Create template entity
      const templateEntity = {
        entity_type: 'email_template' as const,
        entity_name: `AI Generated: ${purpose}`,
        entity_code: `TEMPLATE-AI-${Date.now()}`,
        organization_id: this.organizationId,
        status: 'active' as const,
        metadata: {
          generated_by: 'ai',
          purpose,
          industry,
          created_at: new Date().toISOString()
        }
      }

      const createdTemplate = await universalApi.createEntity(templateEntity)
      
      // Parse and store template content
      const templateContent = this.parseTemplateContent(result.data.content)
      
      await universalApi.setDynamicField(createdTemplate.id, 'subject', templateContent.subject)
      await universalApi.setDynamicField(createdTemplate.id, 'body_html', templateContent.body)
      await universalApi.setDynamicField(createdTemplate.id, 'variables', JSON.stringify(templateContent.variables))
      await universalApi.setDynamicField(createdTemplate.id, 'tone', templateContent.tone)

      return {
        id: createdTemplate.id,
        name: templateEntity.entity_name,
        purpose,
        template: templateContent.body,
        variables: templateContent.variables,
        tone: templateContent.tone
      }
    } catch (error) {
      console.error('Template Generation Error:', error)
      throw new Error('Failed to generate email template')
    }
  }

  /**
   * Build comprehensive AI prompt for email generation
   */
  private buildEmailPrompt(request: AIEmailRequest): string {
    const { prompt, context } = request
    
    let fullPrompt = `Generate a professional business email with the following requirements:\n\n`
    fullPrompt += `Main request: ${prompt}\n\n`
    
    if (context) {
      if (context.recipientName) fullPrompt += `Recipient: ${context.recipientName}\n`
      if (context.recipientCompany) fullPrompt += `Company: ${context.recipientCompany}\n`
      if (context.senderName) fullPrompt += `From: ${context.senderName}\n`
      if (context.senderCompany) fullPrompt += `Sender Company: ${context.senderCompany}\n`
      if (context.tone) fullPrompt += `Tone: ${context.tone}\n`
      if (context.length) fullPrompt += `Length: ${context.length}\n`
      if (context.purpose) fullPrompt += `Purpose: ${context.purpose}\n`
      if (context.businessContext) fullPrompt += `Business Context: ${context.businessContext}\n`
      if (context.previousEmails?.length) {
        fullPrompt += `Previous conversation context:\n${context.previousEmails.join('\n---\n')}\n`
      }
    }
    
    fullPrompt += `\nPlease provide:
    1. A compelling subject line
    2. Professional email body in HTML format
    3. Plain text version
    4. 2-3 alternative subject line suggestions
    
    Format the response as JSON with keys: subject, body_html, body_text, suggestions`
    
    return fullPrompt
  }

  /**
   * Parse AI response into structured email content
   */
  private parseAIResponse(content: string): {
    subject: string
    body_html: string
    body_text: string
    suggestions: string[]
  } {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content)
      return {
        subject: parsed.subject || 'Generated Email',
        body_html: parsed.body_html || this.convertToHTML(parsed.body || content),
        body_text: parsed.body_text || this.stripHTML(parsed.body_html || content),
        suggestions: parsed.suggestions || []
      }
    } catch {
      // Fallback to text parsing
      const lines = content.split('\n')
      const subject = lines.find(line => line.toLowerCase().includes('subject:'))?.replace(/subject:/i, '').trim() || 'Generated Email'
      
      return {
        subject,
        body_html: this.convertToHTML(content),
        body_text: this.stripHTML(content),
        suggestions: []
      }
    }
  }

  /**
   * Parse smart reply suggestions from AI response
   */
  private parseReplySuggestions(content: string): string[] {
    try {
      const lines = content.split('\n').filter(line => line.trim())
      return lines.slice(0, 3).map(line => line.replace(/^\d+\.?\s*/, '').trim())
    } catch {
      return [
        'Thank you for your email. I will review this and get back to you soon.',
        'I appreciate you reaching out. Let me look into this and respond shortly.',
        'Thanks for the information. I\'ll follow up with next steps.'
      ]
    }
  }

  /**
   * Parse tone analysis from AI response
   */
  private parseToneAnalysis(content: string): {
    tone: string
    sentiment: 'positive' | 'neutral' | 'negative'
    suggestions: string[]
    professionalism_score: number
  } {
    try {
      const parsed = JSON.parse(content)
      return {
        tone: parsed.tone || 'neutral',
        sentiment: parsed.sentiment || 'neutral',
        suggestions: parsed.suggestions || [],
        professionalism_score: parsed.professionalism_score || 7.0
      }
    } catch {
      return {
        tone: 'neutral',
        sentiment: 'neutral',
        suggestions: ['Consider adding a warm greeting', 'End with a clear call-to-action'],
        professionalism_score: 7.0
      }
    }
  }

  /**
   * Parse template content from AI response
   */
  private parseTemplateContent(content: string): {
    subject: string
    body: string
    variables: string[]
    tone: string
  } {
    const variableRegex = /\{\{([^}]+)\}\}/g
    const variables: string[] = []
    let match

    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }

    const lines = content.split('\n')
    const subjectLine = lines.find(line => line.toLowerCase().includes('subject:'))?.replace(/subject:/i, '').trim()

    return {
      subject: subjectLine || 'Template Subject',
      body: content,
      variables,
      tone: 'professional'
    }
  }

  /**
   * Convert plain text to HTML
   */
  private convertToHTML(text: string): string {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
  }

  /**
   * Strip HTML tags from text
   */
  private stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim()
  }

  /**
   * Save generated content for AI learning
   */
  private async saveGeneratedContent(request: AIEmailRequest, content: any): Promise<void> {
    try {
      // Store in universal_transactions for AI learning
      await universalApi.createTransaction({
        transaction_type: 'ai_email_generation',
        organization_id: this.organizationId,
        reference_number: `AI-EMAIL-${Date.now()}`,
        metadata: {
          prompt: request.prompt,
          context: request.context,
          generated_subject: content.subject,
          confidence_score: content.confidence_score || 0.85,
          ai_provider: 'universal_ai',
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Failed to save AI content for learning:', error)
    }
  }
}

/**
 * Factory function to create AI Email Service
 */
export function createAIEmailService(organizationId: string): AIEmailService {
  return new AIEmailService(organizationId)
}

/**
 * Email writing assistant with common use cases
 */
export const EmailWritingAssistant = {
  /**
   * Common email prompts for quick generation
   */
  quickPrompts: {
    follow_up: 'Write a professional follow-up email for a meeting we had last week',
    introduction: 'Write an introduction email to a potential business partner',
    thank_you: 'Write a thank you email for a successful project completion',
    reminder: 'Write a gentle reminder email about an upcoming deadline',
    apology: 'Write a professional apology email for a delayed response',
    announcement: 'Write an announcement email about a new product launch',
    proposal: 'Write a business proposal email for a new collaboration',
    invoice: 'Write an email to send an invoice to a client',
    meeting_request: 'Write an email requesting a meeting to discuss project details',
    status_update: 'Write a project status update email for stakeholders'
  },

  /**
   * Tone suggestions for different contexts
   */
  toneOptions: {
    professional: 'Formal, businesslike, and respectful',
    friendly: 'Warm, approachable, but still professional',
    formal: 'Very formal, suitable for executive communication',
    casual: 'Relaxed and conversational, for internal team communication'
  },

  /**
   * Email improvement suggestions
   */
  improvementTypes: [
    'Make it more concise',
    'Make it more friendly',
    'Make it more formal',
    'Add more details',
    'Improve clarity',
    'Add call-to-action',
    'Make it more persuasive',
    'Fix grammar and spelling'
  ]
}