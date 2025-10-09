/**
 * Mobile Responsiveness Test Page
 *
 * Test page to verify mobile layout components work correctly
 * across all device sizes and breakpoints.
 */

'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LuxeCard, SalonStatsCard } from '@/components/ui/salon/luxe-card'
import { LuxeButton, SalonActionButton } from '@/components/ui/salon/luxe-button'
import { MobileLayout, ResponsiveGrid, MobileContainer } from '@/components/salon/mobile-layout'
import {
  Smartphone,
  Tablet,
  Monitor,
  Crown,
  DollarSign,
  Users,
  Calendar,
  Star,
  Settings,
  Scissors,
  Sparkles
} from 'lucide-react'

export default function MobileTestPage() {
  const [selectedDevice, setSelectedDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')

  const deviceSizes = {
    mobile: 'max-w-sm mx-auto',
    tablet: 'max-w-2xl mx-auto',
    desktop: 'max-w-full'
  }

  return (
    <MobileLayout>
      <MobileContainer maxWidth="full" padding={false}>
        <div className="px-4 md:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent mb-2">
              Mobile Responsiveness Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
              Testing mobile layout components across different screen sizes
            </p>
          </div>

          {/* Device Selector */}
          <LuxeCard variant="glass" className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant={selectedDevice === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedDevice('mobile')}
                className="flex items-center space-x-2"
              >
                <Smartphone className="h-4 w-4" />
                <span>Mobile</span>
              </Button>
              <Button
                variant={selectedDevice === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedDevice('tablet')}
                className="flex items-center space-x-2"
              >
                <Tablet className="h-4 w-4" />
                <span>Tablet</span>
              </Button>
              <Button
                variant={selectedDevice === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedDevice('desktop')}
                className="flex items-center space-x-2"
              >
                <Monitor className="h-4 w-4" />
                <span>Desktop</span>
              </Button>
            </div>
          </LuxeCard>

          {/* Test Container */}
          <div
            className={`border-2 border-dashed border-purple-300 rounded-xl p-4 ${deviceSizes[selectedDevice]}`}
          >
            <Badge className="mb-4">Testing {selectedDevice} view</Badge>

            {/* Stats Grid Test */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Stats Grid (1/2/4 columns)</h3>
              <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 4, xl: 4 }}>
                <SalonStatsCard
                  title="Revenue"
                  value="$8,450"
                  subtitle="+12.5% this week"
                  trend="up"
                  icon={<DollarSign className="h-6 w-6" />}
                  color="gold"
                />
                <SalonStatsCard
                  title="Clients"
                  value="28"
                  subtitle="+8.3% this week"
                  trend="up"
                  icon={<Users className="h-6 w-6" />}
                  color="purple"
                />
                <SalonStatsCard
                  title="Bookings"
                  value="32"
                  subtitle="+15.2% this week"
                  trend="up"
                  icon={<Calendar className="h-6 w-6" />}
                  color="rose"
                />
                <SalonStatsCard
                  title="Rating"
                  value="4.8"
                  subtitle="124 reviews"
                  trend="up"
                  icon={<Star className="h-6 w-6" />}
                  color="blue"
                />
              </ResponsiveGrid>
            </div>

            {/* Cards Grid Test */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Cards Grid (1/2/3 columns)</h3>
              <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3, xl: 3 }}>
                <LuxeCard variant="floating" title="Card 1" description="Testing responsive layout">
                  <p className="text-sm text-gray-600">
                    This card should adapt to different screen sizes.
                  </p>
                </LuxeCard>
                <LuxeCard variant="glass" title="Card 2" description="Glassmorphism effect">
                  <p className="text-sm text-gray-600">Glass effect with backdrop blur.</p>
                </LuxeCard>
                <LuxeCard
                  variant="gradient"
                  gradientType="sunset"
                  title="Card 3"
                  className="text-white"
                >
                  <p className="text-sm opacity-90">Gradient background card.</p>
                </LuxeCard>
              </ResponsiveGrid>
            </div>

            {/* Action Buttons Test */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Action Buttons (responsive)</h3>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <SalonActionButton
                  action="Book Client"
                  icon={<Calendar className="h-5 w-5" />}
                  color="purple"
                  className="flex-1 sm:flex-none"
                />
                <SalonActionButton
                  action="Add Payment"
                  icon={<DollarSign className="h-5 w-5" />}
                  color="gold"
                  className="flex-1 sm:flex-none"
                />
                <SalonActionButton
                  action="Settings"
                  icon={<Settings className="h-5 w-5" />}
                  color="rose"
                  className="flex-1 sm:flex-none"
                />
              </div>
            </div>

            {/* Mixed Layout Test */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Mixed Layout (1/1/3 columns)</h3>
              <ResponsiveGrid cols={{ sm: 1, md: 1, lg: 3, xl: 3 }} className="items-start">
                <div className="lg:col-span-2">
                  <LuxeCard variant="floating" title="Main Content Area">
                    <p className="text-sm text-gray-600 mb-4">
                      This area takes up 2/3 of the width on large screens, full width on mobile.
                    </p>
                    <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 2, xl: 2 }}>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <Scissors className="h-8 w-8 text-purple-500 mb-2" />
                        <p className="text-sm font-medium">Service 1</p>
                      </div>
                      <div className="p-4 bg-rose-50 rounded-lg">
                        <Sparkles className="h-8 w-8 text-rose-500 mb-2" />
                        <p className="text-sm font-medium">Service 2</p>
                      </div>
                    </ResponsiveGrid>
                  </LuxeCard>
                </div>
                <div>
                  <LuxeCard variant="glass" title="Sidebar">
                    <p className="text-sm text-gray-600 mb-4">
                      Sidebar content that stacks below main content on mobile.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Premium Feature</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">5-Star Rating</span>
                      </div>
                    </div>
                  </LuxeCard>
                </div>
              </ResponsiveGrid>
            </div>

            {/* Responsive Text Test */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Responsive Typography</h3>
              <LuxeCard variant="floating">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">
                  Responsive Heading
                </h2>
                <p className="text-sm md:text-base text-gray-600 mb-4">
                  This text adjusts size based on screen breakpoints. Lorem ipsum dolor sit amet,
                  consectetur adipiscing elit. On mobile it's smaller, on desktop it's larger.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-purple-100 rounded">
                    <p className="text-xs md:text-sm font-medium">Stat 1</p>
                  </div>
                  <div className="p-2 bg-rose-100 rounded">
                    <p className="text-xs md:text-sm font-medium">Stat 2</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded">
                    <p className="text-xs md:text-sm font-medium">Stat 3</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded">
                    <p className="text-xs md:text-sm font-medium">Stat 4</p>
                  </div>
                </div>
              </LuxeCard>
            </div>

            {/* Test Summary */}
            <LuxeCard variant="gradient" gradientType="primary" className="text-white">
              <h3 className="text-lg font-semibold mb-2">Test Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">✅ Responsive Grid System</p>
                  <p className="opacity-90">Adapts columns based on screen size</p>
                </div>
                <div>
                  <p className="font-medium mb-1">✅ Mobile Layout</p>
                  <p className="opacity-90">Header, navigation, and content areas</p>
                </div>
                <div>
                  <p className="font-medium mb-1">✅ Touch-Friendly Buttons</p>
                  <p className="opacity-90">Proper sizing for mobile interaction</p>
                </div>
                <div>
                  <p className="font-medium mb-1">✅ Responsive Typography</p>
                  <p className="opacity-90">Text scales appropriately</p>
                </div>
              </div>
            </LuxeCard>
          </div>
        </div>
      </MobileContainer>
    </MobileLayout>
  )
}
