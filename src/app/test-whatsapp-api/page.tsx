'use client'

/**
 * HERA DNA WhatsApp API Test Page
 * Test real WhatsApp API integration with environment variables
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageCircle,
  Send,
  Zap,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  TrendingUp,
  Star,
  Sparkles,
  Crown,
  Phone,
  Loader2
} from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

interface TestResult {
  id: string
  type: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
  timestamp: Date
  duration?: number
}

export default function WhatsAppAPITestPage() {
  const { currentOrganization } = useMultiOrgAuth()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  
  // Test parameters
  const [phoneNumber, setPhoneNumber] = useState('+971501234567') // UAE test number
  const [testMessage, setTestMessage] = useState('Hello! This is a test message from HERA DNA WhatsApp system. 🚀')
  
  // Environment status
  const [envStatus, setEnvStatus] = useState<any>(null)

  const addTestResult = (type: string, status: 'success' | 'error', message: string, data?: any, duration?: number) => {
    const result: TestResult = {
      id: Date.now().toString(),
      type,
      status,
      message,
      data,
      timestamp: new Date(),
      duration
    }
    setTestResults(prev => [result, ...prev])
  }

  const checkEnvironmentVariables = async () => {
    const startTime = Date.now()
    setLoading(true)
    
    try {
      const response = await fetch('/api/v1/whatsapp/test-env', {
        method: 'GET'
      })
      
      const result = await response.json()
      const duration = Date.now() - startTime
      
      if (response.ok) {
        setEnvStatus(result.data)
        addTestResult(
          'Environment Check',
          'success',
          'All WhatsApp environment variables are configured',
          result.data,
          duration
        )
      } else {
        addTestResult(
          'Environment Check',
          'error',
          result.error || 'Failed to check environment variables',
          null,
          duration
        )
      }
    } catch (error) {
      addTestResult(
        'Environment Check',
        'error',
        `Network error: ${error.message}`,
        null,
        Date.now() - startTime
      )
    } finally {
      setLoading(false)
    }
  }

  const testDirectWhatsAppAPI = async () => {
    const startTime = Date.now()
    setLoading(true)
    
    try {
      const response = await fetch('/api/v1/whatsapp/test-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          message: testMessage
        })
      })
      
      const result = await response.json()
      const duration = Date.now() - startTime
      
      if (response.ok) {
        addTestResult(
          'Direct WhatsApp API',
          'success',
          `Message sent successfully! ID: ${result.data?.whatsapp_message_id}`,
          result.data,
          duration
        )
      } else {
        addTestResult(
          'Direct WhatsApp API',
          'error',
          result.error || 'Failed to send message',
          result.details,
          duration
        )
      }
    } catch (error) {
      addTestResult(
        'Direct WhatsApp API',
        'error',
        `Network error: ${error.message}`,
        null,
        Date.now() - startTime
      )
    } finally {
      setLoading(false)
    }
  }

  const testHeraDNAIntegration = async () => {
    if (!currentOrganization?.id) {
      addTestResult('HERA DNA Integration', 'error', 'No organization selected', null, 0)
      return
    }

    const startTime = Date.now()
    setLoading(true)
    
    try {
      // First setup the integration
      const setupResponse = await fetch('/api/v1/whatsapp/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup_integration',
          organizationId: currentOrganization.id
        })
      })
      
      const setupResult = await setupResponse.json()
      
      if (!setupResponse.ok) {
        throw new Error(setupResult.error || 'Setup failed')
      }
      
      // Then send a message through DNA
      const messageResponse = await fetch('/api/v1/whatsapp/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          organizationId: currentOrganization.id,
          to: phoneNumber,
          type: 'text',
          content: { text: testMessage }
        })
      })
      
      const messageResult = await messageResponse.json()
      const duration = Date.now() - startTime
      
      if (messageResponse.ok) {
        addTestResult(
          'HERA DNA Integration',
          'success',
          'HERA DNA message sent successfully with universal transaction logging',
          {
            setup: setupResult.data,
            message: messageResult.data
          },
          duration
        )
      } else {
        addTestResult(
          'HERA DNA Integration',
          'error',
          messageResult.error || 'Failed to send DNA message',
          messageResult,
          duration
        )
      }
    } catch (error) {
      addTestResult(
        'HERA DNA Integration',
        'error',
        `HERA DNA error: ${error.message}`,
        null,
        Date.now() - startTime
      )
    } finally {
      setLoading(false)
    }
  }

  const testSalonTemplate = async () => {
    if (!currentOrganization?.id) {
      addTestResult('Salon Template', 'error', 'No organization selected', null, 0)
      return
    }

    const startTime = Date.now()
    setLoading(true)
    
    try {
      // Setup salon templates first
      await fetch('/api/v1/whatsapp/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup_salon_templates',
          organizationId: currentOrganization.id
        })
      })
      
      // Send appointment reminder template
      const response = await fetch('/api/v1/whatsapp/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_template',
          organizationId: currentOrganization.id,
          to: phoneNumber,
          templateName: 'appointment_reminder',
          language: 'en',
          parameters: {
            '1': 'Sarah',
            '2': 'Brazilian Blowout',
            '3': '2:00 PM',
            '4': 'Rocky'
          }
        })
      })
      
      const result = await response.json()
      const duration = Date.now() - startTime
      
      if (response.ok) {
        addTestResult(
          'Salon Template',
          'success',
          'Salon appointment reminder template sent successfully',
          result.data,
          duration
        )
      } else {
        addTestResult(
          'Salon Template',
          'error',
          result.error || 'Failed to send salon template',
          result,
          duration
        )
      }
    } catch (error) {
      addTestResult(
        'Salon Template',
        'error',
        `Salon template error: ${error.message}`,
        null,
        Date.now() - startTime
      )
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    setTestResults([])
    await checkEnvironmentVariables()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    await testDirectWhatsAppAPI()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    await testHeraDNAIntegration()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    await testSalonTemplate()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <MessageCircle className="w-8 h-8 text-green-500" />
            HERA DNA WhatsApp API Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Test real WhatsApp Business API integration with production credentials
          </p>
          {currentOrganization && (
            <Badge className="mt-2">
              Organization: {currentOrganization.name}
            </Badge>
          )}
        </div>

        {/* Environment Status */}
        {envStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Environment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-green-800 dark:text-green-200">Phone Number ID</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{envStatus.phoneNumberId}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Business Number</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">{envStatus.businessNumber}</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="font-medium text-purple-800 dark:text-purple-200">Access Token</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {envStatus.accessToken ? '✓ Configured' : '✗ Missing'}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="font-medium text-orange-800 dark:text-orange-200">Webhook Token</p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    {envStatus.webhookToken ? '✓ Configured' : '✗ Missing'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test Phone Number</label>
                <Input
                  placeholder="Phone number (with country code)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include country code (e.g., +971501234567 for UAE)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Test Message</label>
                <Textarea
                  placeholder="Message to send"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={checkEnvironmentVariables}
                  disabled={loading}
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Check Config
                </Button>
                <Button 
                  onClick={runAllTests}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  Run All Tests
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={testDirectWhatsAppAPI}
                  disabled={loading}
                  variant="outline"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Test Direct API
                </Button>
                <Button 
                  onClick={testHeraDNAIntegration}
                  disabled={loading}
                  variant="outline"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Test HERA DNA
                </Button>
                <Button 
                  onClick={testSalonTemplate}
                  disabled={loading}
                  variant="outline"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Test Salon Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testResults.map((result) => (
                  <Alert key={result.id} className={
                    result.status === 'success' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' :
                    result.status === 'error' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
                    'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20'
                  }>
                    <AlertDescription className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.type}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          {result.duration && <span>{result.duration}ms</span>}
                          <span>{result.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <p className="text-sm">{result.message}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer">Show Details</summary>
                          <pre className="text-xs mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
                {testResults.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No tests run yet. Click a test button to start.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints Reference */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints Being Tested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <span className="font-semibold text-green-600">GET</span> /api/v1/whatsapp/test-env
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span className="font-semibold text-blue-600">POST</span> /api/v1/whatsapp/test-direct
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <span className="font-semibold text-purple-600">POST</span> /api/v1/whatsapp/dna
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <span className="font-semibold text-orange-600">GET</span> /api/v1/whatsapp/conversations
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* View Messages Link */}
        <Card>
          <CardHeader>
            <CardTitle>View Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <a 
              href="/whatsapp-messages" 
              target="_blank"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              View All WhatsApp Messages
            </a>
            <p className="text-sm text-gray-600 mt-2">
              View conversations and messages stored in HERA database
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}