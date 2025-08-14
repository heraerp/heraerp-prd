'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Rocket, 
  ArrowRight, 
  X, 
  Play,
  Zap,
  Clock,
  Star
} from 'lucide-react'

interface DemoBannerProps {
  appName: string
  industry: string
  demoData: string
  onGetStarted?: () => void
}

export function DemoBanner({ appName, industry, demoData, onGetStarted }: DemoBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Play className="w-3 h-3 mr-1" />
              Demo Mode
            </Badge>
            
            <div className="hidden sm:block">
              <p className="text-sm">
                <span className="font-medium">You're exploring:</span> {appName} for {industry}
              </p>
              <p className="text-xs text-blue-100">
                Demo data: {demoData} • No real data is stored
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Success indicators */}
            <div className="hidden md:flex items-center gap-4 text-xs text-blue-100">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>14-day deploy</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                <span>92% success</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>No setup fee</span>
              </div>
            </div>

            <Button 
              size="sm" 
              className="bg-white text-blue-600 hover:bg-gray-50"
              onClick={onGetStarted}
            >
              <Rocket className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
            </Button>

            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile info */}
        <div className="sm:hidden pb-3">
          <p className="text-sm">
            <span className="font-medium">Exploring:</span> {appName}
          </p>
          <p className="text-xs text-blue-100">
            {demoData} • Demo data only
          </p>
        </div>
      </div>
    </div>
  )
}

// Floating action button for conversion
export function FloatingActionButton({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        size="lg"
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-2xl rounded-full px-6 py-3"
        onClick={onGetStarted}
      >
        <Rocket className="w-5 h-5 mr-2" />
        Deploy This App
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}