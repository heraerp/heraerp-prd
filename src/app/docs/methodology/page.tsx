'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Shield, Zap, Users, Database, GitBranch, CheckCircle2, Rocket, Settings } from 'lucide-react'

export default function MethodologyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-gray-900/10 dark:border-gray-50/[0.06] bg-white/95 dark:bg-gray-900/75">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text">
                  HERA Implementation Methodology
                </h1>
              </div>
              <Link href="/docs">
                <Button variant="outline">Documentation Hub</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative px-4 py-16 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            21-Day Implementation Journey
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            From requirements to production in 3 weeks with MCP orchestration and 100% module reuse
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          <Card className="border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">21</CardTitle>
              <CardDescription>Days to Go-Live</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-cyan-200 dark:border-cyan-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">Flexible</CardTitle>
              <CardDescription>Architecture</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">100%</CardTitle>
              <CardDescription>Module Reuse</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold text-purple-600 dark:text-purple-400">90%</CardTitle>
              <CardDescription>Cost Reduction</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Implementation Phases */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Implementation Phases
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Phase 1 */}
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Phase 1: Requirements</CardTitle>
                    <CardDescription>Days 1-3</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Conversational intake via MCP</li>
                  <li>• Auto-mapping to universal structure</li>
                  <li>• Business context assignment</li>
                  <li>• Draft entity creation</li>
                </ul>
              </CardContent>
            </Card>

            {/* Phase 2 */}
            <Card className="border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                    <Settings className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle>Phase 2: Configuration</CardTitle>
                    <CardDescription>Days 4-5</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Module DNA activation</li>
                  <li>• Finance/Purchasing/P2P toggle</li>
                  <li>• Approval workflow setup</li>
                  <li>• Business rules configuration</li>
                </ul>
              </CardContent>
            </Card>

            {/* Phase 3 */}
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle>Phase 3: Sandbox</CardTitle>
                    <CardDescription>Days 6-10</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Provision client.heraerp.com/{industry}</li>
                  <li>• Load template data</li>
                  <li>• Generate test scenarios</li>
                  <li>• Client playground testing</li>
                </ul>
              </CardContent>
            </Card>

            {/* Phase 4 */}
            <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Database className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <CardTitle>Phase 4: Migration</CardTitle>
                    <CardDescription>Days 11-15</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• ETL from legacy systems</li>
                  <li>• COA & master data import</li>
                  <li>• Opening balance load</li>
                  <li>• Guardrail validation</li>
                </ul>
              </CardContent>
            </Card>

            {/* Phase 5 */}
            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>Phase 5: UAT</CardTitle>
                    <CardDescription>Days 16-20</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Auto-generated test cases</li>
                  <li>• Test execution tracking</li>
                  <li>• UAT sign-off capture</li>
                  <li>• Final configuration tweaks</li>
                </ul>
              </CardContent>
            </Card>

            {/* Phase 6 */}
            <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <Rocket className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle>Phase 6: Go-Live</CardTitle>
                    <CardDescription>Day 21</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Production cutover</li>
                  <li>• CI guardrails validation</li>
                  <li>• Fiscal setup activation</li>
                  <li>• client.heraerp.com/{org} live</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Core Architecture */}
        <div className="mb-16">
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Universal Foundation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Organizations</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Multi-tenant isolation</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-cyan-600 dark:text-cyan-400 mb-2">Entities</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">All business objects</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Dynamic Data</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Flexible custom fields</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Relationships</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Entity connections</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">Transactions</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">All business events</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Transaction Details</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Line item information</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Intelligent Classification */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <GitBranch className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                Intelligent Business Classification
              </CardTitle>
              <CardDescription>
                Every business operation is intelligently categorized and tracked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 dark:bg-gray-950 text-green-400 p-6 rounded-lg font-mono text-sm overflow-x-auto">
                <div className="mb-4">
                  <span className="text-gray-400">// Intelligent Classification Pattern</span><br/>
                  Industry-specific • Module-aware • Type-driven • Version-controlled
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400">// Examples:</span>
                  </div>
                  <div>Manufacturing Purchase Orders</div>
                  <div>Retail Tax Invoicing</div>
                  <div>Healthcare Financial Journals</div>
                  <div>Project UAT Sign-offs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Comparison */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            HERA vs Traditional ERP
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="bg-red-50 dark:bg-red-950">
                <CardTitle className="text-red-700 dark:text-red-400">Traditional ERP</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✗</span> 6-18 month implementation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✗</span> $500K-5M cost
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✗</span> Complex customization required
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✗</span> Rigid approval workflows
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✗</span> Manual data migration
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">✗</span> Complex upgrade paths
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-950">
                <CardTitle className="text-green-700 dark:text-green-400">HERA with MCP</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 21-day go-live
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> $50K-100K cost
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Flexible architecture
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Chat-based rule updates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> MCP-orchestrated ETL
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Smart Code versioning
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="border-2 border-blue-500 dark:border-blue-600 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700">
            <CardContent className="py-12">
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text">
                Ready to Transform Your Business?
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Experience enterprise-grade ERP implementation in 21 days with flexible architecture and 90% cost reduction
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/docs/methodology/complete-guide">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                    Download Complete Guide
                  </Button>
                </Link>
                <Link href="/docs/methodology/detailed-flow">
                  <Button size="lg" variant="outline">
                    View Detailed Flow
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="outline">
                    Explore Documentation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}