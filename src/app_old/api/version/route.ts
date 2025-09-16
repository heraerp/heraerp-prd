import { NextResponse } from 'next/server'
import { APP_VERSION } from '@/lib/constants/version'

export const dynamic = 'force-dynamic' // Always fetch fresh
export const revalidate = 0 // No caching

export async function GET() {
  // Add cache-busting headers
  const headers = new Headers()
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')
  headers.set('X-Build-Version', APP_VERSION.build)

  return NextResponse.json(
    {
      version: APP_VERSION.build,
      releaseDate: APP_VERSION.releaseDate,
      timestamp: new Date().toISOString()
    },
    { headers }
  )
}
