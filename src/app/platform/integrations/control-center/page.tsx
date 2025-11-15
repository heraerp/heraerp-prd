/**
 * HERA Integration Control Center - Platform Administration
 * Smart Code: HERA.PLATFORM.INTEGRATION.CONTROL_CENTER.v1
 * 
 * Platform-level management of integration connectors, assignments, and monitoring
 * Only accessible by Platform organization administrators
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
  Settings,
  Plus,
  Edit,
  Trash2,
  Activity,
  Globe,
  Shield,
  Users,
  BarChart3,
  Webhook,
  Check,
  X,
  ExternalLink,
  AlertTriangle,
  Plug2,
  MessageSquare,
  Linkedin,
  Share2,
  Zap,
  Eye
} from 'lucide-react'

// Platform organization check - only platform org can access
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

interface ConnectorDefinition {
  id: string
  code: string
  name: string
  description: string
  category: 'social' | 'messaging' | 'crm' | 'ecommerce' | 'finance' | 'automation'
  icon: string
  status: 'active' | 'inactive' | 'beta'
  version: string
  auth_type: 'oauth2' | 'api_key' | 'webhook'
  supported_events: string[]
  smart_code: string
  created_at: string
  installations_count: number
}

interface OrganizationAssignment {
  org_id: string
  org_name: string
  connector_code: string
  status: 'active' | 'pending' | 'disabled'
  assigned_at: string
  installation_id?: string
}

const connectorIcons = {
  'whatsapp': MessageSquare,
  'linkedin': Linkedin,
  'meta': Share2,
  'zapier': Zap,
  'hubspot': Users,
  'salesforce': BarChart3
}

export default function IntegrationControlCenter() {
  const { user, organization, hasScope } = useHERAAuth()
  const [connectors, setConnectors] = useState<ConnectorDefinition[]>([])
  const [assignments, setAssignments] = useState<OrganizationAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('catalog')
  
  // Modal states
  const [showConnectorModal, setShowConnectorModal] = useState(false)
  const [editingConnector, setEditingConnector] = useState<ConnectorDefinition | null>(null)
  const [newConnector, setNewConnector] = useState({
    code: '',
    name: '',
    description: '',
    category: 'social' as const,
    auth_type: 'oauth2' as const,
    supported_events: [] as string[],
    status: 'active' as const
  })

  // Security check - only platform org administrators
  useEffect(() => {
    if (organization?.id !== PLATFORM_ORG_ID) {
      return // Will show access denied below
    }
    
    loadConnectors()
    loadAssignments()
  }, [organization])

  const loadConnectors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v2/integrations/connectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          operation: 'LIST',
          connector_type: 'INTEGRATION_CONNECTOR_DEF'
        })
      })
      
      if (!response.ok) throw new Error('Failed to load connectors')
      
      const data = await response.json()
      setConnectors(data.connectors || [])
    } catch (error) {
      console.error('Error loading connectors:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/v2/integrations/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  const createConnector = async () => {
    try {
      const smart_code = `HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.${newConnector.code.toUpperCase().replace(/-/g, '_')}.v1`
      
      const response = await fetch('/api/v2/integrations/connectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          operation: 'CREATE_DEFINITION',
          connector_code: newConnector.code,
          connector_config: {
            display_name: newConnector.name,
            description: newConnector.description,
            category: newConnector.category,
            auth_type: newConnector.auth_type,
            supported_events: newConnector.supported_events,
            status: newConnector.status,
            version: '1.0.0'
          },
          smart_code
        })
      })
      
      if (!response.ok) throw new Error('Failed to create connector')
      
      await loadConnectors()
      setShowConnectorModal(false)
      setNewConnector({
        code: '',
        name: '',
        description: '',
        category: 'social',
        auth_type: 'oauth2',
        supported_events: [],
        status: 'active'
      })
    } catch (error) {
      console.error('Error creating connector:', error)
    }
  }

  // Access control
  if (!hasScope || !hasScope('platform_admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Alert className="max-w-md border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription>
            Access denied. Platform administrator privileges required to access the Integration Control Center.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (organization?.id !== PLATFORM_ORG_ID) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Alert className="max-w-md border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            Integration Control Center is only available for the Platform organization.
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
                <Settings className="h-8 w-8 text-blue-600" />
                Integration Control Center
              </h1>
              <p className="text-gray-600 mt-1">
                Manage connector definitions, assignments, and global integration monitoring
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Plug2 className="h-4 w-4" />
                  {connectors.length} Connectors
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {assignments.length} Assignments
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Platform Admin
              </Badge>
              <Dialog open={showConnectorModal} onOpenChange={setShowConnectorModal}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Connector
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Integration Connector</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="code">Connector Code</Label>
                        <Input
                          id="code"
                          placeholder="e.g. whatsapp-cloud"
                          value={newConnector.code}
                          onChange={(e) => setNewConnector({...newConnector, code: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g. WhatsApp Cloud API"
                          value={newConnector.name}
                          onChange={(e) => setNewConnector({...newConnector, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what this connector does..."
                        value={newConnector.description}
                        onChange={(e) => setNewConnector({...newConnector, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={newConnector.category}
                          onChange={(e) => setNewConnector({...newConnector, category: e.target.value as any})}
                        >
                          <option value="social">Social Media</option>
                          <option value="messaging">Messaging</option>
                          <option value="crm">CRM</option>
                          <option value="ecommerce">E-commerce</option>
                          <option value="finance">Finance</option>
                          <option value="automation">Automation</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="auth_type">Authentication</Label>
                        <select
                          id="auth_type"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={newConnector.auth_type}
                          onChange={(e) => setNewConnector({...newConnector, auth_type: e.target.value as any})}
                        >
                          <option value="oauth2">OAuth 2.0</option>
                          <option value="api_key">API Key</option>
                          <option value="webhook">Webhook Only</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setShowConnectorModal(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createConnector} disabled={!newConnector.code || !newConnector.name}>
                        Create Connector
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Plug2 className="h-4 w-4" />
              Connector Catalog
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Organization Assignments
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Global Monitoring
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Connector Catalog Tab */}
          <TabsContent value="catalog" className="space-y-6">
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectors.map((connector) => {
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
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={connector.status === 'active' ? 'default' : 'secondary'}
                              className={connector.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {connector.status}
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">{connector.description}</p>
                        
                        <div className="space-y-3">
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
                            <span className="text-gray-500">Installations:</span>
                            <span className="font-medium">{connector.installations_count || 0}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Events:</span>
                            <span className="font-medium">{connector.supported_events?.length || 0}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Organization Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Connector Assignments</CardTitle>
                <p className="text-sm text-gray-600">
                  Manage which connectors are available to each organization
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Connector</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={`${assignment.org_id}-${assignment.connector_code}`}>
                        <TableCell className="font-medium">{assignment.org_name}</TableCell>
                        <TableCell>{assignment.connector_code}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={assignment.status === 'active' ? 'default' : 'secondary'}
                            className={assignment.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {assignment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(assignment.assigned_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Global Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">12,547</p>
                      <p className="text-sm text-gray-600">Total Events Today</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">98.7%</p>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">156</p>
                      <p className="text-sm text-gray-600">Failed Events</p>
                    </div>
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">45ms</p>
                      <p className="text-sm text-gray-600">Avg Response Time</p>
                    </div>
                    <Zap className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Live Integration Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Real-time event monitoring dashboard coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Analytics & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Advanced analytics and reporting dashboard coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}