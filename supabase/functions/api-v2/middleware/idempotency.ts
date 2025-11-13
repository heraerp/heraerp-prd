// HERA v2.3 API Gateway - Idempotency Middleware
// Smart Code: HERA.API.V2.MIDDLEWARE.IDEMPOTENCY.v1

import type { 
  MiddlewareFunction, 
  Actor, 
  OrgContext, 
  RequestContext 
} from '../types/middleware.ts';
import { getFromCache, setInCache } from '../lib/cache.ts';
import { executeMiddleware } from './chain.ts';
import { generateSecureId } from '../lib/utils.ts';

interface IdempotencyRecord {
  requestId: string;
  actorId: string;
  orgId: string;
  method: string;
  path: string;
  bodyHash: string;
  response: any;
  responseStatus: number;
  timestamp: number;
  completed: boolean;
}

interface IdempotencyInfo {
  isIdempotent: boolean;
  key: string;
  isDuplicate: boolean;
  cachedResponse?: any;
  cachedStatus?: number;
}

/**
 * Idempotency middleware - prevents duplicate processing of identical requests
 */
export const idempotencyMiddleware: MiddlewareFunction<{ idempotency: IdempotencyInfo }> = async (req, context) => {
  return executeMiddleware('idempotency', async () => {
    const actor = (context as Partial<RequestContext>)?.actor;
    const orgContext = (context as Partial<RequestContext>)?.orgContext;
    
    if (!actor || !orgContext) {
      throw new Error('500:Auth and org-context middleware must run before idempotency middleware');
    }

    const method = req.method.toUpperCase();
    
    // 1. Check if this request type requires idempotency protection
    if (!requiresIdempotency(method, req.url)) {
      return {
        isIdempotent: false,
        key: '',
        isDuplicate: false
      } as IdempotencyInfo;
    }

    // 2. Extract or generate idempotency key
    const idempotencyKey = await extractIdempotencyKey(req, actor, orgContext);
    
    // 3. Check if this is a duplicate request
    const existingRecord = await getFromCache<IdempotencyRecord>(idempotencyKey);
    
    if (existingRecord) {
      // Duplicate request detected
      if (existingRecord.completed) {
        // Return cached response
        console.log(`[${context?.requestId?.slice(0, 8)}] Returning cached response for duplicate request: ${idempotencyKey.slice(-8)}`);
        
        return {
          isIdempotent: true,
          key: idempotencyKey,
          isDuplicate: true,
          cachedResponse: existingRecord.response,
          cachedStatus: existingRecord.responseStatus
        } as IdempotencyInfo;
      } else {
        // Request is still processing
        throw new Error('409:Duplicate request is still being processed. Please wait and retry.');
      }
    }

    // 4. Create new idempotency record (mark as in-progress)
    const newRecord: IdempotencyRecord = {
      requestId: context?.requestId || generateSecureId(),
      actorId: actor.id,
      orgId: orgContext.org_id,
      method,
      path: new URL(req.url).pathname,
      bodyHash: await hashRequestBody(req),
      response: null,
      responseStatus: 0,
      timestamp: Date.now(),
      completed: false
    };

    // Cache for 24 hours
    await setInCache(idempotencyKey, newRecord, 24 * 60 * 60);
    
    console.log(`[${context?.requestId?.slice(0, 8)}] Created idempotency record: ${idempotencyKey.slice(-8)}`);

    return {
      isIdempotent: true,
      key: idempotencyKey,
      isDuplicate: false
    } as IdempotencyInfo;
  }, context);
};

/**
 * Store response in idempotency cache
 */
export async function storeIdempotentResponse(
  idempotencyKey: string,
  response: any,
  status: number
): Promise<void> {
  const record = await getFromCache<IdempotencyRecord>(idempotencyKey);
  
  if (record) {
    record.response = response;
    record.responseStatus = status;
    record.completed = true;
    
    // Store for 24 hours
    await setInCache(idempotencyKey, record, 24 * 60 * 60);
  }
}

/**
 * Check if request method and endpoint require idempotency protection
 */
function requiresIdempotency(method: string, url: string): boolean {
  // Only protect write operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false;
  }
  
  const pathname = new URL(url).pathname.toLowerCase();
  
  // Protect financial transactions
  if (pathname.includes('/transactions')) {
    return true;
  }
  
  // Protect entity creation/updates
  if (pathname.includes('/entities')) {
    return true;
  }
  
  // Protect AI requests (can be expensive)
  if (pathname.includes('/ai/')) {
    return true;
  }
  
  // Don't protect read-only or health check endpoints
  if (pathname.includes('/health') || pathname.includes('/status')) {
    return false;
  }
  
  return true;
}

/**
 * Extract or generate idempotency key from request
 */
async function extractIdempotencyKey(
  req: Request,
  actor: Actor,
  orgContext: OrgContext
): Promise<string> {
  // 1. Check for explicit idempotency header
  const explicitKey = req.headers.get('Idempotency-Key') || req.headers.get('X-Idempotency-Key');
  
  if (explicitKey) {
    // Validate key format (should be UUID or similar)
    if (isValidIdempotencyKey(explicitKey)) {
      return `idempotency:explicit:${orgContext.org_id}:${explicitKey}`;
    } else {
      throw new Error('400:Invalid Idempotency-Key format. Use UUID or similar unique identifier.');
    }
  }
  
  // 2. Generate implicit key based on request content
  const method = req.method.toUpperCase();
  const path = new URL(req.url).pathname;
  const bodyHash = await hashRequestBody(req);
  
  // Create deterministic key based on actor, org, path, method, and content
  const keyComponents = [
    'idempotency',
    'implicit',
    orgContext.org_id,
    actor.id,
    method,
    path,
    bodyHash
  ];
  
  return keyComponents.join(':');
}

/**
 * Validate idempotency key format
 */
function isValidIdempotencyKey(key: string): boolean {
  // Allow UUIDs, nanoids, or other reasonable formats
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const nanoidPattern = /^[a-zA-Z0-9_-]{21}$/; // Standard nanoid length
  const generalPattern = /^[a-zA-Z0-9_-]{8,128}$/; // General alphanumeric with dashes/underscores
  
  return uuidPattern.test(key) || nanoidPattern.test(key) || generalPattern.test(key);
}

/**
 * Hash request body for content-based deduplication
 */
async function hashRequestBody(req: Request): Promise<string> {
  try {
    const body = await req.clone().text();
    if (!body) return 'empty';
    
    // Create simple hash of body content
    const encoder = new TextEncoder();
    const data = encoder.encode(body);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex.slice(0, 16); // Use first 16 chars for brevity
  } catch (error) {
    console.error('Error hashing request body:', error);
    return 'hash_error';
  }
}

/**
 * Get idempotency status for a key
 */
export async function getIdempotencyStatus(key: string): Promise<IdempotencyRecord | null> {
  return await getFromCache<IdempotencyRecord>(key);
}

/**
 * Clean up expired idempotency records (maintenance function)
 */
export async function cleanupIdempotencyCache(): Promise<{ cleaned: number }> {
  // In a real implementation, this would scan and clean expired records
  // For now, we rely on the cache TTL to handle cleanup automatically
  
  console.log('Idempotency cache cleanup triggered (handled by TTL)');
  
  return { cleaned: 0 };
}

/**
 * Generate idempotency key for client use
 */
export function generateIdempotencyKey(): string {
  return generateSecureId();
}