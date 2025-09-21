/**
 * HERA Demo Route Generator
 * Generates standardized demo routes for any industry
 */

import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Industry configurations for demo routes
export const INDUSTRY_DEMO_CONFIGS = {
  salon: {
    name: 'Hair Salon',
    demoType: 'salon-receptionist',
    dashboardPath: '/salon/dashboard',
    description: 'Beauty salon management with appointment booking and client management',
    features: [
      'Appointment Management',
      'Customer Database',
      'Service Catalog',
      'Inventory Tracking'
    ],
    color: 'pink',
    icon: '💇‍♀️'
  },
  restaurant: {
    name: 'Restaurant',
    demoType: 'restaurant-manager',
    dashboardPath: '/restaurant/dashboard',
    description: 'Restaurant operations with POS system and inventory management',
    features: ['POS System', 'Menu Management', 'Order Processing', 'Inventory Control'],
    color: 'orange',
    icon: '🍽️'
  },
  healthcare: {
    name: 'Medical Practice',
    demoType: 'healthcare-nurse',
    dashboardPath: '/healthcare/dashboard',
    description: 'Healthcare management with patient records and appointment scheduling',
    features: [
      'Patient Records',
      'Appointment Scheduling',
      'Medical History',
      'Insurance Processing'
    ],
    color: 'blue',
    icon: '🏥'
  },
  manufacturing: {
    name: 'Manufacturing Plant',
    demoType: 'manufacturing-supervisor',
    dashboardPath: '/manufacturing/dashboard',
    description: 'Manufacturing operations with production planning and quality control',
    features: ['Production Orders', 'Quality Control', 'Inventory Management', 'Staff Scheduling'],
    color: 'gray',
    icon: '🏭'
  }
}

/**
 * Generate demo route handler for any industry
 */
