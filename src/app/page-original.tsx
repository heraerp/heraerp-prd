'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Shield, 
  Zap,
  Rocket,
  Target,
  Star,
  Wand2
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal Header */}
      <header className="py-8 bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">H</span>
              </div>
              <span className="text-xl font-light">HERA</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/how-it-works" className="text-gray-600 hover:text-black transition-colors">
                See Demos
              </Link>
              <Button asChild className="bg-black hover:bg-gray-800 text-white hover:text-white rounded-full px-6">
                <Link href="/auth/login">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Above the Fold Optimized with Glassmorphism */}
      <section className="py-8 md:py-16 min-h-[80vh] flex items-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            
            {/* Optimized Headline - Mobile Responsive */}
            <div className="mb-8 md:mb-12">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-thin text-gray-900 mb-6 md:mb-8 leading-tight">
                Enterprise-grade ERP.
                <br />
                <span className="font-light text-blue-600">Small-business price.</span>
                <br />
                <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600">Live in 2 weeks — or your implementation is free.*</span>
              </h1>
            </div>

            {/* Tagline - Mobile Optimized */}
            <div className="mb-8 md:mb-12">
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 font-light leading-relaxed max-w-4xl mx-auto px-2">
                Revolutionary enterprise software that eliminates the pain of traditional ERP implementations.
              </p>
            </div>

            {/* Call-to-Action Buttons - Above the Fold */}
            <div className="mb-8 md:mb-16">
              <div className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center items-center max-w-2xl mx-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white hover:text-white text-base md:text-lg px-8 md:px-12 py-4 md:py-6 rounded-full font-light shadow-lg hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <Link href="/auth/signup">
                    Start Your 2-Week Challenge
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-black text-black hover:bg-black hover:text-white text-base md:text-lg px-8 md:px-12 py-4 md:py-6 rounded-full font-light hover:shadow-lg transition-all duration-200"
                  asChild
                >
                  <Link href="/how-it-works">
                    Explore Live Demos
                  </Link>
                </Button>
              </div>
            </div>

            {/* Proof Points - Mobile Optimized with Glassmorphism */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 px-4">
              <div className="text-center bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-3xl md:text-4xl font-thin text-black mb-2 md:mb-4">70%</div>
                <p className="text-sm md:text-base text-gray-600 font-light">Cost Savings</p>
              </div>
              
              <div className="text-center bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-3xl md:text-4xl font-thin text-black mb-2 md:mb-4">2</div>
                <p className="text-sm md:text-base text-gray-600 font-light">Week Guarantee</p>
              </div>
              
              <div className="text-center bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-3xl md:text-4xl font-thin text-black mb-2 md:mb-4">92%</div>
                <p className="text-sm md:text-base text-gray-600 font-light">Success Rate</p>
              </div>
              
              <div className="text-center bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-3xl md:text-4xl font-thin text-black mb-2 md:mb-4">0</div>
                <p className="text-sm md:text-base text-gray-600 font-light">Configuration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section - Minimal Table with Enhanced Glassmorphism */}
      <section className="py-32 bg-gradient-to-b from-gray-50/40 to-white backdrop-blur-sm relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-50/40"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            
            {/* Breathing Space */}
            <div className="text-center mb-20">
              <h2 className="text-5xl font-thin text-gray-900 mb-8">
                The difference is clear.
              </h2>
            </div>

            {/* Clean Comparison Table with Enhanced Glassmorphism */}
            <div className="bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/20 backdrop-blur-sm">
                  <tr>
                    <th className="text-left py-8 px-8 font-light text-xl text-gray-600">Solution</th>
                    <th className="text-center py-8 px-8 font-light text-xl text-black">HERA</th>
                    <th className="text-center py-8 px-8 font-light text-xl text-gray-400">SAP</th>
                    <th className="text-center py-8 px-8 font-light text-xl text-gray-400">Salesforce</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/10">
                    <td className="py-8 px-8 font-light text-gray-600">Implementation</td>
                    <td className="py-8 px-8 text-center font-light text-black">2 weeks</td>
                    <td className="py-8 px-8 text-center font-light text-gray-400">12-21 months</td>
                    <td className="py-8 px-8 text-center font-light text-gray-400">6+ months</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="py-8 px-8 font-light text-gray-600">Annual Cost</td>
                    <td className="py-8 px-8 text-center font-light text-black">$50,000</td>
                    <td className="py-8 px-8 text-center font-light text-gray-400">$150,000+</td>
                    <td className="py-8 px-8 text-center font-light text-gray-400">$144,000+</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="py-8 px-8 font-light text-gray-600">Success Rate</td>
                    <td className="py-8 px-8 text-center font-light text-black">92%</td>
                    <td className="py-8 px-8 text-center font-light text-gray-400">40%</td>
                    <td className="py-8 px-8 text-center font-light text-gray-400">60%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Apps Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-thin text-gray-900 mb-4">Try HERA Apps Now</h2>
            <p className="text-xl font-light text-gray-600 max-w-3xl mx-auto">
              Experience enterprise-grade functionality with industry-specific apps. 
              No signup required - start planning your business immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <a 
              href="/budgeting/salon" 
              className="group block p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">✂️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Salon Budgeting</h3>
              <p className="text-gray-600 font-light mb-4">
                Complete budgeting for beauty salons with service-based revenue planning, staff productivity tracking, and seasonal analysis.
              </p>
              <div className="flex items-center text-pink-600 font-medium">
                <span>Try Demo</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            <a 
              href="/budgeting" 
              className="group block p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Universal Budgeting</h3>
              <p className="text-gray-600 font-light mb-4">
                Enterprise budgeting for any industry. Multi-dimensional planning, variance analysis, and rolling forecasts built-in.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                <span>Explore Apps</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            <a 
              href="/financial" 
              className="group block p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Financial Management</h3>
              <p className="text-gray-600 font-light mb-4">
                Complete financial suite with GL, AR, AP, budgeting, and real-time reporting. IFRS-compliant from day one.
              </p>
              <div className="flex items-center text-green-600 font-medium">
                <span>Try Financial</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            <a 
              href="/digital-accountant" 
              className="group block p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🧮</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Digital Accountant</h3>
              <p className="text-gray-600 font-light mb-4">
                AI-powered accounting with natural language. Post journals, create invoices, reconcile accounts through chat.
              </p>
              <div className="flex items-center text-emerald-600 font-medium">
                <span>Try Digital Accountant</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            <a 
              href="/auto-journal" 
              className="group block p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto-Journal Engine</h3>
              <p className="text-gray-600 font-light mb-4">
                Intelligent journal entry automation with AI. 85%+ automation rate, 92% time savings, zero manual intervention.
              </p>
              <div className="flex items-center text-indigo-600 font-medium">
                <span>Try Auto-Journal</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            <a 
              href="/salon-manager" 
              className="group block p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">💅</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Salon Manager</h3>
              <p className="text-gray-600 font-light mb-4">
                Complete salon operations with AI. Book appointments, manage inventory, track revenue, calculate commissions through natural language.
              </p>
              <div className="flex items-center text-purple-600 font-medium">
                <span>Try Salon Manager</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            <a 
              href="/mcp-tools" 
              className="group block p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wand2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">MCP Conversion Tools</h3>
              <p className="text-gray-600 font-light mb-4">
                Advanced development tools. SQL generation, code transformation, batch operations, and automated deployment.
              </p>
              <div className="flex items-center text-cyan-600 font-medium">
                <span>Open Tools</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-gray-500 font-light">
              ✨ All apps include sample data - no setup required. Experience enterprise features instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Vision Section - Startup Mission */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            
            {/* Breathing Space */}
            <div className="mb-16">
              <blockquote className="text-4xl font-thin text-gray-900 leading-relaxed">
                "Every business deserves enterprise-grade tools
                <br />
                without enterprise complexity or cost.
                <br />
                That's why we built HERA."
              </blockquote>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-6">
                <span className="text-gray-600 font-light text-lg">HT</span>
              </div>
              <div className="text-left">
                <p className="font-light text-gray-900 text-lg">HERA Team</p>
                <p className="text-gray-600 font-light">Launching September 2025</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Powerful and Simple */}
      <section className="py-32 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            
            {/* Massive Breathing Space */}
            <div className="mb-20">
              <h2 className="text-6xl font-thin mb-12 leading-tight">
                Ready to challenge
                <br />
                the 2-week guarantee?
              </h2>
            </div>

            {/* Breathing Space */}
            <div className="mb-20">
              <p className="text-2xl font-light text-gray-300 leading-relaxed">
                We're so confident in HERA that we'll implement your ERP in 2 weeks
                <br />
                or you don't pay a dime.
              </p>
            </div>

            {/* Simple, Powerful Buttons */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-white to-gray-50 text-black hover:from-gray-50 hover:to-white text-lg px-16 py-6 rounded-full font-light shadow-lg hover:shadow-xl transition-all duration-300"
                asChild
              >
                <Link href="/auth/signup">
                  Accept the Challenge
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black text-lg px-16 py-6 rounded-full font-light"
                asChild
              >
                <Link href="/apps">
                  View Demo Apps
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-col space-y-6">
            {/* Main Footer Content */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-white">H</span>
                </div>
                <span className="font-light text-gray-600">HERA</span>
              </div>
              <div className="text-sm text-gray-400 font-light">
                Enterprise-grade ERP. Small-business price.
              </div>
            </div>
            
            {/* Disclaimer */}
            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-400 font-light max-w-4xl">
                *2-week implementation guarantee applies to standard business configurations using HERA's universal templates. 
                Complex integrations, custom development, or enterprise-scale deployments may require additional time. 
                Free implementation offer available for qualifying businesses. Terms and conditions apply. 
                HERA launches September 1, 2025.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}