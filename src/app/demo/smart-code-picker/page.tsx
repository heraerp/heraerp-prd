'use client'

import React, { useState } from 'react'
import { SmartCodePicker, type SmartCode } from '@/lib/dna/components/smart-code/SmartCodePicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Code,
  Settings,
  CheckCircle,
  Copy,
  Globe,
  Building2,
  UtensilsCrossed,
  Scissors,
  Heart,
  ShoppingCart,
  Factory,
  Briefcase,
  Database,
  CreditCard,
  DollarSign,
  Users,
  Package,
  FileText,
  Activity
} from 'lucide-react'
import { motion } from 'framer-motion'

const industries = [
  { id: 'universal', name: 'Universal', icon: Globe },
  { id: 'restaurant', name: 'Restaurant', icon: UtensilsCrossed },
  { id: 'salon', name: 'Salon & Spa', icon: Scissors },
  { id: 'healthcare', name: 'Healthcare', icon: Heart },
  { id: 'retail', name: 'Retail', icon: ShoppingCart },
  { id: 'manufacturing', name: 'Manufacturing', icon: Factory },
  { id: 'professional', name: 'Professional Services', icon: Briefcase }
]

const modules = [
  { id: 'crm', name: 'CRM', icon: Users },
  { id: 'finance', name: 'Finance', icon: DollarSign },
  { id: 'inventory', name: 'Inventory', icon: Package },
  { id: 'sales', name: 'Sales', icon: CreditCard },
  { id: 'reports', name: 'Reports', icon: FileText },
  { id: 'workflow', name: 'Workflow', icon: Activity }
]

