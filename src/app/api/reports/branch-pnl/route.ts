/**
 * Branch P&L Report API Route
 * Smart Code: HERA.API.REPORT.BRANCH.PNL.V1
 * 
 * Endpoints:
 * GET /api/reports/branch-pnl - Get branch P&L data
 * 
 * Query params:
 * - organization_id (required)
 * - branch_id (optional)
 * - from (optional) - ISO date
 * - to (optional) - ISO date
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBranchPnL, getBranchComparison } from '@/server/reports/branch-pnl'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Extract query parameters
    const organization_id = searchParams.get('organization_id')
    const branch_id = searchParams.get('branch_id') || undefined
    const date_from = searchParams.get('from') || undefined
    const date_to = searchParams.get('to') || undefined
    const comparison_mode = searchParams.get('comparison') === 'true'
    
    // Validate required params
    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }
    
    // Validate date formats if provided
    if (date_from && isNaN(Date.parse(date_from))) {
      return NextResponse.json(
        { error: 'Invalid date_from format. Use ISO date string.' },
        { status: 400 }
      )
    }
    
    if (date_to && isNaN(Date.parse(date_to))) {
      return NextResponse.json(
        { error: 'Invalid date_to format. Use ISO date string.' },
        { status: 400 }
      )
    }
    
    // Get branch P&L data
    if (comparison_mode) {
      // Multi-branch comparison mode
      const data = await getBranchComparison({
        organization_id,
        date_from,
        date_to
      })
      
      return NextResponse.json({
        success: true,
        data,
        params: {
          organization_id,
          date_from,
          date_to,
          mode: 'comparison'
        }
      })
    } else {
      // Standard P&L mode
      const data = await getBranchPnL({
        organization_id,
        branch_id,
        date_from,
        date_to
      })
      
      return NextResponse.json({
        success: true,
        data,
        params: {
          organization_id,
          branch_id,
          date_from,
          date_to,
          mode: 'standard'
        }
      })
    }
    
  } catch (error) {
    console.error('Branch P&L API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate branch P&L report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}