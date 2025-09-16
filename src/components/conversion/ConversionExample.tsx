'use client'

import { useState } from 'react'
import { ConversionBanner } from './ConversionBanner'
import { SaaSConversionWizard } from './SaaSConversionWizard'
import { DemoToSaaSConversionService } from '@/src/lib/conversion/demo-to-saas-service'
import type { ConversionData } from '@/src/lib/conversion/demo-to-saas-service'

interface ConversionMetrics {
  sessionDuration: string
  featuresUsed: string[]
  dataCreated: number
  returnVisits: number
  conversionReadiness: 'low' | 'medium' | 'high'
}

export function ConversionExample() {
  const [showWizard, setShowWizard] = useState(false)
  const [conversionResult, setConversionResult] = useState<any>(null)

  // Sample demo metrics
  const demoMetrics: ConversionMetrics = {
    sessionDuration: '45 minutes',
    featuresUsed: ['orders', 'inventory', 'reports', 'customers'],
    dataCreated: 15,
    returnVisits: 3,
    conversionReadiness: 'high'
  }

  const handleStartConversion = () => {
    setShowWizard(true)
  }

  const handleCompleteConversion = async (conversionData: ConversionData) => {
    console.log('🚀 Starting conversion with data:', conversionData)

    try {
      // In a real implementation, this would call the backend API
      const result = await DemoToSaaSConversionService.convertDemoToSaaS(conversionData)

      console.log('✅ Conversion completed:', result)
      setConversionResult(result)
      setShowWizard(false)
    } catch (error) {
      console.error('❌ Conversion failed:', error)
    }
  }

  const handleCancelConversion = () => {
    setShowWizard(false)
  }

  if (showWizard) {
    return (
      <SaaSConversionWizard
        demoModule="furniture"
        onComplete={handleCompleteConversion}
        onCancel={handleCancelConversion}
      />
    )
  }

  if (conversionResult) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4">🎉 Conversion Successful!</h1>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Production System is Ready</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <strong>Organization:</strong> {conversionResult.organization?.name}
              </div>
              <div>
                <strong>Subdomain:</strong> {conversionResult.organization?.subdomain}
              </div>
              <div>
                <strong>Access URL:</strong>
                <a href={conversionResult.accessUrl} className="text-primary hover:underline ml-2">
                  {conversionResult.accessUrl}
                </a>
              </div>
              <div>
                <strong>Setup:</strong> {conversionResult.businessSetup?.setupType}
              </div>
              {conversionResult.businessSetup && (
                <>
                  <div>
                    <strong>Chart of Accounts:</strong>{' '}
                    {conversionResult.businessSetup.chartOfAccounts} accounts
                  </div>
                  <div>
                    <strong>Templates:</strong> {conversionResult.businessSetup.templates} business
                    templates
                  </div>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setConversionResult(null)
              setShowWizard(false)
            }}
            className="bg-blue-600 text-foreground px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Another Conversion
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-8">Demo-to-SaaS Conversion Example</h1>

      <ConversionBanner
        demoModule="furniture"
        metrics={demoMetrics}
        onConvert={handleStartConversion}
      />

      <div className="mt-8 bg-muted dark:bg-muted rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">How It Works:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Customer explores demo and builds engagement metrics</li>
          <li>Conversion banner appears based on readiness score</li>
          <li>5-step wizard collects company info and plan selection</li>
          <li>Fresh production environment is created (no demo data migration)</li>
          <li>Customer gets custom subdomain and clean professional setup</li>
        </ol>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background dark:bg-muted rounded-lg p-4 border">
          <h3 className="font-semibold text-green-600">✅ Demo Benefits</h3>
          <ul className="text-sm mt-2 space-y-1">
            <li>• Rich demo data for exploration</li>
            <li>• Shared across all demo users</li>
            <li>• No impact on other users</li>
            <li>• Always available</li>
          </ul>
        </div>

        <div className="bg-background dark:bg-muted rounded-lg p-4 border">
          <h3 className="font-semibold text-primary">🚀 Production Benefits</h3>
          <ul className="text-sm mt-2 space-y-1">
            <li>• Clean, professional start</li>
            <li>• Industry-specific templates</li>
            <li>• Custom subdomain</li>
            <li>• IFRS-compliant COA</li>
          </ul>
        </div>

        <div className="bg-background dark:bg-muted rounded-lg p-4 border">
          <h3 className="font-semibold text-purple-600">💰 Business Impact</h3>
          <ul className="text-sm mt-2 space-y-1">
            <li>• High conversion rates</li>
            <li>• Predictable revenue</li>
            <li>• Scalable process</li>
            <li>• Customer success</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
