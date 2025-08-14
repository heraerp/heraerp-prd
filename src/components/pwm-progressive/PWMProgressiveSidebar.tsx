'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield,
  Crown,
  BarChart3,
  Users,
  PieChart,
  TrendingUp,
  AlertTriangle,
  Brain,
  Settings,
  Lock,
  Activity,
  Target,
  Award,
  Briefcase,
  Building,
  Globe,
  FileText,
  Calculator,
  Zap,
  Eye,
  Sparkles,
  Layers,
  Home,
  ArrowLeft
} from 'lucide-react'

interface PWMProgressiveSidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

export function PWMProgressiveSidebar({ activeModule, onModuleChange }: PWMProgressiveSidebarProps) {
  const pathname = usePathname()

  const modules = [
    {
      id: 'dashboard',
      name: 'PWM Dashboard',
      icon: Shield,
      description: 'Private Wealth Overview',
      badge: 'UHNW'
    },
    {
      id: 'clients',
      name: 'Client Portfolio',
      icon: Crown,
      description: 'High-Net-Worth Clients',
      badge: '3'
    },
    {
      id: 'portfolio',
      name: 'Portfolio Analytics',
      icon: PieChart,
      description: 'Asset Allocation & Performance',
      badge: '$3.8B'
    },
    {
      id: 'performance',
      name: 'Performance Reports',
      icon: TrendingUp,
      description: 'Returns & Benchmarking',
      badge: '+11.2%'
    },
    {
      id: 'compliance',
      name: 'Compliance & Risk',
      icon: AlertTriangle,
      description: 'Regulatory & Risk Management',
      badge: 'Clean'
    },
    {
      id: 'analytics',
      name: 'AI Intelligence',
      icon: Brain,
      description: 'Predictive Analytics & Insights',
      badge: 'AI'
    }
  ]

  const quickActions = [
    { name: 'New Client Onboarding', icon: Users, urgent: false },
    { name: 'Portfolio Rebalancing', icon: Target, urgent: true },
    { name: 'Compliance Review', icon: FileText, urgent: false },
    { name: 'Performance Report', icon: BarChart3, urgent: false }
  ]

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Progressive PWM
          </Badge>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Private Wealth</h2>
          <p className="text-sm text-slate-600">Ultra-High Net Worth Management</p>
        </div>
      </div>

      {/* Navigation Modules */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Wealth Management Modules
          </h3>
          
          {modules.map((module) => {
            const Icon = module.icon
            const isActive = activeModule === module.id
            
            return (
              <Button
                key={module.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start h-auto p-4 ${
                  isActive 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
                onClick={() => onModuleChange(module.id)}
              >
                <div className="flex items-center w-full">
                  <div className={`p-2 rounded-lg mr-3 ${
                    isActive 
                      ? 'bg-blue-500' 
                      : 'bg-slate-100'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      isActive ? 'text-white' : 'text-slate-600'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-white' : 'text-slate-900'
                      }`}>
                        {module.name}
                      </p>
                      <Badge 
                        variant={isActive ? "secondary" : "outline"}
                        className={`text-xs ${
                          isActive 
                            ? 'bg-blue-400 text-white' 
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {module.badge}
                      </Badge>
                    </div>
                    <p className={`text-xs ${
                      isActive ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {module.description}
                    </p>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <div
                  key={index}
                  className="flex items-center p-3 rounded-lg hover:bg-slate-50 cursor-pointer group"
                >
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <Icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-slate-900">{action.name}</p>
                  </div>
                  {action.urgent && (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Market Status */}
        <div className="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-900">Market Status</h4>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">S&P 500</span>
              <span className="text-emerald-600 font-medium">+0.85%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">NASDAQ</span>
              <span className="text-emerald-600 font-medium">+1.12%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">VIX</span>
              <span className="text-red-600 font-medium">-2.3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>HERA PWM Progressive v2.0</span>
          <div className="flex items-center">
            <Lock className="h-3 w-3 mr-1" />
            <span>Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  )
}