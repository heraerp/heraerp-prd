'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * HERA Control Center Dashboard
 * Smart Code: HERA.UI.CONTROL.CENTER.DASHBOARD.v1
 *
 * Visual dashboard for the Master Control Center
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Code,
  Command,
  Database,
  FileCode,
  Globe,
  Heart,
  Lock,
  Package,
  Rocket,
  Settings,
  Shield,
  Terminal,
  XCircle,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data for demonstration
const mockHealthData = {
  overall: 92,
  components: [
    { name: 'Sacred 6 Tables', status: 'healthy', score: 100, icon: Database },
    { name: 'API Endpoints', status: 'healthy', score: 95, icon: Globe },
    { name: 'DNA Modules', status: 'healthy', score: 98, icon: Package },
    { name: 'UI Components', status: 'healthy', score: 94, icon: FileCode },
    { name: 'Build System', status: 'warning', score: 78, icon: Settings },
    { name: 'Test Coverage', status: 'healthy', score: 87, icon: CheckCircle },
    { name: 'Documentation', status: 'healthy', score: 91, icon: FileCode },
    { name: 'Security', status: 'healthy', score: 96, icon: Shield }
  ]
}

const mockGuardrails = [
  { name: 'No Custom Tables', status: 'passed', description: 'Only sacred 6 tables exist' },
  {
    name: 'Organization ID Required',
    status: 'passed',
    description: 'All queries include org context'
  },
  {
    name: 'Smart Code Compliance',
    status: 'warning',
    description: '3 operations missing smart codes'
  },
  {
    name: 'Multi-Tenant Isolation',
    status: 'passed',
    description: 'Perfect data isolation maintained'
  },
  { name: 'Audit Trail Complete', status: 'passed', description: 'All operations tracked' }
]

const mockDeploymentChecks = [
  { name: 'Build Success', status: 'passed' },
  { name: 'Tests Passing', status: 'passed' },
  { name: 'Schema Valid', status: 'passed' },
  { name: 'Guardrails Pass', status: 'warning' },
  { name: 'Security Scan', status: 'passed' },
  { name: 'Performance Baseline', status: 'passed' },
  { name: 'Documentation Complete', status: 'passed' },
  { name: 'Migration Scripts', status: 'passed' }
]

