// HERA v2.3 API Gateway - Enhanced Guardrails Middleware
// Smart Code: HERA.API.V2.MIDDLEWARE.GUARDRAILS.v1

import type { 
  MiddlewareFunction, 
  Actor, 
  OrgContext, 
  GuardrailsContext,
  RequestContext 
} from '../types/middleware.ts';
import { validateRequestPayload } from '../_guardrails_v2.ts';
import { executeMiddleware } from './chain.ts';

/**
 * Enhanced guardrails middleware - applies validation rules based on endpoint profile
 */
export const guardrailsMiddleware: MiddlewareFunction<{ guardrails: GuardrailsContext }> = async (req, context) => {
  return executeMiddleware('guardrails', async () => {
    const actor = (context as Partial<RequestContext>)?.actor;
    const orgContext = (context as Partial<RequestContext>)?.orgContext;
    
    if (!actor || !orgContext) {
      throw new Error('500:Auth and org-context middleware must run before guardrails middleware');
    }

    // 1. Determine guardrail profile from URL path
    const url = new URL(req.url);
    const profile = getProfileFromPath(url.pathname);

    // 2. Parse request body (if present)
    let body: any = {};
    const method = req.method.toUpperCase();
    
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const bodyText = await req.clone().text();
        if (bodyText) {
          body = JSON.parse(bodyText);
        }
      } catch (error) {
        throw new Error('400:Invalid JSON in request body');
      }
    }

    // 3. Extract operation from body or URL
    const operation = body.operation || extractOperationFromMethod(method);

    // 4. Apply guardrails validation
    const validationResult = await validateRequestPayload(
      orgContext.org_id,
      actor.id,
      operation,
      url.pathname,
      body,
      Object.fromEntries(req.headers.entries())
    );

    if (!validationResult.isValid) {
      // Construct detailed error message
      const primaryViolations = validationResult.result.violations.filter(v => 
        v.includes('CRITICAL') || v.includes('organization_id') || v.includes('smart_code')
      );
      
      const errorMessage = primaryViolations.length > 0 
        ? primaryViolations[0]
        : validationResult.result.violations[0] || 'Guardrail validation failed';

      throw new Error(`400:${errorMessage}`);
    }

    // 5. Log warnings if any
    if (validationResult.result.warnings.length > 0) {
      console.warn(`[${context?.requestId?.slice(0, 8)}] Guardrail warnings:`, validationResult.result.warnings);
    }

    console.log(`[${context?.requestId?.slice(0, 8)}] Guardrails passed for profile: ${profile}`);

    return {
      profile,
      validated: true,
      violations: [],
      warnings: validationResult.result.warnings
    } as GuardrailsContext;
  }, context);
};

/**
 * Determine guardrail profile from request path
 */
function getProfileFromPath(pathname: string): string {
  if (pathname.includes('/entities')) return 'ENTITY_CRUD';
  if (pathname.includes('/transactions')) return 'TXN_POST';
  if (pathname.includes('/ai/assistant')) return 'AI_USAGE';
  if (pathname.includes('/ai/usage')) return 'AI_USAGE';
  if (pathname.includes('/ai/')) return 'AI_USAGE';
  return 'COMMON';
}

/**
 * Extract operation from HTTP method
 */
function extractOperationFromMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET': return 'READ';
    case 'POST': return 'CREATE';
    case 'PUT': return 'UPDATE';
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return 'READ';
  }
}

/**
 * Validate specific guardrail rules for different profiles
 */
export async function validateProfileRules(
  profile: string,
  body: any,
  actor: Actor,
  orgContext: OrgContext
): Promise<{ isValid: boolean; violations: string[]; warnings: string[] }> {
  const violations: string[] = [];
  const warnings: string[] = [];

  switch (profile) {
    case 'ENTITY_CRUD':
      await validateEntityRules(body, actor, orgContext, violations, warnings);
      break;
    case 'TXN_POST':
      await validateTransactionRules(body, actor, orgContext, violations, warnings);
      break;
    case 'AI_USAGE':
      await validateAIRules(body, actor, orgContext, violations, warnings);
      break;
  }

  return {
    isValid: violations.length === 0,
    violations,
    warnings
  };
}

/**
 * Entity-specific validation rules
 */
