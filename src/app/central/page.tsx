'use client'

import { useEffect } from 'react'
import { useLoadingStore } from '@/lib/stores/loading-store'

export default function CentralPage() {
  const { updateProgress, finishLoading } = useLoadingStore()

  // ⚡ ENTERPRISE: Complete loading animation on mount (if coming from login)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isInitializing = urlParams.get('initializing') === 'true'

    if (isInitializing) {
      console.log('🎯 CENTRAL: Completing loading animation from 70% → 100%')

      // Animate from 70% to 100% smoothly
      let progress = 70
      const progressInterval = setInterval(() => {
        progress += 5
        if (progress <= 100) {
          updateProgress(progress, undefined, progress === 100 ? 'Ready!' : 'Loading HERA Central...')
        }
        if (progress >= 100) {
          clearInterval(progressInterval)
          // Complete and hide overlay after brief delay
          setTimeout(() => {
            finishLoading()
            // Clean up URL parameter
            window.history.replaceState({}, '', window.location.pathname)
            console.log('✅ CENTRAL: Loading complete!')
          }, 500)
        }
      }, 50)

      return () => clearInterval(progressInterval)
    }
  }, [updateProgress, finishLoading])

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-black to-charcoal">
      {/* iOS-style status bar spacer - MANDATORY on mobile */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Mobile app header - MANDATORY */}
      <div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {/* Rounded app icon */}
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            {/* Title and subtitle */}
            <div>
              <h1 className="text-lg font-bold text-champagne">HERA Central</h1>
              <p className="text-xs text-bronze">Control Center</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Card */}
          <div className="bg-charcoal/50 backdrop-blur-xl border border-gold/20 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-bronze flex items-center justify-center">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-champagne mb-2">Welcome to HERA Central Hub</h2>
                <p className="text-bronze text-lg">System Command Center & Control Panel</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/30 rounded-xl p-4 border border-gold/10">
                <div className="text-gold text-2xl font-bold mb-1">5</div>
                <div className="text-bronze text-sm">Active Modules</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-gold/10">
                <div className="text-gold text-2xl font-bold mb-1">All Systems</div>
                <div className="text-bronze text-sm">Operational</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 border border-gold/10">
                <div className="text-gold text-2xl font-bold mb-1">100%</div>
                <div className="text-bronze text-sm">System Health</div>
              </div>
            </div>
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Control Center Module */}
            <div className="bg-charcoal/50 backdrop-blur-xl border border-gold/20 rounded-xl p-6 hover:border-gold/40 transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/30 transition-all">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-champagne font-bold text-lg mb-2">Control Center</h3>
              <p className="text-bronze text-sm mb-4">System overview and command dashboard</p>
              <div className="text-gold text-xs font-medium">Active</div>
            </div>

            {/* AI Insights Module */}
            <div className="bg-charcoal/50 backdrop-blur-xl border border-gold/20 rounded-xl p-6 hover:border-gold/40 transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/30 transition-all">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-champagne font-bold text-lg mb-2">AI Insights</h3>
              <p className="text-bronze text-sm mb-4">Intelligent analytics and predictions</p>
              <div className="text-gold text-xs font-medium">Active</div>
            </div>

            {/* App Management Module */}
            <div className="bg-charcoal/50 backdrop-blur-xl border border-gold/20 rounded-xl p-6 hover:border-gold/40 transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/30 transition-all">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="text-champagne font-bold text-lg mb-2">Apps Management</h3>
              <p className="text-bronze text-sm mb-4">Manage and configure applications</p>
              <div className="text-gold text-xs font-medium">Active</div>
            </div>

            {/* System Monitoring Module */}
            <div className="bg-charcoal/50 backdrop-blur-xl border border-gold/20 rounded-xl p-6 hover:border-gold/40 transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/30 transition-all">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-champagne font-bold text-lg mb-2">System Monitoring</h3>
              <p className="text-bronze text-sm mb-4">Real-time system health and metrics</p>
              <div className="text-gold text-xs font-medium">Active</div>
            </div>

            {/* Analytics Module */}
            <div className="bg-charcoal/50 backdrop-blur-xl border border-gold/20 rounded-xl p-6 hover:border-gold/40 transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/30 transition-all">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-champagne font-bold text-lg mb-2">Analytics</h3>
              <p className="text-bronze text-sm mb-4">Business intelligence and reports</p>
              <div className="text-gold text-xs font-medium">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Spacing for Mobile - MANDATORY */}
      <div className="h-24 md:h-0" />
    </div>
  )
}
