'use client'

/**
 * HERA Discover Page - Explore Live Demos
 * Smart Code: HERA.UI.JOURNEY.DISCOVER.PAGE.v1
 * 
 * First step in the HERA journey - showcase live business demos
 */

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JourneyProgressTracker } from '@/components/journey/JourneyProgressTracker'
import { cn } from '@/lib/utils'
import {
  Scissors,
  Utensils,
  Heart,
  ShoppingBag,
  Briefcase,
  Building2,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  ExternalLink,
  Play,
  ArrowRight,
  Sparkles,
  Star,
  ChevronRight,
  Globe,
  Zap
} from 'lucide-react'

interface IndustryDemo {
  id: string
  name: string
  description: string
  icon: React.ElementType
  gradient: string
  demoUrl: string
  metrics: {
    setupTime: string
    costSavings: string
    features: number
    satisfaction: string
  }
  testimonial: {
    quote: string
    author: string
    role: string
  }
  liveBusinesses: string[]
  popularFeatures: string[]
}

export default function DiscoverPage() {
  const router = useRouter()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const industries: IndustryDemo[] = [
    {
      id: 'salon',
      name: 'Beauty & Wellness',
      description: 'Complete salon management with appointments, staff scheduling, and inventory',
      icon: Scissors,
      gradient: 'from-pink-500 to-purple-600',
      demoUrl: '/salon-data',
      metrics: {
        setupTime: '30 seconds',
        costSavings: '$48,000/year',
        features: 45,
        satisfaction: '98%'
      },
      testimonial: {
        quote: "HERA transformed our salon operations. We went from chaos to complete control in just minutes!",
        author: "Sarah Johnson",
        role: "Owner, Hair Talkz Dubai"
      },
      liveBusinesses: ['Hair Talkz', 'Glow Spa', 'Beauty Palace'],
      popularFeatures: ['WhatsApp Booking', 'Staff Commission', 'Inventory Tracking', 'Client Management']
    },
    {
      id: 'restaurant',
      name: 'Restaurant & Cafe',
      description: 'Full restaurant POS with kitchen management, delivery tracking, and analytics',
      icon: Utensils,
      gradient: 'from-orange-500 to-red-600',
      demoUrl: '/restaurant-demo',
      metrics: {
        setupTime: '45 seconds',
        costSavings: '$65,000/year',
        features: 52,
        satisfaction: '97%'
      },
      testimonial: {
        quote: "From order to accounting, HERA handles everything. It's like having a full IT team built-in.",
        author: "Mario Rossi",
        role: "Owner, Mario's Authentic Italian"
      },
      liveBusinesses: ["Mario's Restaurant", 'Tasty Bites', 'Coffee Hub'],
      popularFeatures: ['Table Management', 'Kitchen Display', 'Delivery Integration', 'Recipe Costing']
    },
    {
      id: 'healthcare',
      name: 'Healthcare & Clinics',
      description: 'Patient management, appointments, prescriptions, and medical records',
      icon: Heart,
      gradient: 'from-blue-500 to-cyan-600',
      demoUrl: '/healthcare-demo',
      metrics: {
        setupTime: '60 seconds',
        costSavings: '$120,000/year',
        features: 68,
        satisfaction: '99%'
      },
      testimonial: {
        quote: "HIPAA compliant, feature-rich, and incredibly easy to use. HERA is a game-changer for clinics.",
        author: "Dr. Emily Chen",
        role: "Medical Director, Family Care Clinic"
      },
      liveBusinesses: ['Family Care Clinic', 'Dental Plus', 'MedCare Center'],
      popularFeatures: ['Electronic Medical Records', 'Prescription Management', 'Lab Integration', 'Insurance Claims']
    },
    {
      id: 'retail',
      name: 'Retail & E-commerce',
      description: 'Inventory management, POS, online store integration, and customer loyalty',
      icon: ShoppingBag,
      gradient: 'from-emerald-500 to-green-600',
      demoUrl: '/retail-demo',
      metrics: {
        setupTime: '40 seconds',
        costSavings: '$55,000/year',
        features: 48,
        satisfaction: '96%'
      },
      testimonial: {
        quote: "Our inventory accuracy went from 70% to 99%. HERA pays for itself in reduced shrinkage alone.",
        author: "Michael Torres",
        role: "Operations Manager, Fashion Forward"
      },
      liveBusinesses: ['Fashion Forward', 'Tech Store Pro', 'Home Essentials'],
      popularFeatures: ['Barcode Scanning', 'Multi-location Inventory', 'Customer Rewards', 'Omnichannel Sales']
    }
  ]

  const stats = [
    { label: 'Active Businesses', value: '2,847+', icon: Building2 },
    { label: 'Average Setup Time', value: '42 sec', icon: Clock },
    { label: 'Cost Savings', value: '92%', icon: TrendingUp },
    { label: 'User Satisfaction', value: '98%', icon: Star }
  ]

  const handleDemoClick = (industry: IndustryDemo) => {
    if (industry.demoUrl === '/salon-data') {
      // Salon demo is ready
      window.open(industry.demoUrl, '_blank')
    } else {
      // Other demos show coming soon
      setSelectedIndustry(industry.id)
    }
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(255, 255, 255, 0.05) 25%,
            rgba(147, 51, 234, 0.02) 50%,
            rgba(236, 72, 153, 0.02) 75%,
            rgba(255, 255, 255, 0.1) 100%
          ),
          radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(147, 51, 234, 0.15) 0%, 
            rgba(236, 72, 153, 0.1) 25%,
            rgba(59, 130, 246, 0.05) 50%,
            transparent 70%
          ),
          linear-gradient(45deg, #f8fafc 0%, #e2e8f0 100%)
        `
      }}
    >
      {/* WSAG Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-96 h-96 rounded-full transition-all duration-[3000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(147, 51, 234, 0.4) 0%, 
              rgba(147, 51, 234, 0.2) 30%, 
              rgba(147, 51, 234, 0.05) 60%, 
              transparent 100%
            )`,
            filter: 'blur(40px)',
            left: `${20 + mousePosition.x * 0.1}%`,
            top: `${10 + mousePosition.y * 0.05}%`,
            transform: `translate(-50%, -50%) scale(${1 + mousePosition.x * 0.002})`
          }}
        />
        
        <div 
          className="absolute w-80 h-80 rounded-full transition-all duration-[4000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(236, 72, 153, 0.3) 0%, 
              rgba(236, 72, 153, 0.15) 30%, 
              rgba(236, 72, 153, 0.03) 60%, 
              transparent 100%
            )`,
            filter: 'blur(50px)',
            right: `${15 + mousePosition.x * 0.08}%`,
            top: `${60 + mousePosition.y * 0.03}%`,
            transform: `translate(50%, -50%) scale(${1 + mousePosition.y * 0.002})`
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header 
          className="sticky top-0 z-50 border-b shadow-lg"
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
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            boxShadow: `
              0 8px 32px rgba(147, 51, 234, 0.15),
              0 4px 16px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              inset 0 -1px 0 rgba(255, 255, 255, 0.1)
            `
          }}
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transform transition-all duration-300"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(147, 51, 234, 0.3) 0%, 
                        rgba(236, 72, 153, 0.2) 100%
                      )
                    `,
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: `
                      0 8px 32px rgba(147, 51, 234, 0.3),
                      0 4px 16px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.4)
                    `
                  }}
                >
                  <Sparkles className="w-5 h-5 text-white drop-shadow-md" />
                </div>
                <div>
                  <h1 className="text-xl font-bold !text-gray-900 dark:!text-white">HERA</h1>
                  <p className="text-xs !text-gray-600 dark:!text-gray-300 font-medium">Discover Live Demos</p>
                </div>
              </Link>

              <Button
                onClick={() => router.push('/validate')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
              >
                Continue to Validate
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </header>

        {/* Journey Progress */}
        <JourneyProgressTracker currentStep="discover" />

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold !text-gray-900 dark:!text-white mb-4">
              See HERA in Action
            </h2>
            <p className="text-lg !text-gray-700 dark:!text-gray-300 max-w-3xl mx-auto">
              Explore real businesses powered by HERA. Click any industry below to experience 
              a live demo with actual data, features, and workflows.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-6xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-xl p-6 text-center group transition-all duration-700 hover:-translate-y-2"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.22) 0%, 
                      rgba(255, 255, 255, 0.08) 100%
                    )
                  `,
                  backdropFilter: 'blur(18px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(160%)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: `
                    0 6px 24px rgba(147, 51, 234, 0.15),
                    0 2px 12px rgba(0, 0, 0, 0.08),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3)
                  `
                }}
              >
                <div 
                  className="absolute inset-0 transition-all duration-1000 opacity-60 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                      rgba(255, 255, 255, 0.4) 0%, 
                      rgba(255, 255, 255, 0.1) 30%, 
                      transparent 70%
                    )`,
                    pointerEvents: 'none',
                    borderRadius: 'inherit'
                  }}
                />
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold !text-gray-900 dark:!text-white">{stat.value}</p>
                <p className="text-sm !text-gray-700 dark:!text-gray-300">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Industry Demos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {industries.map((industry) => (
              <Card
                key={industry.id}
                className="relative overflow-hidden group transition-all duration-700 hover:-translate-y-2 cursor-pointer"
                onClick={() => handleDemoClick(industry)}
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.18) 0%, 
                      rgba(255, 255, 255, 0.05) 100%
                    )
                  `,
                  backdropFilter: 'blur(30px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: `
                    0 12px 40px rgba(0, 0, 0, 0.08),
                    0 4px 20px rgba(0, 0, 0, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.35)
                  `
                }}
              >
                {/* Specular Highlight */}
                <div 
                  className="absolute inset-0 transition-all duration-1000 opacity-0 group-hover:opacity-60"
                  style={{
                    background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                      rgba(255, 255, 255, 0.5) 0%, 
                      rgba(255, 255, 255, 0.1) 30%, 
                      transparent 70%
                    )`,
                    pointerEvents: 'none'
                  }}
                />

                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center shadow-lg",
                        industry.gradient
                      )}>
                        <industry.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl !text-gray-900 dark:!text-white">
                          {industry.name}
                        </CardTitle>
                        <p className="text-sm !text-gray-600 dark:!text-gray-400">
                          {industry.liveBusinesses.length} live businesses
                        </p>
                      </div>
                    </div>
                    {industry.id === 'salon' ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Live Demo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Coming Soon</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  <p className="!text-gray-700 dark:!text-gray-300 mb-4">
                    {industry.description}
                  </p>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-2xl font-bold !text-purple-600">{industry.metrics.setupTime}</p>
                      <p className="text-xs !text-gray-600 dark:!text-gray-400">Setup Time</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold !text-green-600">{industry.metrics.costSavings}</p>
                      <p className="text-xs !text-gray-600 dark:!text-gray-400">Cost Savings</p>
                    </div>
                  </div>

                  {/* Popular Features */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold !text-gray-900 dark:!text-white mb-2">
                      Popular Features:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {industry.popularFeatures.slice(0, 3).map((feature, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs border-gray-300 !text-gray-700 dark:border-gray-600 dark:!text-gray-300"
                        >
                          {feature}
                        </Badge>
                      ))}
                      <Badge
                        variant="outline"
                        className="text-xs border-gray-300 !text-gray-700 dark:border-gray-600 dark:!text-gray-300"
                      >
                        +{industry.metrics.features - 3} more
                      </Badge>
                    </div>
                  </div>

                  {/* Testimonial */}
                  <div className="border-t pt-4">
                    <p className="text-sm italic !text-gray-600 dark:!text-gray-400 mb-2">
                      "{industry.testimonial.quote}"
                    </p>
                    <p className="text-xs !text-gray-700 dark:!text-gray-300">
                      — {industry.testimonial.author}, <span className="!text-gray-600 dark:!text-gray-400">{industry.testimonial.role}</span>
                    </p>
                  </div>

                  {/* CTA */}
                  <Button
                    className={cn(
                      "w-full mt-4 group",
                      industry.id === 'salon' 
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    )}
                    disabled={industry.id !== 'salon'}
                  >
                    {industry.id === 'salon' ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Try Live Demo
                        <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    ) : (
                      'Coming Soon'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Industry Modal */}
          {selectedIndustry && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedIndustry(null)}
            >
              <div 
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-2">Coming Soon!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The {industries.find(i => i.id === selectedIndustry)?.name} demo is being prepared. 
                  Try our Beauty & Wellness demo for now!
                </p>
                <Button 
                  className="w-full"
                  onClick={() => setSelectedIndustry(null)}
                >
                  Got it
                </Button>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="mt-16 text-center">
            <div 
              className="inline-block p-8 rounded-2xl"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.15) 0%, 
                    rgba(255, 255, 255, 0.05) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(150%)',
                WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: `
                  0 10px 35px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3)
                `
              }}
            >
              <Zap className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-2xl font-bold !text-gray-900 dark:!text-white mb-2">
                Ready to validate?
              </h3>
              <p className="!text-gray-700 dark:!text-gray-300 mb-6 max-w-md">
                After exploring our demos, check if HERA fits your specific business needs 
                with our interactive validation tools.
              </p>
              <Button
                size="lg"
                onClick={() => router.push('/validate')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
              >
                Continue to Validation
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}