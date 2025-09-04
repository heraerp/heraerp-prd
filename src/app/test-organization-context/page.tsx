'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useOrganizationContext } from '@/hooks/useOrganizationContext'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { DEMO_ORGANIZATIONS } from '@/lib/organization-context-client'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Globe, 
  Building2, 
  User,
  Link as LinkIcon,
  Database,
  Shield,
  Sparkles
} from 'lucide-react'

interface TestResult {
  name: string
  description: string
  expected: string
  actual: string
  passed: boolean
  icon: React.ReactNode
}

export default function TestOrganizationContextPage() {
  const { organization, isLoading: orgLoading, error: orgError } = useOrganizationContext()
  const { currentOrganization, isAuthenticated, user } = useMultiOrgAuth()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
      runTests()
    }
  }, [organization, currentOrganization, isAuthenticated])

  const runTests = () => {
    if (typeof window === 'undefined') return
    
    const results: TestResult[] = []
    const hostname = window.location.hostname
    const pathname = window.location.pathname
    const isLocalhost = hostname === 'localhost' || hostname.includes('localhost')
    const subdomain = hostname.split('.')[0]
    
    // Test 1: Organization ID Detection
    results.push({
      name: 'Organization ID Detection',
      description: 'Checks if organization ID is properly detected',
      expected: 'Non-null organization ID',
      actual: organization?.organizationId || 'null',
      passed: !!organization?.organizationId,
      icon: <Database className="w-4 h-4" />
    })

    // Test 2: Demo Mode Detection
    const expectedDemo = !currentOrganization && (
      isLocalhost || 
      subdomain === 'app' || 
      subdomain === 'www' ||
      subdomain === 'heraerp'
    )
    results.push({
      name: 'Demo Mode Detection',
      description: 'Verifies demo mode is correctly identified',
      expected: expectedDemo ? 'Demo mode' : 'Production mode',
      actual: organization?.isDemo ? 'Demo mode' : 'Production mode',
      passed: organization?.isDemo === expectedDemo,
      icon: <Sparkles className="w-4 h-4" />
    })

    // Test 3: Subdomain Detection
    const expectedSubdomain = (!isLocalhost && subdomain !== 'app' && subdomain !== 'www') 
      ? subdomain 
      : null
    results.push({
      name: 'Subdomain Detection',
      description: 'Checks if subdomain is properly extracted',
      expected: expectedSubdomain || 'No subdomain',
      actual: organization?.subdomain || 'No subdomain',
      passed: organization?.subdomain === expectedSubdomain,
      icon: <Globe className="w-4 h-4" />
    })

    // Test 4: Authentication State
    results.push({
      name: 'Authentication State',
      description: 'Verifies authentication status',
      expected: 'Authenticated or Demo',
      actual: isAuthenticated ? 'Authenticated' : 'Not authenticated (Demo allowed)',
      passed: true, // Both states are valid
      icon: <User className="w-4 h-4" />
    })

    // Test 5: Organization Name
    results.push({
      name: 'Organization Name',
      description: 'Checks if organization name is set',
      expected: 'Non-empty organization name',
      actual: organization?.organizationName || 'No name',
      passed: !!organization?.organizationName,
      icon: <Building2 className="w-4 h-4" />
    })

    // Test 6: RLS Context
    const hasRLSContext = !!organization?.organizationId
    results.push({
      name: 'RLS Context Ready',
      description: 'Verifies Row Level Security context is available',
      expected: 'Organization ID for RLS',
      actual: hasRLSContext ? 'RLS context ready' : 'No RLS context',
      passed: hasRLSContext,
      icon: <Shield className="w-4 h-4" />
    })

    setTestResults(results)
  }

  const getScenarioInfo = () => {
    if (typeof window === 'undefined') {
      return {
        scenario: 'Server-Side',
        description: 'Server-side rendering',
        expectedBehavior: 'Cannot determine organization on server'
      }
    }
    const hostname = window.location.hostname
    const pathname = window.location.pathname
    
    if (hostname === 'localhost' || hostname.includes('localhost')) {
      return {
        scenario: 'Local Development',
        description: 'Running on localhost - will use demo organizations',
        expectedBehavior: 'Demo mode with predefined organization IDs'
      }
    }
    
    const subdomain = hostname.split('.')[0]
    
    if (subdomain === 'app' || subdomain === 'www' || subdomain === 'heraerp') {
      return {
        scenario: 'Main App Domain',
        description: 'Running on main domain - demo/sales mode',
        expectedBehavior: 'Demo organizations for trying out the system'
      }
    }
    
    return {
      scenario: 'Customer Subdomain',
      description: `Running on ${subdomain}.heraerp.com - production mode`,
      expectedBehavior: `Should use ${subdomain}'s actual organization`
    }
  }

  const scenarioInfo = getScenarioInfo()
  const allTestsPassed = testResults.every(t => t.passed)

  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading organization context...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Database className="w-6 h-6" />
              Organization Context Test
            </CardTitle>
            <CardDescription>
              Testing subdomain routing and organization detection
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Current Context */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current URL</p>
                <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                  {currentUrl}
                </code>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Organization ID</p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {organization?.organizationId || 'Not set'}
                </code>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Organization Name</p>
                <p className="font-medium">{organization?.organizationName || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Mode</p>
                <Badge variant={organization?.isDemo ? 'secondary' : 'default'}>
                  {organization?.isDemo ? 'Demo Mode' : 'Production Mode'}
                </Badge>
              </div>
            </div>

            {orgError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{orgError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Scenario Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Detected Scenario: {scenarioInfo.scenario}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-2">{scenarioInfo.description}</p>
            <p className="text-sm">
              <strong>Expected behavior:</strong> {scenarioInfo.expectedBehavior}
            </p>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Test Results
              {allTestsPassed ? (
                <Badge className="bg-green-100 text-green-800">All Passed</Badge>
              ) : (
                <Badge variant="destructive">Some Failed</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((test, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    test.passed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {test.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {test.icon}
                        <h3 className="font-medium">{test.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Expected:</span>{' '}
                          <code className="bg-gray-100 px-1 rounded">{test.expected}</code>
                        </div>
                        <div>
                          <span className="text-gray-500">Actual:</span>{' '}
                          <code className={`px-1 rounded ${
                            test.passed ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {test.actual}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Different Scenarios</CardTitle>
            <CardDescription>
              Click these links to test various routing scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Demo Routes (Sales/Testing)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/salon'}
                  >
                    /salon (Demo Salon)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/icecream'}
                  >
                    /icecream (Demo Ice Cream)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/restaurant'}
                  >
                    /restaurant (Demo Restaurant)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/healthcare'}
                  >
                    /healthcare (Demo Healthcare)
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> To test customer subdomains (e.g., mario.heraerp.com), 
                  you need to set up DNS and access from the actual subdomain.
                  For local testing, you can add entries to your /etc/hosts file.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Demo Organization IDs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demo Organization IDs</CardTitle>
            <CardDescription>
              Predefined organization IDs used in demo mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(DEMO_ORGANIZATIONS).map(([app, id]) => (
                <div key={app} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium capitalize">{app}</span>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {id}
                  </code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}