export function generateDemoRoute(industry: keyof typeof INDUSTRY_DEMO_CONFIGS) {
  const config = INDUSTRY_DEMO_CONFIGS[industry]

  return async function GET(request: NextRequest) {
    try {
      console.log(`🧬 Demo ${industry} route: Initializing session...`)

      // Call the universal demo initialization API
      const initResponse = await fetch(`${request.nextUrl.origin}/api/v1/demo/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ demoType: config.demoType })
      })

      if (!initResponse.ok) {
        const errorData = await initResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error(`❌ Demo ${industry} initialization failed:`, errorData)
        return NextResponse.redirect(`${request.nextUrl.origin}/?error=demo_init_failed`)
      }

      const sessionData = await initResponse.json()

      if (!sessionData.success) {
        console.error(`❌ Demo ${industry} session failed:`, sessionData.error)
        return NextResponse.redirect(`${request.nextUrl.origin}/?error=session_failed`)
      }

      console.log(`✅ Demo ${industry} session created, redirecting to dashboard...`)

      // Redirect to industry dashboard
      const response = NextResponse.redirect(`${request.nextUrl.origin}${config.dashboardPath}`)

      // Copy cookies from the API response (session cookies)
      const setCookieHeader = initResponse.headers.get('set-cookie')
      if (setCookieHeader) {
        response.headers.set('set-cookie', setCookieHeader)
      }

      return response
    } catch (error) {
      console.error(`💥 Demo ${industry} route error:`, error)
      return NextResponse.redirect(`${request.nextUrl.origin}/?error=server_error`)
    }
  }
}

/**
 * Generate demo page component for any industry
 */
export function generateDemoPage(industry: keyof typeof INDUSTRY_DEMO_CONFIGS) {
  const config = INDUSTRY_DEMO_CONFIGS[industry]

  const colorClasses = {
    pink: 'from-pink-50 via-white to-purple-50 bg-pink-600 hover:bg-pink-700 bg-pink-100 text-pink-700',
    orange:
      'from-orange-50 via-white to-red-50 bg-orange-600 hover:bg-orange-700 bg-orange-100 text-orange-700',
    blue: 'from-blue-50 via-white to-cyan-50 bg-blue-600 hover:bg-blue-700 bg-blue-100 text-blue-700',
    gray: 'from-gray-50 via-white to-slate-50 bg-gray-600 hover:bg-gray-700 bg-gray-100 text-gray-700'
  }

  return function DemoPage() {
    const [isLoading, setIsLoading] = React.useState(false)

    const handleDemo = () => {
      setIsLoading(true)
      window.location.href = `/demo/${industry}`
    }

    return (
      <div className={`min-h-screen bg-gradient-to-br ${colorClasses[config.color].split(' ')[0]}`}>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">{config.icon}</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Experience {config.name} Management
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {config.description}. Try our complete {industry} solution with real demo data.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-2">{config.name} Demo</h3>
              <p className="text-gray-600 mb-4">
                Full-featured {industry} management system with realistic workflow
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>Duration: 30 minutes</span>
                <span>Role: {config.demoType.split('-')[1]}</span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm font-medium text-gray-700">Features:</div>
                <div className="flex flex-wrap gap-2">
                  {config.features.map((feature, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded text-xs ${colorClasses[config.color].split(' ')[2]} ${colorClasses[config.color].split(' ')[3]}`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className={`w-full py-2 px-4 text-white rounded transition-colors ${colorClasses[config.color].split(' ')[1]}`}
                disabled={isLoading}
                onClick={handleDemo}
              >
                {isLoading ? 'Launching Demo...' : `Try ${config.name} Demo`}
              </button>
            </div>
          </div>

          <div className="text-center mt-12 p-6 bg-blue-50 rounded-lg max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-900 mb-2">
              🧬 Powered by HERA Authorization DNA
            </h3>
            <p className="text-sm text-blue-700">
              Demo sessions are automatically configured with appropriate permissions and sample
              data. Sessions expire after 30 minutes for security.
            </p>
          </div>
        </div>
      </div>
    )
  }
}

/**
 * Generate complete demo infrastructure for an industry
 */
export interface DemoInfrastructure {
  routeHandler: any
  pageComponent: any
  apiConfig: any
}

export function generateDemoInfrastructure(
  industry: keyof typeof INDUSTRY_DEMO_CONFIGS
): DemoInfrastructure {
  const config = INDUSTRY_DEMO_CONFIGS[industry]

  return {
    routeHandler: generateDemoRoute(industry),
    pageComponent: generateDemoPage(industry),
    apiConfig: {
      demoType: config.demoType,
      redirectPath: config.dashboardPath,
      industry: industry,
      sessionDuration: 30 * 60 * 1000 // 30 minutes
    }
  }
}

/**
 * Universal demo selection page
 */
export function UniversalDemoSelectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Experience HERA ERP</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Try our industry-specific ERP solutions with realistic demo data and workflows. Choose
            your industry to see HERA in action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {Object.entries(INDUSTRY_DEMO_CONFIGS).map(([key, config]) => (
            <div
              key={key}
              className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{config.icon}</div>
                <h3 className="text-lg font-semibold">{config.name}</h3>
              </div>

              <p className="text-gray-600 text-sm mb-4">{config.description}</p>

              <div className="space-y-2 mb-4">
                <div className="text-xs font-medium text-gray-700">Key Features:</div>
                <div className="flex flex-wrap gap-1">
                  {config.features.slice(0, 2).map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                    >
                      {feature}
                    </span>
                  ))}
                  {config.features.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{config.features.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              <a
                href={`/demo/${key}`}
                className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Try Demo
              </a>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 p-6 bg-blue-50 rounded-lg max-w-4xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-2">🧬 Universal HERA Authorization DNA</h3>
          <p className="text-sm text-blue-700">
            All demo environments use the same underlying authorization system with
            industry-specific permissions and workflows. Switch between industries to see how HERA
            adapts to different business needs.
          </p>
        </div>
      </div>
    </div>
  )
}

// Code generation utilities
export function generateRouteFile(industry: keyof typeof INDUSTRY_DEMO_CONFIGS): string {
  const config = INDUSTRY_DEMO_CONFIGS[industry]

  return `import { NextRequest } from 'next/server'
import { generateDemoRoute } from '@/lib/dna/generators/demo-route-generator'

// Generated demo route for ${config.name}
export const GET = generateDemoRoute('${industry}')
`
}

export function generatePageFile(industry: keyof typeof INDUSTRY_DEMO_CONFIGS): string {
  const config = INDUSTRY_DEMO_CONFIGS[industry]

  return `'use client'

import { generateDemoPage } from '@/lib/dna/generators/demo-route-generator'

// Generated demo page for ${config.name}
export default generateDemoPage('${industry}')
`
}

export default {
  generateDemoRoute,
  generateDemoPage,
  generateDemoInfrastructure,
  UniversalDemoSelectionPage,
  generateRouteFile,
  generatePageFile,
  INDUSTRY_DEMO_CONFIGS
}
