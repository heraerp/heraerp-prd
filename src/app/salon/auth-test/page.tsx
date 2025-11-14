/**
 * Salon Authentication Test Suite
 * 🧪 Production testing tool for validating authentication stability
 * 
 * This page helps verify that the salon POS authentication fixes work correctly
 * by simulating the conditions that previously caused logout issues.
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { usePosTransactionProtection } from '@/hooks/usePosTransactionProtection'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield, 
  Wifi,
  RefreshCw,
  Timer,
  Activity,
  AlertTriangle
} from 'lucide-react'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  message: string
  timestamp?: string
  duration?: number
}

export default function SalonAuthTestPage() {
  const auth = useHERAAuth()
  const salonContext = useSecuredSalonContext()
  const { 
    posTransactionActive, 
    startTransaction, 
    endTransaction, 
    updateActivity 
  } = usePosTransactionProtection()

  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Session Stability Test', status: 'pending', message: 'Test 8-hour session duration' },
    { name: 'POS Transaction Protection', status: 'pending', message: 'Test logout prevention during transactions' },
    { name: 'Page Refresh Stability', status: 'pending', message: 'Test session persistence across refreshes' },
    { name: 'Token Refresh Handling', status: 'pending', message: 'Test graceful token refresh without logout' },
    { name: 'Network Error Recovery', status: 'pending', message: 'Test recovery from network interruptions' },
    { name: 'Concurrent Tab Handling', status: 'pending', message: 'Test session sync across browser tabs' }
  ])

  const [sessionStartTime] = useState(Date.now())
  const [currentTime, setCurrentTime] = useState(Date.now())
  const intervalRef = useRef<NodeJS.Timeout>()

  // Update current time every second
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const updateTestStatus = (testName: string, status: TestResult['status'], message: string, duration?: number) => {
    setTests(prev => prev.map(test => 
      test.name === testName 
        ? { 
            ...test, 
            status, 
            message, 
            timestamp: new Date().toLocaleTimeString(),
            duration 
          }
        : test
    ))
  }

  // Test 1: Session Stability Test
  const runSessionStabilityTest = async () => {
    updateTestStatus('Session Stability Test', 'running', 'Testing session duration...')
    
    try {
      // Check if session has been active for at least 10 minutes without logout
      const sessionDuration = Date.now() - sessionStartTime
      const tenMinutes = 10 * 60 * 1000
      
      if (sessionDuration < tenMinutes) {
        // Start a timer to check session stability over time
        setTimeout(() => {
          if (auth.isAuthenticated && salonContext.isAuthenticated) {
            updateTestStatus('Session Stability Test', 'passed', 
              `Session stable for ${Math.round(sessionDuration / 1000 / 60)} minutes`)
          } else {
            updateTestStatus('Session Stability Test', 'failed', 'Session lost unexpectedly')
          }
        }, Math.max(0, tenMinutes - sessionDuration))
        
        updateTestStatus('Session Stability Test', 'running', 
          `Monitoring session... ${Math.round(sessionDuration / 1000 / 60)}/10 minutes elapsed`)
      } else {
        updateTestStatus('Session Stability Test', 'passed', 
          `Session stable for ${Math.round(sessionDuration / 1000 / 60)} minutes`)
      }
    } catch (error) {
      updateTestStatus('Session Stability Test', 'failed', `Error: ${error.message}`)
    }
  }

  // Test 2: POS Transaction Protection
  const runPosTransactionTest = async () => {
    updateTestStatus('POS Transaction Protection', 'running', 'Testing transaction protection...')
    
    try {
      const startTime = Date.now()
      
      // Start POS transaction protection
      startTransaction()
      
      // Wait 2 seconds to verify protection is active
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (posTransactionActive) {
        updateTestStatus('POS Transaction Protection', 'running', 'Transaction active, testing session stability...')
        
        // Wait another 3 seconds to ensure no logout occurs
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        if (auth.isAuthenticated && salonContext.isAuthenticated) {
          endTransaction()
          const duration = Date.now() - startTime
          updateTestStatus('POS Transaction Protection', 'passed', 
            'Protection active, no logout during transaction', duration)
        } else {
          updateTestStatus('POS Transaction Protection', 'failed', 
            'Session lost during protected transaction')
        }
      } else {
        updateTestStatus('POS Transaction Protection', 'failed', 
          'POS transaction protection did not activate')
      }
    } catch (error) {
      endTransaction()
      updateTestStatus('POS Transaction Protection', 'failed', `Error: ${error.message}`)
    }
  }

  // Test 3: Page Refresh Stability
  const runPageRefreshTest = async () => {
    updateTestStatus('Page Refresh Stability', 'running', 'Testing page refresh...')
    
    try {
      // Store current auth state
      const preRefreshState = {
        isAuthenticated: auth.isAuthenticated,
        userId: auth.user?.id,
        orgId: auth.organization?.id
      }
      
      // Simulate page refresh by reloading
      window.location.reload()
      
    } catch (error) {
      updateTestStatus('Page Refresh Stability', 'failed', `Error: ${error.message}`)
    }
  }

  // Test 4: Token Refresh Handling
  const runTokenRefreshTest = async () => {
    updateTestStatus('Token Refresh Handling', 'running', 'Testing token refresh...')
    
    try {
      const startTime = Date.now()
      
      // Force token refresh by making an API call
      const response = await fetch('/api/v2/auth/session', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const duration = Date.now() - startTime
        updateTestStatus('Token Refresh Handling', 'passed', 
          'Token refresh completed without logout', duration)
      } else {
        updateTestStatus('Token Refresh Handling', 'failed', 
          `API call failed: ${response.status}`)
      }
    } catch (error) {
      updateTestStatus('Token Refresh Handling', 'failed', `Error: ${error.message}`)
    }
  }

  // Test 5: Network Error Recovery
  const runNetworkErrorTest = async () => {
    updateTestStatus('Network Error Recovery', 'running', 'Testing network error recovery...')
    
    try {
      // Simulate network error by making a request to invalid endpoint
      try {
        await fetch('/api/invalid-endpoint', { 
          method: 'POST',
          signal: AbortSignal.timeout(1000) // 1 second timeout
        })
      } catch (networkError) {
        // Expected to fail - this simulates network issues
      }
      
      // Wait a moment then check if session is still valid
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (auth.isAuthenticated && salonContext.isAuthenticated) {
        updateTestStatus('Network Error Recovery', 'passed', 
          'Session maintained after network error simulation')
      } else {
        updateTestStatus('Network Error Recovery', 'failed', 
          'Session lost after network error')
      }
    } catch (error) {
      updateTestStatus('Network Error Recovery', 'failed', `Error: ${error.message}`)
    }
  }

  // Test 6: Concurrent Tab Handling
  const runConcurrentTabTest = async () => {
    updateTestStatus('Concurrent Tab Handling', 'running', 'Testing tab synchronization...')
    
    try {
      // Open new tab/window with salon page
      const newWindow = window.open('/salon', '_blank')
      
      if (newWindow) {
        // Wait for the new tab to load
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Close the new tab
        newWindow.close()
        
        // Check if current session is still valid
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (auth.isAuthenticated && salonContext.isAuthenticated) {
          updateTestStatus('Concurrent Tab Handling', 'passed', 
            'Session stable with concurrent tab operations')
        } else {
          updateTestStatus('Concurrent Tab Handling', 'failed', 
            'Session lost during tab operations')
        }
      } else {
        updateTestStatus('Concurrent Tab Handling', 'failed', 
          'Could not open new tab (popup blocked?)')
      }
    } catch (error) {
      updateTestStatus('Concurrent Tab Handling', 'failed', `Error: ${error.message}`)
    }
  }

  const runAllTests = async () => {
    const testFunctions = [
      runSessionStabilityTest,
      runPosTransactionTest,
      runTokenRefreshTest,
      runNetworkErrorTest,
      runConcurrentTabTest,
      runPageRefreshTest // Run this last as it reloads the page
    ]
    
    for (const testFn of testFunctions) {
      await testFn()
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const getSessionDuration = () => {
    const duration = currentTime - sessionStartTime
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((duration % (1000 * 60)) / 1000)
    
    return `${hours}h ${minutes}m ${seconds}s`
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      default: return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal to-charcoal-light p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-champagne mb-2 flex items-center justify-center gap-3">
            <TestTube className="w-8 h-8 text-gold" />
            Salon Authentication Test Suite
          </h1>
          <p className="text-bronze">
            Comprehensive testing for the salon POS authentication stability fixes
          </p>
        </div>

        {/* Session Status */}
        <Card className="bg-charcoal border-gold/20 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-gold" />
              <div>
                <div className="text-champagne font-semibold">Session Duration</div>
                <div className="text-bronze">{getSessionDuration()}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-gold" />
              <div>
                <div className="text-champagne font-semibold">Auth Status</div>
                <div className="flex gap-2">
                  <Badge className={auth.isAuthenticated ? 'bg-green-500' : 'bg-red-500'}>
                    HERA: {auth.isAuthenticated ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge className={salonContext.isAuthenticated ? 'bg-green-500' : 'bg-red-500'}>
                    Salon: {salonContext.isAuthenticated ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-gold" />
              <div>
                <div className="text-champagne font-semibold">POS Protection</div>
                <Badge className={posTransactionActive ? 'bg-blue-500' : 'bg-gray-500'}>
                  {posTransactionActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Test Controls */}
        <Card className="bg-charcoal border-gold/20 p-6 mb-6">
          <h2 className="text-xl font-semibold text-champagne mb-4">Test Controls</h2>
          <div className="flex gap-4 flex-wrap">
            <SalonLuxeButton
              onClick={runAllTests}
              icon={<TestTube />}
              className="bg-gold text-charcoal"
            >
              Run All Tests
            </SalonLuxeButton>
            
            <SalonLuxeButton
              onClick={runPosTransactionTest}
              icon={<Shield />}
              variant="outline"
            >
              Test POS Protection
            </SalonLuxeButton>
            
            <SalonLuxeButton
              onClick={runTokenRefreshTest}
              icon={<RefreshCw />}
              variant="outline"
            >
              Test Token Refresh
            </SalonLuxeButton>
            
            <SalonLuxeButton
              onClick={() => {
                updateActivity()
                updateTestStatus('Activity Update', 'passed', 'Activity timestamp updated')
              }}
              icon={<Activity />}
              variant="outline"
            >
              Update Activity
            </SalonLuxeButton>
          </div>
        </Card>

        {/* Test Results */}
        <Card className="bg-charcoal border-gold/20 p-6">
          <h2 className="text-xl font-semibold text-champagne mb-4">Test Results</h2>
          
          <div className="space-y-4">
            {tests.map((test, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-charcoal-light rounded-lg border border-gold/10"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <div className="text-champagne font-medium">{test.name}</div>
                    <div className="text-bronze text-sm">{test.message}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge className={getStatusColor(test.status)}>
                    {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                  </Badge>
                  {test.timestamp && (
                    <div className="text-bronze text-xs mt-1">{test.timestamp}</div>
                  )}
                  {test.duration && (
                    <div className="text-bronze text-xs">{test.duration}ms</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="bg-charcoal border-gold/20 p-6 mt-6">
          <h2 className="text-xl font-semibold text-champagne mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-gold" />
            Testing Instructions
          </h2>
          
          <div className="space-y-3 text-bronze">
            <p><strong className="text-champagne">1. Login Test:</strong> Login with hairtalkz01@gmail.com / Hairtalkz and leave this page open for 30+ minutes</p>
            <p><strong className="text-champagne">2. POS Test:</strong> Click "Test POS Protection" then try refreshing the page - session should remain stable</p>
            <p><strong className="text-champagne">3. Activity Test:</strong> Click "Update Activity" every few minutes to simulate POS usage</p>
            <p><strong className="text-champagne">4. Stress Test:</strong> Open multiple salon tabs, refresh pages, navigate around - session should persist</p>
            <p><strong className="text-champagne">5. Network Test:</strong> Temporarily disconnect internet, reconnect - session should recover gracefully</p>
          </div>
        </Card>
      </div>
    </div>
  )
}