// Railway-recommended simple health endpoint for App Router
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[HEALTH]', new Date().toISOString(), 'App Router health check')
  
  return NextResponse.json({ 
    ok: true,
    timestamp: new Date().toISOString(),
    router: 'app'
  })
}