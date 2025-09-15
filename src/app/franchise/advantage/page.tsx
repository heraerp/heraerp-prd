// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import Link from 'next/link'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { FranchiseHero } from '@/components/franchise/FranchiseHero'
import { TestimonialsGrid } from '@/components/franchise/TestimonialCard'
import { Button } from '@/components/ui/button'
import {
  Zap,
  Clock,
  DollarSign,
  CheckCircle,
  X,
  ArrowRight,
  Shield,
  TrendingUp,
  Award,
  Users,
  Target,
  Globe,
  Cog,
  AlertCircle,
  ThumbsUp
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Why HERA Wins - Competitive Advantage',
  description:
    'See how HERA outperforms SAP, Oracle, and other legacy ERP systems. 24-hour implementation vs 18 months traditional.',
  keywords:
    'HERA vs SAP, ERP comparison, HERA advantages, why choose HERA, ERP competitive analysis'
}

const comparison = [
  {
    feature: 'Implementation Time',
    hera: '24 Hours',
    sap: '12-21 Months',
    oracle: '18-30 Months',
    others: '6-18 Months',
    advantage: 'critical'
  },
  {
    feature: 'Total Cost',
    hera: '$50K-$500K',
    sap: '$2M-$50M',
    oracle: '$1.5M-$25M',
    others: '$500K-$5M',
    advantage: 'critical'
  },
  {
    feature: 'Success Rate',
    hera: '95%+',
    sap: '35%',
    oracle: '40%',
    others: '45%',
    advantage: 'critical'
  },
  {
    feature: 'Customization',
    hera: 'Dynamic Fields',
    sap: 'ABAP Development',
    oracle: 'Java/Forms',
    others: 'Limited Options',
    advantage: 'high'
  },
  {
    feature: 'Mobile Experience',
    hera: 'Native PWA',
    sap: 'Fiori (Additional Cost)',
    oracle: 'Third-party Required',
    others: 'Often Missing',
    advantage: 'high'
  },
  {
    feature: 'Multi-tenancy',
    hera: 'Built-in',
    sap: 'S/4HANA Only',
    oracle: 'Cloud Only',
    others: 'Rare',
    advantage: 'medium'
  },
  {
    feature: 'AI Integration',
    hera: 'Universal AI Ready',
    sap: 'BTP Required',
    oracle: 'OCI Integration',
    others: 'Third-party',
    advantage: 'medium'
  },
  {
    feature: 'User Training',
    hera: '2-4 Hours',
    sap: '40-120 Hours',
    oracle: '60-100 Hours',
    others: '20-80 Hours',
    advantage: 'high'
  }
]

const testimonials = [
  {
    name: 'David Chen',
    title: 'Former SAP Consultant',
    company: 'Now HERA Partner',
    testimonial:
      'After implementing SAP for 12 years, I can say HERA is revolutionary. What we struggled to do in 18 months, HERA does in 24 hours. The client amazement is incredible.',
    rating: 5
  },
  {
    name: 'Maria Gonzalez',
    title: 'CIO',
    company: 'Healthcare Systems Inc',
    testimonial:
      'We spent 3 years and $4M on an Oracle implementation that never worked properly. HERA gave us everything we needed in 24 hours for under $200K.',
    rating: 5
  },
  {
    name: 'Robert Kim',
    title: 'Manufacturing Director',
    company: 'Precision Parts Co',
    testimonial:
      'SAP promised us integration but delivered complexity. HERA delivered on all promises in one day. Our productivity increased 40% immediately.',
    rating: 5
  }
]

const advantages = [
  {
    icon: Zap,
    title: '24-Hour Implementation',
    description:
      'Complete ERP system live and operational in 24 hours vs 18+ months for legacy systems.',
    impact: 'Revolutionary speed eliminates business disruption and accelerates ROI.'
  },
  {
    icon: DollarSign,
    title: '90% Cost Reduction',
    description: '$50K-$500K total cost vs $2M-$50M for SAP and Oracle implementations.',
    impact: 'Massive savings make enterprise ERP accessible to mid-market businesses.'
  },
  {
    icon: Shield,
    title: '95% Success Rate',
    description: 'HERA implementations succeed 95% of the time vs 35-45% for traditional ERP.',
    impact: 'Guaranteed success eliminates the risk of failed implementations.'
  },
  {
    icon: Users,
    title: 'No Technical Debt',
    description:
      'Universal 6-table architecture scales infinitely without customization complexity.',
    impact: 'Future-proof system grows with business without technical limitations.'
  },
  {
    icon: Target,
    title: 'Instant User Adoption',
    description:
      '2-4 hours training vs 40-120 hours for SAP. Intuitive interface drives immediate adoption.',
    impact: 'Eliminates user resistance and training costs that plague traditional ERP.'
  },
  {
    icon: Globe,
    title: 'Universal Architecture',
    description:
      'One system handles any business complexity across any industry without modifications.',
    impact: 'Eliminates need for multiple systems or expensive customizations.'
  }
]

