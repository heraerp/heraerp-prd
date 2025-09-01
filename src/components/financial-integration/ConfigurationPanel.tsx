'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Settings, 
  Shield, 
  Globe, 
  Database, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  Link,
  Building2,
  FileText
} from 'lucide-react'

interface SystemConfig {
  systemType: 'S4HANA_CLOUD' | 'S4HANA_ONPREM' | 'ECC' | 'B1' | 'CUSTOM'
  baseUrl: string
  companyCode: string
  chartOfAccounts: string
  credentials: {
    authType: 'oauth' | 'basic' | 'certificate'
    clientId?: string
    username?: string
  }
  features: {
    autoPosting: boolean
    duplicateDetection: boolean
    realTimeSync: boolean
    batchProcessing: boolean
  }
}

interface ConfigurationPanelProps {
  organizationId: string
  onConfigSave?: (config: SystemConfig) => void
}

export function ConfigurationPanel({ organizationId, onConfigSave }: ConfigurationPanelProps) {
  const [config, setConfig] = useState<SystemConfig>({
    systemType: 'S4HANA_CLOUD',
    baseUrl: '',
    companyCode: '',
    chartOfAccounts: 'IFRS',
    credentials: {
      authType: 'oauth'
    },
    features: {
      autoPosting: true,
      duplicateDetection: true,
      realTimeSync: false,
      batchProcessing: true
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const systemTypes = [
    { value: 'S4HANA_CLOUD', label: 'S/4HANA Cloud', icon: '☁️' },
    { value: 'S4HANA_ONPREM', label: 'S/4HANA On-Premise', icon: '🏢' },
    { value: 'ECC', label: 'ECC 6.0', icon: '🏛️' },
    { value: 'B1', label: 'Business One', icon: '💼' },
    { value: 'CUSTOM', label: 'Custom Integration', icon: '🔧' }
  ]

  const chartOfAccountsOptions = [
    { value: 'IFRS', label: 'IFRS International' },
    { value: 'GAAP', label: 'US GAAP' },
    { value: 'IND_AS', label: 'Indian Accounting Standards' },
    { value: 'CUSTOM', label: 'Custom Chart' }
  ]

  useEffect(() => {
    loadConfiguration()
  }, [organizationId])

  const loadConfiguration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/financial-integration/config?organization_id=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.configured) {
          setConfig(prev => ({ ...prev, ...data.config }))
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/v1/financial-integration/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          config
        })
      })

      const result = await response.json()
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'Connection successful!' : 'Connection failed'),
        details: result.systemInfo
      })

      if (result.success) {
        toast.success('Financial system connection verified!')
      } else {
        toast.error('Connection test failed')
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection test failed: ' + (error as Error).message
      })
      toast.error('Connection test failed')
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveConfiguration = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/v1/financial-integration/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          ...config
        })
      })

      if (response.ok) {
        toast.success('Configuration saved successfully!')
        onConfigSave?.(config)
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      toast.error('Failed to save configuration')
      console.error('Save error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Financial Integration Configuration
          </CardTitle>
          <CardDescription>
            Configure HERA DNA integration with your enterprise financial system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connection" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="mapping">Mapping</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="system-type">System Type</Label>
                  <Select
                    value={config.systemType}
                    onValueChange={(value: any) => setConfig(prev => ({ ...prev, systemType: value }))}
                  >
                    <SelectTrigger id="system-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {systemTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="base-url">System URL</Label>
                  <Input
                    id="base-url"
                    placeholder="https://your-system.example.com"
                    value={config.baseUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-code">Company Code</Label>
                    <Input
                      id="company-code"
                      placeholder="1000"
                      value={config.companyCode}
                      onChange={(e) => setConfig(prev => ({ ...prev, companyCode: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="chart-of-accounts">Chart of Accounts</Label>
                    <Select
                      value={config.chartOfAccounts}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, chartOfAccounts: value }))}
                    >
                      <SelectTrigger id="chart-of-accounts">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {chartOfAccountsOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting || !config.baseUrl}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Link className="mr-2 h-4 w-4" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>

                {testResult && (
                  <Alert variant={testResult.success ? 'default' : 'destructive'}>
                    <AlertDescription className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {testResult.message}
                    </AlertDescription>
                    {testResult.details && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>System: {testResult.details.systemId}</p>
                        <p>Version: {testResult.details.version}</p>
                      </div>
                    )}
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Master data mapping allows HERA to synchronize with your financial system's
                    chart of accounts, cost centers, and other organizational units.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">GL Accounts</p>
                        <p className="text-sm text-muted-foreground">
                          Map general ledger accounts
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Cost Centers</p>
                        <p className="text-sm text-muted-foreground">
                          Map organizational cost centers
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Tax Codes</p>
                        <p className="text-sm text-muted-foreground">
                          Configure regional tax mappings
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Automatic Posting</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically post validated transactions to the financial system
                      </p>
                    </div>
                    <Switch
                      checked={config.features.autoPosting}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({
                          ...prev,
                          features: { ...prev.features, autoPosting: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">AI Duplicate Detection</p>
                      <p className="text-sm text-muted-foreground">
                        Use AI to detect duplicate invoices and payments
                      </p>
                    </div>
                    <Switch
                      checked={config.features.duplicateDetection}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({
                          ...prev,
                          features: { ...prev.features, duplicateDetection: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Real-time Synchronization</p>
                      <p className="text-sm text-muted-foreground">
                        Sync transactions in real-time (may impact performance)
                      </p>
                    </div>
                    <Switch
                      checked={config.features.realTimeSync}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({
                          ...prev,
                          features: { ...prev.features, realTimeSync: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Batch Processing</p>
                      <p className="text-sm text-muted-foreground">
                        Process transactions in optimized batches
                      </p>
                    </div>
                    <Switch
                      checked={config.features.batchProcessing}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({
                          ...prev,
                          features: { ...prev.features, batchProcessing: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All credentials are encrypted and stored securely. Authentication follows
                    enterprise security standards.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label>Authentication Type</Label>
                    <Select
                      value={config.credentials.authType}
                      onValueChange={(value: any) => 
                        setConfig(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, authType: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oauth">OAuth 2.0</SelectItem>
                        <SelectItem value="basic">Basic Authentication</SelectItem>
                        <SelectItem value="certificate">Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.credentials.authType === 'oauth' && (
                    <>
                      <div>
                        <Label htmlFor="client-id">Client ID</Label>
                        <Input
                          id="client-id"
                          placeholder="your-client-id"
                          value={config.credentials.clientId || ''}
                          onChange={(e) => 
                            setConfig(prev => ({
                              ...prev,
                              credentials: { ...prev.credentials, clientId: e.target.value }
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="client-secret">Client Secret</Label>
                        <Input
                          id="client-secret"
                          type="password"
                          placeholder="••••••••••••"
                        />
                      </div>
                    </>
                  )}

                  {config.credentials.authType === 'basic' && (
                    <>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          placeholder="service-user"
                          value={config.credentials.username || ''}
                          onChange={(e) => 
                            setConfig(prev => ({
                              ...prev,
                              credentials: { ...prev.credentials, username: e.target.value }
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••••••"
                        />
                      </div>
                    </>
                  )}

                  <div className="pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">End-to-end encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Multi-tenant isolation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Audit trail for all operations</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={loadConfiguration}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfiguration} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}