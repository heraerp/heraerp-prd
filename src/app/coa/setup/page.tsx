'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Building,
  Globe,
  Stethoscope,
  Utensils,
  Factory,
  GraduationCap,
  Store,
  Truck,
  ArrowRight,
  CheckCircle,
  Settings,
  Users,
  FileText
} from 'lucide-react'
import { DualAuthProvider } from '@/components/auth/DualAuthProvider'
import { HeraThemeProvider } from '@/components/universal/ui/HeraThemeProvider'
import FinancialLayout from '@/components/financial/FinancialLayout'

interface COATemplate {
  id: string
  name: string
  description: string
  industry: string
  country: string
  accountCount: number
  icon: React.ComponentType<any>
  color: string
  features: string[]
  isRecommended?: boolean
}

interface SetupStep {
  id: number
  title: string
  description: string
  completed: boolean
}

export default function COASetup() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const templates: COATemplate[] = [
    {
      id: 'restaurant-usa',
      name: 'Restaurant (US GAAP)',
      description: 'Complete Chart of Accounts for restaurant operations including food costs, labor, and hospitality-specific accounts',
      industry: 'Restaurant',
      country: 'USA',
      accountCount: 85,
      icon: Utensils,
      color: 'from-amber-500 to-orange-500',
      features: [
        'Food & Beverage Cost Tracking',
        'Labor Cost Management',
        'Tip & Gratuity Accounts',
        'POS Integration Ready',
        'Multi-Location Support',
        'Inventory Management'
      ],
      isRecommended: true
    },
    {
      id: 'healthcare-usa',
      name: 'Healthcare (US GAAP)',
      description: 'Medical practice and healthcare facility Chart of Accounts with insurance, patient billing, and compliance features',
      industry: 'Healthcare',
      country: 'USA',
      accountCount: 125,
      icon: Stethoscope,
      color: 'from-blue-500 to-cyan-500',
      features: [
        'Insurance Billing',
        'Patient Accounts Receivable',
        'Medical Equipment Tracking',
        'Compliance Reporting',
        'Provider Fee Management',
        'EMR Integration Ready'
      ]
    },
    {
      id: 'manufacturing-usa',
      name: 'Manufacturing (US GAAP)',
      description: 'Industrial and manufacturing Chart of Accounts with work-in-progress, raw materials, and production cost tracking',
      industry: 'Manufacturing',
      country: 'USA',
      accountCount: 150,
      icon: Factory,
      color: 'from-purple-500 to-indigo-500',
      features: [
        'Work in Progress Tracking',
        'Raw Materials Inventory',
        'Production Cost Centers',
        'Quality Control Costs',
        'Equipment Depreciation',
        'Labor Allocation'
      ]
    },
    {
      id: 'retail-usa',
      name: 'Retail (US GAAP)',
      description: 'Retail business Chart of Accounts with inventory management, customer returns, and multi-channel sales tracking',
      industry: 'Retail',
      country: 'USA',
      accountCount: 95,
      icon: Store,
      color: 'from-emerald-500 to-teal-500',
      features: [
        'Multi-Channel Sales',
        'Inventory Valuation',
        'Customer Returns',
        'Loyalty Programs',
        'Seasonal Adjustments',
        'E-commerce Integration'
      ]
    },
    {
      id: 'education-usa',
      name: 'Education (US GAAP)',
      description: 'Educational institution Chart of Accounts with student accounts, grants, and educational program tracking',
      industry: 'Education',
      country: 'USA',
      accountCount: 110,
      icon: GraduationCap,
      color: 'from-indigo-500 to-purple-500',
      features: [
        'Student Account Management',
        'Grant & Funding Tracking',
        'Program Cost Allocation',
        'Tuition Revenue',
        'Scholarship Management',
        'Compliance Reporting'
      ]
    },
    {
      id: 'logistics-usa',
      name: 'Logistics & Transportation',
      description: 'Transportation and logistics Chart of Accounts with vehicle costs, fuel tracking, and route profitability',
      industry: 'Logistics',
      country: 'USA',
      accountCount: 105,
      icon: Truck,
      color: 'from-slate-500 to-gray-500',
      features: [
        'Vehicle Cost Tracking',
        'Fuel Management',
        'Route Profitability',
        'Driver Payroll',
        'Maintenance Scheduling',
        'Insurance Management'
      ]
    }
  ]

  const setupSteps: SetupStep[] = [
    {
      id: 1,
      title: 'Select Template',
      description: 'Choose the Chart of Accounts template that best fits your business',
      completed: !!selectedTemplate
    },
    {
      id: 2,
      title: 'Customize Accounts',
      description: 'Review and customize accounts for your specific needs',
      completed: false
    },
    {
      id: 3,
      title: 'Organization Assignment',
      description: 'Assign the COA to your organizations',
      completed: false
    },
    {
      id: 4,
      title: 'Review & Deploy',
      description: 'Final review and deployment of your Chart of Accounts',
      completed: false
    }
  ]

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
  }

  const handleNextStep = async () => {
    if (!selectedTemplate) return
    
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setCurrentStep(2)
      setIsLoading(false)
      router.push(`/coa/setup/customize?template=${selectedTemplate}`)
    }, 1000)
  }

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)

  return (
    <DualAuthProvider>
      <HeraThemeProvider>
        <FinancialLayout 
          title="COA Setup Wizard"
          subtitle="Configure your Chart of Accounts in 4 easy steps"
          showBackButton={true}
          backUrl="/coa"
          actions={
            <Badge variant="outline" className="px-3 py-1">
              Step {currentStep} of 4
            </Badge>
          }
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {setupSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step.completed 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : currentStep === step.id
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>
                  {index < setupSteps.length - 1 && (
                    <div className={`w-24 h-1 mx-4 ${
                      step.completed ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4">
              {setupSteps.map((step) => (
                <div key={step.id} className="text-center" style={{ width: '200px' }}>
                  <h3 className={`text-sm font-semibold ${
                    currentStep === step.id ? 'text-blue-600' : 'text-slate-600'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Templates Grid */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Choose Your Industry Template
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => {
                  const Icon = template.icon
                  const isSelected = selectedTemplate === template.id
                  
                  return (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all duration-300 border-2 ${
                        isSelected 
                          ? 'border-blue-500 shadow-lg ring-4 ring-blue-100' 
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                      } ${template.isRecommended ? 'ring-2 ring-amber-200' : ''}`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      {template.isRecommended && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <Badge className="bg-amber-500 hover:bg-amber-600">
                            Recommended
                          </Badge>
                        </div>
                      )}
                      
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {template.accountCount} accounts
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                          {template.name}
                        </h3>
                        <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                          {template.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Industry:</span>
                            <span className="font-medium text-slate-700">{template.industry}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Standard:</span>
                            <span className="font-medium text-slate-700">{template.country}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="grid grid-cols-1 gap-1">
                            {template.features.slice(0, 3).map((feature, index) => (
                              <div key={index} className="flex items-center text-xs text-slate-600">
                                <CheckCircle className="w-3 h-3 mr-2 text-emerald-500" />
                                {feature}
                              </div>
                            ))}
                            {template.features.length > 3 && (
                              <div className="text-xs text-slate-500 mt-1">
                                +{template.features.length - 3} more features...
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Selected Template Details */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                {selectedTemplateData ? (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-blue-500" />
                        Template Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedTemplateData.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                            <selectedTemplateData.icon className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {selectedTemplateData.name}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {selectedTemplateData.accountCount} Pre-configured Accounts
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 mb-3">
                            Included Features:
                          </h4>
                          <div className="space-y-2">
                            {selectedTemplateData.features.map((feature, index) => (
                              <div key={index} className="flex items-center text-sm text-slate-700">
                                <CheckCircle className="w-4 h-4 mr-2 text-emerald-500 flex-shrink-0" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button 
                          onClick={handleNextStep}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Setting up...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              Continue Setup
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Select a Template
                      </h3>
                      <p className="text-sm text-slate-600">
                        Choose a Chart of Accounts template from the options on the left to see more details and continue with the setup.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
          </div>
        </FinancialLayout>
      </HeraThemeProvider>
    </DualAuthProvider>
  )
}