export default function ControlCenterDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isScanning, setIsScanning] = useState(false)

  const runSystemScan = async () => {
    setIsScanning(true)
    // Simulate scan
    setTimeout(() => {
      setIsScanning(false)
    }, 3000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'passed':
        return 'text-green-600 dark:text-green-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'critical':
      case 'failed':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical':
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 70) return 'bg-yellow-500'
    if (score >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const deploymentReady = mockDeploymentChecks.every(check => check.status === 'passed')

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Command className="h-10 w-10 text-primary" />
              HERA Control Center
            </h1>
            <p className="text-muted-foreground mt-2">
              Master orchestrator and guardian of the entire HERA ecosystem
            </p>
          </div>
          <Button onClick={runSystemScan} disabled={isScanning} size="lg">
            {isScanning ? (
              <>
                <Activity className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Run System Scan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Overall Health */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{mockHealthData.overall}%</span>
                <Badge className={cn('text-white', getHealthColor(mockHealthData.overall))}>
                  {mockHealthData.overall >= 90
                    ? 'Excellent'
                    : mockHealthData.overall >= 70
                      ? 'Good'
                      : mockHealthData.overall >= 50
                        ? 'Fair'
                        : 'Poor'}
                </Badge>
              </div>
              <Progress value={mockHealthData.overall} className="h-3" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {mockHealthData.components.map(component => {
                const Icon = component.icon
                return (
                  <div key={component.name} className="text-center">
                    <div className="flex justify-center mb-2">
                      <div
                        className={cn(
                          'p-3 rounded-full',
                          component.status === 'healthy'
                            ? 'bg-green-100 dark:bg-green-900'
                            : component.status === 'warning'
                              ? 'bg-yellow-100 dark:bg-yellow-900'
                              : 'bg-red-100 dark:bg-red-900'
                        )}
                      >
                        <Icon className={cn('h-6 w-6', getStatusColor(component.status))} />
                      </div>
                    </div>
                    <div className="text-sm font-medium">{component.name}</div>
                    <div className={cn('text-2xl font-bold', getStatusColor(component.status))}>
                      {component.score}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="guardrails">Guardrails</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="mcp">MCP Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Sacred Tables</dt>
                    <dd className="font-medium">6 / 6</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">API Endpoints</dt>
                    <dd className="font-medium">42 active</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">DNA Modules</dt>
                    <dd className="font-medium">23 loaded</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Test Coverage</dt>
                    <dd className="font-medium">87%</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Build completed successfully</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>3 smart code violations detected</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>All guardrails passing</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span>System scan completed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guardrails" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Guardrail Enforcement
              </CardTitle>
              <CardDescription>Core system invariants that must never be violated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockGuardrails.map(guardrail => (
                  <div
                    key={guardrail.name}
                    className="flex items-start gap-3 p-4 rounded-lg bg-muted/50"
                  >
                    {getStatusIcon(guardrail.status)}
                    <div className="flex-1">
                      <div className="font-medium">{guardrail.name}</div>
                      <div className="text-sm text-muted-foreground">{guardrail.description}</div>
                    </div>
                    <Badge variant={guardrail.status === 'passed' ? 'success' : 'warning'}>
                      {guardrail.status}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline">
                  <Terminal className="mr-2 h-4 w-4" />
                  Run Guardrail Check
                </Button>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                DNA Module Registry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground p-2">
                  <div>Module</div>
                  <div>Category</div>
                  <div>Status</div>
                </div>
                <ScrollArea className="h-96">
                  <div className="space-y-1">
                    {[
                      { name: 'GL Module', category: 'Financial', status: 'active' },
                      { name: 'AP Module', category: 'Financial', status: 'active' },
                      { name: 'AR Module', category: 'Financial', status: 'active' },
                      { name: 'FA Module', category: 'Financial', status: 'active' },
                      { name: 'Inventory Module', category: 'Supply Chain', status: 'active' },
                      { name: 'POS Module', category: 'Sales', status: 'active' },
                      { name: 'Cashflow DNA', category: 'Financial', status: 'active' },
                      { name: 'Auto-Journal Engine', category: 'Financial', status: 'active' }
                    ].map(module => (
                      <div
                        key={module.name}
                        className="grid grid-cols-3 gap-4 p-3 rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium">{module.name}</div>
                        <div className="text-muted-foreground">{module.category}</div>
                        <Badge variant="success" className="w-fit">
                          {module.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="mt-4 pt-4 border-t flex gap-3">
                  <Button variant="outline">
                    <Code className="mr-2 h-4 w-4" />
                    Rebuild Index
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Module Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Deployment Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDeploymentChecks.map(check => (
                  <div
                    key={check.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <span className="font-medium">{check.name}</span>
                    </div>
                    <Badge variant={check.status === 'passed' ? 'success' : 'warning'}>
                      {check.status}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                {deploymentReady ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Ready for Deployment!</AlertTitle>
                    <AlertDescription>
                      All deployment checks have passed. You can safely deploy to production.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Not Ready for Deployment</AlertTitle>
                    <AlertDescription>
                      Fix the issues above before deploying to production.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="mt-4 flex gap-3">
                  <Button
                    variant={deploymentReady ? 'default' : 'outline'}
                    disabled={!deploymentReady}
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy to Production
                  </Button>
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    Security Scan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mcp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                MCP Tool Registry
              </CardTitle>
              <CardDescription>All available Model Context Protocol tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: 'hera-control-center',
                    description: 'Master control center',
                    status: 'active'
                  },
                  { name: 'hera-cli', description: 'Core HERA operations', status: 'active' },
                  {
                    name: 'fiscal-close-dna-cli',
                    description: 'Year-end closing operations',
                    status: 'active'
                  },
                  {
                    name: 'cashflow-dna-cli',
                    description: 'Cashflow analysis and reporting',
                    status: 'active'
                  },
                  { name: 'factory-cli', description: 'Test data generation', status: 'active' },
                  {
                    name: 'auto-journal-dna-cli',
                    description: 'Auto-journal management',
                    status: 'active'
                  }
                ].map(tool => (
                  <div
                    key={tool.name}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium font-mono text-sm">{tool.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">{tool.description}</div>
                      </div>
                      <Badge variant="success">{tool.status}</Badge>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline">
                        <Terminal className="h-3 w-3" />
                        Test
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileCode className="h-3 w-3" />
                        Docs
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
