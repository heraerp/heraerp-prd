import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Zod validation schema
const PartnerApplicationSchema = z.object({
  firmName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  region: z.enum(['EMEA', 'APAC', 'Americas', 'Global']),
  city: z.string().optional(),
  partnerType: z.enum(['Implementation', 'Channel', 'Technology']),
  message: z.string().min(10),
  honeypot: z.string().optional()
})

// Rate limiting storage (in-memory for simplicity)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes
const RATE_LIMIT_MAX = 3 // 3 requests per window

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }
}, 60 * 1000) // Clean every minute

function getClientIP(request: NextRequest): string {
  // Try to get real IP from headers (for proxied requests)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default
  return 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false // Rate limit exceeded
  }

  // Increment count
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Honeypot check - if filled, it's likely a bot
    if (body.honeypot && body.honeypot.length > 0) {
      // Return 204 No Content silently for bots
      return new NextResponse(null, { status: 204 })
    }

    // Rate limiting check
    const clientIP = getClientIP(request)
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
    }

    // Validate the request body
    const result = PartnerApplicationSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'validation_failed',
          details: result.error.issues
        },
        { status: 400 }
      )
    }

    // Clean data (remove honeypot field)
    const { honeypot, ...cleanData } = result.data

    // TODO: Wire to CRM/lead intake system
    // Log compact line for monitoring
    console.log(
      '[PARTNER_APPLICATION]',
      JSON.stringify({
        firmName: cleanData.firmName,
        contactName: cleanData.contactName,
        email: cleanData.email,
        region: cleanData.region,
        partnerType: cleanData.partnerType,
        timestamp: new Date().toISOString(),
        ip: clientIP
      })
    )

    // In production, this would:
    // 1. Save to database with sanitized data
    // 2. Send notification to partner team
    // 3. Create lead in CRM system
    // 4. Send confirmation email to applicant
    // 5. Track analytics event

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PARTNER_APPLICATION_ERROR]', error)
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 })
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 })
}
