'use client'

/**
 * HERA DNA WhatsApp Test Page
 * Demonstrates the universal WhatsApp integration system
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Crown
} from 'lucide-react'
import { WhatsAppManager } from '@/components/dna/whatsapp/WhatsAppManager'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

export default function WhatsAppDNATestPage() {
  const { currentOrganization } = useMultiOrgAuth()
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('+971501234567')
  const [message, setMessage] = useState('Hello! This is a test message from HERA DNA WhatsApp system.')

  const runDNATest = async (testType: string) => {
    if (!currentOrganization?.id) {
      setTestResults(prev => [...prev, {
        type: testType,
        status: 'error',
        message: 'No organization selected',
        timestamp: new Date()
      }])
      return
    }

    setLoading(true)
    try {
      let response
      switch (testType) {
        case 'setup':
          response = await fetch('/api/v1/whatsapp/dna', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'setup_integration',
              organizationId: currentOrganization.id
            })
          })
          break

        case 'send_message':
          response = await fetch('/api/v1/whatsapp/dna', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send_message',
              organizationId: currentOrganization.id,
              to: phoneNumber,
              type: 'text',
              content: { text: message }
            })
          })
          break

        case 'salon_templates':
          response = await fetch('/api/v1/whatsapp/dna', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'setup_salon_templates',
              organizationId: currentOrganization.id
            })
          })
          break

        case 'send_template':
          response = await fetch('/api/v1/whatsapp/dna', {
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
          break

        default:
          throw new Error('Unknown test type')
      }

      const result = await response.json()
      
      setTestResults(prev => [...prev, {
        type: testType,
        status: result.success ? 'success' : 'error',
        message: result.success ? 'Test completed successfully' : result.error || 'Unknown error',
        data: result.data,
        timestamp: new Date()
      }])

    } catch (error) {
      setTestResults(prev => [...prev, {
        type: testType,
        status: 'error',
        message: error.message,
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
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
            HERA DNA WhatsApp System Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Test the universal WhatsApp messaging integration with HERA's 6-table architecture
          </p>
          {currentOrganization && (
            <Badge className="mt-2">
              Organization: {currentOrganization.name}
            </Badge>
          )}
        </div>

        {/* Architecture Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              HERA DNA WhatsApp Architecture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-green-600 mb-2">Smart Codes</h3>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• HERA.MESSAGING.WHATSAPP.APP.v1</li>
                  <li>• HERA.MESSAGING.WHATSAPP.CONVERSATION.v1</li>
                  <li>• HERA.MESSAGING.WHATSAPP.MESSAGE.TEXT.v1</li>
                  <li>• HERA.SALON.MESSAGING.WHATSAPP.BOOKING_REMINDER.v1</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-blue-600 mb-2">Universal Tables</h3>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• core_entities (Apps, Conversations)</li>
                  <li>• core_dynamic_data (Credentials, Config)</li>
                  <li>• universal_transactions (Send/Receive)</li>
                  <li>• universal_transaction_lines (Messages)</li>
                  <li>• core_relationships (Links)</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-purple-600 mb-2">Features</h3>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Multi-industry templates</li>
                  <li>• Automated responses</li>
                  <li>• Conversation management</li>
                  <li>• Analytics & reporting</li>
                  <li>• Salon-specific flows</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>DNA System Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => runDNATest('setup')}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Setup Integration
                </Button>
                <Button 
                  onClick={() => runDNATest('salon_templates')}
                  disabled={loading}
                  variant="outline"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Salon Templates
                </Button>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <Input
                  placeholder="Test message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => runDNATest('send_message')}
                    disabled={loading}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button 
                    onClick={() => runDNATest('send_template')}
                    disabled={loading}
                    variant="outline"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Send Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {testResults.map((result, index) => (
                  <Alert key={index} className={
                    result.status === 'success' ? 'border-green-200 bg-green-50' :
                    result.status === 'error' ? 'border-red-200 bg-red-50' :
                    'border-gray-200 bg-gray-50'
                  }>
                    <AlertDescription className="flex items-start gap-2">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{result.type}</span>
                          <span className="text-xs text-gray-500">
                            {result.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{result.message}</p>
                        {result.data && (
                          <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
                {testResults.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No test results yet. Run a test to see results here.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live WhatsApp Manager */}
        <Card>
          <CardHeader>
            <CardTitle>Live WhatsApp Manager (Salon Industry)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {currentOrganization?.id && (
              <WhatsAppManager 
                organizationId={currentOrganization.id}
                industryType="salon"
                className="min-h-[600px] rounded-lg"
              />
            )}
          </CardContent>
        </Card>

        {/* Smart Code Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Smart Code Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Universal Smart Codes</h3>
                <div className="space-y-1 text-sm font-mono">
                  <div className="p-2 bg-green-50 rounded">HERA.MESSAGING.WHATSAPP.APP.v1</div>
                  <div className="p-2 bg-blue-50 rounded">HERA.MESSAGING.WHATSAPP.CONVERSATION.v1</div>
                  <div className="p-2 bg-purple-50 rounded">HERA.MESSAGING.WHATSAPP.SEND.TXN.v1</div>
                  <div className="p-2 bg-orange-50 rounded">HERA.MESSAGING.WHATSAPP.RECEIVE.TXN.v1</div>
                  <div className="p-2 bg-pink-50 rounded">HERA.MESSAGING.WHATSAPP.MESSAGE.TEXT.v1</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Salon-Specific Smart Codes</h3>
                <div className="space-y-1 text-sm font-mono">
                  <div className="p-2 bg-pink-50 rounded">HERA.SALON.MESSAGING.WHATSAPP.BOOKING_REMINDER.v1</div>
                  <div className="p-2 bg-purple-50 rounded">HERA.SALON.MESSAGING.WHATSAPP.BOOKING_CONFIRMATION.v1</div>
                  <div className="p-2 bg-blue-50 rounded">HERA.SALON.MESSAGING.WHATSAPP.SERVICE_FOLLOWUP.v1</div>
                  <div className="p-2 bg-green-50 rounded">HERA.SALON.MESSAGING.WHATSAPP.PROMOTION.v1</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}