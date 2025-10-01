'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Store,
  Scissors,
  Heart,
  Factory,
  Briefcase,
  Building2,
  LogOut,
  User,
  ArrowRight,
  Lock,
  Clock,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  PlayCircle,
  Globe,
  LineChart,
  Wifi,
  DollarSign
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const demos = [
  {
    id: 'salon',
    name: 'Salon & Beauty ERP',
    description: 'Complete salon management with appointments, stylists, inventory and memberships',
    icon: Scissors,
    href: '/demo/salon',
    gradient: 'from-purple-500 to-pink-600',
    stats: { users: '12+', rating: '4.9', uptime: '99.9%' },
    features: [
      'Online Booking',
      'Chair & Room Scheduling',
      'POS & Packages',
      'Commission Tracking'
    ],
    available: true,
    popular: true
  },
  {
    id: 'isp',
    name: 'ISP Operations',
    description: 'Complete ISP management with provisioning, tickets, billing and field operations',
    icon: Wifi,
    href: '/isp',
    gradient: 'from-blue-500 to-cyan-600',
    stats: { users: '8+', rating: '4.8', uptime: '99.9%' },
    features: ['Plans & Billing', 'Ticketing System', 'Network Inventory', 'Field Operations'],
    available: true
  },
  {
    id: 'crm',
    name: 'CRM Platform',
    description: 'Pipeline, accounts and activities management that stays up-to-date',
    icon: LineChart,
    href: '/crm',
    gradient: 'from-indigo-500 to-purple-600',
    stats: { users: '10+', rating: '4.7', uptime: '99.9%' },
    features: ['Deals & Stages', 'Tasks & Email Sync', 'Simple Reporting', 'Contact Management'],
    available: true
  },
  {
    id: 'civicflow',
    name: 'CivicFlow',
    description: 'From applications to outcomes—transparent, auditable public sector delivery',
    icon: Building2,
    href: '/civicflow-auth',
    gradient: 'from-emerald-500 to-teal-600',
    stats: { users: '7+', rating: '4.9', uptime: '99.9%' },
    features: ['Grant Workflows', 'Reviews & Scoring', 'Impact Tracking', 'Compliance'],
    available: true
  },
  {
    id: 'furniture',
    name: 'Furniture Manufacturing',
    description: 'End-to-end manufacturing from quotes to production to delivery',
    icon: Factory,
    href: '/furniture',
    gradient: 'from-orange-500 to-amber-600',
    stats: { users: '5+', rating: '4.8', uptime: '99.9%' },
    features: ['BOMs & Orders', 'Work Orders', 'Inventory & Dispatch', 'Quality Control'],
    available: true
  },
  {
    id: 'finance',
    name: 'Finance & Accounting',
    description: 'Complete financial management with sales, purchases, journals and reporting',
    icon: DollarSign,
    href: '/finance',
    gradient: 'from-green-500 to-emerald-600',
    stats: { users: '8+', rating: '4.7', uptime: '99.9%' },
    features: ['AP/AR Management', 'Journal Entries', 'P&L & Cash View', 'Financial Reports'],
    available: true
  }
]

interface CurrentSession {
  user: any
  organizationId: string | null
  demoType: string | null
  userRole: string | null
}

