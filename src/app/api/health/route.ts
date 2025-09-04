import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple health check without any external dependencies
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.2.1',
      environment: process.env.NODE_ENV || 'production',
    };

    return NextResponse.json(checks, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    // Even if there's an error, return a basic 200 response for health check
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}