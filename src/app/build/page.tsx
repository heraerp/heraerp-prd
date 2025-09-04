'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { JourneyProgressTracker } from '@/components/journey/JourneyProgressTracker'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  Zap,
  Globe,
  Shield,
  Sparkles,
  Package,
  BarChart,
  CreditCard,
  MessageSquare,
  Calendar,
  Database,
  Cloud,
  Palette,
  Code,
  Loader2,
  ChevronRight,
  Scissors,
  Stethoscope,
  UtensilsCrossed,
  IceCream2,
  Factory,
  Store,
  Briefcase,
  GraduationCap
} from 'lucide-react'

interface BusinessConfig {
  // Basic Information
  businessName: string
  industry: string
  businessType: string
  description: string
  
  // Contact Information
  ownerName: string
  email: string
  phone: string
  country: string
  timezone: string
  
  // Business Details
  employeeCount: string
  monthlyRevenue: string
  currentSoftware: string
  painPoints: string[]
  
  // Feature Selection
  selectedFeatures: string[]
  customFeatures: string
  
  // Technical Preferences
  dataImport: boolean
  integrations: string[]
  customBranding: boolean
  multiLocation: boolean
  
  // Budget
  budget: string
  timeline: string
}

const industries = [
  {
    id: 'salon',
    name: 'Salon & Spa',
    icon: Scissors,
    color: 'from-purple-500 to-pink-600',
    features: ['Appointment Booking', 'Staff Management', 'Inventory', 'Customer Loyalty', 'WhatsApp Integration']
  },
  {
    id: 'restaurant',
    name: 'Restaurant & Cafe',
    icon: UtensilsCrossed,
    color: 'from-orange-500 to-red-600',
    features: ['Table Management', 'Kitchen Display', 'Menu Management', 'Online Ordering', 'Delivery Integration']
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: Stethoscope,
    color: 'from-green-500 to-emerald-600',
    features: ['Patient Records', 'Appointments', 'Prescriptions', 'Insurance Claims', 'Telemedicine']
  },
  {
    id: 'icecream',
    name: 'Ice Cream & Distribution',
    icon: IceCream2,
    color: 'from-blue-500 to-cyan-600',
    features: ['Route Management', 'Multi-location', 'Cold Chain', 'Distribution', 'Fleet Tracking']
  },
  {
    id: 'retail',
    name: 'Retail Store',
    icon: Store,
    color: 'from-amber-500 to-yellow-600',
    features: ['POS System', 'Inventory', 'Customer Management', 'Promotions', 'E-commerce']
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: Factory,
    color: 'from-slate-500 to-zinc-600',
    features: ['Production Planning', 'Quality Control', 'Supply Chain', 'Warehouse', 'Cost Analysis']
  },
  {
    id: 'professional',
    name: 'Professional Services',
    icon: Briefcase,
    color: 'from-indigo-500 to-blue-600',
    features: ['Project Management', 'Time Tracking', 'Billing', 'Client Portal', 'Document Management']
  },
  {
    id: 'education',
    name: 'Education',
    icon: GraduationCap,
    color: 'from-teal-500 to-green-600',
    features: ['Student Management', 'Course Planning', 'Attendance', 'Gradebook', 'Parent Portal']
  }
]

const coreFeatures = [
  { id: 'accounting', name: 'Accounting & Finance', icon: FileText, description: 'Complete GL, AR/AP, Financial Reports' },
  { id: 'inventory', name: 'Inventory Management', icon: Package, description: 'Stock tracking, reorder points, warehouses' },
  { id: 'crm', name: 'Customer Management', icon: Users, description: 'Customer database, loyalty programs' },
  { id: 'pos', name: 'Point of Sale', icon: ShoppingCart, description: 'Sales processing, payment handling' },
  { id: 'analytics', name: 'Analytics & Reports', icon: BarChart, description: 'Real-time dashboards, custom reports' },
  { id: 'hr', name: 'HR & Payroll', icon: Users, description: 'Employee management, payroll processing' },
  { id: 'whatsapp', name: 'WhatsApp Integration', icon: MessageSquare, description: 'Customer communication, bookings' },
  { id: 'calendar', name: 'Scheduling', icon: Calendar, description: 'Appointments, resource planning' }
]

