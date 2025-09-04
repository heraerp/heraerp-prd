'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { JourneyProgressTracker } from '@/components/journey/JourneyProgressTracker'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Rocket,
  Globe,
  Shield,
  Sparkles,
  Zap,
  Cloud,
  Settings,
  CheckCircle,
  ExternalLink,
  Copy,
  Loader2,
  Crown,
  Star,
  Users,
  BarChart,
  CreditCard,
  MessageSquare,
  Calendar,
  Database,
  Lock,
  Server,
  Wifi,
  AlertCircle,
  Info,
  ChevronRight,
  Building2,
  User,
  Mail,
  Key,
  Eye,
  EyeOff
} from 'lucide-react'

interface DeploymentConfig {
  // Subdomain Configuration
  subdomain: string
  customDomain: string
  
  // SSL & Security
  sslEnabled: boolean
  customSSL: boolean
  
  // Admin Account
  adminName: string
  adminEmail: string
  adminPassword: string
  confirmPassword: string
  
  // Organization Settings
  organizationName: string
  organizationCode: string
  
  // Deployment Options
  deploymentType: 'instant' | 'scheduled' | 'custom'
  scheduledTime: string
  
  // Additional Services
  backupEnabled: boolean
  monitoringEnabled: boolean
  supportPlan: 'basic' | 'premium' | 'enterprise'
  
  // Legal & Compliance
  termsAccepted: boolean
  privacyAccepted: boolean
  gdprCompliant: boolean
}

const supportPlans = [
  {
    id: 'basic',
    name: 'Basic Support',
    price: '$0/month',
    features: [
      'Email support',
      'Knowledge base access',
      'Community forum',
      'Standard response time: 24-48 hours'
    ],
    icon: User,
    color: 'from-gray-500 to-slate-600'
  },
  {
    id: 'premium',
    name: 'Premium Support',
    price: '$49/month',
    features: [
      'Priority email & chat support',
      'Phone support (business hours)',
      'Video call assistance',
      'Fast response time: 4-8 hours',
      'Custom training sessions'
    ],
    icon: Star,
    color: 'from-blue-500 to-indigo-600',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise Support',
    price: '$199/month',
    features: [
      'Dedicated account manager',
      '24/7 phone & chat support',
      'Custom development support',
      'Immediate response time: 1-2 hours',
      'On-site training available'
    ],
    icon: Crown,
    color: 'from-purple-500 to-pink-600'
  }
]

