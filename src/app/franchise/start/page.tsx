// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import Link from 'next/link'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { FranchiseHero } from '@/components/franchise/FranchiseHero'
import { TestimonialCard } from '@/components/franchise/TestimonialCard'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight,
  Clock,
  TrendingUp,
  Users,
  Award,
  Target,
  Zap,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Globe,
  Heart,
  Crown,
  Rocket,
  X
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Start Today - HERA Franchise Final Push',
  description: 'This is your moment. Limited territories remaining. Join the ERP revolution and start earning $25K–$500K+ annually.',
  keywords: 'HERA franchise final decision, start today, limited territories, ERP opportunity',
}

const urgencyFactors = [
  {
    icon: AlertTriangle,
    title: 'Limited Territories',
    description: 'Only 47 territories remaining nationwide',
    color: 'text-red-500'
  },
  {
    icon: Users,
    title: 'High Demand',
    description: '3.2 applications per available territory',
    color: 'text-orange-500'
  },
  {
    icon: Clock,
    title: 'First Come, First Served',
    description: 'Territories awarded to qualified applicants immediately',
    color: 'text-yellow-500'
  },
  {
    icon: Crown,
    title: 'Exclusive Protection',
    description: 'Once claimed, territories are protected forever',
    color: 'text-purple-500'
  }
]

const emotionalTriggers = [
  {
    icon: Heart,
    title: 'Freedom',
    description: 'Work from anywhere. Set your own schedule. Be your own boss.',
    impact: 'No more corporate politics or office commutes.'
  },
  {
    icon: DollarSign,
    title: 'Financial Security',
    description: 'Multiple revenue streams. Recurring income. Unlimited earning potential.',
    impact: 'Never worry about money again.'
  },
  {
    icon: Award,
    title: 'Recognition',
    description: 'Be known as the person who brings revolutionary technology to your market.',
    impact: 'Respect and admiration from peers and clients.'
  },
  {
    icon: Rocket,
    title: 'Legacy',
    description: 'Build something meaningful. Help businesses transform and thrive.',
    impact: 'Create lasting impact beyond just making money.'
  }
]

const testimonialFinal = {
  name: 'Jennifer Walsh',
  title: 'HERA Partner - Pacific Northwest',
  company: 'Earned $340K in Year 2',
  testimonial: 'I almost didn\'t apply because I thought it was too good to be true. Two years later, I\'ve earned more than my previous 5 years combined. The regret would have haunted me forever if I hadn\'t taken action.',
  rating: 5
}

const finalStats = [
  { stat: '24 Hours', label: 'To Change Your Life', sublabel: 'Application to approval' },
  { stat: '$340K', label: 'Average 2nd Year Income', sublabel: 'Based on active partners' },
  { stat: '95%', label: 'Partner Satisfaction', sublabel: 'Would recommend to others' },
  { stat: '47', label: 'Territories Left', sublabel: 'Nationwide availability' }
]

