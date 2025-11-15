'use client'

import React, { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Users, 
  Database, 
  Shield, 
  Palette,
  CreditCard,
  Bell,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Eye,
  EyeOff,
  Save,
  Zap,
  Clock,
  Target,
  Workflow
} from 'lucide-react'

/**
 * HERA Onboarding Setup - Application configuration wizard
 * 
 * Features:
 * - Multi-tab configuration interface
 * - Real-time validation and progress tracking  
 * - Business rules and workflow setup
 * - User roles and permissions
 * - Data import/export capabilities
 * - Mobile-first responsive design
 */

interface SetupConfig {
  business: {
    businessHours: string
    timezone: string
    currency: string
    taxRate: number
    enableInventory: boolean
    enableAppointments: boolean
    enableMultiLocation: boolean
  }
  users: {
    ownerEmail: string
    managerEmails: string[]
    staffEmails: string[]
    defaultRole: string
    requireMFA: boolean
    sessionTimeout: number
  }
  data: {
    importLegacyData: boolean
    legacySystem: string
    dataValidation: boolean
    autoBackup: boolean
    retentionDays: number
  }
  workflow: {
    autoAssignments: boolean
    notificationPreferences: {
      email: boolean
      sms: boolean
      push: boolean
    }
    approvalWorkflows: boolean
    customFields: Array<{
      name: string
      type: 'text' | 'number' | 'date' | 'boolean'
      required: boolean
    }>
  }
  integrations: {
    paymentProcessor: string
    emailProvider: string
    smsProvider: string
    accountingSystem: string
  }
}

interface SetupStep {
  id: string
  label: string
  description: string
  completed: boolean
  required: boolean
}

