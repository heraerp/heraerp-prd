'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Scissors,
  Heart,
  ShoppingBag,
  Stethoscope,
  Package,
  Gem,
  Utensils,
  Building2,
  Briefcase,
  Plane,
  DollarSign,
  GraduationCap,
  Calculator,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Users,
  Globe,
  Shield,
  Zap,
  AlertCircle,
  Snowflake
} from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import Link from 'next/link'

interface AppCard {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  category: 'industry' | 'universal' | 'ai'
  status: 'production' | 'beta' | 'coming-soon'
  gradient: string
  features: string[]
}

const apps: AppCard[] = [
  // Industry-Specific Apps
  {
    id: 'salon',
    title: 'Salon & Spa',
    description:
      'Complete beauty salon and spa management with appointments, inventory, and client management',
    icon: Scissors,
    href: '/salon',
    category: 'industry',
    status: 'production',
    gradient: 'from-pink-500 to-purple-600',
    features: ['Appointment Booking', 'Client Management', 'Inventory Tracking', 'Staff Management']
  },
  {
    id: 'icecream',
    title: 'Ice Cream Manufacturing',
    description:
      'Production planning, inventory management, and distribution for ice cream manufacturers',
    icon: Snowflake,
    href: '/icecream',
    category: 'industry',
    status: 'production',
    gradient: 'from-cyan-500 to-blue-600',
    features: ['Production Planning', 'Recipe Management', 'Quality Control', 'Distribution']
  },
  {
    id: 'restaurant',
    title: 'Restaurant',
    description:
      'Full-service restaurant management with POS, kitchen display, and inventory control',
    icon: Utensils,
    href: '/restaurant',
    category: 'industry',
    status: 'production',
    gradient: 'from-orange-500 to-red-600',
    features: ['POS System', 'Kitchen Display', 'Table Management', 'Menu Engineering']
  },
  {
    id: 'healthcare',
    title: 'Healthcare',
    description: 'Patient management, appointments, prescriptions, and billing for clinics',
    icon: Stethoscope,
    href: '/healthcare',
    category: 'industry',
    status: 'beta',
    gradient: 'from-green-500 to-emerald-600',
    features: ['Patient Records', 'Appointment Scheduling', 'Prescription Management', 'Billing']
  },
  {
    id: 'retail',
    title: 'Retail',
    description: 'Multi-channel retail management with inventory, POS, and customer loyalty',
    icon: ShoppingBag,
    href: '/retail',
    category: 'industry',
    status: 'coming-soon',
    gradient: 'from-yellow-500 to-orange-600',
    features: [
      'Multi-Store POS',
      'Inventory Management',
      'Customer Loyalty',
      'E-commerce Integration'
    ]
  },
  {
    id: 'jewelry',
    title: 'Jewelry',
    description:
      'Specialized jewelry retail with custom orders, repairs, and precious metal tracking',
    icon: Gem,
    href: '/jewelry',
    category: 'industry',
    status: 'production',
    gradient: 'from-purple-500 to-indigo-600',
    features: ['Custom Orders', 'Repair Tracking', 'Precious Metal Management', 'Certification']
  },

  // Universal Apps
  {
    id: 'financial',
    title: 'Financial Management',
    description: 'Complete financial suite with GL, AR, AP, budgeting, and real-time reporting',
    icon: DollarSign,
    href: '/financial',
    category: 'universal',
    status: 'production',
    gradient: 'from-emerald-500 to-teal-600',
    features: ['General Ledger', 'Accounts Payable/Receivable', 'Budgeting', 'Financial Reporting']
  },
  {
    id: 'crm',
    title: 'CRM & Sales',
    description: 'Customer relationship management with pipeline tracking and sales automation',
    icon: Users,
    href: '/crm',
    category: 'universal',
    status: 'production',
    gradient: 'from-blue-500 to-indigo-600',
    features: ['Contact Management', 'Sales Pipeline', 'Email Integration', 'Analytics']
  },
  {
    id: 'profitability',
    title: 'Profitability & Costing',
    description: 'Advanced cost accounting and profitability analysis across all business units',
    icon: TrendingUp,
    href: '/profitability',
    category: 'universal',
    status: 'production',
    gradient: 'from-indigo-500 to-purple-600',
    features: ['Cost Analysis', 'Margin Tracking', 'Product Profitability', 'Department P&L']
  },

  // AI-Powered Apps
  {
    id: 'digital-accountant',
    title: 'Digital Accountant',
    description:
      'AI-powered accounting assistant for journal entries, reconciliation, and reporting',
    icon: Calculator,
    href: '/digital-accountant',
    category: 'ai',
    status: 'production',
    gradient: 'from-violet-500 to-purple-600',
    features: [
      'Natural Language Processing',
      'Auto Journal Entry',
      'Smart Reconciliation',
      'AI Reports'
    ]
  },
  {
    id: 'auto-journal',
    title: 'Auto-Journal Engine',
    description: 'Intelligent journal automation with 85%+ automation rate and AI classification',
    icon: Zap,
    href: '/auto-journal',
    category: 'ai',
    status: 'production',
    gradient: 'from-amber-500 to-orange-600',
    features: ['Smart Classification', 'Batch Processing', 'Real-time Posting', 'Audit Trail']
  }
]

