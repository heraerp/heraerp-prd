'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChefHat, 
  TrendingUp, 
  Calculator,
  ArrowRight,
  Sparkles,
  Users,
  Building2
} from 'lucide-react'
import { useAuth } from '@/components/auth/MultiOrgAuthProvider'
import { HeraTypographicLogo } from '@/components/ui/HeraTypographicLogo'

interface DemoOption {
  id: string
  title: string
  subtitle: string
  description: string
  icon: React.ComponentType<any>
  gradient: string
  textColor: string
  features: string[]
  credentials: {
    email: string
    password: string
  }
  route: string
}

const demoOptions: DemoOption[] = [
  {
    id: 'restaurant',
    title: "Mario's Italian Bistro",
    subtitle: 'Restaurant Management',
    description: 'Experience complete restaurant operations from kitchen to customer',
    icon: ChefHat,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    textColor: 'text-amber-900',
    features: [
      'Kitchen Display System',
      'Order Management', 
      'Table Reservations',
      'Menu Engineering',
      'Customer Analytics'
    ],
    credentials: {
      email: 'mario@restaurant.com',
      password: 'securepass123'
    },
    route: '/restaurant'
  },
  {
    id: 'wealth',
    title: 'Wellington Private Wealth',
    subtitle: 'Wealth Management',
    description: 'Sophisticated portfolio management and client relationship tools',
    icon: TrendingUp,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    textColor: 'text-emerald-900',
    features: [
      'Portfolio Analytics',
      'Client Portal',
      'Risk Assessment',
      'Performance Reporting',
      'Compliance Tracking'
    ],
    credentials: {
      email: 'advisor@wellington.com',
      password: 'securepass123'
    },
    route: '/pwp'
  },
  {
    id: 'accounting',
    title: 'Sterling & Associates CPA',
    subtitle: 'Accounting Firm',
    description: 'Professional accounting practice with client management excellence',
    icon: Calculator,
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    textColor: 'text-blue-900',
    features: [
      'Client Management',
      'Tax Preparation',
      'Financial Reporting',
      'Audit Management',
      'Compliance Tools'
    ],
    credentials: {
      email: 'cpa@sterling.com',
      password: 'securepass123'
    },
    route: '/accounting'
  }
]

export default function JobsDemoSelector() {
  const [mounted, setMounted] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const handleDemoSelect = async (demo: DemoOption) => {
    setSelectedDemo(demo.id)
    setIsLoading(true)

    try {
      // Auto-login with demo credentials
      const result = await login(demo.credentials.email, demo.credentials.password)
      
      if (result.success) {
        // Small delay for smooth transition
        setTimeout(() => {
          router.push(demo.route)
        }, 800)
      } else {
        console.error('Demo login failed:', result.error)
        setIsLoading(false)
        setSelectedDemo(null)
      }
    } catch (error) {
      console.error('Demo selection error:', error)
      setIsLoading(false)
      setSelectedDemo(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-12 max-w-3xl">
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <HeraTypographicLogo 
              size="xl" 
              variant="default"
              concept="weight-progression"
              animated={true} 
              className="mb-2" 
            />
            <div className="absolute -inset-6 bg-gradient-to-br from-slate-500/5 via-blue-500/10 to-emerald-500/5 rounded-3xl blur-2xl -z-10" />
          </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          Experience HERA
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed">
          Choose your industry and explore how HERA transforms business operations with our interactive demos
        </p>
      </div>

      {/* Demo Options */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        {demoOptions.map((demo) => {
          const Icon = demo.icon
          const isSelected = selectedDemo === demo.id
          const isCurrentlyLoading = isLoading && isSelected

          return (
            <Card 
              key={demo.id}
              className={`group cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl border-0 overflow-hidden ${
                isSelected ? 'ring-4 ring-blue-500/50 scale-105' : ''
              }`}
              onClick={() => !isLoading && handleDemoSelect(demo)}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${demo.gradient} opacity-0 group-hover:opacity-10 transition-all duration-500`} />
              
              <CardContent className="relative p-8">
                {/* Icon & Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${demo.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium">
                    Live Demo
                  </Badge>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-900 transition-colors">
                    {demo.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">
                    {demo.subtitle}
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    {demo.description}
                  </p>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-2">
                    {demo.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <Button 
                  className={`w-full group/btn relative overflow-hidden bg-gradient-to-r ${demo.gradient} text-white border-0 h-12 text-base font-semibold transition-all duration-300 hover:shadow-lg ${
                    isCurrentlyLoading ? 'cursor-wait' : ''
                  }`}
                  disabled={isLoading}
                >
                  {isCurrentlyLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Launching Demo...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>Launch Demo</span>
                      <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover/btn:translate-x-1" />
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-16 text-center">
        <p className="text-sm text-slate-500 mb-4">
          No registration required • Full feature access • Reset anytime
        </p>
        <div className="flex items-center justify-center space-x-6 text-xs text-slate-400">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            Multi-user simulation
          </div>
          <div className="flex items-center">
            <Building2 className="w-4 h-4 mr-1" />
            Real business scenarios
          </div>
          <div className="flex items-center">
            <Sparkles className="w-4 h-4 mr-1" />
            Live data updates
          </div>
        </div>
      </div>
    </div>
  )
}