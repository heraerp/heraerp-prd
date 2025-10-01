'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  Building2,
  Globe,
  CreditCard,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Users,
  Database,
  Shield,
  Zap,
  Star,
  Clock
} from 'lucide-react'

interface ConversionData {
  companyName?: string
  ownerName?: string
  businessEmail?: string
  phone?: string
  businessType?: string
  employees?: string
  monthlyRevenue?: string
  subdomain?: string
  plan?: {
    type: string
    billing: string
    price: number
  }
}

interface SaaSConversionWizardProps {
  demoModule: string
  onComplete: (data: ConversionData) => void
  onCancel: () => void
}

const subscriptionPlans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 79,
    yearlyPrice: 790,
    description: 'Perfect for small businesses getting started',
    features: [
      '3 users included',
      '10GB storage',
      'Basic reports',
      'Mobile app access',
      'Email support'
    ],
    limits: {
      users: 3,
      storage: '10GB',
      apiCalls: '1K/month'
    },
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 149,
    yearlyPrice: 1490,
    popular: true,
    description: 'Most popular choice for growing businesses',
    features: [
      '15 users included',
      '100GB storage',
      'Advanced reports & analytics',
      'API access',
      'Third-party integrations',
      'Priority support',
      'Custom fields'
    ],
    limits: {
      users: 15,
      storage: '100GB',
      apiCalls: '10K/month'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    description: 'For large organizations with advanced needs',
    features: [
      'Unlimited users',
      '1TB storage',
      'All reporting features',
      'Unlimited API calls',
      'SSO & advanced security',
      'Custom integrations',
      '24/7 phone support',
      'Dedicated account manager'
    ],
    limits: {
      users: 'Unlimited',
      storage: '1TB',
      apiCalls: 'Unlimited'
    },
    popular: false
  }
]

