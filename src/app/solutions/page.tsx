'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Zap, Target, Users, Globe, Award } from 'lucide-react'
import SolutionCard from '@/components/solutions/SolutionCard'
import { SOLUTIONS } from '@/data/solutions'

// Statistics component
function SolutionStatistics() {
  const stats = [
    { value: '6', label: 'Industry Solutions', color: 'from-indigo-500 to-indigo-600' },
    { value: '500+', label: 'Active Organizations', color: 'from-purple-500 to-purple-600' },
    { value: '99.9%', label: 'Uptime SLA', color: 'from-cyan-500 to-cyan-600' },
    { value: '30 days', label: 'Avg Implementation', color: 'from-emerald-500 to-emerald-600' }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
      {stats.map((stat, idx) => (
        <div key={idx} className="relative group">
          <div
            className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-10 rounded-2xl blur-xl group-hover:opacity-20 transition-opacity`}
          />
          <div className="relative card-glass p-6 rounded-2xl border border-border text-center hover:border-indigo-500/30 transition-all duration-300">
            <div className="ink text-3xl font-bold mb-1">{stat.value}</div>
            <div className="ink-muted text-sm uppercase tracking-wide">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Value propositions section
function ValuePropositions() {
  const propositions = [
    {
      icon: Target,
      title: 'Industry-Specific',
      description:
        'Built for your industry with deep understanding of your workflows and challenges'
    },
    {
      icon: Users,
      title: 'Unified Platform',
      description:
        'All departments work from the same data, eliminating silos and improving collaboration'
    },
    {
      icon: Globe,
      title: 'Universal Architecture',
      description: 'One platform that adapts to any business without custom development'
    },
    {
      icon: Award,
      title: 'Proven Results',
      description: '500+ organizations trust HERA for their critical business operations'
    }
  ]

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-6">
            <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">
              💎 Why Choose HERA
            </span>
          </div>
          <h2 className="text-4xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              The Future of Business Software
            </span>
          </h2>
          <p className="ink-muted text-lg max-w-3xl mx-auto">
            Traditional ERP systems force you to adapt to their limitations. HERA adapts to your
            business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {propositions.map((prop, idx) => (
            <div key={idx} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all" />
              <div className="relative card-glass p-8 rounded-2xl border border-border hover:border-indigo-500/30 transition-all duration-300 text-center h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform">
                  <prop.icon className="w-8 h-8" />
                </div>
                <h3 className="ink text-lg font-semibold mb-3">{prop.title}</h3>
                <p className="ink-muted text-sm leading-relaxed">{prop.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Implementation process section
function ImplementationProcess() {
  const steps = [
    { icon: '🎯', title: 'Discovery', desc: 'Understand your workflow', time: 'Day 1-3' },
    { icon: '⚙️', title: 'Configuration', desc: 'Setup & customize', time: 'Week 1-2' },
    { icon: '🧪', title: 'Testing', desc: 'Validate with your team', time: 'Week 2-3' },
    { icon: '🚀', title: 'Go Live', desc: 'Deploy to production', time: 'Week 3-4' }
  ]

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 mb-6">
            <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              ⚡ Rapid Implementation
            </span>
          </div>
          <h2 className="text-4xl font-bold mb-6">
            <span className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Live in Weeks, Not Months
            </span>
          </h2>
          <p className="ink-muted text-lg max-w-3xl mx-auto">
            Our proven methodology gets you operational fast with minimal disruption to your
            business.
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 transform -translate-y-1/2" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-lg group-hover:shadow-xl transition-all duration-300 h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white text-3xl mb-4 mx-auto shadow-lg">
                    {step.icon}
                  </div>
                  <h3 className="ink text-lg font-bold mb-3 text-center">{step.title}</h3>
                  <p className="ink-muted text-sm text-center mb-4 min-h-[2.5rem] flex items-center justify-center">
                    {step.desc}
                  </p>
                  <p className="text-center">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {step.time}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Trust indicators section
function TrustIndicators() {
  const indicators = [
    { metric: '500+', label: 'Organizations Trust HERA' },
    { metric: '99.9%', label: 'Uptime Guarantee' },
    { metric: '30 days', label: 'Average Implementation' },
    { metric: '24/7', label: 'Enterprise Support' }
  ]

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 mb-6">
            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              🏆 Proven Track Record
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Trusted by Growing Businesses
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {indicators.map((indicator, idx) => (
            <div
              key={idx}
              className="group card-glass p-6 rounded-2xl border border-border hover:border-blue-500/30 transition-all duration-300 text-center"
            >
              <div className="ink text-4xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                {indicator.metric}
              </div>
              <div className="ink-muted text-sm uppercase tracking-wide">{indicator.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function SolutionsPage() {
  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden py-24 px-6">
        {/* Background gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            {/* Enhanced Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-8">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                Enterprise Solutions
              </span>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
              <span className="ink block mb-2">Industry Solutions</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400">
                That Transform Business
              </span>
            </h1>

            <p className="ink-muted text-xl md:text-2xl max-w-4xl mx-auto mb-12 leading-relaxed">
              From salons to manufacturing, ISPs to government—HERA's universal architecture adapts
              to your business.
              <span className="ink font-semibold"> One platform, infinite possibilities.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/demo"
                className="group relative overflow-hidden px-6 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Explore All Solutions
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
              <Link
                href="/pricing-request"
                className="px-6 py-3 rounded-xl text-base font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border transition-all duration-300 hover:scale-105"
              >
                Compare Plans
              </Link>
            </div>
          </div>

          {/* Statistics */}
          <SolutionStatistics />
        </div>
      </section>

      {/* Value Propositions */}
      <ValuePropositions />

      {/* Enhanced Solutions Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-6">
              <span className="text-cyan-600 dark:text-cyan-400 text-sm font-medium">
                🔧 Industry Solutions
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Choose Your Industry
              </span>
            </h2>
            <p className="ink-muted text-lg max-w-3xl mx-auto">
              Each solution is tailored to your industry's specific needs while leveraging HERA's
              universal foundation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SOLUTIONS.map(solution => (
              <SolutionCard key={solution.slug} {...solution} />
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Process */}
      <ImplementationProcess />

      {/* Trust Indicators */}
      <TrustIndicators />

      {/* Enhanced Final CTA Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Dark background with sophisticated gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black" />

        {/* Animated gradient overlays */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-cyan-600/30 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-cyan-600/30 via-emerald-600/20 to-blue-600/30 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 rounded-full blur-2xl" />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255,255,255) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-xl border border-gray-600/50 mb-8">
            <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-cyan-400 rounded-full animate-pulse" />
            <span className="text-gray-200 text-sm font-medium tracking-wide">
              Ready to Transform Your Business?
            </span>
            <div
              className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full animate-pulse"
              style={{ animationDelay: '0.5s' }}
            />
          </div>

          <h2 className="text-4xl md:text-5xl font-black mb-8">
            <span className="block bg-gradient-to-r from-white via-indigo-100 to-white bg-clip-text text-transparent mb-2">
              Find Your
            </span>
            <span className="block bg-gradient-to-r from-indigo-400 via-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Perfect Solution
            </span>
          </h2>

          <p className="text-lg md:text-xl mb-12 text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
            Not sure which solution fits your business? Our experts will help you identify the
            perfect match
            <span className="text-white font-medium">
              {' '}
              and show you how HERA transforms operations.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book-a-meeting"
              className="group relative overflow-hidden px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-cyan-600" />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 text-white flex items-center gap-2">
                Book Solution Consultation
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              href="/demo"
              className="px-6 py-3 rounded-xl text-base font-semibold bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/30 transition-all duration-300 hover:scale-105"
            >
              Explore All Demos
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-gray-400 text-sm">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800/30 backdrop-blur-sm border border-gray-700/50">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>No commitment required</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800/30 backdrop-blur-sm border border-gray-700/50">
              <span
                className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                style={{ animationDelay: '0.3s' }}
              />
              <span>15-minute consultation</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800/30 backdrop-blur-sm border border-gray-700/50">
              <span
                className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"
                style={{ animationDelay: '0.6s' }}
              />
              <span>Expert guidance</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
