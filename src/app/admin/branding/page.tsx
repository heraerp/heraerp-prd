/**
 * HERA v3.0 Tenant Branding Customization Interface
 * Complete branding control panel for white-label deployments
 */

'use client'

import React, { useState, useEffect } from 'react'
import { brandingEngine, type BrandingTheme, type OrganizationBranding } from '@/lib/platform/branding-engine'
import { assetManager, type BrandAsset } from '@/lib/platform/asset-manager'
import { whiteLabelManager, type WhiteLabelDeployment } from '@/lib/platform/white-label-manager'
import { domainManager, type CustomDomain } from '@/lib/platform/domain-manager'
import { useHERAAuthV3 } from '@/components/auth/HERAAuthProviderV3'
import { useToast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import ThemeGallery from '@/components/admin/ThemeGallery'
import { 
  Palette,
  Upload,
  Eye,
  Save,
  Globe,
  Settings,
  Zap,
  Image as ImageIcon,
  Type,
  Monitor,
  Smartphone,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Trash2,
  Plus,
  Sparkles
} from 'lucide-react'

export default function BrandingCustomizationPage() {
  const { user, organization } = useHERAAuthV3()
  const { toast } = useToast()
  
  // State management
  const [currentBranding, setCurrentBranding] = useState<OrganizationBranding | null>(null)
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([])
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([])
  const [deployments, setDeployments] = useState<WhiteLabelDeployment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [activeTab, setActiveTab] = useState('colors')

  // Theme state
  const [themeConfig, setThemeConfig] = useState<BrandingTheme | null>(null)
  
  // Deployment state
  const [isCreatingDeployment, setIsCreatingDeployment] = useState(false)
  const [deploymentProgress, setDeploymentProgress] = useState<any>(null)

  // Load initial data
  useEffect(() => {
    if (organization?.id) {
      loadBrandingData()
    }
  }, [organization?.id])

  const loadBrandingData = async () => {
    if (!organization?.id) return
    
    setIsLoading(true)
    try {
      // Load current branding
      const branding = await brandingEngine.initializeBranding(organization.id)
      setCurrentBranding(branding)
      setThemeConfig(branding?.theme || null)

      // Load brand assets
      const assets = await assetManager.getOrganizationAssets(organization.id)
      setBrandAssets(assets)

      // Load custom domains
      const domains = await domainManager.getOrganizationDomains(organization.id)
      setCustomDomains(domains)

      // Load deployments
      const orgDeployments = whiteLabelManager.getOrganizationDeployments(organization.id)
      setDeployments(orgDeployments)

    } catch (error) {
      console.error('Failed to load branding data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleThemeChange = (field: keyof BrandingTheme, value: any) => {
    if (!themeConfig) return
    
    const updatedTheme = { ...themeConfig, [field]: value }
    setThemeConfig(updatedTheme)
    
    // Apply changes immediately for preview
    if (organization?.id) {
      brandingEngine.updateBranding(organization.id, { [field]: value })
    }
  }

  const handleSaveBranding = async () => {
    if (!organization?.id || !themeConfig) return
    
    setIsSaving(true)
    try {
      const success = await brandingEngine.updateBranding(organization.id, themeConfig)
      
      if (success) {
        // Update current branding
        if (currentBranding) {
          currentBranding.theme = themeConfig
          setCurrentBranding({ ...currentBranding })
        }
        
        console.log('✅ Branding saved successfully')
      } else {
        throw new Error('Failed to save branding')
      }
    } catch (error) {
      console.error('❌ Failed to save branding:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAssetUpload = async (file: File, assetType: BrandAsset['asset_type']) => {
    if (!organization?.id) return
    
    try {
      const result = await assetManager.uploadAsset(organization.id, file, assetType, {
        auto_optimize: true,
        generate_variants: true,
        update_existing: true,
        usage_context: ['header', 'footer']
      })
      
      if (result.success && result.asset) {
        setBrandAssets(prev => [...prev.filter(a => a.asset_type !== assetType), result.asset!])
        
        // Update theme config with new asset URL
        if (assetType === 'logo' && themeConfig) {
          handleThemeChange('logo_url', result.asset.public_url)
        }
      }
    } catch (error) {
      console.error('❌ Asset upload failed:', error)
    }
  }

  const handleCreateDeployment = async () => {
    if (!organization?.id || !organization.industry) return
    
    setIsCreatingDeployment(true)
    try {
      const result = await whiteLabelManager.createDeployment({
        organizationId: organization.id,
        deploymentName: `${organization.organization_name || 'My Business'} Portal`,
        industry: organization.industry,
        branding: currentBranding || {},
        features: {
          dashboard: true,
          entities: true,
          transactions: true,
          reports: true
        }
      })
      
      if (result.success && result.deployment) {
        setDeployments(prev => [...prev, result.deployment!])
        
        // Monitor deployment progress
        const deploymentId = result.deployment.deployment_id
        const progressInterval = setInterval(() => {
          const progress = whiteLabelManager.getDeploymentProgress(deploymentId)
          setDeploymentProgress(progress)
          
          if (!progress || progress.progress >= 100) {
            clearInterval(progressInterval)
            setDeploymentProgress(null)
            loadBrandingData() // Refresh data
          }
        }, 1000)
      }
    } catch (error) {
      console.error('❌ Deployment creation failed:', error)
    } finally {
      setIsCreatingDeployment(false)
    }
  }

  const renderColorPicker = (label: string, field: keyof BrandingTheme, value: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div 
          className="w-12 h-10 rounded border-2 border-gray-200 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'color'
            input.value = value
            input.onchange = (e) => {
              handleThemeChange(field, (e.target as HTMLInputElement).value)
            }
            input.click()
          }}
        />
        <Input
          value={value}
          onChange={(e) => handleThemeChange(field, e.target.value)}
          className="flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  )

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          Please log in to access the branding customization interface.
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading branding data...
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Branding Customization</h1>
          <p className="text-gray-600 mt-1">
            Customize your organization's brand identity and create white-label deployments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadBrandingData}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleSaveBranding}
            disabled={isSaving || !themeConfig}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Preview Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label>Preview Mode:</Label>
              <div className="flex gap-1">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor className="w-4 h-4 mr-1" />
                  Desktop
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Smartphone className="w-4 h-4 mr-1" />
                  Mobile
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Live Preview Active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="domains">Domains</TabsTrigger>
              <TabsTrigger value="deployment">Deploy</TabsTrigger>
            </TabsList>

            {/* Theme Gallery Tab */}
            <TabsContent value="gallery">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Professional Themes
                  </CardTitle>
                  <CardDescription>
                    Browse and apply professionally designed themes for your industry
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemeGallery
                    organizationId={organization?.id || 'demo-org'}
                    currentIndustry={organization?.industry as any || 'generic_business'}
                    onThemeApplied={(theme) => {
                      setThemeConfig(theme.theme)
                      toast({
                        title: "🎨 Theme Applied",
                        description: `${theme.name} has been applied successfully`,
                        duration: 3000
                      })
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Color Scheme
                  </CardTitle>
                  <CardDescription>
                    Customize your brand colors to match your organization's identity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {themeConfig && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderColorPicker('Primary Color', 'primary_color', themeConfig.primary_color)}
                        {renderColorPicker('Secondary Color', 'secondary_color', themeConfig.secondary_color)}
                        {renderColorPicker('Accent Color', 'accent_color', themeConfig.accent_color)}
                        {renderColorPicker('Success Color', 'success_color', themeConfig.success_color)}
                        {renderColorPicker('Warning Color', 'warning_color', themeConfig.warning_color)}
                        {renderColorPicker('Error Color', 'error_color', themeConfig.error_color)}
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-4">Background & Text</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderColorPicker('Background', 'background_color', themeConfig.background_color)}
                          {renderColorPicker('Surface', 'surface_color', themeConfig.surface_color)}
                          {renderColorPicker('Primary Text', 'text_primary', themeConfig.text_primary)}
                          {renderColorPicker('Secondary Text', 'text_secondary', themeConfig.text_secondary)}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Typography
                  </CardTitle>
                  <CardDescription>
                    Configure fonts and text styling for your brand
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {themeConfig && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Heading Font</Label>
                          <Select
                            value={themeConfig.font_family_heading}
                            onValueChange={(value) => handleThemeChange('font_family_heading', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Open Sans">Open Sans</SelectItem>
                              <SelectItem value="Montserrat">Montserrat</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Body Font</Label>
                          <Select
                            value={themeConfig.font_family_body}
                            onValueChange={(value) => handleThemeChange('font_family_body', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Open Sans">Open Sans</SelectItem>
                              <SelectItem value="Lato">Lato</SelectItem>
                              <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Base Font Size</Label>
                          <Select
                            value={themeConfig.font_size_base}
                            onValueChange={(value) => handleThemeChange('font_size_base', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="14px">14px (Small)</SelectItem>
                              <SelectItem value="16px">16px (Medium)</SelectItem>
                              <SelectItem value="18px">18px (Large)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Line Height</Label>
                          <Select
                            value={themeConfig.line_height_base}
                            onValueChange={(value) => handleThemeChange('line_height_base', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1.4">1.4 (Tight)</SelectItem>
                              <SelectItem value="1.5">1.5 (Normal)</SelectItem>
                              <SelectItem value="1.6">1.6 (Relaxed)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assets Tab */}
            <TabsContent value="assets">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Brand Assets
                  </CardTitle>
                  <CardDescription>
                    Upload and manage your brand assets (logos, favicons, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Upload */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Logo</h4>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {brandAssets.find(a => a.asset_type === 'logo')?.public_url ? (
                          <div className="space-y-2">
                            <img
                              src={brandAssets.find(a => a.asset_type === 'logo')?.public_url}
                              alt="Logo"
                              className="mx-auto max-h-16 object-contain"
                            />
                            <p className="text-sm text-gray-600">
                              {brandAssets.find(a => a.asset_type === 'logo')?.asset_name}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-600">Upload your logo</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleAssetUpload(file, 'logo')
                          }}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                    </div>

                    {/* Favicon Upload */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Favicon</h4>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {brandAssets.find(a => a.asset_type === 'favicon')?.public_url ? (
                          <div className="space-y-2">
                            <img
                              src={brandAssets.find(a => a.asset_type === 'favicon')?.public_url}
                              alt="Favicon"
                              className="mx-auto w-8 h-8 object-contain"
                            />
                            <p className="text-sm text-gray-600">
                              {brandAssets.find(a => a.asset_type === 'favicon')?.asset_name}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-600">Upload your favicon</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleAssetUpload(file, 'favicon')
                          }}
                          className="hidden"
                          id="favicon-upload"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => document.getElementById('favicon-upload')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Favicon
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Asset List */}
                  {brandAssets.length > 0 && (
                    <div className="pt-6 border-t">
                      <h4 className="font-medium mb-4">Uploaded Assets</h4>
                      <div className="space-y-2">
                        {brandAssets.map((asset) => (
                          <div key={asset.asset_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <img
                                src={asset.public_url}
                                alt={asset.asset_name}
                                className="w-10 h-10 object-contain rounded border"
                              />
                              <div>
                                <p className="font-medium">{asset.asset_name}</p>
                                <p className="text-sm text-gray-600">
                                  {asset.asset_type} • {Math.round(asset.file_size / 1024)}KB
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Domains Tab */}
            <TabsContent value="domains">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Custom Domains
                  </CardTitle>
                  <CardDescription>
                    Configure custom domains for white-label deployments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {customDomains.length > 0 ? (
                    <div className="space-y-4">
                      {customDomains.map((domain) => (
                        <div key={domain.domain_id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              {domain.subdomain ? `${domain.subdomain}.` : ''}{domain.domain_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {domain.is_verified ? (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-yellow-600">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              {domain.ssl_status === 'active' && (
                                <Badge variant="outline" className="text-green-600">
                                  SSL Active
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Configure
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No custom domains</h3>
                      <p className="text-gray-600 mb-4">
                        Add a custom domain to create white-label deployments
                      </p>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom Domain
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deployment Tab */}
            <TabsContent value="deployment">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    White-Label Deployment
                  </CardTitle>
                  <CardDescription>
                    Create and manage white-label deployments of your branded application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {deploymentProgress && (
                    <Alert>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>{deploymentProgress.message}</span>
                            <span>{Math.round(deploymentProgress.progress)}%</span>
                          </div>
                          <Progress value={deploymentProgress.progress} />
                          <p className="text-sm text-gray-600">
                            Step {deploymentProgress.current_step} of {deploymentProgress.total_steps} • 
                            ~{Math.round(deploymentProgress.estimated_time_remaining / 60)} minutes remaining
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {deployments.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Active Deployments</h4>
                        <Button 
                          onClick={handleCreateDeployment}
                          disabled={isCreatingDeployment}
                          size="sm"
                        >
                          {isCreatingDeployment ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          New Deployment
                        </Button>
                      </div>
                      
                      {deployments.map((deployment) => (
                        <div key={deployment.deployment_id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{deployment.deployment_name}</p>
                            <p className="text-sm text-gray-600">{deployment.deployment_url}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className={
                                  deployment.status === 'active' ? 'text-green-600' :
                                  deployment.status === 'deploying' ? 'text-blue-600' :
                                  deployment.status === 'failed' ? 'text-red-600' :
                                  'text-yellow-600'
                                }
                              >
                                {deployment.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {deployment.status === 'deploying' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                {deployment.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                                {deployment.status === 'preparing' && <Clock className="w-3 h-3 mr-1" />}
                                {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
                              </Badge>
                              <Badge variant="outline">{deployment.industry}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No deployments yet</h3>
                      <p className="text-gray-600 mb-4">
                        Create your first white-label deployment to get started
                      </p>
                      <Button 
                        onClick={handleCreateDeployment}
                        disabled={isCreatingDeployment}
                      >
                        {isCreatingDeployment ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        Create Deployment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See your changes in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className={`border rounded-lg overflow-hidden ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}
                style={{ 
                  aspectRatio: previewMode === 'mobile' ? '9/16' : '16/9',
                  minHeight: previewMode === 'mobile' ? '400px' : '300px'
                }}
              >
                <div 
                  className="h-full flex flex-col"
                  style={{
                    backgroundColor: themeConfig?.background_color || '#ffffff',
                    color: themeConfig?.text_primary || '#111827',
                    fontFamily: themeConfig?.font_family_body || 'Inter'
                  }}
                >
                  {/* Preview Header */}
                  <div 
                    className="p-4 border-b"
                    style={{ backgroundColor: themeConfig?.primary_color || '#3b82f6' }}
                  >
                    <div className="flex items-center gap-3">
                      {brandAssets.find(a => a.asset_type === 'logo')?.public_url ? (
                        <img
                          src={brandAssets.find(a => a.asset_type === 'logo')?.public_url}
                          alt="Logo"
                          className="h-8 object-contain"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-white/20 rounded" />
                      )}
                      <div>
                        <h3 
                          className="text-white font-semibold"
                          style={{ fontFamily: themeConfig?.font_family_heading || 'Inter' }}
                        >
                          {organization?.organization_name || 'Your Business'}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Preview Content */}
                  <div className="p-4 flex-1">
                    <div className="space-y-4">
                      <div>
                        <h4 
                          className="font-semibold mb-2"
                          style={{ 
                            fontFamily: themeConfig?.font_family_heading || 'Inter',
                            color: themeConfig?.text_primary || '#111827'
                          }}
                        >
                          Dashboard
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div 
                            className="p-3 rounded border"
                            style={{ 
                              backgroundColor: themeConfig?.surface_color || '#f9fafb',
                              borderColor: themeConfig?.border_color || '#e5e7eb'
                            }}
                          >
                            <div className="text-sm font-medium">Revenue</div>
                            <div 
                              className="text-lg font-bold"
                              style={{ color: themeConfig?.success_color || '#10b981' }}
                            >
                              $12,345
                            </div>
                          </div>
                          <div 
                            className="p-3 rounded border"
                            style={{ 
                              backgroundColor: themeConfig?.surface_color || '#f9fafb',
                              borderColor: themeConfig?.border_color || '#e5e7eb'
                            }}
                          >
                            <div className="text-sm font-medium">Orders</div>
                            <div 
                              className="text-lg font-bold"
                              style={{ color: themeConfig?.primary_color || '#3b82f6' }}
                            >
                              234
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <button 
                          className="w-full py-2 px-4 rounded font-medium text-white"
                          style={{ backgroundColor: themeConfig?.accent_color || '#f59e0b' }}
                        >
                          Action Button
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}