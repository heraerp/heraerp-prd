'use client'

import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { 
  Scissors, 
  UtensilsCrossed, 
  Users2, 
  Armchair,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import type { Database } from '@/types/hera-database.types'

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
    description: 'Mario\'s Restaurant - Orders, menu management & kitchen display',
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
  const supabase = createClientComponentClient<Database>()
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
        description: `Welcome to ${module.name} demo!`,
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Explore HERA Modules
          </h3>
          <Sparkles className="h-5 w-5 text-blue-500" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Click any module below to instantly experience HERA's industry-specific solutions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEMO_MODULES.map((module) => {
          const Icon = module.icon
          const isLoading = loadingModule === module.id
          
          return (
            <Card
              key={module.id}
              className={`
                relative overflow-hidden cursor-pointer transition-all duration-300
                hover:scale-[1.02] hover:shadow-xl
                ${isLoading ? 'opacity-75' : ''}
              `}
              onClick={() => !loadingModule && handleDemoLogin(module)}
            >
              <div className="p-6">
                {/* Gradient Background */}
                <div 
                  className={`
                    absolute inset-0 opacity-10 dark:opacity-20
                    bg-gradient-to-br ${module.gradient}
                  `} 
                />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className={`
                        p-3 rounded-xl bg-gradient-to-br ${module.gradient}
                        text-white shadow-lg
                      `}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-slate-300 dark:border-slate-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {module.name}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {module.description}
                  </p>
                </div>
              </div>
              
              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-sm font-medium">Logging in...</div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Demo accounts are pre-configured with sample data • No setup required
        </p>
      </div>
    </div>
  )
}