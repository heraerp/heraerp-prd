import { NextResponse } from 'next/server'
import { APP_VERSION } from '@/lib/constants/version'

export async function GET() {
  // Get version from constants file (source of truth)
  const version = APP_VERSION.current
  const buildDate = APP_VERSION.releaseDate
  
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