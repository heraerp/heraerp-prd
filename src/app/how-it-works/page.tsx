'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * HERA How It Works - Zero-Friction Demo to Signup Journey
 * Smart Code: HERA.MARKETING.HOW_IT_WORKS.v1
 *
 * Don't Make Me Think approach:
 * 1. Show live demos immediately
 * 2. One-click demo access
 * 3. Request custom demo easily
 * 4. Seamless transition to signup
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
// Removed framer-motion import - not needed
import {
  Scissors,
  Coffee,
  Stethoscope,
  ShoppingBag,
  GraduationCap,
  Wrench,
  ChefHat,
  Briefcase,
  Play,
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  Sparkles,
  Zap,
  MessageCircle,
  Building2,
  TrendingUp,
  Calendar,
  DollarSign,
  Star,
  ChevronRight,
  Loader2,
  CheckCheck,
  Rocket,
  Gift,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

// Demo businesses with live links
const LIVE_DEMOS = [
  {
    id: 'salon',
    name: 'Hair Talkz Salon',
    description: 'Complete salon management with bookings, staff & inventory',
    icon: Scissors,
    gradient: 'from-pink-500 to-purple-600',
    bgGradient: 'from-pink-50 to-purple-50',
    darkBgGradient: 'dark:from-pink-950/20 dark:to-purple-950/20',
    path: '/salon-data',
    features: ['Appointment Calendar', 'Staff Management', 'WhatsApp Integration'],
    stats: { appointments: '150+ Daily', revenue: 'AED 250K Monthly' },
    tag: 'Most Popular'
  },
  {
    id: 'restaurant',
    name: "Mario's Restaurant",
    description: 'Restaurant POS with orders, kitchen & table management',
    icon: ChefHat,
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-50 to-red-50',
    darkBgGradient: 'dark:from-orange-950/20 dark:to-red-950/20',
    path: '/restaurant',
    features: ['Order Management', 'Kitchen Display', 'Table Tracking'],
    stats: { orders: '500+ Daily', tables: '25 Active' },
    tag: 'New'
  },
  {
    id: 'icecream',
    name: 'Ice Cream Dashboard',
    description: 'Analytics dashboard for ice cream parlor operations',
    icon: Coffee,
    gradient: 'from-blue-500 to-cyan-600',
    bgGradient: 'from-blue-50 to-cyan-50',
    darkBgGradient: 'dark:from-blue-950/20 dark:to-cyan-950/20',
    path: '/ice-cream',
    features: ['Sales Analytics', 'Flavor Tracking', 'Inventory Alerts'],
    stats: { flavors: '32 Active', sales: '$125K Monthly' },
    tag: 'Analytics'
  },
  {
    id: 'healthcare',
    name: 'Medical Clinic',
    description: 'Patient management with appointments & prescriptions',
    icon: Stethoscope,
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 to-teal-50',
    darkBgGradient: 'dark:from-emerald-950/20 dark:to-teal-950/20',
    path: '/healthcare',
    features: ['Patient Records', 'Appointment Scheduling', 'Prescriptions'],
    stats: { patients: '2,500+', appointments: '80+ Daily' },
    tag: 'Coming Soon',
    disabled: true
  }
]

// More demo options for request
const MORE_DEMOS = [
  { name: 'Retail Store', icon: ShoppingBag },
  { name: 'School', icon: GraduationCap },
  { name: 'Manufacturing', icon: Wrench },
  { name: 'Consulting Firm', icon: Briefcase }
]

// Journey steps
const JOURNEY_STEPS = [
  {
    number: '1',
    title: 'Try Live Demos',
    description: 'Click any demo below to experience HERA instantly',
    icon: Play,
    time: '0 seconds'
  },
  {
    number: '2',
    title: 'Love What You See?',
    description: 'Create your account in 30 seconds',
    icon: Sparkles,
    time: '30 seconds'
  },
  {
    number: '3',
    title: 'Your App is Ready!',
    description: 'Start using immediately with your data',
    icon: Rocket,
    time: '2 minutes'
  }
]

export default function HowItWorksPage() {
  const [requestedDemo, setRequestedDemo] = useState('')
  const [email, setEmail] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleDemoRequest = async () => {
    if (!requestedDemo || !email) return

    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setShowSuccess(true)
    setIsSubmitting(false)

    // Auto redirect to signup after 2 seconds
    setTimeout(() => {
      router.push(`/auth/signup?demo=${requestedDemo}&email=${email}`)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

        <div className="relative px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="animate-fadeIn">
              <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                <Zap className="w-3 h-3 mr-1" />
                See it in action right now
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-foreground mb-6">
                Experience HERA in
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  3 Simple Steps
                </span>
              </h1>

              <p className="text-xl text-muted-foreground dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                No signup needed. Just click a demo and see how HERA transforms your business in
                seconds.
              </p>
            </div>

            {/* Journey Steps */}
            <div className="grid md:grid-cols-3 gap-6 mt-12 mb-16">
              {JOURNEY_STEPS.map((step, index) => (
                <div
                  key={index}
                  className="relative animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="bg-background/80 dark:bg-muted/80 backdrop-blur-sm border-border dark:border-border h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                        {step.number}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                        {step.description}
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400">
                        <Clock className="w-3 h-3" />
                        {step.time}
                      </div>
                    </CardContent>
                  </Card>
                  {index < JOURNEY_STEPS.length - 1 && (
                    <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Demos Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-16 bg-background dark:bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-4">
              Step 1: Click Any Demo to Start
            </h2>
            <p className="text-lg text-muted-foreground dark:text-gray-300">
              No login required. Just click and explore.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LIVE_DEMOS.map((demo, index) => (
              <div
                key={demo.id}
                className={cn(
                  'relative animate-fadeIn transform hover:scale-[1.02] transition-transform',
                  demo.disabled && 'opacity-60'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="h-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-border dark:border-border overflow-hidden group hover:shadow-xl transition-all">
                  <div
                    className={cn('absolute inset-0 opacity-10 bg-gradient-to-br', demo.gradient)}
                  />

                  <CardHeader className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center shadow-lg',
                          demo.gradient
                        )}
                      >
                        {React.createElement(demo.icon, { className: 'w-6 h-6 text-foreground' })}
                      </div>
                      {demo.tag && (
                        <Badge
                          variant={demo.disabled ? 'secondary' : 'default'}
                          className={cn(
                            demo.tag === 'Most Popular' &&
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                            demo.tag === 'New' &&
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          )}
                        >
                          {demo.tag}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mb-2">{demo.name}</CardTitle>
                    <CardDescription className="text-sm">{demo.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="relative space-y-4">
                    {/* Features */}
                    <div className="space-y-2">
                      {demo.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    {demo.stats && (
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border dark:border-border">
                        {Object.entries(demo.stats).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                              {value}
                            </p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground capitalize">
                              {key}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA Button */}
                    {demo.disabled ? (
                      <Button className="w-full" variant="secondary" disabled>
                        Coming Soon
                      </Button>
                    ) : (
                      <Link href={demo.path} className="block">
                        <Button
                          className={cn(
                            'w-full bg-gradient-to-r text-foreground group-hover:shadow-md transition-all',
                            demo.gradient
                          )}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Try Demo Now
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Request Demo Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-950/20 border-purple-200 dark:border-purple-700">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-foreground flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl mb-2">Don't see your business type?</CardTitle>
              <CardDescription className="text-base">
                Request a custom demo and we'll build it for you in 24 hours!
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Quick Options */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {MORE_DEMOS.map(demo => (
                  <Button
                    key={demo.name}
                    variant={requestedDemo === demo.name ? 'default' : 'outline'}
                    className="h-auto py-3"
                    onClick={() => setRequestedDemo(demo.name)}
                  >
                    {React.createElement(demo.icon, { className: 'w-5 h-5 mb-1' })}
                    <span className="block text-xs">{demo.name}</span>
                  </Button>
                ))}
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="text-center text-lg h-12"
                  disabled={showSuccess}
                />
              </div>

              {/* Submit Button */}
              {showSuccess ? (
                <div className="text-center space-y-3 animate-fadeIn">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <CheckCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-foreground">
                    Perfect! Redirecting you to signup...
                  </p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    We'll have your {requestedDemo} demo ready!
                  </p>
                </div>
              ) : (
                <Button
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-foreground"
                  disabled={!requestedDemo || !email || isSubmitting}
                  onClick={handleDemoRequest}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating your demo...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5 mr-2" />
                      Get My Custom Demo
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-br from-blue-600 to-purple-600 text-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your business?</h2>
          <p className="text-xl mb-8 text-blue-100">Join 10,000+ businesses already using HERA</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-background text-primary hover:bg-muted">
                <Rocket className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/salon-data">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-foreground hover:bg-background/10"
              >
                <Play className="w-5 h-5 mr-2" />
                Try Salon Demo First
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-12 max-w-lg mx-auto">
            <div>
              <p className="text-3xl font-bold">30s</p>
              <p className="text-sm text-blue-100">Setup Time</p>
            </div>
            <div>
              <p className="text-3xl font-bold">$0</p>
              <p className="text-sm text-blue-100">No Credit Card</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-blue-100">Support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
