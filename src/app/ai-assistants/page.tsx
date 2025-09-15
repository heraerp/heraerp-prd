'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Scissors,
  Brain,
  Calculator,
  Heart,
  Package,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Assistant {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  gradient: string
  status: 'live' | 'coming-soon'
  features?: string[]
}

const assistants: Assistant[] = [
  {
    title: 'Salon Manager',
    description:
      'Complete salon operations with appointment booking, inventory tracking, and revenue analytics',
    icon: Scissors,
    href: '/salon-manager',
    gradient: 'from-purple-500 to-pink-500',
    status: 'live',
    features: ['Appointment Booking', 'Inventory Management', 'Revenue Analytics']
  },
  {
    title: 'Analytics Chat v2',
    description:
      'Advanced business intelligence and data analysis with AI-powered insights and predictions',
    icon: Brain,
    href: '/analytics-chat-v2',
    gradient: 'from-blue-500 to-cyan-500',
    status: 'live',
    features: ['Data Analysis', 'Pattern Recognition', 'Predictive Insights']
  },
  {
    title: 'Digital Accountant',
    description:
      'Enterprise accounting automation with journal entries, GL posting, and financial reporting',
    icon: Calculator,
    href: '/digital-accountant',
    gradient: 'from-green-500 to-emerald-500',
    status: 'live',
    features: ['Auto-Journal', 'GL Management', 'Financial Reports']
  },
  {
    title: 'Healthcare Assistant',
    description: 'Patient management, appointment scheduling, and medical record organization',
    icon: Heart,
    href: '/healthcare-assistant',
    gradient: 'from-red-500 to-pink-500',
    status: 'coming-soon'
  },
  {
    title: 'Retail Manager',
    description: 'Complete retail operations with POS, inventory, and customer management',
    icon: Package,
    href: '/retail-manager',
    gradient: 'from-orange-500 to-amber-500',
    status: 'coming-soon'
  },
  {
    title: 'HR Assistant',
    description: 'Employee management, recruitment tracking, and performance reviews',
    icon: Users,
    href: '/hr-assistant',
    gradient: 'from-indigo-500 to-purple-500',
    status: 'coming-soon'
  }
]

export default function AIAssistantsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6 shadow-2xl">
            <Sparkles className="h-10 w-10 text-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            HERA AI Assistants
          </h1>
          <p className="text-xl text-muted-foreground dark:text-gray-300 max-w-2xl mx-auto">
            Select your AI-powered assistant for specialized business operations
          </p>
        </div>

        {/* Assistant Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistants.map(assistant => (
            <Card
              key={assistant.title}
              className={cn(
                'relative overflow-hidden transition-all duration-300 hover:shadow-2xl',
                assistant.status === 'live' ? 'cursor-pointer hover:-translate-y-1' : 'opacity-60'
              )}
            >
              {/* Status Badge */}
              {assistant.status === 'coming-soon' && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              )}

              <CardHeader>
                <div
                  className={cn(
                    'w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg',
                    assistant.gradient
                  )}
                >
                  <assistant.icon className="h-8 w-8 text-foreground" />
                </div>
                <CardTitle className="text-2xl">{assistant.title}</CardTitle>
                <CardDescription className="mt-2">{assistant.description}</CardDescription>
              </CardHeader>

              <CardContent>
                {assistant.features && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {assistant.features.map(feature => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  className="w-full"
                  disabled={assistant.status === 'coming-soon'}
                  onClick={() => router.push(assistant.href)}
                >
                  {assistant.status === 'live' ? (
                    <>
                      Open Assistant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    'Coming Soon'
                  )}
                </Button>
              </CardContent>

              {/* Gradient overlay */}
              <div
                className={cn(
                  'absolute inset-0 opacity-5 pointer-events-none',
                  `bg-gradient-to-br ${assistant.gradient}`
                )}
              />
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          More AI assistants coming soon • Powered by HERA Universal Architecture
        </div>
      </div>
    </div>
  )
}