export default function StartPage() {
  return (
    <FranchiseLayout>
      {/* Hero Section */}
      <FranchiseHero
        title="This Is Your Moment"
        subtitle="Stop Dreaming. Start Earning. The Time Is NOW."
        description="Everything you've read, every success story you've seen, every dollar you could earn – it all starts with one decision. Make it today."
        ctaText="Apply Right Now"
        ctaLink="/franchise/apply"
        secondaryCtaText="Call Our Team"
        secondaryCtaLink="tel:+1-800-HERA-NOW"
        backgroundVariant="gradient"
      />

      {/* Urgency Section */}
      <section className="py-16 bg-red-50 dark:bg-red-900/10 border-y-4 border-red-200 dark:border-red-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-red-900 dark:text-red-100 mb-4">
              Territory Scarcity Alert
            </h2>
            <p className="text-lg text-red-800 dark:text-red-200 max-w-2xl mx-auto">
              High-value territories are being claimed daily. Don't let someone else take your market.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {urgencyFactors.map((factor, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-red-200 dark:border-red-800 shadow-lg">
                <factor.icon className={`h-8 w-8 ${factor.color} mb-3`} />
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                  {factor.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button 
              asChild
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-12 py-6 text-xl animate-pulse"
            >
              <Link href="/franchise/apply" className="flex items-center">
                Claim Your Territory NOW
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
            <p className="text-sm text-red-700 dark:text-red-300 mt-3">
              ⚠️ Applications processed within 24 hours • Territories awarded immediately
            </p>
          </div>
        </div>
      </section>

      {/* Emotional Triggers */}
      <section className="py-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              What Are You Really Buying?
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              This isn't just a business opportunity. This is your escape plan from everything 
              you hate about your current situation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {emotionalTriggers.map((trigger, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <trigger.icon className="h-12 w-12 text-white mb-4" />
                <h3 className="text-2xl font-bold text-white mb-3">
                  {trigger.title}
                </h3>
                <p className="text-lg text-blue-100 mb-4">
                  {trigger.description}
                </p>
                <div className="border-t border-white/20 pt-4">
                  <p className="text-sm text-yellow-300 font-medium">
                    <strong>Real Impact:</strong> {trigger.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              The Question Isn't "Can I Afford It?"
            </h3>
            <p className="text-xl text-blue-100 mb-8">
              The question is: "Can I afford NOT to do this?"
            </p>
            
            <Button 
              asChild
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-12 py-6 text-xl"
            >
              <Link href="/franchise/apply" className="flex items-center">
                I Can't Afford NOT To Do This
                <Rocket className="ml-3 h-6 w-6" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              This Partner Almost Didn't Apply
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Her biggest regret would have been missing this opportunity
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <TestimonialCard variant="featured" {...testimonialFinal} />
          </div>
        </div>
      </section>

      {/* Final Stats Push */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              The Numbers That Matter
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Every statistic represents a life changed, a dream realized, a future secured
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {finalStats.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stat.stat}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {stat.label}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.sublabel}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fear vs Reward */}
      <section className="py-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Two Paths. One Choice.
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Path 1: Do Nothing */}
              <div className="bg-red-900/30 rounded-xl p-8 border-2 border-red-500">
                <h3 className="text-2xl font-bold text-red-300 mb-6 text-center">
                  Path 1: Do Nothing
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start text-red-200">
                    <X className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    Stay in the same job, same income, same frustrations
                  </li>
                  <li className="flex items-start text-red-200">
                    <X className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    Watch others claim the territories you could have owned
                  </li>
                  <li className="flex items-start text-red-200">
                    <X className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    Wonder "what if" for the rest of your life
                  </li>
                  <li className="flex items-start text-red-200">
                    <X className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    Miss the chance to earn $300K+ annually
                  </li>
                  <li className="flex items-start text-red-200">
                    <X className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    Keep trading time for money with no escape plan
                  </li>
                </ul>
              </div>

              {/* Path 2: Take Action */}
              <div className="bg-green-900/30 rounded-xl p-8 border-2 border-green-500">
                <h3 className="text-2xl font-bold text-green-300 mb-6 text-center">
                  Path 2: Take Action
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start text-green-200">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    Own exclusive territory in the $50B ERP market
                  </li>
                  <li className="flex items-start text-green-200">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    Work from home with complete freedom
                  </li>
                  <li className="flex items-start text-green-200">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    Earn $25K–$500K+ annually with unlimited scaling
                  </li>
                  <li className="flex items-start text-green-200">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    Build relationships while HERA handles all tech
                  </li>
                  <li className="flex items-start text-green-200">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    Join the 95% who say "best decision I ever made"
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              The Time Is NOW
            </h1>
            
            <p className="text-2xl text-blue-100 mb-6">
              You've seen the proof. You know the opportunity. You understand the urgency.
            </p>
            
            <p className="text-xl text-white mb-12 font-medium">
              The only thing standing between you and financial freedom is a decision.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-12">
              <h3 className="text-2xl font-bold text-white mb-4">
                What Happens in the Next 5 Minutes:
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-bold mr-3 mt-1">1</div>
                  <div>
                    <p className="text-white font-semibold">Click Apply</p>
                    <p className="text-blue-100 text-sm">3-minute application</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-bold mr-3 mt-1">2</div>
                  <div>
                    <p className="text-white font-semibold">Get Approved</p>
                    <p className="text-blue-100 text-sm">24-48 hour response</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-bold mr-3 mt-1">3</div>
                  <div>
                    <p className="text-white font-semibold">Start Earning</p>
                    <p className="text-blue-100 text-sm">First commission in 60 days</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Button 
                asChild
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-16 py-8 text-2xl shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                <Link href="/franchise/apply" className="flex items-center">
                  YES! I Want My Territory
                  <ArrowRight className="ml-4 h-8 w-8" />
                </Link>
              </Button>

              <p className="text-yellow-300 font-bold text-lg">
                ⚡ Applications processed in order received ⚡
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button 
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                >
                  <a href="tel:+1-800-HERA-NOW">
                    Call Now: 1-800-HERA-NOW
                  </a>
                </Button>
                
                <Button 
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                >
                  <a href="mailto:franchise@hera.com">
                    Email: franchise@hera.com
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Warning */}
      <section className="py-12 bg-red-600">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-300 mx-auto mb-4" />
            <p className="text-xl text-white font-bold">
              WARNING: Territories are being claimed daily. Tomorrow might be too late.
            </p>
            <p className="text-red-100 mt-2">
              Don't let someone else take the territory that could have been yours.
            </p>
          </div>
        </div>
      </section>
    </FranchiseLayout>
  )
}