async function validateEntityRules(
  body: any,
  actor: Actor,
  orgContext: OrgContext,
  violations: string[],
  warnings: string[]
): Promise<void> {
  // Validate entity type
  if (body.entity_data?.entity_type) {
    const allowedTypes = ['CUSTOMER', 'PRODUCT', 'SERVICE', 'USER', 'ORGANIZATION', 'GL_ACCOUNT'];
    if (!allowedTypes.includes(body.entity_data.entity_type)) {
      warnings.push(`Non-standard entity type: ${body.entity_data.entity_type}`);
    }
  }

  // Validate smart code format for entities
  if (body.entity_data?.smart_code) {
    const smartCodePattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;
    if (!smartCodePattern.test(body.entity_data.smart_code)) {
      violations.push(`Invalid smart code format: ${body.entity_data.smart_code}`);
    }
  }

  // Validate dynamic fields
  if (Array.isArray(body.dynamic_fields)) {
    for (const field of body.dynamic_fields) {
      if (!field.field_name) {
        violations.push('Dynamic field missing field_name');
      }
      if (!field.field_type) {
        violations.push(`Dynamic field ${field.field_name} missing field_type`);
      }
    }
  }
}

/**
 * Transaction-specific validation rules
 */
async function validateTransactionRules(
  body: any,
  actor: Actor,
  orgContext: OrgContext,
  violations: string[],
  warnings: string[]
): Promise<void> {
  // Validate transaction type
  if (body.transaction_data?.transaction_type) {
    const standardTypes = ['sale', 'purchase', 'payment', 'receipt', 'journal_entry', 'adjustment'];
    if (!standardTypes.includes(body.transaction_data.transaction_type.toLowerCase())) {
      warnings.push(`Non-standard transaction type: ${body.transaction_data.transaction_type}`);
    }
  }

  // Validate GL balance if lines present
  if (Array.isArray(body.lines)) {
    const glLines = body.lines.filter((line: any) => 
      line.smart_code && line.smart_code.includes('.GL.')
    );

    if (glLines.length > 0) {
      const { isBalanced, currencies } = validateGLBalance(glLines);
      if (!isBalanced) {
        violations.push(`GL transactions not balanced per currency: ${currencies.join(', ')}`);
      }
    }
  }

  // Validate amounts
  if (body.transaction_data?.total_amount !== undefined) {
    const amount = Number(body.transaction_data.total_amount);
    if (isNaN(amount) || amount < 0) {
      violations.push('Transaction total_amount must be a non-negative number');
    }
  }
}

/**
 * AI-specific validation rules
 */
async function validateAIRules(
  body: any,
  actor: Actor,
  orgContext: OrgContext,
  violations: string[],
  warnings: string[]
): Promise<void> {
  // Validate AI provider and model
  if (body.provider) {
    const allowedProviders = ['openai', 'anthropic', 'google', 'azure'];
    if (!allowedProviders.includes(body.provider.toLowerCase())) {
      warnings.push(`Non-standard AI provider: ${body.provider}`);
    }
  }

  // Validate token limits
  if (body.tokens_used !== undefined) {
    const tokens = Number(body.tokens_used);
    if (isNaN(tokens) || tokens < 0) {
      violations.push('AI usage tokens_used must be a non-negative number');
    }
    if (tokens > 100000) {
      warnings.push(`High token usage: ${tokens} tokens`);
    }
  }

  // Validate cost estimates
  if (body.cost_estimated !== undefined) {
    const cost = Number(body.cost_estimated);
    if (isNaN(cost) || cost < 0) {
      violations.push('AI usage cost_estimated must be a non-negative number');
    }
  }
}

/**
 * Validate GL balance for transaction lines
 */
function validateGLBalance(lines: any[]): { isBalanced: boolean; currencies: string[] } {
  const totals = new Map<string, { dr: number; cr: number }>();
  
  for (const line of lines) {
    const currency = line.transaction_currency_code || line.currency || 'DOC';
    const side = line.line_data?.side;
    const amount = Number(line.line_amount || 0);

    if (!['DR', 'CR'].includes(side)) continue;

    const t = totals.get(currency) || { dr: 0, cr: 0 };
    if (side === 'DR') t.dr += amount;
    else t.cr += amount;
    totals.set(currency, t);
  }

  const unbalancedCurrencies: string[] = [];
  
  for (const [currency, t] of totals) {
    const diff = Math.abs(t.dr - t.cr);
    if (diff > 0.01) {
      unbalancedCurrencies.push(currency);
    }
  }

  return {
    isBalanced: unbalancedCurrencies.length === 0,
    currencies: unbalancedCurrencies
  };
}