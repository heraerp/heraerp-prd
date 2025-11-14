// HERA v2.3 API Gateway - Middleware Types
// Smart Code: HERA.API.V2.MIDDLEWARE.TYPES.v1

export interface Actor {
  id: string;
  email: string;
  memberships: Array<{
    org_id: string;
    roles: string[];
    is_active: boolean;
    membership_type: string;
  }>;
}

export interface OrgContext {
  org_id: string;
  roles: string[];
  org_name?: string;
}

export interface GuardrailsContext {
  profile: string;
  validated: boolean;
  violations: string[];
  warnings: string[];
}

export interface RateLimitContext {
  limit: number;
  remaining: number;
  reset: Date;
  exceeded: boolean;
}

export interface IdempotencyContext {
  key?: string;
  isDuplicate: boolean;
  cachedResponse?: any;
}

export interface RequestContext {
  requestId: string;
  actor: Actor;
  orgContext: OrgContext;
  guardrails: GuardrailsContext;
  rateLimit: RateLimitContext;
  idempotency: IdempotencyContext;
  startTime: number;
  metadata: Record<string, any>;
}

export interface MiddlewareResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    status: number;
    code: string;
    message: string;
    details?: any;
  };
  headers?: Record<string, string>;
}

export type MiddlewareFunction<T = any> = (
  req: Request,
  context?: Partial<RequestContext>
) => Promise<MiddlewareResult<T>>;

export interface MiddlewareChain {
  execute(req: Request): Promise<RequestContext>;
  addMiddleware(name: string, fn: MiddlewareFunction): void;
  removeMiddleware(name: string): void;
}