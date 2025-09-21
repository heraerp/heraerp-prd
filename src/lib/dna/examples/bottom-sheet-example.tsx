'use client'

import * as React from 'react'
import { BottomSheet, useBottomSheet } from '@/lib/dna/components/mobile/BottomSheet'
import { HeraButtonDNA } from '@/lib/dna/components/ui/hera-button-dna'
import { StatCardDNA } from '@/lib/dna/components/ui/stat-card-dna'
import { DollarSign, TrendingUp, Users, ShoppingCart } from 'lucide-react'

/**
 * Example of using BottomSheet in a HERA production context
 * This shows how to integrate the BottomSheet with other HERA DNA components
 */
export function BottomSheetProductionExample() {
  const detailsSheet = useBottomSheet()
  const [selectedMetric, setSelectedMetric] = React.useState<string>('')

  const metrics = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: '$45,231',
      icon: DollarSign,
      trend: '+12.5%',
      details: {
        breakdown: [
          { label: 'Product Sales', value: '$32,450' },
          { label: 'Service Revenue', value: '$12,781' }
        ]
      }
    },
    {
      id: 'customers',
      title: 'Active Customers',
      value: '1,234',
      icon: Users,
      trend: '+8.2%',
      details: {
        breakdown: [
          { label: 'New Customers', value: '234' },
          { label: 'Returning', value: '1,000' }
        ]
      }
    },
    {
      id: 'orders',
      title: 'Total Orders',
      value: '856',
      icon: ShoppingCart,
      trend: '+15.3%',
      details: {
        breakdown: [
          { label: 'Online Orders', value: '612' },
          { label: 'In-Store', value: '244' }
        ]
      }
    },
    {
      id: 'growth',
      title: 'Growth Rate',
      value: '23.5%',
      icon: TrendingUp,
      trend: '+5.2%',
      details: {
        breakdown: [
          { label: 'Q1 Growth', value: '18.2%' },
          { label: 'Q2 Growth', value: '23.5%' }
        ]
      }
    }
  ]

  const handleMetricClick = (metricId: string) => {
    setSelectedMetric(metricId)
    detailsSheet.open()
  }

  const selectedMetricData = metrics.find(m => m.id === selectedMetric)

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard with Interactive Bottom Sheet
      </h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(metric => (
          <div
            key={metric.id}
            onClick={() => handleMetricClick(metric.id)}
            className="cursor-pointer transform transition-transform hover:scale-105"
          >
            <StatCardDNA
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              trend={metric.trend}
            />
          </div>
        ))}
      </div>

      {/* Details Bottom Sheet */}
      <BottomSheet
        {...detailsSheet.sheetProps}
        title={selectedMetricData?.title}
        description="Tap for detailed breakdown"
        snapPoints={['30%', '60%']}
        defaultSnapPoint={0}
      >
        {selectedMetricData && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {selectedMetricData.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Period</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600">{selectedMetricData.trend}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">vs Last Period</p>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Breakdown</h3>
              <div className="space-y-2">
                {selectedMetricData.details.breakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-2">
              <HeraButtonDNA fullWidth variant="primary">
                View Full Report
              </HeraButtonDNA>
              <HeraButtonDNA fullWidth variant="outline">
                Export Data
              </HeraButtonDNA>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
