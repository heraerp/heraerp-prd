// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import Link from 'next/link'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { FranchiseHero } from '@/components/franchise/FranchiseHero'
import { TestimonialCard } from '@/components/franchise/TestimonialCard'
import { Button } from '@/components/ui/button'
import {
  Download,
  ArrowRight,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  CheckCircle,
  Building2,
  Factory,
  Heart,
  ShoppingCart,
  Truck,
  FileText,
  Play,
  BarChart3
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Proof - HERA Success Stories',
  description:
    'Real transformation stories and case studies. Download detailed case studies showing how HERA delivered results in 24 hours.',
  keywords:
    'HERA case studies, success stories, ERP transformation, client testimonials, proof of concept'
}

const caseStudies = [
  {
    company: 'TechManufacturing Pro',
    industry: 'Manufacturing',
    icon: Factory,
    employees: 250,
    revenue: '$45M',
    challenge: 'Manual inventory management, disconnected systems, production delays',
    solution: 'Complete HERA ERP with inventory, production planning, and quality control',
    results: {
      implementation: '24 hours',
      cost: '$185K',
      savings: '$2.3M annually',
      efficiency: '+40%',
      inventory: '-35% waste'
    },
    testimonial:
      'HERA delivered what SAP promised but never could. We went live in 24 hours and saw immediate results.',
    contact: 'Maria Rodriguez, Operations Director',
    downloadable: true
  },
  {
    company: 'Regional Healthcare Network',
    industry: 'Healthcare',
    icon: Heart,
    employees: 1200,
    revenue: '$120M',
    challenge: 'HIPAA compliance, patient data silos, billing complexity',
    solution: 'HERA Healthcare Suite with patient management, billing, and compliance',
    results: {
      implementation: '24 hours',
      cost: '$450K',
      savings: '$5.2M annually',
      efficiency: '+60%',
      compliance: '100% HIPAA'
    },
    testimonial:
      'After a failed Epic implementation that took 3 years, HERA solved everything in one day.',
    contact: 'Dr. James Patterson, CIO',
    downloadable: true
  },
  {
    company: 'Premium Retail Chain',
    industry: 'Retail',
    icon: ShoppingCart,
    employees: 500,
    revenue: '$85M',
    challenge: 'Multi-location inventory, POS integration, customer analytics',
    solution: 'HERA Retail Platform with real-time inventory and customer insights',
    results: {
      implementation: '24 hours',
      cost: '$290K',
      savings: '$3.1M annually',
      efficiency: '+45%',
      inventory: '+25% turnover'
    },
    testimonial:
      'Oracle Retail took 2 years and never worked properly. HERA fixed everything overnight.',
    contact: 'Sarah Kim, VP Operations',
    downloadable: true
  },
  {
    company: 'National Logistics Co',
    industry: 'Logistics',
    icon: Truck,
    employees: 800,
    revenue: '$95M',
    challenge: 'Route optimization, fleet management, delivery tracking',
    solution: 'HERA Logistics Suite with GPS integration and route optimization',
    results: {
      implementation: '24 hours',
      cost: '$320K',
      savings: '$4.1M annually',
      efficiency: '+50%',
      fuel: '-30% costs'
    },
    testimonial:
      'SAP Transportation Management was a nightmare. HERA made logistics simple and profitable.',
    contact: 'Michael Chen, Fleet Director',
    downloadable: true
  }
]

const transformationMetrics = [
  {
    metric: 'Average Implementation',
    before: '18 months',
    after: '24 hours',
    improvement: '99.9% faster'
  },
  {
    metric: 'Average Cost',
    before: '$2.5M',
    after: '$285K',
    improvement: '89% savings'
  },
  {
    metric: 'Success Rate',
    before: '38%',
    after: '95%+',
    improvement: '150% better'
  },
  {
    metric: 'User Training',
    before: '80 hours',
    after: '3 hours',
    improvement: '96% reduction'
  }
]

