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
  Snowflake,
  Loader2,
  Lock,
  LogOut
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

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
  const { isAuthenticated, isLoading, currentOrganization, contextLoading, logout, user } = useHERAAuth()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'industry' | 'universal' | 'ai'>(
    'all'
  )
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null)
  const [userApps, setUserApps] = useState<AppCard[]>([])
  const [loadingApps, setLoadingApps] = useState(true)

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

  // Fetch user's installed apps
  useEffect(() => {
    async function fetchUserApps() {
      if (!isAuthenticated || !currentOrganization) {
        setLoadingApps(false)
        return
      }

      try {
        // TODO: Fetch from API /api/v2/apps/installed
        // For now, show salon app as default for all users
        // This will be replaced with actual API call
        const installedApps = apps.filter(app => app.id === 'salon')
        setUserApps(installedApps)
      } catch (error) {
        console.error('Failed to fetch user apps:', error)
        // Fallback to showing all apps
        setUserApps(apps)
      } finally {
        setLoadingApps(false)
      }
    }

    fetchUserApps()
  }, [isAuthenticated, currentOrganization])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

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

  // Use userApps if loaded, otherwise show all apps
  const appsToDisplay = loadingApps ? [] : (userApps.length > 0 ? userApps : apps)
  const filteredApps =
    selectedCategory === 'all' ? appsToDisplay : appsToDisplay.filter(app => app.category === selectedCategory)

  if (isLoading || contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 relative">
        {/* Force full viewport background */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 -z-20" />

        {/* Animated background gradients */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        </div>

        <div className="relative z-10">
          <Navbar />
        </div>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 card-glass backdrop-blur-xl rounded-2xl mb-4 shadow-xl border border-border">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
            </div>
            <p className="text-slate-300">Loading your apps...</p>
          </div>
        </div>
        <div className="relative z-10">
          <Footer showGradient={false} />
        </div>
      </div>
    )
  }

  // If still here but not authenticated, show a message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 relative flex items-center justify-center">
        {/* Force full viewport background */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 -z-20" />

        <div className="relative z-10">
          <Navbar />
        </div>
        <Card className="relative z-10 w-full max-w-md card-glass backdrop-blur-xl border border-border">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <Lock className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <p className="text-slate-300">Redirecting to login...</p>
              <Button
                onClick={() => router.push('/auth/login')}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                Go to Login Now
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="relative z-10">
          <Footer showGradient={false} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 w-full relative overflow-auto">
      {/* Force full viewport background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 -z-20" />

      {/* Animated background gradients - matching login page */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Large floating gradient orbs */}
        <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/15 to-cyan-400/10 rounded-full blur-3xl animate-float-glow" />
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-gradient-to-br from-purple-500/15 to-pink-400/10 rounded-full blur-3xl animate-float-glow animation-delay-2000" />
        <div className="absolute top-1/3 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/15 to-violet-400/10 rounded-full blur-3xl animate-pulse-glow animation-delay-4000" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-rose-500/15 to-amber-400/10 rounded-full blur-3xl animate-pulse-glow animation-delay-1000" />
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-cyan-500/15 to-emerald-400/10 rounded-full blur-3xl animate-float-glow animation-delay-3000" />
        <div className="absolute -bottom-40 right-1/4 w-[700px] h-[700px] bg-gradient-to-br from-violet-500/15 to-purple-400/10 rounded-full blur-3xl animate-float-glow animation-delay-5000" />

        {/* Subtle animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/8 to-pink-500/8 animate-gradient-shift" />
      </div>

      {/* Header */}
      <div className="relative z-10">
        <Navbar />
      </div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12 min-h-screen">
        {/* Page Title with Badge and Logout */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 backdrop-blur-sm shadow-lg">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-300 text-sm font-semibold tracking-wide">
                {currentOrganization ? currentOrganization.name : 'HERA Platform'}
              </span>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="rounded-full card-glass border-border text-slate-300 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Choose Your </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Application
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Select an industry-specific solution or universal business application. All apps include
            sample data to help you get started immediately.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center flex-wrap gap-4 mb-12">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-indigo-500/20'
                : 'card-glass border-border text-slate-300 hover:border-indigo-500/30 hover:text-white'
            }`}
          >
            All Apps
          </Button>
          <Button
            variant={selectedCategory === 'industry' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('industry')}
            className={`rounded-full ${
              selectedCategory === 'industry'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-indigo-500/20'
                : 'card-glass border-border text-slate-300 hover:border-indigo-500/30 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Industry
          </Button>
          <Button
            variant={selectedCategory === 'universal' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('universal')}
            className={`rounded-full ${
              selectedCategory === 'universal'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-indigo-500/20'
                : 'card-glass border-border text-slate-300 hover:border-indigo-500/30 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 mr-2" />
            Universal
          </Button>
          <Button
            variant={selectedCategory === 'ai' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('ai')}
            className={`rounded-full ${
              selectedCategory === 'ai'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-indigo-500/20'
                : 'card-glass border-border text-slate-300 hover:border-indigo-500/30 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered
          </Button>
        </div>

        {/* Organization Alert */}
        {!currentOrganization && (
          <Alert className="mb-8 max-w-2xl mx-auto card-glass border-amber-500/30 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-slate-300">
              You'll need to create or select an organization before accessing apps.
              <Link href="/auth/organizations/new" className="ml-2 text-indigo-400 hover:text-indigo-300 font-medium underline">
                Create Organization
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* App Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredApps.map(app => {
            const Icon = app.icon
            const isDisabled = app.status === 'coming-soon'

            return (
              <div
                key={app.id}
                className={`relative group ${!isDisabled && 'cursor-pointer'}`}
                onClick={() => !isDisabled && handleAppClick(app)}
              >
                {/* Hover glow effect */}
                {!isDisabled && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 rounded-2xl blur-xl transition-all" />
                )}

                <Card
                  className={`relative overflow-hidden transition-all duration-300 card-glass backdrop-blur-xl border border-border ${
                    isDisabled
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:border-indigo-500/30 hover:shadow-2xl hover:-translate-y-1'
                  }`}
                >
                  {/* Status Badge */}
                  {app.status !== 'production' && (
                    <div
                      className={`absolute top-4 right-4 px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
                        app.status === 'beta'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                      }`}
                    >
                      {app.status === 'beta' ? 'Beta' : 'Coming Soon'}
                    </div>
                  )}

                  <CardHeader>
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl text-white">{app.title}</CardTitle>
                    <CardDescription className="text-sm text-slate-300">{app.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {app.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-slate-300"
                        >
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {!isDisabled && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-medium text-indigo-400">Open App</span>
                        <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 card-glass rounded-full border border-border backdrop-blur-sm">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">
              All apps include enterprise-grade security and multi-tenant isolation
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <Footer showGradient={false} />
      </div>
    </div>
  )
}
