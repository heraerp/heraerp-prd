'use client'

import React from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  Rocket, 
  Terminal, 
  Database, 
  Shield, 
  Zap, 
  CheckCircle2,
  Code2,
  Settings,
  Globe,
  Sparkles,
  Play,
  Copy,
  ExternalLink,
  Timer,
  Users,
  Building2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function QuickstartPage() {
  const [mounted, setMounted] = React.useState(false)
  const [copiedStep, setCopiedStep] = React.useState<number | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(step)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  const steps = [
    {
      number: 1,
      title: 'Clone the Repository',
      description: 'Get the HERA codebase',
      command: 'git clone https://github.com/your-org/hera-erp.git\ncd hera-erp',
      icon: Terminal,
      color: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-400',
      time: '30 seconds'
    },
    {
      number: 2,
      title: 'Install Dependencies',
      description: 'Set up your development environment',
      command: 'npm install',
      icon: Settings,
      color: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-400',
      time: '2 minutes'
    },
    {
      number: 3,
      title: 'Configure Environment',
      description: 'Set up your database and environment variables',
      command: 'cp .env.example .env\n# Edit .env with your Supabase credentials',
      icon: Database,
      color: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-400',
      time: '1 minute'
    },
    {
      number: 4,
      title: 'Start Development Server',
      description: 'Launch HERA in development mode',
      command: 'npm run dev',
      icon: Play,
      color: 'from-amber-500/10 to-orange-500/10',
      iconColor: 'text-amber-400',
      time: '10 seconds'
    }
  ]

  const features = [
    {
      title: 'Universal Architecture',
      description: '6 tables handle infinite business complexity',
      icon: Database,
      link: '/docs/architecture'
    },
    {
      title: 'Multi-Tenant SaaS',
      description: 'Enterprise-grade isolation and security',
      icon: Shield,
      link: '/docs/security'
    },
    {
      title: 'Smart Codes',
      description: 'AI-powered business intelligence',
      icon: Zap,
      link: '/docs/smart-codes'
    },
    {
      title: 'Industry Solutions',
      description: 'Pre-built templates for any business',
      icon: Building2,
      link: '/docs/industries'
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dark Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      
      {/* Floating Gradient Orbs */}
      {mounted && (
        <>
          <div className="fixed top-40 left-20 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="fixed bottom-40 right-20 w-[30rem] h-[30rem] bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/70 border-b border-white/10 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <nav className="flex items-center gap-2 text-sm">
                <Link href="/docs" className="text-gray-400 hover:text-gray-200 transition-colors">
                  Docs
                </Link>
                <span className="text-gray-500">/</span>
                <span className="text-gray-100">Quick Start</span>
              </nav>
              <Link href="/docs/hub">
                <Button size="sm" variant="outline" className="border-gray-600 text-gray-100 hover:border-amber-500 transition-colors">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Back to Hub
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-12 space-y-20">
          {/* Hero Section */}
          <div className={cn(
            "relative overflow-hidden rounded-3xl",
            "bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-900/40",
            "backdrop-blur-xl border border-white/10",
            "shadow-2xl transition-all duration-500",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5" />
            <div className="relative p-12 md:p-16">
              <div className="max-w-4xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl border border-amber-500/20">
                    <Rocket className="w-8 h-8 text-amber-400" />
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30">
                    5 MINUTE SETUP
                  </Badge>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-gray-100 via-amber-400 to-gray-100 bg-clip-text text-transparent bg-300% animate-gradient">
                    Get Started with HERA
                  </span>
                </h1>
                
                <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl">
                  Set up the revolutionary Universal ERP system in minutes. HERA's 6-table architecture 
                  handles infinite business complexity with zero schema changes.
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Timer className="w-4 h-4 text-green-400" />
                    <span>5 minute setup</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Multi-tenant ready</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span>Any industry</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prerequisites */}
          <div className={cn(
            "transition-all duration-500 delay-100",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm">
                <CheckCircle2 className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100">
                Prerequisites
              </h2>
            </div>

            <Card className={cn(
              "relative overflow-hidden",
              "bg-gray-900/60 backdrop-blur-xl",
              "border-white/10",
              "shadow-xl"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
              <CardContent className="relative p-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-100 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-cyan-400" />
                      Development Tools
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        Node.js 18.0+
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        npm or yarn
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        Git
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-100 flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-400" />
                      Database
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        Supabase account
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        PostgreSQL 14+
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        Database credentials
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-100 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-amber-400" />
                      Environment
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        VS Code (recommended)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        Terminal access
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        Chrome/Edge browser
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Installation Steps */}
          <div className={cn(
            "transition-all duration-500 delay-200",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
                <Terminal className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100">
                Installation Steps
              </h2>
            </div>

            <div className="space-y-6">
              {steps.map((step, index) => (
                <Card
                  key={step.number}
                  className={cn(
                    "relative overflow-hidden",
                    "bg-gray-900/60 backdrop-blur-xl",
                    "border-white/10",
                    "shadow-lg hover:shadow-xl transition-all duration-300",
                    "group"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                    style={{
                      backgroundImage: `linear-gradient(to bottom right, ${step.color})`
                    }} 
                  />
                  <CardContent className="relative p-8">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          "bg-gradient-to-br backdrop-blur-sm border border-white/10",
                          step.color
                        )}>
                          <step.icon className={cn("w-6 h-6", step.iconColor)} />
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-100">
                              Step {step.number}: {step.title}
                            </h3>
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                              {step.time}
                            </Badge>
                          </div>
                          <p className="text-gray-400">{step.description}</p>
                        </div>
                        
                        <div className="relative group/code">
                          <pre className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 overflow-x-auto border border-gray-700/50">
                            <code className="text-sm text-gray-300">{step.command}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(step.command, step.number)}
                            className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity text-gray-300 hover:text-gray-100"
                          >
                            {copiedStep === step.number ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1 text-green-400" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div className={cn(
            "transition-all duration-500 delay-300",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm">
                <Settings className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100">
                Environment Configuration
              </h2>
            </div>

            <Card className={cn(
              "relative overflow-hidden",
              "bg-gray-900/60 backdrop-blur-xl",
              "border-white/10",
              "shadow-xl"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5" />
              <CardContent className="relative p-8">
                <p className="text-gray-300 mb-6">
                  Create a <code className="bg-gray-800/50 px-2 py-1 rounded text-amber-400">.env</code> file in your project root with the following variables:
                </p>
                
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                  <pre className="text-sm overflow-x-auto">
                    <code className="text-gray-300">{`# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database

# Organization Configuration
DEFAULT_ORGANIZATION_ID=your_org_uuid

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development`}</code>
                  </pre>
                </div>

                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Get your Supabase credentials from the{' '}
                      <a href="https://app.supabase.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-200 transition-colors">
                        Supabase Dashboard
                      </a>
                      {' '}under Settings → API
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <div className={cn(
            "transition-all duration-500 delay-400",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm">
                <Zap className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100">
                What's Next?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Link key={index} href={feature.link}>
                  <Card className={cn(
                    "relative overflow-hidden h-full",
                    "bg-gray-900/60 backdrop-blur-xl",
                    "border-white/10",
                    "shadow-lg hover:shadow-xl transition-all duration-300",
                    "group hover:scale-[1.02] cursor-pointer"
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="relative pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm">
                          <feature.icon className="h-5 w-5 text-amber-400" />
                        </div>
                        <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                          {feature.title}
                          <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="relative">
                      <CardDescription className="text-gray-400">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-8 p-8 bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl border border-white/10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-blue-500/20">
                  <ExternalLink className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-100 mb-2">
                    Ready to build your first business module?
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Follow our step-by-step guide to create a complete business solution using HERA's universal architecture.
                  </p>
                  <Link href="/docs/tutorials/first-module">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                      Start Building
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}