/**
 * HERA v3.0 Multi-Industry Platform Demo
 * Showcases the complete multi-industry platform architecture
 */

'use client'

import React, { useState, useRef } from 'react'
import { 
  getAvailableIndustries,
  getIndustryConfig,
  type IndustryType 
} from '@/lib/platform/constants'
import {
  Building2,
  Sparkles,
  Truck,
  ChefHat,
  Heart,
  ShoppingBag,
  Hammer,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  Users,
  BarChart,
  Palette,
  Globe,
  Star,
  Zap
} from 'lucide-react'

const INDUSTRY_ICONS = {
  waste_management: Truck,
  salon_beauty: Sparkles,
  restaurant: ChefHat,
  healthcare: Heart,
  retail: ShoppingBag,
  construction: Hammer,
  generic_business: Building2
}

const DEMO_SCENARIOS = [
  {
    id: 'wasteflow',
    company: 'WasteFlow Inc.',
    industry: 'waste_management' as IndustryType,
    tagline: 'Complete waste management solution',
    features: ['Route optimization', 'Fleet tracking', 'Scale integration', 'Environmental compliance'],
    ui_preview: {
      navigation: ['Operations', 'Fleet Management', 'Customers', 'Processing', 'Compliance'],
      dashboard_widgets: ['Today\'s Routes', 'Fleet Status', 'Revenue (MTD)', 'Compliance Score'],
      primary_workflows: ['Daily route optimization', 'Pickup recording', 'Scale transactions', 'Compliance reporting']
    }
  },
  {
    id: 'luxe-salon',
    company: 'Luxe Beauty Salon',
    industry: 'salon_beauty' as IndustryType,
    tagline: 'Premium salon management system',
    features: ['Appointment booking', 'Staff commission', 'Inventory tracking', 'Customer loyalty'],
    ui_preview: {
      navigation: ['Dashboard', 'Appointments', 'Customers', 'Staff', 'Services', 'Point of Sale'],
      dashboard_widgets: ['Today\'s Schedule', 'Revenue', 'Staff Performance', 'Customer Insights'],
      primary_workflows: ['Appointment booking', 'Customer check-in', 'Service completion', 'Commission tracking']
    }
  },
  {
    id: 'bistro-moderne',
    company: 'Bistro Moderne',
    industry: 'restaurant' as IndustryType,
    tagline: 'Full-service restaurant management',
    features: ['POS system', 'Table management', 'Kitchen orders', 'Delivery tracking'],
    ui_preview: {
      navigation: ['Dashboard', 'Orders', 'Menu', 'Tables', 'Kitchen', 'Delivery'],
      dashboard_widgets: ['Today\'s Sales', 'Order Queue', 'Table Status', 'Delivery Metrics'],
      primary_workflows: ['Order taking', 'Kitchen management', 'Table service', 'Payment processing']
    }
  }
]

