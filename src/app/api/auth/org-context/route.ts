import { NextRequest, NextResponse } from 'next/server'

// If you seed a demo org, put it here for instant resolution
const DEMO_ORG_ID = process.env.DEMO_ORG_ID || ''

export async function GET(req: NextRequest) {
  try {
    console.log('[org-context] Checking for organization...')
    
    // 1) cookie?
    const cookieOrg = req.cookies.get('HERA_ORG_ID')?.value
    if (cookieOrg) {
      console.log('[org-context] Found organization in HERA_ORG_ID cookie:', cookieOrg)
      return NextResponse.json({ 
        organization: { 
          id: cookieOrg,
          name: 'Hair Talkz Salon (Demo)',
          type: 'salon',
          industry: 'beauty_services'
        } 
      })
    }

    // 2) ask Playbook for this user's orgs (adapt to your membership model)
    // If you track org membership in Playbook, query relationships here.
    // For now, just use DEMO fallback:
    if (DEMO_ORG_ID) {
      console.log('[org-context] Using DEMO_ORG_ID from environment:', DEMO_ORG_ID)
      return NextResponse.json({ 
        organization: { 
          id: DEMO_ORG_ID, 
          name: 'Hair Talkz Salon (Demo)',
          type: 'salon',
          industry: 'beauty_services'
        } 
      })
    }

    // 3) Try to find a demo organization from the session
    const sessionCookie = req.cookies.get('hera-demo-session')?.value
    console.log('[org-context] Checking demo session cookie:', sessionCookie ? 'found' : 'not found')
    if (sessionCookie) {
      try {
        const decodedCookie = decodeURIComponent(sessionCookie)
        const sessionData = JSON.parse(decodedCookie)
        console.log('[org-context] Session data organization_id:', sessionData.organization_id)
        if (sessionData.organization_id) {
          console.log('[org-context] Found organization in session:', sessionData.organization_id)
          
          // Also set the HERA_ORG_ID cookie for next time
          const response = NextResponse.json({
            organization: {
              id: sessionData.organization_id,
              name: 'Hair Talkz Salon (Demo)',
              type: 'salon',
              industry: 'beauty_services'
            }
          })
          
          // Set the cookie so next time we find it faster
          response.cookies.set('HERA_ORG_ID', sessionData.organization_id, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/'
          })
          
          return response
        }
      } catch (e) {
        console.error('[org-context] Failed to parse session cookie:', e)
      }
    }

    // 4) last resort: could query Playbook for organizations
    // const orgs = await fetch(...).then(r=>r.json());
    // if (orgs.items?.[0]) return NextResponse.json({ organization: orgs.items[0] });

    console.error('[org-context] No organization found for user')
    return NextResponse.json({ error: 'No organization available' }, { status: 404 })
  } catch (e: any) {
    console.error('[org-context] Error:', e)
    return NextResponse.json({ error: e?.message || 'org-context failed' }, { status: 500 })
  }
}