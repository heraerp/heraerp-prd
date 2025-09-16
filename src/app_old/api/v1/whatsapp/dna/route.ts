/**
 * HERA DNA WhatsApp API Endpoint
 * Universal WhatsApp messaging API using DNA architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppDNA } from '@/lib/dna/whatsapp/whatsapp-dna'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, organizationId, ...payload } = body

    // Initialize WhatsApp DNA
    const whatsappDNA = new WhatsAppDNA({
      organizationId,
      businessId: process.env.WHATSAPP_BUSINESS_ID!,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!
    })

    switch (action) {
      case 'setup_integration':
        const setupResult = await whatsappDNA.setupWhatsAppIntegration()
        return NextResponse.json({ success: true, data: setupResult })

      case 'send_message':
        const { to, type, content } = payload
        const sendResult = await whatsappDNA.sendMessage({
          from: whatsappDNA.whatsappConfig.phoneNumberId,
          to,
          type,
          content
        })
        return NextResponse.json({ success: true, data: sendResult })

      case 'send_template':
        const { to: templateTo, templateName, language, parameters } = payload
        const templateResult = await whatsappDNA.sendTemplateMessage(
          templateTo,
          templateName,
          language,
          parameters
        )
        return NextResponse.json({ success: true, data: templateResult })

      case 'create_template':
        const templateData = payload.template
        const createResult = await whatsappDNA.createTemplate(templateData)
        return NextResponse.json({ success: true, data: createResult })

      case 'create_automation':
        const automationConfig = payload.automation
        const automationResult = await whatsappDNA.createAutomation(automationConfig)
        return NextResponse.json({ success: true, data: automationResult })

      case 'get_conversations':
        // Get conversations from HERA universal API
        const conversations = await whatsappDNA.getConversationStats({
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        })
        return NextResponse.json({ success: true, data: conversations })

      case 'setup_salon_templates':
        await whatsappDNA.setupSalonTemplates()
        return NextResponse.json({ success: true, message: 'Salon templates created' })

      case 'send_salon_reminder':
        const { appointmentId } = payload
        const reminderResult = await whatsappDNA.sendSalonBookingReminder(appointmentId)
        return NextResponse.json({ success: true, data: reminderResult })

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('WhatsApp DNA API error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
