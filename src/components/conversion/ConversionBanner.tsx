'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Rocket,
  TrendingUp,
  Users,
  Database,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle
} from 'lucide-react'

interface ConversionMetrics {
  sessionDuration: string
  featuresUsed: string[]
  dataCreated: number
  returnVisits: number
  conversionReadiness: 'low' | 'medium' | 'high'
}

interface ConversionBannerProps {
  demoModule: string
  metrics: ConversionMetrics
  onConvert: () => void
}

export function ConversionBanner({ demoModule, metrics, onConvert }: ConversionBannerProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getReadinessColor = (readiness: string) => {
    switch (readiness) {
      case 'high':
        return 'bg-green-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
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

  return (
    <Card
      className="relative overflow-hidden border-2 border-gradient-to-r from-emerald-200 to-blue-200 dark:from-emerald-800 dark:to-blue-800 shadow-xl mb-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 dark:from-emerald-500/20 dark:via-blue-500/20 dark:to-purple-500/20" />

      {/* Sparkle Animation */}
      <div className="absolute top-4 right-4 opacity-60">
        <Sparkles
          className={`w-6 h-6 text-emerald-500 transition-transform duration-500 ${isHovered ?'rotate-180 scale-110' : ''}`}
        />
      </div>

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl text-foreground shadow-lg">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-100 dark:text-foreground">
                Ready to Go Live? 🚀
              </h3>
              <p className="text-muted-foreground dark:text-gray-300 mt-1">
                Transform your {getModuleDisplayName(demoModule)} demo into a production system
              </p>
            </div>
          </div>

          <Badge
            className={`${getReadinessColor(metrics.conversionReadiness)} text-foreground px-3 py-1`}
          >
            {metrics.conversionReadiness.toUpperCase()} READINESS
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-background/50 dark:bg-muted/50 rounded-lg backdrop-blur-sm">
            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-100 dark:text-foreground">
              {metrics.sessionDuration}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">
              Time Spent
            </div>
          </div>

          <div className="text-center p-3 bg-background/50 dark:bg-muted/50 rounded-lg backdrop-blur-sm">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-100 dark:text-foreground">
              {metrics.featuresUsed.length}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">
              Features Explored
            </div>
          </div>

          <div className="text-center p-3 bg-background/50 dark:bg-muted/50 rounded-lg backdrop-blur-sm">
            <Database className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-100 dark:text-foreground">
              {metrics.dataCreated}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">
              Records Created
            </div>
          </div>

          <div className="text-center p-3 bg-background/50 dark:bg-muted/50 rounded-lg backdrop-blur-sm">
            <TrendingUp className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-100 dark:text-foreground">
              {metrics.returnVisits}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">
              Return Visits
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/30 dark:to-blue-900/30 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-100 dark:text-foreground mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            What You Get with Production Conversion:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 ink dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Your custom subdomain (e.g., yourcompany.heraerp.com)
            </div>
            <div className="flex items-center gap-2 ink dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Fresh production setup with industry templates
            </div>
            <div className="flex items-center gap-2 ink dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Multi-user access with role management
            </div>
            <div className="flex items-center gap-2 ink dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500" />
              API access & third-party integrations
            </div>
            <div className="flex items-center gap-2 ink dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Advanced reporting & analytics
            </div>
            <div className="flex items-center gap-2 ink dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Priority support & onboarding
            </div>
          </div>
        </div>

        {/* Conversion CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground dark:text-muted-foreground text-sm">
              <strong>{metrics.featuresUsed.length} features</strong> explored in demo •
              <strong>Fresh production</strong> environment •<strong> Zero downtime</strong>{' '}
              conversion
            </p>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
              Conversion takes ~3 minutes • 30-day money-back guarantee
            </p>
          </div>

          <Button
            onClick={onConvert}
            size="lg"
            className={`bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-foreground font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 ${isHovered ?'scale-105' : ''}
            `}
          >
            Convert to Production
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Animated Border Glow */}
      <div className="absolute inset-0 rounded-lg opacity-60">
        <div
          className={`absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 transition-opacity duration-300 ${isHovered ?'animate-pulse' : ''}`}
          style={{
            background: 'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'exclude'
          }}
        />
      </div>
    </Card>
  )
}

// Usage Example Component
export function ConversionBannerExample() {
  const sampleMetrics: ConversionMetrics = {
    sessionDuration: '45 minutes',
    featuresUsed: ['orders', 'inventory', 'reports', 'customers'],
    dataCreated: 15,
    returnVisits: 3,
    conversionReadiness: 'high'
  }

  const handleConversion = () => {
    // Trigger SaaS conversion wizard
    console.log('Starting SaaS conversion process...')
  }

  return (
    <ConversionBanner demoModule="furniture" metrics={sampleMetrics} onConvert={handleConversion} />
  )
}
