'use client'
import React from 'react'
import { BackgroundGradient } from '../ui/background-gradient'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Play, ArrowRight, Sparkles, Rocket, BarChart3, Users, Monitor } from 'lucide-react'

// Multiple demo variations
export function BackgroundGradientDemo() {
  return (
    <div className="section py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* HERA Business Card */}
        <BackgroundGradient variant="hera" className="p-6 sm:p-8" gradientSize="md" animate={true}>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-500">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <Badge className="bg-[var(--surface-veil)] ink border-[var(--border-strong)]">
                <Sparkles className="w-3 h-3 mr-1" />
                Enterprise Ready
              </Badge>
            </div>

            <h3 className="text-xl font-bold ink mb-2">HERA Universal ERP</h3>

            <p className="text-sm ink-muted mb-6 flex-1">
              Transform your business with our revolutionary universal platform. Run everything from
              restaurants to healthcare in one beautiful system.
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-500 text-white hover:opacity-95"
              >
                <Play className="w-4 h-4 mr-1" />
                Demo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-[var(--border-strong)] bg-[var(--surface-veil)] ink hover:opacity-95"
              >
                Learn More
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </BackgroundGradient>

        {/* Enterprise Analytics Card */}
        <BackgroundGradient
          variant="enterprise"
          className="p-6 sm:p-8"
          gradientSize="lg"
          animate={true}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl glass">
                <BarChart3 className="w-6 h-6 ink" />
              </div>
              <span className="text-sm font-medium ink">Analytics Suite</span>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="ink-muted">Revenue Growth</span>
                  <span className="ink font-medium">+127%</span>
                </div>
                <div className="w-full bg-[var(--surface-veil)] rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full w-[78%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="ink-muted">Efficiency</span>
                  <span className="ink font-medium">94%</span>
                </div>
                <div className="w-full bg-[var(--surface-veil)] rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-[94%]"></div>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              className="border-[var(--border-strong)] bg-[var(--surface-veil)] ink hover:opacity-95 w-full"
              variant="outline"
            >
              <Monitor className="w-4 h-4 mr-2" />
              View Dashboard
            </Button>
          </div>
        </BackgroundGradient>

        {/* Team Collaboration Card */}
        <BackgroundGradient
          variant="aurora"
          className="p-6 sm:p-8"
          gradientSize="md"
          animate={true}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium ink">Team Features</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  JS
                </div>
                <div>
                  <p className="text-sm font-medium ink">John Smith</p>
                  <p className="text-xs ink-muted">Restaurant Manager</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  AD
                </div>
                <div>
                  <p className="text-sm font-medium ink">Alice Davis</p>
                  <p className="text-xs ink-muted">Head Chef</p>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <p className="text-xs ink-muted mb-3">5 active team members</p>
              <Button
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:opacity-95 w-full"
              >
                Invite Team
              </Button>
            </div>
          </div>
        </BackgroundGradient>
      </div>

      {/* Usage Examples Section */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold ink mb-4">Background Gradient Variants</h2>
        <p className="ink-muted mb-8 max-w-2xl mx-auto">
          Choose from multiple gradient variants that integrate seamlessly with HERA's universal
          design tokens.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
          {/* Variant Previews */}
          {[
            { variant: 'hera', label: 'HERA', description: 'Brand gradient' },
            { variant: 'enterprise', label: 'Enterprise', description: 'Professional' },
            { variant: 'aurora', label: 'Aurora', description: 'Nature-inspired' },
            { variant: 'rainbow', label: 'Rainbow', description: 'Vibrant spectrum' },
            { variant: 'default', label: 'Default', description: 'Classic blue-purple' }
          ].map(item => (
            <BackgroundGradient
              key={item.variant}
              variant={item.variant as any}
              className="p-4 text-center"
              gradientSize="sm"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/5 rounded-lg mx-auto mb-2"></div>
              <p className="text-sm font-medium ink">{item.label}</p>
              <p className="text-xs ink-muted">{item.description}</p>
            </BackgroundGradient>
          ))}
        </div>
      </div>
    </div>
  )
}

// Individual component exports for specific use cases
export function HERABusinessCard() {
  return (
    <BackgroundGradient variant="hera" className="p-6 sm:p-8 max-w-sm" animate={true}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-500 flex items-center justify-center">
          <span className="text-white text-xl font-bold">H</span>
        </div>

        <h3 className="text-lg font-bold ink mb-2">HERA Universal ERP</h3>

        <p className="text-sm ink-muted mb-4">
          The future of business management is here. Experience the power of universal architecture.
        </p>

        <Button className="bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-500 text-white hover:opacity-95 w-full">
          <Play className="w-4 h-4 mr-2" />
          Start Your Journey
        </Button>
      </div>
    </BackgroundGradient>
  )
}

export function EnterpriseStatsCard() {
  return (
    <BackgroundGradient variant="enterprise" className="p-6 max-w-sm" animate={true}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm ink-muted">Monthly Revenue</span>
          <BarChart3 className="w-4 h-4 ink" />
        </div>

        <div>
          <span className="text-2xl font-bold ink">$2.4M</span>
          <span className="text-sm text-emerald-500 ml-2">+18%</span>
        </div>

        <div className="w-full bg-[var(--surface-veil)] rounded-full h-2">
          <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full w-[72%]"></div>
        </div>

        <p className="text-xs ink-muted">72% of monthly target achieved</p>
      </div>
    </BackgroundGradient>
  )
}