export function SaaSConversionWizard({
  demoModule,
  onComplete,
  onCancel
}: SaaSConversionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [conversionData, setConversionData] = useState<ConversionData>({})
  const [isLoading, setIsLoading] = useState(false)

  const steps = [
    { id: 1, name: 'Company Details', icon: Building2 },
    { id: 2, name: 'Subdomain Selection', icon: Globe },
    { id: 3, name: 'Plan Selection', icon: Star },
    { id: 4, name: 'Payment Setup', icon: CreditCard },
    { id: 5, name: 'Conversion Process', icon: Rocket }
  ]

  const updateData = (data: Partial<ConversionData>) => {
    setConversionData(prev => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getModuleDisplayName = (module: string) => {
    const names: Record<string, string> = {
      furniture: 'Furniture Manufacturing',
      salon: 'Salon & Spa',
      restaurant: 'Restaurant POS',
      crm: 'CRM System'
    }
    return names[module] || module
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep
        const isCompleted = step.id < currentStep
        const Icon = step.icon

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                isActive
                  ? 'border-blue-500 bg-blue-500 text-foreground'
                  : isCompleted
                    ? 'border-green-500 bg-green-500 text-foreground'
                    : 'border-border bg-background text-muted-foreground'
              }
              transition-all duration-300
            `}
            >
              {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
            </div>

            <div className="ml-3 mr-8">
              <div
                className={`text-sm font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                Step {step.id}
              </div>
              <div
                className={`text-xs ${isActive ? 'text-blue-500' : isCompleted ? 'text-green-500' : 'text-muted-foreground'}`}
              >
                {step.name}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'} mr-8`} />
            )}
          </div>
        )
      })}
    </div>
  )

  const renderCompanyDetailsStep = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Company Information
        </CardTitle>
        <p className="text-muted-foreground dark:text-muted-foreground">
          Tell us about your business to set up your production account
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={conversionData.companyName || ''}
              onChange={e => updateData({ companyName: e.target.value })}
              placeholder="Your Company Ltd"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="ownerName">Owner/Manager Name *</Label>
            <Input
              id="ownerName"
              value={conversionData.ownerName || ''}
              onChange={e => updateData({ ownerName: e.target.value })}
              placeholder="John Smith"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="businessEmail">Business Email *</Label>
            <Input
              id="businessEmail"
              type="email"
              value={conversionData.businessEmail || ''}
              onChange={e => updateData({ businessEmail: e.target.value })}
              placeholder="owner@yourcompany.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={conversionData.phone || ''}
              onChange={e => updateData({ phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="employees">Number of Employees</Label>
            <Select onValueChange={value => updateData({ employees: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-5">1-5 employees</SelectItem>
                <SelectItem value="6-15">6-15 employees</SelectItem>
                <SelectItem value="16-50">16-50 employees</SelectItem>
                <SelectItem value="51-100">51-100 employees</SelectItem>
                <SelectItem value="100+">100+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="revenue">Monthly Revenue</Label>
            <Select onValueChange={value => updateData({ monthlyRevenue: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="<10k">Less than $10K</SelectItem>
                <SelectItem value="10k-50k">$10K - $50K</SelectItem>
                <SelectItem value="50k-100k">$50K - $100K</SelectItem>
                <SelectItem value="100k-500k">$100K - $500K</SelectItem>
                <SelectItem value="500k+">$500K+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderSubdomainStep = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Choose Your Subdomain
        </CardTitle>
        <p className="text-muted-foreground dark:text-muted-foreground">
          Your business will be accessible at yourname.heraerp.com
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="subdomain">Subdomain *</Label>
          <div className="flex items-center mt-1">
            <Input
              id="subdomain"
              value={conversionData.subdomain || ''}
              onChange={e =>
                updateData({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
              }
              placeholder="yourcompany"
              className="rounded-r-none"
            />
            <div className="px-3 py-2 bg-muted dark:bg-muted border border-l-0 border-border dark:border-border rounded-r-md text-sm text-muted-foreground">
              .heraerp.com
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Use lowercase letters, numbers, and hyphens only
          </p>
        </div>

        {conversionData.subdomain && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Your Production URL:
            </h4>
            <div className="text-lg font-mono bg-background dark:bg-muted p-3 rounded border">
              https://{conversionData.subdomain}.heraerp.com
            </div>
          </div>
        )}

        <div className="bg-muted dark:bg-background p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Included with your subdomain:
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground dark:text-muted-foreground">
            <li>• Free SSL certificate (HTTPS)</li>
            <li>• Global CDN for fast loading</li>
            <li>• Custom branding and logo</li>
            <li>• Professional email setup available</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )

  const renderPlanSelectionStep = () => (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground dark:text-muted-foreground">
          Select the plan that best fits your {getModuleDisplayName(demoModule)} business needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionPlans.map(plan => (
          <Card
            key={plan.id}
            className={`relative cursor-pointer transition-all duration-200 hover:shadow-xl ${
              conversionData.plan?.type === plan.id
                ? 'border-2 border-blue-500 shadow-lg'
                : 'border border-border dark:border-border'
            }`}
            onClick={() =>
              updateData({
                plan: {
                  type: plan.id,
                  billing: 'monthly',
                  price: plan.monthlyPrice
                }
              })
            }
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-foreground px-4 py-1">Most Popular</Badge>
              </div>
            )}

            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-primary mb-1">
                  ${plan.monthlyPrice}
                  <span className="text-base text-muted-foreground font-normal">/month</span>
                </div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Users
                  </span>
                  <span className="font-medium">{plan.limits.users}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Storage
                  </span>
                  <span className="font-medium">{plan.limits.storage}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    API Calls
                  </span>
                  <span className="font-medium">{plan.limits.apiCalls}</span>
                </div>
              </div>

              <Separator className="mb-4" />

              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground dark:text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderConversionProgressStep = () => {
    const [progress, setProgress] = useState(0)
    const [currentTask, setCurrentTask] = useState('Initializing conversion...')

    const conversionTasks = [
      { name: 'Creating your organization...', duration: 2000 },
      { name: 'Setting up your subdomain...', duration: 3000 },
      { name: 'Migrating your demo data...', duration: 5000 },
      { name: 'Configuring SSL certificate...', duration: 2000 },
      { name: 'Activating your features...', duration: 1000 },
      { name: 'Sending welcome email...', duration: 1000 }
    ]

    useEffect(() => {
      let currentProgress = 0
      let taskIndex = 0

      const runNextTask = () => {
        if (taskIndex < conversionTasks.length) {
          const task = conversionTasks[taskIndex]
          setCurrentTask(task.name)

          const increment = 100 / conversionTasks.length
          const targetProgress = (taskIndex + 1) * increment

          const progressInterval = setInterval(() => {
            currentProgress += 2
            setProgress(Math.min(currentProgress, targetProgress))

            if (currentProgress >= targetProgress) {
              clearInterval(progressInterval)
              taskIndex++

              if (taskIndex < conversionTasks.length) {
                setTimeout(runNextTask, 500)
              } else {
                setCurrentTask('Conversion completed successfully! 🎉')
                setTimeout(() => {
                  onComplete(conversionData)
                }, 2000)
              }
            }
          }, 50)
        }
      }

      runNextTask()
    }, [])

    return (
      <Card className="max-w-2xl mx-auto text-center">
        <CardContent className="p-12">
          <div className="w-24 h-24 mx-auto mb-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

          <h3 className="text-2xl font-bold mb-4">Converting Your Demo to Production</h3>
          <p className="text-muted-foreground dark:text-muted-foreground mb-8">{currentTask}</p>

          <div className="w-full bg-gray-700 dark:bg-muted-foreground/10 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</p>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What's happening:</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 text-left space-y-1">
              <li>• Creating your dedicated production environment</li>
              <li>• Migrating all your demo data safely</li>
              <li>• Setting up SSL security and custom domain</li>
              <li>• Configuring your selected plan features</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderCompanyDetailsStep()
      case 2:
        return renderSubdomainStep()
      case 3:
        return renderPlanSelectionStep()
      case 4:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <CreditCard className="w-16 h-16 mx-auto text-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-4">Payment Setup</h3>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                Payment integration will be configured here.
                <br />
                For now, we'll proceed with the conversion process.
              </p>
            </CardContent>
          </Card>
        )
      case 5:
        return renderConversionProgressStep()
      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          conversionData.companyName && conversionData.ownerName && conversionData.businessEmail
        )
      case 2:
        return conversionData.subdomain && conversionData.subdomain.length >= 3
      case 3:
        return conversionData.plan?.type
      case 4:
        return true // Payment step - always allow proceed for demo
      default:
        return false
    }
  }

  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4">{renderCurrentStep()}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Convert {getModuleDisplayName(demoModule)} to Production
          </h1>
          <p className="text-center text-muted-foreground dark:text-muted-foreground">
            Transform your demo into a fully-featured production system in minutes
          </p>
        </div>

        {renderStepIndicator()}

        <div className="mb-8">{renderCurrentStep()}</div>

        {currentStep < 5 && (
          <div className="flex justify-center gap-4">
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep} className="px-8">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}

            <Button
              onClick={canProceed() ? nextStep : undefined}
              disabled={!canProceed()}
              className="px-8"
            >
              {currentStep === 4 ? 'Start Conversion' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button variant="ghost" onClick={onCancel} className="px-8">
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
