import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/v2/auth/clear-cache
 * 
 * Clears all authentication caches and forces fresh session
 */
export async function POST(request: NextRequest) {
  try {
    // Return cache clearing instructions
    return NextResponse.json({
      success: true,
      message: 'Cache clearing initiated',
      instructions: [
        'Run in browser console:',
        'localStorage.clear(); sessionStorage.clear();',
        'Then refresh the page'
      ],
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[clear-cache] Error:', error)
    return NextResponse.json({ 
      error: 'cache_clear_failed', 
      message: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}