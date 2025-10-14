import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({ message: 'CivicFlow demo endpoint' })
  } catch (error) {
    console.error('[CivicFlow Demo] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