export default function SmartCodePickerDemoPage() {
  const [selectedCode, setSelectedCode] = useState<string>('')
  const [selectedSmartCode, setSelectedSmartCode] = useState<SmartCode | null>(null)
  const [config, setConfig] = useState({
    industry: '',
    module: '',
    allowCustom: true,
    showDescription: true,
    showRecent: true,
    showPopular: true,
    showSearch: true,
    mode: 'dialog' as const,
    required: false,
    disabled: false
  })

  const { toast } = useToast()

  const handleCodeChange = (code: string, smartCode: SmartCode) => {
    setSelectedCode(code)
    setSelectedSmartCode(smartCode)

    toast({
      title: 'Smart Code Selected',
      description: `${smartCode.name} (${code})`,
      variant: 'default'
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to Clipboard',
      description: text,
      variant: 'default'
    })
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Smart Code Picker Demo
          </h1>
        </motion.div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Intelligent business classification code selector with hierarchical navigation. Select
          HERA Smart Codes to provide context and meaning to your business data.
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Industry Filter</Label>
              <select
                value={config.industry}
                onChange={e => setConfig(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Industries</option>
                {industries.map(ind => (
                  <option key={ind.id} value={ind.id}>
                    {ind.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Module Filter</Label>
              <select
                value={config.module}
                onChange={e => setConfig(prev => ({ ...prev, module: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Modules</option>
                {modules.map(mod => (
                  <option key={mod.id} value={mod.id}>
                    {mod.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Display Mode</Label>
              <select
                value={config.mode}
                onChange={e => setConfig(prev => ({ ...prev, mode: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="dialog">Dialog</option>
                <option value="inline">Inline</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allow-custom" className="flex items-center gap-2">
                Allow Custom Codes
              </Label>
              <Switch
                id="allow-custom"
                checked={config.allowCustom}
                onCheckedChange={checked => setConfig(prev => ({ ...prev, allowCustom: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="show-description" className="flex items-center gap-2">
                Show Descriptions
              </Label>
              <Switch
                id="show-description"
                checked={config.showDescription}
                onCheckedChange={checked =>
                  setConfig(prev => ({ ...prev, showDescription: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="show-recent" className="flex items-center gap-2">
                Show Recent Codes
              </Label>
              <Switch
                id="show-recent"
                checked={config.showRecent}
                onCheckedChange={checked => setConfig(prev => ({ ...prev, showRecent: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="required" className="flex items-center gap-2">
                Required Field
              </Label>
              <Switch
                id="required"
                checked={config.required}
                onCheckedChange={checked => setConfig(prev => ({ ...prev, required: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disabled" className="flex items-center gap-2">
                Disabled State
              </Label>
              <Switch
                id="disabled"
                checked={config.disabled}
                onCheckedChange={checked => setConfig(prev => ({ ...prev, disabled: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Smart Code Picker */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Try Smart Code Picker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SmartCodePicker
                value={selectedCode}
                onChange={handleCodeChange}
                industry={config.industry || undefined}
                module={config.module || undefined}
                allowCustom={config.allowCustom}
                showDescription={config.showDescription}
                showRecent={config.showRecent}
                showPopular={config.showPopular}
                showSearch={config.showSearch}
                mode={config.mode}
                required={config.required}
                disabled={config.disabled}
                label="Business Classification"
                placeholder="Select a smart code..."
                className="w-full"
              />

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Try different industry and module filters to see how the available codes change.
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Quick Examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { code: 'HERA.CRM.CUST.ENT.PROF.V1', label: 'Customer' },
                      { code: 'HERA.FIN.SALE.TXN.INV.V1', label: 'Invoice' },
                      { code: 'HERA.REST.SALE.TXN.ORDER.V1', label: 'Restaurant Order' },
                      { code: 'HERA.SALON.SVC.TXN.APPT.V1', label: 'Salon Appointment' }
                    ].map(example => (
                      <Button
                        key={example.code}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCode(example.code)
                          setSelectedSmartCode({
                            code: example.code,
                            name: example.label,
                            description: `Example ${example.label} smart code`,
                            category: {
                              id: 'entity',
                              name: 'Entity',
                              icon: Database,
                              description: '',
                              color: 'blue'
                            },
                            version: 1
                          })
                        }}
                      >
                        {example.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Code Details */}
        <div>
          <Tabs defaultValue="details" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Selection Details</TabsTrigger>
              <TabsTrigger value="implementation">Implementation</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Selected Smart Code</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSmartCode ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Code Selected</span>
                      </div>

                      <div className="space-y-4 p-4 bg-muted rounded-lg">
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Code</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(selectedCode)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <code className="font-mono text-sm bg-background p-1 rounded">
                            {selectedCode}
                          </code>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Name</p>
                          <p className="font-medium">{selectedSmartCode.name}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Description</p>
                          <p>{selectedSmartCode.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{selectedSmartCode.category.name}</Badge>
                          {selectedSmartCode.industry && (
                            <Badge variant="outline">{selectedSmartCode.industry}</Badge>
                          )}
                          {selectedSmartCode.module && (
                            <Badge variant="outline">{selectedSmartCode.module}</Badge>
                          )}
                          <Badge variant="outline">v{selectedSmartCode.version}</Badge>
                          {selectedSmartCode.deprecated && (
                            <Badge variant="destructive">Deprecated</Badge>
                          )}
                        </div>

                        {selectedSmartCode.metadata &&
                          Object.keys(selectedSmartCode.metadata).length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Metadata</p>
                              <pre className="text-xs bg-background p-2 rounded overflow-auto">
                                {JSON.stringify(selectedSmartCode.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Select a smart code to see details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="implementation" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Implementation Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs">
                    {`import { SmartCodePicker } from '@/lib/dna/components/smart-code'

// Basic usage
<SmartCodePicker
  onChange={(code, smartCode) => {
    console.log('Selected:', code, smartCode)
  }}
/>

// With filtering and configuration
<SmartCodePicker
  value={selectedCode}
  onChange={handleCodeChange}
  industry="${config.industry || 'universal'}"
  module="${config.module || 'finance'}"
  allowCustom={${config.allowCustom}}
  showDescription={${config.showDescription}}
  showRecent={${config.showRecent}}
  mode="${config.mode}"
  label="Business Classification"
  required={${config.required}}
  disabled={${config.disabled}}
/>

// Form integration
const MyForm = () => {
  const [formData, setFormData] = useState({
    smartCode: '',
    smartCodeName: ''
  })
  
  return (
    <SmartCodePicker
      value={formData.smartCode}
      onChange={(code, smartCode) => {
        setFormData({
          smartCode: code,
          smartCodeName: smartCode.name
        })
      }}
      label="Transaction Type"
      required={true}
    />
  )
}

// Custom validation
<SmartCodePicker
  onChange={(code, smartCode) => {
    if (smartCode.deprecated) {
      toast({
        title: 'Deprecated Code',
        description: 'Consider using a newer version',
        variant: 'destructive'
      })
    }
  }}
/>`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Smart Code Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Code Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="w-4 h-4" />
                Entity Codes
              </h4>
              <p className="text-sm text-muted-foreground">
                Business objects like customers, products, employees, and GL accounts
              </p>
              <div className="space-y-1">
                <code className="text-xs block">HERA.CRM.CUST.ENT.PROF.V1</code>
                <code className="text-xs block">HERA.INV.PROD.ENT.STD.V1</code>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Transaction Codes
              </h4>
              <p className="text-sm text-muted-foreground">
                Business transactions like sales, purchases, payments, and appointments
              </p>
              <div className="space-y-1">
                <code className="text-xs block">HERA.FIN.SALE.TXN.INV.V1</code>
                <code className="text-xs block">HERA.REST.SALE.TXN.ORDER.V1</code>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Report Codes
              </h4>
              <p className="text-sm text-muted-foreground">
                Analytics and reports for business intelligence and compliance
              </p>
              <div className="space-y-1">
                <code className="text-xs block">HERA.RPT.SALES.DAILY.V1</code>
                <code className="text-xs block">HERA.RPT.AR.AGING.V1</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Industry Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Industry-Specific Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {industries.slice(1).map(industry => {
              const Icon = industry.icon
              return (
                <div key={industry.id} className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {industry.name}
                  </h4>
                  <div className="space-y-2 pl-6">
                    {industry.id === 'restaurant' && (
                      <>
                        <div>
                          <code className="text-xs">HERA.REST.SALE.TXN.ORDER.V1</code>
                          <p className="text-xs text-muted-foreground">
                            Restaurant order transaction
                          </p>
                        </div>
                        <div>
                          <code className="text-xs">HERA.REST.INV.ENT.INGR.V1</code>
                          <p className="text-xs text-muted-foreground">Food ingredient entity</p>
                        </div>
                      </>
                    )}
                    {industry.id === 'salon' && (
                      <>
                        <div>
                          <code className="text-xs">HERA.SALON.SVC.TXN.APPT.V1</code>
                          <p className="text-xs text-muted-foreground">Service appointment</p>
                        </div>
                        <div>
                          <code className="text-xs">HERA.SALON.HR.ENT.STYL.V1</code>
                          <p className="text-xs text-muted-foreground">Stylist profile</p>
                        </div>
                      </>
                    )}
                    {industry.id === 'healthcare' && (
                      <>
                        <div>
                          <code className="text-xs">HERA.HLTH.PAT.ENT.PROF.V1</code>
                          <p className="text-xs text-muted-foreground">Patient profile</p>
                        </div>
                        <div>
                          <code className="text-xs">HERA.HLTH.SVC.TXN.VISIT.V1</code>
                          <p className="text-xs text-muted-foreground">Patient visit</p>
                        </div>
                      </>
                    )}
                    {(industry.id === 'retail' ||
                      industry.id === 'manufacturing' ||
                      industry.id === 'professional') && (
                      <>
                        <div>
                          <code className="text-xs">
                            HERA.{industry.id.toUpperCase()}.SALE.TXN.ORDER.v1
                          </code>
                          <p className="text-xs text-muted-foreground">Sales order transaction</p>
                        </div>
                        <div>
                          <code className="text-xs">
                            HERA.{industry.id.toUpperCase()}.INV.ENT.PROD.v1
                          </code>
                          <p className="text-xs text-muted-foreground">Product entity</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
