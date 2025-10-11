import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-static'
export const revalidate = 0

export async function GET() {
  return new NextResponse('OK', { status: 200 })
}
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