export default function HERAv3PlatformDemo() {
  const [selectedScenario, setSelectedScenario] = useState(DEMO_SCENARIOS[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showCode, setShowCode] = useState(false)
  const demoRef = useRef<HTMLDivElement>(null)

  const availableIndustries = getAvailableIndustries()
  const industryConfig = getIndustryConfig(selectedScenario.industry)
  const IconComponent = INDUSTRY_ICONS[selectedScenario.industry]

  const startDemo = () => {
    setIsPlaying(true)
    setCurrentStep(0)
    // Auto-advance through demo steps
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= 4) {
          setIsPlaying(false)
          clearInterval(interval)
          return 0
        }
        return prev + 1
      })
    }, 3000)
  }

  const resetDemo = () => {
    setIsPlaying(false)
    setCurrentStep(0)
  }

  const demoSteps = [
    {
      title: 'User Registration',
      description: `John from ${selectedScenario.company} signs up`,
      preview: 'Industry selection and organization setup'
    },
    {
      title: 'Template Pack Loading',
      description: `${industryConfig.name} template pack loads automatically`,
      preview: 'Dynamic UI generation based on industry'
    },
    {
      title: 'Custom Branding Applied',
      description: 'Company colors, logo, and domain',
      preview: 'White-label experience with custom branding'
    },
    {
      title: 'Industry-Specific Interface',
      description: 'Navigation and features tailored to business',
      preview: 'Feels like custom-built software'
    },
    {
      title: 'Ready for Business',
      description: 'Complete solution in under 5 minutes',
      preview: 'Start managing operations immediately'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                HERA v3.0 Multi-Industry Platform
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                One platform, infinite industries. Every tenant feels custom-built.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCode(!showCode)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
              >
                {showCode ? 'Hide' : 'Show'} Architecture
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Scenario Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Demo Scenarios</h2>
              <div className="space-y-3">
                {DEMO_SCENARIOS.map((scenario) => {
                  const ScenarioIcon = INDUSTRY_ICONS[scenario.industry]
                  const scenarioConfig = getIndustryConfig(scenario.industry)
                  const isActive = selectedScenario.id === scenario.id

                  return (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario)}
                      className={`
                        w-full p-4 rounded-lg border-2 text-left transition-all duration-200
                        ${isActive 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: scenarioConfig.primaryColor }}
                        >
                          <ScenarioIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {scenario.company}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {scenarioConfig.name}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {scenario.tagline}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {scenario.features.slice(0, 2).map((feature, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                        {scenario.features.length > 2 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            +{scenario.features.length - 2} more
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Demo Controls */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold mb-3">Demo Controls</h3>
                <div className="flex gap-2">
                  <button
                    onClick={startDemo}
                    disabled={isPlaying}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    Start Demo
                  </button>
                  <button
                    onClick={resetDemo}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Demo Area */}
          <div className="lg:col-span-2" ref={demoRef}>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Demo Header */}
              <div 
                className="px-6 py-4 text-white"
                style={{ backgroundColor: industryConfig.primaryColor }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-8 h-8" />
                    <div>
                      <h2 className="text-xl font-bold">{selectedScenario.company}</h2>
                      <p className="opacity-90">{selectedScenario.tagline}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-75">Industry</div>
                    <div className="font-semibold">{industryConfig.name}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                {isPlaying && (
                  <div className="mt-4">
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-300"
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                      />
                    </div>
                    <div className="text-sm mt-2 opacity-90">
                      Step {currentStep + 1} of 5: {demoSteps[currentStep]?.title}
                    </div>
                  </div>
                )}
              </div>

              {/* Demo Content */}
              <div className="p-6">
                {!isPlaying ? (
                  // Static Preview
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Features & Capabilities</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {selectedScenario.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Navigation Structure</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedScenario.ui_preview.navigation.map((nav, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {nav}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Dashboard Widgets</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {selectedScenario.ui_preview.dashboard_widgets.map((widget, index) => (
                          <div key={index} className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <BarChart className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium">{widget}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-center pt-4">
                      <button
                        onClick={startDemo}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                      >
                        <Play className="w-5 h-5" />
                        Watch Demo Flow
                      </button>
                    </div>
                  </div>
                ) : (
                  // Animated Demo
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {currentStep === 0 && <Users className="w-8 h-8 text-blue-600" />}
                        {currentStep === 1 && <Zap className="w-8 h-8 text-blue-600" />}
                        {currentStep === 2 && <Palette className="w-8 h-8 text-blue-600" />}
                        {currentStep === 3 && <Building2 className="w-8 h-8 text-blue-600" />}
                        {currentStep === 4 && <CheckCircle className="w-8 h-8 text-green-600" />}
                      </div>
                      <h3 className="text-xl font-bold mb-2">
                        {demoSteps[currentStep]?.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {demoSteps[currentStep]?.description}
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
                        <Clock className="w-4 h-4" />
                        {demoSteps[currentStep]?.preview}
                      </div>
                    </div>

                    {/* Mock UI Preview */}
                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                      <div className="text-center text-gray-500">
                        <div className="w-12 h-12 bg-gray-200 rounded mx-auto mb-2"></div>
                        <p className="text-sm">
                          {currentStep === 0 && 'Registration form with industry selection'}
                          {currentStep === 1 && 'Template pack loading and validation'}
                          {currentStep === 2 && 'Custom branding and colors applied'}
                          {currentStep === 3 && 'Industry-specific navigation and features'}
                          {currentStep === 4 && 'Complete custom-built experience ready'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Key Benefits */}
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Key Benefits</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Custom-Built Feeling</h4>
                    <p className="text-sm text-gray-600">
                      Every tenant gets industry-specific UI, terminology, and workflows
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Instant Setup</h4>
                    <p className="text-sm text-gray-600">
                      Complete system ready in under 5 minutes with template packs
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">White-Label Ready</h4>
                    <p className="text-sm text-gray-600">
                      Custom domains, branding, and complete white-label experience
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">One Codebase</h4>
                    <p className="text-sm text-gray-600">
                      Single platform serves all industries with zero code duplication
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Overview */}
        {showCode && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Architecture Overview</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Platform Organization</h4>
                <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                  <div>PLATFORM_ORG_ID</div>
                  <div className="text-gray-600">├─ User Registry</div>
                  <div className="text-gray-600">├─ Template Packs</div>
                  <div className="text-gray-600">└─ Industry Configs</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Template System</h4>
                <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                  <div>/templates/industries/</div>
                  <div className="text-gray-600">├─ pack.json</div>
                  <div className="text-gray-600">├─ entities/</div>
                  <div className="text-gray-600">├─ transactions/</div>
                  <div className="text-gray-600">└─ dashboards/</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Dynamic Branding</h4>
                <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                  <div>CSS Variables</div>
                  <div className="text-gray-600">├─ --primary-color</div>
                  <div className="text-gray-600">├─ --logo-url</div>
                  <div className="text-gray-600">└─ --font-family</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>The Result:</strong> Same Sacred Six tables, same API v2 endpoints, same RLS policies. 
                Users just see their data with their branding using their industry's templates.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}