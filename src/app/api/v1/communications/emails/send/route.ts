import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// Initialize Resend conditionally
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('Resend API key missing')
  }
  return new Resend(apiKey)
}

// Initialize Supabase client conditionally
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(url, key)
}

const schema = z.object({
  organizationId: z.string(),
  from: z.string().email(),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional().default([]),
  bcc: z.array(z.string().email()).optional().default([]),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(), // base64
        type: z.string().optional()
      })
    )
    .optional()
    .default([]),
  templateId: z.string().nullable().optional(),
  context: z.record(z.any()).optional().default({})
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = schema.parse(body)

    const supabase = getSupabaseClient()
    const resend = getResendClient()

    // 1) Create universal_transactions header with status=queued
    const { data: tx, error: txError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: input.organizationId,
        transaction_type: 'email_communication',
        transaction_code: `EMAIL-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        currency: 'USD',
        status: 'queued',
        smart_code: 'HERA.COMMS.EMAIL.SEND.V1',
        metadata: {
          provider: 'resend',
          from: input.from,
          subject: input.subject
        }
      })
      .select()
      .single()

    if (txError) throw new Error(`Failed to create transaction: ${txError.message}`)

    // 2) Create lines for recipients + attachments
    const lines = [
      ...input.to.map((email, idx) => ({
        transaction_id: tx.id,
        line_number: idx + 1,
        line_type: 'TO',
        description: email,
        quantity: 1,
        unit_price: 0,
        line_amount: 0,
        currency: 'USD',
        smart_code: 'HERA.COMMS.EMAIL.RECIPIENT.TO.V1',
        metadata: { email }
      })),
      ...input.cc.map((email, idx) => ({
        transaction_id: tx.id,
        line_number: input.to.length + idx + 1,
        line_type: 'CC',
        description: email,
        quantity: 1,
        unit_price: 0,
        line_amount: 0,
        currency: 'USD',
        smart_code: 'HERA.COMMS.EMAIL.RECIPIENT.CC.V1',
        metadata: { email }
      })),
      ...input.bcc.map((email, idx) => ({
        transaction_id: tx.id,
        line_number: input.to.length + input.cc.length + idx + 1,
        line_type: 'BCC',
        description: email,
        quantity: 1,
        unit_price: 0,
        line_amount: 0,
        currency: 'USD',
        smart_code: 'HERA.COMMS.EMAIL.RECIPIENT.BCC.V1',
        metadata: { email }
      })),
      ...input.attachments.map((a, idx) => ({
        transaction_id: tx.id,
        line_number: input.to.length + input.cc.length + input.bcc.length + idx + 1,
        line_type: 'ATTACHMENT',
        description: a.filename,
        quantity: 1,
        unit_price: 0,
        line_amount: 0,
        currency: 'USD',
        smart_code: 'HERA.COMMS.EMAIL.ATTACHMENT.V1',
        metadata: { type: a.type, size: a.content.length, filename: a.filename }
      }))
    ]

    if (lines.length > 0) {
      const { error: linesError } = await supabase.from('universal_transaction_lines').insert(lines)

      if (linesError) throw new Error(`Failed to create transaction lines: ${linesError.message}`)
    }

    // 3) Persist dynamic data (subject/body/tags/template/context)
    const { error: dynamicError } = await supabase.from('core_dynamic_data').insert({
      organization_id: input.organizationId,
      entity_id: tx.id, // link by tx id
      field_name: 'email_content',
      field_type: 'json',
      field_value_text: JSON.stringify({
        subject: input.subject,
        html: input.html,
        text: input.text,
        tags: input.tags,
        template_id: input.templateId,
        context: input.context
      }),
      smart_code: 'HERA.COMMS.EMAIL.CONTENT.V1'
    })

    if (dynamicError) throw new Error(`Failed to store email content: ${dynamicError.message}`)

    // 4) Call Resend
    try {
      const result = await resend.emails.send({
        from: input.from,
        to: input.to,
        cc: input.cc,
        bcc: input.bcc,
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: input.attachments?.map(a => ({
          filename: a.filename,
          content: Buffer.from(a.content, 'base64')
        })),
        tags: input.tags?.map(t => ({ name: 'tag', value: t }))
      })

      // 5) Update tx with message id + status=sent (Resend accepted)
      const { error: updateError } = await supabase
        .from('universal_transactions')
        .update({
          status: 'sent',
          metadata: {
            ...tx.metadata,
            message_id: result.id,
            sent_at: new Date().toISOString()
          }
        })
        .eq('id', tx.id)

      if (updateError) throw new Error(`Failed to update transaction: ${updateError.message}`)

      return NextResponse.json({
        transactionId: tx.id,
        resendMessageId: result.id,
        status: 'sent'
      })
    } catch (resendError: any) {
      // Update status to failed if Resend fails
      await supabase
        .from('universal_transactions')
        .update({
          status: 'failed',
          metadata: {
            ...tx.metadata,
            error: resendError.message,
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', tx.id)

      throw new Error(`Resend error: ${resendError.message}`)
    }
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 })
  }
}
