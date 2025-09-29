'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { HeraGradientBackgroundDNA } from '@/lib/dna/components/ui/hera-gradient-background-dna'
import { HeraButtonDNA } from '@/lib/dna/components/ui/hera-button-dna'
import { HeraInputDNA } from '@/lib/dna/components/ui/hera-input-dna'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Clock,
  CheckCircle,
  TrendingUp,
  Shield,
  Users,
  Zap,
  Calendar,
  ArrowRight,
  Play,
  Building,
  Heart,
  Factory,
  Briefcase,
  ChevronDown,
  Star,
  Award,
  Lock,
  Globe
} from 'lucide-react'

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [implementationCount, setImplementationCount] = useState(47)

  // Simulate live counter
  useEffect(() => {
    const interval = setInterval(() => {
      setImplementationCount(prev => prev + Math.floor(Math.random() * 3))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const industries = [
    {
      id: 'restaurant',
      name: 'Restaurant',
      icon: Building,
      example: "Mario's Restaurant",
      timeline: 'Menu → POS → Inventory in 4 days',
      metrics: { timeSaved: '18 months', costReduction: '92%', efficiency: '3.5x' }
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      icon: Heart,
      example: "Dr. Smith's Practice",
      timeline: 'Patients → Billing → Compliance in 6 days',
      metrics: { timeSaved: '12 months', costReduction: '87%', efficiency: '4.2x' }
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing',
      icon: Factory,
      example: 'TechParts Industries',
      timeline: 'Inventory → Production → Quality in 5 days',
      metrics: { timeSaved: '24 months', costReduction: '94%', efficiency: '5.1x' }
    },
    {
      id: 'professional',
      name: 'Professional Services',
      icon: Briefcase,
      example: 'Strategic Partners LLC',
      timeline: 'Projects → Time → Billing in 3 days',
      metrics: { timeSaved: '9 months', costReduction: '89%', efficiency: '3.8x' }
    }
  ]

  const processSteps = [
    {
      day: 'Day 1-2',
      title: 'Business DNA Capture',
      description: 'We analyze your business requirements and processes',
      icon: Clock,
      details:
        'Our AI-powered system captures your unique business DNA through intelligent questionnaires and process mapping.'
    },
    {
      day: 'Day 3-4',
      title: 'Universal Configuration',
      description: 'HERA generates your custom business modules',
      icon: Zap,
      details:
        'Using our flexible universal architecture, we configure your entire business system in hours, not months.'
    },
    {
      day: 'Day 5-7',
      title: 'Live Demo Deployment',
      description: 'See your actual business running on HERA',
      icon: CheckCircle,
      details:
        'Your complete business system goes live with real workflows, actual data structures, and custom processes.'
    }
  ]

  const faqs = [
    {
      question: 'How is this different from other demos?',
      answer:
        'Traditional ERPs show generic templates. HERA shows YOUR actual business with YOUR processes, YOUR data structures, and YOUR workflows - all working in just one week.'
    },
    {
      question: 'What if my business is too complex?',
      answer:
        "HERA's universal architecture handles any complexity. We've successfully demonstrated systems for multi-national manufacturers, hospital networks, and restaurant chains - all within 7 days."
    },
    {
      question: 'How secure is my data during the demo?',
      answer:
        'Your demo runs in a completely isolated environment with enterprise-grade security. All data is encrypted, and you maintain full control. After the demo, you can export or delete everything.'
    },
    {
      question: 'What happens after the week?',
      answer:
        "You'll have a fully functional system ready for production. Most clients go live within 2-4 weeks total, compared to 12-24 months with traditional ERPs."
    }
  ]

  return (
    <HeraGradientBackgroundDNA showBlobs={true} blobCount={3}>
      <div className="relative z-10 w-full">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 bg-background/80 dark:bg-background/80 backdrop-blur-xl z-50 border-b border-border/20 dark:border-border/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-18">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg mr-3">
                  <Building className="w-7 h-7 text-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text">
                    HERA
                  </h1>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">
                    Enterprise Platform
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <a
                  href="#proof"
                  className="ink dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 font-medium transition-colors"
                >
                  The Proof
                </a>
                <a
                  href="#process"
                  className="ink dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 font-medium transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#industries"
                  className="ink dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 font-medium transition-colors"
                >
                  Industries
                </a>
                <a
                  href="#testimonials"
                  className="ink dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 font-medium transition-colors"
                >
                  Success Stories
                </a>
                <HeraButtonDNA size="sm">Book Your Week</HeraButtonDNA>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-black text-gray-100 mb-6">
                See Your Future ERP Working in{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-600">
                  Two Weeks
                </span>
              </h1>
              <p className="text-xl md:text-2xl ink font-medium mb-8">
                Stop imagining. Start seeing your actual business running on HERA.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <HeraButtonDNA size="lg" icon={<Calendar className="h-5 w-5" />}>
                  Book Your Two-Week Business Preview
                </HeraButtonDNA>
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-semibold"
                >
                  <Play className="h-5 w-5" />
                  Watch 2-min Overview
                </button>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Join 500+ businesses who've seen their future
              </p>
            </div>

            {/* Visual Comparison */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <Card className="bg-background/80 dark:bg-background/80 backdrop-blur-xl shadow-lg border border-border/20 dark:border-border/50 p-6">
                <h3 className="text-xl font-bold text-gray-100 dark:text-foreground mb-4">
                  Traditional ERP Demos
                </h3>
                <div className="bg-muted dark:bg-muted rounded-lg p-4 mb-4">
                  <div className="h-48 bg-gray-700 dark:bg-muted-foreground/10 rounded opacity-50 flex items-center justify-center">
                    <span className="text-muted-foreground dark:text-muted-foreground text-sm">
                      Generic Demo Interface
                    </span>
                  </div>
                </div>
                <ul className="space-y-3 text-muted-foreground dark:text-muted-foreground">
                  <li className="flex items-center gap-3 text-base">
                    <span className="text-red-500 text-xl">✗</span> Generic sandbox data
                  </li>
                  <li className="flex items-center gap-3 text-base">
                    <span className="text-red-500 text-xl">✗</span> Template workflows
                  </li>
                  <li className="flex items-center gap-3 text-base">
                    <span className="text-red-500 text-xl">✗</span> 18-24 month implementation
                  </li>
                </ul>
              </Card>

              <Card className="bg-background/80 dark:bg-background/80 backdrop-blur-xl shadow-2xl border-2 border-blue-500 dark:border-cyan-500 p-6 transform hover:scale-105 transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-100 dark:text-foreground mb-4">
                  HERA Live Preview
                </h3>
                <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-800 dark:to-cyan-800 rounded shadow-lg flex items-center justify-center">
                    <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold">
                      Your Actual Business Running
                    </span>
                  </div>
                </div>
                <ul className="space-y-3 ink dark:text-gray-300">
                  <li className="flex items-center gap-3 text-base font-medium">
                    <span className="text-green-500 text-xl">✓</span> Your actual business data
                  </li>
                  <li className="flex items-center gap-3 text-base font-medium">
                    <span className="text-green-500 text-xl">✓</span> Your custom workflows
                  </li>
                  <li className="flex items-center gap-3 text-base font-medium">
                    <span className="text-green-500 text-xl">✓</span> Working in 2 weeks
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* The Proof Section */}
        <section
          id="proof"
          className="py-16 px-4 sm:px-6 lg:px-8 bg-background/80 dark:bg-background/40 backdrop-blur-xl"
        >
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-blue-700 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text mb-12">
              While Others Show Demos, We Show Your Reality
            </h2>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="bg-background/80 dark:bg-background/80 backdrop-blur-xl shadow-lg border border-border/20 dark:border-border/50 p-6 text-center">
                <h3 className="font-bold text-xl mb-2 text-gray-100 dark:text-foreground">SAP</h3>
                <p className="text-muted-foreground dark:text-muted-foreground mb-4">
                  Generic sandbox
                </p>
                <ArrowRight className="h-6 w-6 mx-auto mb-4 text-muted-foreground" />
                <p className="text-red-600 dark:text-red-400 font-semibold">18 months later</p>
              </Card>

              <Card className="bg-background/80 dark:bg-background/80 backdrop-blur-xl shadow-lg border border-border/20 dark:border-border/50 p-6 text-center">
                <h3 className="font-bold text-xl mb-2 text-gray-100 dark:text-foreground">
                  Oracle
                </h3>
                <p className="text-muted-foreground dark:text-muted-foreground mb-4">
                  Template demo
                </p>
                <ArrowRight className="h-6 w-6 mx-auto mb-4 text-muted-foreground" />
                <p className="text-red-600 dark:text-red-400 font-semibold">12 months later</p>
              </Card>

              <Card className="bg-background/80 dark:bg-background/80 backdrop-blur-xl shadow-2xl border-2 border-blue-500 dark:border-cyan-500 p-6 text-center transform hover:scale-105 transition-all duration-300">
                <h3 className="font-bold text-xl mb-2 text-gray-100 dark:text-foreground">HERA</h3>
                <p className="text-primary dark:text-blue-400 font-medium mb-4">
                  Your business working
                </p>
                <ArrowRight className="h-6 w-6 mx-auto mb-4 text-primary dark:text-blue-400" />
                <p className="text-green-600 dark:text-green-400 font-semibold">2 weeks</p>
              </Card>
            </div>

            {/* Video Testimonial */}
            <Card className="bg-background/80 dark:bg-background/80 backdrop-blur-xl shadow-xl border border-border/20 dark:border-border/50 p-8">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-grow">
                  <p className="text-lg text-gray-200 dark:text-gray-200 font-medium italic mb-3 leading-relaxed">
                    "I saw my restaurant running perfectly on day 5. Menu management, inventory
                    tracking, staff scheduling - everything was there and working exactly how we
                    operate."
                  </p>
                  <p className="ink dark:text-gray-300 font-semibold text-base">
                    Mario Rossi, Owner of Mario's Authentic Italian
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* The Two-Week Process */}
        <section id="process" className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-100 mb-12">
              Your Two-Week Journey to the Future
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {processSteps.map((step, index) => (
                <Card
                  key={index}
                  className={`p-6 cursor-pointer transition-all duration-300 ${ activeStep === index ?'border-2 border-violet-500 shadow-xl' : ''
                  }`}
                  onClick={() => setActiveStep(index)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-violet-600">{step.day}</span>
                    <step.icon className="h-8 w-8 text-violet-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-100 mb-2">{step.title}</h3>
                  <p className="ink mb-4">{step.description}</p>
                  {activeStep === index && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">{step.details}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Industry Showcase */}
        <section id="industries" className="py-16 px-4 sm:px-6 lg:px-8 bg-background/80">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-100 mb-12">
              Proven Across Every Industry
            </h2>

            <Tabs defaultValue="restaurant" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
                {industries.map(industry => (
                  <TabsTrigger key={industry.id} value={industry.id}>
                    <industry.icon className="h-4 w-4 mr-2" />
                    {industry.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {industries.map(industry => (
                <TabsContent key={industry.id} value={industry.id}>
                  <Card className="p-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-100 mb-4">
                          {industry.example}
                        </h3>
                        <p className="text-lg text-violet-600 font-semibold mb-6">
                          {industry.timeline}
                        </p>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Clock className="h-6 w-6 text-violet-600" />
                            <div>
                              <p className="font-semibold">Time Saved</p>
                              <p className="text-2xl font-bold text-violet-600">
                                {industry.metrics.timeSaved}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                            <div>
                              <p className="font-semibold">Cost Reduction</p>
                              <p className="text-2xl font-bold text-green-600">
                                {industry.metrics.costReduction}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Zap className="h-6 w-6 text-cyan-600" />
                            <div>
                              <p className="font-semibold">Efficiency Gain</p>
                              <p className="text-2xl font-bold text-cyan-600">
                                {industry.metrics.efficiency}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-violet-50 to-cyan-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-100 mb-4">Before & After</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Before HERA:</p>
                            <div className="bg-muted rounded p-3 text-sm">
                              Multiple disconnected systems, manual processes, no real-time
                              visibility
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">After HERA:</p>
                            <div className="bg-background rounded p-3 text-sm border-2 border-violet-200">
                              Unified platform, automated workflows, real-time dashboards
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* Social Proof */}
        <section id="testimonials" className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">
                Join the Revolution
              </h2>
              <div className="bg-gradient-to-r from-violet-600 to-cyan-600 text-foreground rounded-lg p-6 inline-block">
                <p className="text-3xl font-bold mb-2">{implementationCount}</p>
                <p className="text-lg">Implementations This Month</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="ink mb-4">
                    "The speed is unbelievable. We went from initial consultation to seeing our
                    entire operation running on HERA in just 10 days."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-300" />
                    <div>
                      <p className="font-semibold">Sarah Chen</p>
                      <p className="text-sm text-muted-foreground">CEO, TechFlow Solutions</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center items-center gap-8">
              <div className="flex items-center gap-2 ink">
                <Shield className="h-6 w-6" />
                <span className="font-semibold">SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2 ink">
                <Lock className="h-6 w-6" />
                <span className="font-semibold">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 ink">
                <Award className="h-6 w-6" />
                <span className="font-semibold">ISO 27001</span>
              </div>
              <div className="flex items-center gap-2 ink">
                <Globe className="h-6 w-6" />
                <span className="font-semibold">99.9% Uptime</span>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Credibility */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background/80">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-100 mb-12">
              How We Do It
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-100 mb-4">6 Universal Tables</h3>
                <p className="ink mb-4">
                  Our revolutionary architecture handles infinite complexity with just 6 tables,
                  eliminating the need for custom schemas.
                </p>
                <div className="bg-violet-50 rounded p-4">
                  <p className="text-sm font-mono text-violet-700">
                    core_organizations
                    <br />
                    core_entities
                    <br />
                    core_relationships
                    <br />
                    universal_transactions
                    <br />
                    universal_transaction_lines
                    <br />
                    core_dynamic_data
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-100 mb-4">Smart Code System</h3>
                <p className="ink mb-4">
                  Every business process is encoded with intelligent patterns that enable instant
                  configuration and automation.
                </p>
                <div className="bg-cyan-50 rounded p-4">
                  <p className="text-sm font-mono text-cyan-700">
                    HERA.REST.POS.SALE.v1
                    <br />
                    HERA.HLTH.PAT.VISIT.v1
                    <br />
                    HERA.MFG.PROD.ORDER.v1
                    <br />
                    HERA.PROF.TIME.BILL.v1
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-100 mb-4">AI-Native Architecture</h3>
                <p className="ink mb-4">
                  Built from the ground up with AI integration, enabling intelligent automation and
                  continuous optimization.
                </p>
                <div className="bg-green-50 rounded p-4">
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Auto-configuration</li>
                    <li>• Predictive analytics</li>
                    <li>• Natural language queries</li>
                    <li>• Self-optimizing workflows</li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-100 mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="p-6">
                  <h3 className="text-lg font-semibold text-gray-100 mb-3">{faq.question}</h3>
                  <p className="ink">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-600 to-cyan-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to See Your Business in HERA?
            </h2>
            <p className="text-xl text-foreground/90 mb-8">
              Limited to 10 previews per month. Book your week starting next Monday.
            </p>

            <Card className="p-8 max-w-md mx-auto">
              <form className="space-y-4">
                <HeraInputDNA
                  label="Business Type"
                  placeholder="e.g., Restaurant, Healthcare, Manufacturing"
                  icon={<Building className="h-5 w-5" />}
                />
                <HeraInputDNA
                  label="Company Size"
                  placeholder="Number of employees"
                  icon={<Users className="h-5 w-5" />}
                />
                <HeraInputDNA
                  label="Email"
                  type="email"
                  placeholder="your@company.com"
                  icon={<Globe className="h-5 w-5" />}
                />
                <HeraButtonDNA fullWidth size="lg" icon={<Calendar className="h-5 w-5" />}>
                  Book My Two-Week Preview
                </HeraButtonDNA>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground font-medium">
                  ✓ No setup fees for preview week
                  <br />
                  ✓ If you don't see value in 14 days, we'll refund your time
                  <br />✓ Your competitors are already seeing their future
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 bg-background text-foreground">
          <div className="max-w-7xl mx-auto text-center">
            <img
              src="/logo.png"
              alt="HERA"
              className="h-12 w-auto mx-auto mb-4 filter brightness-0 invert"
            />
            <p className="text-lg font-medium mb-2">ERP in weeks, not years</p>
            <p className="text-sm text-muted-foreground">Powered by patent pending technology</p>
          </div>
        </footer>
      </div>
    </HeraGradientBackgroundDNA>
  )
}
