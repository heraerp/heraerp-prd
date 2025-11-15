/**
 * HERA Integration Hub - Tenant Organization Integration Management
 * Smart Code: HERA.TENANT.INTEGRATION.HUB.v1
 * 
 * Tenant-level management of integration installations, configurations, and monitoring
 * Accessible by organization administrators and integration managers
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plug2,
  Settings,
  Plus,
  Eye,
  Trash2,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Linkedin,
  Share2,
  Zap,
  Key,
  Globe,
  RefreshCw,
  Download,
  BarChart3,
  Shield,
  Users,
  ExternalLink,
  ArrowRight,
  Pause,
  Play,
  Webhook
} from 'lucide-react'

interface ConnectorDefinition {
  id: string
  code: string
  name: string
  description: string
  category: 'social' | 'messaging' | 'crm' | 'ecommerce' | 'finance' | 'automation'
  icon: string
  version: string
  auth_type: 'oauth2' | 'api_key' | 'webhook'
  supported_events: string[]
  is_installed: boolean
  installation_id?: string
  smart_code: string
}

interface ConnectorInstallation {
  id: string
  connector_code: string
  connector_name: string
  status: 'active' | 'paused' | 'error'
  installed_at: string
  last_sync: string
  events_today: number
  success_rate: number
  config: any
}

interface IntegrationLog {
  id: string
  connector_code: string
  event_type: string
  status: 'success' | 'error' | 'pending'
  message: string
  timestamp: string
  payload_size: number
}

const connectorIcons = {
  'whatsapp': MessageSquare,
  'linkedin': Linkedin,
  'meta': Share2,
  'zapier': Zap,
  'hubspot': Users,
  'salesforce': BarChart3
}

export default function IntegrationHub() {
  const { user, organization, hasScope } = useHERAAuth()
  const [availableConnectors, setAvailableConnectors] = useState<ConnectorDefinition[]>([])
  const [installations, setInstallations] = useState<ConnectorInstallation[]>([])
  const [logs, setLogs] = useState<IntegrationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('my-integrations')
  
  // Modal states
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [installingConnector, setInstallingConnector] = useState<ConnectorDefinition | null>(null)
  const [installConfig, setInstallConfig] = useState({
    api_key: '',
    webhook_url: '',
    enabled_events: [] as string[]
  })

  useEffect(() => {
    if (!organization?.id) return
    
    loadAvailableConnectors()
    loadInstallations()
    loadLogs()
  }, [organization])

  const loadAvailableConnectors = async () => {
    try {
      const response = await fetch('/api/v2/integrations/connectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
          'X-Organization-Id': organization?.id!
        },
        body: JSON.stringify({
          operation: 'LIST_AVAILABLE'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableConnectors(data.connectors || [])
      }
    } catch (error) {
      console.error('Error loading available connectors:', error)
    }
  }

  const loadInstallations = async () => {
    try {
      const response = await fetch('/api/v2/integrations/connectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
          'X-Organization-Id': organization?.id!
        },
        body: JSON.stringify({
          operation: 'LIST',
          connector_type: 'INTEGRATION_CONNECTOR_INSTALL'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setInstallations(data.connectors || [])
      }
    } catch (error) {
      console.error('Error loading installations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/v2/integrations/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
          'X-Organization-Id': organization?.id!
        },
        body: JSON.stringify({
          limit: 50
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    }
  }

  const installConnector = async () => {
    if (!installingConnector) return
    
    try {
      const response = await fetch('/api/v2/integrations/connectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
          'X-Organization-Id': organization?.id!
        },
        body: JSON.stringify({
          operation: 'INSTALL',
          connector_code: installingConnector.code,
          installation_config: installConfig
        })
      })
      
      if (!response.ok) throw new Error('Failed to install connector')
      
      await loadInstallations()
      await loadAvailableConnectors()
      setShowInstallModal(false)
      setInstallingConnector(null)
      setInstallConfig({ api_key: '', webhook_url: '', enabled_events: [] })
    } catch (error) {
      console.error('Error installing connector:', error)
    }
  }

  const pauseConnector = async (installationId: string) => {
    try {
      const response = await fetch('/api/v2/integrations/connectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
          'X-Organization-Id': organization?.id!
        },
        body: JSON.stringify({
          operation: 'PAUSE',
          installation_id: installationId
        })
      })
      
      if (response.ok) {
        await loadInstallations()
      }
    } catch (error) {
      console.error('Error pausing connector:', error)
    }
  }

  // Access control
  if (!hasScope || !hasScope('integration_admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Alert className="max-w-md border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription>
            Access denied. Integration management privileges required to access the Integration Hub.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Plug2 className="h-8 w-8 text-purple-600" />
                Integration Hub
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your organization's integrations with external platforms
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {installations.filter(i => i.status === 'active').length} Active
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  {installations.filter(i => i.status === 'paused').length} Paused
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  {installations.filter(i => i.status === 'error').length} Issues
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {organization?.entity_name}
              </Badge>
              <Button variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Sync All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="my-integrations" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              My Integrations
            </TabsTrigger>
            <TabsTrigger value="available" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Available Integrations
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Integration Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* My Integrations Tab */}
          <TabsContent value="my-integrations" className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : installations.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Plug2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No Integrations Installed</h3>
                  <p className="text-gray-600 mb-6">
                    Connect your organization with external platforms to automate workflows and sync data.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('available')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Browse Available Integrations
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {installations.map((installation) => {
                  const IconComponent = connectorIcons[installation.connector_code as keyof typeof connectorIcons] || Globe
                  
                  return (
                    <Card key={installation.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{installation.connector_name}</CardTitle>
                              <p className="text-sm text-gray-500">{installation.connector_code}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={installation.status === 'active' ? 'default' : 'secondary'}
                              className={
                                installation.status === 'active' ? 'bg-green-100 text-green-800' :
                                installation.status === 'error' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {installation.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Events Today:</span>
                            <span className="font-medium">{installation.events_today}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Success Rate:</span>
                            <span className="font-medium">{installation.success_rate}%</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Last Sync:</span>
                            <span className="font-medium">
                              {installation.last_sync ? new Date(installation.last_sync).toLocaleString() : 'Never'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Installed:</span>
                            <span className="font-medium">
                              {new Date(installation.installed_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => pauseConnector(installation.id)}
                          >
                            {installation.status === 'active' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Available Integrations Tab */}
          <TabsContent value="available" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableConnectors.map((connector) => {
                const IconComponent = connectorIcons[connector.code as keyof typeof connectorIcons] || Globe
                
                return (
                  <Card key={connector.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{connector.name}</CardTitle>
                            <p className="text-sm text-gray-500">{connector.code}</p>
                          </div>
                        </div>
                        {connector.is_installed && (
                          <Badge className="bg-green-100 text-green-800">
                            Installed
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{connector.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Category:</span>
                          <Badge variant="outline" className="capitalize">
                            {connector.category}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Authentication:</span>
                          <span className="font-medium capitalize">{connector.auth_type.replace('_', ' ')}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Events:</span>
                          <span className="font-medium">{connector.supported_events?.length || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {connector.is_installed ? (
                          <Button variant="outline" size="sm" className="flex-1" disabled>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Installed
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setInstallingConnector(connector)
                              setShowInstallModal(true)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Install
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Install Connector Modal */}
            <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    Install {installingConnector?.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {installingConnector?.description}
                    </p>
                  </div>
                  
                  {installingConnector?.auth_type === 'api_key' && (
                    <div>
                      <Label htmlFor="api_key">API Key</Label>
                      <Input
                        id="api_key"
                        type="password"
                        placeholder="Enter your API key"
                        value={installConfig.api_key}
                        onChange={(e) => setInstallConfig({...installConfig, api_key: e.target.value})}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
                    <Input
                      id="webhook_url"
                      placeholder="https://your-domain.com/webhooks"
                      value={installConfig.webhook_url}
                      onChange={(e) => setInstallConfig({...installConfig, webhook_url: e.target.value})}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      HERA will send events to this URL
                    </p>
                  </div>
                  
                  <div>
                    <Label>Enabled Events</Label>
                    <div className="space-y-2 mt-2">
                      {installingConnector?.supported_events.map((event) => (
                        <div key={event} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={event}
                            checked={installConfig.enabled_events.includes(event)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setInstallConfig({
                                  ...installConfig,
                                  enabled_events: [...installConfig.enabled_events, event]
                                })
                              } else {
                                setInstallConfig({
                                  ...installConfig,
                                  enabled_events: installConfig.enabled_events.filter(e => e !== event)
                                })
                              }
                            }}
                          />
                          <Label htmlFor={event} className="capitalize">
                            {event.replace(/_/g, ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowInstallModal(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={installConnector}
                      disabled={installingConnector?.auth_type === 'api_key' && !installConfig.api_key}
                    >
                      Install Integration
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Integration Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Integration Event Logs</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Connector</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.connector_code}</TableCell>
                        <TableCell>{log.event_type}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className={log.status === 'success' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{log.message}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {(log.payload_size / 1024).toFixed(1)}KB
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Settings</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure global integration preferences for your organization
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-retry">Automatic Retry on Failure</Label>
                    <p className="text-sm text-gray-500">
                      Automatically retry failed integration events
                    </p>
                  </div>
                  <Switch id="auto-retry" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="error-notifications">Error Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Send email notifications when integrations fail
                    </p>
                  </div>
                  <Switch id="error-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="data-retention">Extended Data Retention</Label>
                    <p className="text-sm text-gray-500">
                      Keep integration logs for 90 days instead of 30
                    </p>
                  </div>
                  <Switch id="data-retention" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}