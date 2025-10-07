import { NextResponse } from 'next/server'
import { APP_VERSION } from '@/lib/constants/version'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const headers = new Headers()
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')
  headers.set('X-Build-Version', APP_VERSION.build)

  const commitSha =
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT ||
    null

  return NextResponse.json(
    {
      status: 'ok',
      api: 'v2',
      timestamp: new Date().toISOString(),
      version: {
        current: APP_VERSION.current,
        build: APP_VERSION.build,
        releaseDate: APP_VERSION.releaseDate,
        commitSha
      }
    },
    { headers }
  )
}