const painPoints = [
  {
    title: 'SAP Implementation Horror Stories',
    points: [
      'Lidl cancelled $500M SAP project after 7 years',
      'Hershey lost $100M in sales due to SAP go-live failure',
      'Nike blamed SAP for $100M inventory problems',
      'Waste Management spent $100M on failed SAP implementation'
    ]
  },
  {
    title: 'Oracle Implementation Failures',
    points: [
      'Montclair State University sued Oracle for $30M',
      'Oregon sued Oracle for $200M over failed health exchange',
      'Panorama Consulting reports 60% of Oracle projects fail',
      'Average Oracle implementation takes 16 months longer than planned'
    ]
  }
]

export default function AdvantagePage() {
  return (
    <FranchiseLayout>
      {/* Hero Section */}
      <FranchiseHero
        title="Why HERA Destroys the Competition"
        subtitle="24 Hours vs 18 Months. $50K vs $50M. 95% vs 35% Success Rate."
        description="See the shocking comparison between HERA and legacy ERP systems. The numbers don't lie."
        ctaText="Apply Now"
        ctaLink="/franchise/apply"
        secondaryCtaText="View Case Studies"
        secondaryCtaLink="/franchise/proof"
        backgroundVariant="gradient"
      />

      {/* Comparison Table */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Head-to-Head Comparison
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              See how HERA outperforms SAP, Oracle, and other legacy ERP systems across every metric
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-4 px-4 font-semibold text-slate-900 dark:text-white">
                        Feature
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 rounded-t-lg">
                        HERA
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        SAP
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        Oracle
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        Others
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                      >
                        <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">
                          {row.feature}
                        </td>
                        <td className="py-4 px-4 bg-green-50 dark:bg-green-900/20">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <span className="font-semibold text-green-700 dark:text-green-300">
                              {row.hera}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <X className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-slate-600 dark:text-slate-400">{row.sap}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <X className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-slate-600 dark:text-slate-400">{row.oracle}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <X className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-slate-600 dark:text-slate-400">{row.others}</span>
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

      {/* Key Advantages */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              HERA's Crushing Advantages
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Six key advantages that make HERA unbeatable in the marketplace
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-6">
                  <advantage.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {advantage.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  {advantage.description}
                </p>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-blue-600">
                    <strong>Impact:</strong> {advantage.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Horror Stories */}
      <section className="py-16 bg-red-50 dark:bg-red-900/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Legacy ERP Horror Stories
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Real companies that lost millions on failed traditional ERP implementations
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {painPoints.map((category, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-red-200 dark:border-red-800 shadow-sm"
              >
                <div className="flex items-center mb-6">
                  <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {category.title}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {category.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start">
                      <X className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 border border-green-200 dark:border-green-800">
              <ThumbsUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                HERA's Track Record: 95% Success Rate
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                While competitors fail spectacularly, HERA delivers success consistently. Zero
                failed implementations in our franchise network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Client Testimonials */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Clients Choose HERA Over Competitors
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Real testimonials from businesses that switched from SAP, Oracle, and other legacy
              systems
            </p>
          </div>

          <TestimonialsGrid testimonials={testimonials} variant="featured" />
        </div>
      </section>

      {/* The HERA Difference */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              The HERA Difference Is Your Competitive Edge
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              When you sell HERA, you're not just selling software – you're selling miracles.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Clock className="h-8 w-8 text-yellow-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">24-Hour Miracle</h3>
                <p className="text-sm text-blue-100">
                  Clients get results in 24 hours instead of waiting 18+ months
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <DollarSign className="h-8 w-8 text-green-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">90% Savings</h3>
                <p className="text-sm text-blue-100">
                  Massive cost savings create easy buying decisions
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Award className="h-8 w-8 text-purple-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">Guaranteed Success</h3>
                <p className="text-sm text-blue-100">
                  95% success rate eliminates implementation risk
                </p>
              </div>
            </div>

            <Button
              asChild
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-6 text-lg"
            >
              <Link href="/franchise/apply" className="flex items-center">
                Join the Winning Team
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              Stop Selling Yesterday's Technology
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              While competitors struggle with failed implementations and angry customers, you'll be
              closing deals with revolutionary technology that actually works.
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
                <Link href="/franchise/proof">See Success Stories</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </FranchiseLayout>
  )
}
