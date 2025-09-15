// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import Link from 'next/link'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { FranchiseHero } from '@/components/franchise/FranchiseHero'
import { Button } from '@/components/ui/button'
import {
  User,
  Building2,
  HeartHandshake,
  Cog,
  CheckCircle,
  X,
  ArrowRight,
  Shield,
  TrendingUp,
  Clock,
  Award,
  Target,
  Briefcase,
  Users,
  Settings,
  Headphones,
  Globe,
  Zap
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'The Opportunity - HERA Franchise',
  description:
    'You own the relationship, we handle delivery. Learn what you do vs what HERA provides in this revolutionary franchise model.',
  keywords:
    'HERA franchise opportunity, what franchisees do, franchise responsibilities, ERP sales opportunity'
}

const yourResponsibilities = [
  {
    icon: HeartHandshake,
    title: 'Build Client Relationships',
    description:
      'Develop and maintain direct relationships with business owners and decision makers in your territory.'
  },
  {
    icon: Target,
    title: 'Identify Prospects',
    description:
      'Find businesses struggling with manual processes, legacy systems, or expensive ERP implementations.'
  },
  {
    icon: Briefcase,
    title: 'Present HERA Solutions',
    description:
      'Deliver compelling presentations showing how HERA solves problems in 24 hours vs 18 months.'
  },
  {
    icon: User,
    title: 'Close Deals',
    description:
      'Guide prospects through the decision process and secure signed contracts for HERA implementations.'
  }
]

const heraProvides = [
  {
    icon: Cog,
    title: 'Complete Technical Delivery',
    description: 'Full system implementation, configuration, and deployment in 24 hours guaranteed.'
  },
  {
    icon: Headphones,
    title: 'Ongoing Client Support',
    description:
      '24/7 technical support, system maintenance, and updates handled by HERA technical teams.'
  },
  {
    icon: Settings,
    title: 'Training & Certification',
    description:
      'Comprehensive franchise training, sales materials, and ongoing educational programs.'
  },
  {
    icon: Shield,
    title: 'Territory Protection',
    description:
      'Exclusive geographic protection ensures no competition from other HERA franchisees.'
  }
]

const comparison = [
  {
    category: 'Client Relationships',
    you: 'Own completely',
    traditional: 'Shared with vendor',
    advantage: true
  },
  {
    category: 'Technical Implementation',
    you: 'HERA handles 100%',
    traditional: 'Your responsibility',
    advantage: true
  },
  {
    category: 'Ongoing Support',
    you: 'HERA provides 24/7',
    traditional: 'You provide all support',
    advantage: true
  },
  {
    category: 'Revenue Share',
    you: '30-50% commission',
    traditional: '10-15% if any',
    advantage: true
  },
  {
    category: 'Implementation Risk',
    you: 'HERA guarantees delivery',
    traditional: 'All risk on you',
    advantage: true
  },
  {
    category: 'Client Success',
    you: 'HERA ensures success',
    traditional: 'Sink or swim alone',
    advantage: true
  }
]

const marketOpportunity = [
  {
    icon: Globe,
    stat: '$50B',
    label: 'Global ERP Market',
    description: 'Massive addressable market with high growth'
  },
  {
    icon: Building2,
    stat: '95%',
    label: 'Businesses Need ERP',
    description: 'Most businesses still use manual processes'
  },
  {
    icon: Clock,
    stat: '18 Months',
    label: 'Traditional Timeline',
    description: 'HERA does it in 24 hours - 250x faster'
  },
  {
    icon: TrendingUp,
    stat: '60%',
    label: 'ERP Failure Rate',
    description: 'Traditional ERPs fail, HERA succeeds'
  }
]

export default function OpportunityPage() {
  return (
    <FranchiseLayout>
      {/* Hero Section */}
      <FranchiseHero
        title="You Own the Relationship"
        subtitle="We Handle Everything Else"
        description="The perfect business model: You focus on what you love (relationships and sales), while HERA handles what you don't (technical complexity and implementation)."
        ctaText="See Income Potential"
        ctaLink="/franchise/income"
        secondaryCtaText="Apply Now"
        secondaryCtaLink="/franchise/apply"
      />

      {/* Market Opportunity */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              The $50B Opportunity
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              You're not just selling software – you're disrupting an entire industry
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {marketOpportunity.map((item, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {item.stat}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{item.label}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Do vs What We Do */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Perfect Division of Labor
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              You do what you're great at. We handle the technical complexity.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* What You Do */}
            <div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-8 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center mb-6">
                  <User className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-2xl font-bold text-green-900 dark:text-green-100">
                    What You Do
                  </h3>
                </div>
                <p className="text-green-800 dark:text-green-200 mb-6">
                  Focus on relationship building and sales – the high-value activities you love
                </p>
                <div className="space-y-4">
                  {yourResponsibilities.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <item.icon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                          {item.title}
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* What HERA Does */}
            <div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center mb-6">
                  <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    What HERA Provides
                  </h3>
                </div>
                <p className="text-blue-800 dark:text-blue-200 mb-6">
                  Complete technical delivery and support – everything you don't want to handle
                </p>
                <div className="space-y-4">
                  {heraProvides.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <item.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          {item.title}
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              HERA vs Traditional Business Models
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              See why the HERA franchise model is superior to going it alone
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-4 px-6 font-semibold text-slate-900 dark:text-white">
                        Category
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-green-600">
                        HERA Franchise
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">
                        Traditional Model
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                      >
                        <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                          {row.category}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-green-700 dark:text-green-300">{row.you}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <X className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-slate-600 dark:text-slate-400">
                              {row.traditional}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Story */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Real Success Story</h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
              <blockquote className="text-xl text-white leading-relaxed mb-6">
                "I was burned out from 15 years of SAP consulting. Implementation projects took 18
                months, cost millions, and half of them failed. With HERA, I close bigger deals
                faster because clients get results in 24 hours. I've never been happier or earned
                more."
              </blockquote>
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-semibold">M</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Mike Rodriguez</p>
                  <p className="text-blue-100">Former SAP Consultant, Now HERA Partner</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">24-Hour Delivery</h3>
                <p className="text-sm text-blue-100">vs 18-month traditional implementations</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">Higher Close Rate</h3>
                <p className="text-sm text-blue-100">Clients love guaranteed 24-hour results</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Award className="h-8 w-8 text-purple-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">Better Income</h3>
                <p className="text-sm text-blue-100">30-50% commission vs 10-15% traditional</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              Ready to Own Your Territory?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Limited territories available. Exclusive protection guaranteed for approved partners.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 text-lg"
              >
                <Link href="/franchise/apply" className="flex items-center">
                  Apply for Territory
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg">
                <Link href="/franchise/income">View Income Potential</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </FranchiseLayout>
  )
}
