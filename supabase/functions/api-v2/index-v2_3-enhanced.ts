// HERA v2.3 Enhanced API Gateway - Modular Architecture
// Smart Code: HERA.API.V2.GATEWAY.ENHANCED.v1

import { serve } from "https://deno.land/std@0.202.0/http/server.ts";
import type { RequestContext } from './types/middleware.ts';
import { HERAMiddlewareChain } from './middleware/chain.ts';
import { authMiddleware } from './middleware/auth.ts';
import { orgContextMiddleware } from './middleware/org-context.ts';
import { guardrailsMiddleware } from './middleware/guardrails.ts';
import { rateLimitMiddleware } from './middleware/rate-limit.ts';
import { idempotencyMiddleware, storeIdempotentResponse } from './middleware/idempotency.ts';
import { handleEntities, handleEntitySearch, handleEntityRelationships } from './routes/entities.ts';
import { handleTransactions, handleTransactionApproval, handleTransactionPosting, handleTransactionSearch } from './routes/transactions.ts';
import { handleAIAssistant, handleAIUsage, handleAIChat } from './routes/ai.ts';
import { createErrorResponse, createSuccessResponse, generateRequestId, measureTime } from './lib/utils.ts';
import { cacheHealthCheck } from './lib/cache.ts';

/**
 * HERA v2.3 Enhanced API Gateway with Modular Middleware Architecture
 * 
 * Features:
 * - Modular middleware chain with dynamic loading
 * - Enhanced guardrails v2.0 integration
 * - Rate limiting and idempotency support
 * - AI assistant and usage endpoints
 * - Comprehensive error handling and observability
 * - Route-based organization for entities, transactions, AI
 */

// Initialize middleware chain
const middlewareChain = new HERAMiddlewareChain();
middlewareChain.registerMiddleware('auth', authMiddleware);
middlewareChain.registerMiddleware('org-context', orgContextMiddleware);
middlewareChain.registerMiddleware('guardrails', guardrailsMiddleware);
middlewareChain.registerMiddleware('rate-limit', rateLimitMiddleware);
middlewareChain.registerMiddleware('idempotency', idempotencyMiddleware);

/**
 * Main request handler with enhanced middleware pipeline
 */
async function handleRequest(req: Request): Promise<Response> {
  const startTime = performance.now();
  const requestId = generateRequestId();
  const url = new URL(req.url);

  console.log(`[${requestId.slice(0, 8)}] ${req.method} ${url.pathname}`);

  try {
    // Health check endpoint - no auth required
    if (url.pathname.endsWith("/api/v2/health")) {
      return await handleHealthCheck(requestId);
    }

    // Metrics endpoint - no auth required for monitoring
    if (url.pathname.endsWith("/api/v2/metrics")) {
      return await handleMetrics(requestId);
    }

    // Gateway enforcement test endpoint - no auth required for testing
    if (url.pathname.endsWith("/api/v2/gateway/test")) {
      return await handleGatewayTest(requestId);
    }

    // Execute middleware chain
    const context = await middlewareChain.execute(req);
    context.requestId = requestId;

    // Handle idempotency duplicate detection
    if (context.idempotency?.isDuplicate) {
      console.log(`[${requestId.slice(0, 8)}] Returning cached response for duplicate request`);
      return new Response(
        JSON.stringify(context.idempotency.cachedResponse),
        {
          status: context.idempotency.cachedStatus || 200,
          headers: { 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        }
      );
    }

    // Route request to appropriate handler
    const response = await routeRequest(req, context);

    // Store idempotent response if needed
    if (context.idempotency?.isIdempotent && !context.idempotency.isDuplicate && response.status < 400) {
      const responseBody = await response.clone().json();
      await storeIdempotentResponse(context.idempotency.key, responseBody, response.status);
    }

    // Add performance headers
    const duration = performance.now() - startTime;
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);

    // Add rate limit headers
    if (context.rateLimitInfo) {
      response.headers.set('X-RateLimit-Limit', context.rateLimitInfo.limit.toString());
      response.headers.set('X-RateLimit-Remaining', context.rateLimitInfo.remaining.toString());
      response.headers.set('X-RateLimit-Reset', context.rateLimitInfo.resetTime.toString());
    }

    console.log(`[${requestId.slice(0, 8)}] Response: ${response.status} (${duration.toFixed(2)}ms)`);

    return response;

  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`[${requestId.slice(0, 8)}] Error after ${duration.toFixed(2)}ms:`, error);
    return createErrorResponse(error, requestId);
  }
}

/**
 * Route request to appropriate handler based on URL path
 */
