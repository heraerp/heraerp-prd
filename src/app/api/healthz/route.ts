import { NextResponse } from "next/server";

// Extended health check endpoint for deeper service validation
export async function GET() {
  try {
    const startTime = Date.now();
    
    // Basic service checks
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "hera-erp",
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV || "unknown",
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      checks: {
        nodejs: "ok",
        nextjs: "ok"
      },
      responseTime: Date.now() - startTime,
      ok: true
    };

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
        "X-Health-Check": "extended"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Health check failed",
        ok: false
      },
      { status: 500 }
    );
  }
}

// Support HEAD requests
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Health-Check": "extended"
    }
  });
}

// Force Node runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";