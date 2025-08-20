import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.2.1',
      environment: process.env.NODE_ENV,
      checks: {
        app: 'ok',
        supabase: 'checking',
        memory: 'ok'
      }
    };

    // Check Supabase connection if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // Simple query to test connection
        const { error } = await supabase
          .from('core_organizations')
          .select('count')
          .limit(1);
          
        checks.checks.supabase = error ? 'error' : 'ok';
      } catch (err) {
        checks.checks.supabase = 'error';
      }
    } else {
      checks.checks.supabase = 'not_configured';
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 1024 * 1024 * 1024; // 1GB
    checks.checks.memory = memoryUsage.heapUsed < memoryThreshold ? 'ok' : 'warning';

    // Overall health status
    const hasErrors = Object.values(checks.checks).includes('error');
    const hasWarnings = Object.values(checks.checks).includes('warning');
    
    if (hasErrors) {
      checks.status = 'unhealthy';
    } else if (hasWarnings) {
      checks.status = 'degraded';
    }

    return NextResponse.json(checks, {
      status: hasErrors ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}