const industrySuccess = [
  { industry: 'Manufacturing', clients: 45, avgSavings: '$2.8M', satisfaction: '94%' },
  { industry: 'Healthcare', clients: 32, avgSavings: '$4.2M', satisfaction: '96%' },
  { industry: 'Retail', clients: 28, avgSavings: '$2.1M', satisfaction: '93%' },
  { industry: 'Logistics', clients: 22, avgSavings: '$3.5M', satisfaction: '95%' },
  { industry: 'Financial Services', clients: 18, avgSavings: '$1.9M', satisfaction: '92%' },
  { industry: 'Education', clients: 15, avgSavings: '$980K', satisfaction: '97%' }
]

const partnerTestimonials = [
  {
    name: 'Jennifer Walsh',
    title: 'HERA Partner',
    company: 'Pacific Northwest Territory',
    testimonial:
      'My first client was a manufacturer stuck with a failing SAP system. HERA replaced it in 24 hours, and they saved $1.2M in the first year. Word spread fast, and now I have a waiting list.',
    rating: 5
  },
  {
    name: 'Carlos Mendez',
    title: 'HERA Partner',
    company: 'Southwest Territory',
    testimonial:
      'The case studies sell themselves. When I show prospects how HERA delivered results while their competitors struggled with Oracle implementations, deals close themselves.',
    rating: 5
  }
]