export default function AppsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, currentOrganization, contextLoading } = useMultiOrgAuth()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'industry' | 'universal' | 'ai'>(
    'all'
  )
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null)

  // Check authentication status
  useEffect(() => {
    // Clear any existing timer
    if (redirectTimer) {
      clearTimeout(redirectTimer)
    }

    // Don't redirect while loading
    if (isLoading || contextLoading) {
      return
    }

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login...')
      // Store the intended destination
      localStorage.setItem('redirectAfterLogin', '/apps')

      // Set a timer to redirect (prevents infinite loops)
      const timer = setTimeout(() => {
        router.push('/auth/login')
      }, 100)

      setRedirectTimer(timer)
    }

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer)
      }
    }
  }, [isAuthenticated, isLoading, contextLoading, router])

  const handleAppClick = (app: AppCard) => {
    if (app.status === 'coming-soon') {
      return
    }

    // If no organization, redirect to create one
    if (!currentOrganization) {
      localStorage.setItem('redirectAfterOrg', app.href)
      router.push('/auth/organizations/new')
    } else {
      router.push(app.href)
    }
  }

  const filteredApps =
    selectedCategory === 'all' ? apps : apps.filter(app => app.category === selectedCategory)

  if (isLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading apps...</p>
        </div>
      </div>
    )
  }

  // If still here but not authenticated, show a message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <p className="text-gray-600">Redirecting to login...</p>
              <Button onClick={() => router.push('/auth/login')} variant="outline">
                Go to Login Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">H</span>
                </div>
                <span className="text-xl font-light">HERA Apps</span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {currentOrganization && (
                <span className="text-sm text-gray-600">{currentOrganization.name}</span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/auth/organizations')}
              >
                Switch Organization
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-4">Choose Your HERA Application</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select an industry-specific solution or universal business application. All apps include
            sample data to help you get started immediately.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center gap-4 mb-12">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className="rounded-full"
          >
            All Apps
          </Button>
          <Button
            variant={selectedCategory === 'industry' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('industry')}
            className="rounded-full"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Industry
          </Button>
          <Button
            variant={selectedCategory === 'universal' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('universal')}
            className="rounded-full"
          >
            <Globe className="w-4 h-4 mr-2" />
            Universal
          </Button>
          <Button
            variant={selectedCategory === 'ai' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('ai')}
            className="rounded-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered
          </Button>
        </div>

        {/* Organization Alert */}
        {!currentOrganization && (
          <Alert className="mb-8 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You'll need to create or select an organization before accessing apps.
              <Link href="/auth/organizations/new" className="ml-2 underline">
                Create Organization
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* App Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {filteredApps.map(app => {
            const Icon = app.icon
            const isDisabled = app.status === 'coming-soon'

            return (
              <Card
                key={app.id}
                className={`relative overflow-hidden transition-all duration-300 ${
                  isDisabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                }`}
                onClick={() => !isDisabled && handleAppClick(app)}
              >
                {/* Status Badge */}
                {app.status !== 'production' && (
                  <div
                    className={`absolute top-4 right-4 px-3 py-1 text-xs font-medium rounded-full ${
                      app.status === 'beta'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {app.status === 'beta' ? 'Beta' : 'Coming Soon'}
                  </div>
                )}

                <CardHeader>
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${app.gradient} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{app.title}</CardTitle>
                  <CardDescription className="text-sm">{app.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 mb-4">
                    {app.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {!isDisabled && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Open App</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
            <Shield className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              All apps include enterprise-grade security and multi-tenant isolation
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