export default function OnboardingSetup() {
  const [config, setConfig] = useState<SetupConfig>({
    business: {
      businessHours: '9:00 AM - 6:00 PM',
      timezone: 'UTC',
      currency: 'USD',
      taxRate: 0,
      enableInventory: false,
      enableAppointments: true,
      enableMultiLocation: false
    },
    users: {
      ownerEmail: '',
      managerEmails: [],
      staffEmails: [],
      defaultRole: 'staff',
      requireMFA: false,
      sessionTimeout: 480
    },
    data: {
      importLegacyData: false,
      legacySystem: '',
      dataValidation: true,
      autoBackup: true,
      retentionDays: 365
    },
    workflow: {
      autoAssignments: true,
      notificationPreferences: {
        email: true,
        sms: false,
        push: true
      },
      approvalWorkflows: false,
      customFields: []
    },
    integrations: {
      paymentProcessor: '',
      emailProvider: '',
      smsProvider: '',
      accountingSystem: ''
    }
  })

  const [activeTab, setActiveTab] = useState('business')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const { user, organization } = useHERAAuth()

  // Setup steps for progress tracking
  const setupSteps: SetupStep[] = [
    {
      id: 'business',
      label: 'Business Settings',
      description: 'Configure basic business information',
      completed: !!(config.business.timezone && config.business.currency),
      required: true
    },
    {
      id: 'users',
      label: 'User Management',
      description: 'Set up user accounts and permissions',
      completed: !!(config.users.ownerEmail),
      required: true
    },
    {
      id: 'workflow',
      label: 'Workflow Setup',
      description: 'Configure business processes',
      completed: true, // Basic workflow is auto-configured
      required: false
    },
    {
      id: 'data',
      label: 'Data & Backup',
      description: 'Configure data management',
      completed: true, // Auto-configured with defaults
      required: false
    },
    {
      id: 'integrations',
      label: 'Integrations',
      description: 'Connect external services',
      completed: false,
      required: false
    }
  ]

  const completedSteps = setupSteps.filter(step => step.completed).length
  const totalSteps = setupSteps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  // Auto-populate owner email
  useEffect(() => {
    if (user?.email && !config.users.ownerEmail) {
      setConfig(prev => ({
        ...prev,
        users: {
          ...prev.users,
          ownerEmail: user.email
        }
      }))
    }
  }, [user])

  const updateConfig = (section: keyof SetupConfig, updates: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    }))
    setError(null)
  }

  const addCustomField = () => {
    setConfig(prev => ({
      ...prev,
      workflow: {
        ...prev.workflow,
        customFields: [
          ...prev.workflow.customFields,
          { name: '', type: 'text', required: false }
        ]
      }
    }))
  }

  const updateCustomField = (index: number, field: Partial<typeof config.workflow.customFields[0]>) => {
    setConfig(prev => ({
      ...prev,
      workflow: {
        ...prev.workflow,
        customFields: prev.workflow.customFields.map((f, i) => 
          i === index ? { ...f, ...field } : f
        )
      }
    }))
  }

  const removeCustomField = (index: number) => {
    setConfig(prev => ({
      ...prev,
      workflow: {
        ...prev.workflow,
        customFields: prev.workflow.customFields.filter((_, i) => i !== index)
      }
    }))
  }

  const saveConfiguration = async () => {
    try {
      setSaving(true)
      setError(null)

      // In a real implementation, this would save to the backend
      // For now, we'll simulate the save
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Navigate to next step
      window.location.href = '/onboarding/launch'
    } catch (err) {
      console.error('Error saving configuration:', err)
      setError('Failed to save configuration. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const timezones = [
    'UTC', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific',
    'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney'
  ]

  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'AED', name: 'UAE Dirham' }
  ]

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-champagne mb-2">Setup & Configuration</h1>
              <p className="text-bronze">Configure your HERA system for optimal performance</p>
            </div>
            <Button
              onClick={saveConfiguration}
              disabled={saving}
              className="min-h-[44px] bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save & Continue
            </Button>
          </div>

          {/* Progress Overview */}
          <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-champagne">
                  Setup Progress
                </span>
                <span className="text-sm text-bronze">
                  {completedSteps} of {totalSteps} completed
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2 bg-charcoal/50 mb-3" />
              <div className="flex flex-wrap gap-2">
                {setupSteps.map((step) => (
                  <Badge
                    key={step.id}
                    variant={step.completed ? 'default' : 'outline'}
                    className={step.completed ? 'bg-green-600' : 'border-gold/30'}
                  >
                    {step.completed && <CheckCircle className="w-3 h-3 mr-1" />}
                    {step.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Configuration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-charcoal/50">
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              <span className="hidden md:inline">Workflow</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden md:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden md:inline">Connect</span>
            </TabsTrigger>
          </TabsList>

          {/* Business Settings Tab */}
          <TabsContent value="business">
            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardHeader>
                <CardTitle className="text-champagne flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Business Configuration
                </CardTitle>
                <CardDescription className="text-bronze">
                  Configure your business settings and operational preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessHours" className="text-champagne">Business Hours</Label>
                    <Input
                      id="businessHours"
                      value={config.business.businessHours}
                      onChange={(e) => updateConfig('business', { businessHours: e.target.value })}
                      placeholder="9:00 AM - 6:00 PM"
                      className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                    />
                  </div>

                  <div>
                    <Label htmlFor="timezone" className="text-champagne">Timezone</Label>
                    <select
                      id="timezone"
                      value={config.business.timezone}
                      onChange={(e) => updateConfig('business', { timezone: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-charcoal/50 border border-gold/20 rounded-md text-champagne"
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="currency" className="text-champagne">Currency</Label>
                    <select
                      id="currency"
                      value={config.business.currency}
                      onChange={(e) => updateConfig('business', { currency: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-charcoal/50 border border-gold/20 rounded-md text-champagne"
                    >
                      {currencies.map((curr) => (
                        <option key={curr.code} value={curr.code}>{curr.code} - {curr.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="taxRate" className="text-champagne">Default Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={config.business.taxRate}
                      onChange={(e) => updateConfig('business', { taxRate: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.1"
                      className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-champagne">Feature Enablement</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div>
                        <p className="font-medium text-champagne">Inventory Management</p>
                        <p className="text-sm text-bronze">Track stock levels and product sales</p>
                      </div>
                      <Switch
                        checked={config.business.enableInventory}
                        onCheckedChange={(checked) => updateConfig('business', { enableInventory: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div>
                        <p className="font-medium text-champagne">Appointment Booking</p>
                        <p className="text-sm text-bronze">Enable online appointment scheduling</p>
                      </div>
                      <Switch
                        checked={config.business.enableAppointments}
                        onCheckedChange={(checked) => updateConfig('business', { enableAppointments: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div>
                        <p className="font-medium text-champagne">Multi-Location</p>
                        <p className="text-sm text-bronze">Manage multiple business locations</p>
                      </div>
                      <Switch
                        checked={config.business.enableMultiLocation}
                        onCheckedChange={(checked) => updateConfig('business', { enableMultiLocation: checked })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardHeader>
                <CardTitle className="text-champagne flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription className="text-bronze">
                  Set up user accounts, roles, and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="ownerEmail" className="text-champagne">Owner Email</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={config.users.ownerEmail}
                    onChange={(e) => updateConfig('users', { ownerEmail: e.target.value })}
                    placeholder="owner@business.com"
                    className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultRole" className="text-champagne">Default User Role</Label>
                    <select
                      id="defaultRole"
                      value={config.users.defaultRole}
                      onChange={(e) => updateConfig('users', { defaultRole: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-charcoal/50 border border-gold/20 rounded-md text-champagne"
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="sessionTimeout" className="text-champagne">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={config.users.sessionTimeout}
                      onChange={(e) => updateConfig('users', { sessionTimeout: parseInt(e.target.value) || 480 })}
                      min="30"
                      max="1440"
                      className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-champagne">Security Settings</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div>
                      <p className="font-medium text-champagne">Multi-Factor Authentication</p>
                      <p className="text-sm text-bronze">Require MFA for all user accounts</p>
                    </div>
                    <Switch
                      checked={config.users.requireMFA}
                      onCheckedChange={(checked) => updateConfig('users', { requireMFA: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow">
            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardHeader>
                <CardTitle className="text-champagne flex items-center gap-2">
                  <Workflow className="w-5 h-5" />
                  Workflow Configuration
                </CardTitle>
                <CardDescription className="text-bronze">
                  Configure business processes and custom fields
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-champagne">Automation Settings</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div>
                      <p className="font-medium text-champagne">Auto-Assignments</p>
                      <p className="text-sm text-bronze">Automatically assign tasks based on rules</p>
                    </div>
                    <Switch
                      checked={config.workflow.autoAssignments}
                      onCheckedChange={(checked) => updateConfig('workflow', { autoAssignments: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div>
                      <p className="font-medium text-champagne">Approval Workflows</p>
                      <p className="text-sm text-bronze">Require approval for certain actions</p>
                    </div>
                    <Switch
                      checked={config.workflow.approvalWorkflows}
                      onCheckedChange={(checked) => updateConfig('workflow', { approvalWorkflows: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-champagne">Notification Preferences</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div>
                        <p className="font-medium text-champagne">Email</p>
                        <p className="text-sm text-bronze">Email notifications</p>
                      </div>
                      <Switch
                        checked={config.workflow.notificationPreferences.email}
                        onCheckedChange={(checked) => updateConfig('workflow', {
                          notificationPreferences: {
                            ...config.workflow.notificationPreferences,
                            email: checked
                          }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div>
                        <p className="font-medium text-champagne">SMS</p>
                        <p className="text-sm text-bronze">Text notifications</p>
                      </div>
                      <Switch
                        checked={config.workflow.notificationPreferences.sms}
                        onCheckedChange={(checked) => updateConfig('workflow', {
                          notificationPreferences: {
                            ...config.workflow.notificationPreferences,
                            sms: checked
                          }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div>
                        <p className="font-medium text-champagne">Push</p>
                        <p className="text-sm text-bronze">Push notifications</p>
                      </div>
                      <Switch
                        checked={config.workflow.notificationPreferences.push}
                        onCheckedChange={(checked) => updateConfig('workflow', {
                          notificationPreferences: {
                            ...config.workflow.notificationPreferences,
                            push: checked
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-champagne">Custom Fields</h3>
                    <Button
                      onClick={addCustomField}
                      variant="outline"
                      className="border-gold/30 text-champagne hover:bg-gold/10"
                    >
                      Add Field
                    </Button>
                  </div>

                  {config.workflow.customFields.map((field, index) => (
                    <div key={index} className="p-4 bg-black/20 rounded-lg space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          placeholder="Field name"
                          value={field.name}
                          onChange={(e) => updateCustomField(index, { name: e.target.value })}
                          className="bg-charcoal/50 border-gold/20 text-champagne"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateCustomField(index, { type: e.target.value as any })}
                          className="px-3 py-2 bg-charcoal/50 border border-gold/20 rounded-md text-champagne"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="boolean">Yes/No</option>
                        </select>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={field.required}
                              onCheckedChange={(checked) => updateCustomField(index, { required: checked })}
                            />
                            <span className="text-sm text-champagne">Required</span>
                          </div>
                          <Button
                            onClick={() => removeCustomField(index)}
                            variant="destructive"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {config.workflow.customFields.length === 0 && (
                    <div className="text-center p-8 text-bronze">
                      No custom fields defined. Click "Add Field" to create one.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data">
            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardHeader>
                <CardTitle className="text-champagne flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Data Management
                </CardTitle>
                <CardDescription className="text-bronze">
                  Configure data import, backup, and retention settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-champagne">Data Import</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div>
                      <p className="font-medium text-champagne">Import Legacy Data</p>
                      <p className="text-sm text-bronze">Import data from your previous system</p>
                    </div>
                    <Switch
                      checked={config.data.importLegacyData}
                      onCheckedChange={(checked) => updateConfig('data', { importLegacyData: checked })}
                    />
                  </div>

                  {config.data.importLegacyData && (
                    <div>
                      <Label htmlFor="legacySystem" className="text-champagne">Previous System</Label>
                      <Input
                        id="legacySystem"
                        value={config.data.legacySystem}
                        onChange={(e) => updateConfig('data', { legacySystem: e.target.value })}
                        placeholder="QuickBooks, Excel, etc."
                        className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-champagne">Backup & Retention</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div>
                      <p className="font-medium text-champagne">Automatic Backups</p>
                      <p className="text-sm text-bronze">Enable daily automated backups</p>
                    </div>
                    <Switch
                      checked={config.data.autoBackup}
                      onCheckedChange={(checked) => updateConfig('data', { autoBackup: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div>
                      <p className="font-medium text-champagne">Data Validation</p>
                      <p className="text-sm text-bronze">Validate data integrity automatically</p>
                    </div>
                    <Switch
                      checked={config.data.dataValidation}
                      onCheckedChange={(checked) => updateConfig('data', { dataValidation: checked })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="retentionDays" className="text-champagne">Data Retention (days)</Label>
                    <Input
                      id="retentionDays"
                      type="number"
                      value={config.data.retentionDays}
                      onChange={(e) => updateConfig('data', { retentionDays: parseInt(e.target.value) || 365 })}
                      min="30"
                      max="2555" // 7 years
                      className="mt-1 bg-charcoal/50 border-gold/20 text-champagne"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card className="bg-charcoal/50 backdrop-blur-md border-gold/20">
              <CardHeader>
                <CardTitle className="text-champagne flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  External Integrations
                </CardTitle>
                <CardDescription className="text-bronze">
                  Connect HERA with your existing tools and services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentProcessor" className="text-champagne">Payment Processor</Label>
                    <select
                      id="paymentProcessor"
                      value={config.integrations.paymentProcessor}
                      onChange={(e) => updateConfig('integrations', { paymentProcessor: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-charcoal/50 border border-gold/20 rounded-md text-champagne"
                    >
                      <option value="">Select payment processor</option>
                      <option value="stripe">Stripe</option>
                      <option value="square">Square</option>
                      <option value="paypal">PayPal</option>
                      <option value="clover">Clover</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="emailProvider" className="text-champagne">Email Provider</Label>
                    <select
                      id="emailProvider"
                      value={config.integrations.emailProvider}
                      onChange={(e) => updateConfig('integrations', { emailProvider: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-charcoal/50 border border-gold/20 rounded-md text-champagne"
                    >
                      <option value="">Select email provider</option>
                      <option value="mailchimp">Mailchimp</option>
                      <option value="sendgrid">SendGrid</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="gmail">Gmail</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="smsProvider" className="text-champagne">SMS Provider</Label>
                    <select
                      id="smsProvider"
                      value={config.integrations.smsProvider}
                      onChange={(e) => updateConfig('integrations', { smsProvider: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-charcoal/50 border border-gold/20 rounded-md text-champagne"
                    >
                      <option value="">Select SMS provider</option>
                      <option value="twilio">Twilio</option>
                      <option value="nexmo">Nexmo</option>
                      <option value="messagebird">MessageBird</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="accountingSystem" className="text-champagne">Accounting System</Label>
                    <select
                      id="accountingSystem"
                      value={config.integrations.accountingSystem}
                      onChange={(e) => updateConfig('integrations', { accountingSystem: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-charcoal/50 border border-gold/20 rounded-md text-champagne"
                    >
                      <option value="">Select accounting system</option>
                      <option value="quickbooks">QuickBooks</option>
                      <option value="xero">Xero</option>
                      <option value="sage">Sage</option>
                      <option value="netsuite">NetSuite</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>Note:</strong> Integration setup will be completed during the launch phase.
                    You can change these selections later if needed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}