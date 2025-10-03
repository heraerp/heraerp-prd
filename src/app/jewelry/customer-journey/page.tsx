'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, UserPlus, Calendar, Palette, FileText, Hammer, 
  Award, Truck, Heart, Star, Sparkles, ArrowDown,
  CheckCircle, Clock, ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
// import { motion } from 'framer-motion'

interface JourneyStage {
  id: number
  title: string
  subtitle: string
  icon: React.ElementType
  smartCode: string
  color: string
  description: string
  actions: string[]
}

const journeyStages: JourneyStage[] = [
  {
    id: 1,
    title: 'Discover',
    subtitle: 'Lead Intake',
    icon: Search,
    smartCode: 'HERA.JEWELRY.LEAD.DISCOVER.V1',
    color: 'from-purple-600 to-pink-600',
    description: 'Customer discovers your jewelry brand',
    actions: ['Website visit', 'Social media', 'Referral', 'Walk-in']
  },
  {
    id: 2,
    title: 'Engage',
    subtitle: 'Appointment Scheduled',
    icon: Calendar,
    smartCode: 'HERA.JEWELRY.APPOINTMENT.BOOK.V1',
    color: 'from-blue-600 to-cyan-600',
    description: 'Initial consultation booked',
    actions: ['Book appointment', 'Capture preferences', 'Send reminder']
  },
  {
    id: 3,
    title: 'Consult',
    subtitle: 'Requirements Captured',
    icon: UserPlus,
    smartCode: 'HERA.JEWELRY.CONSULT.CAPTURE.V1',
    color: 'from-green-600 to-emerald-600',
    description: 'Understand customer vision',
    actions: ['Style preferences', 'Budget range', 'Timeline', 'Inspiration']
  },
  {
    id: 4,
    title: 'Design & Quote',
    subtitle: 'Quote Sent',
    icon: Palette,
    smartCode: 'HERA.JEWELRY.QUOTE.CREATE.V1',
    color: 'from-yellow-600 to-orange-600',
    description: 'Create custom design and pricing',
    actions: ['CAD design', 'Material selection', 'Stone sourcing', 'Quote generation']
  },
  {
    id: 5,
    title: 'Order',
    subtitle: 'Order Confirmed',
    icon: FileText,
    smartCode: 'HERA.JEWELRY.ORDER.CONFIRM.V1',
    color: 'from-indigo-600 to-purple-600',
    description: 'Convert quote to order',
    actions: ['Accept quote', 'Process deposit', 'Create work order', 'Set timeline']
  },
  {
    id: 6,
    title: 'Workshop Production',
    subtitle: 'CAD → Casting → Setting',
    icon: Hammer,
    smartCode: 'HERA.JEWELRY.PRODUCTION.WORKSHOP.V1',
    color: 'from-red-600 to-pink-600',
    description: 'Craft the masterpiece',
    actions: ['CAD finalization', 'Metal casting', 'Stone setting', 'Polishing']
  },
  {
    id: 7,
    title: 'Quality & Certification',
    subtitle: '4Cs Check + Cert Issued',
    icon: Award,
    smartCode: 'HERA.JEWELRY.QC.CERTIFY.V1',
    color: 'from-teal-600 to-cyan-600',
    description: 'Ensure excellence',
    actions: ['Quality inspection', '4Cs grading', 'Certification', 'Photography']
  },
  {
    id: 8,
    title: 'Delivery & Fulfillment',
    subtitle: 'Pickup / Shipping',
    icon: Truck,
    smartCode: 'HERA.JEWELRY.FULFILLMENT.DELIVER.V1',
    color: 'from-green-600 to-teal-600',
    description: 'Perfect handover',
    actions: ['Package preparation', 'Insurance', 'Delivery scheduling', 'Customer notification']
  },
  {
    id: 9,
    title: 'After-Sales Care',
    subtitle: 'Service & Warranty',
    icon: Heart,
    smartCode: 'HERA.JEWELRY.SERVICE.CARE.V1',
    color: 'from-pink-600 to-red-600',
    description: 'Lifetime relationship',
    actions: ['Warranty activation', 'Care instructions', 'Service reminders', 'Upgrade offers']
  },
  {
    id: 10,
    title: 'Loyalty & Advocacy',
    subtitle: 'Referral, Review, UGC',
    icon: Star,
    smartCode: 'HERA.JEWELRY.LOYALTY.ADVOCATE.V1',
    color: 'from-yellow-600 to-amber-600',
    description: 'Brand ambassadors',
    actions: ['Loyalty rewards', 'Referral program', 'Reviews collection', 'Social sharing']
  },
  {
    id: 11,
    title: 'Amplify Storytelling',
    subtitle: 'Content Repurposed via Amplify',
    icon: Sparkles,
    smartCode: 'HERA.JEWELRY.AMPLIFY.STORY.V1',
    color: 'from-purple-600 to-pink-600',
    description: 'Share success stories',
    actions: ['Customer stories', 'Design showcases', 'Behind-the-scenes', 'Educational content']
  }
]

