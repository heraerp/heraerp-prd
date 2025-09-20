'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Scissors,
  IceCream2,
  UtensilsCrossed,
  Stethoscope,
  Factory,
  Store,
  Briefcase,
  GraduationCap,
  ArrowRight,
  Clock,
  Shield,
  Zap,
  Globe,
  Users,
  TrendingUp,
  Sparkles,
  Play,
  Building,
  ChevronRight,
  Check,
  Star,
  Rocket,
  Menu,
  X,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Industry showcase data
const industries = [
  {
    id: 'salon',
    title: 'Salon & Spa',
    description: 'Complete salon management with appointments, inventory, and customer loyalty',
    icon: Scissors,
    color: 'from-purple-500 to-pink-600',
    bgColor: 'from-purple-50 to-pink-50',
    darkBgColor: 'dark:from-purple-900/20 dark:to-pink-900/20',
    features: [
      'Appointment Booking',
      'Staff Management',
      'Inventory Tracking',
      'WhatsApp Integration'
    ],
    demoUrl: '/salon-data',
    buildUrl: '/discover',
    stats: { businesses: '2,400+', revenue: '$4.2M processed', time: '30 seconds' }
  },
  {
    id: 'icecream',
    title: 'Ice Cream & Desserts',
    description: 'Multi-location distribution, route optimization, and inventory management',
    icon: IceCream2,
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'from-blue-50 to-cyan-50',
    darkBgColor: 'dark:from-blue-900/20 dark:to-cyan-900/20',
    features: ['Route Management', 'Multi-location', 'Real-time Tracking', 'Analytics Dashboard'],
    demoUrl: '/salon-data',
    buildUrl: '/discover',
    stats: { businesses: '500+', revenue: '$8.5M tracked', time: '45 seconds' }
  },
  {
    id: 'restaurant',
    title: 'Restaurant & Cafe',
    description: 'Full restaurant operations from menu to kitchen, billing to analytics',
    icon: UtensilsCrossed,
    color: 'from-orange-500 to-red-600',
    bgColor: 'from-orange-50 to-red-50',
    darkBgColor: 'dark:from-orange-900/20 dark:to-red-900/20',
    features: ['Table Management', 'Kitchen Display', 'Online Ordering', 'Automated Accounting'],
    demoUrl: '/org/restaurant',
    buildUrl: '/discover',
    stats: { businesses: '3,200+', revenue: '$12M processed', time: '60 seconds' }
  },
  {
    id: 'clinic',
    title: 'Healthcare Clinic',
    description: 'Patient management, appointments, prescriptions, and billing',
    icon: Stethoscope,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'from-green-50 to-emerald-50',
    darkBgColor: 'dark:from-green-900/20 dark:to-emerald-900/20',
    features: ['Patient Records', 'Appointment System', 'E-Prescriptions', 'Insurance Claims'],
    demoUrl: '/validate',
    buildUrl: '/discover',
    stats: { businesses: '800+', revenue: '$6.3M billed', time: '90 seconds' }
  }
]

// User journey stages
const journeyStages = [
  {
    stage: 'Discover',
    description: 'Explore live demos of real businesses',
    icon: Play,
    action: 'Try Demo Apps'
  },
  {
    stage: 'Validate',
    description: 'See if it fits your business needs',
    icon: Check,
    action: 'Run through checklist'
  },
  {
    stage: 'Build',
    description: 'Customize with your requirements',
    icon: Rocket,
    action: 'Start Building'
  },
  {
    stage: 'Deploy',
    description: 'Go live in days, not months',
    icon: Globe,
    action: 'Launch Business'
  }
]

// Value propositions
const valueProps = [
  {
    title: '70% Cost Savings',
    description: 'vs traditional ERP systems',
    icon: TrendingUp,
    metric: '$2M+ saved by customers'
  },
  {
    title: '92% Success Rate',
    description: 'Implementation guarantee',
    icon: Shield,
    metric: '10,000+ businesses'
  },
  {
    title: '30 Second Setup',
    description: 'From zero to running',
    icon: Zap,
    metric: 'Instant deployment'
  },
  {
    title: '6 Sacred Tables',
    description: 'Universal architecture',
    icon: Globe,
    metric: 'Infinite flexibility'
  }
]

// Coming soon industries
const comingSoon = [
  { title: 'Manufacturing', icon: Factory },
  { title: 'Retail Chain', icon: Store },
  { title: 'Professional Services', icon: Briefcase },
  { title: 'Education', icon: GraduationCap }
]

