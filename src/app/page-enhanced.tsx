'use client'

import { useState } from 'react'
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
  Rocket
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
    demoUrl: '/salon',
    buildUrl: '/salon-demo',
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
    demoUrl: '/icecream',
    buildUrl: '/icecream-builder',
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
    buildUrl: '/restaurant-builder',
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
    demoUrl: '/healthcare',
    buildUrl: '/clinic-builder',
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
    action: 'Test Features'
  },
  {
    stage: 'Build',
    description: 'Create your customized version',
    icon: Building,
    action: 'Build Your App'
  },
  {
    stage: 'Deploy',
    description: 'Go live with your own subdomain',
    icon: Rocket,
    action: 'Launch Business'
  }
]

// Value propositions
const valueProps = [
  {
    icon: Clock,
    title: '30-Second Setup',
    description: 'From zero to fully functional business app in seconds, not months'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Multi-tenant isolation with bank-grade security built-in'
  },
  {
    icon: Zap,
    title: 'Universal Architecture',
    description: '6 tables handle infinite complexity. No schema changes ever.'
  },
  {
    icon: Globe,
    title: 'Global Ready',
    description: 'Multi-currency, multi-language, regulatory compliant'
  }
]

export default function EnhancedLandingPage() {
  const router = useRouter()
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 dark:bg-background/80 backdrop-blur-sm border-b border-border dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-background dark:bg-background rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-foreground dark:text-black">H</span>
                </div>
                <span className="text-xl font-semibold ink dark:text-foreground">
                  HERA
                </span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="#discover"
                className="text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-gray-100 transition-colors"
              >
                Explore Apps
              </Link>
              <Link
                href="#how-it-works"
                className="text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-gray-100 transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="/docs"
                className="text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-gray-100 transition-colors"
              >
                Documentation
              </Link>
              <div className="flex items-center gap-4 ml-4">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Start Free Trial</Link>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-grid-gray-100/50 dark:bg-grid-gray-800/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Trusted by 10,000+ businesses worldwide
            </Badge>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Run Your Entire Business
              <br />
              <span className="text-primary dark:text-blue-400">In One Beautiful Platform</span>
            </h1>

            <p className="text-xl text-muted-foreground dark:text-gray-300 max-w-3xl mx-auto">
              HERA transforms how businesses operate. Explore live demos of real companies, then
              build your own customized version in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-foreground px-8 py-6 text-lg"
                onClick={() =>
                  document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                <Play className="w-5 h-5 mr-2" />
                Explore Live Demos
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg border-border dark:border-border"
                onClick={() => router.push('/auth/signup')}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* User Journey Section */}
      <section id="how-it-works" className="py-20 bg-background dark:bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold ink dark:text-foreground mb-4">
              Your Journey to Digital Transformation
            </h2>
            <p className="text-xl text-muted-foreground dark:text-muted-foreground">
              Four simple steps from discovery to deployment
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {journeyStages.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="text-center">
                  <div className="inline-flex p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
                    <stage.icon className="w-8 h-8 text-primary dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold ink dark:text-foreground mb-2">
                    {index + 1}. {stage.stage}
                  </h3>
                  <p className="text-muted-foreground dark:text-muted-foreground mb-4">
                    {stage.description}
                  </p>
                  <Button variant="link" className="text-primary dark:text-blue-400">
                    {stage.action}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                {index < journeyStages.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full">
                    <ArrowRight className="w-6 h-6 text-gray-300 dark:text-muted-foreground mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Showcase */}
      <section id="discover" className="py-20 bg-muted dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Star className="w-3 h-3 mr-1" />
              Live Production Apps
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold ink dark:text-foreground mb-4">
              Experience Real Business Applications
            </h2>
            <p className="text-xl text-muted-foreground dark:text-muted-foreground max-w-3xl mx-auto">
              These aren't demos - they're actual production systems running real businesses. Try
              them, then build your own.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {industries.map(industry => (
              <Card
                key={industry.id}
                className={`group cursor-pointer transition-all duration-300 hover:shadow-xl ${ selectedIndustry === industry.id ?'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedIndustry(industry.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${industry.color} shadow-lg`}>
                      <industry.icon className="w-8 h-8 text-foreground" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Live System
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl mt-4 !ink dark:!text-gray-100">
                    {industry.title}
                  </CardTitle>
                  <CardDescription className="!text-muted-foreground dark:!text-muted-foreground">
                    {industry.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {industry.features.map(feature => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border dark:border-border">
                    <div>
                      <p className="text-2xl font-bold ink dark:text-foreground">
                        {industry.stats.businesses}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Active Users
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold ink dark:text-foreground">
                        {industry.stats.revenue}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Monthly
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary dark:text-blue-400">
                        {industry.stats.time}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Setup Time
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1"
                      onClick={e => {
                        e.stopPropagation()
                        router.push(industry.demoUrl)
                      }}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Try Demo
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={e => {
                        e.stopPropagation()
                        router.push(industry.buildUrl)
                      }}
                    >
                      <Building className="w-4 h-4 mr-1" />
                      Build Your Own
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Build Your Own CTA */}
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold ink dark:text-foreground mb-4">
                  Ready to Build Your Own?
                </h3>
                <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                  Choose any demo as your starting point and customize it for your business. Launch
                  with your own subdomain in minutes.
                </p>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground"
                  onClick={() => router.push('/auth/signup')}
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Building Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* More Industries Coming */}
      <section className="py-16 bg-background dark:bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-muted-foreground dark:text-muted-foreground mb-6">
            Don't see your industry? More templates coming soon:
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {[
              { icon: Factory, name: 'Manufacturing', coming: 'Q1 2025' },
              { icon: Store, name: 'Retail Store', coming: 'Q1 2025' },
              { icon: Briefcase, name: 'Consulting', coming: 'Q2 2025' },
              { icon: GraduationCap, name: 'Education', coming: 'Q2 2025' }
            ].map(item => (
              <Card key={item.name} className="p-6 text-center min-w-[200px]">
                <item.icon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <h4 className="font-semibold ink dark:text-foreground">{item.name}</h4>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                  {item.coming}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 bg-muted dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {valueProps.map(prop => (
              <div key={prop.title} className="text-center">
                <div className="inline-flex p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4">
                  <prop.icon className="w-6 h-6 text-primary dark:text-blue-400" />
                </div>
                <h3 className="font-semibold ink dark:text-foreground mb-2">
                  {prop.title}
                </h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-foreground">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Transform Your Business Today</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of businesses already using HERA. From discovery to deployment in under
            an hour.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="px-8 py-6 text-lg"
              onClick={() => router.push('/auth/signup')}
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg bg-transparent text-foreground border-white hover:bg-background/10"
              onClick={() =>
                document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Explore More Demos
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border dark:border-border">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-muted-foreground dark:text-muted-foreground">
            © 2024 HERA. Universal architecture that scales with your ambition.
          </p>
        </div>
      </footer>
    </div>
  )
}
