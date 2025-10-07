import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const headers = new Headers()
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')

  const commitSha =
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT ||
    null

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: {
        build: process.env.npm_package_version || '0.0.0',
        commitSha
      },
      env: process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'development'
    },
    { headers }
  )
}

export async function HEAD() {
  return new Response(null, { status: 200 })
}
