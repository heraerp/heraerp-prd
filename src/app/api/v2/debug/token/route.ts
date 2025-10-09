import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-auth'

/**
 * Debug endpoint to see what's in your JWT token
 * GET /api/v2/debug/token
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult) {
      return NextResponse.json(
        {
          error: 'No auth result',
          hasAuthHeader: !!request.headers.get('authorization')
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      userId: authResult.id,
      email: authResult.email,
      organizationId: authResult.organizationId,
      roles: authResult.roles,
      permissions: authResult.permissions,
      hasOrganizationId: !!authResult.organizationId
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Debug failed',
        message: error.message
      },
      { status: 500 }
    )
  }
}
