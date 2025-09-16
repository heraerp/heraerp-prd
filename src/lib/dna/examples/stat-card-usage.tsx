'use client'

import { StatCardDNA, MiniStatCardDNA, StatCardGrid } from '@/src/lib/dna/components/ui/stat-card-dna'
import { DollarSign, TrendingUp, Package, Users, AlertCircle, Calendar } from 'lucide-react'

/**
 * Example usage of HERA DNA Stat Card components
 *
 * This example demonstrates how to use the StatCardDNA components
 * which automatically handle dark mode text visibility issues.
 */

export function StatCardExample() {
  // Example data
  const totalRevenue = 1234567
  const totalProducts = 248
  const lowStockItems = 12
  const expiringItems = 5

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">HERA DNA Stat Cards Example</h2>

      {/* Full-size stat cards with 4-column grid */}
      <StatCardGrid columns={4}>
        <StatCardDNA
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          change="+12.5% from last month"
          changeType="positive"
          icon={DollarSign}
          iconGradient="from-green-500 to-emerald-500"
        />

        <StatCardDNA
          title="Total Products"
          value={totalProducts}
          change="24 active SKUs"
          changeType="neutral"
          icon={Package}
          iconGradient="from-blue-500 to-purple-500"
        />

        <StatCardDNA
          title="Low Stock Alerts"
          value={lowStockItems}
          change="Requires attention"
          changeType="negative"
          icon={AlertCircle}
          iconGradient="from-yellow-500 to-orange-500"
        />

        <StatCardDNA
          title="Expiring Soon"
          value={expiringItems}
          change="Within 7 days"
          changeType="negative"
          icon={Calendar}
          iconGradient="from-red-500 to-pink-500"
        />
      </StatCardGrid>

      {/* Mini stat cards for compact displays */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Mini Stat Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniStatCardDNA
            title="Today's Sales"
            value="₹42,000"
            icon={TrendingUp}
            iconColor="text-green-500"
          />

          <MiniStatCardDNA
            title="Active Users"
            value={156}
            icon={Users}
            iconColor="text-blue-500"
          />

          <MiniStatCardDNA
            title="Pending Orders"
            value={23}
            icon={Package}
            iconColor="text-orange-500"
          />
        </div>
      </div>

      {/* Custom styled stat card */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Custom Styled Stat Card</h3>
        <StatCardDNA
          title="Monthly Target"
          value="85%"
          change="₹15,000 remaining"
          changeType="positive"
          icon={TrendingUp}
          iconGradient="from-purple-500 to-pink-500"
          className="border-purple-300 dark:border-purple-700"
          valueClassName="text-4xl" // Override default text size
        />
      </div>
    </div>
  )
}

/**
 * Migration guide from old pattern to new DNA component:
 *
 * OLD:
 * ```tsx
 * <Card>
 *   <CardContent className="p-6">
 *     <div className="flex items-center justify-between">
 *       <div>
 *         <p className="text-sm text-muted-foreground dark:text-muted-foreground">Total Revenue</p>
 *         <p className="text-2xl font-bold mt-1">₹1,234,567</p>
 *       </div>
 *       <DollarSign className="w-8 h-8 text-green-500" />
 *     </div>
 *   </CardContent>
 * </Card>
 * ```
 *
 * NEW:
 * ```tsx
 * <StatCardDNA
 *   title="Total Revenue"
 *   value="₹1,234,567"
 *   icon={DollarSign}
 *   iconGradient="from-green-500 to-emerald-500"
 * />
 * ```
 *
 * Benefits:
 * - Automatic dark mode text visibility fix
 * - Consistent styling across all stat cards
 * - Less code to write
 * - Built-in animations and hover effects
 * - Responsive by default
 */