// Stats Component
function DemoStats() {
  const stats = [
    { value: '6', label: 'Industry Solutions', icon: '🏢' },
    { value: '50+', label: 'Early Access Users', icon: '👥' },
    { value: '4.8/5', label: 'Average Rating', icon: '⭐' },
    { value: 'Free', label: 'Demo Access', icon: '🎁' }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
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

export default function DemoPage() {
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    checkCurrentSession()
  }, [])

  const checkCurrentSession = async () => {
    try {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession()

      if (error) {
        console.log('Session error:', error)
        setLoading(false)
        return
      }

      if (session?.user) {
        const organizationId = localStorage.getItem('organizationId')
        const currentRole = localStorage.getItem('currentRole')

        let demoType = null
        if (organizationId === 'hair-talkz-salon-org-uuid') {
          demoType = 'salon'
        } else if (organizationId === '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77') {
          demoType = 'civicflow'
        }
        // Add checks for other demo types as needed

        setCurrentSession({
          user: session.user,
          organizationId,
          demoType,
          userRole: currentRole
        })
      }
    } catch (error) {
      console.error('Error checking session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Clear localStorage
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (
          key.includes('auth') ||
          key.includes('org') ||
          key.includes('demo') ||
          key.includes('supabase') ||
          key.includes('Role')
        ) {
          localStorage.removeItem(key)
        }
      })

      await supabase.auth.signOut()
      setCurrentSession(null)
      setShowLogoutConfirm(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getDemoDisplayName = (demoType: string | null) => {
    const demo = demos.find(d => d.id === demoType)
    return demo?.name || 'Unknown Demo'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="ink-muted">Loading demo gallery...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6">
        {/* Background gradients */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 mb-8">
              <PlayCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                Interactive Live Demos
              </span>
            </div>

            <h1 className="ink text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Experience HERA
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                In Action
              </span>
            </h1>

            <p className="ink-muted text-xl md:text-2xl max-w-3xl mx-auto mb-12">
              Explore fully-functional demos across different industries. See how HERA adapts to
              your specific business needs.
            </p>

            {/* Demo Stats */}
            <DemoStats />
          </div>
        </div>
      </section>

      {/* Current Session Banner */}
      {currentSession && (
        <section className="py-8 px-6 bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/30 dark:to-slate-950">
          <div className="max-w-7xl mx-auto">
            <div className="card-glass p-6 rounded-2xl border-2 border-blue-500/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="ink text-lg font-semibold">
                      Active Session: {getDemoDisplayName(currentSession.demoType)}
                    </h3>
                    <p className="ink-muted text-sm">
                      {currentSession.user.email} • {currentSession.userRole || 'Demo User'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  End Session
                </button>
              </div>
              <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  💡 <strong>Tip:</strong> To explore a different demo, end your current session
                  first for the best experience.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Demo Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
              <span className="text-indigo-600 dark:text-indigo-400 text-xs font-medium uppercase tracking-wider">
                Choose Your Industry
              </span>
            </div>
            <h2 className="ink text-4xl md:text-5xl font-bold mb-4">Select a Demo to Explore</h2>
            <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto">
              Each demo is a fully-functional system with sample data. No setup required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {demos.map(demo => {
              const Icon = demo.icon
              const isActive = currentSession?.demoType === demo.id

              return (
                <div key={demo.id} className="relative group">
                  {/* Popular badge */}
                  {demo.popular && (
                    <div className="absolute -top-3 -right-3 z-10">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold shadow-lg">
                        <Award className="w-3 h-3" />
                        Popular
                      </span>
                    </div>
                  )}

                  <div className={`relative h-full ${!demo.available ? 'opacity-75' : ''}`}>
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${demo.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-all duration-500`}
                    />
                    <div
                      className={`relative card-glass p-8 rounded-2xl border ${isActive ? 'border-blue-500' : 'border-border'} hover:border-indigo-500/30 transition-all duration-300 h-full flex flex-col`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div
                          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${demo.gradient} flex items-center justify-center text-white`}
                        >
                          <Icon className="w-7 h-7" />
                        </div>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <h3 className="ink text-xl font-bold mb-2">{demo.name}</h3>
                      <p className="ink-muted text-sm mb-4 flex-grow">{demo.description}</p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {demo.features.slice(0, 3).map((feature, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-6 text-xs">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-indigo-500" />
                          <span className="ink-muted">{demo.stats.users}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <span className="ink-muted">{demo.stats.rating}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-500" />
                          <span className="ink-muted">{demo.stats.uptime}</span>
                        </span>
                      </div>

                      {/* Action Button */}
                      {demo.available ? (
                        <Link
                          href={demo.href}
                          className={`w-full px-6 py-3 rounded-xl font-medium text-center transition-all flex items-center justify-center gap-2 ${
                            isActive
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                          }`}
                        >
                          {isActive ? 'Continue Demo' : 'Launch Demo'}
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <div className="w-full px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
                          <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                            <Lock className="w-4 h-4" />
                            <span className="font-medium">Coming {demo.comingSoon}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
              <span className="text-purple-600 dark:text-purple-400 text-xs font-medium uppercase tracking-wider">
                Demo Features
              </span>
            </div>
            <h2 className="ink text-4xl md:text-5xl font-bold mb-4">
              What's Included in Every Demo
            </h2>
            <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto">
              Each demo environment comes with everything you need to evaluate HERA.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Real Sample Data',
                description:
                  'Populated with realistic business data so you can see actual workflows in action.',
                icon: '📊'
              },
              {
                title: 'Full Functionality',
                description:
                  'Complete access to all features and modules. Nothing is restricted or limited.',
                icon: '🚀'
              },
              {
                title: 'Multiple User Roles',
                description:
                  'Switch between different roles to see various permission levels and workflows.',
                icon: '👥'
              },
              {
                title: 'Reset Anytime',
                description: 'Made a mistake? Reset your demo data to start fresh at any time.',
                icon: '🔄'
              },
              {
                title: 'No Time Limits',
                description: 'Take as long as you need. Demos never expire and are always free.',
                icon: '⏰'
              },
              {
                title: 'Export Your Work',
                description: "Export configurations and data to use when you're ready to go live.",
                icon: '💾'
              }
            ].map((feature, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl blur-xl group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all" />
                <div className="relative card-glass p-6 rounded-2xl h-full">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="ink font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="ink-muted text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card-glass p-12 rounded-3xl border border-border">
            <h2 className="ink text-3xl md:text-4xl font-bold mb-4">
              Ready to See HERA in Action?
            </h2>
            <p className="ink-muted text-lg mb-8 max-w-2xl mx-auto">
              Choose any demo above to experience how HERA can transform your business operations.
              No credit card required, no time limits.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="#"
                onClick={e => {
                  e.preventDefault()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="px-8 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all"
              >
                Explore Demos
              </Link>
              <Link
                href="/book-a-meeting"
                className="px-8 py-3 rounded-xl text-base font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border transition-all"
              >
                Get Guided Tour
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-glass rounded-2xl p-8 max-w-md w-full">
            <h3 className="ink text-xl font-semibold mb-4">End Demo Session?</h3>
            <p className="ink-muted mb-6">
              You're about to end your session with{' '}
              <strong className="ink">{getDemoDisplayName(currentSession?.demoType)}</strong>. You
              can always come back and continue where you left off.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
              >
                End Session
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
