import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

const PUBLIC_ROUTES = ['/salon', '/salon/auth']
const ROLE_ROUTES = {
  owner: ['/salon/dashboard'],
  receptionist: ['/salon/pos', '/salon/appointments1', '/salon/customers'],
  accountant: ['/salon/finance', '/salon/reports'],
  admin: ['/salon/settings', '/salon/users']
}

export async function salonAuthMiddleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return res
  }

  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session }
  } = await supabase.auth.getSession()

  // Redirect to auth if not authenticated
  if (!session) {
    return NextResponse.redirect(new URL('/salon/auth', req.url))
  }

  // Get user role from metadata
  const userRole = session.user.user_metadata?.role?.toLowerCase()
  const orgId = session.user.user_metadata?.organization_id

  // Check if user belongs to HairTalkz organization
  if (orgId !== HAIRTALKZ_ORG_ID) {
    return NextResponse.redirect(new URL('/salon/auth', req.url))
  }

  // If no role set, redirect to auth to select one
  if (!userRole) {
    return NextResponse.redirect(new URL('/salon/auth', req.url))
  }

  // Get allowed routes for user's role
  const allowedRoutes = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES] || []

  // Check if current path is allowed for user's role
  const isAllowed = allowedRoutes.some(route => pathname.startsWith(route))

  if (!isAllowed) {
    // Redirect to user's default route
    const defaultRoutes = {
      owner: '/salon/dashboard',
      receptionist: '/salon/pos',
      accountant: '/salon/finance',
      admin: '/salon/settings'
    }

    const defaultRoute = defaultRoutes[userRole as keyof typeof defaultRoutes]
    if (defaultRoute) {
      return NextResponse.redirect(new URL(defaultRoute, req.url))
    }
  }

  return res
}
