'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Check,
  X,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Building2,
  Users,
  TrendingUp,
  Clock,
  Award,
  ArrowRight,
  Calculator,
  Brain,
  Rocket,
  ChevronRight
} from 'lucide-react'

export default function HanaSetPricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // Annual pricing offers 20% discount
  const discount = billingPeriod === 'annual' ? 0.8 : 1
  
  const plans = [
    {
      id: 'starter',
      name: 'HanaSet Starter',
      description: 'Perfect for small businesses and startups',
      monthlyPrice: 49,
      features: [
        { name: 'Up to 5 users', included: true },
        { name: '1 organization', included: true },
        { name: 'Basic COA templates (50+)', included: true },
        { name: 'Manual journal entries', included: true },
        { name: 'Basic financial reports', included: true },
        { name: 'Email support', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'Auto-journal engine', included: false },
        { name: 'Multi-currency', included: false },
        { name: 'API access', included: false },
        { name: 'Custom integrations', included: false },
        { name: 'Priority support', included: false },
      ],
      color: 'blue',
      popular: false,
    },
    {
      id: 'professional',
      name: 'HanaSet Professional',
      description: 'Ideal for growing businesses with complex needs',
      monthlyPrice: 149,
      features: [
        { name: 'Up to 25 users', included: true },
        { name: '3 organizations', included: true },
        { name: 'All COA templates (132+)', included: true },
        { name: 'Auto-journal engine (85% automation)', included: true },
        { name: 'Advanced financial reports', included: true },
        { name: 'Priority email & chat support', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'Multi-currency support', included: true },
        { name: 'API access (1000 calls/month)', included: true },
        { name: 'Basic integrations', included: true },
        { name: 'Custom integrations', included: false },
        { name: 'Dedicated account manager', included: false },
      ],
      color: 'purple',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'HanaSet Enterprise',
      description: 'Complete solution for large organizations',
      monthlyPrice: 449,
      features: [
        { name: 'Unlimited users', included: true },
        { name: 'Unlimited organizations', included: true },
        { name: 'All COA templates + custom', included: true },
        { name: 'Auto-journal engine (95%+ automation)', included: true },
        { name: 'Real-time financial analytics', included: true },
        { name: '24/7 phone, chat & email support', included: true },
        { name: 'Mobile app access + white label', included: true },
        { name: 'Multi-currency support', included: true },
        { name: 'Unlimited API access', included: true },
        { name: 'All integrations + custom', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'On-premise deployment option', included: true },
      ],
      color: 'orange',
      popular: false,
    }
  ]

  const calculatePrice = (monthlyPrice: number) => {
    const price = monthlyPrice * discount
    return billingPeriod === 'annual' 
      ? `$${Math.round(price * 12).toLocaleString()}/year`
      : `$${Math.round(price)}/month`
  }

  const calculateMonthlyEquivalent = (monthlyPrice: number) => {
    if (billingPeriod === 'annual') {
      return `$${Math.round(monthlyPrice * discount)}/month`
    }
    return null
  }

  const comparisonFeatures = [
    {
      category: 'Core Features',
      features: [
        { name: 'Universal 6-table architecture', starter: true, professional: true, enterprise: true },
        { name: 'Chart of Accounts setup time', starter: '2 minutes', professional: '30 seconds', enterprise: '30 seconds' },
        { name: 'IFRS compliance', starter: true, professional: true, enterprise: true },
        { name: 'Multi-tenant isolation', starter: true, professional: true, enterprise: true },
        { name: 'Smart code intelligence', starter: 'Basic', professional: 'Advanced', enterprise: 'AI-Enhanced' },
      ]
    },
    {
      category: 'Automation',
      features: [
        { name: 'Journal automation rate', starter: '0%', professional: '85%', enterprise: '95%+' },
        { name: 'Transaction processing', starter: 'Manual', professional: 'Semi-auto', enterprise: 'Full auto' },
        { name: 'Batch processing', starter: false, professional: true, enterprise: true },
        { name: 'AI-powered classification', starter: false, professional: true, enterprise: true },
        { name: 'Custom automation rules', starter: false, professional: '10', enterprise: 'Unlimited' },
      ]
    },
    {
      category: 'Support & Training',
      features: [
        { name: 'Support channels', starter: 'Email', professional: 'Email + Chat', enterprise: '24/7 All channels' },
        { name: 'Response time', starter: '48 hours', professional: '4 hours', enterprise: '30 minutes' },
        { name: 'Onboarding', starter: 'Self-service', professional: 'Guided', enterprise: 'White-glove' },
        { name: 'Training materials', starter: 'Documentation', professional: 'Videos + Docs', enterprise: 'Custom training' },
        { name: 'Implementation support', starter: false, professional: 'Remote', enterprise: 'On-site available' },
      ]
    }
  ]

  const testimonials = [
    {
      company: "Mario's Restaurant",
      quote: "Saved $463,000 in implementation costs. The 30-second COA setup is revolutionary!",
      author: "Mario Rossi",
      role: "Owner",
      savings: "$463,000"
    },
    {
      company: "TechParts Industries",
      quote: "Auto-journal engine reduced our accounting workload by 92%. Game-changing technology.",
      author: "Sarah Chen",
      role: "CFO",
      savings: "92% time saved"
    },
    {
      company: "Healthcare Plus Clinic",
      quote: "Perfect IFRS compliance out of the box. No more expensive consultants!",
      author: "Dr. Ahmed Hassan",
      role: "Medical Director",
      savings: "$180,000"
    }
  ]

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge className="mb-4" variant="secondary">
          <Sparkles className="w-3 h-3 mr-1" />
          Limited Time: 20% off annual plans
        </Badge>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          HanaSet Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Revolutionary financial automation that pays for itself. Choose the plan that fits your business.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Label htmlFor="billing-toggle" className={billingPeriod === 'monthly' ? 'font-semibold' : ''}>
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={billingPeriod === 'annual'}
          onCheckedChange={(checked) => setBillingPeriod(checked ? 'annual' : 'monthly')}
        />
        <Label htmlFor="billing-toggle" className={billingPeriod === 'annual' ? 'font-semibold' : ''}>
          Annual
          <Badge variant="secondary" className="ml-2">Save 20%</Badge>
        </Label>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-purple-500 shadow-lg scale-105' : ''}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="text-3xl font-bold">{calculatePrice(plan.monthlyPrice)}</div>
                {calculateMonthlyEquivalent(plan.monthlyPrice) && (
                  <p className="text-sm text-muted-foreground">
                    {calculateMonthlyEquivalent(plan.monthlyPrice)} billed annually
                  </p>
                )}
              </div>
              
              <ul className="space-y-3">
                {plan.features.slice(0, 7).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${!feature.included ? 'text-muted-foreground' : ''}`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full mt-6" 
                variant={plan.popular ? "default" : "outline"}
                onClick={() => setSelectedPlan(plan.id)}
              >
                Get Started
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Comparison */}
      <Tabs defaultValue="features" className="mb-16">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="features">Feature Comparison</TabsTrigger>
          <TabsTrigger value="roi">ROI Calculator</TabsTrigger>
          <TabsTrigger value="testimonials">Customer Success</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Feature Comparison</CardTitle>
              <CardDescription>
                See exactly what's included in each plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 pr-4">Feature</th>
                      <th className="text-center px-4 py-4">Starter</th>
                      <th className="text-center px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          Professional
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        </div>
                      </th>
                      <th className="text-center px-4 py-4">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((category, categoryIndex) => (
                      <>
                        <tr key={`category-${categoryIndex}`} className="bg-muted/50">
                          <td colSpan={4} className="font-semibold py-3 px-4">
                            {category.category}
                          </td>
                        </tr>
                        {category.features.map((feature, featureIndex) => (
                          <tr key={`feature-${categoryIndex}-${featureIndex}`} className="border-b">
                            <td className="py-4 pr-4">{feature.name}</td>
                            <td className="text-center px-4 py-4">
                              {typeof feature.starter === 'boolean' ? (
                                feature.starter ? (
                                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-gray-300 mx-auto" />
                                )
                              ) : (
                                <span className="text-sm">{feature.starter}</span>
                              )}
                            </td>
                            <td className="text-center px-4 py-4">
                              {typeof feature.professional === 'boolean' ? (
                                feature.professional ? (
                                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-gray-300 mx-auto" />
                                )
                              ) : (
                                <span className="text-sm">{feature.professional}</span>
                              )}
                            </td>
                            <td className="text-center px-4 py-4">
                              {typeof feature.enterprise === 'boolean' ? (
                                feature.enterprise ? (
                                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-gray-300 mx-auto" />
                                )
                              ) : (
                                <span className="text-sm">{feature.enterprise}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                ROI Calculator
              </CardTitle>
              <CardDescription>
                See how much HanaSet can save your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Traditional ERP Costs</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <span>Implementation</span>
                      <span className="font-semibold">$500,000 - $5M</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <span>Annual License</span>
                      <span className="font-semibold">$50,000 - $500,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <span>Consultants</span>
                      <span className="font-semibold">$200,000+/year</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <span>Time to Deploy</span>
                      <span className="font-semibold">18-36 months</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total First Year</span>
                      <span className="text-red-600">$750,000 - $5.7M</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">HanaSet Professional</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span>Implementation</span>
                      <span className="font-semibold">$0 (30 seconds)</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span>Annual License</span>
                      <span className="font-semibold">$1,788</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span>Consultants</span>
                      <span className="font-semibold">$0 (not needed)</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span>Time to Deploy</span>
                      <span className="font-semibold">30 seconds</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total First Year</span>
                      <span className="text-green-600">$1,788</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg">
                <p className="text-3xl font-bold text-green-600 mb-2">
                  Save $748,212 - $5.7M
                </p>
                <p className="text-muted-foreground">
                  in your first year alone with HanaSet
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonials" className="mt-8">
          <div className="grid gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Award className="w-8 h-8 text-yellow-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-lg mb-4 italic">"{testimonial.quote}"</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{testimonial.author}</p>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.role}, {testimonial.company}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {testimonial.savings}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* FAQ Section */}
      <Card className="mb-16">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">How is the setup really just 30 seconds?</h3>
            <p className="text-muted-foreground">
              HanaSet uses pre-built templates for 132 country-industry combinations. When you select 
              your country and industry, we instantly deploy a complete, IFRS-compliant Chart of Accounts 
              with all necessary GL accounts, mappings, and posting rules.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What does 85% journal automation mean?</h3>
            <p className="text-muted-foreground">
              Our AI-powered engine automatically creates journal entries for 85% of your business 
              transactions. Sales, purchases, payments, and receipts are processed without manual 
              intervention, saving your team 3.6+ hours daily.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Can I switch plans later?</h3>
            <p className="text-muted-foreground">
              Yes! You can upgrade or downgrade anytime. When upgrading, you only pay the prorated 
              difference. Downgrades take effect at the next billing cycle.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-muted-foreground">
              We offer a 30-day money-back guarantee on all plans. Additionally, we provide free 
              proof-of-concept implementations for Enterprise customers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="text-center">
        <Card className="max-w-3xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-0">
          <CardHeader>
            <CardTitle className="text-3xl">
              Ready to Transform Your Financial Operations?
            </CardTitle>
            <CardDescription className="text-lg">
              Join thousands of businesses saving millions with HanaSet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <Rocket className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="font-semibold">30-second setup</p>
              </div>
              <div className="text-center">
                <Brain className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="font-semibold">85% automation</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="font-semibold">$34K annual savings</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline">
                Schedule Demo
                <Clock className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 30-day money-back guarantee
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}