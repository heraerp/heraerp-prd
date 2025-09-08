"use client"

import { StatsCard as OriginalStatsCard, StatsGrid as OriginalStatsGrid } from "@/components/franchise/StatsCard"
import { StatsCard as DNAStatsCard, StatsGrid as DNAStatsGrid } from "@/components/franchise/StatsCard.dna"
import { DollarSign, TrendingUp, Users, ShoppingCart } from 'lucide-react'

export default function TestDNAStats() {
  const sampleStats = [
    {
      title: "Total Revenue",
      value: "$45,231",
      description: "Last 30 days",
      trend: { value: "12%", direction: "up" as const },
      icon: DollarSign,
      variant: "success" as const
    },
    {
      title: "Active Users",
      value: "2,345",
      description: "Currently online",
      trend: { value: "8%", direction: "up" as const },
      icon: Users,
      variant: "info" as const
    },
    {
      title: "Conversion Rate",
      value: "3.2%",
      description: "vs last month",
      trend: { value: "2%", direction: "down" as const },
      icon: TrendingUp,
      variant: "warning" as const
    },
    {
      title: "Total Orders",
      value: "1,234",
      description: "This month",
      icon: ShoppingCart,
      variant: "default" as const
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-8 space-y-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          HERA DNA Stats Card Migration Test
        </h1>
        
        {/* Original Stats Cards */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Original Stats Cards
          </h2>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl">
            <OriginalStatsGrid stats={sampleStats} />
          </div>
        </section>

        {/* DNA Stats Cards - Subtle Glass */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            DNA Stats Cards - Subtle Glass Effect
          </h2>
          <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl">
            <DNAStatsGrid stats={sampleStats} glassIntensity="subtle" />
          </div>
        </section>

        {/* DNA Stats Cards - Medium Glass */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            DNA Stats Cards - Medium Glass Effect (Default)
          </h2>
          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl">
            <DNAStatsGrid stats={sampleStats} glassIntensity="medium" />
          </div>
        </section>

        {/* DNA Stats Cards - Strong Glass */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            DNA Stats Cards - Strong Glass Effect
          </h2>
          <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl">
            <DNAStatsGrid stats={sampleStats} glassIntensity="strong" />
          </div>
        </section>

        {/* Side by Side Comparison */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Original (Light Background)
            </h3>
            <div className="p-6 bg-gray-100 rounded-xl">
              <OriginalStatsCard {...sampleStats[0]} />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              DNA Version (Light Background)
            </h3>
            <div className="p-6 bg-gray-100 rounded-xl">
              <DNAStatsCard {...sampleStats[0]} />
            </div>
          </div>
          
          <div className="dark">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">
              Original (Dark Background)
            </h3>
            <div className="p-6 bg-gray-900 rounded-xl">
              <OriginalStatsCard {...sampleStats[0]} />
            </div>
          </div>
          
          <div className="dark">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">
              DNA Version (Dark Background)
            </h3>
            <div className="p-6 bg-gray-900 rounded-xl">
              <DNAStatsCard {...sampleStats[0]} />
            </div>
          </div>
        </section>

        {/* Migration Notes */}
        <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            Migration Benefits
          </h3>
          <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <li>✓ Glass morphism effects add modern, premium feel</li>
            <li>✓ Improved dark mode text visibility with !important modifiers</li>
            <li>✓ Backward compatible - can disable DNA with enableDNA=false</li>
            <li>✓ Enhanced hover effects and transitions</li>
            <li>✓ Maintains all original functionality</li>
          </ul>
        </div>

        {/* Test Controls */}
        <div className="mt-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Test DNA Compatibility
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                DNA Stats Card with DNA disabled (should look like original):
              </p>
              <DNAStatsCard {...sampleStats[0]} enableDNA={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}