async function routeRequest(req: Request, context: RequestContext): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  // Entity routes
  if (pathname.endsWith('/api/v2/entities')) {
    return await handleEntities(req, context);
  }

  if (pathname.endsWith('/api/v2/entities/search')) {
    if (method !== 'POST') {
      throw new Error('405:Method not allowed. Use POST for entity search.');
    }
    return await handleEntitySearch(req, context);
  }

  if (pathname.includes('/api/v2/entities/') && pathname.endsWith('/relationships')) {
    return await handleEntityRelationships(req, context);
  }

  // Transaction routes
  if (pathname.endsWith('/api/v2/transactions')) {
    return await handleTransactions(req, context);
  }

  if (pathname.endsWith('/api/v2/transactions/search')) {
    if (method !== 'POST') {
      throw new Error('405:Method not allowed. Use POST for transaction search.');
    }
    return await handleTransactionSearch(req, context);
  }

  if (pathname.endsWith('/api/v2/transactions/approve')) {
    if (method !== 'POST') {
      throw new Error('405:Method not allowed. Use POST for transaction approval.');
    }
    return await handleTransactionApproval(req, context);
  }

  if (pathname.endsWith('/api/v2/transactions/post')) {
    if (method !== 'POST') {
      throw new Error('405:Method not allowed. Use POST for transaction posting.');
    }
    return await handleTransactionPosting(req, context);
  }

  // AI routes
  if (pathname.endsWith('/api/v2/ai/assistant')) {
    if (method !== 'POST') {
      throw new Error('405:Method not allowed. Use POST for AI assistant.');
    }
    return await handleAIAssistant(req, context);
  }

  if (pathname.endsWith('/api/v2/ai/chat')) {
    if (method !== 'POST') {
      throw new Error('405:Method not allowed. Use POST for AI chat.');
    }
    return await handleAIChat(req, context);
  }

  if (pathname.endsWith('/api/v2/ai/usage')) {
    return await handleAIUsage(req, context);
  }

  // Generic command endpoint (backward compatibility)
  if (pathname.endsWith('/api/v2/command')) {
    return await handleGenericCommand(req, context);
  }

  // Route not found
  throw new Error('404:Route not found');
}

/**
 * Handle generic command endpoint for backward compatibility
 */
async function handleGenericCommand(req: Request, context: RequestContext): Promise<Response> {
  const body = await req.json();
  const operation = body.op || body.operation;

  switch (operation) {
    case 'entities':
    case 'entity':
      return await handleEntities(req, context);

    case 'transactions':
    case 'transaction':
      return await handleTransactions(req, context);

    case 'ai':
    case 'assistant':
      return await handleAIAssistant(req, context);

    default:
      throw new Error(`400:Unknown operation: ${operation}`);
  }
}

/**
 * Health check endpoint
 */
async function handleHealthCheck(requestId: string): Promise<Response> {
  const health = {
    status: 'healthy',
    version: '2.3.0',
    timestamp: new Date().toISOString(),
    components: {
      api_gateway: 'healthy',
      middleware_chain: 'healthy',
      cache: 'checking...',
      guardrails: 'healthy'
    }
  };

  try {
    const cacheHealth = await cacheHealthCheck();
    health.components.cache = cacheHealth.status;
  } catch (error) {
    health.components.cache = 'unhealthy';
    health.status = 'degraded';
  }

  return createSuccessResponse(health, requestId);
}

/**
 * Metrics endpoint for monitoring
 */
async function handleMetrics(requestId: string): Promise<Response> {
  const metrics = {
    middleware_chain: {
      registered_middleware: middlewareChain.getRegisteredMiddleware(),
      execution_order: ['auth', 'org-context', 'guardrails', 'rate-limit', 'idempotency']
    },
    cache: {
      enabled: true,
      type: 'in-memory' // or 'redis' in production
    },
    rate_limiting: {
      enabled: true,
      strategy: 'sliding-window'
    },
    idempotency: {
      enabled: true,
      ttl_seconds: 24 * 60 * 60
    },
    guardrails: {
      version: '2.0',
      smart_code_validation: true,
      gl_balance_checking: true,
      organization_filtering: true
    }
  };

  return createSuccessResponse(metrics, requestId);
}

/**
 * Gateway enforcement test endpoint
 */
async function handleGatewayTest(requestId: string): Promise<Response> {
  try {
    // Import here to avoid circular dependencies
    const { createServiceRoleClient } = await import('./lib/supabase-client.ts');
    const supabase = createServiceRoleClient();
    
    const { data, error } = await supabase.rpc("check_gateway_enforcement_status");
    
    if (error) {
      throw new Error(`Gateway test failed: ${error.message}`);
    }
    
    return createSuccessResponse(
      {
        gateway_status: 'operational',
        version: 'v2.3.0',
        hard_gate: 'enabled',
        enforcement_test: data
      },
      requestId
    );
  } catch (error) {
    return createErrorResponse(error, requestId);
  }
}

/**
 * CORS preflight handler
 */
function handlePreflight(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Organization-Id, X-Idempotency-Key, X-Request-ID',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Main serve handler with CORS support
 */
function mainHandler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return Promise.resolve(handlePreflight());
  }

  return handleRequest(req);
}

// Log startup information
console.log('🚀 HERA v2.3 Enhanced API Gateway starting...');
console.log(`📋 Middleware chain: ${middlewareChain.getRegisteredMiddleware().join(' → ')}`);
console.log('✅ Enhanced guardrails v2.0 enabled');
console.log('🛡️ Rate limiting and idempotency enabled');
console.log('🤖 AI assistant endpoints enabled');
console.log('🎯 Modular route handlers loaded');

// Start the server
serve(mainHandler);