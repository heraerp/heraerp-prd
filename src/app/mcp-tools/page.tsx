'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ================================================================================
// MCP TOOLS DASHBOARD - Progressive to Production Conversion Suite
// Central hub for all MCP-powered conversion tools
// Smart Code: HERA.MCP.TOOLS.DASHBOARD.V1
// ================================================================================

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Database,
  Code,
  Wand2,
  ArrowRight,
  Sparkles,
  FileCode,
  Terminal,
  Zap,
  GitBranch,
  Package,
  Rocket,
  Shield,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

const tools = [
  {
    id: 'sql-converter',
    title: 'MCP SQL Converter',
    description: 'Convert progressive demo data to production database',
    icon: Database,
    color: 'blue',
    href: '/mcp-sql-converter',
    features: [
      'Analyzes hard-coded demo data',
      'Generates SQL for Supabase',
      'Creates MCP commands',
      'Smart code generation'
    ],
    stats: {
      timeToConvert: '< 1 min',
      accuracy: '99%',
      tablesCreated: 6
    }
  },
  {
    id: 'page-wizard',
    title: 'Page Production Wizard',
    description: 'Transform progressive pages to production-ready code',
    icon: Code,
    color: 'purple',
    href: '/mcp-page-wizard',
    features: [
      'Removes hard-coded data',
      'Adds Universal API calls',
      'Implements loading states',
      'Production optimization'
    ],
    stats: {
      codeReduction: '40%',
      apiIntegration: '100%',
      performance: '+60%'
    }
  },
  {
    id: 'batch-wizard',
    title: 'Batch Production Wizard',
    description: 'Convert entire progressive apps to production at once',
    icon: Package,
    color: 'indigo',
    href: '/mcp-batch-wizard',
    features: [
      'Convert multiple pages',
      'Automatic file saving',
      'Progress tracking',
      'Bulk operations'
    ],
    stats: {
      pagesPerMinute: '10+',
      batchSize: 'Unlimited',
      autoSave: '100%'
    }
  },
  {
    id: 'conversion-demo',
    title: 'Live Conversion Demo',
    description: 'See the complete progressive to production process',
    icon: Rocket,
    color: 'green',
    href: '/progressive-to-production-demo',
    features: [
      'Step-by-step visualization',
      'UAT testing included',
      'Real-time progress',
      'Deployment ready'
    ],
    stats: {
      conversionSteps: 7,
      uatTests: 5,
      successRate: '100%'
    }
  }
]

const processSteps = [
  {
    number: 1,
    title: 'Extract Demo Data',
    description: 'Use SQL Converter to analyze progressive pages',
    icon: FileCode
  },
  {
    number: 2,
    title: 'Generate Database',
    description: 'Create production tables with MCP commands',
    icon: Database
  },
  {
    number: 3,
    title: 'Convert Pages',
    description: 'Transform single or batch pages to production',
    icon: Code
  },
  {
    number: 4,
    title: 'Deploy Production',
    description: 'Launch your production-ready application',
    icon: Rocket
  }
]

