'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useUniversalProgressive } from '@/components/auth/UniversalProgressiveProvider'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Home, Settings, HelpCircle, LogOut } from 'lucide-react'

export function UniversalProgressiveSidebar() {
  const { moduleConfig, progressiveAuth } = useUniversalProgressive()
  const router = useRouter()

  const handleNavigation = (url: string) => {
    router.push(url)
  }

  const handleLogout = () => {
    progressiveAuth.logout()
    router.push('/')
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed left-0 top-0 h-screen w-16 bg-white border-r border-gray-200 shadow-sm z-50">
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-4 border-b border-gray-200">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavigation('/dashboard')}
                  className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm hover:scale-110 transition-transform"
                >
                  H
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>HERA Dashboard</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Module Icon */}
          <div className="p-4 border-b border-gray-200">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${moduleConfig.gradientColors} flex items-center justify-center shadow-sm`}>
                  <moduleConfig.icon className="w-5 h-5 text-white" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{moduleConfig.title}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-4">
            <nav className="space-y-2 px-2">
              {moduleConfig.navigationItems.map((item) => (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleNavigation(item.url)}
                      className={`
                        w-full h-12 rounded-lg flex items-center justify-center relative
                        hover:bg-gray-100 transition-colors group
                        ${item.isPrimary ? 'bg-gray-50' : ''}
                      `}
                    >
                      <item.icon className={`w-5 h-5 ${item.isPrimary ? `text-${moduleConfig.primaryColor}` : 'text-gray-600'} group-hover:text-${moduleConfig.primaryColor}`} />
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 h-4 w-auto min-w-4 text-xs px-1 bg-red-500 text-white"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                      {item.badge && (
                        <p className="text-xs text-gray-400 mt-1">{item.badge} items</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="p-2 border-t border-gray-200 space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleNavigation('/dashboard')}
                  className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Home className="w-5 h-5 text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Dashboard</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Help & Support</p>
              </TooltipContent>
            </Tooltip>

            {/* Workspace Status Indicator */}
            <div className="pt-2 border-t border-gray-200">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full h-8 rounded-lg flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${
                      progressiveAuth.isRegistered ? 'bg-green-500' :
                      progressiveAuth.isIdentified ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div>
                    <p className="font-medium">
                      {progressiveAuth.isRegistered ? 'Registered Account' :
                       progressiveAuth.isIdentified ? 'Email Verified' :
                       'Anonymous User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {progressiveAuth.daysRemaining > 0 && 
                        `${progressiveAuth.daysRemaining} days remaining`
                      }
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Logout (only for registered users) */}
            {progressiveAuth.isRegistered && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="w-full h-10 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}