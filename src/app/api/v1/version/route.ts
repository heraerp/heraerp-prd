import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/constants/version';

export async function GET() {
  // Add cache control headers to prevent caching
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Type': 'application/json'
  };

  return NextResponse.json({
    version: APP_VERSION.current,
    build: APP_VERSION.build,
    releaseDate: APP_VERSION.releaseDate,
    features: APP_VERSION.features,
    timestamp: new Date().toISOString(), // Add timestamp to ensure fresh response
  }, { headers });
}