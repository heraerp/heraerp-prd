import { NextRequest, NextResponse } from 'next/server'
import { UniversalWhatsAppAI } from '@/lib/ai/universal-whatsapp-ai'

export async function GET(request: NextRequest) {
  try {
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
    
    // Initialize Universal AI
    const universalAI = new UniversalWhatsAppAI(organizationId)
    
    // Get provider status
    const providerStatus = universalAI.getProviderStatus()
    
    // Test providers
    const providerTests = await universalAI.testProviders()
    
    // Test intent extraction with both providers
    const testMessage = "I want to book a haircut tomorrow at 3pm"
    let claudeResult = null
    let openaiResult = null
    
    try {
      claudeResult = await universalAI.extractIntent(testMessage, { preferredProvider: 'claude' })
    } catch (error) {
      claudeResult = { error: error instanceof Error ? error.message : 'Failed' }
    }
    
    try {
      openaiResult = await universalAI.extractIntent(testMessage, { preferredProvider: 'openai' })
    } catch (error) {
      openaiResult = { error: error instanceof Error ? error.message : 'Failed' }
    }
    
    // Environment check
    const envCheck = {
      claude_api_key: !!process.env.CLAUDE_API_KEY,
      openai_api_key: !!process.env.OPENAI_API_KEY,
      whatsapp_access_token: !!process.env.WHATSAPP_ACCESS_TOKEN,
      organization_id: !!process.env.DEFAULT_ORGANIZATION_ID
    }
    
    return NextResponse.json({
      status: 'WhatsApp AI Provider Test',
      providers: providerStatus,
      provider_tests: providerTests,
      environment_check: envCheck,
      test_results: {
        test_message: testMessage,
        claude_extraction: claudeResult,
        openai_extraction: openaiResult
      },
      configuration: {
        primary: 'Claude AI',
        fallback: 'OpenAI GPT-4',
        final_fallback: 'Rule-based extraction'
      },
      message: 'The system will automatically use OpenAI if Claude fails'
    })
    
  } catch (error) {
    console.error('AI test endpoint error:', error)
    return NextResponse.json({ 
      error: 'Failed to test AI providers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, provider } = body
    
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
    const universalAI = new UniversalWhatsAppAI(organizationId)
    
    // Extract intent with specified provider
    const intent = await universalAI.extractIntent(message, { preferredProvider: provider })
    
    // Generate response
    const response = await universalAI.craftResponse([], intent, provider)
    
    return NextResponse.json({
      success: true,
      message,
      provider: provider || 'automatic',
      intent,
      suggested_response: response
    })
    
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}