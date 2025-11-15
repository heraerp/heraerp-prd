'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Zap,
  Package,
  Users,
  Utensils,
  ShoppingCart,
  ChefHat,
  Truck,
  Building2,
  Factory,
  Heart,
  Store,
  Play,
  Settings,
  Download,
  Eye,
  CheckCircle,
  Sparkles,
  Rocket,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

/**
 * HERA Module Generator - Frontend Interface
 *
 * Transform CLI template system into intuitive web interface
 * Generate complete restaurant modules with visual selection
 */

// Module definitions with business-focused descriptions
const moduleTemplates = {
  restaurant: [
    {
      id: 'orders',
      name: 'Orders',
      icon: ShoppingCart,
      description: 'Take orders fast, deliver on time, get paid quickly',
      color: 'orange',
      features: ['Customer Management', 'Order Types', 'Payment Processing', 'Delivery Tracking'],
      estimatedTime: '30 seconds',
      complexity: 'Simple'
    },
    {
      id: 'staff',
      name: 'Staff',
      icon: Users,
      description: 'Manage your team, track hours, control labor costs',
      color: 'blue',
      features: ['Employee Records', 'Time Tracking', 'Payroll Integration', 'Performance Metrics'],
      estimatedTime: '45 seconds',
      complexity: 'Medium'
    },
    {
      id: 'inventory',
      name: 'Inventory',
      icon: Package,
      description: 'Know what you have, when to reorder, stop wasting money',
      color: 'green',
      features: ['Stock Tracking', 'Reorder Alerts', 'Supplier Management', 'Cost Analysis'],
      estimatedTime: '60 seconds',
      complexity: 'Medium'
    },
    {
      id: 'menu',
      name: 'Menu',
      icon: Utensils,
      description: 'Create dishes that sell, price them right, make more money',
      color: 'purple',
      features: ['Menu Design', 'Pricing Strategy', 'Ingredient Tracking', 'Sales Analytics'],
      estimatedTime: '40 seconds',
      complexity: 'Simple'
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      icon: ChefHat,
      description: 'Cook efficiently, reduce wait times, serve quality food',
      color: 'red',
      features: ['Order Queue', 'Prep Timing', 'Quality Control', 'Equipment Tracking'],
      estimatedTime: '50 seconds',
      complexity: 'Complex'
    },
    {
      id: 'delivery',
      name: 'Delivery',
      icon: Truck,
      description: 'Get food to customers hot, fast, and profitable',
      color: 'indigo',
      features: [
        'Route Optimization',
        'Driver Management',
        'Delivery Tracking',
        'Customer Updates'
      ],
      estimatedTime: '55 seconds',
      complexity: 'Complex'
    }
  ],
  manufacturing: [
    {
      id: 'bom',
      name: 'Bill of Materials',
      icon: Factory,
      description: 'Manage product components and manufacturing costs',
      color: 'gray',
      features: ['Component Tracking', 'Cost Calculation', 'Version Control', 'Supplier Links'],
      estimatedTime: '90 seconds',
      complexity: 'Complex'
    }
  ],
  healthcare: [
    {
      id: 'patients',
      name: 'Patient Management',
      icon: Heart,
      description: 'Manage patient records and appointments efficiently',
      color: 'pink',
      features: [
        'Patient Records',
        'Appointment Scheduling',
        'Medical History',
        'Insurance Tracking'
      ],
      estimatedTime: '75 seconds',
      complexity: 'Complex'
    }
  ],
  retail: [
    {
      id: 'products',
      name: 'Product Catalog',
      icon: Store,
      description: 'Manage products, inventory, and sales efficiently',
      color: 'cyan',
      features: ['Product Management', 'Inventory Tracking', 'Sales Analytics', 'Customer Data'],
      estimatedTime: '65 seconds',
      complexity: 'Medium'
    }
  ]
}

// Quick complete systems
const quickSystems = [
  {
    id: 'restaurant-complete',
    name: 'Complete Restaurant System',
    description: 'Generate all restaurant modules at once - full ERP in 3 minutes',
    icon: Building2,
    modules: ['orders', 'staff', 'inventory', 'menu', 'kitchen', 'delivery'],
    estimatedTime: '3 minutes',
    color: 'emerald'
  }
]

