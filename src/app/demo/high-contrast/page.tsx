'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp,
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Using the HERA High Contrast Scheme
const stats = [
  {
    title: 'Total Revenue',
    value: 125000,
    icon: DollarSign,
    change: '+12.5% from last month',
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    title: 'Active Users',
    value: 3421,
    icon: Users,
    change: '+180 new this week',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    title: 'Products',
    value: 0,
    icon: Package,
    change: 'No products yet',
    gradient: 'from-pink-500 to-purple-600'
  },
  {
    title: 'Growth Rate',
    value: 23.5,
    icon: TrendingUp,
    change: 'Above target',
    gradient: 'from-yellow-500 to-orange-600'
  }
]

const navigation = [
  { name: 'Dashboard', href: '/demo/high-contrast', icon: LayoutDashboard },
  { name: 'Products', href: '/demo/high-contrast/products', icon: Package },
  { name: 'Sales', href: '/demo/high-contrast/sales', icon: ShoppingCart },
  { name: 'Analytics', href: '/demo/high-contrast/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/demo/high-contrast/settings', icon: Settings },
]

export default function HighContrastDemo() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar - Always Dark */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100">
                HERA Demo
              </h2>
              <p className="text-xs text-gray-400">High Contrast UI</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg" 
                      : "text-gray-300 hover:text-gray-100 hover:bg-gray-800"
                  )}
                >
                  <div className={cn(
                    "mr-3 p-1.5 rounded-md transition-all duration-200",
                    isActive 
                      ? "bg-white/20" 
                      : "bg-gray-800 group-hover:bg-gray-700"
                  )}>
                    <item.icon className={cn(
                      "h-4 w-4 transition-all duration-200",
                      isActive 
                        ? "text-white" 
                        : "text-gray-400 group-hover:text-gray-200"
                    )} />
                  </div>
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Info Panel */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-100 mb-2">
              High Contrast Features
            </h3>
            <ul className="space-y-1 text-xs text-gray-300">
              <li>• Zero values: text-gray-300</li>
              <li>• Numbers: text-white</li>
              <li>• Dark sidebar: Always</li>
              <li>• WCAG AA compliant</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72 flex-1">
        <main className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                High Contrast Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Demonstrating HERA DNA high contrast UI patterns with excellent visibility
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <Card key={stat.title} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {stat.title}
                      </CardTitle>
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm",
                        stat.gradient
                      )}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {loading ? (
                      <div className="space-y-2">
                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl font-black tracking-tight">
                          <span className={stat.value === 0 ? "text-gray-500 dark:text-gray-300" : "text-black dark:text-white"}>
                            {typeof stat.value === 'number' && stat.value % 1 !== 0 
                              ? stat.value.toFixed(1) 
                              : stat.value}
                            {stat.title === 'Growth Rate' && '%'}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                          {stat.change}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Content Examples */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Data Table Example */}
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Sample Data Display</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Total Sales', value: '$125,000', change: '+12.5%' },
                      { label: 'Pending Orders', value: '0', change: 'None' },
                      { label: 'Active Items', value: '342', change: '+28' },
                      { label: 'Low Stock', value: '0', change: 'All stocked' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.label}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className={cn(
                            "font-semibold",
                            item.value === '0' ? "text-gray-500 dark:text-gray-300" : "text-black dark:text-white"
                          )}>
                            {item.value}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {item.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Guidelines Display */}
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Contrast Guidelines Applied</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        ✅ Key Features
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <li>• Dark mode by default</li>
                        <li>• Special zero value handling</li>
                        <li>• Large fonts for numbers (4xl)</li>
                        <li>• Icon containers for visibility</li>
                        <li>• No glass morphism effects</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        🎨 Color Hierarchy
                      </h4>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Primary</span>
                          <span className="text-sm font-medium text-black dark:text-white">White on Dark</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Zero Values</span>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Gray 300</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Labels</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gray 300</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}