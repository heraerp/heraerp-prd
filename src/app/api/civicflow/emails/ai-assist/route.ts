import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - AI assistance for emails
export async function POST(req: NextRequest) {
  try {
    const organizationId = req.headers.get('x-organization-id')
    const body = await req.json()

    const { emailId, task } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    if (!emailId || !task) {
      return NextResponse.json({ error: 'Email ID and task are required' }, { status: 400 })
    }

    // Validate task type
    const validTasks = ['summarize', 'classify', 'suggest', 'analyze', 'extract']
    if (!validTasks.includes(task)) {
      return NextResponse.json(
        { error: `Invalid task. Must be one of: ${validTasks.join(', ')}` },
        { status: 400 }
      )
    }

    // Get email data
    const { data: emailEntity, error: emailError } = await supabase
      .from('core_entities')
      .select(
        `
        id,
        entity_name,
        core_dynamic_data(
          field_name,
          field_value_text,
          field_value_json
        )
      `
      )
      .eq('id', emailId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'comm_message')
      .single()

    if (emailError || !emailEntity) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    // Extract email content
    const dynamicData = emailEntity.core_dynamic_data || []
    const getField = (fieldName: string) => {
      const field = dynamicData.find((d: any) => d.field_name === fieldName)
      return field?.field_value_text || field?.field_value_json
    }

    const emailContent = {
      subject: getField('subject') || emailEntity.entity_name,
      from: getField('from'),
      to: getField('to'),
      body_text: getField('body_text'),
      body_html: getField('body_html'),
      direction: getField('direction'),
      current_tags: getField('tags') || []
    }

    const startTime = Date.now()

    // Process AI task
    let result: any
    let confidence: number

    switch (task) {
      case 'summarize':
        result = await performSummarization(emailContent)
        confidence = 0.85
        break

      case 'classify':
        result = await performClassification(emailContent)
        confidence = 0.8
        break

      case 'suggest':
        result = await performReplyGeneration(emailContent)
        confidence = 0.75
        break

      case 'analyze':
        result = await performAnalysis(emailContent)
        confidence = 0.7
        break

      case 'extract':
        result = await performExtraction(emailContent)
        confidence = 0.85
        break

      default:
        throw new Error(`Unsupported task: ${task}`)
    }

    const processingTime = Date.now() - startTime

    // Log AI assistance transaction
    await supabase.from('universal_transactions').insert({
      organization_id: organizationId,
      transaction_type: 'ai_assistance',
      transaction_code: `AI-${task.toUpperCase()}-${Date.now()}`,
      smart_code: `HERA.PUBLICSECTOR.COMM.AI.${task.toUpperCase()}.V1`,
      reference_entity_id: emailId,
      total_amount: 0,
      metadata: {
        message_id: emailId,
        ai_task: task,
        confidence,
        processing_time: processingTime,
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      task,
      result,
      confidence,
      processing_time: processingTime
    })
  } catch (error: any) {
    console.error('Error performing AI assistance:', error)
    return NextResponse.json(
      { error: 'Failed to perform AI assistance', details: error.message },
      { status: 500 }
    )
  }
}

// AI Task Implementations (Mock - in production these would call Claude API)

async function performSummarization(emailContent: any) {
  // Mock summarization - in production would call Claude API
  const text = emailContent.body_text || emailContent.body_html || ''

  return {
    key_points: [
      'Main topic discussed in the email',
      'Important details mentioned',
      'Decisions or agreements made'
    ],
    action_items: [
      'Follow up on mentioned items',
      'Schedule next meeting',
      'Send required documents'
    ],
    sentiment: determineSentiment(text),
    urgency: determineUrgency(emailContent),
    entities: extractEntities(text)
  }
}

async function performClassification(emailContent: any) {
  const text = emailContent.body_text || emailContent.body_html || ''
  const subject = emailContent.subject || ''

  // Mock classification logic
  let priority = 'normal'
  let category = 'general'
  let suggestedTags = []

  if (text.toLowerCase().includes('urgent') || subject.toLowerCase().includes('urgent')) {
    priority = 'urgent'
    suggestedTags.push('urgent')
  }

  if (text.toLowerCase().includes('meeting') || subject.toLowerCase().includes('meeting')) {
    category = 'meeting'
    suggestedTags.push('meeting')
  }

  if (text.toLowerCase().includes('invoice') || subject.toLowerCase().includes('invoice')) {
    category = 'finance'
    suggestedTags.push('finance', 'invoice')
  }

  return {
    priority: priority as 'urgent' | 'normal' | 'low',
    category,
    tags: suggestedTags,
    confidence: 0.8,
    reasoning: `Classified based on keywords found in subject and body: ${suggestedTags.join(', ')}`
  }
}

async function performReplyGeneration(emailContent: any) {
  // Mock reply generation - in production would call Claude API
  const isInbound = emailContent.direction === 'in'

  if (!isInbound) {
    return {
      tone: 'professional',
      content:
        'This appears to be an outbound email. Reply generation works best with inbound messages.',
      confidence: 0.2,
      reasoning: 'Cannot generate meaningful reply for outbound emails'
    }
  }

  // Generate a professional reply
  const replyContent = `Thank you for your email regarding "${emailContent.subject}".

I have received your message and will review the details you provided. I'll get back to you within 24 hours with a comprehensive response.

If this is urgent, please feel free to call me directly.

Best regards`

  return {
    tone: 'professional' as const,
    content: replyContent,
    confidence: 0.75,
    reasoning:
      'Generated professional acknowledgment reply based on email content and standard business practices'
  }
}

async function performAnalysis(emailContent: any) {
  const text = emailContent.body_text || emailContent.body_html || ''

  return {
    word_count: text.split(' ').length,
    sentiment: determineSentiment(text),
    readability: 'medium',
    formality: 'professional',
    key_themes: ['business', 'communication'],
    language_detection: 'en',
    urgency_indicators: [],
    entities: extractEntities(text)
  }
}

async function performExtraction(emailContent: any) {
  const text = emailContent.body_text || emailContent.body_html || ''

  return {
    dates: extractDates(text),
    times: extractTimes(text),
    phone_numbers: extractPhoneNumbers(text),
    email_addresses: extractEmailAddresses(text),
    urls: extractUrls(text),
    amounts: extractAmounts(text),
    addresses: []
  }
}

// Helper functions for AI processing

function determineSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['thank', 'great', 'excellent', 'good', 'pleased', 'happy']
  const negativeWords = ['problem', 'issue', 'concern', 'disappointed', 'urgent', 'error']

  const words = text.toLowerCase().split(' ')
  const positiveCount = words.filter(word => positiveWords.includes(word)).length
  const negativeCount = words.filter(word => negativeWords.includes(word)).length

  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

function determineUrgency(emailContent: any): 'low' | 'medium' | 'high' {
  const text = (emailContent.body_text || '').toLowerCase()
  const subject = (emailContent.subject || '').toLowerCase()

  const urgentKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical']
  const mediumKeywords = ['soon', 'today', 'deadline', 'important']

  if (urgentKeywords.some(keyword => text.includes(keyword) || subject.includes(keyword))) {
    return 'high'
  }

  if (mediumKeywords.some(keyword => text.includes(keyword) || subject.includes(keyword))) {
    return 'medium'
  }

  return 'low'
}

function extractEntities(text: string): string[] {
  // Simple entity extraction - in production would use NLP
  const entities = []

  // Extract capitalized words (potential proper nouns)
  const words = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
  entities.push(...words.slice(0, 5)) // Limit to 5 entities

  return [...new Set(entities)] // Remove duplicates
}

function extractDates(text: string): string[] {
  const dateRegex =
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{1,2}-\d{1,2}-\d{4}\b|\b[A-Za-z]+ \d{1,2}, \d{4}\b/g
  return text.match(dateRegex) || []
}

function extractTimes(text: string): string[] {
  const timeRegex = /\b\d{1,2}:\d{2}(?:\s*[APap][Mm])?\b/g
  return text.match(timeRegex) || []
}

function extractPhoneNumbers(text: string): string[] {
  const phoneRegex = /\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s*\d{3}-\d{4}\b|\b\d{10}\b/g
  return text.match(phoneRegex) || []
}

function extractEmailAddresses(text: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  return text.match(emailRegex) || []
}

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+/g
  return text.match(urlRegex) || []
}

function extractAmounts(text: string): string[] {
  const amountRegex =
    /\$\d+(?:,\d{3})*(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|€|euros?)\b/g
  return text.match(amountRegex) || []
}