export default function MCPToolsDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild className="bg-background/80">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  MCP Conversion Tools
                </h1>
                <p className="text-lg text-slate-700 font-medium mt-2">
                  Transform Progressive Apps to Production Systems in Minutes
                </p>
              </div>
            </div>
            <Badge className="px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-800 border-indigo-500/30">
              <Sparkles className="h-4 w-4 mr-2" />
              AI-Powered Conversion
            </Badge>
          </div>

          {/* Hero Section */}
          <Card className="bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-pink-600/90 text-foreground border-0 shadow-2xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Progressive to Production in 4 Steps</h2>
                  <p className="text-indigo-100 mb-6 text-lg">
                    Convert your progressive demo data and pages into a fully functional production
                    system with our MCP-powered tools. No manual coding required.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm rounded-lg px-4 py-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Zero Data Loss</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm rounded-lg px-4 py-2">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">5 Min Conversion</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm rounded-lg px-4 py-2">
                      <Shield className="h-5 w-5" />
                      <span className="font-medium">Production Ready</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="relative">
                    <div className="absolute inset-0 bg-background/10 rounded-full blur-3xl"></div>
                    <Terminal className="h-32 w-32 mx-auto text-foreground/80" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Process Steps */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Conversion Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {processSteps.map((step, index) => (
              <div key={step.number} className="relative">
                <Card className="bg-background/40 backdrop-blur-xl border-border/20 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-foreground font-bold mb-4 mx-auto">
                      {step.number}
                    </div>
                    <step.icon className="h-8 w-8 text-indigo-600 mb-3 mx-auto" />
                    <h3 className="font-semibold text-slate-800 mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
                {index < processSteps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tools.map(tool => {
            const Icon = tool.icon
            const colorClasses = {
              blue: 'from-blue-500 to-indigo-600',
              purple: 'from-purple-500 to-pink-600',
              green: 'from-green-500 to-emerald-600',
              indigo: 'from-indigo-500 to-purple-600'
            }

            return (
              <Card
                key={tool.id}
                className="bg-background/40 backdrop-blur-xl border-border/20 shadow-xl hover:shadow-2xl transition-all group"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 bg-gradient-to-br ${colorClasses[tool.color]} rounded-xl text-foreground shadow-lg`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {tool.color === 'blue' && 'Database'}
                      {tool.color === 'purple' && 'Code'}
                      {tool.color === 'green' && 'Demo'}
                      {tool.color === 'indigo' && 'Batch'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <p className="text-muted-foreground text-sm mt-2">{tool.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {tool.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                    {Object.entries(tool.stats).map(([key, value]) => (
                      <div key={key} className="bg-background/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="font-semibold text-sm text-slate-800">{value}</p>
                      </div>
                    ))}
                  </div>

                  <Button
                    asChild
                    className={`w-full bg-gradient-to-r ${colorClasses[tool.color]} hover:opacity-90 text-foreground`}
                  >
                    <Link href={tool.href}>
                      <Icon className="h-4 w-4 mr-2" />
                      Open Tool
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Example Conversion */}
        <Card className="bg-background/30 backdrop-blur-xl border-border/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <GitBranch className="h-7 w-7 text-indigo-600" />
              Example: Salon Progressive Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-3 text-slate-800">Before (Progressive)</h3>
                <div className="bg-background text-slate-100 p-4 rounded-lg text-sm font-mono">
                  <pre>{`const demoData = {
  customers: [
    { name: 'Sarah Johnson', 
      email: 'sarah@email.com',
      totalSpent: 1240 }
  ]
}

// Hard-coded display
<div>{demoData.customers[0].name}</div>`}</pre>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-slate-800">After (Production)</h3>
                <div className="bg-background text-slate-100 p-4 rounded-lg text-sm font-mono">
                  <pre>{`const [customers, setCustomers] = useState([])

useEffect(() => {
  const data = await universalApi.query(
    'core_entities', 
    { entity_type: 'customer' }
  )
  setCustomers(data)
}, [])

// Dynamic display
<div>{customers[0]?.entity_name}</div>`}</pre>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Conversion Benefits</p>
                  <p className="text-sm text-green-700">
                    Real-time data • Multi-tenant security • API integration • Production
                    scalability
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-xl border-border/20 shadow-xl inline-block">
            <CardContent className="p-8">
              <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Ready to Convert?</h3>
              <p className="text-slate-700 mb-6 max-w-md">
                Start with the SQL Converter to analyze your progressive data, then use the Page
                Wizard to transform your code. It's that simple!
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/mcp-sql-converter">
                    <Database className="h-5 w-5 mr-2" />
                    Start with SQL Converter
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/progressive-to-production-demo">
                    <Rocket className="h-5 w-5 mr-2" />
                    Watch Demo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
