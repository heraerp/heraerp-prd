import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check production environment variables
 * GET /api/v2/debug/env
 * 
 * Shows sanitized environment info for debugging
 */
export async function GET() {
  try {
    // Get environment info (sanitized for security)
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...',
      platform: process.platform,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };

    // Check if this is production deployment
    const isProd = process.env.NODE_ENV === 'production';
    const isVercel = !!process.env.VERCEL;
    const isRailway = !!process.env.RAILWAY_ENVIRONMENT;

    const deploymentInfo = {
      isProd,
      isVercel,
      isRailway,
      vercelEnv: process.env.VERCEL_ENV,
      railwayEnv: process.env.RAILWAY_ENVIRONMENT
    };

    return NextResponse.json({
      status: 'ok',
      environment: envInfo,
      deployment: deploymentInfo,
      message: 'Environment debug info (sanitized for security)'
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Environment debug failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}