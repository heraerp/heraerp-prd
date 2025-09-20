'use client'

// ================================================================================
// HERA DNA THEME CONFIGURATION EXAMPLE
// Smart Code: HERA.DNA.EXAMPLE.THEME.CONFIGURATION.V1
// Complete example showing how to use the Universal Theme System
// ================================================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Palette, 
  Settings, 
  Eye, 
  Code, 
  Sparkles,
  Building,
  User,
  Check,
  Copy
} from 'lucide-react'
import { 
  UniversalThemeProvider,
  useUniversalTheme,
  ThemeSelector,
  ThemePreview,
  THEME_VARIANTS,
  generateThemeCSS,
  applySmartThemeConfiguration
} from '../theme'
import type { 
  UniversalConfigurationRules,
  OrganizationProfile,
  UserProfile 
} from '../theme'

// ================================================================================
// EXAMPLE ORGANIZATION AND USER PROFILES
// ================================================================================

const EXAMPLE_ORGANIZATIONS: OrganizationProfile[] = [
  {
    organizationId: 'org-restaurant-mario',
    industryType: 'restaurant',
    businessSize: 'medium',
    brandColors: {
      primary: '#f97316',
      secondary: '#0ea5e9'
    },
    features: ['pos', 'inventory', 'analytics']
  },
  {
    organizationId: 'org-salon-hairtalkz',
    industryType: 'salon',
    businessSize: 'small',
    brandColors: {
      primary: '#a855f7',
      secondary: '#ec4899'
    },
    features: ['appointments', 'staff_management', 'customer_profiles']
  },
  {
    organizationId: 'org-clinic-general',
    industryType: 'healthcare',
    businessSize: 'large',
    brandColors: {
      primary: '#14b8a6',
      secondary: '#6366f1'
    },
    features: ['patient_management', 'medical_records', 'insurance']
  },
  {
    organizationId: 'org-retail-fashion',
    industryType: 'retail',
    businessSize: 'enterprise',
    features: ['inventory', 'ecommerce', 'analytics', 'multi_location']
  }
]

const EXAMPLE_USERS: UserProfile[] = [
  {
    userId: 'user-admin',
    role: 'admin',
    permissions: ['all'],
    preferences: {
      themeVariant: 'professional',
      darkMode: false,
      highContrast: false
    },
    accessLevel: 'admin'
  },
  {
    userId: 'user-manager',
    role: 'manager',
    permissions: ['read', 'write', 'manage_staff'],
    preferences: {
      themeVariant: 'elegant',
      darkMode: true,
      highContrast: false
    },
    accessLevel: 'premium'
  },
  {
    userId: 'user-staff',
    role: 'staff',
    permissions: ['read', 'write'],
    preferences: {
      themeVariant: 'vibrant',
      darkMode: false,
      highContrast: true
    },
    accessLevel: 'standard'
  }
]

// ================================================================================
// THEME CONFIGURATION DEMO COMPONENT
// ================================================================================

