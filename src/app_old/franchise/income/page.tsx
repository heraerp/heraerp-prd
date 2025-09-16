// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import Link from 'next/link'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { FranchiseHero } from '@/components/franchise/FranchiseHero'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  ArrowRight,
  Building2,
  Users,
  Clock,
  Award,
  Target,
  Calculator,
  PiggyBank,
  Banknote,
  Coins
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Income Potential - HERA Franchise',
  description:
    'Discover your earning potential with HERA franchise. Scale from $25K to $500K+ annually with multiple revenue streams.',
  keywords:
    'HERA franchise income, earning potential, commission rates, franchise revenue, ERP sales income'
}

const incomeTable = [
  {
    clients: 5,
    avgDeal: 50000,
    commission: 0.35,
    monthly: 7291,
    annual: 87500,
    level: 'Starter'
  },
  {
    clients: 10,
    avgDeal: 75000,
    commission: 0.35,
    monthly: 21875,
    annual: 262500,
    level: 'Professional'
  },
  {
    clients: 20,
    avgDeal: 100000,
    commission: 0.4,
    monthly: 66667,
    annual: 800000,
    level: 'Executive'
  },
  {
    clients: 35,
    avgDeal: 125000,
    commission: 0.45,
    monthly: 164063,
    annual: 1968750,
    level: 'Elite'
  },
  {
    clients: 50,
    avgDeal: 150000,
    commission: 0.5,
    monthly: 312500,
    annual: 3750000,
    level: 'Master'
  }
]

const revenueStreams = [
  {
    icon: Banknote,
    title: 'Implementation Commission',
    percentage: '35-50%',
    description: 'Direct commission on initial HERA system implementations',
    example: '$35,000 on $100K implementation'
  },
  {
    icon: Users,
    title: 'Recurring Revenue Share',
    percentage: '10-15%',
    description: 'Monthly recurring revenue from ongoing client subscriptions',
    example: '$1,500/month on $10K monthly client'
  },
  {
    icon: Target,
    title: 'Upsell Commissions',
    percentage: '25-35%',
    description: 'Additional modules, integrations, and system expansions',
    example: '$8,750 on $35K expansion project'
  },
  {
    icon: Award,
    title: 'Performance Bonuses',
    percentage: 'Variable',
    description: 'Quarterly and annual bonuses for exceeding targets',
    example: '$25,000 annual bonus potential'
  }
]

const realWorldExamples = [
  {
    name: 'Sarah Chen',
    territory: 'West Coast',
    timeframe: '18 months',
    clients: 12,
    income: '$185,000',
    story: 'Manufacturing focus, average deal $95K'
  },
  {
    name: 'Mike Rodriguez',
    territory: 'Southwest',
    timeframe: '2 years',
    clients: 25,
    income: '$425,000',
    story: 'Healthcare specialization, average deal $145K'
  },
  {
    name: 'Jessica Park',
    territory: 'Northeast',
    timeframe: '3 years',
    clients: 45,
    income: '$750,000',
    story: 'Multi-industry, strong recurring revenue'
  }
]

const factors = [
  {
    icon: Building2,
    title: 'Territory Size',
    description: 'Larger territories have more potential clients and higher earning capacity',
    impact: 'High'
  },
  {
    icon: Users,
    title: 'Industry Focus',
    description: 'Healthcare and manufacturing typically have larger deal sizes and budgets',
    impact: 'High'
  },
  {
    icon: Clock,
    title: 'Time Investment',
    description: 'Full-time partners typically earn 3-5x more than part-time partners',
    impact: 'Very High'
  },
  {
    icon: TrendingUp,
    title: 'Sales Experience',
    description: 'Prior B2B sales experience accelerates client acquisition and deal closure',
    impact: 'Medium'
  }
]

