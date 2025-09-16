// ================================================================================
// HERA PRICING PAGE
// Smart Code: HERA.PAGE.PRICING.PUBLIC.v1
// Public pricing page with tiered plans
// ================================================================================

import Link from 'next/link'
import { 
  Sparkles, 
  Check,
  ArrowRight,
  Zap,
  Building,
  Globe
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card } from '@/src/components/ui/card'

const PRICING_PLANS = [
  {
    name: 'Starter',
    description: 'Perfect for small businesses',
    price: '$49',
    period: '/month',
    icon: Sparkles,
    color: 'from-blue-600 to-cyan-600',
    features: [
      'Up to 5 users',
      'Core modules (POS, Appointments)',
      'Basic reporting',
      'Email support',
      '14-day free trial',
      'Single location',
    ],
    cta: 'Start Free Trial',
    href: '/signup',
  },
  {
    name: 'Professional',
    description: 'For growing businesses',
    price: '$149',
    period: '/month',
    icon: Zap,
    color: 'from-purple-600 to-pink-600',
    popular: true,
    features: [
      'Up to 25 users',
      'All modules included',
      'Advanced reporting & analytics',
      'Priority support',
      'Multiple locations',
      'API access',
      'Custom integrations',
      'Training included',
    ],
    cta: 'Start Free Trial',
    href: '/signup',
  },
  {
    name: 'Enterprise',
    description: 'Unlimited scale',
    price: 'Custom',
    period: '',
    icon: Building,
    color: 'from-orange-600 to-red-600',
    features: [
      'Unlimited users',
      'All modules + custom',
      'Dedicated support team',
      'Custom training program',
      'Unlimited locations',
      'White-label options',
      'SLA guarantee',
      'On-premise deployment',
    ],
    cta: 'Contact Sales',
    href: '/contact',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">HERA</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
            <Link href="/pricing" className="text-gray-900 font-medium">Pricing</Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600">
              Start with a 14-day free trial. No credit card required.
              Scale as you grow with our flexible plans.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PRICING_PLANS.map((plan, index) => (
              <Card key={index} className={`relative p-8 ${plan.popular ? 'ring-2 ring-purple-600' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-600 text-white text-sm px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6`}>
                  <plan.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>

                <Button 
                  className="w-full mb-6" 
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={plan.href}>
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Industry-Specific Solutions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              'Salon & Spa',
              'Restaurant',
              'Healthcare',
              'Retail',
              'Professional Services',
              'Manufacturing',
              'Education',
              'Non-Profit',
            ].map((industry, index) => (
              <Card key={index} className="p-4 text-center hover:shadow-md transition-shadow">
                <Globe className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium">{industry}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
              },
              {
                q: 'Do you offer discounts for annual billing?',
                a: 'Yes, we offer 20% off when you pay annually. Contact our sales team for details.',
              },
              {
                q: 'What happens after my trial ends?',
                a: 'Your account remains active but read-only. Simply add a payment method to continue.',
              },
              {
                q: 'Can I get a demo before signing up?',
                a: 'Absolutely! You can try our live demos or schedule a personalized demo with our team.',
              },
            ].map((faq, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of businesses already using HERA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10" asChild>
              <Link href="/contact">
                Talk to Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            © 2024 HERA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}