function ThemeConfigurationDemo() {
  const { currentTheme, setTheme, availableThemes } = useUniversalTheme()
  const [selectedOrg, setSelectedOrg] = useState<OrganizationProfile>(EXAMPLE_ORGANIZATIONS[0])
  const [selectedUser, setSelectedUser] = useState<UserProfile>(EXAMPLE_USERS[0])
  const [configResult, setConfigResult] = useState<any>(null)
  const [generatedCSS, setGeneratedCSS] = useState<string>('')
  const [copied, setCopied] = useState(false)

  // Apply smart configuration when org or user changes
  useEffect(() => {
    applyConfiguration()
  }, [selectedOrg, selectedUser])

  const applyConfiguration = async () => {
    try {
      const result = await applySmartThemeConfiguration(
        selectedOrg.organizationId,
        selectedUser.userId
      )
      setConfigResult(result)
      
      // Apply the recommended theme
      if (result.configuration.theme.variant !== currentTheme.id) {
        setTheme(result.configuration.theme.variant, result.configuration.theme.customizations)
      }
      
      // Generate CSS for preview
      const css = generateThemeCSS(result.configuration.theme.variant, result.configuration.theme.customizations)
      setGeneratedCSS(css)
    } catch (error) {
      console.error('Failed to apply configuration:', error)
    }
  }

  const copyCSS = async () => {
    try {
      await navigator.clipboard.writeText(generatedCSS)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy CSS:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold !text-gray-900 dark:!text-gray-100">
          HERA Universal Theme Configuration
        </h1>
        <p className="text-muted-foreground">
          Dynamic theme selection based on organization profile and user preferences
        </p>
      </div>

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Organization Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {EXAMPLE_ORGANIZATIONS.map((org) => (
              <button
                key={org.organizationId}
                onClick={() => setSelectedOrg(org)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  selectedOrg.organizationId === org.organizationId
                    ? 'border-theme-primary bg-theme-primary-subtle'
                    : 'border-theme-border hover:border-theme-primary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{org.industryType}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {org.businessSize} • {org.features?.length || 0} features
                    </p>
                  </div>
                  {org.brandColors && (
                    <div className="flex gap-1">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: org.brandColors.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: org.brandColors.secondary }}
                      />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {EXAMPLE_USERS.map((user) => (
              <button
                key={user.userId}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  selectedUser.userId === user.userId
                    ? 'border-theme-primary bg-theme-primary-subtle'
                    : 'border-theme-border hover:border-theme-primary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{user.role}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.accessLevel} • {user.preferences?.themeVariant}
                    </p>
                  </div>
                  <Badge variant={user.preferences?.darkMode ? 'secondary' : 'outline'}>
                    {user.preferences?.darkMode ? 'Dark' : 'Light'}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Configuration Results */}
      {configResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Applied Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="theme" className="space-y-4">
              <TabsList>
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="rules">Applied Rules</TabsTrigger>
                <TabsTrigger value="css">Generated CSS</TabsTrigger>
              </TabsList>

              <TabsContent value="theme" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Current Theme</h4>
                    <ThemePreview variant={currentTheme} />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Theme Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Variant:</strong> {currentTheme.name}</p>
                      <p><strong>Description:</strong> {currentTheme.description}</p>
                      <p><strong>Smart Code:</strong> {currentTheme.smartCode}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(configResult.configuration.features).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className={`w-4 h-4 ${enabled ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className="text-sm capitalize">{feature.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="rules" className="space-y-4">
                <div className="space-y-2">
                  {configResult.appliedRules.map((rule: any) => (
                    <div key={rule.id} className="flex items-center justify-between p-2 bg-theme-surface rounded">
                      <div>
                        <p className="font-medium text-sm">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">{rule.smartCode}</p>
                      </div>
                      <Badge variant="outline">Priority: {rule.priority}</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="css" className="space-y-4">
                <div className="relative">
                  <Button
                    onClick={copyCSS}
                    size="sm"
                    className="absolute top-2 right-2 z-10"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <pre className="bg-theme-surface p-4 rounded-lg text-xs overflow-auto max-h-64">
                    <code>{generatedCSS}</code>
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Theme Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Manual Theme Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample UI Components */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Buttons</h4>
              <div className="flex gap-2">
                <Button className="btn-theme-primary">Primary</Button>
                <Button className="btn-theme-secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Cards</h4>
              <div className="card-theme-surface p-4 rounded-lg">
                <p className="text-sm">Sample card content with theme colors</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Color Palette</h4>
            <div className="grid grid-cols-11 gap-1">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                <div key={shade} className="space-y-1">
                  <div 
                    className="w-full h-8 rounded border"
                    style={{ backgroundColor: currentTheme.main[shade as keyof typeof currentTheme.main] }}
                  />
                  <p className="text-xs text-center">{shade}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================================================
// MAIN EXAMPLE COMPONENT WITH PROVIDER
// ================================================================================

export function ThemeConfigurationExample() {
  // Example configuration rules for the demo
  const configurationRules: UniversalConfigurationRules = {
    organizationId: 'demo-org',
    industryType: 'restaurant',
    userPreferences: {
      themeVariant: 'warm',
      darkMode: false,
      highContrast: false
    },
    businessRules: {
      allowCustomThemes: true,
      enforceIndustryTheme: false,
      availableVariants: ['professional', 'elegant', 'vibrant', 'modern', 'warm', 'cool']
    }
  }

  return (
    <UniversalThemeProvider
      defaultVariant="professional"
      configurationRules={configurationRules}
      onThemeChange={(theme, config) => {
        console.log('Theme changed:', theme.name, config)
      }}
    >
      <div className="min-h-screen bg-theme-background p-6">
        <ThemeConfigurationDemo />
      </div>
    </UniversalThemeProvider>
  )
}

export default ThemeConfigurationExample