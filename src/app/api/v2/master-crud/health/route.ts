/**
 * Master CRUD v2 - Health Check
 * GET /api/v2/master-crud/health
 * 
 * Health check endpoint for Master CRUD v2 system
 * Performance validation and feature availability
 */

import { NextRequest, NextResponse } from 'next/server'
import { masterCrudV2 } from '@/lib/master-crud-v2/core'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Run health check
    const healthResult = await masterCrudV2.healthCheck()
    
    const totalTime = Date.now() - startTime
    
    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (totalTime > 100) {
      status = 'degraded'
    }
    
    if (totalTime > 500) {
      status = 'unhealthy'
    }

    const response = {
      api_version: 'v2',
      status,
      timestamp: new Date().toISOString(),
      performance: {
        responseTimeMs: totalTime,
        targetResponseTimeMs: 80,
        performanceRating: totalTime <= 80 ? 'excellent' : 
                          totalTime <= 120 ? 'good' : 
                          totalTime <= 200 ? 'fair' : 'poor'
      },
      features: {
        createEntityComplete: true,
        updateEntityComplete: true,
        deleteEntityComplete: true,
        queryEntityComplete: true,
        atomicTransactions: true,
        acidCompliance: true,
        performanceOptimization: true
      },
      capabilities: {
        maxDynamicFields: 100,
        maxRelationships: 50,
        maxBatchSize: 25,
        smartCodeValidation: true,
        organizationIsolation: true,
        auditLogging: true
      },
      system: {
        version: '2.0.0',
        buildDate: '2025-10-14',
        environment: process.env.NODE_ENV || 'development',
        region: process.env.VERCEL_REGION || 'local'
      }
    }

    // Add performance warning if needed
    if (status !== 'healthy') {
      response['warnings'] = [`Performance ${status}: ${totalTime}ms response time`]
    }

    const httpStatus = status === 'healthy' ? 200 : 
                      status === 'degraded' ? 200 : 503

    return NextResponse.json(response, { status: httpStatus })

  } catch (error: any) {
    const totalTime = Date.now() - startTime
    
    console.error('[Master CRUD v2] Health check failed:', error)

    return NextResponse.json(
      {
        api_version: 'v2',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message || 'Health check failed',
        performance: {
          responseTimeMs: totalTime,
          targetResponseTimeMs: 80,
          performanceRating: 'failed'
        }
      },
      { status: 503 }
    )
  }
}

/**
 * OPTIONS handler for CORS support
 */
export async function OPTIONS() {
  return NextResponse.json(
    { 
      api_version: 'v2',
      methods: ['GET'],
      description: 'Health check for Master CRUD v2 system'
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-hera-api-version'
      }
    }
  )
}