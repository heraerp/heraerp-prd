'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Scissors } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { api, heraApi } from '@/lib/api'

interface HealthState {
  ready: boolean
  error?: string
  details?: any
  loading: boolean
}

/**
 * Fail-fast dashboard that prevents infinite loading
 * Tests Bearer authentication and API connectivity before loading full dashboard
 */
export default function FailFastDashboard() {
  const router = useRouter()
  const [health, setHealth] = useState<HealthState>({ ready: false, loading: true })
  const [lastTest, setLastTest] = useState<Date>(new Date())

  const runHealthChecks = async () => {
    setHealth({ ready: false, loading: true })
    
    try {
      console.log('🔧 Running fail-fast health checks...')
      
      // Test 1: Bearer token API connectivity
      console.log('🔧 Testing Bearer API connectivity...')
      const sessionResult = await heraApi.health()
      console.log('✅ Session API result:', sessionResult)
      
      // Test 2: Bearer authentication test
      console.log('🔧 Testing Bearer authentication...')
      const bearerResult = await heraApi.bearerTest()
      console.log('✅ Bearer test result:', bearerResult)
      
      // Test 3: User resolution
      console.log('🔧 Testing user resolution...')
      const userResult = await heraApi.resolveUser()
      console.log('✅ User resolution result:', userResult)
      
      setHealth({ 
        ready: true, 
        loading: false,
        details: {
          session: sessionResult,
          bearer: bearerResult,
          user: userResult
        }
      })
      setLastTest(new Date())
      
    } catch (error: any) {
      console.error('❌ Health check failed:', error)
      setHealth({ 
        ready: false, 
        loading: false,
        error: error?.message || 'Unknown error',
        details: error
      })
    }
  }

  useEffect(() => {
    runHealthChecks()
  }, [])

  // Loading state
  if (health.loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <div className="text-center">
          <div className="relative inline-block">
            <Loader2
              className="h-12 w-12 animate-spin"
              style={{ color: LUXE_COLORS.gold }}
            />
            <div
              className="absolute inset-0 blur-xl opacity-50"
              style={{ background: LUXE_COLORS.gold }}
            />
          </div>
          <p className="mt-4 text-lg font-medium" style={{ color: LUXE_COLORS.bronze }}>
            Testing Bearer authentication...
          </p>
          <p className="mt-2 text-sm" style={{ color: LUXE_COLORS.bronze }}>
            This should complete in 5-10 seconds
          </p>
        </div>
      </div>
    )
  }

  // Error state with diagnostics
  if (!health.ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <Card
          className="max-w-2xl w-full border-0"
          style={{ backgroundColor: LUXE_COLORS.charcoalLight }}
        >
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <AlertCircle className="h-16 w-16 mx-auto mb-4" style={{ color: LUXE_COLORS.ruby }} />
              <h2 className="text-2xl font-bold mb-2" style={{ color: LUXE_COLORS.gold }}>
                🚨 Dashboard Health Check Failed
              </h2>
              <p className="text-lg" style={{ color: LUXE_COLORS.bronze }}>
                Bearer authentication is not working properly
              </p>
            </div>

            {/* Error details */}
            <div className="space-y-4 mb-6">
              <div
                className="p-4 rounded-lg border"
                style={{ 
                  backgroundColor: LUXE_COLORS.charcoalDark,
                  border: `1px solid ${LUXE_COLORS.ruby}30`
                }}
              >
                <h3 className="font-semibold mb-2" style={{ color: LUXE_COLORS.ruby }}>
                  Error Details:
                </h3>
                <pre className="text-sm whitespace-pre-wrap" style={{ color: LUXE_COLORS.bronze }}>
                  {health.error || 'Unknown error occurred'}
                </pre>
              </div>

              {health.details && (
                <details
                  className="p-4 rounded-lg border cursor-pointer"
                  style={{ 
                    backgroundColor: LUXE_COLORS.charcoalDark,
                    border: `1px solid ${LUXE_COLORS.bronze}30`
                  }}
                >
                  <summary className="font-semibold" style={{ color: LUXE_COLORS.bronze }}>
                    Technical Details
                  </summary>
                  <pre className="text-xs mt-2 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(health.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={runHealthChecks}
                className="px-6 py-3"
                style={{
                  backgroundColor: LUXE_COLORS.emerald,
                  color: LUXE_COLORS.charcoal
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Health Check
              </Button>
              
              <Button
                onClick={() => router.push('/salon/auth')}
                variant="outline"
                className="px-6 py-3"
                style={{
                  borderColor: LUXE_COLORS.gold,
                  color: LUXE_COLORS.gold
                }}
              >
                Back to Login
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                Last test: {lastTest.toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state - ready to load full dashboard
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: LUXE_COLORS.charcoal }}
    >
      <Card
        className="max-w-2xl w-full border-0"
        style={{ backgroundColor: LUXE_COLORS.charcoalLight }}
      >
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: LUXE_COLORS.emerald }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: LUXE_COLORS.gold }}>
            ✅ Bearer Authentication Working!
          </h2>
          <p className="text-lg mb-6" style={{ color: LUXE_COLORS.bronze }}>
            All health checks passed. Ready to load the full dashboard.
          </p>

          {/* Success details */}
          {health.details && (
            <details
              className="p-4 rounded-lg border cursor-pointer mb-6 text-left"
              style={{ 
                backgroundColor: LUXE_COLORS.charcoalDark,
                border: `1px solid ${LUXE_COLORS.emerald}30`
              }}
            >
              <summary className="font-semibold" style={{ color: LUXE_COLORS.emerald }}>
                Authentication Details
              </summary>
              <pre className="text-xs mt-2 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(health.details, null, 2)}
              </pre>
            </details>
          )}

          <div className="space-y-4">
            <Button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3"
              style={{
                backgroundColor: LUXE_COLORS.gold,
                color: LUXE_COLORS.charcoal
              }}
            >
              <Scissors className="w-4 h-4 mr-2" />
              Load Full Dashboard
            </Button>

            <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
              The authentication system is working. You can now use the original dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}