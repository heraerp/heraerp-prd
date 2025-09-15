'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PartnersPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to new franchise system
    router.replace('/franchise')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto mb-8"></div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Redirecting to HERA Franchise</h1>
        <p className="text-muted-foreground">We've upgraded our partnership model...</p>
      </div>
    </div>
  )
}

// OLD PARTNERSHIP PAGE - REPLACED BY FRANCHISE SYSTEM
function OldPartnersPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-foreground">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" />
              Partner Program Now Open
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Join the HERA Partner Revolution
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Help businesses break free from SAP complexity. Deliver enterprise power to SMBs, then
              scale to conquer the enterprise market.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/partner-system/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg font-semibold text-lg hover:shadow-xl transition-all"
              >
                Become a Partner
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button
                onClick={() =>
                  document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="inline-flex items-center gap-2 px-8 py-4 bg-background/10 backdrop-blur border border-border/20 rounded-lg font-semibold text-lg hover:bg-background/20 transition-all"
              >
                Calculate My Earnings
              </button>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-background/10 backdrop-blur rounded-lg p-6 border border-border/20">
                <div className="text-3xl font-bold text-emerald-400">$2.9M</div>
                <div className="text-sm text-slate-300">Avg SAP Cost Saved</div>
              </div>
              <div className="bg-background/10 backdrop-blur rounded-lg p-6 border border-border/20">
                <div className="text-3xl font-bold text-blue-400">48 hrs</div>
                <div className="text-sm text-slate-300">vs 18 months SAP</div>
              </div>
              <div className="bg-background/10 backdrop-blur rounded-lg p-6 border border-border/20">
                <div className="text-3xl font-bold text-purple-400">50%</div>
                <div className="text-sm text-slate-300">Partner Revenue Share</div>
              </div>
              <div className="bg-background/10 backdrop-blur rounded-lg p-6 border border-border/20">
                <div className="text-3xl font-bold text-amber-400">∞</div>
                <div className="text-sm text-slate-300">Market Opportunity</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steve Jobs Style Earnings Calculator */}
      <section id="calculator" className="py-20 px-6 bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">See Your Potential</h2>
            <p className="text-xl text-muted-foreground">
              Every customer you help becomes recurring revenue. Forever.
            </p>
          </div>

          <EarningsCalculator />
        </div>
      </section>

      {/* Strategic Vision Section */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">The HERA Strategy: Start Small, Win Big</h2>
            <p className="text-xl text-muted-foreground">Why HERA beats SAP at every level</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* SMB Entry */}
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-8 h-full border border-emerald-200">
                <div className="w-16 h-16 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                  <Store className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4">1. Dominate SMB Market</h3>
                <p className="text-slate-700 mb-6">
                  Give small businesses enterprise-grade features that SAP reserves for Fortune
                  500s. No complexity, no consultants, no compromise.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Complete ERP in 48 hours vs never with SAP</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">$49/month vs $50K+ SAP minimum</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Zero training required vs months of SAP courses</span>
                  </li>
                </ul>
              </div>
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 hidden md:block">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>

            {/* Mid-Market Growth */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 h-full border border-blue-200">
                <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mb-6">
                  <Building className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4">2. Scale to Mid-Market</h3>
                <p className="text-slate-700 mb-6">
                  As SMBs grow, HERA grows with them. Same simple system, more powerful features. No
                  migration, no disruption.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Multi-entity & consolidation built-in</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Advanced analytics & AI predictions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Industry-specific workflows ready</span>
                  </li>
                </ul>
              </div>
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 hidden md:block">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>

            {/* Enterprise Disruption */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 h-full border border-purple-200">
                <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <Factory className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4">3. Disrupt Enterprise</h3>
                <p className="text-slate-700 mb-6">
                  Proven success stories from SMB to enterprise. Replace SAP with 90% cost savings
                  and 100% of the features.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Complete SAP replacement capability</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Global operations & compliance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Migration tools from SAP/Oracle</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HERA vs SAP Comparison */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Partners Choose HERA Over SAP</h2>
            <p className="text-xl text-muted-foreground">
              Deliver more value, earn more revenue, with less complexity
            </p>
          </div>

          <div className="bg-background rounded-2xl shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* HERA Column */}
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold">HERA Partner Benefits</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-emerald-600 mb-2">Implementation Speed</h4>
                    <p className="text-slate-700">
                      Deploy in 48 hours. Bill immediately. Happy customers from day one.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-emerald-600 mb-2">Revenue Model</h4>
                    <p className="text-slate-700">
                      50% recurring revenue share. No limits. Grow your book of business.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-emerald-600 mb-2">Market Reach</h4>
                    <p className="text-slate-700">
                      Serve SMBs to Fortune 500 with one platform. No market limits.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-emerald-600 mb-2">Support Required</h4>
                    <p className="text-slate-700">
                      Minimal. Customers self-serve. You focus on growth, not support.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-emerald-600 mb-2">Competitive Edge</h4>
                    <p className="text-slate-700">
                      Only partner offering enterprise features at SMB prices and simplicity.
                    </p>
                  </div>
                </div>
              </div>

              {/* SAP Column */}
              <div className="p-8 md:p-12 bg-slate-50 border-l border-border">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-slate-400 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700">SAP Partner Reality</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-2">Implementation Speed</h4>
                    <p className="text-muted-foreground">
                      12-24 months. Massive upfront investment. Risk of failure.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-2">Revenue Model</h4>
                    <p className="text-muted-foreground">
                      One-time implementation fees. Compete with Accenture, Deloitte.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-2">Market Reach</h4>
                    <p className="text-muted-foreground">
                      Enterprise only. SMBs can't afford. Limited addressable market.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-2">Support Required</h4>
                    <p className="text-muted-foreground">
                      Enormous. Constant hand-holding. Expensive consultants needed.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-2">Competitive Edge</h4>
                    <p className="text-muted-foreground">
                      None. Competing with thousands of SAP partners globally.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Enterprise Features for Everyone</h2>
            <p className="text-xl text-muted-foreground">
              What took SAP 50 years to build, HERA delivers on day one
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Financial Management */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
              <h3 className="text-xl font-bold mb-4">Complete Financial Suite</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Multi-company consolidation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Real-time profitability analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Advanced cost accounting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Automated revenue recognition</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Multi-currency & transfer pricing</span>
                </li>
              </ul>
            </div>

            {/* Supply Chain */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-8 border border-emerald-200">
              <h3 className="text-xl font-bold mb-4">Supply Chain Excellence</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Multi-level BOM & routing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Advanced planning & scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Quality management built-in</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Supplier collaboration portal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>IoT & predictive maintenance</span>
                </li>
              </ul>
            </div>

            {/* Sales & Service */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border border-purple-200">
              <h3 className="text-xl font-bold mb-4">Sales & Service Power</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>360° customer view</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Configure-price-quote (CPQ)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Service ticket automation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Field service management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Customer self-service portal</span>
                </li>
              </ul>
            </div>

            {/* Analytics */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 border border-amber-200">
              <h3 className="text-xl font-bold mb-4">Analytics & Intelligence</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Real-time dashboards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Predictive analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>AI-powered insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Custom report builder</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Mobile analytics app</span>
                </li>
              </ul>
            </div>

            {/* HR & Payroll */}
            <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-xl p-8 border border-rose-200">
              <h3 className="text-xl font-bold mb-4">People Management</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span>Complete HR lifecycle</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span>Multi-country payroll</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span>Performance management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span>Learning management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span>Employee self-service</span>
                </li>
              </ul>
            </div>

            {/* Compliance */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-8 border border-border">
              <h3 className="text-xl font-bold mb-4">Compliance & Control</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <span>Multi-country tax engine</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <span>Audit trail everything</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <span>Role-based security</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <span>Regulatory reporting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <span>Data privacy controls</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground mb-6">
              Every feature above is available to every customer from day one. <br />
              No modules to buy. No upgrades to purchase. No limits.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
              <Award className="h-5 w-5" />
              One Platform. Unlimited Possibilities.
            </div>
          </div>
        </div>
      </section>

      {/* Partner Program Benefits */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Partner Success Program</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to build a thriving HERA practice
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-background rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Revenue & Growth</h3>
              <ul className="space-y-2 text-slate-700">
                <li>• 50% recurring revenue share</li>
                <li>• Implementation service fees</li>
                <li>• Custom development opportunities</li>
                <li>• Training & consulting revenue</li>
                <li>• No revenue caps or limits</li>
              </ul>
            </div>

            <div className="bg-background rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sales Support</h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Co-selling with HERA team</li>
                <li>• Qualified lead sharing</li>
                <li>• Sales materials & demos</li>
                <li>• Competitive battle cards</li>
                <li>• Deal registration protection</li>
              </ul>
            </div>

            <div className="bg-background rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Marketing Power</h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Co-branded campaigns</li>
                <li>• Event sponsorship</li>
                <li>• Success story promotion</li>
                <li>• Digital marketing assets</li>
                <li>• PR & media coverage</li>
              </ul>
            </div>
          </div>

          <div className="mt-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-8 md:p-12 text-foreground">
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-4">Ready to Disrupt the ERP Market?</h3>
              <p className="text-xl mb-8 text-emerald-50">
                Join the fastest-growing partner ecosystem in enterprise software. <br />
                Help businesses escape SAP complexity while building your empire.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth?type=partner"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-background text-foreground rounded-lg font-semibold hover:shadow-xl transition-all"
                >
                  Apply Now
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-background/20 backdrop-blur border border-white/30 rounded-lg font-semibold hover:bg-background/30 transition-all"
                >
                  Schedule a Call
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Partner Questions Answered</h2>

          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-3">Who makes a great HERA partner?</h3>
              <p className="text-slate-700">
                Consultants tired of SAP complexity. Digital agencies wanting to offer ERP. Industry
                experts who understand business needs. Anyone who believes software should be simple
                and powerful.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-3">
                How is HERA different from other partner programs?
              </h3>
              <p className="text-slate-700">
                We share 50% of recurring revenue forever. No quotas. No tiers. No politics. You can
                implement in days, not months. Your customers actually love the product. You build a
                real business, not just billable hours.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-3">Can HERA really replace SAP?</h3>
              <p className="text-slate-700">
                Yes. We deliver 100% of SAP functionality with 90% less complexity. Our architecture
                handles everything from 10-person startups to 10,000-person enterprises. Same
                system, same simplicity, infinite scale.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-3">What training is required?</h3>
              <p className="text-slate-700">
                2-day certification program covers everything. Compare that to months of SAP
                training. HERA is designed to be intuitive. If you understand business, you can
                implement HERA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seamless Navigation */}
      <SeamlessNavigation partnerId="demo-visitor" />
    </div>
  )
}