export default function ProofPage() {
  return (
    <FranchiseLayout>
      {/* Hero Section */}
      <FranchiseHero
        title="The Proof Is Undeniable"
        subtitle="Real Companies. Real Results. Real Fast."
        description="See actual transformation stories from businesses that chose HERA over SAP, Oracle, and other legacy systems."
        ctaText="Download Case Studies"
        ctaLink="#case-studies"
        secondaryCtaText="Apply Now"
        secondaryCtaLink="/franchise/apply"
      />

      {/* Transformation Metrics */}
      <section className="py-16 bg-background dark:bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              Before vs After HERA
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
              The dramatic improvements our clients experience compared to traditional ERP
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {transformationMetrics.map((item, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-xl p-6 border border-border dark:border-border text-center"
              >
                <h3 className="font-semibold text-foreground dark:text-foreground mb-4">{item.metric}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-600">Before:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {item.before}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-600">After:</span>
                    <span className="font-medium text-foreground dark:text-foreground">{item.after}</span>
                  </div>
                </div>
                <div className="text-xl font-bold text-green-600">{item.improvement}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section id="case-studies" className="py-16 bg-slate-50 dark:bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              Detailed Success Stories
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
              Complete transformation case studies with measurable results
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {caseStudies.map((study, index) => (
              <div
                key={index}
                className="bg-background dark:bg-background rounded-xl p-8 border border-border dark:border-border shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Header */}
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <study.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground dark:text-foreground">
                      {study.company}
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {study.industry} • {study.employees} employees • {study.revenue} revenue
                    </p>
                  </div>
                </div>

                {/* Challenge */}
                <div className="mb-6">
                  <h4 className="font-semibold text-foreground dark:text-foreground mb-2">Challenge</h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
                    {study.challenge}
                  </p>
                </div>

                {/* Solution */}
                <div className="mb-6">
                  <h4 className="font-semibold text-foreground dark:text-foreground mb-2">
                    HERA Solution
                  </h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
                    {study.solution}
                  </p>
                </div>

                {/* Results */}
                <div className="mb-6">
                  <h4 className="font-semibold text-foreground dark:text-foreground mb-3">Results</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(study.results).map(([key, value]) => (
                      <div key={key} className="bg-slate-50 dark:bg-muted rounded-lg p-3">
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="font-semibold text-foreground dark:text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonial */}
                <div className="mb-6">
                  <blockquote className="text-sm italic text-slate-700 dark:text-slate-300 border-l-4 border-blue-500 pl-4">
                    "{study.testimonial}"
                  </blockquote>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
                    — {study.contact}
                  </p>
                </div>

                {/* Download */}
                {study.downloadable && (
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground">
                    <Download className="h-4 w-4 mr-2" />
                    Download Full Case Study
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Success Rates */}
      <section className="py-16 bg-background dark:bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              Success Across All Industries
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
              HERA delivers results regardless of industry complexity
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-50 dark:bg-muted rounded-2xl p-8 border border-border dark:border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border dark:border-border">
                      <th className="text-left py-4 px-4 font-semibold text-foreground dark:text-foreground">
                        Industry
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-foreground dark:text-foreground">
                        Clients
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-foreground dark:text-foreground">
                        Avg Savings
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-foreground dark:text-foreground">
                        Satisfaction
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {industrySuccess.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b border-border dark:border-border last:border-b-0"
                      >
                        <td className="py-4 px-4 font-medium text-foreground dark:text-foreground">
                          {row.industry}
                        </td>
                        <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                          {row.clients}
                        </td>
                        <td className="py-4 px-4 text-green-600 font-semibold">{row.avgSavings}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: row.satisfaction }}
                              />
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 text-sm">
                              {row.satisfaction}
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

      {/* Partner Success Stories */}
      <section className="py-16 bg-slate-50 dark:bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              Partner Success Stories
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
              How franchise partners use these success stories to close more deals
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {partnerTestimonials.map((testimonial, index) => (
              <TestimonialCard key={index} variant="featured" {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Video Testimonials */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Hear It Directly From Our Clients
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Video testimonials from CEOs and decision makers
            </p>

            {/* Video Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="relative">
                <div className="aspect-video bg-background rounded-xl shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-800 to-slate-900">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-background/20 backdrop-blur-sm hover:bg-background/30 text-foreground border-white/30"
                    >
                      <Play className="h-6 w-6 mr-2" />
                      Manufacturing CEO
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-blue-100 mt-2">"HERA saved us $2.3M compared to SAP"</p>
              </div>

              <div className="relative">
                <div className="aspect-video bg-background rounded-xl shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-800 to-slate-900">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-background/20 backdrop-blur-sm hover:bg-background/30 text-foreground border-white/30"
                    >
                      <Play className="h-6 w-6 mr-2" />
                      Healthcare CIO
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-blue-100 mt-2">"24 hours vs 3 years with Epic"</p>
              </div>
            </div>

            <Button
              asChild
              size="lg"
              className="bg-background text-primary hover:bg-muted font-semibold px-8 py-6 text-lg"
            >
              <Link href="/franchise/apply" className="flex items-center">
                Get Access to All Success Stories
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-16 bg-background dark:bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-6">
              Calculate Your Success
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground mb-8">
              Use our ROI calculator to project potential savings for your prospects
            </p>

            <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-2xl p-8 border border-border dark:border-border">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground dark:text-foreground mb-2">
                    Average Savings
                  </h3>
                  <p className="text-3xl font-bold text-green-600">$2.8M</p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">per implementation</p>
                </div>
                <div className="text-center">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground dark:text-foreground mb-2">Time Saved</h3>
                  <p className="text-3xl font-bold text-purple-600">17.5</p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">months average</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground dark:text-foreground mb-2">ROI</h3>
                  <p className="text-3xl font-bold text-orange-600">847%</p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">average return</p>
                </div>
              </div>

              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground font-semibold px-8 py-4"
              >
                <FileText className="h-5 w-5 mr-2" />
                Download ROI Calculator
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-slate-50 dark:bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground dark:text-foreground mb-6">
              Ready to Create Your Own Success Stories?
            </h2>
            <p className="text-xl text-muted-foreground dark:text-muted-foreground mb-8 leading-relaxed">
              These case studies become your sales tools. Show prospects how HERA delivers results
              while competitors fail, and deals will close themselves.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground font-semibold px-8 py-6 text-lg"
              >
                <Link href="/franchise/apply" className="flex items-center">
                  Apply for Territory
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg">
                <Link href="/franchise/faq">Have Questions?</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </FranchiseLayout>
  )
}
