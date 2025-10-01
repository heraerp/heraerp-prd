import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Package,
  CreditCard,
  Users,
  Wrench,
  BarChart3,
  ArrowRight,
  Star,
  CheckCircle
} from 'lucide-react'

export default function JewelryDocsPage() {
  const docSections = [
    {
      title: 'Getting Started',
      description: 'Setup and configuration guide for HERA Jewelry ERP',
      icon: BookOpen,
      href: '/docs/jewelry/getting-started',
      topics: ['Initial Setup', 'System Requirements', 'User Management', 'Quick Start Guide']
    },
    {
      title: 'Inventory Management',
      description: 'Track diamonds, gemstones, metals, and finished jewelry',
      icon: Package,
      href: '/docs/jewelry/inventory',
      topics: ['Diamond Tracking', 'Metal Purity', 'Valuation Methods', 'Stock Management']
    },
    {
      title: 'Point of Sale (POS)',
      description: 'Professional transaction processing and payment handling',
      icon: CreditCard,
      href: '/docs/jewelry/pos',
      topics: ['Payment Processing', 'Customer Lookup', 'Transaction Types', 'Mobile POS']
    },
    {
      title: 'Customer Management',
      description: 'VIP programs, loyalty, and relationship management',
      icon: Users,
      href: '/docs/jewelry/customers',
      topics: ['VIP Tiers', 'Purchase History', 'Loyalty Programs', 'Communication']
    },
    {
      title: 'Repair Services',
      description: 'Workshop management and work order tracking',
      icon: Wrench,
      href: '/docs/jewelry/repairs',
      topics: ['Work Orders', 'Quality Control', 'Craftsman Assignment', 'Progress Tracking']
    },
    {
      title: 'Reports & Analytics',
      description: 'Business intelligence and predictive analytics',
      icon: BarChart3,
      href: '/docs/jewelry/analytics',
      topics: [
        'Real-time Dashboards',
        'Predictive Analytics',
        'Custom Reports',
        'Performance Metrics'
      ]
    }
  ]

  const features = [
    'Complete jewelry business management',
    'Industry-specific tracking and analytics',
    'Professional point-of-sale system',
    'Advanced customer relationship management',
    'Workshop and repair service management',
    'Real-time business intelligence'
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          HERA Jewelry ERP Documentation
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive guides and documentation for the world's most advanced jewelry business
          management platform. Everything you need to set up, configure, and optimize your jewelry
          operations.
        </p>
      </div>

      {/* Key Features */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {docSections.map((section, index) => {
          const IconComponent = section.icon
          return (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
                <CardDescription className="text-sm">{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {section.topics.map((topic, topicIndex) => (
                    <div
                      key={topicIndex}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                      {topic}
                    </div>
                  ))}
                </div>
                <Link href={section.href}>
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    Read Documentation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Begin with our comprehensive getting started guide to set up your jewelry business
            management system in minutes.
          </p>
          <Link href="/docs/jewelry/getting-started">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Start with Setup Guide
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-12 pt-8 border-t">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Need help? Contact our support team for personalized assistance.
          </div>
          <div className="flex gap-4">
            <Link href="/docs" className="text-sm text-primary hover:underline">
              ← Back to All Documentation
            </Link>
            <Link href="/jewelry" className="text-sm text-primary hover:underline">
              Go to Jewelry Module →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
