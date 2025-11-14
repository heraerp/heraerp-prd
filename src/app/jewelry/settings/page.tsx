'use client'

import React, { useState } from 'react'
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
import {
  Settings,
  Download,
  Save,
  RefreshCw,
  AlertTriangle,
  Crown,
  Diamond,
  Scale,
  Shield,
  Gem,
  Palette,
  Calculator,
  Users,
  FileText,
  Lock
} from 'lucide-react'
import { motion } from 'framer-motion'
import '@/styles/jewelry-glassmorphism.css'

export default function JewelrySettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('business')
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Business Profile State
  const [business, setBusiness] = useState({
    businessName: 'Luxe Jewelry Boutique',
    ownerName: 'Alexandra Sterling',
    email: 'alexandra@luxejewelry.com',
    phone: '+1 (555) 987-6543',
    address: '123 Diamond District, New York, NY 10001',
    website: 'www.luxejewelry.com',
    taxId: 'EIN: 12-3456789',
    description: 'Premier destination for luxury jewelry, custom designs, and precious gemstones.'
  })

  // Jewelry Operations Settings
  const [operations, setOperations] = useState({
    defaultCurrency: 'USD',
    weightUnit: 'grams',
    purityStandard: 'karat',
    goldPricingSource: 'london_fix',
    markupPercentage: '45',
    taxRate: '8.25',
    inventoryTracking: true,
    certificateTracking: true,
    appraisalReminders: true
  })

  // Display & Appearance Settings
  const [appearance, setAppearance] = useState({
    theme: 'gold-black',
    displayDensity: 'comfortable',
    showPrices: 'members_only',
    priceFormat: 'with_tax',
    imageQuality: 'high',
    showCertificates: true,
    defaultView: 'grid'
  })

  // Security & Access Settings
  const [security, setSecurity] = useState({
    twoFactorAuth: true,
    sessionTimeout: '30',
    auditLogging: true,
    dataEncryption: true,
    backupFrequency: 'daily',
    accessLevel: 'owner'
  })

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setHasChanges(false)
    toast({
      title: 'Settings Saved',
      description: 'Your jewelry business settings have been updated successfully.'
    })
  }

  const handleExport = () => {
    const settings = { business, operations, appearance, security }
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'jewelry-settings.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({
      title: 'Settings Exported',
      description: 'Your jewelry settings have been downloaded.'
    })
  }

  const handleInputChange = (section: string, field: string, value: any) => {
    if (section === 'business') {
      setBusiness(prev => ({ ...prev, [field]: value }))
    } else if (section === 'operations') {
      setOperations(prev => ({ ...prev, [field]: value }))
    } else if (section === 'appearance') {
      setAppearance(prev => ({ ...prev, [field]: value }))
    } else if (section === 'security') {
      setSecurity(prev => ({ ...prev, [field]: value }))
    }
    setHasChanges(true)
  }

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="container max-w-6xl mx-auto py-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="jewelry-heading text-3xl font-bold flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="jewelry-glass-card p-3"
                >
                  <Crown className="h-8 w-8 jewelry-text-gold" />
                </motion.div>
                Jewelry Settings
              </h1>
              <p className="jewelry-text-luxury mt-1">
                Manage your luxury jewelry business settings and preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 jewelry-text-accent text-sm jewelry-glass-card px-3 py-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Unsaved changes
                </motion.div>
              )}
              <Button variant="outline" onClick={handleExport} className="jewelry-btn-secondary">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleSave} disabled={isLoading} className="jewelry-btn-primary">
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-fit jewelry-glass-panel">
                <TabsTrigger value="business" className="jewelry-nav-item">
                  <Diamond className="h-4 w-4 mr-2" />
                  Business
                </TabsTrigger>
                <TabsTrigger value="operations" className="jewelry-nav-item">
                  <Scale className="h-4 w-4 mr-2" />
                  Operations
                </TabsTrigger>
                <TabsTrigger value="appearance" className="jewelry-nav-item">
                  <Palette className="h-4 w-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="security" className="jewelry-nav-item">
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>

              {/* Business Tab */}
              <TabsContent value="business" className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="jewelry-glass-panel-strong">
                    <CardHeader>
                      <CardTitle className="jewelry-text-luxury flex items-center gap-2">
                        <Diamond className="h-5 w-5 jewelry-text-gold" />
                        Business Information
                      </CardTitle>
                      <CardDescription className="jewelry-text-luxury opacity-75">
                        Update your jewelry business profile and contact details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessName" className="jewelry-text-luxury">
                            Business Name
                          </Label>
                          <Input
                            id="businessName"
                            value={business.businessName}
                            onChange={e =>
                              handleInputChange('business', 'businessName', e.target.value)
                            }
                            className="jewelry-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ownerName" className="jewelry-text-luxury">
                            Owner Name
                          </Label>
                          <Input
                            id="ownerName"
                            value={business.ownerName}
                            onChange={e =>
                              handleInputChange('business', 'ownerName', e.target.value)
                            }
                            className="jewelry-input"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="jewelry-text-luxury">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={business.email}
                          onChange={e => handleInputChange('business', 'email', e.target.value)}
                          className="jewelry-input"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="jewelry-text-luxury">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            value={business.phone}
                            onChange={e => handleInputChange('business', 'phone', e.target.value)}
                            className="jewelry-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website" className="jewelry-text-luxury">
                            Website
                          </Label>
                          <Input
                            id="website"
                            value={business.website}
                            onChange={e => handleInputChange('business', 'website', e.target.value)}
                            className="jewelry-input"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="jewelry-text-luxury">
                          Business Address
                        </Label>
                        <Input
                          id="address"
                          value={business.address}
                          onChange={e => handleInputChange('business', 'address', e.target.value)}
                          className="jewelry-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxId" className="jewelry-text-luxury">
                          Tax ID / EIN
                        </Label>
                        <Input
                          id="taxId"
                          value={business.taxId}
                          onChange={e => handleInputChange('business', 'taxId', e.target.value)}
                          className="jewelry-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="jewelry-text-luxury">
                          Business Description
                        </Label>
                        <Textarea
                          id="description"
                          value={business.description}
                          onChange={e =>
                            handleInputChange('business', 'description', e.target.value)
                          }
                          className="jewelry-input min-h-[100px]"
                          placeholder="Describe your jewelry business..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Operations Tab */}
              <TabsContent value="operations" className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="jewelry-glass-panel-strong">
                    <CardHeader>
                      <CardTitle className="jewelry-text-luxury flex items-center gap-2">
                        <Scale className="h-5 w-5 jewelry-text-gold" />
                        Jewelry Operations
                      </CardTitle>
                      <CardDescription className="jewelry-text-luxury opacity-75">
                        Configure jewelry-specific business operations and pricing
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="jewelry-text-luxury">Default Currency</Label>
                          <Select
                            value={operations.defaultCurrency}
                            onValueChange={value =>
                              handleInputChange('operations', 'defaultCurrency', value)
                            }
                          >
                            <SelectTrigger className="jewelry-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="jewelry-text-luxury">Weight Unit</Label>
                          <Select
                            value={operations.weightUnit}
                            onValueChange={value =>
                              handleInputChange('operations', 'weightUnit', value)
                            }
                          >
                            <SelectTrigger className="jewelry-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                              <SelectItem value="grams">Grams</SelectItem>
                              <SelectItem value="ounces">Troy Ounces</SelectItem>
                              <SelectItem value="carats">Carats (for gems)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="jewelry-text-luxury">Purity Standard</Label>
                          <Select
                            value={operations.purityStandard}
                            onValueChange={value =>
                              handleInputChange('operations', 'purityStandard', value)
                            }
                          >
                            <SelectTrigger className="jewelry-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                              <SelectItem value="karat">Karat (K)</SelectItem>
                              <SelectItem value="fineness">Fineness (999)</SelectItem>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="jewelry-text-luxury">Gold Pricing Source</Label>
                          <Select
                            value={operations.goldPricingSource}
                            onValueChange={value =>
                              handleInputChange('operations', 'goldPricingSource', value)
                            }
                          >
                            <SelectTrigger className="jewelry-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                              <SelectItem value="london_fix">London Gold Fix</SelectItem>
                              <SelectItem value="spot_price">Live Spot Price</SelectItem>
                              <SelectItem value="custom">Custom Pricing</SelectItem>
                              <SelectItem value="weekly_avg">Weekly Average</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="jewelry-text-luxury">Default Markup (%)</Label>
                          <Input
                            value={operations.markupPercentage}
                            onChange={e =>
                              handleInputChange('operations', 'markupPercentage', e.target.value)
                            }
                            className="jewelry-input"
                            placeholder="45"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="jewelry-text-luxury font-medium">Business Features</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            {
                              key: 'inventoryTracking',
                              label: 'Inventory Tracking',
                              desc: 'Track stock levels and movements'
                            },
                            {
                              key: 'certificateTracking',
                              label: 'Certificate Management',
                              desc: 'Manage GIA and other certificates'
                            },
                            {
                              key: 'appraisalReminders',
                              label: 'Appraisal Reminders',
                              desc: 'Automatic appraisal renewal alerts'
                            }
                          ].map(feature => (
                            <div key={feature.key} className="jewelry-glass-card p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="jewelry-text-luxury font-medium">
                                    {feature.label}
                                  </Label>
                                  <p className="text-sm jewelry-text-luxury opacity-75">
                                    {feature.desc}
                                  </p>
                                </div>
                                <Select
                                  value={
                                    operations[feature.key as keyof typeof operations]
                                      ? 'enabled'
                                      : 'disabled'
                                  }
                                  onValueChange={value =>
                                    handleInputChange(
                                      'operations',
                                      feature.key,
                                      value === 'enabled'
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-32 jewelry-input">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                                    <SelectItem value="enabled">Enabled</SelectItem>
                                    <SelectItem value="disabled">Disabled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="jewelry-glass-panel-strong">
                    <CardHeader>
                      <CardTitle className="jewelry-text-luxury flex items-center gap-2">
                        <Palette className="h-5 w-5 jewelry-text-gold" />
                        Display & Appearance
                      </CardTitle>
                      <CardDescription className="jewelry-text-luxury opacity-75">
                        Customize the look and feel of your jewelry showcase
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="jewelry-text-luxury">Theme</Label>
                          <Select
                            value={appearance.theme}
                            onValueChange={value => handleInputChange('appearance', 'theme', value)}
                          >
                            <SelectTrigger className="jewelry-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                              <SelectItem value="gold-black">Gold & Black Elegance</SelectItem>
                              <SelectItem value="platinum">Platinum Classic</SelectItem>
                              <SelectItem value="rose-gold">Rose Gold Modern</SelectItem>
                              <SelectItem value="diamond">Diamond Bright</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="jewelry-text-luxury">Display Density</Label>
                          <Select
                            value={appearance.displayDensity}
                            onValueChange={value =>
                              handleInputChange('appearance', 'displayDensity', value)
                            }
                          >
                            <SelectTrigger className="jewelry-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                              <SelectItem value="compact">Compact</SelectItem>
                              <SelectItem value="comfortable">Comfortable</SelectItem>
                              <SelectItem value="spacious">Spacious</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="jewelry-text-luxury">Default View</Label>
                          <Select
                            value={appearance.defaultView}
                            onValueChange={value =>
                              handleInputChange('appearance', 'defaultView', value)
                            }
                          >
                            <SelectTrigger className="jewelry-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                              <SelectItem value="grid">Grid View</SelectItem>
                              <SelectItem value="list">List View</SelectItem>
                              <SelectItem value="showcase">Showcase View</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="jewelry-text-luxury">Price Display</Label>
                          <Select
                            value={appearance.showPrices}
                            onValueChange={value =>
                              handleInputChange('appearance', 'showPrices', value)
                            }
                          >
                            <SelectTrigger className="jewelry-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                              <SelectItem value="always">Always Show</SelectItem>
                              <SelectItem value="members_only">Members Only</SelectItem>
                              <SelectItem value="on_request">On Request</SelectItem>
                              <SelectItem value="never">Never Show</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="jewelry-text-luxury">Image Quality</Label>
                          <Select
                            value={appearance.imageQuality}
                            onValueChange={value =>
                              handleInputChange('appearance', 'imageQuality', value)
                            }
                          >
                            <SelectTrigger className="jewelry-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="high">High Quality</SelectItem>
                              <SelectItem value="ultra">Ultra High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="jewelry-glass-panel-strong">
                    <CardHeader>
                      <CardTitle className="jewelry-text-luxury flex items-center gap-2">
                        <Shield className="h-5 w-5 jewelry-text-gold" />
                        Security & Access
                      </CardTitle>
                      <CardDescription className="jewelry-text-luxury opacity-75">
                        Advanced security settings for your valuable jewelry business
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="jewelry-glass-card p-4 border border-jewelry-gold-300">
                        <div className="flex items-center gap-4">
                          <AlertTriangle className="h-5 w-5 jewelry-text-accent" />
                          <div>
                            <p className="jewelry-text-luxury font-medium">
                              High-Value Asset Protection
                            </p>
                            <p className="text-sm jewelry-text-luxury opacity-75">
                              Enhanced security features for jewelry businesses handling valuable
                              assets.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          {[
                            {
                              key: 'twoFactorAuth',
                              label: 'Two-Factor Authentication',
                              desc: 'Required for admin access'
                            },
                            {
                              key: 'auditLogging',
                              label: 'Comprehensive Audit Log',
                              desc: 'Track all system activities'
                            },
                            {
                              key: 'dataEncryption',
                              label: 'Data Encryption',
                              desc: 'Encrypt sensitive customer data'
                            }
                          ].map(feature => (
                            <div key={feature.key} className="jewelry-glass-card p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="jewelry-text-luxury font-medium">
                                    {feature.label}
                                  </Label>
                                  <p className="text-sm jewelry-text-luxury opacity-75">
                                    {feature.desc}
                                  </p>
                                </div>
                                <Select
                                  value={
                                    security[feature.key as keyof typeof security]
                                      ? 'enabled'
                                      : 'disabled'
                                  }
                                  onValueChange={value =>
                                    handleInputChange('security', feature.key, value === 'enabled')
                                  }
                                >
                                  <SelectTrigger className="w-32 jewelry-input">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                                    <SelectItem value="enabled">Enabled</SelectItem>
                                    <SelectItem value="disabled">Disabled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="jewelry-text-luxury">Session Timeout (minutes)</Label>
                            <Select
                              value={security.sessionTimeout}
                              onValueChange={value =>
                                handleInputChange('security', 'sessionTimeout', value)
                              }
                            >
                              <SelectTrigger className="jewelry-input">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="240">4 hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="jewelry-text-luxury">Backup Frequency</Label>
                            <Select
                              value={security.backupFrequency}
                              onValueChange={value =>
                                handleInputChange('security', 'backupFrequency', value)
                              }
                            >
                              <SelectTrigger className="jewelry-input">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="jewelry-text-luxury">Access Level</Label>
                            <Select
                              value={security.accessLevel}
                              onValueChange={value =>
                                handleInputChange('security', 'accessLevel', value)
                              }
                            >
                              <SelectTrigger className="jewelry-input">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="jewelry-glass-panel border border-jewelry-gold-300">
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
