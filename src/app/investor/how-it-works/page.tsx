'use client';

import React from 'react';
import { 
  HeraNavigation, 
  HeraBreadcrumb 
} from '@/components/universal/ui/HeraNavigation';
import {
  HeraLayout,
  HeraGrid,
  HeraStack,
  HeraPageHeader,
  HeraSection,
  HeraCard,
  HeraWealthCard,
  HeraGlassCard,
  HeraMetric,
  HeraWealthMetric,
  HeraProgress,
  HeraThemeToggle
} from '@/components/universal/ui';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  BarChart3,
  Zap,
  Building2,
  Globe,
  Palette,
  Code,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <HeraNavigation />
      
      <HeraLayout variant="full-width" padding="lg">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Breadcrumb */}
          <HeraBreadcrumb items={[
            { name: 'Investor', href: '/investor' },
            { name: 'How It Works' }
          ]} />
          
          {/* Hero Section */}
          <HeraPageHeader
            title="HERA Universal ERP"
            subtitle="Run your entire business in one beautiful platform. From day one to enterprise scale."
            actions={
              <HeraStack direction="horizontal" gap="sm">
                <HeraThemeToggle />
                <Button variant="outline" asChild>
                  <Link href="/docs">Documentation</Link>
                </Button>
                <Button className="hera-button" asChild>
                  <Link href="/pwm">Try PWM Demo</Link>
                </Button>
              </HeraStack>
            }
          />

          {/* System Overview */}
          <HeraSection
            title="Universal Architecture"
            subtitle="Six tables that model any business - from healthcare to manufacturing to wealth management"
          >
            <HeraGrid cols={3} gap="lg">
              <HeraGlassCard animation="fade-in" animationDelay={100}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-hera-500 to-hera-cyan-500 rounded-lg flex items-center justify-center">
                      <Database className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">Core Tables</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Organizations, Entities, and Dynamic Data provide the foundation for any business model
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>• core_organizations</div>
                    <div>• core_entities</div>
                    <div>• core_dynamic_data</div>
                  </div>
                </div>
              </HeraGlassCard>

              <HeraGlassCard animation="fade-in" animationDelay={200}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-hera-emerald-500 to-hera-cyan-500 rounded-lg flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">Relationships</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Flexible relationship modeling connects any entity to any other entity
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <div>• core_relationships</div>
                  </div>
                </div>
              </HeraGlassCard>

              <HeraGlassCard animation="fade-in" animationDelay={300}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-hera-amber-500 to-hera-emerald-500 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">Transactions</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Universal transaction system handles sales, purchases, payments, and transfers
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>• universal_transactions</div>
                    <div>• universal_transaction_lines</div>
                  </div>
                </div>
              </HeraGlassCard>
            </HeraGrid>
          </HeraSection>

          {/* Live Demos */}
          <HeraSection
            title="Live Applications"
            subtitle="See HERA in action across different industries"
          >
            <HeraGrid cols={2} gap="lg">
              <HeraWealthCard interactive animation="slide-up" animationDelay={100}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-hera-400" />
                    <div>
                      <h3 className="text-xl font-semibold">Private Wealth Management</h3>
                      <p className="text-sm text-muted-foreground">Steve Jobs-inspired design</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete wealth management system with $250M Johnson Family Office demo data. 
                    Showcases portfolio tracking, risk analysis, and performance reporting.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button className="hera-button" size="sm" asChild>
                      <Link href="/pwm">Try Demo</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/pwm/demo">Test Data</Link>
                    </Button>
                  </div>
                </div>
              </HeraWealthCard>

              <HeraCard interactive animation="slide-up" animationDelay={200}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-hera-cyan-400" />
                    <div>
                      <h3 className="text-xl font-semibold">Restaurant Management</h3>
                      <p className="text-sm text-muted-foreground">Multi-location operations</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Full restaurant POS system with inventory management, staff scheduling, 
                    and analytics. Demonstrates HERA's flexibility for service industries.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/restaurant">View System</Link>
                    </Button>
                  </div>
                </div>
              </HeraCard>
            </HeraGrid>
          </HeraSection>

          {/* Universal Design System */}
          <HeraSection
            title="Universal Design System"
            subtitle="Premium components extracted from real applications"
          >
            <HeraGrid cols={4} gap="md">
              <HeraMetric
                title="Components"
                value={25}
                icon={<Code className="h-5 w-5" />}
                animation="slide-up"
                animationDelay={100}
              />
              
              <HeraMetric
                title="Animations"
                value={12}
                icon={<Zap className="h-5 w-5" />}
                animation="slide-up"
                animationDelay={200}
              />
              
              <HeraMetric
                title="Themes"
                value={2}
                format="number"
                suffix=" modes"
                icon={<Palette className="h-5 w-5" />}
                animation="slide-up"
                animationDelay={300}
              />
              
              <HeraMetric
                title="Ready to Use"
                value={100}
                format="percentage"
                icon={<TrendingUp className="h-5 w-5" />}
                trend="up"
                animation="slide-up"
                animationDelay={400}
              />
            </HeraGrid>

            <div className="flex justify-center pt-8">
              <Button className="hera-button" size="lg" asChild>
                <Link href="/design-system">Explore Design System</Link>
              </Button>
            </div>
          </HeraSection>

          {/* Quick Stats */}
          <HeraSection
            title="Platform Stats"
            subtitle="Current development progress and system capabilities"
          >
            <HeraGrid cols={3} gap="lg">
              <HeraCard animation="fade-in" animationDelay={100}>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Development Progress</h3>
                  <div className="space-y-3">
                    <HeraProgress
                      value={90}
                      label="Core Architecture"
                      showPercentage
                      variant="success"
                    />
                    <HeraProgress
                      value={85}
                      label="PWA Implementation"
                      showPercentage
                      variant="default"
                    />
                    <HeraProgress
                      value={75}
                      label="Design System"
                      showPercentage
                      variant="default"
                    />
                  </div>
                </div>
              </HeraCard>

              <HeraWealthMetric
                title="Demo Portfolio"
                value={250000000}
                change={{ percentage: 2.4, period: '24h' }}
                trend="up"
                animation="slide-up"
                animationDelay={200}
              />

              <HeraCard animation="fade-in" animationDelay={300}>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tech Stack</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between">
                      <span>Next.js</span>
                      <span className="text-hera-400">15.4.2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>React</span>
                      <span className="text-hera-400">19.1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TypeScript</span>
                      <span className="text-hera-400">5.8.3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tailwind CSS</span>
                      <span className="text-hera-400">3.x</span>
                    </div>
                  </div>
                </div>
              </HeraCard>
            </HeraGrid>
          </HeraSection>

          {/* Footer */}
          <div className="text-center py-12 border-t border-border">
            <p className="text-muted-foreground">
              HERA Universal ERP - Run your entire business in one beautiful platform
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Built with Next.js 15, React 19, and the HERA Universal Design System
            </p>
          </div>
        </div>
      </HeraLayout>
    </div>
  );
}