export default function JewelryCustomerJourney() {
  const router = useRouter()
  const [hoveredStage, setHoveredStage] = useState<number | null>(null)
  const [visibleStages, setVisibleStages] = useState<number[]>([])

  useEffect(() => {
    // Animate stages appearing one by one
    const timer = setInterval(() => {
      setVisibleStages(prev => {
        if (prev.length < journeyStages.length) {
          return [...prev, prev.length]
        }
        clearInterval(timer)
        return prev
      })
    }, 200)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-600/30 to-amber-600/30 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 text-transparent bg-clip-text mb-4">
            Jewelry Customer Journey
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            From Discovery to Advocacy - Powered by HERA
          </p>
          <p className="text-gray-400 italic">
            One Platform. Every Touchpoint. Lifetime Relationships.
          </p>
        </div>

        {/* Info Box */}
        <Card className="max-w-4xl mx-auto mb-12 bg-gray-800/50 backdrop-blur-xl border-yellow-500/30">
          <div className="p-6 text-center">
            <p className="text-gray-300">
              <span className="text-yellow-400 font-semibold">Smart Code Example:</span>{' '}
              HERA.JEWELRY.CUSTOMER.JOURNEY.V1
            </p>
            <p className="text-gray-400 italic mt-2">
              AI-native architecture that tracks every customer interaction
            </p>
          </div>
        </Card>

        {/* Journey Flow */}
        <div className="max-w-5xl mx-auto space-y-4">
          {journeyStages.map((stage, index) => (
            <React.Fragment key={stage.id}>
              <div
                onMouseEnter={() => setHoveredStage(stage.id)}
                onMouseLeave={() => setHoveredStage(null)}
                className={`relative transition-opacity duration-600 ${
                  visibleStages.includes(index) ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Card className={`
                  bg-gray-800/80 backdrop-blur-xl border-2 
                  ${hoveredStage === stage.id ? 'border-yellow-400 shadow-2xl shadow-yellow-400/20' : 'border-yellow-500/50'}
                  transition-all duration-300 cursor-pointer
                  ${hoveredStage === stage.id ? 'transform scale-105' : ''}
                `}>
                  <div className="p-6 md:p-8">
                    {/* Stage Number */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-gray-900 font-bold text-lg">{stage.id}</span>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      {/* Icon */}
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${stage.color} shadow-lg flex-shrink-0`}>
                        <stage.icon className="h-8 w-8 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                          <h3 className="text-2xl font-bold text-yellow-400">
                            {stage.title}
                          </h3>
                          <Badge variant="outline" className="border-gray-600 text-gray-400 w-fit">
                            {stage.subtitle}
                          </Badge>
                        </div>
                        <p className="text-gray-300 mb-3">{stage.description}</p>
                        <p className="text-sm text-gray-500 font-mono mb-4">{stage.smartCode}</p>
                        
                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {stage.actions.map((action, actionIndex) => (
                            <Badge 
                              key={actionIndex}
                              className="bg-gray-700/50 text-gray-300 border-gray-600"
                            >
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Navigate Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                        onClick={() => {
                          // Navigate to relevant page based on stage
                          const routes: Record<number, string> = {
                            1: '/jewelry/leads',
                            2: '/jewelry/appointments',
                            3: '/jewelry/consultations',
                            4: '/jewelry/quotes',
                            5: '/jewelry/orders',
                            6: '/jewelry/production',
                            7: '/jewelry/quality',
                            8: '/jewelry/fulfillment',
                            9: '/jewelry/service',
                            10: '/jewelry/loyalty',
                            11: '/amplify'
                          }
                          router.push(routes[stage.id] || '/jewelry')
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Arrow between stages */}
              {index < journeyStages.length - 1 && (
                <div
                  className={`flex justify-center py-2 transition-opacity duration-600 ${
                    visibleStages.includes(index) ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <ArrowDown className="h-8 w-8 text-yellow-400 animate-pulse" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Bottom Info Box */}
        <Card className="max-w-4xl mx-auto mt-16 bg-gray-800/50 backdrop-blur-xl border-yellow-500/30">
          <div className="p-8 text-center">
            <p className="text-xl text-yellow-400 font-semibold mb-2">
              HERA Advantage
            </p>
            <p className="text-gray-300 mb-4">
              Deploy this complete customer journey in 4-8 weeks<br />
              vs. 12-18 months with traditional jewelry management systems
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <span>✨ Universal patterns</span>
              <span>♻️ 80% code reuse</span>
              <span>🔒 Zero schema changes</span>
              <span>🤖 AI-powered insights</span>
            </div>
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 mt-12">
          <Button
            variant="outline"
            onClick={() => router.push('/jewelry')}
            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
          >
            Back to Jewelry Dashboard
          </Button>
          <Button
            onClick={() => router.push('/amplify')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Explore Amplify
          </Button>
        </div>
      </div>
    </div>
  )
}