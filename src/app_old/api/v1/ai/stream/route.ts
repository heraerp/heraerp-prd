import { NextRequest } from 'next/server'
import { universalAI, type UniversalAIRequest, AI_SMART_CODES } from '@/lib/ai/universal-ai'

// HERA Universal AI Streaming Endpoint
// Provides real-time streaming AI responses

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const aiRequest: UniversalAIRequest = {
      smart_code: body.smart_code || AI_SMART_CODES.CHAT_COMPLETION,
      task_type: body.task_type || 'chat',
      prompt: body.prompt,
      context: body.context,
      max_tokens: body.max_tokens,
      temperature: body.temperature,
      preferred_provider: body.preferred_provider,
      fallback_enabled: body.fallback_enabled !== false,
      organization_id: body.organization_id,
      user_id: body.user_id
    }

    if (!aiRequest.prompt) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Prompt is required for streaming AI requests',
          smart_code: 'HERA.AI.STREAM.ERROR.MISSING_PROMPT.v1',
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          const metadata = {
            type: 'metadata',
            smart_code: aiRequest.smart_code,
            task_type: aiRequest.task_type,
            streaming: true,
            timestamp: new Date().toISOString()
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`))

          // Process streaming AI request
          const streamGenerator = universalAI.processStream(aiRequest)

          for await (const chunk of streamGenerator) {
            const streamData = {
              type: 'content',
              chunk: chunk,
              timestamp: new Date().toISOString()
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(streamData)}\n\n`))
          }

          // Send completion signal
          const completion = {
            type: 'complete',
            smart_code: aiRequest.smart_code,
            timestamp: new Date().toISOString()
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completion)}\n\n`))
        } catch (error) {
          const errorData = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Streaming error',
            smart_code: 'HERA.AI.STREAM.ERROR.v1',
            timestamp: new Date().toISOString()
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to initiate AI streaming',
        details: error instanceof Error ? error.message : 'Unknown error',
        smart_code: 'HERA.AI.STREAM.ERROR.INIT.v1',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
