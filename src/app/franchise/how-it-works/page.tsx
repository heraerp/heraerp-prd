import { Metadata } from 'next'
import Link from 'next/link'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { FranchiseHero } from '@/components/franchise/FranchiseHero'
import { Button } from '@/components/ui/button'
import { 
  User,
  Search,
  FileText,
  Rocket,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  Award,
  Users,
  Zap
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'How It Works - HERA Franchise',
  description: 'From chaos to clarity in 5 simple steps. Learn how the HERA franchise system works and how you can start earning $25K–$500K+ annually.',
  keywords: 'HERA franchise process, how it works, franchise steps, ERP business opportunity',
}

const steps = [
  {
    number: 1,
    icon: User,
    title: 'Apply & Get Approved',
    description: 'Simple 3-minute application. We approve based on ambition, not experience. No technical background required.',
    timeline: '24-48 hours',
    details: [
      'Complete online application in 3 minutes',
      'Phone interview with franchise team',
      'Territory selection and protection',
      'Approval and welcome package'
    ]
  },
  {
    number: 2,
    icon: Award,
    title: 'Complete Training',
    description: 'Intensive 5-day training program covers sales, client relationships, and the HERA advantage. 100% remote.',
    timeline: '1 week',
    details: [
      'HERA system overview and competitive advantages',
      'Sales methodology and client discovery',
      'Proposal creation and pricing strategies',
      'Client relationship management'
    ]
  },
  {
    number: 3,
    icon: Search,
    title: 'Identify Prospects',
    description: 'Use our proven prospecting system to identify businesses frustrated with legacy ERP or manual processes.',
    timeline: '2-4 weeks',
    details: [
      'Target market identification (manufacturing, healthcare, retail)',
      'Pain point discovery methodology',
      'Warm introduction strategies',
      'Referral system activation'
    ]
  },
  {
    number: 4,
    icon: FileText,
    title: 'Present & Propose',
    description: 'Deliver HERA\'s compelling value proposition. 24-hour implementation vs 18-month traditional systems.',
    timeline: '1-2 weeks',
    details: [
      'Discovery sessions with prospects',
      'Custom proposal generation',
      'Live system demonstrations',
      'ROI calculations and business case'
    ]
  },
  {
    number: 5,
    icon: Rocket,
    title: 'HERA Delivers',
    description: 'You close the deal, HERA implements in 24 hours. You earn commission, client gets revolutionary ERP.',
    timeline: '24 hours',
    details: [
      'Contract signing and project initiation',
      'HERA technical team takes over',
      '24-hour implementation completion',
      'Commission payment and ongoing support'
    ]
  }
]

const support = [
  {
    icon: Shield,
    title: 'Territory Protection',
    description: 'Exclusive geographic protection ensures no HERA franchise competition in your market.'
  },
  {
    icon: Zap,
    title: 'Technical Delivery',
    description: 'HERA handles all implementation, support, and technical aspects. You focus on relationships.'
  },
  {
    icon: Users,
    title: 'Marketing Support',
    description: 'Professional marketing materials, case studies, and lead generation support included.'
  },
  {
    icon: Clock,
    title: 'Ongoing Training',
    description: 'Monthly training sessions, quarterly conferences, and 24/7 franchise support portal.'
  }
]

export default function HowItWorksPage() {
  return (
    <FranchiseLayout>
      {/* Hero Section */}
      <FranchiseHero
        title="From Chaos to Clarity"
        subtitle="Simple 5-Step System to $25K–$500K+ Income"
        description="Our proven franchise system eliminates complexity. You focus on relationships, we handle everything else."
        ctaText="Start Step 1 Now"
        ctaLink="/franchise/apply"
        secondaryCtaText="View Income Potential"
        secondaryCtaLink="/franchise/income"
      />

      {/* Process Steps */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              The 5-Step HERA System
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Designed for business professionals who want freedom, income, and impact
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col lg:flex-row items-center mb-16 last:mb-0">
                {/* Step Content */}
                <div className={`flex-1 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                        {step.number}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {step.title}
                        </h3>
                        <span className="text-sm text-blue-600 font-medium">
                          Timeline: {step.timeline}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Step Visual */}
                <div className={`w-full lg:w-80 mb-8 lg:mb-0 ${index % 2 === 1 ? 'lg:order-1 lg:mr-8' : 'lg:ml-8'}`}>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
                    <step.icon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <div className="text-center">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Step {step.number}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{step.timeline}</p>
                    </div>
                  </div>
                </div>

                {/* Connector Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 mt-32">
                    <ArrowRight className="h-6 w-6 text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              You're Never Alone
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Complete franchise support system ensures your success at every step
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {support.map((item, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200 text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Summary */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Your Journey Timeline
            </h2>
            <p className="text-xl text-blue-100 mb-12">
              From application to first commission in as little as 6-8 weeks
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Clock className="h-8 w-8 text-blue-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">Weeks 1-2</h3>
                <p className="text-sm text-blue-100">Application, approval, training completion</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Search className="h-8 w-8 text-green-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">Weeks 3-6</h3>
                <p className="text-sm text-blue-100">Prospecting, presentations, first proposals</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <DollarSign className="h-8 w-8 text-yellow-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">Week 7+</h3>
                <p className="text-sm text-blue-100">First deals close, commissions start flowing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              Ready to Start Step 1?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              The hardest part is making the decision. Everything else is just following our proven system.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 text-lg"
              >
                <Link href="/franchise/apply" className="flex items-center">
                  Apply Now - Step 1
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button 
                asChild
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg"
              >
                <Link href="/franchise/opportunity">
                  Learn About the Opportunity
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </FranchiseLayout>
  )
}