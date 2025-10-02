// HERA API v2 Server Utilities
// Enforces v2 contract at runtime with header and body validation

import { z } from 'zod'
import { NextResponse } from 'next/server'

export const v2HeaderName = 'x-hera-api-version'
export const v2HeaderValue = 'v2'

/**
 * Assert that a request has the required v2 header
 * Returns error response if invalid, null if valid
 */
export function assertV2(req: Request): Response | null {
  const h = req.headers.get(v2HeaderName)
  if (h !== v2HeaderValue) {
    const msg = `Missing/invalid ${v2HeaderName}. Expected "${v2HeaderValue}", got "${h || 'none'}".`
    console.warn(`[API v2] Header validation failed: ${msg}`)

    return new Response(
      JSON.stringify({
        error: msg,
        details: {
          required_header: v2HeaderName,
          expected_value: v2HeaderValue,
          received_value: h || null
        }
      }),
      {
        status: 426, // Upgrade Required
        headers: {
          'content-type': 'application/json',
          'x-hera-api-version-required': v2HeaderValue
        }
      }
    )
  }
  return null // valid
}

/**
 * Create a Zod schema that requires apiVersion: 'v2' in the body
 * @param shape Additional fields for the body schema
 */
export const v2Body = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object({
      apiVersion: z.literal('v2').describe('Required API version identifier')
    })
    .and(z.object(shape))

/**
 * Standard v2 response helper
 * Always includes the v2 header in responses
 */
export function v2Response(data: any, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers)
  headers.set(v2HeaderName, v2HeaderValue)
  headers.set('content-type', 'application/json')

  return NextResponse.json(data, { ...init, headers })
}

/**
 * Standard v2 error response
 */
export function v2Error(message: string, status: number = 400, details?: any): NextResponse {
  return v2Response(
    {
      error: message,
      details,
      timestamp: new Date().toISOString(),
      apiVersion: 'v2'
    },
    { status }
  )
}

/**
 * Parse and validate v2 request body
 * Returns parsed data or error response
 */
export async function parseV2Body<T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<{ data: T } | { error: Response }> {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return {
        error: v2Error('Validation failed', 400, {
          errors: parsed.error.flatten(),
          received: body
        })
      }
    }

    return { data: parsed.data }
  } catch (e) {
    return {
      error: v2Error('Invalid JSON body', 400, {
        message: e instanceof Error ? e.message : 'Parse error'
      })
    }
  }
}

/**
 * Log v2 API metrics (for observability)
 */
export function logV2Metrics(method: string, path: string, status: number, duration: number): void {
  console.log(
    JSON.stringify({
      type: 'api_request',
      version: 'v2',
      method,
      path,
      status,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    })
  )
}
