/**
 * WhatsApp Environment Variables Test Endpoint
 * Check if all required WhatsApp environment variables are configured
 */

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envVars = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '712631301940690',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '1112225330318984',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'EAAkj2JA2DYEBPYc6SZBr6H7NcjeWGvhRrif4tNHaux6l5GWuvpGkcwYdcnMlLIvZAfppuaGuJx17ZCqtGOZCJ8tr5hDQwja85ZBLrIpZCz1ZBEjDWAt2puJd7Sw1EAp3SUkcJ6VZAH8cVLy9br8HlrdDXyRP7YfYEZCvn8vEU5f0EbIX7HUtSust4QZAquWQjeBwZDZD',
      businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '+919945896033',
      webhookToken: process.env.WHATSAPP_WEBHOOK_TOKEN || 'hera-whatsapp-webhook-2024-secure-token',
      appSecret: process.env.WHATSAPP_APP_SECRET
    }

    // Check which variables are missing
    const missing = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    const configured = Object.entries(envVars)
      .filter(([key, value]) => !!value)
      .length

    const status = {
      configured: configured,
      total: Object.keys(envVars).length,
      missing: missing,
      allConfigured: missing.length === 0
    }

    // Return safe version (don't expose actual tokens)
    const safeEnvVars = {
      phoneNumberId: envVars.phoneNumberId,
      businessAccountId: envVars.businessAccountId,
      accessToken: envVars.accessToken ? `${envVars.accessToken.slice(0, 10)}...` : null,
      businessNumber: envVars.businessNumber,
      webhookToken: envVars.webhookToken ? 'Configured' : null,
      appSecret: envVars.appSecret ? 'Configured' : null
    }

    return NextResponse.json({
      success: true,
      data: {
        ...safeEnvVars,
        status
      }
    })

  } catch (error) {
    console.error('Environment check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check environment variables',
        details: error.message 
      },
      { status: 500 }
    )
  }
}