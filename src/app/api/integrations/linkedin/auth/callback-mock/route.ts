import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode } from '@/lib/demo-guard'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get organization ID from header, body, or use CivicFlow default
    const orgId = request.headers.get('X-Organization-Id') 
      || body.organizationId 
      || CIVICFLOW_ORG_ID
      
    console.log('LinkedIn auth callback MOCK - orgId:', orgId)
    
    const isDemo = isDemoMode(orgId)

    // In demo mode, create mock connector
    if (isDemo || body.demo) {
      // Generate a mock connector ID
      const connectorId = `mock-connector-${Date.now()}`
      
      console.log('Created mock connector:', connectorId)
      
      // Return mock success response
      return NextResponse.json({
        success: true,
        connector_id: connectorId,
        demo: true,
        mock: true,
        message: 'Mock LinkedIn connection created successfully'
      })
    }

    // Production OAuth would be implemented here
    return NextResponse.json({ error: 'Production OAuth not implemented' }, { status: 501 })
    
  } catch (error: any) {
    console.error('LinkedIn auth error MOCK:', error)
    return NextResponse.json({ 
      error: 'Failed to authenticate with LinkedIn',
      details: error.message,
      mock: true
    }, { status: 500 })
  }
}