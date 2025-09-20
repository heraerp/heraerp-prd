/**
 * HERA Playbooks Health Check API
 * 
 * Provides system health status for the playbooks system
 * including authentication, smart codes, and data layer status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlaybooksHealth } from '@/lib/playbooks';

export async function GET(request: NextRequest) {
  try {
    const health = getPlaybooksHealth();
    
    // Determine overall status
    const status = health.overall === 'healthy' ? 200 : 206; // 206 = Partial Content
    
    return NextResponse.json({
      status: health.overall,
      timestamp: new Date().toISOString(),
      version: health.version,
      buildDate: health.buildDate,
      components: {
        authentication: {
          status: health.authentication.enabled ? 'enabled' : 'disabled',
          authenticated: health.authentication.authenticated,
          organizationId: health.authentication.organizationId,
          userId: health.authentication.user
        },
        smartCodes: {
          status: health.smartCodes.enabled ? 'enabled' : 'disabled',
          templatesCount: health.smartCodes.templates,
          validator: health.smartCodes.validator
        },
        dataLayer: {
          status: health.dataLayer.enabled ? 'enabled' : 'disabled',
          organizationContext: health.dataLayer.organizationContext,
          universalApiConnected: health.dataLayer.universalApiConnected
        }
      },
      capabilities: [
        'authentication',
        'organization-isolation',
        'smart-code-generation',
        'smart-code-validation',
        'six-table-data-access',
        'typed-interfaces',
        'permission-system'
      ],
      endpoints: {
        authentication: '/api/v1/playbooks/auth',
        smartCodes: '/api/v1/playbooks/smart-codes',
        data: '/api/v1/playbooks/data',
        health: '/api/v1/playbooks/health'
      }
    }, { status });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}