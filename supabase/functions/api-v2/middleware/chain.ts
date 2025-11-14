// HERA v2.3 API Gateway - Middleware Chain
// Smart Code: HERA.API.V2.MIDDLEWARE.CHAIN.v1

import type { 
  MiddlewareFunction, 
  MiddlewareChain, 
  RequestContext,
  MiddlewareResult 
} from '../types/middleware.ts';

export class HERAMiddlewareChain implements MiddlewareChain {
  private middlewares = new Map<string, MiddlewareFunction>();
  private order: string[] = [];

  addMiddleware(name: string, fn: MiddlewareFunction): void {
    this.middlewares.set(name, fn);
    if (!this.order.includes(name)) {
      this.order.push(name);
    }
  }

  removeMiddleware(name: string): void {
    this.middlewares.delete(name);
    this.order = this.order.filter(n => n !== name);
  }

  async execute(req: Request): Promise<RequestContext> {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();
    
    // Initialize context
    let context: Partial<RequestContext> = {
      requestId,
      startTime,
      metadata: {}
    };

    // Execute middleware in order
    for (const name of this.order) {
      const middleware = this.middlewares.get(name);
      if (!middleware) continue;

      try {
        console.log(`[${requestId.slice(0, 8)}] Executing middleware: ${name}`);
        const result = await middleware(req, context);
        
        if (!result.success) {
          // Middleware failed - throw error to be caught by error handler
          const error = new Error(`${result.error?.status || 500}:${result.error?.message || 'Middleware failed'}`);
          (error as any).details = result.error?.details;
          (error as any).headers = result.headers;
          throw error;
        }

        // Merge middleware data into context
        if (result.data) {
          context = { ...context, ...result.data };
        }

        // Add any headers to metadata
        if (result.headers) {
          context.metadata = {
            ...context.metadata,
            [`${name}_headers`]: result.headers
          };
        }

      } catch (error) {
        console.error(`[${requestId.slice(0, 8)}] Middleware ${name} failed:`, error);
        throw error;
      }
    }

    // Validate that required context fields are present
    if (!context.actor || !context.orgContext) {
      throw new Error('500:Middleware chain did not populate required context fields');
    }

    return context as RequestContext;
  }
}

/**
 * Create a middleware chain with the standard HERA middleware stack
 */
export function createStandardMiddlewareChain(): HERAMiddlewareChain {
  const chain = new HERAMiddlewareChain();
  
  // Import and register middleware in execution order
  // Note: We'll load these dynamically to avoid circular dependencies
  return chain;
}

/**
 * Create a middleware chain with specific middleware components
 */
export async function createMiddlewareChain(components: string[]): Promise<HERAMiddlewareChain> {
  const chain = new HERAMiddlewareChain();
  
  // Dynamically import and register middleware based on components
  for (const component of components) {
    try {
      let middleware: MiddlewareFunction;
      
      switch (component) {
        case 'auth':
          const { authMiddleware } = await import('./auth.ts');
          middleware = authMiddleware;
          break;
          
        case 'org-context':
          const { orgContextMiddleware } = await import('./org-context.ts');
          middleware = orgContextMiddleware;
          break;
          
        case 'rate-limit':
          const { rateLimitMiddleware } = await import('./rate-limit.ts');
          middleware = rateLimitMiddleware;
          break;
          
        case 'idempotency':
          const { idempotencyMiddleware } = await import('./idempotency.ts');
          middleware = idempotencyMiddleware;
          break;
          
        case 'guardrails':
          const { guardrailsMiddleware } = await import('./guardrails.ts');
          middleware = guardrailsMiddleware;
          break;
          
        default:
          console.warn(`Unknown middleware component: ${component}`);
          continue;
      }
      
      chain.addMiddleware(component, middleware);
      console.log(`Registered middleware: ${component}`);
      
    } catch (error) {
      console.error(`Failed to load middleware ${component}:`, error);
      // Continue loading other middleware - don't fail the entire chain
    }
  }
  
  return chain;
}

/**
 * Middleware execution helper with error handling
 */
export async function executeMiddleware<T>(
  name: string,
  fn: () => Promise<T>,
  context: Partial<RequestContext>
): Promise<MiddlewareResult<T>> {
  try {
    const data = await fn();
    return {
      success: true,
      data
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const [statusStr, ...messageParts] = errorMessage.split(':');
    const status = parseInt(statusStr) || 500;
    const message = messageParts.join(':') || 'Middleware execution failed';

    console.error(`[${context.requestId?.slice(0, 8)}] ${name} middleware failed:`, error);

    return {
      success: false,
      error: {
        status,
        code: name.toUpperCase() + '_FAILED',
        message,
        details: error
      }
    };
  }
}