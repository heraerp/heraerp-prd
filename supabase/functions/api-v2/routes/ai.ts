// HERA v2.3 API Gateway - AI Routes
// Smart Code: HERA.API.V2.ROUTES.AI.v1

import type { RequestContext } from '../types/middleware.ts';
import { createServiceRoleClient, setGatewayContext } from '../lib/supabase-client.ts';
import { createSuccessResponse, createErrorResponse, generateSecureId } from '../lib/utils.ts';

/**
 * AI Assistant endpoint - handles Claude/GPT interactions
 */
export async function handleAIAssistant(req: Request, context: RequestContext): Promise<Response> {
  try {
    const body = await req.json();
    
    // Validate request
    if (!body.prompt) {
      throw new Error('400:Missing required field: prompt');
    }
    
    // Log AI usage before processing
    const usageId = await logAIUsage({
      actorId: context.actor.id,
      orgId: context.orgContext.org_id,
      provider: body.provider || 'anthropic',
      model: body.model || 'claude-3-sonnet',
      prompt: body.prompt,
      requestId: context.requestId
    });
    
    // Process AI request
    const aiResult = await processAIRequest(body, context);
    
    // Update usage with response
    await updateAIUsage(usageId, {
      response: aiResult.response,
      tokensUsed: aiResult.tokensUsed,
      costEstimated: aiResult.costEstimated,
      completed: true
    });
    
    return createSuccessResponse(
      {
        response: aiResult.response,
        usage: {
          id: usageId,
          tokens_used: aiResult.tokensUsed,
          cost_estimated: aiResult.costEstimated,
          model: body.model || 'claude-3-sonnet',
          provider: body.provider || 'anthropic'
        }
      },
      context.requestId,
      {
        actor_id: context.actor.id,
        organization_id: context.orgContext.org_id,
        usage_id: usageId
      }
    );
    
  } catch (error) {
    console.error('AI assistant error:', error);
    return createErrorResponse(error, context.requestId);
  }
}

/**
 * AI Usage logging endpoint - tracks AI consumption
 */
export async function handleAIUsage(req: Request, context: RequestContext): Promise<Response> {
  try {
    const method = req.method.toUpperCase();
    
    if (method === 'GET') {
      return await getAIUsage(req, context);
    } else if (method === 'POST') {
      return await logAIUsageManual(req, context);
    } else {
      throw new Error('405:Method not allowed');
    }
    
  } catch (error) {
    console.error('AI usage error:', error);
    return createErrorResponse(error, context.requestId);
  }
}

/**
 * Get AI usage statistics
 */
async function getAIUsage(req: Request, context: RequestContext): Promise<Response> {
  const url = new URL(req.url);
  const timeframe = url.searchParams.get('timeframe') || '30d';
  const provider = url.searchParams.get('provider');
  const model = url.searchParams.get('model');
  
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'get_ai_usage_v1');
  
  const { data: usage, error } = await supabase.rpc('get_ai_usage_v1', {
    p_organization_id: context.orgContext.org_id,
    p_actor_user_id: context.actor.id,
    p_timeframe: timeframe,
    p_provider: provider,
    p_model: model
  });
  
  if (error) {
    throw new Error(`500:Failed to get AI usage: ${error.message}`);
  }
  
  return createSuccessResponse(
    usage || [],
    context.requestId,
    {
      timeframe,
      provider,
      model,
      organization_id: context.orgContext.org_id
    }
  );
}

/**
 * Log AI usage manually
 */
async function logAIUsageManual(req: Request, context: RequestContext): Promise<Response> {
  const body = await req.json();
  
  // Validate required fields
  if (!body.provider || !body.model) {
    throw new Error('400:Missing required fields: provider, model');
  }
  
  const usageId = await logAIUsage({
    actorId: context.actor.id,
    orgId: context.orgContext.org_id,
    provider: body.provider,
    model: body.model,
    prompt: body.prompt || '',
    response: body.response || '',
    tokensUsed: body.tokens_used || 0,
    costEstimated: body.cost_estimated || 0,
    requestId: context.requestId,
    completed: true
  });
  
  return createSuccessResponse(
    { usage_id: usageId },
    context.requestId,
    {
      organization_id: context.orgContext.org_id,
      actor_id: context.actor.id
    }
  );
}

/**
 * Process AI request (placeholder for actual AI integration)
 */
async function processAIRequest(body: any, context: RequestContext): Promise<{
  response: string;
  tokensUsed: number;
  costEstimated: number;
}> {
  // This is a placeholder implementation
  // In production, this would integrate with actual AI providers
  
  const provider = body.provider || 'anthropic';
  const model = body.model || 'claude-3-sonnet';
  const prompt = body.prompt;
  
  console.log(`[${context.requestId.slice(0, 8)}] Processing AI request: ${provider}/${model}`);
  
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock response
  const response = `AI Response to: ${prompt.substring(0, 50)}...`;
  const tokensUsed = Math.floor(prompt.length / 4) + Math.floor(response.length / 4);
  const costEstimated = tokensUsed * 0.00001; // $0.01 per 1k tokens
  
  return {
    response,
    tokensUsed,
    costEstimated
  };
}

