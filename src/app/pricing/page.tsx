import type { Metadata } from 'next'
import Link from 'next/link'
import PricingConfigurator from '@/components/pricing/PricingConfigurator'
import Packages from '@/components/pricing/Packages'
import FAQ from '@/components/pricing/FAQ'

export const metadata: Metadata = {
  title: 'HERA ERP Pricing — Tailored to Your Scope',
  description:
    'Configure your HERA ERP solution and get transparent pricing based on your specific needs. No hidden costs, just honest scoping.'
}

// Value Props Component
function ValueProps() {
  const props = [
    { icon: '💰', title: 'No Hidden Fees', desc: 'Transparent pricing with all costs upfront' },
    {
      icon: '📊',
      title: 'Pay for What You Use',
      desc: 'Module-based pricing aligned to your needs'
    },
    { icon: '🚀', title: 'Scale As You Grow', desc: 'Flexible plans that grow with your business' },
    { icon: '🤝', title: 'Annual Savings', desc: 'Up to 20% discount on annual commitments' }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      {props.map((prop, idx) => (
        <div key={idx} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all" />
          <div className="relative card-glass p-6 rounded-2xl border border-border text-center">
            <div className="text-3xl mb-2">{prop.icon}</div>
            <div className="ink font-semibold text-sm mb-1">{prop.title}</div>
            <div className="ink-muted text-xs">{prop.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PricingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is pricing per-user or per-site?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We scope by modules and usage. User count and locations are inputs to determine the right package and pricing for your needs.'
        }
      },
      {
        '@type': 'Question',
        name: "What's the minimum term?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Choose monthly or annual contracts. Annual commitments unlock significant discounts and priority support.'
        }
      },
      {
        '@type': 'Question',
        name: 'How does onboarding work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We plan onboarding based on complexity. Use the configurator to see your estimated timeline. All packages include guided onboarding.'
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="w-full">
        {/* Hero Section with Enhanced Design */}
        <section className="relative overflow-hidden py-24 px-6">
          {/* Background gradients */}
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto">
            <div className="text-center mb-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 mb-6">
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  ✨ Transparent Pricing Model
                </span>
              </div>

              <h1 className="ink text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                ERP Pricing That
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  Makes Sense
                </span>
              </h1>

              <p className="ink-muted text-xl md:text-2xl max-w-3xl mx-auto mb-10">
                No hidden fees. No surprise costs. Configure your exact needs and get a transparent
                quote instantly. Start with what you need, scale when you're ready.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="#configurator"
                  className="px-6 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 border border-border shadow-lg hover:shadow-xl transition-all"
                >
                  Build Your Solution
                </Link>
                <Link
                  href="/book-a-meeting"
                  className="px-6 py-3 rounded-xl text-base font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border transition-all"
                >
                  Talk to Sales
                </Link>
              </div>
            </div>

            {/* Value Props */}
            <ValueProps />
          </div>
        </section>

        {/* How Pricing Works - Enhanced */}
        <section className="py-20 px-6 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-medium uppercase tracking-wider">
                  How It Works
                </span>
              </div>
              <h2 className="ink text-4xl font-bold mb-4">Simple, Transparent Process</h2>
              <p className="ink-muted text-lg max-w-2xl mx-auto">
                Our pricing model is designed to be fair, flexible, and aligned with your business
                growth
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:via-indigo-500/10 group-hover:to-purple-500/10 rounded-2xl blur-xl transition-all duration-500" />
                <div className="relative card-glass p-8 rounded-2xl border border-border group-hover:border-indigo-500/30 transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl mb-5">
                    📦
                  </div>
                  <h3 className="ink text-xl font-bold mb-3">Module-Based Pricing</h3>
                  <p className="ink-muted text-sm leading-relaxed mb-4">
                    Pay only for the modules you use. Start with essentials and add capabilities as
                    your business grows.
                  </p>
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                    <span>Learn more</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-rose-500/0 group-hover:from-purple-500/10 group-hover:via-pink-500/10 group-hover:to-rose-500/10 rounded-2xl blur-xl transition-all duration-500" />
                <div className="relative card-glass p-8 rounded-2xl border border-border group-hover:border-purple-500/30 transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl mb-5">
                    🚀
                  </div>
                  <h3 className="ink text-xl font-bold mb-3">Smart Onboarding</h3>
                  <p className="ink-muted text-sm leading-relaxed mb-4">
                    Timeline and complexity based on your actual needs. Most implementations go live
                    in 2-4 weeks.
                  </p>
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm font-medium">
                    <span>View timeline</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-cyan-500/0 to-blue-500/0 group-hover:from-emerald-500/10 group-hover:via-cyan-500/10 group-hover:to-blue-500/10 rounded-2xl blur-xl transition-all duration-500" />
                <div className="relative card-glass p-8 rounded-2xl border border-border group-hover:border-emerald-500/30 transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white text-2xl mb-5">
                    🔧
                  </div>
                  <h3 className="ink text-xl font-bold mb-3">Flexible Support</h3>
                  <p className="ink-muted text-sm leading-relaxed mb-4">
                    Choose your support level and integration needs. Upgrade or downgrade anytime as
                    requirements change.
                  </p>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    <span>Support options</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Configurator Section - Enhanced */}
        <section id="configurator" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                <span className="text-purple-600 dark:text-purple-400 text-xs font-medium uppercase tracking-wider">
                  Interactive Configurator
                </span>
              </div>
              <h2 className="ink text-4xl font-bold mb-4">Build Your Custom Solution</h2>
              <p className="ink-muted text-lg">
                Select your modules and requirements to get an instant recommendation
              </p>
            </div>
            <PricingConfigurator />
          </div>
        </section>

        {/* Packages Section - Enhanced */}
        <section className="py-20 px-6 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                <span className="text-cyan-600 dark:text-cyan-400 text-xs font-medium uppercase tracking-wider">
                  Tailored Packages
                </span>
              </div>
              <h2 className="ink text-4xl font-bold mb-4">Choose Your Growth Path</h2>
              <p className="ink-muted text-lg max-w-2xl mx-auto">
                Each package is designed for different stages of business maturity and complexity
              </p>
            </div>
            <Packages />
          </div>
        </section>

        {/* Onboarding Timeline - Enhanced */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium uppercase tracking-wider">
                  Fast Implementation
                </span>
              </div>
              <h2 className="ink text-4xl font-bold mb-4">Go Live in Weeks, Not Months</h2>
              <p className="ink-muted text-lg max-w-2xl mx-auto">
                Our proven onboarding process gets you operational quickly with minimal disruption
              </p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transform -translate-y-1/2" />

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: '📋',
                    title: 'Kickoff',
                    desc: 'Requirements gathering and planning',
                    time: 'Day 1-3',
                    color: 'from-blue-500 to-indigo-600'
                  },
                  {
                    icon: '⚙️',
                    title: 'Configure',
                    desc: 'Setup modules and workflows',
                    time: 'Week 1-2',
                    color: 'from-indigo-500 to-purple-600'
                  },
                  {
                    icon: '✅',
                    title: 'Validate',
                    desc: 'Test with your team',
                    time: 'Week 2-3',
                    color: 'from-purple-500 to-pink-600'
                  },
                  {
                    icon: '🎯',
                    title: 'Go Live',
                    desc: 'Launch to production',
                    time: 'Week 3-4',
                    color: 'from-emerald-500 to-cyan-600'
                  }
                ].map((step, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-lg group-hover:shadow-xl transition-all duration-300 h-full">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-3xl mb-4 mx-auto shadow-lg`}
                      >
                        {step.icon}
                      </div>
                      <h3 className="ink text-lg font-bold mb-3 text-center">{step.title}</h3>
                      <p className="ink-muted text-sm text-center mb-4 min-h-[2.5rem] flex items-center justify-center">
                        {step.desc}
                      </p>
                      <p className="text-center">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
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

        {/* FAQ Section - Enhanced */}
        <section className="py-20 px-6 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-medium uppercase tracking-wider">
                  Common Questions
                </span>
              </div>
              <h2 className="ink text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="ink-muted text-lg">
                Everything you need to know about our pricing model
              </p>
            </div>
            <FAQ />
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="ink text-2xl font-bold mb-8">
                Trusted by Forward-Thinking Businesses
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { metric: '2-4 weeks', label: 'Average go-live time' },
                { metric: '99.9%', label: 'Uptime guarantee' },
                { metric: '24/7', label: 'Support availability' },
                { metric: '50+', label: 'Integration partners' }
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="ink text-3xl font-bold mb-1">{stat.metric}</div>
                  <div className="ink-muted text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA - Dark Theme with Dramatic Gradients */}
        <section className="relative py-32 px-6 overflow-hidden">
          {/* Dark background with dramatic gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black" />

          {/* Animated gradient overlays */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-600/40 via-indigo-600/30 to-purple-600/40 rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-purple-600/40 via-pink-600/30 to-rose-600/40 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '1s' }}
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-full blur-2xl" />
          </div>

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255,255,255) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}
          />

          <div className="relative max-w-6xl mx-auto">
            <div className="text-center">
              {/* Premium badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-xl border border-gray-600/50 mb-8">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
                <span className="text-gray-200 text-sm font-medium tracking-wide">
                  Transform Your Business Today
                </span>
                <div
                  className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"
                  style={{ animationDelay: '0.5s' }}
                />
              </div>

              {/* Main heading with dramatic gradient */}
              <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
                <span className="block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent mb-2">
                  Ready to
                </span>
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                  Transform Everything?
                </span>
              </h2>

              {/* Subtitle with better typography */}
              <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
                Join hundreds of forward-thinking companies revolutionizing their operations.
                <span className="text-white font-medium">
                  {' '}
                  Experience HERA's power with real data testing.
                </span>
              </p>

              {/* Enhanced CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  href="/pricing-request"
                  className="group relative overflow-hidden px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                >
                  {/* Button background with animated gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 animate-gradient" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-12 group-hover:animate-[shimmer_1.5s_ease-in-out]" />
                  </div>

                  <span className="relative z-10 text-white flex items-center gap-2">
                    Get Your Custom Quote
                    <svg
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                </Link>

                <Link
                  href="/demo"
                  className="group px-6 py-3 rounded-xl text-sm font-semibold bg-gray-800/50 backdrop-blur-xl text-white hover:bg-gray-700/60 border border-gray-600/50 hover:border-gray-500/70 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full" />
                    Try Live Demo
                  </span>
                </Link>
              </div>

              {/* Enhanced trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400 text-sm">
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800/30 backdrop-blur-sm border border-gray-700/50">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800/30 backdrop-blur-sm border border-gray-700/50">
                  <span
                    className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                    style={{ animationDelay: '0.3s' }}
                  />
                  <span>Real data testing</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800/30 backdrop-blur-sm border border-gray-700/50">
                  <span
                    className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                    style={{ animationDelay: '0.6s' }}
                  />
                  <span>Instant access</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
