'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Book,
  Code2,
  Rocket,
  Shield,
  Database,
  Globe,
  DollarSign,
  Building2,
  FileText,
  Calculator,
  MessageSquare,
  Cpu,
  TrendingUp,
  ArrowRight,
  GitBranch,
  Star,
  Search,
  Sparkles,
  Zap,
  Layers,
  Hexagon
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function DocsHub() {
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background - Darker for better contrast */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent dark:from-amber-900/10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent dark:from-cyan-900/10" />

      {/* Floating Gradient Orbs */}
      {mounted && (
        <>
          <div className="fixed top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 dark:from-blue-600/10 dark:to-cyan-600/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="fixed bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-gradient-to-r from-amber-400/10 to-orange-400/10 dark:from-amber-600/5 dark:to-orange-600/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '4s' }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Glassmorphism Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/70 dark:bg-gray-900/70 border-b border-white/10 dark:border-gray-800/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity" />
                  <h1 className="relative text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
                    <Hexagon className="w-6 h-6 text-amber-400" />
                    HERA Documentation
                  </h1>
                </div>
                <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-500/30 text-blue-300">
                  <Sparkles className="w-3 h-3 mr-1" />
                  v1.0
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/docs/civicflow/search">
                  <Button
                    className="relative group overflow-hidden bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-amber-500/50 transition-all duration-300 text-gray-100"
                    size="sm"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/10 to-amber-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <Search className="h-4 w-4 mr-2" />
                    Search Docs
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="group relative overflow-hidden bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 hover:border-amber-500/50 text-amber-300 transition-all duration-300"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Star className="h-4 w-4 mr-1" />
                  Star
                </Button>
                <Button
                  size="sm"
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 text-blue-300 transition-all duration-300"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <GitBranch className="h-4 w-4 mr-1" />
                  Fork
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-300 mt-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Enterprise Resource Planning with Revolutionary Universal Architecture
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-12 space-y-16">
          {/* Hero Section */}
          <div
            className={cn(
              'relative overflow-hidden rounded-3xl',
              'bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-900/40',
              'backdrop-blur-xl border border-white/10 dark:border-gray-800/20',
              'shadow-2xl transition-all duration-500',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5" />
            <div className="relative p-12">
              <div className="text-center space-y-6">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-100 via-amber-400 to-gray-100 bg-clip-text text-transparent bg-300% animate-gradient">
                  Welcome to HERA Documentation
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Explore our comprehensive guides, API references, and best practices for building
                  with the revolutionary Universal Architecture
                </p>
                <div className="flex items-center justify-center gap-4 pt-4">
                  <Link href="/docs/quickstart">
                    <Button
                      size="lg"
                      className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg transition-all duration-300 hover:shadow-amber-500/25 dark:hover:shadow-amber-400/25"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <Rocket className="w-5 h-5 mr-2" />
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/docs/api/rest">
                    <Button
                      size="lg"
                      variant="outline"
                      className="group border-gray-600 hover:border-amber-500 transition-all duration-300 text-gray-100"
                    >
                      <Code2 className="w-5 h-5 mr-2 group-hover:text-amber-400 transition-colors" />
                      API Reference
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div
            className={cn(
              'transition-all duration-500 delay-100',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-400/10 dark:to-cyan-400/10 backdrop-blur-sm">
                <Search className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100 dark:text-gray-100">
                Search Documentation
              </h2>
            </div>
            <Card
              className={cn(
                'relative overflow-hidden',
                'bg-gray-900/60 backdrop-blur-xl',
                'border-white/10 dark:border-gray-800/20',
                'shadow-xl hover:shadow-2xl transition-all duration-300',
                'group'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="relative p-8">
                <Link href="/docs/civicflow/search" className="block">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                        Search All Documentation
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </h3>
                      <p className="text-gray-300">
                        Find what you need with AI-powered search, intelligent suggestions, and
                        advanced filtering
                      </p>
                    </div>
                    <Button className="group/btn relative overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg transition-all duration-300 hover:shadow-blue-500/25 dark:hover:shadow-blue-400/25">
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                      <Search className="h-4 w-4 mr-2" />
                      Go to Search
                    </Button>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Overview Section - Removed, integrated into hero */}

          {/* Quick Start */}
          <div
            className={cn(
              'transition-all duration-500 delay-200',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 backdrop-blur-sm">
                <Rocket className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100 dark:text-gray-100">
                Quick Start
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                className={cn(
                  'relative overflow-hidden cursor-pointer',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group hover:scale-[1.02]'
                )}
                onClick={() => router.push('/docs/quickstart')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                    Getting Started
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-400">
                    Set up HERA in your environment
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="p-2 bg-gray-800/50 rounded-lg backdrop-blur-sm">
                    <code className="text-xs text-purple-300">npm install && npm run dev</code>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  'relative overflow-hidden cursor-pointer',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group hover:scale-[1.02]'
                )}
                onClick={() => router.push('/docs/architecture')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                    Architecture
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-300">
                    Understand the universal design
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-1">
                    {['Universal schema', 'Smart codes', 'Multi-tenant'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                        <div className="w-1 h-1 rounded-full bg-amber-500/50" />
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  'relative overflow-hidden cursor-pointer',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group hover:scale-[1.02]'
                )}
                onClick={() => router.push('/docs/api/rest')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                    API Reference
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-300">
                    Complete API documentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="p-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                    <code className="text-xs text-blue-300">POST /api/v1/universal</code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Core Features */}
          <div
            className={cn(
              'transition-all duration-500 delay-300',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10 backdrop-blur-sm">
                <Database className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100 dark:text-gray-100">
                Core Features
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card
                className={cn(
                  'relative overflow-hidden cursor-pointer',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group hover:scale-[1.02]'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10">
                      <Database className="h-4 w-4 text-green-400" />
                    </div>
                    Universal Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-gray-300 mb-3">
                    Revolutionary architecture with infinite scalability
                  </p>
                  <Badge className="bg-green-500/10 text-green-300 border-green-500/20">CORE</Badge>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  'relative overflow-hidden cursor-pointer',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group hover:scale-[1.02]'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-400/10 dark:to-cyan-400/10">
                      <Shield className="h-4 w-4 text-blue-400" />
                    </div>
                    Multi-Tenant SaaS
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-gray-300 mb-3">
                    Enterprise-grade security with perfect isolation
                  </p>
                  <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
                    PRODUCTION
                  </Badge>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  'relative overflow-hidden cursor-pointer',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group hover:scale-[1.02]'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10">
                      <Cpu className="h-4 w-4 text-purple-400" />
                    </div>
                    AI Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-gray-300 mb-3">
                    Multi-provider AI with intelligent routing
                  </p>
                  <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                    HERA DNA
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Financial Features */}
          <div
            className={cn(
              'transition-all duration-500 delay-400',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 dark:from-amber-400/10 dark:to-yellow-400/10 backdrop-blur-sm">
                <DollarSign className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100 dark:text-gray-100">
                Financial Features
              </h2>
              <Badge className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm border-emerald-500/30 text-emerald-300 animate-pulse">
                <Sparkles className="w-3 h-3 mr-1" />
                NEW: Finance DNA v2
              </Badge>
            </div>
            
            {/* Featured Finance DNA v2 Integration */}
            <div className="mb-8">
              <Card
                className={cn(
                  'relative overflow-hidden cursor-pointer',
                  'bg-gradient-to-br from-violet-900/40 via-purple-900/30 to-indigo-900/40 backdrop-blur-xl',
                  'border border-violet-500/30 dark:border-violet-400/30',
                  'shadow-2xl hover:shadow-violet-500/25 transition-all duration-500',
                  'group hover:scale-[1.01] hover:border-violet-400/50'
                )}
                onClick={() => router.push('/docs/milestones/finance-dna-v2-salon-integration')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl" />
                
                <CardHeader className="relative pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm border border-violet-500/30">
                        <TrendingUp className="h-6 w-6 text-violet-300" />
                      </div>
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2 text-white">
                          Finance DNA v2 x Salon Integration
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
                            GO-LIVE
                          </Badge>
                        </CardTitle>
                        <p className="text-violet-200 text-sm mt-1">
                          Production-ready universal financial architecture with 83ms trial balance
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-violet-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </CardHeader>
                
                <CardContent className="relative">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                      <div className="text-2xl font-bold text-emerald-300">83ms</div>
                      <div className="text-xs text-violet-200">Trial Balance</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                      <div className="text-2xl font-bold text-blue-300">$2.8M+</div>
                      <div className="text-xs text-violet-200">Cost Savings</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                      <div className="text-2xl font-bold text-purple-300">99.9%</div>
                      <div className="text-xs text-violet-200">Faster Setup</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-violet-100 mb-4">
                    Revolutionary <span className="text-violet-300 font-medium">enterprise-grade financial processing</span> with 
                    auto-journal AI, real-time reporting, and IFRS compliance. Mathematical proof that universal architecture 
                    can eliminate ERP complexity.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                      Universal Architecture
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      Zero Schema Changes
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      PRODUCTION READY
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      IFRS Compliant
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                className={cn(
                  'relative overflow-hidden cursor-pointer',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group hover:scale-[1.02]'
                )}
                onClick={() => router.push('/docs/features/chart-of-accounts')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-2xl" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-yellow-500/10 dark:from-amber-400/10 dark:to-yellow-400/10">
                      <FileText className="h-4 w-4 text-amber-400" />
                    </div>
                    Chart of Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-gray-300 mb-3">
                    <span className="text-amber-400 font-medium">Universal COA system</span> with
                    132 industry templates
                  </p>
                  <div className="flex gap-2">
                    <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20">
                      IFRS
                    </Badge>
                    <Badge className="bg-green-500/10 text-green-300 border-green-500/20">
                      PRODUCTION
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  'relative overflow-hidden cursor-pointer',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group hover:scale-[1.02]'
                )}
                onClick={() => router.push('/docs/features/auto-journal')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10">
                      <Calculator className="h-4 w-4 text-purple-400" />
                    </div>
                    Auto-Journal Engine
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-gray-300 mb-3">
                    <span className="text-purple-400 font-medium">94% automation rate</span> with
                    AI confidence scoring
                  </p>
                  <div className="flex gap-2">
                    <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                      AI-POWERED
                    </Badge>
                    <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">
                      CORE DNA
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  'relative overflow-hidden cursor-pointer',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group hover:scale-[1.02]'
                )}
                onClick={() => router.push('/docs/features/ifrs-compliance')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10">
                      <Globe className="h-4 w-4 text-green-400" />
                    </div>
                    IFRS Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-gray-300 mb-3">
                    Built-in{' '}
                    <span className="text-green-400 font-medium">
                      international financial reporting standards
                    </span>
                  </p>
                  <Badge className="bg-green-500/10 text-green-300 border-green-500/20">
                    STANDARD
                  </Badge>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  'relative overflow-hidden cursor-pointer',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group hover:scale-[1.02]'
                )}
                onClick={() => router.push('/docs/universal-coa-dna')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-2xl" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 dark:from-cyan-400/10 dark:to-blue-400/10">
                      <Cpu className="h-4 w-4 text-cyan-400" />
                    </div>
                    Universal COA DNA
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-gray-300 mb-3">
                    Industry & country-specific COA via HERA DNA
                  </p>
                  <div className="flex gap-2">
                    <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
                      HERA DNA
                    </Badge>
                    <Badge className="bg-orange-500/10 text-orange-300 border-orange-500/20">
                      30-SEC
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Industry Solutions */}
          <div
            className={cn(
              'transition-all duration-500 delay-500',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/10 dark:to-purple-400/10 backdrop-blur-sm">
                <Building2 className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100 dark:text-gray-100">
                Industry Solutions
              </h2>
            </div>
            <div
              className={cn(
                'relative overflow-hidden rounded-2xl',
                'bg-gray-900/60 backdrop-blur-xl',
                'border border-white/10 dark:border-gray-800/20',
                'shadow-xl p-6'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
              <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Link
                  href="/docs/civicflow"
                  className={cn(
                    'group relative overflow-hidden',
                    'flex items-center justify-between p-4',
                    'bg-gray-900/60 backdrop-blur-sm',
                    'rounded-xl border border-white/10 dark:border-gray-800/20',
                    'shadow-lg hover:shadow-xl transition-all duration-300',
                    'hover:scale-[1.05] hover:bg-indigo-500/10 dark:hover:bg-indigo-500/10'
                  )}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative text-sm font-medium text-gray-100 group-hover:text-indigo-300 transition-colors">
                    Public Sector
                  </span>
                  <ArrowRight className="relative h-4 w-4 text-gray-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/docs/salon"
                  className={cn(
                    'group relative overflow-hidden',
                    'flex items-center justify-between p-4',
                    'bg-gray-900/60 backdrop-blur-sm',
                    'rounded-xl border border-white/10 dark:border-gray-800/20',
                    'shadow-lg hover:shadow-xl transition-all duration-300',
                    'hover:scale-[1.05] hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10'
                  )}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative text-sm font-medium text-gray-100 group-hover:text-emerald-300 transition-colors">
                    Salon
                  </span>
                  <ArrowRight className="relative h-4 w-4 text-gray-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/docs/industries/restaurant"
                  className={cn(
                    'group relative overflow-hidden',
                    'flex items-center justify-between p-4',
                    'bg-gray-900/60 backdrop-blur-sm',
                    'rounded-xl border border-white/10 dark:border-gray-800/20',
                    'shadow-lg hover:shadow-xl transition-all duration-300',
                    'hover:scale-[1.05] hover:bg-orange-500/10 dark:hover:bg-orange-500/10'
                  )}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative text-sm font-medium text-gray-100 group-hover:text-orange-300 transition-colors">
                    Restaurant
                  </span>
                  <ArrowRight className="relative h-4 w-4 text-gray-400 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/docs/industries/healthcare"
                  className={cn(
                    'group relative overflow-hidden',
                    'flex items-center justify-between p-4',
                    'bg-gray-900/60 backdrop-blur-sm',
                    'rounded-xl border border-white/10 dark:border-gray-800/20',
                    'shadow-lg hover:shadow-xl transition-all duration-300',
                    'hover:scale-[1.05] hover:bg-red-500/10 dark:hover:bg-red-500/10'
                  )}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative text-sm font-medium text-gray-100 group-hover:text-red-300 transition-colors">
                    Healthcare
                  </span>
                  <ArrowRight className="relative h-4 w-4 text-gray-400 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/docs/industries/retail"
                  className={cn(
                    'group relative overflow-hidden',
                    'flex items-center justify-between p-4',
                    'bg-gray-900/60 backdrop-blur-sm',
                    'rounded-xl border border-white/10 dark:border-gray-800/20',
                    'shadow-lg hover:shadow-xl transition-all duration-300',
                    'hover:scale-[1.05] hover:bg-pink-500/10 dark:hover:bg-pink-500/10'
                  )}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/10 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative text-sm font-medium text-gray-100 group-hover:text-pink-300 transition-colors">
                    Retail
                  </span>
                  <ArrowRight className="relative h-4 w-4 text-gray-400 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/docs/industries/manufacturing"
                  className={cn(
                    'group relative overflow-hidden',
                    'flex items-center justify-between p-4',
                    'bg-gray-900/60 backdrop-blur-sm',
                    'rounded-xl border border-white/10 dark:border-gray-800/20',
                    'shadow-lg hover:shadow-xl transition-all duration-300',
                    'hover:scale-[1.05] hover:bg-gray-500/10 dark:hover:bg-gray-500/10'
                  )}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-gray-500/0 via-gray-500/10 to-gray-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative text-sm font-medium text-gray-100 group-hover:text-gray-300 transition-colors">
                    Manufacturing
                  </span>
                  <ArrowRight className="relative h-4 w-4 text-gray-400 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </div>

          {/* Developer Resources */}
          <div
            className={cn(
              'transition-all duration-500 delay-600',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 dark:from-cyan-400/10 dark:to-blue-400/10 backdrop-blur-sm">
                <Code2 className="h-5 w-5 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100 dark:text-gray-100">
                Developer Resources
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                className={cn(
                  'relative overflow-hidden',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                      <Code2 className="h-3 w-3 text-cyan-400" />
                    </div>
                    API Reference
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <ul className="space-y-3 text-sm">
                    <li>
                      <Link
                        href="/docs/api/rest"
                        className="group/link flex items-center justify-between text-gray-300 hover:text-cyan-400 transition-colors"
                      >
                        <span>REST API</span>
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/docs/api/typescript-client"
                        className="group/link flex items-center justify-between text-gray-300 hover:text-cyan-400 transition-colors"
                      >
                        <span>TypeScript Client</span>
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/docs/api/webhooks"
                        className="group/link flex items-center justify-between text-gray-300 hover:text-cyan-400 transition-colors"
                      >
                        <span>Webhooks</span>
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  'relative overflow-hidden',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                      <Layers className="h-3 w-3 text-purple-400" />
                    </div>
                    Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <ul className="space-y-3 text-sm">
                    <li>
                      <Link
                        href="/docs/integrations/mcp-server"
                        className="group/link flex items-center justify-between text-gray-300 hover:text-purple-400 transition-colors"
                      >
                        <span>MCP Server</span>
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/docs/integrations/progressive-pwa"
                        className="group/link flex items-center justify-between text-gray-300 hover:text-purple-400 transition-colors"
                      >
                        <span>Progressive PWA</span>
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/docs/integrations/whatsapp"
                        className="group/link flex items-center justify-between text-gray-300 hover:text-purple-400 transition-colors"
                      >
                        <span>WhatsApp Business</span>
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  'relative overflow-hidden',
                  'bg-gray-900/60 backdrop-blur-xl',
                  'border-white/10 dark:border-gray-800/20',
                  'shadow-lg hover:shadow-xl transition-all duration-300',
                  'group'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                      <MessageSquare className="h-3 w-3 text-green-400" />
                    </div>
                    Tools & Guides
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <ul className="space-y-3 text-sm">
                    <li>
                      <Link
                        href="/docs/claude-md"
                        className="group/link flex items-center justify-between text-gray-300 hover:text-green-400 transition-colors"
                      >
                        <span>CLAUDE.md Guide</span>
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/docs/monitoring"
                        className="group/link flex items-center justify-between text-gray-300 hover:text-green-400 transition-colors"
                      >
                        <span>Monitoring Setup</span>
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/docs/security"
                        className="group/link flex items-center justify-between text-gray-300 hover:text-green-400 transition-colors"
                      >
                        <span>Security Guide</span>
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Glassmorphism Footer */}
        <footer
          className={cn(
            'relative mt-24',
            'bg-gray-900/60 backdrop-blur-xl',
            'border-t border-white/10 dark:border-gray-800/20'
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-950/50" />
          <div className="relative max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Brand Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-lg border border-amber-500/20">
                      <Hexagon className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100">HERA</h3>
                    <p className="text-sm text-gray-300">Universal Architecture</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Built with{' '}
                  <span className="text-amber-400 font-medium">revolutionary universal design</span>{' '}
                  that powers infinite business complexity.
                </p>
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-300 border-amber-500/20">
                    v1.0.0
                  </Badge>
                  <Badge className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-300 border-green-500/20">
                    PRODUCTION
                  </Badge>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Quick Links
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/docs/quickstart"
                      className="text-gray-300 hover:text-cyan-400 transition-colors flex items-center gap-1 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      <span>Getting Started</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs/api/rest"
                      className="text-gray-300 hover:text-cyan-400 transition-colors flex items-center gap-1 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      <span>API Documentation</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs/architecture"
                      className="text-gray-300 hover:text-cyan-400 transition-colors flex items-center gap-1 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      <span>Architecture Guide</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  Community & Support
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="https://github.com/anthropics/claude-code/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-purple-400 transition-colors flex items-center gap-1 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      <span>Report Issues</span>
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/docs/community"
                      className="text-gray-300 hover:text-purple-400 transition-colors flex items-center gap-1 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      <span>Community Forum</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs/support"
                      className="text-gray-300 hover:text-purple-400 transition-colors flex items-center gap-1 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      <span>Enterprise Support</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-12 pt-8 border-t border-white/10 dark:border-gray-800/10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-300">
                <p>
                  © 2024 HERA. Enterprise Resource Planning with{' '}
                  <span className="text-amber-400 font-medium">
                    Revolutionary Universal Architecture
                  </span>
                </p>
                <div className="flex items-center gap-6">
                  <Link href="/docs/privacy" className="hover:text-gray-100 transition-colors">
                    Privacy
                  </Link>
                  <Link href="/docs/terms" className="hover:text-gray-100 transition-colors">
                    Terms
                  </Link>
                  <Link href="/docs/license" className="hover:text-gray-100 transition-colors">
                    License
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
