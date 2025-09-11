'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { FranchiseLayout } from '@/components/franchise/FranchiseLayout'
import { FranchiseHero } from '@/components/franchise/FranchiseHero'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown,
  ChevronUp,
  ArrowRight,
  HelpCircle,
  DollarSign,
  Clock,
  Users,
  Shield,
  Award,
  Briefcase,
  Globe,
  Cog,
  CheckCircle
} from 'lucide-react'

const faqs = [
  {
    category: 'Getting Started',
    icon: Users,
    questions: [
      {
        question: 'Do I need technical experience to be successful?',
        answer: 'No! HERA handles 100% of the technical implementation and support. You focus on relationship building and sales. Many of our most successful partners come from non-technical backgrounds like sales, consulting, or business development.'
      },
      {
        question: 'What kind of support do I get as a new franchise partner?',
        answer: 'Complete support including: 5-day intensive training program, ongoing monthly training sessions, dedicated franchise support team, marketing materials, case studies, territory protection, and 24/7 access to our franchise portal.'
      },
      {
        question: 'How much territory will I get?',
        answer: 'Territory size depends on market density and your investment level. Typical territories include 50-200 target businesses with exclusive geographic protection. We analyze market potential during the application process to ensure adequate opportunity.'
      },
      {
        question: 'Is this MLM or network marketing?',
        answer: 'No. This is a legitimate B2B technology franchise selling enterprise software to businesses. There are no recruitment requirements, no downlines, and no pyramid structure. You earn commissions by selling HERA ERP systems to businesses.'
      }
    ]
  },
  {
    category: 'Investment & Income',
    icon: DollarSign,
    questions: [
      {
        question: 'What is the franchise fee and total investment?',
        answer: 'Franchise fee ranges from $45K-$125K depending on territory size. Total investment including working capital is typically $75K-$200K. Financing options available for qualified candidates. ROI typically achieved within 6-12 months.'
      },
      {
        question: 'How much can I realistically earn?',
        answer: 'Income varies by effort and territory. Part-time partners typically earn $25K-$85K annually. Full-time dedicated partners earn $100K-$500K+. Top performers exceed $1M annually. Commission rates range from 30-50% of deal value.'
      },
      {
        question: 'When do I get paid?',
        answer: 'Commission payments are made within 30 days of client implementation completion. Since HERA implements in 24 hours, you typically receive payment within 45-60 days of contract signing. Recurring revenue shares paid monthly.'
      },
      {
        question: 'Are there ongoing franchise fees?',
        answer: 'Yes, ongoing royalty of 8-12% of gross commissions, plus 2% marketing fund contribution. These fees cover ongoing support, training, system updates, and marketing materials. No hidden fees or surprise charges.'
      }
    ]
  },
  {
    category: 'Business Model',
    icon: Briefcase,
    questions: [
      {
        question: 'What exactly do I do vs what HERA does?',
        answer: 'You: Build relationships, identify prospects, present solutions, close deals. HERA: Complete technical implementation, ongoing support, system maintenance, client success management. Perfect division of labor.'
      },
      {
        question: 'How long does it take to close a deal?',
        answer: 'Sales cycles typically range from 30-90 days depending on client size and decision-making process. The 24-hour implementation guarantee significantly accelerates decision-making compared to traditional ERP sales cycles of 6-18 months.'
      },
      {
        question: 'What size businesses should I target?',
        answer: 'Sweet spot is $5M-$100M annual revenue businesses. These companies need enterprise ERP but can\'t afford traditional SAP/Oracle implementations. Manufacturing, healthcare, retail, and logistics are particularly strong verticals.'
      },
      {
        question: 'Can I work part-time initially?',
        answer: 'Yes, many partners start part-time while maintaining other commitments. However, full-time dedication typically generates 3-5x higher income. We recommend transitioning to full-time once you have 2-3 active prospects.'
      }
    ]
  },
  {
    category: 'HERA Technology',
    icon: Cog,
    questions: [
      {
        question: 'How can HERA implement in 24 hours when others take months?',
        answer: 'HERA\'s revolutionary universal 6-table architecture eliminates customization complexity. Pre-built industry templates, automated configuration, and AI-powered setup enable rapid deployment without compromising functionality.'
      },
      {
        question: 'What if clients need customizations?',
        answer: 'HERA\'s dynamic data system handles 95% of customization requests without code changes. For complex requirements, HERA\'s technical team provides solutions through universal Smart Codes and workflow configurations.'
      },
      {
        question: 'How does HERA compare to SAP and Oracle?',
        answer: 'HERA delivers equivalent functionality at 90% lower cost and 99% faster implementation. See our detailed comparison showing HERA\'s advantages in speed, cost, success rate, and user adoption.'
      },
      {
        question: 'What happens if something goes wrong after implementation?',
        answer: 'HERA provides 24/7 technical support with guaranteed response times. Our 95% success rate means issues are rare, but when they occur, HERA\'s technical team resolves them quickly at no cost to you or the client.'
      }
    ]
  },
  {
    category: 'Legal & Protection',
    icon: Shield,
    questions: [
      {
        question: 'Do I get exclusive territory protection?',
        answer: 'Yes, absolute territory protection is guaranteed. No other HERA franchise will be awarded in your protected area. Territory boundaries are clearly defined in your franchise agreement with legal protection.'
      },
      {
        question: 'What if I want to sell my franchise?',
        answer: 'Franchises are transferable subject to HERA approval of the buyer. Transfer fees apply. Given the income potential and territory protection, HERA franchises typically sell at premium multiples.'
      },
      {
        question: 'Can I hire employees or build a team?',
        answer: 'Yes, you can hire sales staff and build a team within your territory. Many successful partners scale by hiring additional business development representatives. HERA provides training for your team members.'
      },
      {
        question: 'What legal support do I get?',
        answer: 'Complete legal support including template contracts, MSAs, SOWs, and other business documents. HERA legal team reviews complex deals and provides guidance on contract negotiations and risk management.'
      }
    ]
  }
]

