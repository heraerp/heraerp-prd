import { NextResponse } from 'next/server'

export async function GET() {
  // Get version from environment or package.json
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toISOString()
  
  return NextResponse.json({
    version,
    buildDate,
    api: 'v1',
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    features: {
      multiTenant: true,
      universalArchitecture: true,
      currencySupport: true,
      progressivePWA: true,
      aiIntegration: true
    }
  })
}