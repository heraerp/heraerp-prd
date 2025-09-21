import { NextRequest, NextResponse } from 'next/server'
import { validateSmartCodeWithDetails } from '@/lib/dna/utils/smartCodeValidator'

/**
 * Middleware to validate smart codes in API requests
 * Ensures all entities/transactions follow HERA DNA pattern
 */
export function validateSmartCodeMiddleware(request: NextRequest): NextResponse | null {
  // Only check POST/PUT requests with JSON body
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
    return null
  }

  // Parse request body
  const contentType = request.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    return null
  }

  try {
    // Clone request to read body
    const body = request.body ? JSON.parse(request.body) : {}

    // Check for smart_code in request
    if (body.smart_code) {
      const validation = validateSmartCodeWithDetails(body.smart_code)

      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: 'Invalid smart code',
            details: validation.errors,
            suggestions: validation.suggestions,
            smartCodeGuide: '/docs/playbooks/_shared/SMART_CODE_GUIDE.md'
          },
          { status: 400 }
        )
      }

      // Auto-normalize if needed
      if (validation.normalized && validation.normalized !== body.smart_code) {
        console.warn(`Smart code normalized: ${body.smart_code} → ${validation.normalized}`)
        // Note: In real middleware, you'd need to modify the request
      }
    }

    // Check for nested smart codes in arrays
    if (body.lines && Array.isArray(body.lines)) {
      for (const line of body.lines) {
        if (line.smart_code) {
          const validation = validateSmartCodeWithDetails(line.smart_code)
          if (!validation.isValid) {
            return NextResponse.json(
              {
                error: `Invalid smart code in line: ${line.smart_code}`,
                details: validation.errors,
                suggestions: validation.suggestions,
                smartCodeGuide: '/docs/playbooks/_shared/SMART_CODE_GUIDE.md'
              },
              { status: 400 }
            )
          }
        }
      }
    }
  } catch (error) {
    // If body parsing fails, let request continue
    console.error('Smart code validation error:', error)
  }

  return null
}
