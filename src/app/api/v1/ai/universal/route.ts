import { NextRequest, NextResponse } from 'next/server'
import {
  universalAI,
  aiHelpers,
  AI_SMART_CODES,
  type UniversalAIRequest
} from '@/src/lib/ai/universal-ai'

// HERA Universal AI API Endpoint
// Intelligently routes AI requests to optimal providers with fallback

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...requestData } = body

    // Validate required fields
    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action is required',
          smart_code: 'HERA.AI.ERROR.MISSING_ACTION.v1',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Route to specific AI helper functions
    switch (action) {
      case 'generate_ca_questions':
        const { topic, difficulty = 'medium', count = 5 } = requestData
        if (!topic) {
          return NextResponse.json(
            {
              success: false,
              error: 'Topic is required for question generation',
              smart_code: 'HERA.AI.ERROR.MISSING_TOPIC.v1',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }

        const questionsResult = await aiHelpers.generateCAQuestions(topic, difficulty, count)
        return NextResponse.json(questionsResult)

      case 'analyze_student_performance':
        const { student_data } = requestData
        if (!student_data) {
          return NextResponse.json(
            {
              success: false,
              error: 'Student data is required for performance analysis',
              smart_code: 'HERA.AI.ERROR.MISSING_DATA.v1',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }

        const analysisResult = await aiHelpers.analyzeStudentPerformance(student_data)
        return NextResponse.json(analysisResult)

      case 'generate_quiz_feedback':
        const { quiz_result } = requestData
        if (!quiz_result) {
          return NextResponse.json(
            {
              success: false,
              error: 'Quiz result is required for feedback generation',
              smart_code: 'HERA.AI.ERROR.MISSING_QUIZ_DATA.v1',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }

        const feedbackResult = await aiHelpers.generateQuizFeedback(quiz_result)
        return NextResponse.json(feedbackResult)

      case 'generate_business_insights':
        const { business_data } = requestData
        if (!business_data) {
          return NextResponse.json(
            {
              success: false,
              error: 'Business data is required for insights generation',
              smart_code: 'HERA.AI.ERROR.MISSING_BUSINESS_DATA.v1',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }

        const insightsResult = await aiHelpers.generateBusinessInsights(business_data)
        return NextResponse.json(insightsResult)

      case 'custom_request':
        // For custom AI requests with full control
        const aiRequest: UniversalAIRequest = {
          smart_code: requestData.smart_code || AI_SMART_CODES.CHAT_COMPLETION,
          task_type: requestData.task_type || 'chat',
          prompt: requestData.prompt,
          context: requestData.context,
          max_tokens: requestData.max_tokens,
          temperature: requestData.temperature,
          preferred_provider: requestData.preferred_provider,
          fallback_enabled: requestData.fallback_enabled !== false, // Default to true
          organization_id: requestData.organization_id,
          user_id: requestData.user_id
        }

        if (!aiRequest.prompt) {
          return NextResponse.json(
            {
              success: false,
              error: 'Prompt is required for custom AI requests',
              smart_code: 'HERA.AI.ERROR.MISSING_PROMPT.v1',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }

        const customResult = await universalAI.processRequest(aiRequest)
        return NextResponse.json(customResult)

      case 'batch_request':
        // Process multiple AI requests in batch
        const { requests } = requestData
        if (!requests || !Array.isArray(requests)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Requests array is required for batch processing',
              smart_code: 'HERA.AI.ERROR.MISSING_BATCH_DATA.v1',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }

        const batchResults = await universalAI.processBatch(requests)
        return NextResponse.json({
          success: true,
          data: batchResults,
          smart_code: 'HERA.AI.BATCH.COMPLETE.v1',
          timestamp: new Date().toISOString(),
          metadata: {
            total_requests: requests.length,
            successful_requests: batchResults.filter(r => r.success).length
          }
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            available_actions: [
              'generate_ca_questions',
              'analyze_student_performance',
              'generate_quiz_feedback',
              'generate_business_insights',
              'custom_request',
              'batch_request'
            ],
            smart_code: 'HERA.AI.ERROR.UNKNOWN_ACTION.v1',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Universal AI API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal AI processing error',
        details: error instanceof Error ? error.message : 'Unknown error',
        smart_code: 'HERA.AI.ERROR.INTERNAL.v1',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Get AI provider status and health
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'status':
        const providerStatus = universalAI.getProviderStatus()
        return NextResponse.json({
          success: true,
          data: {
            providers: providerStatus,
            smart_codes: AI_SMART_CODES,
            system_health: 'healthy'
          },
          smart_code: 'HERA.AI.STATUS.HEALTHY.v1',
          timestamp: new Date().toISOString()
        })

      case 'capabilities':
        return NextResponse.json({
          success: true,
          data: {
            supported_tasks: ['chat', 'generation', 'analysis', 'code', 'learning'],
            available_actions: [
              'generate_ca_questions',
              'analyze_student_performance',
              'generate_quiz_feedback',
              'generate_business_insights',
              'custom_request',
              'batch_request'
            ],
            smart_codes: Object.keys(AI_SMART_CODES),
            features: [
              'intelligent_provider_selection',
              'automatic_fallback',
              'cost_optimization',
              'confidence_scoring',
              'caching',
              'batch_processing',
              'streaming_support'
            ]
          },
          smart_code: 'HERA.AI.CAPABILITIES.v1',
          timestamp: new Date().toISOString()
        })

      case 'clear_cache':
        universalAI.clearCache()
        return NextResponse.json({
          success: true,
          message: 'AI cache cleared successfully',
          smart_code: 'HERA.AI.CACHE.CLEARED.v1',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'HERA Universal AI API is operational',
            version: '1.0.0',
            endpoints: {
              'POST /api/v1/ai/universal': 'Process AI requests',
              'GET /api/v1/ai/universal?action=status': 'Get provider status',
              'GET /api/v1/ai/universal?action=capabilities': 'Get system capabilities',
              'GET /api/v1/ai/universal?action=clear_cache': 'Clear AI cache'
            }
          },
          smart_code: 'HERA.AI.INFO.v1',
          timestamp: new Date().toISOString()
        })
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process AI status request',
        details: error instanceof Error ? error.message : 'Unknown error',
        smart_code: 'HERA.AI.ERROR.STATUS.v1',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
