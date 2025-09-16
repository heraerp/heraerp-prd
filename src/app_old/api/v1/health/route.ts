import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'HERA API Mock Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
}
