'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { GeographicMap } from '@/components/pwm/GeographicMap'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Globe2 } from 'lucide-react'
import Link from 'next/link'

export default function GeographicMapPage() {
  // TODO: Get organization ID from auth context
  const organizationId = 'demo-org-001'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/pwm">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to PWM
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <Globe2 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Geographic Distribution</h1>
                  <p className="text-sm text-slate-400">Interactive global investment map</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Map */}
          <div className="lg:col-span-2">
            <GeographicMap organizationId={organizationId} />
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            {/* Investment Summary */}
            <Card className="p-6 bg-slate-900/50 backdrop-blur-sm border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Investment Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Global Assets</span>
                  <span className="text-xl font-bold text-white">$100M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active Regions</span>
                  <span className="text-lg font-semibold text-blue-400">4</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Top Performing</span>
                  <span className="text-lg font-semibold text-emerald-400">Asia Pacific</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Average Growth</span>
                  <span className="text-lg font-semibold text-emerald-400">+3.8%</span>
                </div>
              </div>
            </Card>

            {/* Risk Distribution */}
            <Card className="p-6 bg-slate-900/50 backdrop-blur-sm border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Low Risk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '60%' }} />
                    </div>
                    <span className="text-sm text-slate-300">60%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Medium Risk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: '30%' }} />
                    </div>
                    <span className="text-sm text-slate-300">30%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">High Risk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: '10%' }} />
                    </div>
                    <span className="text-sm text-slate-300">10%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Currency Exposure */}
            <Card className="p-6 bg-slate-900/50 backdrop-blur-sm border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Currency Exposure</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">USD</span>
                  <span className="text-sm font-medium text-white">55%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">EUR</span>
                  <span className="text-sm font-medium text-white">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">JPY</span>
                  <span className="text-sm font-medium text-white">12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Other</span>
                  <span className="text-sm font-medium text-white">8%</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
