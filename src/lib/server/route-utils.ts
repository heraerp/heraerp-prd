/**
 * Server Route Utilities
 * Common utilities for API route handlers
 */

import { NextRequest } from 'next/server'

/**
 * Validates that a request is using the V2 API format
 */
export function assertV2(request: NextRequest): void {
  const organizationId = request.headers.get('x-organization-id')
  if (!organizationId) {
    throw new Error('Organization ID required for V2 API')
  }
}

/**
 * Extracts and validates the request body for V2 API
 */
export async function v2Body<T = any>(request: NextRequest): Promise<T & { organization_id: string }> {
  const body = await request.json()
  const organizationId = request.headers.get('x-organization-id')
  
  if (!organizationId) {
    throw new Error('Organization ID required for V2 API')
  }
  
  return {
    ...body,
    organization_id: organizationId
  }
}