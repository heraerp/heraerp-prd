'use client'

import React, { useState } from 'react'
import { cn } from '@/src/lib/utils'
import {
  Diamond,
  PieChart,
  Brain,
  Zap,
  Settings,
  Shield,
  ChevronDown,
  Bell,
  User
} from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'

interface PWMNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  notifications?: number
}

export function PWMNavigation({ activeTab, onTabChange, notifications = 0 }: PWMNavigationProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const tabs = [
    {
      id: 'wealth',
      label: 'Wealth',
      icon: Diamond,
      description: 'Portfolio overview'
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: PieChart,
      description: 'Asset allocation'
    },
    {
      id: 'ai',
      label: 'AI',
      icon: Brain,
      description: 'Intelligence center'
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: Zap,
      description: 'Quick trades'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Preferences'
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      description: 'Data encryption'
    }
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30">
                <Diamond className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">HERA Wealth</h1>
                <p className="text-xs text-muted-foreground">Private Client Portal</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-background/50 rounded-2xl border border-slate-800">
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      'relative flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200',
                      'hover:bg-muted/50',
                      isActive
                        ? 'bg-muted text-foreground shadow-lg'
                        : 'text-muted-foreground hover:text-slate-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{tab.label}</span>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                  >
                    {notifications > 9 ? '9+' : notifications}
                  </Badge>
                )}
              </button>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-foreground" />
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-background border border-border rounded-xl shadow-xl p-4">
                    <div className="text-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center mx-auto mb-2">
                        <User className="h-6 w-6 text-foreground" />
                      </div>
                      <p className="text-foreground font-medium">Valued Client</p>
                      <p className="text-xs text-muted-foreground">Private Wealth Management</p>
                    </div>
                    <Button variant="outline" className="w-full text-slate-300 border-border">
                      Account Settings
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800">
        <div className="flex items-center justify-around py-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200',
                  'touch-target', // Minimum 44px touch target
                  isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{tab.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 h-1 w-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30">
              <Diamond className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">HERA Wealth</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors touch-target">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                >
                  {notifications > 9 ? '9+' : notifications}
                </Badge>
              )}
            </button>

            {/* Profile */}
            <button className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center touch-target">
              <User className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
