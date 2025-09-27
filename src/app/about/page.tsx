import { Metadata } from 'next'
import Link from 'next/link'
import { LEADERS } from '@/data/about'
import LeaderCard from '@/components/about/LeaderCard'
import ApproachGrid from '@/components/about/ApproachGrid'
import ValuesGrid from '@/components/about/ValuesGrid'
import Timeline from '@/components/about/Timeline'
import Footprint from '@/components/about/Footprint'
import PressCta from '@/components/about/PressCta'

export const metadata: Metadata = {
  title: 'About HERA — Building the Future of Business Software',
  description:
    "Learn about HERA's mission to simplify business operations with flexible platform design that scales from startups to enterprises.",
  openGraph: {
    title: 'About HERA — Building the Future of Business Software',
    description:
      "Learn about HERA's mission to simplify business operations with flexible platform design that scales from startups to enterprises.",
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About HERA — Building the Future of Business Software',
    description:
      "Learn about HERA's mission to simplify business operations with flexible platform design."
  }
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'HERA',
  description: 'Business platform simplifying operations across industries',
  url: 'https://heraerp.com',
  logo: 'https://heraerp.com/logo.png',
  foundingDate: '2025',
  founders: [
    {
      '@type': 'Person',
      name: 'Alex Chen',
      jobTitle: 'Founder & CEO'
    }
  ],
  sameAs: ['https://linkedin.com/company/hera-erp'],
  address: [
    {
      '@type': 'PostalAddress',
      addressLocality: 'London',
      addressCountry: 'GB'
    },
    {
      '@type': 'PostalAddress',
      addressLocality: 'Dubai',
      addressCountry: 'AE'
    },
    {
      '@type': 'PostalAddress',
      addressLocality: 'Kerala',
      addressCountry: 'IN'
    }
  ]
}

