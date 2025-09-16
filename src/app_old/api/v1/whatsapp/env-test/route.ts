import { NextResponse } from 'next/server'

export async function GET() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  // Check if they're placeholder values
  const isPlaceholder = supabaseUrl?.includes('placeholder')

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT
    },
    supabase: {
      url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
      hasServiceKey,
      isPlaceholder,
      urlFirstPart: supabaseUrl ? supabaseUrl.split('.')[0] : 'N/A'
    },
    allEnvKeys: Object.keys(process.env)
      .filter(
        key => key.includes('SUPABASE') || key.includes('RAILWAY') || key.includes('NEXT_PUBLIC')
      )
      .map(key => ({
        key,
        hasValue: !!process.env[key],
        length: process.env[key]?.length || 0
      }))
  })
}