/**
 * Log AI usage to database
 */
async function logAIUsage(params: {
  actorId: string;
  orgId: string;
  provider: string;
  model: string;
  prompt: string;
  response?: string;
  tokensUsed?: number;
  costEstimated?: number;
  requestId: string;
  completed?: boolean;
}): Promise<string> {
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_ai_usage_crud_v1');
  
  const usageId = generateSecureId();
  
  const { error } = await supabase.rpc('hera_ai_usage_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: params.actorId,
    p_organization_id: params.orgId,
    p_usage: {
      usage_id: usageId,
      provider: params.provider,
      model: params.model,
      prompt_text: params.prompt,
      response_text: params.response || '',
      tokens_used: params.tokensUsed || 0,
      cost_estimated: params.costEstimated || 0,
      request_id: params.requestId,
      completed: params.completed || false,
      smart_code: `HERA.AI.USAGE.${params.provider.toUpperCase()}.${params.model.toUpperCase().replace(/[^A-Z0-9]/g, '_')}.v1`
    },
    p_options: {}
  });
  
  if (error) {
    console.error('Failed to log AI usage:', error);
    // Don't throw - logging should not block the request
  }
  
  return usageId;
}

/**
 * Update AI usage record with response data
 */
async function updateAIUsage(usageId: string, updates: {
  response?: string;
  tokensUsed?: number;
  costEstimated?: number;
  completed?: boolean;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  await setGatewayContext(supabase, 'hera_ai_usage_crud_v1');
  
  const { error } = await supabase.rpc('hera_ai_usage_crud_v1', {
    p_action: 'UPDATE',
    p_actor_user_id: 'system', // System update
    p_organization_id: 'system',
    p_usage: {
      usage_id: usageId,
      response_text: updates.response || '',
      tokens_used: updates.tokensUsed || 0,
      cost_estimated: updates.costEstimated || 0,
      completed: updates.completed || false
    },
    p_options: {}
  });
  
  if (error) {
    console.error('Failed to update AI usage:', error);
    // Don't throw - logging should not block the request
  }
}

/**
 * AI Assistant chat endpoint - for conversational AI
 */
export async function handleAIChat(req: Request, context: RequestContext): Promise<Response> {
  try {
    const body = await req.json();
    
    // Validate request
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new Error('400:Missing or invalid field: messages (must be array)');
    }
    
    if (body.messages.length === 0) {
      throw new Error('400:Messages array cannot be empty');
    }
    
    // Get conversation context
    const conversationId = body.conversation_id || generateSecureId();
    const model = body.model || 'claude-3-sonnet';
    const provider = body.provider || 'anthropic';
    
    // Log chat usage
    const usageId = await logAIUsage({
      actorId: context.actor.id,
      orgId: context.orgContext.org_id,
      provider,
      model,
      prompt: JSON.stringify(body.messages),
      requestId: context.requestId
    });
    
    // Process chat request
    const chatResult = await processChatRequest(body, context);
    
    // Update usage with response
    await updateAIUsage(usageId, {
      response: chatResult.response,
      tokensUsed: chatResult.tokensUsed,
      costEstimated: chatResult.costEstimated,
      completed: true
    });
    
    return createSuccessResponse(
      {
        conversation_id: conversationId,
        response: chatResult.response,
        message: {
          role: 'assistant',
          content: chatResult.response
        },
        usage: {
          id: usageId,
          tokens_used: chatResult.tokensUsed,
          cost_estimated: chatResult.costEstimated,
          model,
          provider
        }
      },
      context.requestId,
      {
        actor_id: context.actor.id,
        organization_id: context.orgContext.org_id,
        conversation_id: conversationId,
        usage_id: usageId
      }
    );
    
  } catch (error) {
    console.error('AI chat error:', error);
    return createErrorResponse(error, context.requestId);
  }
}

/**
 * Process chat request (placeholder for actual AI integration)
 */
async function processChatRequest(body: any, context: RequestContext): Promise<{
  response: string;
  tokensUsed: number;
  costEstimated: number;
}> {
  const messages = body.messages;
  const lastMessage = messages[messages.length - 1];
  
  console.log(`[${context.requestId.slice(0, 8)}] Processing chat with ${messages.length} messages`);
  
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Mock response
  const response = `Chat response to: "${lastMessage.content?.substring(0, 50)}..."\n\nThis is a mock AI response for testing the HERA v2.3 API Gateway.`;
  const tokensUsed = messages.reduce((total: number, msg: any) => 
    total + Math.floor((msg.content?.length || 0) / 4), 0) + Math.floor(response.length / 4);
  const costEstimated = tokensUsed * 0.00001;
  
  return {
    response,
    tokensUsed,
    costEstimated
  };
}