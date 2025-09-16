'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import {
  HeraCard,
  HeraWealthCard,
  HeraGlassCard,
  HeraMetricCard,
  HeraMetric,
  HeraWealthMetric,
  HeraProgress,
  HeraWealthProgress,
  HeraGoalProgress,
  HeraRiskProgress,
  HeraLayout,
  HeraGrid,
  HeraStack,
  HeraPageHeader,
  HeraSection,
  HeraThemeProvider,
  HeraThemeToggle
} from '@/src/components/universal/ui'
import {
  DollarSign,
  TrendingUp,
  Users,
  ShoppingBag,
  BarChart3,
  Zap,
  Target,
  Shield,
  Activity
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'

function DesignSystemShowcase() {
  return (
    <HeraLayout variant="full-width" padding="lg">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <HeraPageHeader
          title="HERA Universal Design System"
          subtitle="Premium dark-mode components with sophisticated animations and glass morphism effects"
          actions={
            <HeraStack direction="horizontal" gap="sm">
              <HeraThemeToggle />
              <Button variant="outline">View Documentation</Button>
              <Button className="hera-button">Get Started</Button>
            </HeraStack>
          }
        />

        {/* Card Variants Section */}
        <HeraSection
          title="Card Components"
          subtitle="Various card styles with different visual treatments"
        >
          <HeraGrid cols={4} gap="lg">
            <HeraCard animation="fade-in" animationDelay={100}>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Default Card</h3>
                <p className="text-sm text-muted-foreground">
                  Standard HERA card with subtle styling and hover effects.
                </p>
              </div>
            </HeraCard>

            <HeraGlassCard animation="fade-in" animationDelay={200}>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Glass Card</h3>
                <p className="text-sm text-muted-foreground">
                  Modern glass morphism with backdrop blur and depth.
                </p>
              </div>
            </HeraGlassCard>

            <HeraWealthCard animation="fade-in" animationDelay={300}>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Wealth Card</h3>
                <p className="text-sm text-muted-foreground">
                  Premium styling for financial data with gradient overlays.
                </p>
              </div>
            </HeraWealthCard>

            <HeraMetricCard interactive animation="fade-in" animationDelay={400}>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Metric Card</h3>
                <p className="text-sm text-muted-foreground">
                  Interactive card with hover animations and border effects.
                </p>
              </div>
            </HeraMetricCard>
          </HeraGrid>
        </HeraSection>

        {/* Metrics Section */}
        <HeraSection
          title="Metric Components"
          subtitle="Display key performance indicators with trend analysis"
        >
          <HeraGrid cols={4} gap="lg">
            <HeraWealthMetric
              title="Portfolio Value"
              value={250000000}
              change={{ value: 6000000, percentage: 2.4, period: '24h' }}
              trend="up"
            />

            <HeraMetric
              title="Daily Revenue"
              value={125000}
              format="currency"
              change={{ value: 12500, percentage: 11.1, period: 'vs yesterday' }}
              trend="up"
              icon={<DollarSign className="h-5 w-5" />}
            />

            <HeraMetric
              title="Active Users"
              value={8547}
              change={{ value: -183, percentage: -2.1, period: 'vs last week' }}
              trend="down"
              icon={<Users className="h-5 w-5" />}
            />

            <HeraMetric
              title="Conversion Rate"
              value={23.5}
              format="percentage"
              change={{ value: 1.2, percentage: 5.2 }}
              trend="up"
              icon={<Target className="h-5 w-5" />}
            />
          </HeraGrid>
        </HeraSection>

        {/* Progress Indicators */}
        <HeraSection
          title="Progress Indicators"
          subtitle="Visual progress tracking with various styles and use cases"
        >
          <HeraGrid cols={2} gap="lg">
            <HeraCard animation="slide-up" animationDelay={100}>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Standard Progress</h3>

                <HeraProgress
                  value={75}
                  label="Project Completion"
                  showPercentage
                  variant="default"
                />

                <HeraWealthProgress
                  value={60}
                  label="Portfolio Allocation"
                  showPercentage
                  showValue
                  max={100}
                />

                <HeraProgress
                  value={90}
                  label="System Performance"
                  showPercentage
                  variant="success"
                  size="lg"
                />
              </div>
            </HeraCard>

            <HeraCard animation="slide-up" animationDelay={200}>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Specialized Progress</h3>

                <HeraGoalProgress current={8500} target={10000} title="Daily Revenue Goal" />

                <HeraRiskProgress riskLevel={35} />

                <HeraGoalProgress
                  current={12500}
                  target={10000}
                  title="Monthly Target (Exceeded)"
                />
              </div>
            </HeraCard>
          </HeraGrid>
        </HeraSection>

        {/* Animation Showcase */}
        <HeraSection
          title="Animation System"
          subtitle="Smooth, physics-based animations with advanced easing"
        >
          <HeraGrid cols={4} gap="md">
            <div className="animate-fade-in animate-delay-100">
              <HeraCard className="hera-center h-24">
                <span className="text-sm font-medium">Fade In</span>
              </HeraCard>
            </div>

            <div className="animate-slide-up animate-delay-200">
              <HeraCard className="hera-center h-24">
                <span className="text-sm font-medium">Slide Up</span>
              </HeraCard>
            </div>

            <div className="animate-scale-in animate-delay-300">
              <HeraCard className="hera-center h-24">
                <span className="text-sm font-medium">Scale In</span>
              </HeraCard>
            </div>

            <div className="animate-bounce-in animate-delay-500">
              <HeraCard className="hera-center h-24">
                <span className="text-sm font-medium">Bounce In</span>
              </HeraCard>
            </div>
          </HeraGrid>

          <HeraGrid cols={3} gap="md" className="mt-8">
            <HeraCard className="hera-center h-24 animate-glow">
              <span className="text-sm font-medium">Glow Effect</span>
            </HeraCard>

            <HeraCard className="hera-center h-24 animate-float">
              <span className="text-sm font-medium">Floating</span>
            </HeraCard>

            <HeraCard className="hera-center h-24">
              <div className="w-full h-4 hera-shimmer rounded"></div>
            </HeraCard>
          </HeraGrid>
        </HeraSection>

        {/* Interactive Elements */}
        <HeraSection
          title="Interactive Components"
          subtitle="Hover effects and interactive feedback"
        >
          <HeraGrid cols={3} gap="lg">
            <HeraCard
              interactive
              glow="primary"
              className="hera-center h-32 cursor-pointer"
              onClick={() => alert('Primary Glow Card Clicked!')}
            >
              <div className="text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-hera-400" />
                <span className="text-sm font-medium">Primary Glow</span>
              </div>
            </HeraCard>

            <HeraCard
              interactive
              glow="success"
              className="hera-center h-32 cursor-pointer"
              onClick={() => alert('Success Glow Card Clicked!')}
            >
              <div className="text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-hera-emerald-400" />
                <span className="text-sm font-medium">Success Glow</span>
              </div>
            </HeraCard>

            <HeraCard
              interactive
              glow="warning"
              className="hera-center h-32 cursor-pointer"
              onClick={() => alert('Warning Glow Card Clicked!')}
            >
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-hera-amber-400" />
                <span className="text-sm font-medium">Warning Glow</span>
              </div>
            </HeraCard>
          </HeraGrid>
        </HeraSection>

        {/* Status Indicators */}
        <HeraSection
          title="Status & Trends"
          subtitle="Visual indicators for different states and trends"
        >
          <HeraGrid cols={3} gap="lg">
            <HeraCard>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Status Colors</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 hera-status-positive" />
                    <span className="hera-status-positive font-medium">Positive Trend</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 hera-status-negative rotate-180" />
                    <span className="hera-status-negative font-medium">Negative Trend</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 hera-status-neutral" />
                    <span className="hera-status-neutral font-medium">Neutral Status</span>
                  </div>
                </div>
              </div>
            </HeraCard>

            <HeraCard>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Surface Levels</h3>
                <div className="space-y-2">
                  <div className="hera-surface-1 p-3 rounded">Surface 1</div>
                  <div className="hera-surface-2 p-3 rounded">Surface 2</div>
                  <div className="hera-surface-elevated p-3 rounded">Elevated</div>
                </div>
              </div>
            </HeraCard>

            <HeraCard>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Layout Utilities</h3>
                <div className="hera-stack-vertical gap-2">
                  <div className="hera-stack-horizontal">
                    <div className="bg-hera-500 p-2 rounded text-xs">Item 1</div>
                    <div className="bg-hera-cyan-500 p-2 rounded text-xs">Item 2</div>
                  </div>
                  <div className="hera-center bg-hera-emerald-500 p-4 rounded">
                    <span className="text-xs">Centered Content</span>
                  </div>
                </div>
              </div>
            </HeraCard>
          </HeraGrid>
        </HeraSection>

        {/* Footer */}
        <div className="text-center py-12 border-t border-border">
          <p className="text-muted-foreground">
            HERA Universal Design System - Built for premium enterprise applications
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Extracted from PWM system patterns and standardized for universal use
          </p>
        </div>
      </div>
    </HeraLayout>
  )
}

export default function DesignSystemPage() {
  return (
    <HeraThemeProvider defaultTheme="dark">
      <DesignSystemShowcase />
    </HeraThemeProvider>
  )
}
