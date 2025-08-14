'use client'

import React, { useState } from 'react'
import { BPOManagementSidebar } from '@/components/bpo-progressive/BPOManagementSidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Settings, User, Building, Bell, Shield, Clock,
  Save, RefreshCw, AlertTriangle, CheckCircle,
  Mail, Phone, Globe, Database, Sparkles,
  Users, Target, Zap, Award
} from 'lucide-react'
import { BPOPriority, BPOComplexity, BPO_SLA_MATRIX } from '@/lib/bpo/bpo-entities'

export default function BPOSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'notifications' | 'sla' | 'security' | 'storage'>('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  // Mock user data - would come from auth context
  const currentUser = {
    id: 'user-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'head-office',
    organization: 'ACME Corporation',
    department: 'Finance',
    phone: '+1 (555) 123-4567',
    title: 'Finance Manager'
  }

  // Settings state
  const [profileSettings, setProfileSettings] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    title: currentUser.title,
    department: currentUser.department
  })

  const [organizationSettings, setOrganizationSettings] = useState({
    name: currentUser.organization,
    address: '123 Business Ave, Suite 100',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    taxId: '12-3456789',
    website: 'https://acme.com'
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    invoiceSubmitted: true,
    invoiceProcessed: true,
    queryRaised: true,
    slaWarning: true,
    slaBreach: true,
    weeklyReports: true,
    monthlyReports: false
  })

  const [slaSettings, setSlaSettings] = useState({
    autoEscalation: true,
    escalationHours: 24,
    warningThreshold: 80, // % of SLA time elapsed
    businessHours: true,
    weekendProcessing: false,
    holidayProcessing: false
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 60, // minutes
    passwordExpiry: 90, // days
    loginNotifications: true,
    apiAccess: false,
    auditLogging: true
  })

  const [cloudStorageSettings, setCloudStorageSettings] = useState({
    provider: 'default',
    awsConfig: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      bucketName: '',
      path: 'bpo-documents/'
    },
    azureConfig: {
      accountName: '',
      accountKey: '',
      containerName: '',
      path: 'bpo-documents/'
    },
    gcpConfig: {
      projectId: '',
      keyFile: '',
      bucketName: '',
      path: 'bpo-documents/'
    },
    customConfig: {
      endpoint: '',
      accessKey: '',
      secretKey: '',
      bucketName: '',
      path: 'bpo-documents/',
      ssl: true,
      region: ''
    },
    permissions: {
      read: true,
      write: true,
      delete: false,
      process: true
    },
    advanced: {
      compressionEnabled: true,
      encryptionEnabled: true,
      versioningEnabled: false,
      maxFileSize: 50, // MB
      allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx']
    }
  })

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('saving')
    
    try {
      const settingsData = {
        profile: profileSettings,
        organization: organizationSettings,
        notifications: notificationSettings,
        sla: slaSettings,
        security: securitySettings,
        cloudStorage: cloudStorageSettings
      }

      const response = await fetch('/api/v1/bpo/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          settings: settingsData
        })
      })

      const result = await response.json()

      if (result.success) {
        setSaveStatus('success')
        console.log('Settings saved successfully:', result.auditId)
      } else {
        throw new Error(result.error || 'Failed to save settings')
      }

      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Save settings error:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'sla', label: 'SLA Configuration', icon: Target },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'storage', label: 'Cloud Storage', icon: Database }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      <BPOManagementSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  BPO System Settings
                  <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Configuration
                  </Badge>
                </h1>
                <p className="text-gray-600 mt-1">Manage your BPO workflow preferences and system configuration</p>
              </div>
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Error
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Settings Navigation */}
          <div className="w-64 bg-white border-r border-gray-200 p-6">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <main className="flex-1 overflow-auto p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">User Profile</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileSettings.name}
                        onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileSettings.email}
                        onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileSettings.phone}
                        onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={profileSettings.title}
                        onChange={(e) => setProfileSettings({...profileSettings, title: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={profileSettings.department} onValueChange={(value) => setProfileSettings({...profileSettings, department: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem className="hera-select-item" value="Finance">Finance</SelectItem>
                          <SelectItem className="hera-select-item" value="Accounting">Accounting</SelectItem>
                          <SelectItem className="hera-select-item" value="Operations">Operations</SelectItem>
                          <SelectItem className="hera-select-item" value="Procurement">Procurement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Role Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Current Role</span>
                      <Badge className="bg-blue-100 text-blue-700 capitalize">
                        {currentUser.role.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Organization</span>
                      <span className="font-medium text-gray-900">{currentUser.organization}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">User ID</span>
                      <span className="font-mono text-sm text-gray-600">{currentUser.id}</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'organization' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Organization Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        value={organizationSettings.name}
                        onChange={(e) => setOrganizationSettings({...organizationSettings, name: e.target.value})}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={organizationSettings.address}
                        onChange={(e) => setOrganizationSettings({...organizationSettings, address: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={organizationSettings.city}
                        onChange={(e) => setOrganizationSettings({...organizationSettings, city: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={organizationSettings.state}
                        onChange={(e) => setOrganizationSettings({...organizationSettings, state: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={organizationSettings.zipCode}
                        onChange={(e) => setOrganizationSettings({...organizationSettings, zipCode: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={organizationSettings.country}
                        onChange={(e) => setOrganizationSettings({...organizationSettings, country: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        value={organizationSettings.taxId}
                        onChange={(e) => setOrganizationSettings({...organizationSettings, taxId: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={organizationSettings.website}
                        onChange={(e) => setOrganizationSettings({...organizationSettings, website: e.target.value})}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Delivery Methods</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">Email Notifications</span>
                          </div>
                          <Switch
                            checked={notificationSettings.emailNotifications}
                            onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">SMS Notifications</span>
                          </div>
                          <Switch
                            checked={notificationSettings.smsNotifications}
                            onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">Push Notifications</span>
                          </div>
                          <Switch
                            checked={notificationSettings.pushNotifications}
                            onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Event Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Invoice Submitted</span>
                          <Switch
                            checked={notificationSettings.invoiceSubmitted}
                            onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, invoiceSubmitted: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Invoice Processed</span>
                          <Switch
                            checked={notificationSettings.invoiceProcessed}
                            onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, invoiceProcessed: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Query Raised</span>
                          <Switch
                            checked={notificationSettings.queryRaised}
                            onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, queryRaised: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">SLA Warning</span>
                          <Switch
                            checked={notificationSettings.slaWarning}
                            onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, slaWarning: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">SLA Breach</span>
                          <Switch
                            checked={notificationSettings.slaBreach}
                            onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, slaBreach: checked})}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Reports</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Weekly Reports</span>
                          <Switch
                            checked={notificationSettings.weeklyReports}
                            onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyReports: checked})}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Monthly Reports</span>
                          <Switch
                            checked={notificationSettings.monthlyReports}
                            onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, monthlyReports: checked})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'sla' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">SLA Configuration</h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="escalationHours">Auto-Escalation (Hours)</Label>
                        <Input
                          id="escalationHours"
                          type="number"
                          value={slaSettings.escalationHours}
                          onChange={(e) => setSlaSettings({...slaSettings, escalationHours: parseInt(e.target.value)})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="warningThreshold">Warning Threshold (%)</Label>
                        <Input
                          id="warningThreshold"
                          type="number"
                          min="1"
                          max="100"
                          value={slaSettings.warningThreshold}
                          onChange={(e) => setSlaSettings({...slaSettings, warningThreshold: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Auto-Escalation Enabled</span>
                        <Switch
                          checked={slaSettings.autoEscalation}
                          onCheckedChange={(checked) => setSlaSettings({...slaSettings, autoEscalation: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Business Hours Only</span>
                        <Switch
                          checked={slaSettings.businessHours}
                          onCheckedChange={(checked) => setSlaSettings({...slaSettings, businessHours: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Weekend Processing</span>
                        <Switch
                          checked={slaSettings.weekendProcessing}
                          onCheckedChange={(checked) => setSlaSettings({...slaSettings, weekendProcessing: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Holiday Processing</span>
                        <Switch
                          checked={slaSettings.holidayProcessing}
                          onCheckedChange={(checked) => setSlaSettings({...slaSettings, holidayProcessing: checked})}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">SLA Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2">Complexity</th>
                          <th className="text-left py-2">Priority</th>
                          <th className="text-left py-2">Target (Hours)</th>
                          <th className="text-left py-2">Warning (Hours)</th>
                          <th className="text-left py-2">Escalation (Hours)</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600">
                        {BPO_SLA_MATRIX.slice(0, 8).map((sla, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-2 capitalize">{sla.complexity}</td>
                            <td className="py-2 capitalize">{sla.priority}</td>
                            <td className="py-2">{sla.target_hours}</td>
                            <td className="py-2">{sla.warning_hours}</td>
                            <td className="py-2">{sla.escalation_hours}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Security Settings</h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Session Timeout (Minutes)</Label>
                        <Input
                          id="sessionTimeout"
                          type="number"
                          value={securitySettings.sessionTimeout}
                          onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passwordExpiry">Password Expiry (Days)</Label>
                        <Input
                          id="passwordExpiry"
                          type="number"
                          value={securitySettings.passwordExpiry}
                          onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiry: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700">Two-Factor Authentication</span>
                          <p className="text-sm text-gray-500">Add an extra layer of security</p>
                        </div>
                        <Switch
                          checked={securitySettings.twoFactorAuth}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700">Login Notifications</span>
                          <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                        </div>
                        <Switch
                          checked={securitySettings.loginNotifications}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, loginNotifications: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700">API Access</span>
                          <p className="text-sm text-gray-500">Allow API access to your account</p>
                        </div>
                        <Switch
                          checked={securitySettings.apiAccess}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, apiAccess: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700">Audit Logging</span>
                          <p className="text-sm text-gray-500">Log all user activities</p>
                        </div>
                        <Switch
                          checked={securitySettings.auditLogging}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, auditLogging: checked})}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Security Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last login</span>
                      <span className="text-gray-900">Today at 9:23 AM</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Password last changed</span>
                      <span className="text-gray-900">15 days ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Active sessions</span>
                      <span className="text-gray-900">2 devices</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Cloud Storage Configuration</h3>
                      <p className="text-gray-600 text-sm mt-1">Configure your own cloud storage for document processing and archival</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">
                      <Database className="w-3 h-3 mr-1" />
                      BYOC - Bring Your Own Cloud
                    </Badge>
                  </div>

                  {/* Provider Selection */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="provider">Storage Provider</Label>
                      <Select 
                        value={cloudStorageSettings.provider} 
                        onValueChange={(value) => setCloudStorageSettings({...cloudStorageSettings, provider: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem className="hera-select-item" value="default">
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-blue-600" />
                              <div>
                                <div className="font-medium">HERA Default Storage</div>
                                <div className="text-xs text-gray-500">Managed storage with automatic backups</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem className="hera-select-item" value="aws">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-orange-500 rounded"></div>
                              <div>
                                <div className="font-medium">Amazon S3</div>
                                <div className="text-xs text-gray-500">AWS Simple Storage Service</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem className="hera-select-item" value="azure">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-blue-500 rounded"></div>
                              <div>
                                <div className="font-medium">Azure Blob Storage</div>
                                <div className="text-xs text-gray-500">Microsoft Azure Cloud Storage</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem className="hera-select-item" value="gcp">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-500 rounded"></div>
                              <div>
                                <div className="font-medium">Google Cloud Storage</div>
                                <div className="text-xs text-gray-500">GCP Object Storage</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem className="hera-select-item" value="custom">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-purple-500 rounded"></div>
                              <div>
                                <div className="font-medium">Custom S3-Compatible</div>
                                <div className="text-xs text-gray-500">MinIO, DigitalOcean, Wasabi, etc.</div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* AWS S3 Configuration */}
                    {cloudStorageSettings.provider === 'aws' && (
                      <div className="space-y-4 p-6 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                            <Database className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-orange-800">Amazon S3 Configuration</h4>
                            <p className="text-xs text-orange-600">Configure AWS credentials and bucket settings</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Access Key ID</Label>
                            <Input
                              type="password"
                              value={cloudStorageSettings.awsConfig.accessKeyId}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                awsConfig: { ...cloudStorageSettings.awsConfig, accessKeyId: e.target.value }
                              })}
                              placeholder="AKIA..."
                              className="bg-white"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Secret Access Key</Label>
                            <Input
                              type="password"
                              value={cloudStorageSettings.awsConfig.secretAccessKey}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                awsConfig: { ...cloudStorageSettings.awsConfig, secretAccessKey: e.target.value }
                              })}
                              placeholder="Enter secret key"
                              className="bg-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Region</Label>
                            <Select 
                              value={cloudStorageSettings.awsConfig.region} 
                              onValueChange={(value) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                awsConfig: { ...cloudStorageSettings.awsConfig, region: value }
                              })}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="hera-select-content">
                                <SelectItem className="hera-select-item" value="us-east-1">US East (N. Virginia)</SelectItem>
                                <SelectItem className="hera-select-item" value="us-west-2">US West (Oregon)</SelectItem>
                                <SelectItem className="hera-select-item" value="eu-west-1">Europe (Ireland)</SelectItem>
                                <SelectItem className="hera-select-item" value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                                <SelectItem className="hera-select-item" value="ap-south-1">Asia Pacific (Mumbai)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Bucket Name</Label>
                            <Input
                              value={cloudStorageSettings.awsConfig.bucketName}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                awsConfig: { ...cloudStorageSettings.awsConfig, bucketName: e.target.value }
                              })}
                              placeholder="my-bpo-documents"
                              className="bg-white"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label>Document Path Prefix</Label>
                            <Input
                              value={cloudStorageSettings.awsConfig.path}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                awsConfig: { ...cloudStorageSettings.awsConfig, path: e.target.value }
                              })}
                              placeholder="bpo-documents/"
                              className="bg-white"
                            />
                            <p className="text-xs text-orange-600">Files will be stored under this path in your bucket</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Azure Configuration */}
                    {cloudStorageSettings.provider === 'azure' && (
                      <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Database className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800">Azure Blob Storage Configuration</h4>
                            <p className="text-xs text-blue-600">Configure Azure storage account credentials</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Account Name</Label>
                            <Input
                              value={cloudStorageSettings.azureConfig.accountName}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                azureConfig: { ...cloudStorageSettings.azureConfig, accountName: e.target.value }
                              })}
                              placeholder="mystorageaccount"
                              className="bg-white"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Account Key</Label>
                            <Input
                              type="password"
                              value={cloudStorageSettings.azureConfig.accountKey}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                azureConfig: { ...cloudStorageSettings.azureConfig, accountKey: e.target.value }
                              })}
                              placeholder="Enter account key"
                              className="bg-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Container Name</Label>
                            <Input
                              value={cloudStorageSettings.azureConfig.containerName}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                azureConfig: { ...cloudStorageSettings.azureConfig, containerName: e.target.value }
                              })}
                              placeholder="bpo-invoices"
                              className="bg-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Blob Path Prefix</Label>
                            <Input
                              value={cloudStorageSettings.azureConfig.path}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                azureConfig: { ...cloudStorageSettings.azureConfig, path: e.target.value }
                              })}
                              placeholder="bpo-documents/"
                              className="bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Google Cloud Configuration */}
                    {cloudStorageSettings.provider === 'gcp' && (
                      <div className="space-y-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <Database className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-green-800">Google Cloud Storage Configuration</h4>
                            <p className="text-xs text-green-600">Configure GCP service account and bucket</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Project ID</Label>
                            <Input
                              value={cloudStorageSettings.gcpConfig.projectId}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                gcpConfig: { ...cloudStorageSettings.gcpConfig, projectId: e.target.value }
                              })}
                              placeholder="my-bpo-project"
                              className="bg-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Bucket Name</Label>
                            <Input
                              value={cloudStorageSettings.gcpConfig.bucketName}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                gcpConfig: { ...cloudStorageSettings.gcpConfig, bucketName: e.target.value }
                              })}
                              placeholder="my-bpo-bucket"
                              className="bg-white"
                            />
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <Label>Service Account Key (JSON)</Label>
                            <Textarea
                              value={cloudStorageSettings.gcpConfig.keyFile}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                gcpConfig: { ...cloudStorageSettings.gcpConfig, keyFile: e.target.value }
                              })}
                              placeholder="Paste service account JSON key here"
                              rows={4}
                              className="bg-white font-mono text-xs"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label>Object Path Prefix</Label>
                            <Input
                              value={cloudStorageSettings.gcpConfig.path}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                gcpConfig: { ...cloudStorageSettings.gcpConfig, path: e.target.value }
                              })}
                              placeholder="bpo-documents/"
                              className="bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Custom S3-Compatible Configuration */}
                    {cloudStorageSettings.provider === 'custom' && (
                      <div className="space-y-4 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                            <Database className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-purple-800">Custom S3-Compatible Storage</h4>
                            <p className="text-xs text-purple-600">Configure MinIO, DigitalOcean Spaces, Wasabi, or other S3-compatible storage</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label>Endpoint URL</Label>
                            <Input
                              type="url"
                              value={cloudStorageSettings.customConfig.endpoint}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                customConfig: { ...cloudStorageSettings.customConfig, endpoint: e.target.value }
                              })}
                              placeholder="https://your-storage.example.com"
                              className="bg-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Access Key</Label>
                            <Input
                              type="password"
                              value={cloudStorageSettings.customConfig.accessKey}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                customConfig: { ...cloudStorageSettings.customConfig, accessKey: e.target.value }
                              })}
                              placeholder="Enter access key"
                              className="bg-white"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Secret Key</Label>
                            <Input
                              type="password"
                              value={cloudStorageSettings.customConfig.secretKey}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                customConfig: { ...cloudStorageSettings.customConfig, secretKey: e.target.value }
                              })}
                              placeholder="Enter secret key"
                              className="bg-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Bucket Name</Label>
                            <Input
                              value={cloudStorageSettings.customConfig.bucketName}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                customConfig: { ...cloudStorageSettings.customConfig, bucketName: e.target.value }
                              })}
                              placeholder="my-documents"
                              className="bg-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Region (Optional)</Label>
                            <Input
                              value={cloudStorageSettings.customConfig.region}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                customConfig: { ...cloudStorageSettings.customConfig, region: e.target.value }
                              })}
                              placeholder="us-east-1"
                              className="bg-white"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label>Document Path Prefix</Label>
                            <Input
                              value={cloudStorageSettings.customConfig.path}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                customConfig: { ...cloudStorageSettings.customConfig, path: e.target.value }
                              })}
                              placeholder="bpo-documents/"
                              className="bg-white"
                            />
                          </div>

                          <div className="flex items-center justify-between md:col-span-2">
                            <Label>Enable SSL/HTTPS</Label>
                            <Switch
                              checked={cloudStorageSettings.customConfig.ssl}
                              onCheckedChange={(checked) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                customConfig: { ...cloudStorageSettings.customConfig, ssl: checked }
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Permissions Configuration */}
                    {cloudStorageSettings.provider !== 'default' && (
                      <Card className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Storage Permissions & Processing</h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Read Files</span>
                              <p className="text-xs text-gray-500">Download & view documents</p>
                            </div>
                            <Switch
                              checked={cloudStorageSettings.permissions.read}
                              onCheckedChange={(checked) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                permissions: { ...cloudStorageSettings.permissions, read: checked }
                              })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Write Files</span>
                              <p className="text-xs text-gray-500">Upload new documents</p>
                            </div>
                            <Switch
                              checked={cloudStorageSettings.permissions.write}
                              onCheckedChange={(checked) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                permissions: { ...cloudStorageSettings.permissions, write: checked }
                              })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Process Files</span>
                              <p className="text-xs text-gray-500">OCR, AI analysis, etc.</p>
                            </div>
                            <Switch
                              checked={cloudStorageSettings.permissions.process}
                              onCheckedChange={(checked) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                permissions: { ...cloudStorageSettings.permissions, process: checked }
                              })}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Delete Files</span>
                              <p className="text-xs text-gray-500">Remove documents</p>
                            </div>
                            <Switch
                              checked={cloudStorageSettings.permissions.delete}
                              onCheckedChange={(checked) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                permissions: { ...cloudStorageSettings.permissions, delete: checked }
                              })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Max File Size (MB)</Label>
                            <Input
                              type="number"
                              value={cloudStorageSettings.advanced.maxFileSize}
                              onChange={(e) => setCloudStorageSettings({
                                ...cloudStorageSettings,
                                advanced: { ...cloudStorageSettings.advanced, maxFileSize: parseInt(e.target.value) || 50 }
                              })}
                              min="1"
                              max="1000"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Allowed File Types</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx', 'txt', 'csv'].map(type => (
                                <Badge
                                  key={type}
                                  className={`cursor-pointer transition-colors ${
                                    cloudStorageSettings.advanced.allowedFileTypes.includes(type)
                                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                  onClick={() => {
                                    const types = cloudStorageSettings.advanced.allowedFileTypes
                                    const newTypes = types.includes(type)
                                      ? types.filter(t => t !== type)
                                      : [...types, type]
                                    setCloudStorageSettings({
                                      ...cloudStorageSettings,
                                      advanced: { ...cloudStorageSettings.advanced, allowedFileTypes: newTypes }
                                    })
                                  }}
                                >
                                  {type.toUpperCase()}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Compression</span>
                              <Switch
                                checked={cloudStorageSettings.advanced.compressionEnabled}
                                onCheckedChange={(checked) => setCloudStorageSettings({
                                  ...cloudStorageSettings,
                                  advanced: { ...cloudStorageSettings.advanced, compressionEnabled: checked }
                                })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Encryption</span>
                              <Switch
                                checked={cloudStorageSettings.advanced.encryptionEnabled}
                                onCheckedChange={(checked) => setCloudStorageSettings({
                                  ...cloudStorageSettings,
                                  advanced: { ...cloudStorageSettings.advanced, encryptionEnabled: checked }
                                })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Versioning</span>
                              <Switch
                                checked={cloudStorageSettings.advanced.versioningEnabled}
                                onCheckedChange={(checked) => setCloudStorageSettings({
                                  ...cloudStorageSettings,
                                  advanced: { ...cloudStorageSettings.advanced, versioningEnabled: checked }
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Test Connection */}
                    {cloudStorageSettings.provider !== 'default' && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <h4 className="font-semibold text-gray-800">Connection Test</h4>
                          <p className="text-sm text-gray-600">Verify your cloud storage configuration and permissions</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            onClick={async () => {
                              try {
                                setSaveStatus('saving')
                                const response = await fetch('/api/v1/bpo/cloud-storage', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    action: 'test_connection',
                                    settings: cloudStorageSettings
                                  })
                                })
                                
                                const result = await response.json()
                                
                                if (result.success) {
                                  const { success: connected, message, latency } = result.data
                                  alert(`Connection Test Results:\n${message}\nLatency: ${latency}ms\nStatus: ${connected ? 'CONNECTED' : 'FAILED'}`)
                                  setSaveStatus(connected ? 'success' : 'error')
                                } else {
                                  alert(`Connection test failed: ${result.error}`)
                                  setSaveStatus('error')
                                }
                              } catch (error) {
                                alert(`Connection test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
                                setSaveStatus('error')
                              }
                              setTimeout(() => setSaveStatus('idle'), 3000)
                            }}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Test Connection
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            onClick={async () => {
                              try {
                                setSaveStatus('saving')
                                const response = await fetch('/api/v1/bpo/cloud-storage', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    action: 'test_permissions',
                                    settings: cloudStorageSettings
                                  })
                                })
                                
                                const result = await response.json()
                                
                                if (result.success) {
                                  const { read, write, delete: del, process, errors } = result.data
                                  const summary = [
                                    `READ: ${read ? '✅' : '❌'}`,
                                    `WRITE: ${write ? '✅' : '❌'}`,
                                    `DELETE: ${del ? '✅' : '❌'}`,
                                    `PROCESS: ${process ? '✅' : '❌'}`
                                  ].join('\n')
                                  
                                  let message = `Permission Test Results:\n${summary}`
                                  if (errors.length > 0) {
                                    message += `\n\nErrors:\n${errors.join('\n')}`
                                  }
                                  
                                  alert(message)
                                  setSaveStatus('success')
                                } else {
                                  alert(`Permission test failed: ${result.error}`)
                                  setSaveStatus('error')
                                }
                              } catch (error) {
                                alert(`Permission test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
                                setSaveStatus('error')
                              }
                              setTimeout(() => setSaveStatus('idle'), 3000)
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Test Permissions
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Cloud Storage Benefits */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Bring Your Own Cloud?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">Data Control</h4>
                      <p className="text-sm text-gray-600">Your data stays in your cloud account with full control over access and compliance</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Target className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">Cost Optimization</h4>
                      <p className="text-sm text-gray-600">Use your existing cloud storage plans and negotiate better rates</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Zap className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">Performance</h4>
                      <p className="text-sm text-gray-600">Configure storage in your preferred region for optimal performance</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}