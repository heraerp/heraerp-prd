'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { useUserContext } from '@/hooks/useUserContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, Globe, Shield, Bell, Trash2, 
  Save, AlertCircle, CheckCircle, ExternalLink,
  Mail, Phone, MapPin, Calendar, User, Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'

interface OrganizationSettings {
  // Basic Info
  organization_name: string
  organization_type: string
  organization_code: string
  description: string
  
  // Contact Info
  email: string
  phone: string
  website: string
  
  // Address
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  
  // Preferences
  timezone: string
  language: string
  currency: string
  date_format: string
  
  // Features
  enable_api_access: boolean
  enable_webhooks: boolean
  enable_audit_logs: boolean
  enable_two_factor: boolean
}

export default function OrganizationSettingsPage() {
  const { supabaseUser } = useAuth()
  const { organizationId, userContext } = useUserContext()
  const { toast } = useToast()
  
  const [settings, setSettings] = useState<OrganizationSettings>({
    organization_name: '',
    organization_type: 'business',
    organization_code: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    timezone: 'America/New_York',
    language: 'en',
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
    enable_api_access: false,
    enable_webhooks: false,
    enable_audit_logs: true,
    enable_two_factor: false
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (organizationId && userContext?.organization) {
      loadOrganizationSettings()
    }
  }, [organizationId, userContext])

  const loadOrganizationSettings = async () => {
    try {
      setLoading(true)
      
      // Load from userContext first
      if (userContext?.organization) {
        setSettings(prev => ({
          ...prev,
          organization_name: userContext.organization.name,
          organization_type: userContext.organization.type || 'business',
          organization_code: userContext.organization.organization_code || '',
          ...userContext.organization.settings
        }))
      }
      
      // TODO: Load additional settings from API
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading settings:', error)
      setLoading(false)
    }
  }

  const handleSettingChange = (field: keyof OrganizationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      
      // TODO: Implement actual save to API
      const response = await fetch(`/api/v1/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast({
        title: "Settings saved",
        description: "Your organization settings have been updated successfully.",
      })
      
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrganization = async () => {
    // TODO: Implement organization deletion with confirmation
    console.log('Delete organization')
  }

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Settings</h1>
        <p className="text-gray-600">Manage your organization's information and preferences</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your organization's basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={settings.organization_name}
                    onChange={(e) => handleSettingChange('organization_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="org-type">Organization Type</Label>
                  <Select 
                    value={settings.organization_type}
                    onValueChange={(value) => handleSettingChange('organization_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="nonprofit">Non-Profit</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="org-code">Organization Code</Label>
                <Input
                  id="org-code"
                  value={settings.organization_code}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">This code cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => handleSettingChange('description', e.target.value)}
                  rows={3}
                  placeholder="Brief description of your organization"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How can we reach your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleSettingChange('email', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => handleSettingChange('phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    type="url"
                    value={settings.website}
                    onChange={(e) => handleSettingChange('website', e.target.value)}
                    className="pl-10"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
              <CardDescription>Your organization's physical location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address1">Address Line 1</Label>
                <Input
                  id="address1"
                  value={settings.address_line1}
                  onChange={(e) => handleSettingChange('address_line1', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="address2">Address Line 2</Label>
                <Input
                  id="address2"
                  value={settings.address_line2}
                  onChange={(e) => handleSettingChange('address_line2', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => handleSettingChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={settings.state}
                    onChange={(e) => handleSettingChange('state', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="postal">Postal Code</Label>
                  <Input
                    id="postal"
                    value={settings.postal_code}
                    onChange={(e) => handleSettingChange('postal_code', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select 
                    value={settings.country}
                    onValueChange={(value) => handleSettingChange('country', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>Configure timezone, language, and display preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={settings.timezone}
                    onValueChange={(value) => handleSettingChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (US)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (US)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={settings.language}
                    onValueChange={(value) => handleSettingChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={settings.currency}
                    onValueChange={(value) => handleSettingChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select 
                    value={settings.date_format}
                    onValueChange={(value) => handleSettingChange('date_format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Settings</CardTitle>
              <CardDescription>Enable or disable organization features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="api-access" className="text-base font-medium">API Access</Label>
                  <p className="text-sm text-gray-600">Enable programmatic access to your data</p>
                </div>
                <Switch
                  id="api-access"
                  checked={settings.enable_api_access}
                  onCheckedChange={(checked) => handleSettingChange('enable_api_access', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="webhooks" className="text-base font-medium">Webhooks</Label>
                  <p className="text-sm text-gray-600">Receive real-time notifications for events</p>
                </div>
                <Switch
                  id="webhooks"
                  checked={settings.enable_webhooks}
                  onCheckedChange={(checked) => handleSettingChange('enable_webhooks', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="audit-logs" className="text-base font-medium">Audit Logs</Label>
                  <p className="text-sm text-gray-600">Track all activities within your organization</p>
                </div>
                <Switch
                  id="audit-logs"
                  checked={settings.enable_audit_logs}
                  onCheckedChange={(checked) => handleSettingChange('enable_audit_logs', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor" className="text-base font-medium">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Require 2FA for all organization members</p>
                </div>
                <Switch
                  id="two-factor"
                  checked={settings.enable_two_factor}
                  onCheckedChange={(checked) => handleSettingChange('enable_two_factor', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              These actions are irreversible. Please proceed with caution.
            </AlertDescription>
          </Alert>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Organization</CardTitle>
              <CardDescription>
                Permanently delete your organization and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Once you delete your organization, there is no going back. All data will be permanently removed.
              </p>
              <Button 
                variant="destructive"
                onClick={handleDeleteOrganization}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Organization
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-8 right-8 flex items-center gap-4 bg-white p-4 rounded-lg shadow-lg border">
          <p className="text-sm text-gray-600">You have unsaved changes</p>
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}