export default function LandingPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 overflow-x-hidden">
      {/* Prelaunch Notification Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-foreground py-3 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-background/10 backdrop-blur-sm"></div>
        <div className="relative z-10 flex items-center justify-center gap-3 text-sm md:text-base flex-wrap">
          <Badge className="bg-background/20 text-foreground border-white/30 hover:bg-background/30">
            <Rocket className="w-3 h-3 mr-1" />
            PRELAUNCH
          </Badge>
          <span className="font-medium">
            Welcome to HERA ERP Preview! Feel free to explore.
            <span className="hidden sm:inline"> Official launch on</span>
            <span className="font-bold sm:hidden"> Launching</span>{' '}
            <span className="font-bold text-yellow-300">October 1st, 2025</span>
          </span>
          <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse hidden sm:block" />
        </div>
      </div>

      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 sm:w-96 h-72 sm:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob dark:bg-blue-600 dark:opacity-20" />
        <div className="absolute top-40 right-20 w-72 sm:w-96 h-72 sm:h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob animation-delay-2000 dark:bg-purple-600 dark:opacity-20" />
        <div className="absolute -bottom-20 left-40 w-72 sm:w-96 h-72 sm:h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob animation-delay-4000 dark:bg-pink-600 dark:opacity-20" />
      </div>

      {/* Header with Mobile Menu */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/70 dark:bg-background/70 border-b border-border dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-foreground font-bold text-sm sm:text-lg">H</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground dark:text-foreground">
                  HERA ERP
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground hidden sm:block">
                  Universal Business Platform
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/discover"
                className="text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
              >
                Discover
              </Link>
              <Link
                href="/demo"
                className="text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
              >
                Demo Apps
              </Link>
              <Link
                href="/validate"
                className="text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
              >
                Solutions
              </Link>
              <Link
                href="/pricing"
                className="text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
              >
                Docs
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="ml-2 !text-slate-700 dark:!text-slate-200"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 !text-foreground dark:!text-foreground"
              >
                Start Free Trial
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-muted-foreground dark:text-slate-300" />
              ) : (
                <Menu className="w-5 h-5 text-muted-foreground dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background dark:bg-background border-t border-border dark:border-slate-800">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link
                href="/discover"
                className="block text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Discover
              </Link>
              <Link
                href="/demo"
                className="block text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Demo Apps
              </Link>
              <Link
                href="/validate"
                className="block text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Solutions
              </Link>
              <Link
                href="/pricing"
                className="block text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="block text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 !text-foreground dark:!text-foreground"
                  asChild
                >
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    Start Free Trial
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 sm:pt-32 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 sm:space-y-8 animate-fadeIn">
            <Badge className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 dark:bg-muted text-slate-700 dark:text-foreground border-border dark:border-border">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary dark:text-blue-400" />
              <span className="text-xs sm:text-sm">Trusted by 10,000+ businesses worldwide</span>
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold">
              <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-gray-900 dark:via-slate-100 dark:to-gray-900 bg-clip-text text-transparent">
                Run Your Entire Business
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
                In One Beautiful Platform
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground dark:text-slate-300 max-w-2xl md:max-w-3xl mx-auto">
              HERA transforms how businesses operate. Explore live demos of real companies, then
              build your own customized version in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 !text-foreground dark:!text-foreground px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                onClick={() => router.push('/demo')}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Explore Demo Apps
              </Button>
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 !text-foreground px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                onClick={() => router.push('/readiness-questionnaire')}
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                ERP Readiness Check
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg w-full sm:w-auto !text-slate-700 dark:!text-slate-200"
                onClick={() => router.push('/auth/signup')}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Positioned Lower to Prevent Cutoff */}
      <section className="relative py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {[
              { value: '30 sec', label: 'Setup Time', icon: Clock },
              { value: '99.9%', label: 'Uptime SLA', icon: Shield },
              { value: '$2M+', label: 'Cost Savings', icon: TrendingUp },
              { value: 'Flexible', label: 'Universal Schema', icon: Zap }
            ].map((stat, index) => (
              <div
                key={index}
                className={`bg-background dark:bg-muted rounded-xl p-4 sm:p-6 border border-border dark:border-border shadow-sm hover:shadow-md transition-all duration-300 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary dark:text-blue-400 mb-2" />
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground dark:text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Journey Section */}
      <section id="discover" className="py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground dark:text-foreground mb-3 sm:mb-4">
              Your Journey to Modern Business
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground dark:text-slate-300">
              From discovery to deployment in{' '}
              <span className="text-[#B0B0B0] font-semibold">days, not months</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {journeyStages.map((stage, index) => (
              <div
                key={index}
                className={`relative ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${(index + 4) * 100}ms` }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                      <stage.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl text-gray-100 dark:text-foreground">
                      {stage.stage}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-[#B0B0B0] font-medium">
                      {stage.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm sm:text-base !text-primary dark:!text-blue-400 hover:!text-blue-700 dark:hover:!text-blue-300"
                    >
                      {stage.action} <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
                {index < journeyStages.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Showcase */}
      <section
        id="industries"
        className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-slate-50 to-gray-900 dark:from-slate-900 dark:to-slate-950"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground dark:text-foreground mb-3 sm:mb-4">
              <span className="text-[#B0B0B0]">Explore</span> Real Business Demos
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground dark:text-slate-300 max-w-2xl mx-auto">
              See how successful businesses use HERA. Each demo is a{' '}
              <span className="text-[#B0B0B0] font-semibold">real implementation</span> you can
              explore and customize.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {industries.map((industry, index) => (
              <div
                key={industry.id}
                className={`group ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${(index + 8) * 100}ms` }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                  <div className={`h-2 bg-gradient-to-r ${industry.color}`} />
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${industry.bgColor} ${industry.darkBgColor} flex items-center justify-center`}
                      >
                        <industry.icon className="w-6 h-6 sm:w-7 sm:h-7 text-slate-700 dark:text-slate-300" />
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs sm:text-sm text-slate-700 dark:text-foreground"
                      >
                        Live Demo
                      </Badge>
                    </div>
                    <CardTitle className="text-xl sm:text-2xl text-gray-100 dark:text-foreground">
                      {industry.title}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-gray-700 dark:text-gray-200">
                      {industry.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {industry.features.map((feature, featureIndex) => (
                        <Badge
                          key={featureIndex}
                          variant="outline"
                          className="text-xs text-slate-700 dark:text-foreground border-input dark:border-input"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-3 sm:py-4 border-y">
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-semibold text-foreground dark:text-foreground">
                          {industry.stats.businesses}
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                          Active
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-semibold text-foreground dark:text-foreground">
                          {industry.stats.revenue}
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                          Revenue
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-semibold text-foreground dark:text-foreground">
                          {industry.stats.time}
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                          Setup
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2 sm:gap-3">
                        <Button
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 !text-foreground dark:!text-foreground text-sm sm:text-base"
                          onClick={() => router.push(industry.demoUrl)}
                        >
                          <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                          Try Demo
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 text-sm sm:text-base !text-gray-700 dark:!text-gray-200"
                          onClick={() => router.push(industry.buildUrl)}
                        >
                          Build Your Own
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Build Your Own CTA */}
          <div className="mt-12 sm:mt-16 text-center">
            <Card className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl text-gray-100 dark:text-foreground">
                  Don't see your industry?
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-muted-foreground dark:text-gray-300">
                  HERA's universal architecture works for any business type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 !text-foreground dark:!text-foreground text-sm sm:text-base"
                  onClick={() => router.push('/build')}
                >
                  Build Custom Solution
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground dark:text-foreground mb-2 sm:mb-3">
              Coming Soon
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground dark:text-slate-300">
              More industry-specific demos launching soon
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {comingSoon.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 dark:bg-muted rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <item.icon className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
                  {item.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-gray-900 to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground dark:text-foreground mb-3 sm:mb-4">
              Why Businesses Choose HERA
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground dark:text-slate-300">
              Revolutionary architecture that delivers{' '}
              <span className="text-[#B0B0B0] font-semibold">real results</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {valueProps.map((prop, index) => (
              <div
                key={index}
                className={`text-center ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${(index + 12) * 100}ms` }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <prop.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary dark:text-blue-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground dark:text-foreground mb-1 sm:mb-2">
                  {prop.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground mb-2">
                  {prop.description}
                </p>
                <p className="text-sm sm:text-base font-medium text-primary dark:text-blue-400">
                  {prop.metric}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8">
              Join <span className="text-[#B0B0B0] font-semibold">thousands of businesses</span>{' '}
              already running on HERA's revolutionary platform
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-slate-100 !text-foreground dark:!text-foreground px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                onClick={() => router.push('/auth/signup')}
              >
                Start Your Free Trial
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white !text-foreground hover:bg-background hover:!text-foreground px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
                onClick={() => router.push('/contact')}
              >
                Talk to Sales
              </Button>
            </div>

            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground">
              <span className="text-[#B0B0B0]">No credit card required</span> •{' '}
              <span className="text-[#B0B0B0]">14-day free trial</span> • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background dark:bg-background border-t border-border dark:border-slate-800 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
              © 2025 HERA ERP. All rights reserved. •
              <Link href="/privacy" className="hover:text-foreground dark:hover:text-foreground">
                {' '}
                Privacy
              </Link>{' '}
              •
              <Link href="/terms" className="hover:text-foreground dark:hover:text-foreground">
                {' '}
                Terms
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