const integrations = [
  { id: 'stripe', name: 'Stripe', icon: CreditCard, category: 'Payments' },
  { id: 'quickbooks', name: 'QuickBooks', icon: FileText, category: 'Accounting' },
  { id: 'google', name: 'Google Workspace', icon: Globe, category: 'Productivity' },
  { id: 'whatsapp', name: 'WhatsApp Business', icon: MessageSquare, category: 'Communication' },
  { id: 'instagram', name: 'Instagram', icon: Package, category: 'Social Media' },
  { id: 'delivery', name: 'Delivery Platforms', icon: ShoppingCart, category: 'Logistics' }
]

export default function BuildPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isValidating, setIsValidating] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [config, setConfig] = useState<BusinessConfig>({
    businessName: '',
    industry: '',
    businessType: '',
    description: '',
    ownerName: '',
    email: '',
    phone: '',
    country: 'AE',
    timezone: 'Asia/Dubai',
    employeeCount: '',
    monthlyRevenue: '',
    currentSoftware: '',
    painPoints: [],
    selectedFeatures: [],
    customFeatures: '',
    dataImport: false,
    integrations: [],
    customBranding: true,
    multiLocation: false,
    budget: '',
    timeline: ''
  })

  // Track mouse movement for glassmorphism effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        })
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      return () => container.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const steps = [
    { id: 0, name: 'Industry', description: 'Select your business type' },
    { id: 1, name: 'Business Info', description: 'Tell us about your business' },
    { id: 2, name: 'Features', description: 'Choose your features' },
    { id: 3, name: 'Technical', description: 'Technical preferences' },
    { id: 4, name: 'Review', description: 'Review and confirm' }
  ]

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return config.industry !== ''
      case 1:
        return config.businessName && config.ownerName && config.email
      case 2:
        return config.selectedFeatures.length > 0
      case 3:
        return true // Technical step is optional
      case 4:
        return true // Review step is always valid
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1 && isStepValid()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleBuild = async () => {
    setIsBuilding(true)
    
    // Simulate building process
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Navigate to deploy page with configuration
    router.push('/deploy')
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950/20 relative overflow-hidden"
    >
      {/* WSAG Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[600px] h-[600px] rounded-full transition-all duration-[3000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(59, 130, 246, 0.15) 0%, 
              rgba(59, 130, 246, 0.08) 30%, 
              rgba(59, 130, 246, 0.02) 60%, 
              transparent 100%
            )`,
            filter: 'blur(60px)',
            left: `${mousePosition.x * 0.5 - 10}%`,
            top: `${mousePosition.y * 0.5 - 20}%`,
            transform: `translate(-50%, -50%) scale(${1 + mousePosition.x * 0.002})`
          }}
        />
        
        <div 
          className="absolute w-[500px] h-[500px] rounded-full transition-all duration-[4000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(139, 92, 246, 0.12) 0%, 
              rgba(139, 92, 246, 0.06) 30%, 
              rgba(139, 92, 246, 0.02) 60%, 
              transparent 100%
            )`,
            filter: 'blur(70px)',
            right: `${30 - mousePosition.x * 0.3}%`,
            bottom: `${20 - mousePosition.y * 0.2}%`,
            transform: `translate(50%, 50%) scale(${1 + mousePosition.y * 0.002})`
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <JourneyProgressTracker currentStep={2} />
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
          {/* Page Title with Glassmorphism */}
          <div 
            className="text-center mb-12 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%, 
                  rgba(255, 255, 255, 0.1) 50%,
                  rgba(255, 255, 255, 0.05) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(59, 130, 246, 0.15),
                0 4px 16px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                inset 0 -1px 0 rgba(255, 255, 255, 0.1)
              `
            }}
          >
            {/* Specular Highlight */}
            <div 
              className="absolute inset-0 opacity-50 transition-all duration-1000 pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                  rgba(255, 255, 255, 0.3) 0%, 
                  rgba(255, 255, 255, 0.1) 20%, 
                  transparent 50%
                )`
              }}
            />
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-full border border-white/20 dark:border-slate-700/50 shadow-lg mb-4">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium !text-slate-700 dark:!text-slate-200">Build Your Business</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
              Configure Your HERA Platform
            </h1>
            <p className="text-xl !text-slate-600 dark:!text-slate-300 max-w-2xl mx-auto">
              Tell us about your business and we'll build a customized solution that fits perfectly
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium !text-slate-700 dark:!text-slate-300">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm font-medium !text-slate-700 dark:!text-slate-300">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
              </span>
            </div>
            <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-center mb-8 gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => index < currentStep && setCurrentStep(index)}
                  disabled={index > currentStep}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300",
                    index === currentStep ? "bg-blue-600 text-white shadow-lg" : 
                    index < currentStep ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50" :
                    "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-current opacity-20 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.name}</span>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card className="shadow-xl border-0 overflow-hidden backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
            <CardContent className="p-8">
              {/* Step 0: Industry Selection */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold !text-slate-900 dark:!text-white mb-2">
                      What type of business do you run?
                    </h2>
                    <p className="!text-slate-600 dark:!text-slate-400">
                      Select your industry to get started with pre-configured features
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {industries.map((industry) => (
                      <button
                        key={industry.id}
                        onClick={() => setConfig({ ...config, industry: industry.id })}
                        className={cn(
                          "relative p-6 rounded-xl border-2 text-left transition-all duration-300 hover:shadow-lg group",
                          config.industry === industry.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                        )}
                      >
                        {config.industry === industry.id && (
                          <div className="absolute top-3 right-3">
                            <Check className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        
                        <div className={cn(
                          "w-12 h-12 rounded-xl bg-gradient-to-r mb-4 flex items-center justify-center",
                          industry.color
                        )}>
                          <industry.icon className="w-6 h-6 text-white" />
                        </div>
                        
                        <h3 className="text-lg font-semibold !text-slate-900 dark:!text-white mb-2">
                          {industry.name}
                        </h3>
                        
                        <div className="space-y-1">
                          {industry.features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm !text-slate-600 dark:!text-slate-400">
                              <Check className="w-3 h-3" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Business Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold !text-slate-900 dark:!text-white mb-2">
                      Tell us about your business
                    </h2>
                    <p className="!text-slate-600 dark:!text-slate-400">
                      This helps us customize HERA specifically for your needs
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        value={config.businessName}
                        onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                        placeholder="e.g., Mario's Restaurant"
                        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Name *</Label>
                      <Input
                        id="ownerName"
                        value={config.ownerName}
                        onChange={(e) => setConfig({ ...config, ownerName: e.target.value })}
                        placeholder="e.g., John Smith"
                        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={config.email}
                        onChange={(e) => setConfig({ ...config, email: e.target.value })}
                        placeholder="e.g., john@business.com"
                        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={config.phone}
                        onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                        placeholder="e.g., +971 50 123 4567"
                        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeCount">Number of Employees</Label>
                      <select
                        id="employeeCount"
                        value={config.employeeCount}
                        onChange={(e) => setConfig({ ...config, employeeCount: e.target.value })}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-2"
                      >
                        <option value="">Select...</option>
                        <option value="1-5">1-5</option>
                        <option value="6-20">6-20</option>
                        <option value="21-50">21-50</option>
                        <option value="51-100">51-100</option>
                        <option value="100+">100+</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlyRevenue">Monthly Revenue (USD)</Label>
                      <select
                        id="monthlyRevenue"
                        value={config.monthlyRevenue}
                        onChange={(e) => setConfig({ ...config, monthlyRevenue: e.target.value })}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-2"
                      >
                        <option value="">Select...</option>
                        <option value="0-10k">$0 - $10,000</option>
                        <option value="10k-50k">$10,000 - $50,000</option>
                        <option value="50k-200k">$50,000 - $200,000</option>
                        <option value="200k-1m">$200,000 - $1M</option>
                        <option value="1m+">$1M+</option>
                      </select>
                    </div>

                    <div className="col-span-full space-y-2">
                      <Label htmlFor="description">Business Description</Label>
                      <Textarea
                        id="description"
                        value={config.description}
                        onChange={(e) => setConfig({ ...config, description: e.target.value })}
                        placeholder="Tell us what makes your business unique..."
                        rows={3}
                        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                      />
                    </div>

                    <div className="col-span-full space-y-2">
                      <Label htmlFor="currentSoftware">Current Software (if any)</Label>
                      <Input
                        id="currentSoftware"
                        value={config.currentSoftware}
                        onChange={(e) => setConfig({ ...config, currentSoftware: e.target.value })}
                        placeholder="e.g., Excel, QuickBooks, Custom POS"
                        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Feature Selection */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold !text-slate-900 dark:!text-white mb-2">
                      Select your features
                    </h2>
                    <p className="!text-slate-600 dark:!text-slate-400">
                      Choose the modules you need for your business
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coreFeatures.map((feature) => (
                      <button
                        key={feature.id}
                        onClick={() => {
                          const selected = config.selectedFeatures.includes(feature.id)
                          setConfig({
                            ...config,
                            selectedFeatures: selected
                              ? config.selectedFeatures.filter(f => f !== feature.id)
                              : [...config.selectedFeatures, feature.id]
                          })
                        }}
                        className={cn(
                          "relative p-4 rounded-xl border-2 text-left transition-all duration-300 hover:shadow-lg group",
                          config.selectedFeatures.includes(feature.id)
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                        )}
                      >
                        {config.selectedFeatures.includes(feature.id) && (
                          <div className="absolute top-3 right-3">
                            <Check className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <feature.icon className="w-5 h-5 text-white" />
                          </div>
                          
                          <div>
                            <h3 className="font-semibold !text-slate-900 dark:!text-white mb-1">
                              {feature.name}
                            </h3>
                            <p className="text-sm !text-slate-600 dark:!text-slate-400">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customFeatures">Additional Features (Optional)</Label>
                    <Textarea
                      id="customFeatures"
                      value={config.customFeatures}
                      onChange={(e) => setConfig({ ...config, customFeatures: e.target.value })}
                      placeholder="Describe any specific features you need that aren't listed above..."
                      rows={3}
                      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Technical Preferences */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold !text-slate-900 dark:!text-white mb-2">
                      Technical preferences
                    </h2>
                    <p className="!text-slate-600 dark:!text-slate-400">
                      Configure integrations and technical settings
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Options */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div>
                          <h3 className="font-medium !text-slate-900 dark:!text-white">
                            Import existing data
                          </h3>
                          <p className="text-sm !text-slate-600 dark:!text-slate-400">
                            We'll help migrate your current data
                          </p>
                        </div>
                        <Switch
                          checked={config.dataImport}
                          onCheckedChange={(checked) => setConfig({ ...config, dataImport: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div>
                          <h3 className="font-medium !text-slate-900 dark:!text-white">
                            Custom branding
                          </h3>
                          <p className="text-sm !text-slate-600 dark:!text-slate-400">
                            Use your logo and brand colors
                          </p>
                        </div>
                        <Switch
                          checked={config.customBranding}
                          onCheckedChange={(checked) => setConfig({ ...config, customBranding: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div>
                          <h3 className="font-medium !text-slate-900 dark:!text-white">
                            Multi-location support
                          </h3>
                          <p className="text-sm !text-slate-600 dark:!text-slate-400">
                            Manage multiple branches or locations
                          </p>
                        </div>
                        <Switch
                          checked={config.multiLocation}
                          onCheckedChange={(checked) => setConfig({ ...config, multiLocation: checked })}
                        />
                      </div>
                    </div>

                    {/* Integrations */}
                    <div>
                      <h3 className="text-lg font-semibold !text-slate-900 dark:!text-white mb-4">
                        Select integrations
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {integrations.map((integration) => (
                          <button
                            key={integration.id}
                            onClick={() => {
                              const selected = config.integrations.includes(integration.id)
                              setConfig({
                                ...config,
                                integrations: selected
                                  ? config.integrations.filter(i => i !== integration.id)
                                  : [...config.integrations, integration.id]
                              })
                            }}
                            className={cn(
                              "p-3 rounded-lg border text-center transition-all duration-300",
                              config.integrations.includes(integration.id)
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                            )}
                          >
                            <integration.icon className="w-6 h-6 mx-auto mb-1" />
                            <p className="text-sm font-medium !text-slate-900 dark:!text-white">
                              {integration.name}
                            </p>
                            <p className="text-xs !text-slate-600 dark:!text-slate-400">
                              {integration.category}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeline & Budget */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="timeline">Implementation Timeline</Label>
                        <select
                          id="timeline"
                          value={config.timeline}
                          onChange={(e) => setConfig({ ...config, timeline: e.target.value })}
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-2"
                        >
                          <option value="">Select...</option>
                          <option value="immediately">Immediately</option>
                          <option value="1-week">Within 1 week</option>
                          <option value="2-weeks">Within 2 weeks</option>
                          <option value="1-month">Within 1 month</option>
                          <option value="flexible">I'm flexible</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="budget">Monthly Budget</Label>
                        <select
                          id="budget"
                          value={config.budget}
                          onChange={(e) => setConfig({ ...config, budget: e.target.value })}
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-2"
                        >
                          <option value="">Select...</option>
                          <option value="0-50">$0 - $50/month</option>
                          <option value="50-200">$50 - $200/month</option>
                          <option value="200-500">$200 - $500/month</option>
                          <option value="500-1000">$500 - $1,000/month</option>
                          <option value="1000+">$1,000+/month</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold !text-slate-900 dark:!text-white mb-2">
                      Review your configuration
                    </h2>
                    <p className="!text-slate-600 dark:!text-slate-400">
                      Everything look good? Let's build your custom HERA platform!
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Business Summary */}
                    <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="font-semibold !text-slate-900 dark:!text-white mb-4">Business Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm !text-slate-600 dark:!text-slate-400">Business Name</p>
                          <p className="font-medium !text-slate-900 dark:!text-white">{config.businessName || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm !text-slate-600 dark:!text-slate-400">Industry</p>
                          <p className="font-medium !text-slate-900 dark:!text-white">
                            {industries.find(i => i.id === config.industry)?.name || 'Not selected'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm !text-slate-600 dark:!text-slate-400">Owner</p>
                          <p className="font-medium !text-slate-900 dark:!text-white">{config.ownerName || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm !text-slate-600 dark:!text-slate-400">Email</p>
                          <p className="font-medium !text-slate-900 dark:!text-white">{config.email || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Selected Features */}
                    <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="font-semibold !text-slate-900 dark:!text-white mb-4">Selected Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {config.selectedFeatures.map((featureId) => {
                          const feature = coreFeatures.find(f => f.id === featureId)
                          return feature ? (
                            <Badge key={featureId} variant="secondary" className="px-3 py-1">
                              <feature.icon className="w-3 h-3 mr-1" />
                              {feature.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>

                    {/* Technical Details */}
                    <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="font-semibold !text-slate-900 dark:!text-white mb-4">Technical Configuration</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="!text-slate-600 dark:!text-slate-400">Data Import</span>
                          <Badge variant={config.dataImport ? "default" : "outline"}>
                            {config.dataImport ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="!text-slate-600 dark:!text-slate-400">Custom Branding</span>
                          <Badge variant={config.customBranding ? "default" : "outline"}>
                            {config.customBranding ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="!text-slate-600 dark:!text-slate-400">Multi-location</span>
                          <Badge variant={config.multiLocation ? "default" : "outline"}>
                            {config.multiLocation ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {config.integrations.length > 0 && (
                          <div>
                            <p className="!text-slate-600 dark:!text-slate-400 mb-2">Integrations:</p>
                            <div className="flex flex-wrap gap-2">
                              {config.integrations.map((intId) => {
                                const integration = integrations.find(i => i.id === intId)
                                return integration ? (
                                  <Badge key={intId} variant="outline" className="px-3 py-1">
                                    {integration.name}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Estimated Stats with Glassmorphism */}
                    <div 
                      className="p-6 rounded-xl relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, 
                          rgba(59, 130, 246, 0.1) 0%, 
                          rgba(139, 92, 246, 0.08) 50%,
                          rgba(59, 130, 246, 0.05) 100%
                        )`,
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}
                    >
                      <h3 className="font-semibold !text-slate-900 dark:!text-white mb-4">
                        Your Custom HERA Platform
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{config.selectedFeatures.length}</p>
                          <p className="text-sm !text-slate-600 dark:!text-slate-400">Modules</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">30 sec</p>
                          <p className="text-sm !text-slate-600 dark:!text-slate-400">Setup Time</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">99.9%</p>
                          <p className="text-sm !text-slate-600 dark:!text-slate-400">Uptime SLA</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-orange-600">24/7</p>
                          <p className="text-sm !text-slate-600 dark:!text-slate-400">Support</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleBuild}
                    disabled={isBuilding}
                    className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[140px]"
                  >
                    {isBuilding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Building...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Build My HERA
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <p className="!text-slate-600 dark:!text-slate-400 mb-2">
              Need help? Our experts are ready to assist you.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="link" className="!text-blue-600 dark:!text-blue-400">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat with Support
              </Button>
              <Button variant="link" className="!text-blue-600 dark:!text-blue-400">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule a Demo
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}