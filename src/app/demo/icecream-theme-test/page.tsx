'use client'

import { useState } from 'react'
import { ThemeProviderDNA } from '@/lib/dna/theme/theme-provider-dna'
import IceCreamDashboard from '@/app/icecream/page'
import { DemoOrgProvider } from '@/components/providers/DemoOrgProvider'

export default function IceCreamThemeTest() {
  const [showSideBySide, setShowSideBySide] = useState(true)

  if (showSideBySide) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="p-4 bg-white shadow-sm">
          <h1 className="text-2xl font-bold">Ice Cream Theme Test - Side by Side Comparison</h1>
          <button
            onClick={() => setShowSideBySide(false)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Switch to Full View
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 p-4">
          {/* Light Mode */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-200 p-2 text-center font-semibold">
              Light Mode
            </div>
            <div className="bg-white">
              <ThemeProviderDNA defaultTheme="ice-cream-enterprise" forceMode="light">
                <DemoOrgProvider>
                  <div className="p-6">
                    <IceCreamDashboard />
                  </div>
                </DemoOrgProvider>
              </ThemeProviderDNA>
            </div>
          </div>

          {/* Dark Mode */}
          <div className="border-2 border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 text-white p-2 text-center font-semibold">
              Dark Mode
            </div>
            <div className="bg-gray-900">
              <ThemeProviderDNA defaultTheme="ice-cream-enterprise" forceMode="dark">
                <DemoOrgProvider>
                  <div className="p-6">
                    <IceCreamDashboard />
                  </div>
                </DemoOrgProvider>
              </ThemeProviderDNA>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowSideBySide(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-lg"
        >
          Side by Side View
        </button>
      </div>
      
      <ThemeProviderDNA defaultTheme="ice-cream-enterprise" defaultMode="system">
        <DemoOrgProvider>
          <div className="p-6">
            <IceCreamDashboard />
          </div>
        </DemoOrgProvider>
      </ThemeProviderDNA>
    </div>
  )
}