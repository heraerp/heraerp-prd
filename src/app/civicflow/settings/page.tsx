'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Settings, Download, Save, RefreshCw, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // User Profile State
  const [profile, setProfile] = useState({
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@city.gov',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Senior Program Manager',
    department: 'Community Development',
    location: 'Toronto, ON',
    bio: 'Experienced program manager focused on community development initiatives.'
  })

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    emailDigest: 'daily'
  })

  // System Preferences
  const [system, setSystem] = useState({
    theme: 'system',
    language: 'en',
    timezone: 'America/Toronto',
    dateFormat: 'MM/DD/YYYY',
    currency: 'CAD'
  })

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setHasChanges(false)
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been updated successfully.'
    })
  }

  const handleExport = () => {
    const settings = { profile, notifications, system }
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'civicflow-settings.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({
      title: 'Settings Exported',
      description: 'Your settings have been downloaded.'
    })
  }

  const handleInputChange = (section: string, field: string, value: string) => {
    if (section === 'profile') {
      setProfile(prev => ({ ...prev, [field]: value }))
    } else if (section === 'notifications') {
      setNotifications(prev => ({ ...prev, [field]: value }))
    } else if (section === 'system') {
      setSystem(prev => ({ ...prev, [field]: value }))
    }
    setHasChanges(true)
  }

  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[rgb(0,166,166)]/20">
              <Settings className="h-8 w-8 text-[rgb(0,166,166)]" />
            </div>
            Settings
          </h1>
          <p className="text-text-200 mt-1">Manage your account settings and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2 text-yellow-500 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Unsaved changes
            </div>
          )}
          <Button variant="outline" onClick={handleExport} className="border-border">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-fit">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={e => handleInputChange('profile', 'firstName', e.target.value)}
                    className="bg-panel-alt border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={e => handleInputChange('profile', 'lastName', e.target.value)}
                    className="bg-panel-alt border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={e => handleInputChange('profile', 'email', e.target.value)}
                  className="bg-panel-alt border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={e => handleInputChange('profile', 'phone', e.target.value)}
                    className="bg-panel-alt border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={profile.jobTitle}
                    onChange={e => handleInputChange('profile', 'jobTitle', e.target.value)}
                    className="bg-panel-alt border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profile.department}
                    onChange={e => handleInputChange('profile', 'department', e.target.value)}
                    className="bg-panel-alt border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={e => handleInputChange('profile', 'location', e.target.value)}
                    className="bg-panel-alt border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={e => handleInputChange('profile', 'bio', e.target.value)}
                  className="bg-panel-alt border-border min-h-[100px]"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <Label className="font-medium">Email Notifications</Label>
                    <p className="text-sm text-text-300">Receive notifications via email</p>
                  </div>
                  <Select
                    value={notifications.emailEnabled ? 'enabled' : 'disabled'}
                    onValueChange={value =>
                      handleInputChange('notifications', 'emailEnabled', value === 'enabled')
                    }
                  >
                    <SelectTrigger className="w-32 bg-panel-alt border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-panel border-border">
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <Label className="font-medium">Push Notifications</Label>
                    <p className="text-sm text-text-300">Receive push notifications on mobile</p>
                  </div>
                  <Select
                    value={notifications.pushEnabled ? 'enabled' : 'disabled'}
                    onValueChange={value =>
                      handleInputChange('notifications', 'pushEnabled', value === 'enabled')
                    }
                  >
                    <SelectTrigger className="w-32 bg-panel-alt border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-panel border-border">
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <Label className="font-medium">SMS Notifications</Label>
                    <p className="text-sm text-text-300">Receive urgent notifications via SMS</p>
                  </div>
                  <Select
                    value={notifications.smsEnabled ? 'enabled' : 'disabled'}
                    onValueChange={value =>
                      handleInputChange('notifications', 'smsEnabled', value === 'enabled')
                    }
                  >
                    <SelectTrigger className="w-32 bg-panel-alt border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-panel border-border">
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Digest Frequency</Label>
                <Select
                  value={notifications.emailDigest}
                  onValueChange={value => handleInputChange('notifications', 'emailDigest', value)}
                >
                  <SelectTrigger className="bg-panel-alt border-border w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-border">
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>Configure system behavior and display preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={system.theme}
                    onValueChange={value => handleInputChange('system', 'theme', value)}
                  >
                    <SelectTrigger className="bg-panel-alt border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-panel border-border">
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={system.language}
                    onValueChange={value => handleInputChange('system', 'language', value)}
                  >
                    <SelectTrigger className="bg-panel-alt border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-panel border-border">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={system.timezone}
                    onValueChange={value => handleInputChange('system', 'timezone', value)}
                  >
                    <SelectTrigger className="bg-panel-alt border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-panel border-border">
                      <SelectItem value="America/Toronto">Eastern Time (Toronto)</SelectItem>
                      <SelectItem value="America/Vancouver">Pacific Time (Vancouver)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (New York)</SelectItem>
                      <SelectItem value="Europe/London">Greenwich Mean Time (London)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={system.dateFormat}
                    onValueChange={value => handleInputChange('system', 'dateFormat', value)}
                  >
                    <SelectTrigger className="bg-panel-alt border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-panel border-border">
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={system.currency}
                    onValueChange={value => handleInputChange('system', 'currency', value)}
                  >
                    <SelectTrigger className="bg-panel-alt border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-panel border-border">
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Advanced configuration options for power users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/5">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Advanced Configuration</p>
                    <p className="text-sm text-text-300">
                      These settings are for advanced users. Changing them may affect system
                      performance.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="border-border justify-start h-12">
                    <div className="text-left">
                      <p className="font-medium">API Configuration</p>
                      <p className="text-xs text-text-300">Manage API keys and endpoints</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="border-border justify-start h-12">
                    <div className="text-left">
                      <p className="font-medium">Database Settings</p>
                      <p className="text-xs text-text-300">Configure database connections</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="border-border justify-start h-12">
                    <div className="text-left">
                      <p className="font-medium">Performance Tuning</p>
                      <p className="text-xs text-text-300">Optimize system performance</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="border-border justify-start h-12">
                    <div className="text-left">
                      <p className="font-medium">Security Options</p>
                      <p className="text-xs text-text-300">Advanced security settings</p>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
