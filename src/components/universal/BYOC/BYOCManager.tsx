'use client'

/**
 * HERA Universal BYOC (Bring Your Own Cloud) Manager
 * A reusable component for managing cloud storage configurations across any HERA application
 *
 * Features:
 * - Multi-provider support (AWS, Azure, GCP, Custom)
 * - Secure secret management with encryption
 * - Connection testing and validation
 * - Export/import configurations
 * - Audit logging
 * - Role-based access control
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Switch } from '@/src/components/ui/switch'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import {
  Database,
  Shield,
  Key,
  Download,
  Upload,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Zap,
  Settings,
  Copy,
  Trash2,
  Plus,
  Edit3,
  Save,
  RefreshCw,
  Lock,
  Unlock,
  Globe,
  Cloud,
  Server,
  HardDrive,
  Activity,
  Users,
  Crown
} from 'lucide-react'

export interface BYOCConfig {
  id?: string
  name: string
  description?: string
  provider: 'aws' | 'azure' | 'gcp' | 'custom' | 'default'
  config: Record<string, any>
  permissions: {
    read: boolean
    write: boolean
    delete: boolean
    process: boolean
  }
  advanced: {
    encryption: boolean
    compression: boolean
    versioning: boolean
    maxFileSize: number
    allowedTypes: string[]
  }
  metadata: {
    createdAt: string
    updatedAt: string
    createdBy: string
    isActive: boolean
    tags: string[]
  }
}

interface BYOCManagerProps {
  applicationId: string
  organizationId: string
  userId: string
  userRole: 'admin' | 'user' | 'viewer'
  onConfigChange?: (config: BYOCConfig) => void
  onSecretChange?: (secrets: Record<string, string>) => void
  initialConfigs?: BYOCConfig[]
  readOnly?: boolean
  theme?: 'light' | 'dark' | 'auto'
}

export function BYOCManager({
  applicationId,
  organizationId,
  userId,
  userRole,
  onConfigChange,
  onSecretChange,
  initialConfigs = [],
  readOnly = false,
  theme = 'auto'
}: BYOCManagerProps) {
  const [configs, setConfigs] = useState<BYOCConfig[]>(initialConfigs)
  const [selectedConfig, setSelectedConfig] = useState<BYOCConfig | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const [activeTab, setActiveTab] = useState<'configs' | 'secrets' | 'testing' | 'audit'>('configs')
  const [connectionStatus, setConnectionStatus] = useState<
    Record<string, { connected: boolean; latency?: number; error?: string }>
  >({})
  const [isLoading, setIsLoading] = useState(false)

  // New configuration state
  const [newConfig, setNewConfig] = useState<Partial<BYOCConfig>>({
    name: '',
    description: '',
    provider: 'default',
    config: {},
    permissions: { read: true, write: true, delete: false, process: true },
    advanced: {
      encryption: true,
      compression: true,
      versioning: false,
      maxFileSize: 100,
      allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx']
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      isActive: false,
      tags: []
    }
  })

  const providers = [
    {
      id: 'default',
      name: 'HERA Default Storage',
      description: 'Managed storage with automatic backups',
      icon: <Database className="w-5 h-5 text-primary" />,
      color: 'blue',
      fields: []
    },
    {
      id: 'aws',
      name: 'Amazon S3',
      description: 'AWS Simple Storage Service',
      icon: <div className="w-5 h-5 bg-orange-500 rounded"></div>,
      color: 'orange',
      fields: ['accessKeyId', 'secretAccessKey', 'region', 'bucketName', 'path']
    },
    {
      id: 'azure',
      name: 'Azure Blob Storage',
      description: 'Microsoft Azure Cloud Storage',
      icon: <div className="w-5 h-5 bg-blue-500 rounded"></div>,
      color: 'blue',
      fields: ['accountName', 'accountKey', 'containerName', 'path']
    },
    {
      id: 'gcp',
      name: 'Google Cloud Storage',
      description: 'GCP Object Storage',
      icon: <div className="w-5 h-5 bg-green-500 rounded"></div>,
      color: 'green',
      fields: ['projectId', 'keyFile', 'bucketName', 'path']
    },
    {
      id: 'custom',
      name: 'Custom S3-Compatible',
      description: 'MinIO, DigitalOcean, Wasabi, etc.',
      icon: <div className="w-5 h-5 bg-purple-500 rounded"></div>,
      color: 'purple',
      fields: ['endpoint', 'accessKey', 'secretKey', 'bucketName', 'path', 'region', 'ssl']
    }
  ]

  const canEdit = userRole === 'admin' && !readOnly
  const canView = ['admin', 'user', 'viewer'].includes(userRole)
  const canManageSecrets = userRole === 'admin' && !readOnly

  // Load configurations on mount
  useEffect(() => {
    loadConfigurations()
  }, [applicationId, organizationId])

  const loadConfigurations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/v1/universal/byoc?applicationId=${applicationId}&organizationId=${organizationId}`
      )
      const result = await response.json()

      if (result.success) {
        setConfigs(result.data || [])
      }
    } catch (error) {
      console.error('Error loading BYOC configurations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfiguration = async (config: Partial<BYOCConfig>) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/v1/universal/byoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          organizationId,
          userId,
          config: {
            ...config,
            metadata: {
              ...config.metadata,
              updatedAt: new Date().toISOString()
            }
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        await loadConfigurations()
        setIsEditing(false)
        setNewConfig({
          name: '',
          provider: 'default',
          config: {},
          permissions: { read: true, write: true, delete: false, process: true },
          advanced: {
            encryption: true,
            compression: true,
            versioning: false,
            maxFileSize: 100,
            allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx']
          },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userId,
            isActive: false,
            tags: []
          }
        })

        if (onConfigChange) {
          onConfigChange(result.data)
        }
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async (config: BYOCConfig) => {
    try {
      setIsLoading(true)
      setConnectionStatus(prev => ({ ...prev, [config.id!]: { connected: false } }))

      const response = await fetch('/api/v1/universal/byoc/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          organizationId,
          configId: config.id,
          testType: 'connection'
        })
      })

      const result = await response.json()

      if (result.success) {
        setConnectionStatus(prev => ({
          ...prev,
          [config.id!]: {
            connected: result.data.connected,
            latency: result.data.latency,
            error: result.data.error
          }
        }))
      }
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        [config.id!]: {
          connected: false,
          error: error instanceof Error ? error.message : 'Connection failed'
        }
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const exportConfiguration = async (config: BYOCConfig) => {
    const exportData = {
      ...config,
      config: showSecrets
        ? config.config
        : Object.keys(config.config).reduce(
            (acc, key) => {
              acc[key] =
                key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
                  ? '***HIDDEN***'
                  : config.config[key]
              return acc
            },
            {} as Record<string, any>
          ),
      exportedAt: new Date().toISOString(),
      exportedBy: userId
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `byoc-config-${config.name.replace(/\s+/g, '-').toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const activateConfiguration = async (configId: string) => {
    try {
      // Deactivate all configs first
      setConfigs(prev => prev.map(c => ({ ...c, metadata: { ...c.metadata, isActive: false } })))

      // Activate selected config
      setConfigs(prev =>
        prev.map(c =>
          c.id === configId ? { ...c, metadata: { ...c.metadata, isActive: true } } : c
        )
      )

      // API call to persist
      await fetch('/api/v1/universal/byoc/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          organizationId,
          configId
        })
      })
    } catch (error) {
      console.error('Error activating configuration:', error)
    }
  }

  const renderProviderConfig = (
    provider: string,
    config: Record<string, any>,
    onChange: (newConfig: Record<string, any>) => void
  ) => {
    const providerInfo = providers.find(p => p.id === provider)
    if (!providerInfo || providerInfo.fields.length === 0) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          {providerInfo.icon}
          <div>
            <h4 className="font-semibold text-gray-100">{providerInfo.name}</h4>
            <p className="text-sm text-muted-foreground">{providerInfo.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providerInfo.fields.map(field => {
            const isSecret =
              field.toLowerCase().includes('key') || field.toLowerCase().includes('secret')
            const isBoolean = field === 'ssl'
            const isTextarea = field === 'keyFile'

            if (isBoolean) {
              return (
                <div key={field} className="flex items-center justify-between">
                  <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
                  <Switch
                    checked={config[field] || false}
                    onCheckedChange={checked => onChange({ ...config, [field]: checked })}
                    disabled={!canEdit}
                  />
                </div>
              )
            }

            if (isTextarea) {
              return (
                <div key={field} className="md:col-span-2 space-y-2">
                  <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
                  <Textarea
                    value={config[field] || ''}
                    onChange={e => onChange({ ...config, [field]: e.target.value })}
                    placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                    rows={3}
                    className="font-mono text-xs"
                    disabled={!canEdit}
                  />
                </div>
              )
            }

            return (
              <div key={field} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
                  {isSecret && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowSecrets(!showSecrets)}
                    >
                      {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  )}
                </div>
                <Input
                  type={isSecret && !showSecrets ? 'password' : 'text'}
                  value={config[field] || ''}
                  onChange={e => onChange({ ...config, [field]: e.target.value })}
                  placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                  disabled={!canEdit}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <Cloud className="w-8 h-8 text-primary" />
            Universal BYOC Manager
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-foreground border-0">
              <Crown className="w-3 h-3 mr-1" />
              Enterprise
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Bring Your Own Cloud storage configuration for {applicationId}
          </p>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-50 border-blue-200 text-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Configuration
            </Button>
            <Button variant="outline" onClick={loadConfigurations} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab as any} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configs">Configurations</TabsTrigger>
          <TabsTrigger value="secrets">Secret Management</TabsTrigger>
          <TabsTrigger value="testing">Testing & Validation</TabsTrigger>
          <TabsTrigger value="audit">Audit & Logs</TabsTrigger>
        </TabsList>

        {/* Configurations Tab */}
        <TabsContent value="configs" className="space-y-6">
          {/* Existing Configurations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map(config => {
              const provider = providers.find(p => p.id === config.provider)
              const status = connectionStatus[config.id!]

              return (
                <Card
                  key={config.id}
                  className={`relative ${config.metadata.isActive ? 'ring-2 ring-green-500' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {provider?.icon}
                        <div>
                          <CardTitle className="text-lg">{config.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{provider?.name}</p>
                        </div>
                      </div>

                      {config.metadata.isActive && (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {config.description && (
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    )}

                    {/* Status Indicator */}
                    {status && (
                      <div
                        className={`flex items-center gap-2 text-sm ${
                          status.connected ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {status.connected ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        {status.connected
                          ? `Connected (${status.latency}ms)`
                          : status.error || 'Connection failed'}
                      </div>
                    )}

                    {/* Permissions */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(config.permissions).map(([perm, enabled]) => (
                        <Badge
                          key={perm}
                          className={`text-xs ${
                            enabled ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {perm.toUpperCase()}
                        </Badge>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnection(config)}
                        disabled={isLoading}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Test
                      </Button>

                      {!config.metadata.isActive && canEdit && (
                        <Button
                          size="sm"
                          onClick={() => activateConfiguration(config.id!)}
                          className="bg-green-600 hover:bg-green-700 text-foreground"
                        >
                          Activate
                        </Button>
                      )}

                      {canView && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportConfiguration(config)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Add New Configuration */}
          {isEditing && canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Add New BYOC Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Configuration Name</Label>
                    <Input
                      value={newConfig.name || ''}
                      onChange={e => setNewConfig({ ...newConfig, name: e.target.value })}
                      placeholder="Enter configuration name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={newConfig.provider}
                      onValueChange={value =>
                        setNewConfig({ ...newConfig, provider: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="hera-select-content">
                        {providers.map(provider => (
                          <SelectItem
                            key={provider.id}
                            className="hera-select-item"
                            value={provider.id}
                          >
                            <div className="flex items-center gap-2">
                              {provider.icon}
                              <div>
                                <div className="font-medium">{provider.name}</div>
                                <div className="text-xs text-muted-foreground">{provider.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Description (Optional)</Label>
                    <Input
                      value={newConfig.description || ''}
                      onChange={e => setNewConfig({ ...newConfig, description: e.target.value })}
                      placeholder="Enter configuration description"
                    />
                  </div>
                </div>

                {/* Provider-specific configuration */}
                {renderProviderConfig(newConfig.provider!, newConfig.config || {}, config =>
                  setNewConfig({ ...newConfig, config })
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => saveConfiguration(newConfig)}
                    disabled={!newConfig.name || isLoading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Secret Management Tab */}
        <TabsContent value="secrets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Secret Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage encrypted secrets and credentials for cloud storage providers
              </p>
            </CardHeader>
            <CardContent>
              {!canManageSecrets ? (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">You don't have permission to manage secrets</p>
                  <p className="text-sm text-muted-foreground">Contact your administrator for access</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        All secrets are encrypted using AES-256 encryption
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Key className="w-4 h-4 mr-2" />
                      Rotate Keys
                    </Button>
                  </div>

                  {/* Secret management interface would go here */}
                  <p className="text-muted-foreground">
                    Secret management interface would be implemented here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Connection Testing & Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connection testing interface would be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Audit Trail & Access Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Audit trail interface would be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BYOCManager
