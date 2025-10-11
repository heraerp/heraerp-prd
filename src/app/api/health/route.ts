import { NextResponse } from 'next/server'

export const runtime = 'nodejs'          // avoid Edge/middleware surprises
export const dynamic = 'force-static'    // don't pull in server deps
export const revalidate = 0              // no caching by ISR

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 })
}
