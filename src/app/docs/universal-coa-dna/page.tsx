'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Globe,
  Building2,
  Factory,
  Heart,
  ShoppingBag,
  Briefcase,
  TrendingUp,
  Cpu,
  Dna,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function UniversalCOADNAPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-muted p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0066CC] via-[#0084FF] to-[#00AAFF] rounded-lg p-6 text-foreground">
          <div className="flex justify-between items-start mb-4">
            <Button
              onClick={() => router.push('/docs')}
              variant="ghost"
              className="text-foreground hover:bg-background/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Docs
            </Button>
            <Badge variant="secondary" className="bg-background/20 text-foreground">
              HERA DNA System
            </Badge>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <Dna className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Universal COA - HERA DNA</h1>
          </div>
          <p className="text-xl opacity-90">
            Industry & Country Specific Chart of Accounts via HERA DNA Architecture
          </p>
        </div>

        {/* Introduction */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Revolutionary Universal COA System
            </CardTitle>
            <CardDescription>
              HERA DNA enables instant creation of industry and country-specific Chart of Accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose max-w-none">
              <p className="text-lg">
                The Universal Chart of Accounts (COA) is a core component of HERA DNA that
                revolutionizes enterprise accounting setup. Through intelligent DNA patterns, HERA
                can generate complete, compliant Chart of Accounts for any industry in any country
                in just 30 seconds.
              </p>

              <Alert className="my-4 border-purple-200 bg-purple-50">
                <AlertDescription>
                  <strong>HERA DNA Magic:</strong> 132 pre-configured templates (12 countries × 11
                  industries) with IFRS compliance built-in. Each template is a DNA strand that can
                  be customized and evolved for specific business needs.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* DNA Architecture */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Universal COA DNA Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="structure" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="structure">DNA Structure</TabsTrigger>
                <TabsTrigger value="patterns">Smart Patterns</TabsTrigger>
                <TabsTrigger value="generation">Generation Process</TabsTrigger>
              </TabsList>

              <TabsContent value="structure" className="space-y-4 mt-4">
                <div className="bg-background text-green-400 p-6 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`// HERA DNA COA Structure
const UniversalCOADNA = {
  // Base DNA Strands
  base: {
    assets: ['1000-1999'],      // Universal asset accounts
    liabilities: ['2000-2999'], // Universal liability accounts
    equity: ['3000-3999'],      // Universal equity accounts
    revenue: ['4000-4999'],     // Universal revenue accounts
    expenses: ['5000-5999'],    // Universal expense accounts
    other: ['6000-9999']        // Other accounts
  },
  
  // Country DNA Layers
  country: {
    'US': { tax_codes: 'IRS', gaap_compliance: true },
    'UK': { tax_codes: 'HMRC', ifrs_compliance: true },
    'UAE': { tax_codes: 'FTA', vat_enabled: true },
    'DE': { tax_codes: 'BMF', hgb_compliance: true },
    // ... 8 more countries
  },
  
  // Industry DNA Patterns
  industry: {
    'restaurant': {
      revenue_detail: ['food', 'beverage', 'catering'],
      expense_categories: ['cogs', 'labor', 'occupancy'],
      kpi_accounts: ['food_cost_ratio', 'labor_ratio']
    },
    'healthcare': {
      revenue_detail: ['patient_services', 'insurance', 'grants'],
      expense_categories: ['medical_supplies', 'staff', 'equipment'],
      compliance_accounts: ['hipaa', 'medicare', 'medicaid']
    },
    // ... 9 more industries
  },
  
  // Smart Code Integration
  smart_codes: {
    pattern: 'HERA.FIN.GL.{COUNTRY}.{INDUSTRY}.{ACCOUNT_TYPE}.V1',
    ai_learning: true,
    auto_evolution: true
  }
}`}</pre>
                </div>
              </TabsContent>

              <TabsContent value="patterns" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-2 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Country Patterns</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="font-medium">Tax Compliance</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="font-medium">Regulatory Standards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="font-medium">Currency & Format</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="font-medium">Local GAAP Rules</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Industry Patterns</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Revenue Recognition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Cost Structure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium">KPI Accounts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Compliance Needs</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="generation" className="space-y-4 mt-4">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">30-Second COA Generation Process</h3>
                  <ol className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="bg-purple-600 text-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        1
                      </span>
                      <div>
                        <strong>DNA Selection:</strong> Choose country + industry combination
                        <div className="text-sm text-muted-foreground">
                          Example: UAE + Restaurant
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-purple-600 text-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        2
                      </span>
                      <div>
                        <strong>Base Template Load:</strong> Universal 6-level account structure
                        <div className="text-sm text-muted-foreground">
                          1000+ base accounts with IFRS mapping
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-purple-600 text-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        3
                      </span>
                      <div>
                        <strong>Country Layer Apply:</strong> Tax codes, compliance rules, formats
                        <div className="text-sm text-muted-foreground">
                          VAT accounts, local reporting requirements
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-purple-600 text-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        4
                      </span>
                      <div>
                        <strong>Industry Specialization:</strong> Revenue/cost patterns, KPIs
                        <div className="text-sm text-muted-foreground">
                          Food cost accounts, labor tracking, tips
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-purple-600 text-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        5
                      </span>
                      <div>
                        <strong>Smart Code Assignment:</strong> Intelligent business context
                        <div className="text-sm text-muted-foreground">
                          HERA.FIN.GL.UAE.REST.FOOD_COST.V1
                        </div>
                      </div>
                    </li>
                  </ol>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Industry Examples */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Industry-Specific DNA Examples</CardTitle>
            <CardDescription>See how Universal COA adapts to different industries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Restaurant */}
              <Card className="border-2 hover:border-purple-400 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-orange-600" />
                    Restaurant DNA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>Revenue:</strong> Food, Beverage, Catering, Delivery
                  </div>
                  <div>
                    <strong>COGS:</strong> Food Cost (35%), Beverage Cost (25%)
                  </div>
                  <div>
                    <strong>Labor:</strong> Kitchen, Service, Management (30%)
                  </div>
                  <div>
                    <strong>KPIs:</strong> Table Turnover, Check Average, Food Waste
                  </div>
                  <Badge variant="outline" className="mt-2">
                    85 Specialized Accounts
                  </Badge>
                </CardContent>
              </Card>

              {/* Healthcare */}
              <Card className="border-2 hover:border-purple-400 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    Healthcare DNA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>Revenue:</strong> Patient Services, Insurance, Grants
                  </div>
                  <div>
                    <strong>Costs:</strong> Medical Supplies, Equipment, Staff
                  </div>
                  <div>
                    <strong>Compliance:</strong> HIPAA, Medicare, Medicaid
                  </div>
                  <div>
                    <strong>KPIs:</strong> Patient Days, Occupancy, AR Days
                  </div>
                  <Badge variant="outline" className="mt-2">
                    92 Specialized Accounts
                  </Badge>
                </CardContent>
              </Card>

              {/* Manufacturing */}
              <Card className="border-2 hover:border-purple-400 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Factory className="h-5 w-5 text-muted-foreground" />
                    Manufacturing DNA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>Revenue:</strong> Product Sales, Services, Warranties
                  </div>
                  <div>
                    <strong>Costs:</strong> Raw Materials, Labor, Overhead
                  </div>
                  <div>
                    <strong>Inventory:</strong> Raw, WIP, Finished Goods
                  </div>
                  <div>
                    <strong>KPIs:</strong> Efficiency, Utilization, Quality
                  </div>
                  <Badge variant="outline" className="mt-2">
                    96 Specialized Accounts
                  </Badge>
                </CardContent>
              </Card>

              {/* Retail */}
              <Card className="border-2 hover:border-purple-400 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Retail DNA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>Revenue:</strong> Sales, Online, Marketplace
                  </div>
                  <div>
                    <strong>COGS:</strong> Purchase Price, Freight, Duties
                  </div>
                  <div>
                    <strong>Operations:</strong> Rent, Staff, Marketing
                  </div>
                  <div>
                    <strong>KPIs:</strong> Inventory Turns, GMROI, Conversion
                  </div>
                  <Badge variant="outline" className="mt-2">
                    88 Specialized Accounts
                  </Badge>
                </CardContent>
              </Card>

              {/* Professional Services */}
              <Card className="border-2 hover:border-purple-400 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    Professional Services DNA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>Revenue:</strong> Consulting, Projects, Retainers
                  </div>
                  <div>
                    <strong>Costs:</strong> Staff, Contractors, Training
                  </div>
                  <div>
                    <strong>WIP:</strong> Unbilled Time, Expenses
                  </div>
                  <div>
                    <strong>KPIs:</strong> Utilization, Realization, Margin
                  </div>
                  <Badge variant="outline" className="mt-2">
                    78 Specialized Accounts
                  </Badge>
                </CardContent>
              </Card>

              {/* SaaS */}
              <Card className="border-2 hover:border-purple-400 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-green-600" />
                    SaaS DNA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>Revenue:</strong> MRR, ARR, Usage, Services
                  </div>
                  <div>
                    <strong>Costs:</strong> Hosting, Development, Support
                  </div>
                  <div>
                    <strong>Deferred:</strong> Revenue, Commissions
                  </div>
                  <div>
                    <strong>KPIs:</strong> CAC, LTV, Churn, NRR
                  </div>
                  <Badge variant="outline" className="mt-2">
                    82 Specialized Accounts
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* HERA DNA Integration */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
            <CardTitle>HERA DNA System Integration</CardTitle>
            <CardDescription>How Universal COA leverages the HERA DNA architecture</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">DNA Components Used</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Core DNA Strands</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Universal 6-Table Architecture</li>
                      <li>• Smart Code Classification System</li>
                      <li>• Multi-Tenant Isolation</li>
                      <li>• Dynamic Field Management</li>
                    </ul>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">DNA Evolution Features</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• AI-Powered Account Suggestions</li>
                      <li>• Industry Best Practice Learning</li>
                      <li>• Automatic Compliance Updates</li>
                      <li>• Smart Pattern Recognition</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Implementation Example</h3>
                <div className="bg-background text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`// Universal COA Generation via HERA DNA
const coa = await heraDNA.generateCOA({
  // DNA Selection
  country: 'UAE',
  industry: 'restaurant',
  organizationName: 'Mario\'s Authentic Italian',
  
  // DNA Configuration
  options: {
    ifrsCompliance: true,
    vatEnabled: true,
    multiCurrency: true,
    costCenters: ['main_kitchen', 'bar', 'catering'],
    
    // Industry-Specific DNA
    industryFeatures: {
      menuCosting: true,
      recipeManagement: true,
      tipTracking: true,
      deliveryIntegration: true
    }
  }
})

// Result: Complete COA in 30 seconds
{
  accounts: 85,
  ifrsMapping: 'complete',
  vatAccounts: 'configured',
  smartCodes: 'assigned',
  autoJournalRules: 'active'
}`}</pre>
                </div>
              </div>

              <Alert className="border-green-200 bg-green-50">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>DNA Evolution:</strong> The Universal COA learns from every
                  implementation, continuously improving account suggestions and industry patterns.
                  Over 10,000 businesses have contributed to the DNA knowledge base.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle>Revolutionary Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-background p-4 rounded-lg shadow">
                <h4 className="font-semibold mb-2">30-Second Setup</h4>
                <p className="text-sm text-muted-foreground">
                  Complete COA ready instantly vs 3-6 months traditional
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg shadow">
                <h4 className="font-semibold mb-2">$50K+ Savings</h4>
                <p className="text-sm text-muted-foreground">
                  No consultant fees or implementation costs
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg shadow">
                <h4 className="font-semibold mb-2">100% Compliance</h4>
                <p className="text-sm text-muted-foreground">
                  IFRS, local GAAP, and tax requirements built-in
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg shadow">
                <h4 className="font-semibold mb-2">Auto-Evolution</h4>
                <p className="text-sm text-muted-foreground">
                  COA adapts as regulations and business change
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg shadow">
                <h4 className="font-semibold mb-2">Smart Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Works with Auto-Journal Engine automatically
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg shadow">
                <h4 className="font-semibold mb-2">Multi-Entity</h4>
                <p className="text-sm text-muted-foreground">
                  Consolidation and elimination accounts included
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-600 to-blue-600 text-foreground">
          <CardContent className="pt-6 text-center">
            <h3 className="text-2xl font-bold mb-2">Experience Universal COA DNA</h3>
            <p className="mb-4 opacity-90">
              Generate your industry-specific Chart of Accounts in 30 seconds
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-background text-purple-600 hover:bg-muted"
            >
              Try COA Generator
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