export default function DeployPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentProgress, setDeploymentProgress] = useState(0)
  const [isDeployed, setIsDeployed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [config, setConfig] = useState<DeploymentConfig>({
    subdomain: '',
    customDomain: '',
    sslEnabled: true,
    customSSL: false,
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    organizationName: '',
    organizationCode: '',
    deploymentType: 'instant',
    scheduledTime: '',
    backupEnabled: true,
    monitoringEnabled: true,
    supportPlan: 'premium',
    termsAccepted: false,
    privacyAccepted: false,
    gdprCompliant: true
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

  // Auto-generate organization code when name changes
  useEffect(() => {
    if (config.organizationName && !config.organizationCode) {
      const code = config.organizationName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 20)
      setConfig(prev => ({ ...prev, organizationCode: code }))
    }
  }, [config.organizationName])

  // Auto-generate subdomain suggestion
  useEffect(() => {
    if (config.organizationName && !config.subdomain) {
      const suggestion = config.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30)
      setConfig(prev => ({ ...prev, subdomain: suggestion }))
    }
  }, [config.organizationName])

  const steps = [
    { id: 0, name: 'Domain', description: 'Configure your subdomain' },
    { id: 1, name: 'Admin', description: 'Create admin account' },
    { id: 2, name: 'Settings', description: 'Deployment preferences' },
    { id: 3, name: 'Launch', description: 'Deploy your platform' }
  ]

  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null)
      return
    }

    setCheckingSubdomain(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // For demo purposes, make some subdomains "unavailable"
    const unavailable = ['admin', 'api', 'www', 'app', 'test', 'demo', 'staging', 'prod']
    const isAvailable = !unavailable.includes(subdomain.toLowerCase())
    
    setSubdomainAvailable(isAvailable)
    setCheckingSubdomain(false)
  }

  // Debounced subdomain check
  useEffect(() => {
    const timer = setTimeout(() => {
      checkSubdomainAvailability(config.subdomain)
    }, 500)

    return () => clearTimeout(timer)
  }, [config.subdomain])

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return config.subdomain && config.organizationName && subdomainAvailable
      case 1:
        return config.adminName && config.adminEmail && config.adminPassword && 
               config.adminPassword === config.confirmPassword && config.adminPassword.length >= 8
      case 2:
        return config.termsAccepted && config.privacyAccepted
      case 3:
        return true
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

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeploymentProgress(0)
    
    const steps = [
      'Initializing deployment...',
      'Setting up subdomain...',
      'Configuring SSL certificate...',
      'Creating database...',
      'Installing modules...',
      'Setting up admin account...',
      'Configuring organization...',
      'Running final checks...',
      'Deployment complete!'
    ]

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setDeploymentProgress(((i + 1) / steps.length) * 100)
    }

    setIsDeployed(true)
    setIsDeploying(false)
  }

  const generatedUrl = `https://${config.subdomain}.heraerp.com`
  const adminUrl = `${generatedUrl}/admin`

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950/20 relative overflow-hidden"
    >
      {/* WSAG Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[700px] h-[700px] rounded-full transition-all duration-[3000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(16, 185, 129, 0.15) 0%, 
              rgba(16, 185, 129, 0.08) 30%, 
              rgba(16, 185, 129, 0.02) 60%, 
              transparent 100%
            )`,
            filter: 'blur(60px)',
            left: `${mousePosition.x * 0.4 - 15}%`,
            top: `${mousePosition.y * 0.4 - 25}%`,
            transform: `translate(-50%, -50%) scale(${1 + mousePosition.x * 0.002})`
          }}
        />
        
        <div 
          className="absolute w-[500px] h-[500px] rounded-full transition-all duration-[4000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(59, 130, 246, 0.12) 0%, 
              rgba(59, 130, 246, 0.06) 30%, 
              rgba(59, 130, 246, 0.02) 60%, 
              transparent 100%
            )`,
            filter: 'blur(70px)',
            right: `${25 - mousePosition.x * 0.2}%`,
            bottom: `${15 - mousePosition.y * 0.1}%`,
            transform: `translate(50%, 50%) scale(${1 + mousePosition.y * 0.002})`
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <JourneyProgressTracker currentStep={3} />
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
          {!isDeployed ? (
            <>
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
                    0 8px 32px rgba(16, 185, 129, 0.15),
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
                  <Rocket className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium !text-slate-700 dark:!text-slate-200">Deploy & Launch</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  Launch Your HERA Platform
                </h1>
                <p className="text-xl !text-slate-600 dark:!text-slate-300 max-w-2xl mx-auto">
                  Final step! Configure your subdomain and admin account to go live
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
                        index === currentStep ? "bg-green-600 text-white shadow-lg" : 
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
                  {/* Step 0: Domain Configuration */}
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold !text-slate-900 dark:!text-white mb-2">
                          Configure your domain
                        </h2>
                        <p className="!text-slate-600 dark:!text-slate-400">
                          Choose your subdomain and set up your organization
                        </p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="organizationName">Organization Name *</Label>
                          <Input
                            id="organizationName"
                            value={config.organizationName}
                            onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
                            placeholder="e.g., Mario's Restaurant"
                            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subdomain">Subdomain *</Label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                              <Input
                                id="subdomain"
                                value={config.subdomain}
                                onChange={(e) => setConfig({ ...config, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                placeholder="your-business"
                                className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm pr-10"
                              />
                              {checkingSubdomain && (
                                <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-gray-400" />
                              )}
                              {!checkingSubdomain && subdomainAvailable !== null && (
                                <div className="absolute right-3 top-3">
                                  {subdomainAvailable ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-sm !text-slate-600 dark:!text-slate-400 whitespace-nowrap">
                              .heraerp.com
                            </span>
                          </div>
                          {config.subdomain && (
                            <div className="mt-2">
                              {subdomainAvailable === true && (
                                <p className="text-sm text-green-600 flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  {generatedUrl} is available!
                                </p>
                              )}
                              {subdomainAvailable === false && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" />
                                  This subdomain is not available
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="organizationCode">Organization Code</Label>
                          <Input
                            id="organizationCode"
                            value={config.organizationCode}
                            onChange={(e) => setConfig({ ...config, organizationCode: e.target.value.toUpperCase() })}
                            placeholder="AUTO-GENERATED"
                            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                          />
                          <p className="text-xs !text-slate-500 dark:!text-slate-400">
                            Used for internal organization identification
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                          <Input
                            id="customDomain"
                            value={config.customDomain}
                            onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                            placeholder="e.g., app.yourdomain.com"
                            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                          />
                          <p className="text-xs !text-slate-500 dark:!text-slate-400">
                            You can configure a custom domain later in settings
                          </p>
                        </div>

                        {/* Preview Box */}
                        {config.subdomain && subdomainAvailable && (
                          <div 
                            className="p-6 rounded-xl relative overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, 
                                rgba(16, 185, 129, 0.1) 0%, 
                                rgba(59, 130, 246, 0.08) 100%
                              )`,
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                              border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Globe className="w-5 h-5 text-green-600" />
                              <h3 className="font-semibold !text-slate-900 dark:!text-white">
                                Your HERA Platform URLs
                              </h3>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm !text-slate-600 dark:!text-slate-400">Main App:</span>
                                <code className="text-sm bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded">
                                  {generatedUrl}
                                </code>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm !text-slate-600 dark:!text-slate-400">Admin Panel:</span>
                                <code className="text-sm bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded">
                                  {adminUrl}
                                </code>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 1: Admin Account */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold !text-slate-900 dark:!text-white mb-2">
                          Create admin account
                        </h2>
                        <p className="!text-slate-600 dark:!text-slate-400">
                          This will be your main administrator account
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="adminName">Full Name *</Label>
                          <Input
                            id="adminName"
                            value={config.adminName}
                            onChange={(e) => setConfig({ ...config, adminName: e.target.value })}
                            placeholder="e.g., John Smith"
                            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="adminEmail">Email Address *</Label>
                          <Input
                            id="adminEmail"
                            type="email"
                            value={config.adminEmail}
                            onChange={(e) => setConfig({ ...config, adminEmail: e.target.value })}
                            placeholder="e.g., admin@yourbusiness.com"
                            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="adminPassword">Password *</Label>
                          <div className="relative">
                            <Input
                              id="adminPassword"
                              type={showPassword ? "text" : "password"}
                              value={config.adminPassword}
                              onChange={(e) => setConfig({ ...config, adminPassword: e.target.value })}
                              placeholder="Minimum 8 characters"
                              className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {config.adminPassword && config.adminPassword.length < 8 && (
                            <p className="text-sm text-red-600">Password must be at least 8 characters</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={config.confirmPassword}
                              onChange={(e) => setConfig({ ...config, confirmPassword: e.target.value })}
                              placeholder="Re-enter password"
                              className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {config.confirmPassword && config.adminPassword !== config.confirmPassword && (
                            <p className="text-sm text-red-600">Passwords do not match</p>
                          )}
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Security Note:</strong> You'll receive a confirmation email with login instructions once deployment is complete.
                          Make sure to use a strong password and keep your credentials secure.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Step 2: Settings & Legal */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold !text-slate-900 dark:!text-white mb-2">
                          Deployment settings
                        </h2>
                        <p className="!text-slate-600 dark:!text-slate-400">
                          Configure additional services and accept terms
                        </p>
                      </div>

                      <div className="space-y-6">
                        {/* Support Plan Selection */}
                        <div>
                          <h3 className="text-lg font-semibold !text-slate-900 dark:!text-white mb-4">
                            Choose your support plan
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {supportPlans.map((plan) => (
                              <button
                                key={plan.id}
                                onClick={() => setConfig({ ...config, supportPlan: plan.id as any })}
                                className={cn(
                                  "relative p-6 rounded-xl border-2 text-left transition-all duration-300 hover:shadow-lg",
                                  config.supportPlan === plan.id
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                                )}
                              >
                                {plan.popular && (
                                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                                  </div>
                                )}
                                
                                {config.supportPlan === plan.id && (
                                  <div className="absolute top-3 right-3">
                                    <Check className="w-5 h-5 text-blue-600" />
                                  </div>
                                )}
                                
                                <div className={cn(
                                  "w-12 h-12 rounded-xl bg-gradient-to-r mb-4 flex items-center justify-center",
                                  plan.color
                                )}>
                                  <plan.icon className="w-6 h-6 text-white" />
                                </div>
                                
                                <h3 className="font-semibold !text-slate-900 dark:!text-white mb-2">
                                  {plan.name}
                                </h3>
                                <p className="text-2xl font-bold text-blue-600 mb-4">
                                  {plan.price}
                                </p>
                                
                                <ul className="space-y-2">
                                  {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm !text-slate-600 dark:!text-slate-400">
                                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Additional Services */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold !text-slate-900 dark:!text-white">
                            Additional services
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                              <div>
                                <h4 className="font-medium !text-slate-900 dark:!text-white">
                                  Automated Backups
                                </h4>
                                <p className="text-sm !text-slate-600 dark:!text-slate-400">
                                  Daily automated backups with 30-day retention
                                </p>
                              </div>
                              <Switch
                                checked={config.backupEnabled}
                                onCheckedChange={(checked) => setConfig({ ...config, backupEnabled: checked })}
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                              <div>
                                <h4 className="font-medium !text-slate-900 dark:!text-white">
                                  Advanced Monitoring
                                </h4>
                                <p className="text-sm !text-slate-600 dark:!text-slate-400">
                                  Performance monitoring and uptime alerts
                                </p>
                              </div>
                              <Switch
                                checked={config.monitoringEnabled}
                                onCheckedChange={(checked) => setConfig({ ...config, monitoringEnabled: checked })}
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                              <div>
                                <h4 className="font-medium !text-slate-900 dark:!text-white">
                                  GDPR Compliance
                                </h4>
                                <p className="text-sm !text-slate-600 dark:!text-slate-400">
                                  Enhanced privacy controls and data protection
                                </p>
                              </div>
                              <Switch
                                checked={config.gdprCompliant}
                                onCheckedChange={(checked) => setConfig({ ...config, gdprCompliant: checked })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Legal Agreements */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold !text-slate-900 dark:!text-white">
                            Legal agreements
                          </h3>
                          
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                id="terms"
                                checked={config.termsAccepted}
                                onChange={(e) => setConfig({ ...config, termsAccepted: e.target.checked })}
                                className="mt-1"
                              />
                              <Label htmlFor="terms" className="text-sm !text-slate-700 dark:!text-slate-300">
                                I accept the{' '}
                                <Button variant="link" className="p-0 h-auto !text-blue-600 underline">
                                  Terms of Service
                                </Button>{' '}
                                and understand the platform usage policies *
                              </Label>
                            </div>

                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                id="privacy"
                                checked={config.privacyAccepted}
                                onChange={(e) => setConfig({ ...config, privacyAccepted: e.target.checked })}
                                className="mt-1"
                              />
                              <Label htmlFor="privacy" className="text-sm !text-slate-700 dark:!text-slate-300">
                                I have read and accept the{' '}
                                <Button variant="link" className="p-0 h-auto !text-blue-600 underline">
                                  Privacy Policy
                                </Button>{' '}
                                *
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Launch */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold !text-slate-900 dark:!text-white mb-2">
                          Ready to launch!
                        </h2>
                        <p className="!text-slate-600 dark:!text-slate-400">
                          Your HERA platform is configured and ready for deployment
                        </p>
                      </div>

                      {isDeploying ? (
                        <div className="space-y-6">
                          <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                              <Rocket className="w-10 h-10 text-white animate-pulse" />
                            </div>
                            <h3 className="text-xl font-semibold !text-slate-900 dark:!text-white mb-2">
                              Deploying your platform...
                            </h3>
                            <p className="!text-slate-600 dark:!text-slate-400">
                              This usually takes 30-60 seconds
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium !text-slate-700 dark:!text-slate-300">
                                Deployment Progress
                              </span>
                              <span className="text-sm font-medium !text-slate-700 dark:!text-slate-300">
                                {Math.round(deploymentProgress)}%
                              </span>
                            </div>
                            <Progress value={deploymentProgress} className="h-3" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Deployment Summary */}
                          <div 
                            className="p-6 rounded-xl relative overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, 
                                rgba(16, 185, 129, 0.1) 0%, 
                                rgba(59, 130, 246, 0.08) 100%
                              )`,
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                              border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}
                          >
                            <h3 className="font-semibold !text-slate-900 dark:!text-white mb-4">
                              Deployment Summary
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="!text-slate-600 dark:!text-slate-400">Organization:</span>
                                <p className="font-medium !text-slate-900 dark:!text-white">{config.organizationName}</p>
                              </div>
                              <div>
                                <span className="!text-slate-600 dark:!text-slate-400">URL:</span>
                                <p className="font-medium !text-slate-900 dark:!text-white">{generatedUrl}</p>
                              </div>
                              <div>
                                <span className="!text-slate-600 dark:!text-slate-400">Admin:</span>
                                <p className="font-medium !text-slate-900 dark:!text-white">{config.adminName}</p>
                              </div>
                              <div>
                                <span className="!text-slate-600 dark:!text-slate-400">Support:</span>
                                <p className="font-medium !text-slate-900 dark:!text-white">
                                  {supportPlans.find(p => p.id === config.supportPlan)?.name}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* What happens next */}
                          <div className="space-y-4">
                            <h3 className="font-semibold !text-slate-900 dark:!text-white">
                              What happens next:
                            </h3>
                            <div className="space-y-3">
                              {[
                                'Create your dedicated subdomain and SSL certificate',
                                'Initialize your database with the configured features',
                                'Set up your admin account and organization',
                                'Send you login credentials and welcome email',
                                'Your platform will be live and ready to use!'
                              ].map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-green-700 dark:text-green-400">{index + 1}</span>
                                  </div>
                                  <p className="text-sm !text-slate-700 dark:!text-slate-300">{item}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 0 || isDeploying}
                      className="gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>

                    {currentStep < steps.length - 1 ? (
                      <Button
                        onClick={handleNext}
                        disabled={!isStepValid()}
                        className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleDeploy}
                        disabled={isDeploying || !isStepValid()}
                        className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[150px]"
                      >
                        {isDeploying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <Rocket className="w-4 h-4" />
                            Deploy Now
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </>
          ) : (
            /* Success State */
            <div className="text-center space-y-8">
              <div 
                className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
                style={{
                  background: `linear-gradient(135deg, 
                    rgba(16, 185, 129, 0.2) 0%, 
                    rgba(59, 130, 246, 0.15) 100%
                  )`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  🎉 Deployment Successful!
                </h1>
                <p className="text-xl !text-slate-600 dark:!text-slate-300 max-w-2xl mx-auto mb-8">
                  Your HERA platform is now live and ready to use. Welcome to the future of business management!
                </p>
              </div>

              <Card className="max-w-md mx-auto shadow-xl border-0 overflow-hidden backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
                <CardContent className="p-6">
                  <h3 className="font-semibold !text-slate-900 dark:!text-white mb-4">
                    Your Platform Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="!text-slate-600 dark:!text-slate-400">Main URL:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                          {generatedUrl}
                        </code>
                        <Button size="sm" variant="ghost" className="p-1 h-auto">
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="!text-slate-600 dark:!text-slate-400">Admin Panel:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                          {adminUrl}
                        </code>
                        <Button size="sm" variant="ghost" className="p-1 h-auto">
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => window.open(generatedUrl, '_blank')}
                >
                  <ExternalLink className="w-5 h-5" />
                  Open Your Platform
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open(adminUrl, '_blank')}
                >
                  <Settings className="w-5 h-5" />
                  Admin Panel
                </Button>
              </div>

              <p className="text-sm !text-slate-500 dark:!text-slate-400">
                Check your email for login credentials and getting started guide.
              </p>
            </div>
          )}

          {/* Help Section */}
          {!isDeployed && (
            <div className="mt-8 text-center">
              <p className="!text-slate-600 dark:!text-slate-400 mb-2">
                Need help with deployment? Our team is here to assist you.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="link" className="!text-green-600 dark:!text-green-400">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="link" className="!text-green-600 dark:!text-green-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Setup Call
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}