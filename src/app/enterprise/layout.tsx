'use client'

/**
 * Enterprise Layout
 * Smart Code: HERA.ENTERPRISE.LAYOUT.v1
 * 
 * HERA Fiori-inspired enterprise layout with navigation
 */

import React from 'react'
import { EnterpriseNavigation } from '@/components/enterprise/EnterpriseNavigation'

interface EnterpriseLayoutProps {
  children: React.ReactNode
}

export default function EnterpriseLayout({ children }: EnterpriseLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnterpriseNavigation />
      
      {/* Main Content Area */}
      <main className="relative">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>© 2024 HERA Enterprise</span>
              <span>•</span>
              <a href="/privacy" className="hover:text-gray-700">Privacy</a>
              <span>•</span>
              <a href="/terms" className="hover:text-gray-700">Terms</a>
              <span>•</span>
              <a href="/support" className="hover:text-gray-700">Support</a>
            </div>
            <div className="flex items-center space-x-2">
              <span>Version 1.2.2</span>
              <span>•</span>
              <span className="text-green-600">System Healthy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}