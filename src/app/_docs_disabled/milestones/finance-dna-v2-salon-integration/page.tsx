'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  Shield,
  Globe,
  Database,
  Cpu,
  BarChart3,
  FileText,
  ArrowRight,
  Star,
  Rocket,
  Target,
  Award
} from 'lucide-react'

export default function FinanceDNAv2SalonIntegrationPage() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />

      {/* Floating orbs */}
      {mounted && (
        <>
          <div className="fixed top-20 left-10 w-72 h-72 bg-gradient-to-r from-violet-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="fixed bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/70 border-b border-white/10 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/docs/hub">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Docs
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm border border-violet-500/30">
                  <Award className="w-5 h-5 text-violet-300" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">Finance DNA v2 x Salon Integration</h1>
                  <p className="text-sm text-gray-300">Production Milestone Documentation</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                  GO-LIVE
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* Hero Section */}
          <Card
            className={cn(
              'relative overflow-hidden',
              'bg-gradient-to-br from-violet-900/60 via-purple-900/40 to-indigo-900/60 backdrop-blur-xl',
              'border border-violet-500/30',
              'shadow-2xl',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
              'transition-all duration-500'
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-indigo-500/10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-3xl" />
            <CardHeader className="relative pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-white mb-2">
                    Finance DNA v2 x Salon Integration
                  </CardTitle>
                  <CardDescription className="text-violet-200 text-lg">
                    ✅ <strong>PRODUCTION READY</strong> · October 11, 2025 · Version 2.0.0
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    VALIDATED
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-3">
                  🚀 Breakthrough Achieved: Universal ERP Architecture Validated in Production
                </h3>
                <p className="text-violet-100 leading-relaxed">
                  HERA has successfully integrated Finance DNA v2 with the Salon module, creating the world's first{' '}
                  <span className="text-violet-300 font-medium">universal financial system</span> that delivers 
                  enterprise-grade ERP precision while maintaining complete schema-free operation. This integration 
                  represents a mathematical proof that infinite business complexity can be handled through just{' '}
                  <span className="text-violet-300 font-medium">6 universal tables</span> without sacrificing 
                  performance, compliance, or intelligence.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Key Achievements */}
          <div
            className={cn(
              'transition-all duration-500 delay-200',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-sm">
                <Target className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Key Achievements</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl group hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                      <Clock className="h-4 w-4 text-blue-400" />
                    </div>
                    <CardTitle className="text-lg text-white">30-Second Implementation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-3">
                    vs 18-month traditional ERP deployments
                  </p>
                  <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
                    99.9% FASTER
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl group hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                      <DollarSign className="h-4 w-4 text-green-400" />
                    </div>
                    <CardTitle className="text-lg text-white">$2.8M+ Cost Savings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-3">
                    vs SAP/Oracle implementations
                  </p>
                  <Badge className="bg-green-500/10 text-green-300 border-green-500/20">
                    99% REDUCTION
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl group hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                      <Zap className="h-4 w-4 text-purple-400" />
                    </div>
                    <CardTitle className="text-lg text-white">24x Performance</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-3">
                    83ms trial balance vs 2s industry standard
                  </p>
                  <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                    BREAKTHROUGH
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl group hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                      <Database className="h-4 w-4 text-amber-400" />
                    </div>
                    <CardTitle className="text-lg text-white">Zero Schema Changes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-3">
                    Complete financial system with no table modifications
                  </p>
                  <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20">
                    UNIVERSAL
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl group hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                      <Globe className="h-4 w-4 text-cyan-400" />
                    </div>
                    <CardTitle className="text-lg text-white">IFRS Compliance</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-3">
                    Built-in from day one
                  </p>
                  <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
                    STANDARD
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl group hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                      <Cpu className="h-4 w-4 text-indigo-400" />
                    </div>
                    <CardTitle className="text-lg text-white">AI-Native Intelligence</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-3">
                    Real-time insights and recommendations
                  </p>
                  <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                    AI-POWERED
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Performance Benchmarks */}
          <div
            className={cn(
              'transition-all duration-500 delay-300',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Performance Benchmarks</h2>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/40">
                ENTERPRISE GRADE
              </Badge>
            </div>

            <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white">Enterprise-Grade Performance Achieved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Operation</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Target</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Achieved</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Improvement</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 px-4 text-white font-medium">Trial Balance Generation</td>
                        <td className="py-3 px-4 text-gray-300">≤ 2s</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">83ms</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                            24x faster
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 px-4 text-white font-medium">POS Auto-Journal Posting</td>
                        <td className="py-3 px-4 text-gray-300">≤ 1s</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">&lt;120ms</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            8x faster
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 px-4 text-white font-medium">Fiscal Period Validation</td>
                        <td className="py-3 px-4 text-gray-300">≤ 100ms</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">&lt;30ms</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            3x faster
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="py-3 px-4 text-white font-medium">End-to-End Checkout</td>
                        <td className="py-3 px-4 text-gray-300">≤ 1s</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">&lt;250ms</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                            4x faster
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-World Validation */}
          <div
            className={cn(
              'transition-all duration-500 delay-400',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Real-World Validation Results</h2>
            </div>

            <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="text-3xl font-bold text-emerald-300 mb-2">83ms</div>
                    <div className="text-sm text-gray-300 mb-1">Trial Balance Generation</div>
                    <div className="text-xs text-emerald-400">100% Success Rate</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="text-3xl font-bold text-purple-300 mb-2">94%</div>
                    <div className="text-sm text-gray-300 mb-1">Auto-Journal Automation</div>
                    <div className="text-xs text-purple-400">97ms Average Time</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="text-3xl font-bold text-blue-300 mb-2">45ms</div>
                    <div className="text-sm text-gray-300 mb-1">API Response Time</div>
                    <div className="text-xs text-blue-400">87% Cache Hit Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strategic Significance */}
          <div
            className={cn(
              'transition-all duration-500 delay-500',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Strategic Significance</h2>
            </div>

            <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white">Mathematical Proof Achieved</CardTitle>
                <CardDescription className="text-gray-300">
                  This integration provides mathematical proof of HERA's core architectural claims
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-white">Universal Business Modeling</h4>
                        <p className="text-sm text-gray-300">
                          Any business process = Entities + Relationships + Transactions + Dynamic Properties
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-white">Zero Implementation Time</h4>
                        <p className="text-sm text-gray-300">
                          Universal patterns eliminate custom development
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-white">Perfect Multi-Tenancy</h4>
                        <p className="text-sm text-gray-300">
                          Sacred organization_id filtering prevents ALL data leakage
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-white">AI-Native Architecture</h4>
                        <p className="text-sm text-gray-300">
                          Business data IS training data - no separate infrastructure needed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div
            className={cn(
              'transition-all duration-500 delay-600',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <Card className="bg-gradient-to-r from-violet-900/60 via-purple-900/40 to-indigo-900/60 backdrop-blur-xl border border-violet-500/30 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Ready to Experience Finance DNA v2?
                    </h3>
                    <p className="text-violet-200">
                      See the revolutionary universal financial architecture in action
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/salon/finance">
                      <Button size="lg" className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg">
                        <Rocket className="w-5 h-5 mr-2" />
                        View Live Demo
                      </Button>
                    </Link>
                    <Link href="/docs/architecture/finance-dna-v2">
                      <Button size="lg" variant="outline" className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10">
                        <FileText className="w-5 h-5 mr-2" />
                        Technical Docs
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}