export default function IncomePage() {
  return (
    <FranchiseLayout>
      {/* Hero Section */}
      <FranchiseHero
        title="Your Income Potential"
        subtitle="Scale from $25K to $500K+ Annually"
        description="Multiple revenue streams, recurring income, and unlimited scaling potential in a $50B market."
        ctaText="Apply Now"
        ctaLink="/franchise/apply"
        secondaryCtaText="See Proof"
        secondaryCtaLink="/franchise/proof"
      />

      {/* Income Projection Table */}
      <section className="py-16 bg-background dark:bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              Income Scaling Projections
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
              Based on actual partner performance data and conservative estimates
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="bg-slate-50 dark:bg-muted rounded-2xl p-8 border border-border dark:border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border dark:border-border">
                      <th className="text-left py-4 px-4 font-semibold text-foreground dark:text-foreground">
                        Level
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-foreground dark:text-foreground">
                        Clients
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-foreground dark:text-foreground">
                        Avg Deal
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-foreground dark:text-foreground">
                        Commission %
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-foreground dark:text-foreground">
                        Monthly
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-green-600">
                        Annual Income
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeTable.map((row, index) => (
                      <tr
                        key={index}
                        className={`border-b border-border dark:border-border last:border-b-0 ${index === 1 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                              index === 0
                                ? 'bg-muted text-gray-200 dark:bg-muted dark:text-gray-200'
                                : index === 1
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                                  : index === 2
                                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                                    : index === 3
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200'
                                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                            }`}
                          >
                            {row.level}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-foreground dark:text-foreground">{row.clients}</td>
                        <td className="py-4 px-4 text-foreground dark:text-foreground">
                          ${row.avgDeal.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-foreground dark:text-foreground">
                          {(row.commission * 100).toFixed(0)}%
                        </td>
                        <td className="py-4 px-4 text-foreground dark:text-foreground">
                          ${row.monthly.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 font-bold text-green-600 text-lg">
                          ${row.annual.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center mb-3">
                <Calculator className="h-5 w-5 text-primary mr-2" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  Calculation Notes
                </span>
              </div>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Based on conservative 12-month client implementation cycles</li>
                <li>• Includes recurring revenue from ongoing subscriptions</li>
                <li>• Commission rates increase with volume and performance</li>
                <li>• Does not include performance bonuses or upsell opportunities</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Streams */}
      <section className="py-16 bg-slate-50 dark:bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              Multiple Revenue Streams
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
              Diversified income sources provide stability and growth potential
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {revenueStreams.map((stream, index) => (
              <div
                key={index}
                className="bg-background dark:bg-background rounded-xl p-6 border border-border dark:border-border shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <stream.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                  {stream.title}
                </h3>
                <div className="text-2xl font-bold text-green-600 mb-3">{stream.percentage}</div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                  {stream.description}
                </p>
                <p className="text-xs text-primary font-medium">Example: {stream.example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real World Examples */}
      <section className="py-16 bg-background dark:bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              Real Partner Success Stories
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
              Actual income results from current HERA franchise partners
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {realWorldExamples.map((example, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-xl p-8 border border-border dark:border-border"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-foreground font-semibold">{example.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-foreground">{example.name}</h3>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {example.territory}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">Timeframe</p>
                    <p className="font-semibold text-foreground dark:text-foreground">
                      {example.timeframe}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">Clients</p>
                    <p className="font-semibold text-foreground dark:text-foreground">
                      {example.clients}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Annual Income</p>
                  <p className="text-3xl font-bold text-green-600">{example.income}</p>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300">{example.story}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Factors Affecting Income */}
      <section className="py-16 bg-slate-50 dark:bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              What Affects Your Income
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
              Key factors that influence your earning potential as a HERA partner
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {factors.map((factor, index) => (
              <div
                key={index}
                className="bg-background dark:bg-background rounded-xl p-6 border border-border dark:border-border"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <factor.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                  {factor.title}
                </h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                  {factor.description}
                </p>
                <span
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    factor.impact === 'Very High'
                      ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                      : factor.impact === 'High'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                  }`}
                >
                  {factor.impact} Impact
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Income Calculator CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Calculate Your Potential
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Use our income calculator to project your earning potential based on your territory
              and goals
            </p>

            <div className="bg-background/10 backdrop-blur-sm rounded-2xl p-8 border border-border/20 mb-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <PiggyBank className="h-8 w-8 text-green-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Conservative</h3>
                  <p className="text-3xl font-bold text-green-300">$85K</p>
                  <p className="text-sm text-blue-100">5 clients, part-time</p>
                </div>
                <div className="text-center">
                  <Coins className="h-8 w-8 text-yellow-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Realistic</h3>
                  <p className="text-3xl font-bold text-yellow-300">$265K</p>
                  <p className="text-sm text-blue-100">10 clients, full-time</p>
                </div>
                <div className="text-center">
                  <Award className="h-8 w-8 text-purple-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Aggressive</h3>
                  <p className="text-3xl font-bold text-purple-300">$500K+</p>
                  <p className="text-sm text-blue-100">20+ clients, dedicated</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-background text-primary hover:bg-muted font-semibold px-8 py-6 text-lg"
              >
                <Link href="/franchise/apply" className="flex items-center">
                  Start Earning Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-foreground hover:bg-background/10 px-8 py-6 text-lg"
              >
                <Link href="/franchise/proof">See More Case Studies</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-background dark:bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground dark:text-foreground mb-6">
              Your Financial Future Starts Here
            </h2>
            <p className="text-xl text-muted-foreground dark:text-muted-foreground mb-8 leading-relaxed">
              Stop trading time for money. Build a scalable business that grows while you sleep.
            </p>

            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground font-semibold px-8 py-6 text-lg"
            >
              <Link href="/franchise/apply" className="flex items-center">
                Apply Now - Territory Going Fast
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </FranchiseLayout>
  )
}
