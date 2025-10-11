import { NextResponse } from 'next/server'

// Keep this route as simple as possible:
export const runtime = 'nodejs'          // avoid Edge
export const dynamic = 'force-static'    // don't hit DB or env
export const revalidate = 0

export function GET() {
  return NextResponse.json({ ok: true }, { status: 200 })
}
