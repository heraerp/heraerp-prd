import { NextRequest, NextResponse } from 'next/server'

// Minimal v2 org-context used by HERAAuthProvider during demo sessions
export async function GET(req: NextRequest) {
  try {
    // Prefer explicit cookie set by demo/session flows
    const cookieOrg = req.cookies.get('HERA_ORG_ID')?.value
    if (cookieOrg) {
      return NextResponse.json({
        organization: {
          id: cookieOrg,
          name: 'Hair Talkz Salon (Demo)',
          type: 'salon',
          industry: 'beauty_services'
        }
      })
    }

    // Fallback to demo session cookie if present
    const sessionCookie = req.cookies.get('hera-demo-session')?.value
    if (sessionCookie) {
      try {
        const decoded = decodeURIComponent(sessionCookie)
        const session = JSON.parse(decoded)
        if (session?.organization_id) {
          const res = NextResponse.json({
            organization: {
              id: session.organization_id,
              name: 'Hair Talkz Salon (Demo)',
              type: 'salon',
              industry: 'beauty_services'
            }
          })
          // Cache for next time
          res.cookies.set('HERA_ORG_ID', session.organization_id, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365,
            path: '/'
          })
          return res
        }
      } catch (_) {}
    }

    return NextResponse.json({ error: 'No organization available' }, { status: 404 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'org-context failed' }, { status: 500 })
  }
}