// Stats Component
function CompanyStats() {
  const stats = [
    { value: '30+', label: 'Industries Served', icon: '🏢' },
    { value: '99.9%', label: 'Platform Uptime', icon: '⚡' },
    { value: '4.8/5', label: 'Customer Rating', icon: '⭐' },
    { value: '24/7', label: 'Global Support', icon: '🌍' }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
      {stats.map((stat, idx) => (
        <div key={idx} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all" />
          <div className="relative card-glass p-6 rounded-2xl border border-border text-center">
            <div className="text-3xl mb-3">{stat.icon}</div>
            <div className="ink text-3xl font-bold mb-1">{stat.value}</div>
            <div className="ink-muted text-sm">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="w-full">
        {/* Hero Section - Enhanced with pricing page style */}
        <section className="relative overflow-hidden py-24 px-6">
          {/* Background gradients */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto">
            <div className="text-center mb-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 mb-6">
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  🚀 Founded 2025
                </span>
              </div>

              <h1 className="ink text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                Building the Future of
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  Business Operations
                </span>
              </h1>

              <p className="ink-muted text-xl md:text-2xl max-w-3xl mx-auto mb-10 leading-relaxed">
                We believe business software should adapt to your needs, not the other way around.
                HERA delivers flexible platform design that scales from startups to enterprises.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/get-started"
                  className="px-6 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 border border-border shadow-lg hover:shadow-xl transition-all"
                >
                  Start Your Journey
                </Link>
                <Link
                  href="/book-a-meeting"
                  className="px-6 py-3 rounded-xl text-base font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border transition-all"
                >
                  Talk to Our Team
                </Link>
              </div>
            </div>

            {/* Company Stats */}
            <CompanyStats />
          </div>
        </section>

        {/* Mission & Vision - New Section */}
        <section className="py-20 px-6 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-2xl group-hover:from-blue-500/20 group-hover:to-indigo-500/20 transition-all" />
                <div className="relative card-glass p-10 rounded-3xl">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl mb-6">
                    🎯
                  </div>
                  <h3 className="ink text-3xl font-bold mb-4">Our Mission</h3>
                  <p className="ink-muted text-lg leading-relaxed">
                    To democratize enterprise software by making powerful business tools accessible,
                    affordable, and adaptable for companies of all sizes. We eliminate complexity
                    without sacrificing capability.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all" />
                <div className="relative card-glass p-10 rounded-3xl">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-3xl mb-6">
                    🔮
                  </div>
                  <h3 className="ink text-3xl font-bold mb-4">Our Vision</h3>
                  <p className="ink-muted text-lg leading-relaxed">
                    A world where every business, from local shops to global enterprises, can
                    harness the same powerful technology to compete, innovate, and thrive in the
                    digital economy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Approach */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-medium uppercase tracking-wider">
                  Our Philosophy
                </span>
              </div>
              <h2 className="ink text-4xl md:text-5xl font-bold mb-4">How We Build Software</h2>
              <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto">
                Principles that guide every decision, feature, and interaction in our platform.
              </p>
            </div>
            <ApproachGrid />
          </div>
        </section>

        {/* Values */}
        <section className="py-20 px-6 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium uppercase tracking-wider">
                  Core Values
                </span>
              </div>
              <h2 className="ink text-4xl md:text-5xl font-bold mb-4">What We Stand For</h2>
              <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto">
                The beliefs that shape our culture and guide our journey.
              </p>
            </div>
            <ValuesGrid />
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                <span className="text-purple-600 dark:text-purple-400 text-xs font-medium uppercase tracking-wider">
                  Our Journey
                </span>
              </div>
              <h2 className="ink text-4xl md:text-5xl font-bold mb-4">Milestones & Achievements</h2>
              <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto">
                Key moments in building flexible business platforms.
              </p>
            </div>
            <Timeline />
          </div>
        </section>

        {/* Leadership Team */}
        <section className="py-20 px-6 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                <span className="text-cyan-600 dark:text-cyan-400 text-xs font-medium uppercase tracking-wider">
                  Leadership
                </span>
              </div>
              <h2 className="ink text-4xl md:text-5xl font-bold mb-4">Meet Our Team</h2>
              <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto">
                Experienced leaders building the next generation of business software.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {LEADERS.map(leader => (
                <LeaderCard key={leader.id} leader={leader} />
              ))}
            </div>
          </div>
        </section>

        {/* Global Footprint */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-medium uppercase tracking-wider">
                  Global Reach
                </span>
              </div>
              <h2 className="ink text-4xl md:text-5xl font-bold mb-4">
                Serving Businesses Worldwide
              </h2>
              <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto">
                Supporting companies across multiple regions and time zones.
              </p>
            </div>
            <Footprint />
          </div>
        </section>

        {/* Press & Careers CTA */}
        <section className="py-20 px-6 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="ink text-4xl md:text-5xl font-bold mb-4">Connect With Us</h2>
              <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto">
                Media inquiries, partnership opportunities, and career openings.
              </p>
            </div>
            <PressCta />
          </div>
        </section>

        {/* Final CTA - Enterprise Grade Glassmorphism */}
        <section className="relative py-24 px-6 overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent dark:from-gray-950/80 dark:to-transparent" />
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-3xl blur-3xl group-hover:opacity-75 transition-opacity" />

              <div className="relative card-glass p-12 md:p-16 rounded-3xl border border-purple-500/20 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-6">
                  <span className="text-purple-400 text-sm font-medium">
                    ✨ Join businesses transforming their operations
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  Ready to Transform Your Business?
                </h2>

                <p className="text-xl ink-muted mb-10 max-w-3xl mx-auto">
                  Experience the power of flexible, scalable business software that grows with you.
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/get-started"
                    className="px-6 py-3 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 border border-indigo-500/20 shadow-lg hover:shadow-xl transition-all"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/book-a-meeting"
                    className="px-6 py-3 text-sm font-medium card-glass ink border border-border rounded-xl hover:border-indigo-500/30 transition-all"
                  >
                    Schedule Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
