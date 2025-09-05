import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const result = {
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
      url_preview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 40) + '...'
    },
    tests: []
  }

  // Test 1: Direct fetch to Supabase
  try {
    const testUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_organizations?select=id&limit=1`
    const response = await fetch(testUrl, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`
      }
    })
    
    result.tests.push({
      name: 'Direct Fetch Test',
      success: response.ok,
      status: response.status,
      statusText: response.statusText
    })
  } catch (error: any) {
    result.tests.push({
      name: 'Direct Fetch Test',
      success: false,
      error: error.message,
      cause: error.cause
    })
  }

  // Test 2: Supabase Client
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false
          }
        }
      )

      const { data, error } = await supabase
        .from('core_organizations')
        .select('id')
        .limit(1)

      result.tests.push({
        name: 'Supabase Client Test',
        success: !error,
        data: data?.length || 0,
        error: error?.message || null
      })
    }
  } catch (error: any) {
    result.tests.push({
      name: 'Supabase Client Test',
      success: false,
      error: error.message
    })
  }

  // Test 3: Node.js fetch capabilities
  result.nodeInfo = {
    version: process.version,
    platform: process.platform,
    arch: process.arch
  }

  return NextResponse.json(result, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}