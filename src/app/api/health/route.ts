import { NextResponse } from "next/server";

// Fast, dependency-free health check per Railway documentation
export async function GET() {
  try {
    return NextResponse.json(
      { 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        service: "hera-erp",
        ok: true 
      }, 
      { 
        status: 200, 
        headers: { 
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        status: "unhealthy", 
        error: "Health check failed",
        ok: false 
      }, 
      { status: 500 }
    );
  }
}

// Support HEAD requests for health checks
export async function HEAD() {
  return new Response(null, { 
    status: 200, 
    headers: { 
      "Cache-Control": "no-store, no-cache, must-revalidate" 
    }
  });
}

// Force Node runtime to prevent Edge runtime issues
export const runtime = "nodejs";
export const dynamic = "force-dynamic";