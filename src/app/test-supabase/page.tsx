'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestSupabasePage() {
  const [status, setStatus] = useState<{
    connected: boolean
    url: string | null
    error: string | null
  }>({
    connected: false,
    url: null,
    error: null
  })

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const supabase = createClient()
        if (!supabase) {
          setStatus({
            connected: false,
            url: null,
            error: 'Supabase client is null'
          })
          return
        }

        // Check if we can get the session
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()

        setStatus({
          connected: true,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured',
          error: error?.message || null
        })
      } catch (err) {
        setStatus({
          connected: false,
          url: null,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    checkSupabase()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Supabase Connection Test</h1>

      <div className="space-y-4">
        <div>
          <strong>Status:</strong>{' '}
          <span className={status.connected ? 'text-green-400' : 'text-red-400'}>
            {status.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div>
          <strong>Supabase URL:</strong>{' '}
          <code className="bg-gray-800 px-2 py-1 rounded">{status.url}</code>
        </div>

        <div>
          <strong>Mock Mode:</strong>{' '}
          <code className="bg-gray-800 px-2 py-1 rounded">
            {process.env.NEXT_PUBLIC_USE_MOCK === 'true' ? 'Enabled' : 'Disabled'}
          </code>
        </div>

        {status.error && (
          <div>
            <strong>Error:</strong> <span className="text-red-400">{status.error}</span>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Environment Variables</h2>
        <div className="space-y-2 text-sm">
          <div>
            <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
            <code className="bg-gray-800 px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✓' : 'Not set ✗'}
            </code>
          </div>
          <div>
            <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{' '}
            <code className="bg-gray-800 px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✓' : 'Not set ✗'}
            </code>
          </div>
          <div>
            <strong>NEXT_PUBLIC_USE_MOCK:</strong>{' '}
            <code className="bg-gray-800 px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_USE_MOCK || 'undefined'}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
