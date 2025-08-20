'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  User, 
  Calendar, 
  Shield, 
  CheckCircle,
  Clock,
  Send
} from 'lucide-react'

export function EmailAccessDemo() {
  const { user, workspace, isAnonymous, isIdentified, saveWithEmail, daysRemaining } = useAuth()
  const [testEmail, setTestEmail] = useState('')
  const [emailFeatures, setEmailFeatures] = useState<string[]>([])

  // Get the current email
  const currentEmail = user?.email || organization?.email

  // Simulate email-based features that activate immediately
  useEffect(() => {
    if (currentEmail) {
      const features = [
        'Data backup to email',
        'Export reports via email',
        'Workspace recovery link',
        'Extended 365-day storage',
        'Priority customer support',
        'Feature update notifications'
      ]
      setEmailFeatures(features)
    } else {
      setEmailFeatures([])
    }
  }, [currentEmail])

  const handleSaveEmail = async () => {
    if (!testEmail) return
    
    const result = await saveWithEmail(testEmail)
    if (result.success) {
      console.log('✅ Email saved immediately:', testEmail)
      // Email is now available in currentEmail variable
    }
  }

  const sendTestEmail = () => {
    if (currentEmail) {
      // Simulate sending email to the user
      alert(`📧 Test email sent to: ${currentEmail}`)
      console.log('Email sent to:', currentEmail)
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Email Access Demo</h2>
        <p className="text-gray-600">
          Shows how email is immediately available after user provides it
        </p>
      </div>

      {/* Current Auth State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Current Authentication State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Status:</p>
              <Badge variant={isIdentified ? 'default' : 'secondary'}>
                {isAnonymous ? 'Anonymous' : isIdentified ? 'Email Verified' : 'Registered'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Remaining:</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">{daysRemaining}</span>
              </div>
            </div>
          </div>
          
          {currentEmail && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Email Available:</span>
              </div>
              <p className="text-green-700 font-mono mt-1">{currentEmail}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Input (if not already provided) */}
      {!currentEmail && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Provide Email Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSaveEmail} disabled={!testEmail}>
                Save Email
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Email will be immediately available after saving
            </p>
          </CardContent>
        </Card>
      )}

      {/* Email-Based Features (Available Immediately) */}
      {currentEmail && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Features Activated with Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {emailFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button onClick={sendTestEmail} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Send Test Email to {currentEmail}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Code Example: Accessing Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <div className="text-gray-400">// Email is immediately available after saveWithEmail()</div>
            <div className="mt-2">
              <span className="text-blue-400">const</span> {`{ user, workspace }`} = <span className="text-yellow-400">useProgressiveAuth</span>()
            </div>
            <div className="mt-1">
              <span className="text-blue-400">const</span> userEmail = user?.email || organization?.email
            </div>
            <div className="mt-2 text-gray-400">// Current email: </div>
            <div className="text-white">"{currentEmail || 'Not provided yet'}"</div>
            <div className="mt-2 text-gray-400">// Available immediately - no waiting for full registration!</div>
          </div>
        </CardContent>
      </Card>

      {/* Workspace Data Example */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Data Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{JSON.stringify({
  id: organization?.id?.slice(0, 8) + '...',
  type: organization?.type,
  email: currentEmail || null,
  organization_id: organization?.organization_id?.slice(0, 8) + '...',
  expires_at: organization?.expires_at,
  created_at: organization?.created_at
}, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}