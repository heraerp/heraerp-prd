'use client'

import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { Scissors, UtensilsCrossed, Users2, Armchair, ArrowRight, Sparkles } from 'lucide-react'

interface DemoModule {
  id: string
  name: string
  description: string
  icon: any
  gradient: string
  route: string
  credentials: {
    email: string
    password: string
  }
}

const DEMO_MODULES: DemoModule[] = [
  {
    id: 'furniture',
    name: 'Furniture Manufacturing',
    description: 'Kerala Furniture Works - Tender management, inventory & production',
    icon: Armchair,
    gradient: 'from-amber-500 to-orange-600',
    route: '/furniture',
    credentials: {
      email: 'demo@keralafurniture.com',
      password: 'FurnitureDemo2025!'
    }
  },
  {
    id: 'salon',
    name: 'Salon & Spa',
    description: 'Hair Talkz - Appointment booking, staff & client management',
    icon: Scissors,
    gradient: 'from-purple-500 to-pink-600',
    route: '/salon',
    credentials: {
      email: 'demo@hairtalkz.com',
      password: 'SalonDemo2025!'
    }
  },
  {
    id: 'restaurant',
    name: 'Restaurant POS',
    description: "Mario's Restaurant - Orders, menu management & kitchen display",
    icon: UtensilsCrossed,
    gradient: 'from-green-500 to-emerald-600',
    route: '/restaurant',
    credentials: {
      email: 'demo@mariosrestaurant.com',
      password: 'RestaurantDemo2025!'
    }
  },
  {
    id: 'crm',
    name: 'CRM System',
    description: 'TechVantage CRM - Lead tracking, pipeline & sales analytics',
    icon: Users2,
    gradient: 'from-blue-500 to-cyan-600',
    route: '/crm',
    credentials: {
      email: 'demo@techvantage.com',
      password: 'CRMDemo2025!'
    }
  }
]

export function DemoModuleSelector() {
  const router = useRouter()
  const { toast } = useToast()
  const [loadingModule, setLoadingModule] = useState<string | null>(null)

  const handleDemoLogin = async (module: DemoModule) => {
    setLoadingModule(module.id)

    try {
      // Sign out first
      await supabase.auth.signOut()

      // Sign in with module-specific credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: module.credentials.email,
        password: module.credentials.password
      })

      if (error) {
        throw error
      }

      // Store module info for redirect
      sessionStorage.setItem('isDemoLogin', 'true')
      sessionStorage.setItem('demoModule', module.id)

      toast({
        title: 'Login Successful',
        description: `Welcome to ${module.name} demo!`
      })

      // Redirect to module
      setTimeout(() => {
        window.location.href = module.route
      }, 500)
    } catch (error: any) {
      console.error('Demo login error:', error)
      toast({
        title: 'Login Failed',
        description: error.message || 'Could not access demo module',
        variant: 'destructive'
      })
      setLoadingModule(null)
    }
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DEMO_MODULES.map(module => {
          const Icon = module.icon
          const isLoading = loadingModule === module.id

          return (
            <div key={module.id} className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-r ${module.gradient} opacity-10 rounded-2xl blur-xl group-hover:opacity-20 transition-all`} />
              <Card
                className={`relative card-glass border border-border hover:border-indigo-500/30 cursor-pointer transition-all ${isLoading ? 'opacity-75' : ''}`}
                onClick={() => !loadingModule && handleDemoLogin(module)}
              >
                <div className="p-6">
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${module.gradient} text-white shadow-lg flex-shrink-0`}>
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold ink text-base">
                          {module.name}
                        </h4>
                        <p className="text-sm ink-muted mt-0.5 line-clamp-2">
                          {module.description}
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        {isLoading ? (
                          <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ArrowRight className="h-5 w-5 ink-muted group-hover:text-indigo-400 transition-colors" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <div className="text-sm font-medium text-indigo-400">
                      Logging in...
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs ink-muted">
          Demo accounts are pre-configured with sample data
        </p>
        <p className="text-xs ink-muted mt-1">
          No credit card required
        </p>
      </div>
    </div>
  )
}