export default function ModuleGeneratorPage() {
  const [selectedBusinessType, setSelectedBusinessType] = useState('restaurant')
  const [selectedModule, setSelectedModule] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationLog, setGenerationLog] = useState([])
  const [generatedModules, setGeneratedModules] = useState([])
  const [customModuleName, setCustomModuleName] = useState('')
  const [customDescription, setCustomDescription] = useState('')

  // Load generated modules history
  useEffect(() => {
    loadGeneratedModules()
  }, [])

  const loadGeneratedModules = async () => {
    try {
      const response = await fetch('/api/v1/development/modules')
      const result = await response.json()
      if (result.success) {
        setGeneratedModules(result.data || [])
      }
    } catch (error) {
      console.error('Error loading generated modules:', error)
    }
  }

  // Generate module using npm template system
  const generateModule = async (
    moduleId,
    businessType = selectedBusinessType,
    isQuickSystem = false
  ) => {
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationLog([])

    try {
      const endpoint = isQuickSystem
        ? '/api/v1/development/generate-system'
        : '/api/v1/development/generate'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName: moduleId,
          businessType: businessType,
          customName: customModuleName,
          customDescription: customDescription
        })
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      // Simulate progress updates (in real implementation, use WebSocket)
      const progressSteps = [
        { progress: 20, message: 'Creating module structure...' },
        { progress: 40, message: 'Generating API endpoints...' },
        { progress: 60, message: 'Creating UI components...' },
        { progress: 80, message: 'Setting up business logic...' },
        { progress: 100, message: 'Module generated successfully!' }
      ]

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 800))
        setGenerationProgress(step.progress)
        setGenerationLog(prev => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            message: step.message,
            type: step.progress === 100 ? 'success' : 'info'
          }
        ])
      }

      const result = await response.json()
      if (result.success) {
        loadGeneratedModules() // Refresh the list
        setSelectedModule(null)
        setCustomModuleName('')
        setCustomDescription('')
      }
    } catch (error) {
      console.error('Error generating module:', error)
      setGenerationLog(prev => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          message: 'Generation failed. Please try again.',
          type: 'error'
        }
      ])
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationProgress(0)
      }, 2000)
    }
  }

  const businessTypes = [
    { value: 'restaurant', label: 'Restaurant', icon: Utensils },
    { value: 'manufacturing', label: 'Manufacturing', icon: Factory },
    { value: 'healthcare', label: 'Healthcare', icon: Heart },
    { value: 'retail', label: 'Retail', icon: Store }
  ]

  const currentModules = moduleTemplates[selectedBusinessType] || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-600 bg-clip-text text-transparent">
                🧬 HERA DNA Generator
              </h1>
              <p className="text-muted-foreground mt-1">
                200x Development Acceleration - Generate complete business modules in 30 seconds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              <span>30 seconds vs 26+ weeks manual development</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Steve Jobs design philosophy built-in</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Universal architecture integration</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Business Type Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Business Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map(type => {
                      const IconComponent = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Custom Module Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="custom-name">Custom Module Name</Label>
                  <Input
                    id="custom-name"
                    value={customModuleName}
                    onChange={e => setCustomModuleName(e.target.value)}
                    placeholder="e.g., loyalty-program"
                  />
                </div>
                <div>
                  <Label htmlFor="custom-description">Custom Description</Label>
                  <Textarea
                    id="custom-description"
                    value={customDescription}
                    onChange={e => setCustomDescription(e.target.value)}
                    placeholder="Describe what this module does for your business"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Generated Modules History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Generations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedModules.length > 0 ? (
                  <div className="space-y-2">
                    {generatedModules.slice(0, 5).map((module, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div>
                          <div className="font-medium text-sm">{module.name}</div>
                          <div className="text-xs text-muted-foreground">{module.generatedAt}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Badge className="text-xs" variant="secondary">
                            Ready
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No modules generated yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Quick Complete Systems */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Rocket className="w-6 h-6 text-emerald-500" />
                Quick Complete Systems
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {quickSystems.map(system => (
                  <Card
                    key={system.id}
                    className="hover:shadow-lg transition-all hover:scale-[1.02] border-emerald-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-16 h-16 bg-gradient-to-r from-${system.color}-400 to-${system.color}-600 rounded-2xl flex items-center justify-center`}
                          >
                            <system.icon className="w-8 h-8 text-foreground" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{system.name}</h3>
                            <p className="text-muted-foreground mb-2">{system.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {system.estimatedTime}
                              </span>
                              <span>{system.modules.length} modules</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => generateModule(system.id, selectedBusinessType, true)}
                          disabled={isGenerating}
                          className={`bg-gradient-to-r from-${system.color}-500 to-${system.color}-600 hover:from-${system.color}-600 hover:to-${system.color}-700`}
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Generate System
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Individual Module Templates */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-500" />
                Individual Modules -{' '}
                {businessTypes.find(t => t.value === selectedBusinessType)?.label}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentModules.map(module => {
                  const IconComponent = module.icon
                  return (
                    <Card
                      key={module.id}
                      className={`hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer ${
                        selectedModule?.id === module.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedModule(module)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-12 h-12 bg-gradient-to-r from-${module.color}-400 to-${module.color}-600 rounded-xl flex items-center justify-center`}
                          >
                            <IconComponent className="w-6 h-6 text-foreground" />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {module.complexity}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{module.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4 text-sm">{module.description}</p>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Generation Time:</span>
                            <span className="font-medium">{module.estimatedTime}</span>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2">Features:</p>
                            <div className="space-y-1">
                              {module.features.slice(0, 2).map((feature, index) => (
                                <div
                                  key={index}
                                  className="text-xs text-muted-foreground flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  {feature}
                                </div>
                              ))}
                              {module.features.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{module.features.length - 2} more features
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            onClick={e => {
                              e.stopPropagation()
                              generateModule(module.id, selectedBusinessType)
                            }}
                            disabled={isGenerating}
                            className={`w-full bg-gradient-to-r from-${module.color}-500 to-${module.color}-600 hover:from-${module.color}-600 hover:to-${module.color}-700`}
                          >
                            {isGenerating ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Generate
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Generation Progress Modal */}
        {isGenerating && (
          <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                  Generating Module
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Generation Log */}
                  <div className="bg-background text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                    {generationLog.map((log, index) => (
                      <div key={index} className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground">[{log.timestamp}]</span>
                        {log.type === 'success' && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                        {log.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                        {log.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-400" />}
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
