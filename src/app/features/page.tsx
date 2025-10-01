// ================================================================================
// HERA FEATURES PAGE
// Smart Code: HERA.PAGE.FEATURES.PUBLIC.V1
// Public features overview page
// ================================================================================

import Link from 'next/link'
import {
  Sparkles,
  Database,
  Shield,
  Zap,
  Globe,
  Code,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Layers,
  RefreshCw,
  Lock,
  Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="pt-16 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-5xl lg:text-6xl font-bold ink mb-6">
              Features That Set HERA Apart
            </h1>
            <p className="text-xl ink-muted">
              Revolutionary universal architecture that adapts to any business, powered by AI and
              built for the future.
            </p>
          </div>

          {/* Core Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Database,
                title: 'Universal 6-Table Schema',
                description:
                  'Our revolutionary architecture handles infinite business complexity with just 6 universal tables. No schema changes ever needed.',
                gradient: 'from-blue-600 to-cyan-600'
              },
              {
                icon: Shield,
                title: 'Perfect Multi-Tenancy',
                description:
                  'Sacred organization_id boundary ensures complete data isolation. Your data is always secure and separate.',
                gradient: 'from-purple-600 to-pink-600'
              },
              {
                icon: Zap,
                title: '30-Second Setup',
                description:
                  'Complete business system ready in seconds, not months. Pre-built industry templates get you started instantly.',
                gradient: 'from-orange-600 to-red-600'
              },
              {
                icon: Globe,
                title: 'Any Industry',
                description:
                  'Same platform works for salon, restaurant, healthcare, retail, and more. True universal business platform.',
                gradient: 'from-green-600 to-emerald-600'
              },
              {
                icon: Code,
                title: 'AI-Native Architecture',
                description:
                  'Smart Codes on every data point enable built-in intelligence, automated workflows, and predictive insights.',
                gradient: 'from-indigo-600 to-purple-600'
              },
              {
                icon: BarChart3,
                title: 'Real-Time Analytics',
                description:
                  'Live dashboards and reports that update as your business operates. No waiting for batch processing.',
                gradient: 'from-yellow-600 to-orange-600'
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="ink-muted">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Enterprise-Ready Platform</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Security & Compliance</h3>
              <div className="space-y-4">
                {[
                  'Row-level security (RLS) on all data',
                  'JWT authentication with organization context',
                  'GDPR & HIPAA compliant architecture',
                  'Automatic audit trails on all operations',
                  'Encrypted data at rest and in transit',
                  'Role-based access control (RBAC)'
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="ink">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-6">Developer Experience</h3>
              <div className="space-y-4">
                {[
                  'Universal API for all operations',
                  'TypeScript with full type safety',
                  'React 19 with Next.js 15',
                  'MCP (Model Context Protocol) ready',
                  'Comprehensive CLI tools',
                  'Mock mode for offline development'
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="ink">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unique Features */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Unique HERA Innovations</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Layers,
                title: 'Universal Architecture',
                description: 'One system for all business types'
              },
              {
                icon: RefreshCw,
                title: 'Dynamic Fields',
                description: 'Add custom fields without schema changes'
              },
              {
                icon: Lock,
                title: 'Sacred Boundaries',
                description: 'Perfect multi-tenant isolation'
              },
              {
                icon: Smartphone,
                title: 'PWA First',
                description: 'Works offline, installable on any device'
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 text-center">
                <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm ink-muted">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="py-16 px-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Industry-Specific Solutions</h2>
          <p className="text-center ink-muted mb-12 max-w-2xl mx-auto">
            HERA's universal architecture adapts perfectly to any industry. Each implementation
            includes industry-specific workflows, reports, and integrations.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                industry: 'Salon & Spa',
                features: [
                  'Appointment booking',
                  'Staff scheduling',
                  'Commission tracking',
                  'Product inventory'
                ],
                icon: Sparkles,
                color: 'text-purple-600'
              },
              {
                industry: 'Restaurant',
                features: [
                  'Order management',
                  'Kitchen display',
                  'Table management',
                  'Menu engineering'
                ],
                icon: Users,
                color: 'text-orange-600'
              },
              {
                industry: 'Healthcare',
                features: [
                  'Patient records',
                  'Appointment scheduling',
                  'Insurance billing',
                  'Prescription tracking'
                ],
                icon: Shield,
                color: 'text-blue-600'
              }
            ].map((solution, index) => (
              <Card key={index} className="p-6">
                <solution.icon className={`w-8 h-8 ${solution.color} mb-4`} />
                <h3 className="text-xl font-semibold mb-3">{solution.industry}</h3>
                <ul className="space-y-2">
                  {solution.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm ink-muted">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href={`/${solution.industry.toLowerCase().replace(' & ', '-')}`}>
                    View Demo →
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Experience HERA's Revolutionary Features</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join the future of business management with HERA's universal platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white/10"
              asChild
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="ink-muted text-sm">© 2024 HERA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