const stats = [
  { number: '95%', label: 'Partner Satisfaction Rate' },
  { number: '24 hrs', label: 'Average Implementation Time' },
  { number: '$285K', label: 'Average Annual Partner Income' },
  { number: '500+', label: 'Successful Implementations' }
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  return (
    <FranchiseLayout>
      {/* Hero Section */}
      <FranchiseHero
        title="Your Questions Answered"
        subtitle="Everything You Need to Know About the HERA Opportunity"
        description="Get honest, detailed answers to the most common questions about becoming a HERA franchise partner."
        ctaText="Still Have Questions?"
        ctaLink="mailto:franchise@hera.com"
        secondaryCtaText="Apply Now"
        secondaryCtaLink="/franchise/apply"
      />

      {/* Quick Stats */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Honest answers to help you make an informed decision
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                {/* Category Header */}
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <category.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {category.category}
                  </h3>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {category.questions.map((faq, faqIndex) => {
                    const itemId = `${categoryIndex}-${faqIndex}`
                    const isOpen = openItems.includes(itemId)

                    return (
                      <div key={faqIndex} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-900 dark:text-white pr-4">
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-slate-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0" />
                          )}
                        </button>
                        
                        {isOpen && (
                          <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-slate-600 dark:text-slate-400 pt-4 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <HelpCircle className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Still Have Questions?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Schedule a 30-minute call with our franchise team for personalized answers
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <CheckCircle className="h-8 w-8 text-green-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">No Pressure</h3>
                <p className="text-sm text-blue-100">Educational conversation to help you decide</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Award className="h-8 w-8 text-yellow-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">Territory Analysis</h3>
                <p className="text-sm text-blue-100">Review available territories and market potential</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <Globe className="h-8 w-8 text-purple-300 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">Success Planning</h3>
                <p className="text-sm text-blue-100">Discuss your goals and path to success</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-6 text-lg"
              >
                <a href="mailto:franchise@hera.com" className="flex items-center">
                  Schedule Discovery Call
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              
              <Button 
                asChild
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg"
              >
                <Link href="/franchise/apply">
                  Apply Online Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Common Concerns Addressed */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Common Concerns Addressed
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Let us put your mind at ease about the most common hesitations
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-6 border border-red-200 dark:border-red-800">
                <h3 className="font-bold text-red-900 dark:text-red-100 mb-3">
                  ❌ "I'm not technical enough"
                </h3>
                <p className="text-red-800 dark:text-red-200 text-sm mb-4">
                  Many people worry they need technical skills to succeed.
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-red-300 dark:border-red-700">
                  <p className="text-slate-700 dark:text-slate-300 text-sm">
                    <strong>Reality:</strong> Our most successful partners are former sales professionals, 
                    business consultants, and relationship builders. HERA handles 100% of technical delivery.
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                <h3 className="font-bold text-orange-900 dark:text-orange-100 mb-3">
                  ❌ "Market is too competitive"
                </h3>
                <p className="text-orange-800 dark:text-orange-200 text-sm mb-4">
                  The ERP market seems saturated with big players.
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-orange-300 dark:border-orange-700">
                  <p className="text-slate-700 dark:text-slate-300 text-sm">
                    <strong>Reality:</strong> 95% of businesses still use manual processes. 
                    Traditional ERPs have 60% failure rates. HERA's 24-hour implementation is revolutionary.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-3">
                  ❌ "Too good to be true"
                </h3>
                <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-4">
                  24-hour implementation sounds impossible.
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-yellow-300 dark:border-yellow-700">
                  <p className="text-slate-700 dark:text-slate-300 text-sm">
                    <strong>Reality:</strong> Our universal 6-table architecture and pre-built templates 
                    make rapid deployment possible. 500+ successful implementations prove it works.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3">
                  ❌ "High investment risk"
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-4">
                  Worried about losing the franchise investment.
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-blue-300 dark:border-blue-700">
                  <p className="text-slate-700 dark:text-slate-300 text-sm">
                    <strong>Reality:</strong> 95% partner satisfaction rate, average ROI in 6-12 months, 
                    and exclusive territory protection minimize risk. Most partners break even quickly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Take Action */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              Questions Answered. Time to Act.
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Don't let analysis paralysis cost you the opportunity. 
              Limited territories are being claimed by decisive professionals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 text-lg"
              >
                <Link href="/franchise/apply" className="flex items-center">
                  Apply Now - 3 Minutes
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button 
                asChild
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg"
              >
                <a href="mailto:franchise@hera.com">
                  Email Our Team
                </a>
              </Button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              No obligation. No pressure. Just honest answers and real opportunity.
            </p>
          </div>
        </div>
      </section>
    </FranchiseLayout>
  )
}