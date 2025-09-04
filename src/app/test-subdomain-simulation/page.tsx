'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { getOrganizationContextFromURL, DEMO_ORGANIZATIONS } from '@/lib/organization-context-client'
import { Globe, ArrowRight, Building2, Info } from 'lucide-react'

interface SimulationResult {
  input: {
    host: string
    pathname: string
  }
  output: {
    organizationId: string
    organizationName: string
    isDemo: boolean
    subdomain: string | null
  } | null
  explanation: string
}

export default function TestSubdomainSimulationPage() {
  const [customHost, setCustomHost] = useState('mario.heraerp.com')
  const [customPath, setCustomPath] = useState('/salon')
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([])

  const testScenarios = [
    {
      name: 'Local Demo Salon',
      host: 'localhost:3000',
      path: '/salon',
      description: 'Local development demo'
    },
    {
      name: 'Production Demo',
      host: 'app.heraerp.com',
      path: '/salon',
      description: 'Main app domain demo'
    },
    {
      name: "Mario's Salon",
      host: 'mario.heraerp.com',
      path: '/salon',
      description: 'Customer subdomain'
    },
    {
      name: 'ACME Ice Cream',
      host: 'acme.heraerp.com',
      path: '/icecream',
      description: 'Different customer, different app'
    },
    {
      name: 'Demo Restaurant',
      host: 'www.heraerp.com',
      path: '/restaurant',
      description: 'WWW subdomain defaults to demo'
    }
  ]

  const runSimulation = (host: string, pathname: string) => {
    const result = getOrganizationContextFromURL(host, pathname)
    
    let explanation = ''
    
    if (!result) {
      explanation = 'No organization context found. This route may not be configured.'
    } else if (result.isDemo) {
      const appType = pathname.split('/')[1]
      explanation = `Demo mode activated because:\n` +
        `- Host "${host}" is not a customer subdomain\n` +
        `- Route "/${appType}" maps to demo organization\n` +
        `- Using predefined demo ID: ${result.organizationId}`
    } else {
      explanation = `Production mode activated because:\n` +
        `- Subdomain "${result.subdomain}" detected\n` +
        `- Would query database for this subdomain's organization\n` +
        `- Organization ID would be resolved server-side`
    }

    const simulationResult: SimulationResult = {
      input: { host, pathname },
      output: result ? {
        organizationId: result.organizationId,
        organizationName: result.organizationName || 'Unknown',
        isDemo: result.isDemo,
        subdomain: result.subdomain
      } : null,
      explanation
    }

    setSimulationResults(prev => [...prev, simulationResult])
  }

  const runAllScenarios = () => {
    setSimulationResults([])
    for (const scenario of testScenarios) {
      runSimulation(scenario.host, scenario.path)
    }
  }

  const runCustomSimulation = () => {
    if (customHost && customPath) {
      runSimulation(customHost, customPath)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Globe className="w-6 h-6" />
              Subdomain Routing Simulation
            </CardTitle>
            <CardDescription>
              Test how different URLs map to organizations without actually navigating
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Test Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Common Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={runAllScenarios} className="w-full">
                Run All Test Scenarios
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {testScenarios.map((scenario, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100"
                    onClick={() => runSimulation(scenario.host, scenario.path)}
                  >
                    <h4 className="font-medium">{scenario.name}</h4>
                    <p className="text-sm text-gray-600">{scenario.description}</p>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded mt-1 inline-block">
                      {scenario.host}{scenario.path}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Simulation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custom Simulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="host">Host (include port if needed)</Label>
                  <Input
                    id="host"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    placeholder="customername.heraerp.com"
                  />
                </div>
                <div>
                  <Label htmlFor="path">Path</Label>
                  <Input
                    id="path"
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder="/salon"
                  />
                </div>
              </div>
              <Button onClick={runCustomSimulation}>
                Simulate Custom URL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {simulationResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Simulation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {simulationResults.map((result, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {result.input.host}{result.input.pathname}
                      </code>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      {result.output ? (
                        <Badge variant={result.output.isDemo ? 'secondary' : 'default'}>
                          {result.output.isDemo ? 'Demo' : 'Production'}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">No Context</Badge>
                      )}
                    </div>
                    
                    {result.output && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Organization ID:</span>
                          <code className="ml-2 bg-gray-100 px-1 rounded text-xs">
                            {result.output.organizationId}
                          </code>
                        </div>
                        <div>
                          <span className="text-gray-500">Organization Name:</span>
                          <span className="ml-2 font-medium">
                            {result.output.organizationName}
                          </span>
                        </div>
                        {result.output.subdomain && (
                          <div>
                            <span className="text-gray-500">Subdomain:</span>
                            <span className="ml-2 font-medium">
                              {result.output.subdomain}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm whitespace-pre-line">
                        {result.explanation}
                      </AlertDescription>
                    </Alert>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Decision Flow:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Extract subdomain from host (e.g., "mario" from "mario.heraerp.com")</li>
                <li>Check if it's a custom subdomain (not www, app, localhost)</li>
                <li>If custom subdomain → Look up organization in database</li>
                <li>If not → Use demo organization based on path (e.g., /salon → demo salon)</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Demo Organization Mapping:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(DEMO_ORGANIZATIONS).map(([app, id]) => (
                  <div key={app} className="text-sm">
                    <code className="bg-gray-100 px-1 rounded">/{app}</code>
                    <span className="text-gray-500 ml-2">→</span>
                    <code className="text-xs ml-2">{id.substring(0, 8)}...</code>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}