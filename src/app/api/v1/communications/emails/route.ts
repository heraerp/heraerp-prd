import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Initialize Supabase client conditionally
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(url, key)
}

const querySchema = z.object({
  organizationId: z.string(),
  folder: z.enum(['inbox', 'outbox', 'drafts', 'sent', 'trash']).optional().default('inbox'),
  search: z.string().optional(),
  dateRange: z.string().optional(),
  priority: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  limit: z
    .string()
    .transform(val => parseInt(val))
    .optional()
    .default('50'),
  offset: z
    .string()
    .transform(val => parseInt(val))
    .optional()
    .default('0')
})

export async function GET(req: NextRequest) {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const params = querySchema.parse(searchParams)

    const supabase = getSupabaseClient()

    // Build query
    let query = supabase
      .from('universal_transactions')
      .select(
        `
        *,
        universal_transaction_lines (
          line_type,
          description,
          metadata
        ),
        core_dynamic_data!entity_id (
          field_name,
          field_value_text
        )
      `
      )
      .eq('organization_id', params.organizationId)
      .eq('smart_code', 'HERA.COMMS.EMAIL.SEND.V1')
      .order('transaction_date', { ascending: false })
      .limit(params.limit)
      .range(params.offset, params.offset + params.limit - 1)

    // Apply folder filter
    switch (params.folder) {
      case 'inbox':
        // Emails where user is in TO field
        // This requires joining with transaction lines
        break
      case 'sent':
        query = query.in('status', ['sent', 'delivered', 'opened', 'clicked'])
        break
      case 'drafts':
        query = query.eq('status', 'draft')
        break
      case 'trash':
        query = query.eq('status', 'deleted')
        break
      case 'outbox':
        query = query.eq('status', 'queued')
        break
    }

    // Apply search filter
    if (params.search) {
      query = query.or(
        `metadata->>subject.ilike.%${params.search}%,metadata->>from.ilike.%${params.search}%`
      )
    }

    // Execute query with proper error handling
    const { data, error, count } = await query

    if (error) {
      console.error('Email query error:', error)
      throw new Error(`Failed to query emails: ${error.message}`)
    }

    // Get email content from core_dynamic_data
    const transactionIds = data?.map(tx => tx.id) || []
    const { data: contentData, error: contentError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .in('entity_id', transactionIds)
      .eq('field_name', 'email_content')

    if (contentError && contentError.code !== 'PGRST116') {
      console.error('Email content query error:', contentError)
      // Don't throw, just log - content might not exist for all emails
    }

    // Transform data to email format
    const emails =
      data?.map(tx => {
        // Parse recipients from transaction lines
        const recipients = {
          to:
            tx.universal_transaction_lines
              ?.filter((line: any) => line.line_type === 'TO')
              .map((line: any) => line.metadata?.email || line.description) || [],
          cc:
            tx.universal_transaction_lines
              ?.filter((line: any) => line.line_type === 'CC')
              .map((line: any) => line.metadata?.email || line.description) || [],
          bcc:
            tx.universal_transaction_lines
              ?.filter((line: any) => line.line_type === 'BCC')
              .map((line: any) => line.metadata?.email || line.description) || []
        }

        // Get email content with safe parsing
        const content = contentData?.find(c => c.entity_id === tx.id)
        let emailContent: any = {}
        if (content?.field_value_text) {
          try {
            emailContent = JSON.parse(content.field_value_text)
          } catch (parseError) {
            console.error('Failed to parse email content:', parseError)
            emailContent = {}
          }
        }

        return {
          id: tx.id,
          from: tx.metadata?.from || '',
          to: recipients.to,
          cc: recipients.cc,
          bcc: recipients.bcc,
          subject: emailContent.subject || tx.metadata?.subject || '',
          body_html: emailContent.html || '',
          body_text: emailContent.text || '',
          status: tx.status,
          priority: emailContent.priority || 'normal',
          tags: emailContent.tags || [],
          sent_at: tx.metadata?.sent_at || tx.transaction_date,
          delivered_at: tx.metadata?.delivered_at,
          opened_at: tx.metadata?.opened_at,
          clicked_at: tx.metadata?.clicked_at,
          message_id: tx.metadata?.message_id,
          has_attachments:
            tx.universal_transaction_lines?.some((line: any) => line.line_type === 'ATTACHMENT') ||
            false,
          folder: params.folder
        }
      }) || []

    return NextResponse.json({
      emails,
      total: count || 0,
      limit: params.limit,
      offset: params.offset
    })
  } catch (error: any) {
    console.error('Email list error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch emails' }, { status: 500 })
  }
}

// Get single email by ID
export async function POST(req: NextRequest) {
  try {
    const { emailId } = await req.json()

    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Fetch email transaction with all related data
    const { data: tx, error } = await supabase
      .from('universal_transactions')
      .select(
        `
        *,
        universal_transaction_lines (
          line_type,
          description,
          metadata
        )
      `
      )
      .eq('id', emailId)
      .single()

    if (error) throw error

    // Get email content
    const { data: contentData, error: contentError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', emailId)
      .eq('field_name', 'email_content')
      .single()

    if (contentError && contentError.code !== 'PGRST116') throw contentError

    // Parse recipients
    const recipients = {
      to:
        tx.universal_transaction_lines
          ?.filter((line: any) => line.line_type === 'TO')
          .map((line: any) => line.metadata?.email || line.description) || [],
      cc:
        tx.universal_transaction_lines
          ?.filter((line: any) => line.line_type === 'CC')
          .map((line: any) => line.metadata?.email || line.description) || [],
      bcc:
        tx.universal_transaction_lines
          ?.filter((line: any) => line.line_type === 'BCC')
          .map((line: any) => line.metadata?.email || line.description) || []
    }

    // Parse attachments
    const attachments =
      tx.universal_transaction_lines
        ?.filter((line: any) => line.line_type === 'ATTACHMENT')
        .map((line: any) => ({
          filename: line.description,
          type: line.metadata?.type,
          size: line.metadata?.size
        })) || []

    let emailContent: any = {}
    if (contentData?.field_value_text) {
      try {
        emailContent = JSON.parse(contentData.field_value_text)
      } catch (parseError) {
        console.error('Failed to parse email content:', parseError)
        emailContent = {}
      }
    }

    const email = {
      id: tx.id,
      from: tx.metadata?.from || '',
      to: recipients.to,
      cc: recipients.cc,
      bcc: recipients.bcc,
      subject: emailContent.subject || tx.metadata?.subject || '',
      body_html: emailContent.html || '',
      body_text: emailContent.text || '',
      status: tx.status,
      priority: emailContent.priority || 'normal',
      tags: emailContent.tags || [],
      attachments,
      sent_at: tx.metadata?.sent_at || tx.transaction_date,
      delivered_at: tx.metadata?.delivered_at,
      opened_at: tx.metadata?.opened_at,
      clicked_at: tx.metadata?.clicked_at,
      message_id: tx.metadata?.message_id,
      clicked_links: tx.metadata?.clicked_links || []
    }

    return NextResponse.json(email)
  } catch (error: any) {
    console.error('Get email error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch email' }, { status: 500 })
  }
}
