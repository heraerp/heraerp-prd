'use client'

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
  Star
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function DocsHub() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-white">
      {/* GitHub-style Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold">HERA Documentation</h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0">
                v1.0
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-gray-600">
                <Star className="h-4 w-4 mr-1" />
                Star
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600">
                <GitBranch className="h-4 w-4 mr-1" />
                Fork
              </Button>
            </div>
          </div>
          <p className="text-gray-600 mt-1">
            Enterprise Resource Planning with Revolutionary Universal Architecture
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Book className="h-5 w-5" />
            Overview
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-700 leading-relaxed">
              HERA is a revolutionary ERP platform built on a universal architecture that handles infinite business 
              complexity without schema changes. With AI-powered automation, multi-tenant SaaS capabilities, and 
              enterprise-grade financial features, HERA delivers in 30 seconds what traditional ERPs take months to achieve.
            </p>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Quick Start
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => router.push('/docs/quickstart')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Getting Started</CardTitle>
                <CardDescription className="text-sm">
                  Set up HERA in your environment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  npm install && npm run dev
                </code>
              </CardContent>
            </Card>

            <Card 
              className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => router.push('/docs/architecture')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Architecture</CardTitle>
                <CardDescription className="text-sm">
                  Understand the universal design
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-600">
                  <div>• Universal schema</div>
                  <div>• Smart codes</div>
                  <div>• Multi-tenant</div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => router.push('/docs/api/rest')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">API Reference</CardTitle>
                <CardDescription className="text-sm">
                  Complete API documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  POST /api/v1/universal
                </code>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Core Features */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Core Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  Universal Architecture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  Revolutionary architecture with infinite scalability
                </p>
                <Badge variant="outline" className="text-xs">CORE</Badge>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  Multi-Tenant SaaS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  Enterprise-grade security with perfect isolation
                </p>
                <Badge variant="outline" className="text-xs">PRODUCTION</Badge>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-600" />
                  AI Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  Multi-provider AI with intelligent routing
                </p>
                <Badge variant="outline" className="text-xs">HERA DNA</Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Financial Features */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => router.push('/docs/features/chart-of-accounts')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Chart of Accounts
                </CardTitle>
                <CardDescription>
                  Universal COA system with 132 industry templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">IFRS</Badge>
                  <Badge variant="outline" className="text-xs">PRODUCTION</Badge>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => router.push('/docs/features/auto-journal')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-purple-600" />
                  Auto-Journal Engine
                </CardTitle>
                <CardDescription>
                  85% automation rate for journal entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">AI-POWERED</Badge>
                  <Badge variant="outline" className="text-xs">CORE DNA</Badge>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => router.push('/docs/features/ifrs-compliance')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-600" />
                  IFRS Compliance
                </CardTitle>
                <CardDescription>
                  Built-in international financial reporting standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-xs">STANDARD</Badge>
              </CardContent>
            </Card>

            <Card 
              className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => router.push('/docs/universal-coa-dna')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-purple-600" />
                  Universal COA DNA
                </CardTitle>
                <CardDescription>
                  Industry & country-specific COA via HERA DNA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">HERA DNA</Badge>
                  <Badge variant="outline" className="text-xs">30-SEC</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Industry Solutions */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Industry Solutions
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/docs/industries/restaurant" className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors">
                <span className="text-sm font-medium">Restaurant</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link href="/docs/industries/healthcare" className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors">
                <span className="text-sm font-medium">Healthcare</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link href="/docs/industries/retail" className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors">
                <span className="text-sm font-medium">Retail</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link href="/docs/industries/manufacturing" className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors">
                <span className="text-sm font-medium">Manufacturing</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Developer Resources */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Developer Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">API Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/docs/api/rest" className="text-blue-600 hover:underline">
                      REST API →
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/api/typescript-client" className="text-blue-600 hover:underline">
                      TypeScript Client →
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/api/webhooks" className="text-blue-600 hover:underline">
                      Webhooks →
                    </Link>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/docs/integrations/mcp-server" className="text-blue-600 hover:underline">
                      MCP Server →
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/integrations/progressive-pwa" className="text-blue-600 hover:underline">
                      Progressive PWA →
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/integrations/whatsapp" className="text-blue-600 hover:underline">
                      WhatsApp Business →
                    </Link>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tools & Guides</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/docs/claude-md" className="text-blue-600 hover:underline">
                      CLAUDE.md Guide →
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/monitoring" className="text-blue-600 hover:underline">
                      Monitoring Setup →
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/security" className="text-blue-600 hover:underline">
                      Security Guide →
                    </Link>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-8 mt-16 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <p>Built with HERA Universal Architecture</p>
              <p className="mt-1">Powered by HERA</p>
            </div>
            <div className="text-right">
              <p>Version 1.0.0</p>
              <p className="mt-1">
                <a href="https://github.com/anthropics/claude-code/issues" className="text-blue-600 hover:underline">
                  Report Issues
                </a>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}