import { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Building,
  Check,
  PlayCircle,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Award
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'HERA ERP - Enterprise Business Platform That Scales',
  description:
    'Deploy enterprise-grade business applications in 30 seconds. Flexible architecture that adapts to any industry without code changes. Now in beta with invited customers only.'
}

// Stats Component
function PlatformStats() {
  const stats = [
    { value: '< 5 min', label: 'Setup Time', icon: '⚡' },
    { value: '99.9%', label: 'Platform Uptime', icon: '🛡️' },
    { value: '6', label: 'Industry Solutions', icon: '🏢' },
    { value: '24/7', label: 'Global Support', icon: '🌍' }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all" />
          <div className="relative card-glass p-6 rounded-2xl border border-border text-center">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="ink text-2xl font-bold mb-1">{stat.value}</div>
            <div className="ink-muted text-xs uppercase tracking-wider">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Trust Indicators Component
function TrustIndicators() {
  const indicators = [
    'SOC2 Type II Certified',
    'GDPR Compliant',
    'ISO 27001 Certified',
    '99.9% Uptime SLA'
  ]

  return (
    <div className="flex flex-wrap justify-center gap-6">
      {indicators.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span className="ink-muted text-sm">{item}</span>
        </div>
      ))}
    </div>
  )
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, color }: any) {
  return (
    <div className="relative group">
      <div
        className={`absolute inset-0 bg-gradient-to-r ${color} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`}
      />
      <div className="relative card-glass p-8 rounded-2xl border border-border hover:border-indigo-500/30 transition-all duration-300 h-full">
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-2xl mb-5`}
        >
          {typeof Icon === 'string' ? Icon : <Icon className="w-7 h-7" />}
        </div>
        <h3 className="ink text-xl font-bold mb-3">{title}</h3>
        <p className="ink-muted text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="w-full">
      {/* Hero Section - Enterprise Grade */}
      <section className="relative overflow-hidden py-24 px-6">
        {/* Animated background gradients */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/15 to-violet-500/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            {/* Beta Access Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 backdrop-blur-sm mb-8 shadow-lg">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-300 dark:text-indigo-300 text-sm font-semibold tracking-wide">
                BETA • Invited Customers Only
              </span>
            </div>

            <h1 className="ink text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Run Your Entire Business
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                In One Beautiful Platform
              </span>
            </h1>

            <p className="ink-muted text-xl md:text-2xl max-w-4xl mx-auto mb-12 leading-relaxed">
              HERA transforms how businesses operate. Explore live demos of real companies, then
              build your own customized version in minutes.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link
                href="/demo"
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 border border-border shadow-lg hover:shadow-xl transition-all"
              >
                <PlayCircle className="inline-block w-5 h-5 mr-2" />
                Explore Live Demos
              </Link>
              <Link
                href="/book-a-meeting"
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Platform Stats */}
            <PlatformStats />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 px-6 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
        <div className="max-w-7xl mx-auto">
          <TrustIndicators />
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
              <span className="text-indigo-600 dark:text-indigo-400 text-xs font-medium uppercase tracking-wider">
                Why HERA
              </span>
            </div>
            <h2 className="ink text-4xl md:text-5xl font-bold mb-4">
              The Platform That Transforms Business
            </h2>
            <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto">
              Stop juggling disconnected tools. Get everything you need in one unified platform.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Zap}
              title="Lightning Fast Deployment"
              description="Go from sign-up to fully operational in 30 seconds. No implementation team required. Start seeing ROI immediately."
              color="from-blue-500 to-cyan-600"
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise-Grade Security"
              description="Bank-level encryption, SOC2 compliance, and complete data isolation. Your data is safer with us than on your own servers."
              color="from-purple-500 to-pink-600"
            />
            <FeatureCard
              icon={Globe}
              title="Infinitely Scalable"
              description="From startup to enterprise, single location to global operations. The same platform grows with your ambitions."
              color="from-emerald-500 to-green-600"
            />
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
              <span className="text-purple-600 dark:text-purple-400 text-xs font-medium uppercase tracking-wider">
                Industry Solutions
              </span>
            </div>
            <h2 className="ink text-4xl md:text-5xl font-bold mb-4">Built for Your Industry</h2>
            <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto">
              Pre-configured solutions that understand your business from day one.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Salon & Beauty',
                icon: '💇',
                desc: 'Appointments, inventory & POS',
                href: '/salon',
                available: true
              },
              {
                name: 'ISP Operations',
                icon: '🌐',
                desc: 'Provisioning, billing & tickets',
                href: '/demo',
                available: true
              },
              {
                name: 'CRM Platform',
                icon: '👥',
                desc: 'Pipeline, accounts & activities',
                href: '/demo',
                available: true
              },
              {
                name: 'CivicFlow',
                icon: '🏛️',
                desc: 'Grants, reviews & tracking',
                href: '/civicflow-auth',
                available: true
              },
              {
                name: 'Manufacturing',
                icon: '🏭',
                desc: 'Production, inventory & delivery',
                href: '/demo',
                available: true
              },
              {
                name: 'Finance & Accounting',
                icon: '💰',
                desc: 'AP/AR, journals & reporting',
                href: '/demo',
                available: true
              }
            ].map((industry, idx) => (
              <Link key={idx} href={industry.href} className="group relative block">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 rounded-2xl blur-xl transition-all" />
                <div className="relative card-glass p-6 rounded-2xl border border-border hover:border-indigo-500/30 transition-all">
                  <div className="text-4xl mb-4">{industry.icon}</div>
                  <h3 className="ink font-semibold text-lg mb-2">{industry.name}</h3>
                  <p className="ink-muted text-sm">{industry.desc}</p>
                  {industry.available && (
                    <div className="mt-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <span className="text-sm font-medium">Try Demo</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/solutions"
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:gap-3 transition-all"
            >
              Explore all solutions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <span className="text-cyan-600 dark:text-cyan-400 text-xs font-medium uppercase tracking-wider">
                Platform Capabilities
              </span>
            </div>
            <h2 className="ink text-4xl md:text-5xl font-bold mb-4">
              Everything You Need, Nothing You Don't
            </h2>
            <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto">
              A complete suite of business tools that work together seamlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="📊"
              title="Financial Management"
              description="Complete accounting, budgeting, and financial reporting. Real-time insights into your business health."
              color="from-blue-500 to-indigo-600"
            />
            <FeatureCard
              icon="👥"
              title="Customer Relationship"
              description="Track leads, manage customers, and nurture relationships. Built-in marketing automation and analytics."
              color="from-purple-500 to-violet-600"
            />
            <FeatureCard
              icon="📦"
              title="Inventory & Supply Chain"
              description="Real-time inventory tracking, automated reordering, and complete supply chain visibility."
              color="from-emerald-500 to-teal-600"
            />
            <FeatureCard
              icon="👷"
              title="Human Resources"
              description="Employee management, payroll processing, and performance tracking. Compliance built-in."
              color="from-amber-500 to-orange-600"
            />
            <FeatureCard
              icon="📈"
              title="Sales & Marketing"
              description="Pipeline management, campaign tracking, and revenue optimization. AI-powered insights included."
              color="from-pink-500 to-rose-600"
            />
            <FeatureCard
              icon="🔧"
              title="Operations & Projects"
              description="Project tracking, resource allocation, and workflow automation. Keep everything on schedule."
              color="from-cyan-500 to-blue-600"
            />
          </div>
        </div>
      </section>

      {/* Implementation Process */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
              <span className="text-indigo-600 dark:text-indigo-400 text-xs font-medium uppercase tracking-wider">
                Getting Started
              </span>
            </div>
            <h2 className="ink text-4xl md:text-5xl font-bold mb-4">Up and Running in Minutes</h2>
            <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto">
              Our revolutionary approach eliminates traditional ERP complexity.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                title: 'Sign Up',
                desc: 'Create your account in seconds',
                time: '30 sec'
              },
              {
                step: '2',
                title: 'Choose Industry',
                desc: 'Select your pre-configured template',
                time: '10 sec'
              },
              {
                step: '3',
                title: 'Import Data',
                desc: 'Upload or connect existing systems',
                time: '2 min'
              },
              {
                step: '4',
                title: 'Go Live',
                desc: 'Start using your complete platform',
                time: 'Instant'
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 -translate-y-1/2 z-0" />
                )}
                <div className="relative card-glass p-6 rounded-2xl text-center z-10 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="ink font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="ink-muted text-sm mb-4 flex-grow">{item.desc}</p>
                  <div className="mt-auto">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {item.time}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Enterprise Grade */}
      <section className="relative py-24 px-6 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
        {/* Sophisticated gradient overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full card-glass border border-indigo-500/30 backdrop-blur-sm shadow-lg mb-6">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-semibold tracking-wide">
              BETA ACCESS • INVITED CUSTOMERS ONLY
            </span>
          </div>

          <h2 className="ink text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Ready to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Transform
            </span>{' '}
            Your Business?
          </h2>

          <p className="ink-muted text-xl mb-10 max-w-3xl mx-auto">
            Join our exclusive beta program with select enterprise customers. Experience HERA's revolutionary platform with dedicated support and priority access to new features.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link
              href="/get-started"
              className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 border border-indigo-500/20 shadow-lg hover:shadow-xl transition-all"
            >
              Apply for Beta Access
            </Link>
            <Link
              href="/book-a-meeting"
              className="px-5 py-2.5 text-sm font-medium card-glass ink border border-border rounded-xl hover:border-indigo-500/30 transition-all"
            >
              Schedule Demo
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 ink-muted text-sm">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> Enterprise-grade security
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> 5-minute setup
            </span>
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-500" /> Global infrastructure
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}
