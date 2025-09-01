'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// TODO: Re-enable once React 18 onboarding is ready
// import { useOnboarding } from '@/lib/onboarding'
import { 
  PlayCircle, 
  RotateCcw, 
  CheckCircle, 
  Info, 
  Snowflake,
  Factory,
  Package,
  ShoppingCart,
  FlaskConical
} from 'lucide-react'

const tours = [
  {
    code: 'HERA.UI.ONBOARD.ICECREAM.DASHBOARD.v1',
    title: 'Dashboard Tour',
    description: 'Learn about the main dashboard and key metrics',
    icon: Snowflake,
    color: 'from-pink-500 to-purple-500',
    route: '/icecream'
  },
  {
    code: 'HERA.UI.ONBOARD.ICECREAM.PRODUCTION.v1',
    title: 'Production Tour',
    description: 'Explore batch management and production tracking',
    icon: Factory,
    color: 'from-cyan-500 to-blue-500',
    route: '/icecream/production'
  },
  {
    code: 'HERA.UI.ONBOARD.ICECREAM.INVENTORY.v1',
    title: 'Inventory Tour',
    description: 'Manage raw materials and finished products',
    icon: Package,
    color: 'from-green-500 to-emerald-500',
    route: '/icecream/inventory'
  },
  {
    code: 'HERA.UI.ONBOARD.ICECREAM.POS.v1',
    title: 'POS Terminal Tour',
    description: 'Process sales and manage retail operations',
    icon: ShoppingCart,
    color: 'from-yellow-500 to-orange-500',
    route: '/icecream/pos'
  },
  {
    code: 'HERA.UI.ONBOARD.ICECREAM.QUALITY.v1',
    title: 'Quality Control Tour',
    description: 'Ensure product safety and quality standards',
    icon: FlaskConical,
    color: 'from-red-500 to-pink-500',
    route: '/icecream/quality'
  }
]

export default function IceCreamOnboardingDemo() {
  const router = useRouter()
  // TODO: Re-enable once React 18 onboarding is ready
  // const { isActive } = useOnboarding()
  const isActive = false // temporary placeholder

  const startTourAndNavigate = (tourCode: string, route: string) => {
    // Navigate to the page first
    router.push(route)
    
    // The tour will auto-start on that page
    // Clear the completion status to allow restart
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`hera_onboarding_${tourCode}_completed`)
    }
  }

  const resetAllTours = () => {
    if (typeof window !== 'undefined') {
      tours.forEach(tour => {
        localStorage.removeItem(`hera_onboarding_${tour.code}_completed`)
      })
      alert('All tours have been reset. They will auto-start when you visit each page.')
    }
  }

  const isTourCompleted = (tourCode: string) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`hera_onboarding_${tourCode}_completed`) === 'true'
    }
    return false
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-blue-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full">
              <Snowflake className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Ice Cream ERP Onboarding
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Interactive guided tours to help you master the ice cream manufacturing system
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Info className="w-5 h-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• Click any tour below to navigate to that module</li>
              <li>• Tours will automatically start when you visit each page for the first time</li>
              <li>• Use the "Start Tour" button on any page to replay the tour</li>
              <li>• Each tour tracks completion status using HERA's universal transaction system</li>
              <li>• All interactions are logged as Smart Code events for analytics</li>
            </ul>
          </CardContent>
        </Card>

        {/* Tour Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => {
            const completed = isTourCompleted(tour.code)
            
            return (
              <Card 
                key={tour.code}
                className="hover:shadow-xl transition-shadow cursor-pointer backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-pink-200/50 dark:border-pink-800/50"
                onClick={() => startTourAndNavigate(tour.code, tour.route)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 bg-gradient-to-br ${tour.color} rounded-lg`}>
                      <tour.icon className="w-6 h-6 text-white" />
                    </div>
                    {completed && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-4 text-gray-900 dark:text-white">{tour.title}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {tour.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                      {tour.code}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="hover:bg-purple-100 dark:hover:bg-purple-900/30"
                      onClick={(e) => {
                        e.stopPropagation()
                        startTourAndNavigate(tour.code, tour.route)
                      }}
                    >
                      <PlayCircle className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Reset Button */}
        <div className="text-center">
          <Button 
            onClick={resetAllTours}
            variant="outline"
            className="border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All Tours
          </Button>
        </div>

        {/* Smart Code Info */}
        <Card className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-purple-200/50 dark:border-purple-800/50">
          <CardHeader>
            <CardTitle className="text-purple-900 dark:text-purple-100">Universal Transaction Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Every onboarding interaction is tracked using HERA's universal architecture:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-xs space-y-2">
              <div className="text-green-700 dark:text-green-400">
                // Tour Start Event
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                {`{
  transaction: {
    smart_code: "HERA.UI.ONBOARD.ICECREAM.DASHBOARD.v1",
    organization_id: "demo-ice-cream-org",
    event: "tour_start"
  }
}`}
              </div>
              <div className="text-green-700 dark:text-green-400 mt-4">
                // Step Completion Event
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                {`{
  transaction_line: {
    smart_code: "HERA.UI.ONBOARD.ICECREAM.DASHBOARD.STATS.v1",
    status: "completed",
    duration_ms: 3500
  }
}`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}