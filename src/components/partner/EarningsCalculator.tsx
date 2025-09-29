'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Zap,
  ArrowRight,
  Sparkles,
  Target,
  Award
} from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * Steve Jobs-Inspired Earnings Calculator
 *
 * "The best way to predict the future is to invent it." - Steve Jobs
 *
 * This calculator doesn't just show numbers - it shows dreams becoming reality.
 */

interface EarningsProjection {
  monthly: number
  yearly: number
  lifetime: number
  comparisonToJob: number
}

export default function EarningsCalculator() {
  const router = useRouter()
  const [customers, setCustomers] = useState(10)
  const [avgMonthlyValue, setAvgMonthlyValue] = useState(150)
  const [projections, setProjections] = useState<EarningsProjection>({
    monthly: 0,
    yearly: 0,
    lifetime: 0,
    comparisonToJob: 0
  })
  const [showResults, setShowResults] = useState(false)
  const [animateNumbers, setAnimateNumbers] = useState(false)

  useEffect(() => {
    calculateEarnings()
  }, [customers, avgMonthlyValue])

  const calculateEarnings = () => {
    const monthlyRevenue = customers * avgMonthlyValue
    const partnerCommission = monthlyRevenue * 0.5 // 50% share
    const yearlyCommission = partnerCommission * 12
    const lifetimeCommission = yearlyCommission * 5 // Conservative 5-year average

    // Compare to typical consultant salary ($75k/year)
    const comparisonMultiplier = yearlyCommission / 75000

    setProjections({
      monthly: partnerCommission,
      yearly: yearlyCommission,
      lifetime: lifetimeCommission,
      comparisonToJob: comparisonMultiplier
    })

    setShowResults(true)

    // Trigger number animation
    setTimeout(() => setAnimateNumbers(true), 100)
  }

  const formatCurrency = (amount: number, compact = false) => {
    if (compact && amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (compact && amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getCustomerScenarios = () => [
    { label: 'Getting Started', customers: 5, icon: '🌱' },
    { label: 'Building Momentum', customers: 15, icon: '🚀' },
    { label: 'Serious Business', customers: 30, icon: '💼' },
    { label: 'Market Leader', customers: 50, icon: '👑' },
    { label: 'Empire Builder', customers: 100, icon: '🏰' }
  ]

  const getPricingScenarios = () => [
    { label: 'Basic Plans', price: 100, icon: '💡' },
    { label: 'Professional', price: 200, icon: '⚡' },
    { label: 'Enterprise Lite', price: 400, icon: '🎯' },
    { label: 'Full Enterprise', price: 800, icon: '💎' }
  ]

  return (
    <div className="space-y-8">
      {/* Input Controls - Jobs Style Simplicity */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Customer Count */}
        <div>
          <h3 className="text-2xl font-bold mb-6 text-center">How many customers?</h3>
          <div className="space-y-4">
            <div className="flex justify-center">
              <input
                type="range"
                min="1"
                max="100"
                value={customers}
                onChange={e => setCustomers(Number(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-emerald-200 to-blue-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div className="text-center">
              <span className="text-4xl font-bold text-emerald-600">{customers}</span>
              <span className="text-muted-foreground ml-2">customers</span>
            </div>

            {/* Quick Scenarios */}
            <div className="grid grid-cols-2 gap-2">
              {getCustomerScenarios().map(scenario => (
                <button
                  key={scenario.label}
                  onClick={() => setCustomers(scenario.customers)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${ customers === scenario.customers ?'border-emerald-500 bg-emerald-50'
                      : 'border-border hover:border-emerald-300'
                  }`}
                >
                  <div className="text-lg mb-1">{scenario.icon}</div>
                  <div className="font-semibold">{scenario.label}</div>
                  <div className="text-muted-foreground">{scenario.customers} customers</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Average Monthly Value */}
        <div>
          <h3 className="text-2xl font-bold mb-6 text-center">Average monthly value?</h3>
          <div className="space-y-4">
            <div className="flex justify-center">
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={avgMonthlyValue}
                onChange={e => setAvgMonthlyValue(Number(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div className="text-center">
              <span className="text-4xl font-bold text-primary">
                {formatCurrency(avgMonthlyValue)}
              </span>
              <span className="text-muted-foreground ml-2">per customer/month</span>
            </div>

            {/* Quick Scenarios */}
            <div className="grid grid-cols-2 gap-2">
              {getPricingScenarios().map(scenario => (
                <button
                  key={scenario.label}
                  onClick={() => setAvgMonthlyValue(scenario.price)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${ avgMonthlyValue === scenario.price ?'border-blue-500 bg-blue-50'
                      : 'border-border hover:border-blue-300'
                  }`}
                >
                  <div className="text-lg mb-1">{scenario.icon}</div>
                  <div className="font-semibold">{scenario.label}</div>
                  <div className="text-muted-foreground">{formatCurrency(scenario.price)}/mo</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results - The Magic Reveal */}
      {showResults && (
        <div className="mt-12">
          {/* Main Results Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card
              className={`relative overflow-hidden transition-all duration-1000 ${animateNumbers ?'scale-100 opacity-100' : 'scale-95 opacity-90'}`}
            >
              <CardContent className="p-6 text-center bg-gradient-to-br from-emerald-50 to-emerald-100">
                <DollarSign className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-emerald-700 mb-2">
                  {formatCurrency(projections.monthly)}
                </div>
                <div className="text-emerald-600 font-semibold">Monthly Income</div>
                <div className="text-sm text-muted-foreground mt-2">Your 50% share</div>
              </CardContent>
            </Card>

            <Card
              className={`relative overflow-hidden transition-all duration-1000 delay-200 ${animateNumbers ?'scale-100 opacity-100' : 'scale-95 opacity-90'}`}
            >
              <CardContent className="p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100">
                <Calendar className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-blue-700 mb-2">
                  {formatCurrency(projections.yearly)}
                </div>
                <div className="text-primary font-semibold">Annual Income</div>
                <div className="text-sm text-muted-foreground mt-2">Recurring revenue</div>
              </CardContent>
            </Card>

            <Card
              className={`relative overflow-hidden transition-all duration-1000 delay-400 ${animateNumbers ?'scale-100 opacity-100' : 'scale-95 opacity-90'}`}
            >
              <CardContent className="p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-purple-700 mb-2">
                  {formatCurrency(projections.lifetime, true)}
                </div>
                <div className="text-purple-600 font-semibold">5-Year Value</div>
                <div className="text-sm text-muted-foreground mt-2">Conservative estimate</div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison & Context */}
          <div className="bg-background rounded-2xl shadow-xl p-8 border border-border">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">How This Compares</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <span className="font-semibold">Your HERA Income</span>
                    <span className="text-emerald-600 font-bold">
                      {formatCurrency(projections.yearly)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <span className="font-semibold">Typical Consultant</span>
                    <span className="text-red-600 font-bold">$75,000</span>
                  </div>
                  <div className="text-center py-4">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-blue-500 text-foreground px-6 py-3 text-lg">
                      {projections.comparisonToJob > 1
                        ? `${projections.comparisonToJob.toFixed(1)}x Better`
                        : 'Building Your Foundation'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <Sparkles className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                  <h4 className="text-xl font-bold mb-2">The Magic Formula</h4>
                  <p className="text-muted-foreground">
                    {customers} customers × {formatCurrency(avgMonthlyValue)}/month × 50% =
                    <strong className="text-emerald-600">
                      {' '}
                      {formatCurrency(projections.monthly)}/month
                    </strong>
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={() => router.push('/partner-system/register')}
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-foreground px-8 py-4 text-lg font-semibold rounded-xl shadow-xl"
                >
                  <Target className="h-6 w-6 mr-3" />
                  Make This My Reality
                  <ArrowRight className="h-6 w-6 ml-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Growth Potential */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-50 border border-amber-200 rounded-full text-amber-700 font-semibold">
              <TrendingUp className="h-5 w-5" />
              Most partners grow 3-5x in their first year
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #3b82f6);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #3b82f6);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
}
