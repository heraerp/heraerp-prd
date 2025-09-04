'use client'

// ================================================================================
// HERA UNIVERSAL CASHFLOW PAGE
// Comprehensive cashflow management and analysis interface
// Smart Code: HERA.UI.CF.PAGE.v1
// ================================================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import CashflowDashboard from '@/components/cashflow/CashflowDashboard'
import { 
  Waves, TrendingUp, Building2, Play, Settings, 
  CheckCircle, AlertTriangle, Info, Sparkles
} from 'lucide-react'

export default function CashflowPage() {
  const [demoSetup, setDemoSetup] = useState<any>(null)
  const [isSettingUpDemo, setIsSettingUpDemo] = useState(false)
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null)
  const [showDashboard, setShowDashboard] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Try to get organization ID from various sources
    const orgId = getOrganizationId()
    setCurrentOrganizationId(orgId)
    
    // Check if demo was already set up
    checkDemoStatus(orgId)
  }, [])

  const getOrganizationId = (): string => {
    // In a real app, this would come from authentication context
    // For demo purposes, use a default organization ID
    return '550e8400-e29b-41d4-a716-446655440000'
  }

  const checkDemoStatus = async (organizationId: string | null) => {
    if (!organizationId) return

    try {
      // Check if demo data already exists by trying to generate a statement
      const response = await fetch(
        `/api/v1/cashflow?action=health_check&organization_id=${organizationId}`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Try to get a simple statement to see if there's data
          const testResponse = await fetch(
            `/api/v1/cashflow?action=generate_statement&organization_id=${organizationId}&start_date=2024-01-01&end_date=2024-01-31&method=direct`
          )
          
          if (testResponse.ok) {
            const testData = await testResponse.json()
            if (testData.success && testData.data && testData.data.operating_activities.length > 0) {
              setShowDashboard(true)
            }
          }
        }
      }
    } catch (error) {
      console.log('No existing demo data found')
    }
  }

  const setupHairSalonDemo = async () => {
    if (!currentOrganizationId) {
      setError('Organization ID is required to setup demo')
      return
    }

    setIsSettingUpDemo(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/cashflow/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'setup_hair_salon_demo',
          organization_id: currentOrganizationId
        })
      })

      const data = await response.json()

      if (data.success) {
        setDemoSetup(data.data)
        setShowDashboard(true)
      } else {
        setError(data.error || 'Failed to setup demo')
      }

    } catch (err: any) {
      setError(err.message)
      console.error('Error setting up demo:', err)
    } finally {
      setIsSettingUpDemo(false)
    }
  }

  if (!currentOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Organization Required</h2>
            <p className="text-gray-600 mb-4">
              Please set up an organization to access the cashflow system.
            </p>
            <Button onClick={() => window.location.href = '/auth/organizations'}>
              Setup Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showDashboard) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Waves className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                HERA Universal Cashflow System
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Complete cashflow analysis with direct and indirect methods
              </p>
            </div>
          </div>

          {demoSetup && (
            <Alert className="mb-4">
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <strong>Demo Setup Complete!</strong> Hair Talkz salon demo with {demoSetup.details.demo_data.transactions_created} transactions 
                and {demoSetup.details.gl_accounts.accounts_created} GL accounts. 
                Net cashflow: <strong>{demoSetup.details.demo_data.net_cashflow > 0 ? '+' : ''}{demoSetup.details.demo_data.net_cashflow.toLocaleString('en-AE', { style: 'currency', currency: 'AED' })}</strong>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <CashflowDashboard organizationId={currentOrganizationId} currency="AED" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 rounded-2xl">
            <Waves className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          HERA Universal Cashflow System
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Revolutionary cashflow statement generation using the universal 6-table architecture. 
          Supports both direct and indirect methods with industry-specific templates and real-time analysis.
        </p>
      </div>

      {/* Key Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <FeatureCard
          icon={<TrendingUp className="h-6 w-6" />}
          title="Direct & Indirect Methods"
          description="Generate cashflow statements using both IFRS-compliant direct and indirect methods with automatic reconciliation."
          badges={['IFRS Compliant', 'GAAP Compatible']}
        />
        
        <FeatureCard
          icon={<Building2 className="h-6 w-6" />}
          title="Industry-Specific Templates"
          description="Pre-configured templates for restaurants, salons, healthcare, retail, and manufacturing with industry benchmarks."
          badges={['5+ Industries', 'Smart Codes']}
        />
        
        <FeatureCard
          icon={<Waves className="h-6 w-6" />}
          title="Universal Architecture"
          description="Built on HERA's 6-table universal system. No schema changes needed for any business type or complexity."
          badges={['Zero Schema Changes', 'Universal']}
        />
        
        <FeatureCard
          icon={<CheckCircle className="h-6 w-6" />}
          title="Auto-Journal Integration"
          description="Seamlessly integrates with HERA's auto-journal posting engine for real-time cashflow tracking."
          badges={['Real-time', 'Automated']}
        />
        
        <FeatureCard
          icon={<TrendingUp className="h-6 w-6" />}
          title="Advanced Analytics"
          description="Trend analysis, forecasting, seasonal patterns, and industry benchmarking with AI-powered insights."
          badges={['AI-Powered', 'Forecasting']}
        />
        
        <FeatureCard
          icon={<Settings className="h-6 w-6" />}
          title="Multi-Currency Support"
          description="Full support for multiple currencies with real-time conversion and localized formatting."
          badges={['Multi-Currency', 'Global Ready']}
        />
      </div>

      {/* Demo Setup Section */}
      <Card className="mb-8">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Hair Talkz Salon Demo
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Experience the complete cashflow system with a realistic hair salon business including 
            seasonal patterns, equipment purchases, and staff management scenarios.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">800+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Demo Transactions</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">6</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Months of Data</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">4</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Business Scenarios</div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-lg">Demo includes:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Service revenue (haircuts, coloring, styling)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Product sales and inventory management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Staff payments and benefits</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Equipment purchases and financing</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Seasonal business patterns</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Operating expense management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Owner contributions and withdrawals</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Complete IFRS-compliant GL accounts</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <Button 
              onClick={setupHairSalonDemo}
              disabled={isSettingUpDemo}
              size="lg"
              className="px-8 py-3"
            >
              {isSettingUpDemo ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting up demo...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Setup Hair Talkz Demo
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Creates 800+ realistic transactions with 6 months of salon operations data
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Technical Implementation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Cashflow Classification Engine</h3>
              <ul className="space-y-2 text-sm">
                <li>• Smart Code-based transaction classification</li>
                <li>• Operating, investing, and financing categorization</li>
                <li>• Industry-specific classification rules</li>
                <li>• Automatic GL account mapping</li>
                <li>• Multi-currency transaction support</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Statement Generation</h3>
              <ul className="space-y-2 text-sm">
                <li>• Direct method: Actual cash receipts and payments</li>
                <li>• Indirect method: Net income reconciliation</li>
                <li>• IFRS and GAAP compliant formatting</li>
                <li>• Automated reconciliation and validation</li>
                <li>• Export to CSV, PDF, and Excel formats</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold mb-2">Universal 6-Table Architecture</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Built on HERA's revolutionary 6-table system (core_entities, core_dynamic_data, core_relationships, 
              universal_transactions, universal_transaction_lines, core_organizations). No schema changes required 
              for any business type or cashflow complexity. Complete audit trail and multi-tenant isolation included.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================================================
// FEATURE CARD COMPONENT
// ================================================================================

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  badges: string[]
}

function FeatureCard({ icon, title, description, badges }: FeatureCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400">
            {icon}
          </div>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
          {description}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {badge}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}