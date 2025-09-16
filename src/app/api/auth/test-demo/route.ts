import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Test API called')
    const body = await request.json()
    console.log('Request body:', body)
    
    return NextResponse.json({ success: true, message: 'Test successful', body })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ error: 'Test failed', details: error.message }, { status: 500 })
  }
}