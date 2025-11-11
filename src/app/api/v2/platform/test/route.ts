import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Platform API test endpoint working',
    timestamp: new Date().toISOString()
  })
}