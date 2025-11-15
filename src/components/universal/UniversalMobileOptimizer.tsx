'use client'

/**
 * Universal Mobile Optimizer Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.MOBILE_OPTIMIZER.v1
 * 
 * Mobile-first responsive optimization system for Universal CRUD components:
 * - Adaptive layout switching (mobile/tablet/desktop)
 * - Touch-friendly interaction patterns
 * - Gesture recognition and swipe actions
 * - Responsive data visualization
 * - Mobile navigation patterns
 * - Accessibility and performance optimization
 * - Device-specific UI adaptations
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Grid,
  List,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  MoreVertical,
  Eye,
  Settings,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Share,
  Star,
  Heart,
  Bookmark
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export interface DeviceType {
  type: 'mobile' | 'tablet' | 'desktop'
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  touchEnabled: boolean
}

export interface MobileOptimization {
  enabled: boolean
  layout_mode: 'adaptive' | 'mobile_first' | 'desktop_first'
  touch_target_size: number // minimum 44px for iOS
  gesture_enabled: boolean
  swipe_actions: boolean
  pull_to_refresh: boolean
  infinite_scroll: boolean
  compact_mode: boolean
  bottom_navigation: boolean
  floating_actions: boolean
}

export interface ResponsiveBreakpoints {
  mobile: { min: number; max: number }
  tablet: { min: number; max: number }
  desktop: { min: number; max: number }
  xl: { min: number; max: number }
}

interface UniversalMobileOptimizerProps {
  children: React.ReactNode
  system: 'entities' | 'transactions' | 'relationships' | 'workflows'
  optimization?: Partial<MobileOptimization>
  customBreakpoints?: Partial<ResponsiveBreakpoints>
  onDeviceChange?: (device: DeviceType) => void
  onOptimizationChange?: (optimization: MobileOptimization) => void
  className?: string
}

// Default responsive breakpoints (mobile-first)
const defaultBreakpoints: ResponsiveBreakpoints = {
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: 1439 },
  xl: { min: 1440, max: 9999 }
}

// Default mobile optimization settings
const defaultOptimization: MobileOptimization = {
  enabled: true,
  layout_mode: 'adaptive',
  touch_target_size: 44,
  gesture_enabled: true,
  swipe_actions: true,
  pull_to_refresh: true,
  infinite_scroll: false,
  compact_mode: false,
  bottom_navigation: true,
  floating_actions: true
}

export function UniversalMobileOptimizer({
  children,
  system,
  optimization: initialOptimization = {},
  customBreakpoints = {},
  onDeviceChange,
  onOptimizationChange,
  className = ''
}: UniversalMobileOptimizerProps) {
  const [optimization, setOptimization] = useState<MobileOptimization>({
    ...defaultOptimization,
    ...initialOptimization
  })
  
  const [device, setDevice] = useState<DeviceType>({
    type: 'desktop',
    width: 1200,
    height: 800,
    orientation: 'landscape',
    touchEnabled: false
  })
  
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'grid' | 'list' | 'cards'>('grid')
  
  const breakpoints = useMemo(() => ({
    ...defaultBreakpoints,
    ...customBreakpoints
  }), [customBreakpoints])

  // Detect device type and capabilities
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const orientation = width > height ? 'landscape' : 'portrait'
      const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      let type: DeviceType['type'] = 'desktop'
      if (width <= breakpoints.mobile.max) {
        type = 'mobile'
      } else if (width <= breakpoints.tablet.max) {
        type = 'tablet'
      }

      const newDevice: DeviceType = {
        type,
        width,
        height,
        orientation,
        touchEnabled
      }

      setDevice(newDevice)
      onDeviceChange?.(newDevice)
    }

    detectDevice()
    window.addEventListener('resize', detectDevice)
    window.addEventListener('orientationchange', detectDevice)

    return () => {
      window.removeEventListener('resize', detectDevice)
      window.removeEventListener('orientationchange', detectDevice)
    }
  }, [breakpoints, onDeviceChange])

  // Update optimization settings
  const updateOptimization = useCallback((updates: Partial<MobileOptimization>) => {
    const newOptimization = { ...optimization, ...updates }
    setOptimization(newOptimization)
    onOptimizationChange?.(newOptimization)
  }, [optimization, onOptimizationChange])

  // Get responsive classes based on device
  const getResponsiveClasses = useCallback((mobileClass: string, tabletClass?: string, desktopClass?: string) => {
    if (device.type === 'mobile') return mobileClass
    if (device.type === 'tablet') return tabletClass || mobileClass
    return desktopClass || tabletClass || mobileClass
  }, [device.type])

  // Get touch target size style
  const getTouchTargetStyle = useCallback((size?: number) => {
    if (!device.touchEnabled || !optimization.enabled) return {}
    
    const targetSize = size || optimization.touch_target_size
    return {
      minHeight: `${targetSize}px`,
      minWidth: `${targetSize}px`
    }
  }, [device.touchEnabled, optimization.enabled, optimization.touch_target_size])

  // System-specific mobile navigation items
  const getNavigationItems = useCallback(() => {
    const baseItems = [
      { id: 'home', label: 'Home', icon: Grid },
      { id: 'search', label: 'Search', icon: Search },
      { id: 'favorites', label: 'Favorites', icon: Star },
      { id: 'settings', label: 'Settings', icon: Settings }
    ]

    const systemItems = {
      entities: [
        { id: 'customers', label: 'Customers', icon: User },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'vendors', label: 'Vendors', icon: Building }
      ],
      transactions: [
        { id: 'sales', label: 'Sales', icon: Target },
        { id: 'purchases', label: 'Purchases', icon: FileText },
        { id: 'journals', label: 'Journals', icon: BookOpen }
      ],
      relationships: [
        { id: 'graph', label: 'Graph', icon: GitBranch },
        { id: 'hierarchy', label: 'Tree', icon: Grid3X3 },
        { id: 'network', label: 'Network', icon: Network }
      ],
      workflows: [
        { id: 'designer', label: 'Designer', icon: Settings },
        { id: 'executions', label: 'Executions', icon: Activity },
        { id: 'tasks', label: 'Tasks', icon: CheckCircle }
      ]
    }

    return [...baseItems, ...(systemItems[system] || [])]
  }, [system])

  // Mobile-specific event handlers
  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (!optimization.swipe_actions) return

    switch (direction) {
      case 'left':
        // Navigate to next view or close panels
        setMobileMenuOpen(false)
        break
      case 'right':
        // Navigate to previous view or open menu
        setMobileMenuOpen(true)
        break
      case 'up':
        // Show more content or expand
        break
      case 'down':
        // Refresh or collapse
        if (optimization.pull_to_refresh) {
          // Trigger refresh
        }
        break
    }
  }, [optimization.swipe_actions, optimization.pull_to_refresh])

  // Responsive layout wrapper
  const ResponsiveLayout = ({ children }: { children: React.ReactNode }) => (
    <div 
      className={cn(
        "w-full h-full transition-all duration-300",
        optimization.enabled && device.type === 'mobile' && [
          "mobile-optimized",
          optimization.compact_mode && "compact-mode"
        ],
        getResponsiveClasses(
          "flex flex-col", // Mobile: vertical stack
          "flex flex-col lg:flex-row", // Tablet: adaptive
          "flex flex-row" // Desktop: horizontal
        )
      )}
    >
      {children}
    </div>
  )

  // Mobile bottom navigation
  const MobileBottomNav = () => {
    if (!optimization.bottom_navigation || device.type !== 'mobile') return null

    const navItems = getNavigationItems().slice(0, 5) // Limit to 5 items for mobile

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className="flex flex-col items-center justify-center p-2 text-slate-600 hover:text-blue-600 transition-colors"
                style={getTouchTargetStyle()}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Mobile floating action button
  const MobileFloatingAction = () => {
    if (!optimization.floating_actions || device.type !== 'mobile') return null

    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          className="w-14 h-14 rounded-full shadow-lg"
          style={getTouchTargetStyle(56)}
        >
          <Plus size={24} />
        </Button>
      </div>
    )
  }

  // Mobile header with hamburger menu
  const MobileHeader = () => {
    if (device.type !== 'mobile') return null

    return (
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
            style={getTouchTargetStyle()}
          >
            <Menu size={20} />
          </Button>
          
          <h1 className="font-semibold text-lg capitalize">{system}</h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              style={getTouchTargetStyle()}
            >
              <Search size={20} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOptimizationPanel(true)}
              style={getTouchTargetStyle()}
            >
              <Settings size={20} />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Mobile slide-out menu
  const MobileMenu = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Grid size={20} />
            Universal CRUD
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-2">
          {getNavigationItems().map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start"
                style={getTouchTargetStyle()}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={18} className="mr-3" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )

  // Mobile optimization panel
  const OptimizationPanel = () => (
    <Sheet open={showOptimizationPanel} onOpenChange={setShowOptimizationPanel}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Smartphone size={20} />
            Mobile Optimization
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Device Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Device</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                {device.type === 'mobile' && <Smartphone size={16} />}
                {device.type === 'tablet' && <Tablet size={16} />}
                {device.type === 'desktop' && <Monitor size={16} />}
                <span className="text-sm font-medium capitalize">{device.type}</span>
              </div>
              <div className="text-xs text-slate-600">
                {device.width} x {device.height} • {device.orientation}
              </div>
              <div className="text-xs text-slate-600">
                Touch: {device.touchEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </CardContent>
          </Card>

          {/* Optimization Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Mobile Optimization</label>
              <Switch 
                checked={optimization.enabled}
                onCheckedChange={(enabled) => updateOptimization({ enabled })}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Touch Targets</label>
              <Switch 
                checked={optimization.touch_target_size >= 44}
                onCheckedChange={(enabled) => updateOptimization({ 
                  touch_target_size: enabled ? 44 : 32 
                })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Touch Size: {optimization.touch_target_size}px</label>
              <Slider
                value={[optimization.touch_target_size]}
                onValueChange={([size]) => updateOptimization({ touch_target_size: size })}
                min={32}
                max={64}
                step={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Swipe Actions</label>
              <Switch 
                checked={optimization.swipe_actions}
                onCheckedChange={(swipe_actions) => updateOptimization({ swipe_actions })}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Pull to Refresh</label>
              <Switch 
                checked={optimization.pull_to_refresh}
                onCheckedChange={(pull_to_refresh) => updateOptimization({ pull_to_refresh })}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Bottom Navigation</label>
              <Switch 
                checked={optimization.bottom_navigation}
                onCheckedChange={(bottom_navigation) => updateOptimization({ bottom_navigation })}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Floating Actions</label>
              <Switch 
                checked={optimization.floating_actions}
                onCheckedChange={(floating_actions) => updateOptimization({ floating_actions })}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Compact Mode</label>
              <Switch 
                checked={optimization.compact_mode}
                onCheckedChange={(compact_mode) => updateOptimization({ compact_mode })}
              />
            </div>
          </div>

          {/* Layout Mode */}
          <div>
            <label className="text-sm font-medium mb-2 block">Layout Mode</label>
            <Select 
              value={optimization.layout_mode} 
              onValueChange={(layout_mode: MobileOptimization['layout_mode']) => 
                updateOptimization({ layout_mode })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adaptive">Adaptive</SelectItem>
                <SelectItem value="mobile_first">Mobile First</SelectItem>
                <SelectItem value="desktop_first">Desktop First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div>
            <label className="text-sm font-medium mb-2 block">View Mode</label>
            <div className="flex items-center gap-1">
              <Button
                variant={currentView === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('grid')}
                style={getTouchTargetStyle()}
              >
                <Grid size={16} />
              </Button>
              <Button
                variant={currentView === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('list')}
                style={getTouchTargetStyle()}
              >
                <List size={16} />
              </Button>
              <Button
                variant={currentView === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('cards')}
                style={getTouchTargetStyle()}
              >
                <Card size={16} />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <div className={cn("w-full h-full", className)}>
      {/* Mobile Header */}
      <MobileHeader />

      {/* Responsive Layout */}
      <ResponsiveLayout>
        {/* Main Content */}
        <div 
          className={cn(
            "flex-1 overflow-hidden",
            optimization.enabled && device.type === 'mobile' && "pb-16" // Space for bottom nav
          )}
          style={{
            // Add CSS custom properties for responsive design
            '--touch-target-size': `${optimization.touch_target_size}px`,
            '--device-type': device.type,
            '--orientation': device.orientation
          } as React.CSSProperties}
        >
          {children}
        </div>
      </ResponsiveLayout>

      {/* Mobile Navigation Components */}
      <MobileMenu />
      <MobileBottomNav />
      <MobileFloatingAction />
      <OptimizationPanel />

      {/* CSS for mobile optimizations */}
      <style jsx>{`
        .mobile-optimized {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        
        .mobile-optimized * {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        .compact-mode {
          --space-factor: 0.75;
        }
        
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        @media (max-width: 768px) {
          .mobile-optimized .card {
            margin: 0.5rem;
            border-radius: 0.75rem;
          }
          
          .mobile-optimized .button {
            min-height: var(--touch-target-size);
            min-width: var(--touch-target-size);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}

// Higher-order component for easy integration
export function withMobileOptimization<P extends object>(
  Component: React.ComponentType<P>,
  system: 'entities' | 'transactions' | 'relationships' | 'workflows'
) {
  return function MobileOptimizedComponent(props: P) {
    return (
      <UniversalMobileOptimizer system={system}>
        <Component {...props} />
      </UniversalMobileOptimizer>
    )
  }
}

export default UniversalMobileOptimizer