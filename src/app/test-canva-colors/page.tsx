'use client'

/**
 * WSAG Glassmorphism Animation Study - Test Page
 * Advanced glassmorphism with light animations, shadow effects, and blur studies
 * Based on liquidGL and modern glassmorphism patterns from GitHub 2024
 * Smart Code: HERA.UI.GLASSMORPHISM.WSAG.STUDY.v1
 */

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Scissors, 
  Users, 
  Calendar, 
  DollarSign, 
  Star, 
  TrendingUp,
  Sparkles,
  MousePointer,
  Layers,
  Zap,
  Eye
} from 'lucide-react'

export default function CanvaColorsGlassmorphismStudy() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track mouse movement for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        })
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      return () => container.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Animation toggle
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating)
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(255, 255, 255, 0.05) 25%,
            rgba(147, 51, 234, 0.02) 50%,
            rgba(236, 72, 153, 0.02) 75%,
            rgba(255, 255, 255, 0.1) 100%
          ),
          radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(147, 51, 234, 0.15) 0%, 
            rgba(236, 72, 153, 0.1) 25%,
            rgba(59, 130, 246, 0.05) 50%,
            transparent 70%
          ),
          linear-gradient(45deg, #f8fafc 0%, #e2e8f0 100%)
        `
      }}
    >
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Primary Light Orb */}
        <div 
          className={`absolute w-96 h-96 rounded-full transition-all duration-[3000ms] ease-in-out ${
            isAnimating ? 'animate-pulse' : ''
          }`}
          style={{
            background: `radial-gradient(circle, 
              rgba(147, 51, 234, 0.4) 0%, 
              rgba(147, 51, 234, 0.2) 30%, 
              rgba(147, 51, 234, 0.05) 60%, 
              transparent 100%
            )`,
            filter: 'blur(40px)',
            left: `${20 + mousePosition.x * 0.1}%`,
            top: `${10 + mousePosition.y * 0.05}%`,
            transform: `translate(-50%, -50%) scale(${1 + mousePosition.x * 0.002})`
          }}
        />
        
        {/* Secondary Light Orb */}
        <div 
          className={`absolute w-80 h-80 rounded-full transition-all duration-[4000ms] ease-in-out ${
            isAnimating ? 'animate-pulse' : ''
          }`}
          style={{
            background: `radial-gradient(circle, 
              rgba(236, 72, 153, 0.3) 0%, 
              rgba(236, 72, 153, 0.15) 30%, 
              rgba(236, 72, 153, 0.03) 60%, 
              transparent 100%
            )`,
            filter: 'blur(50px)',
            right: `${15 + mousePosition.x * 0.08}%`,
            top: `${60 + mousePosition.y * 0.03}%`,
            transform: `translate(50%, -50%) scale(${1 + mousePosition.y * 0.002})`
          }}
        />

        {/* Tertiary Light Orb */}
        <div 
          className={`absolute w-64 h-64 rounded-full transition-all duration-[5000ms] ease-in-out ${
            isAnimating ? 'animate-bounce' : ''
          }`}
          style={{
            background: `radial-gradient(circle, 
              rgba(59, 130, 246, 0.25) 0%, 
              rgba(59, 130, 246, 0.1) 40%, 
              rgba(59, 130, 246, 0.02) 70%, 
              transparent 100%
            )`,
            filter: 'blur(35px)',
            left: `${70 + mousePosition.y * 0.06}%`,
            bottom: `${20 + mousePosition.x * 0.04}%`,
            transform: `translate(-50%, 50%) scale(${1 + (mousePosition.x + mousePosition.y) * 0.001})`
          }}
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 p-6 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              onClick={toggleAnimation}
              className={`glassmorphism-button transition-all duration-500 ${
                isAnimating ? 'animate-pulse' : ''
              }`}
              style={{
                background: `rgba(255, 255, 255, 0.15)`,
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.12),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  0 1px 0 rgba(255, 255, 255, 0.1)
                `
              }}
            >
              <Zap className="w-4 h-4 mr-2" />
              {isAnimating ? 'Stop Animation' : 'Start Animation'}
            </Button>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            WSAG Glassmorphism Study
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Advanced glassmorphism with light animations, shadow effects, and interactive blur studies.
            Move your mouse to see real-time lighting effects.
          </p>
          
          {/* Interactive Info */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300"
            style={{
              background: `rgba(255, 255, 255, 0.1)`,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <MousePointer className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-slate-700">
              Mouse: {Math.round(mousePosition.x)}%, {Math.round(mousePosition.y)}%
            </span>
          </div>
        </div>

        {/* WSAG Glass Card Variants */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Light Refraction Study */}
          <Card 
            className="group transition-all duration-700 hover:-translate-y-2 cursor-pointer overflow-hidden"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%, 
                  rgba(255, 255, 255, 0.1) 50%,
                  rgba(255, 255, 255, 0.05) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(147, 51, 234, 0.15),
                0 4px 16px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                inset 0 -1px 0 rgba(255, 255, 255, 0.1)
              `,
              transform: `perspective(1000px) rotateX(${mousePosition.y * 0.02 - 1}deg) rotateY(${mousePosition.x * 0.02 - 1}deg)`
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div 
                  className="p-3 rounded-xl transition-all duration-500 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.2))`,
                    boxShadow: '0 4px 20px rgba(147, 51, 234, 0.3)'
                  }}
                >
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-800">Light Refraction</CardTitle>
                  <p className="text-sm text-slate-600">Advanced light bending</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  className="h-20 rounded-lg transition-all duration-1000"
                  style={{
                    background: `
                      linear-gradient(${mousePosition.x * 3.6}deg, 
                        rgba(147, 51, 234, 0.2) 0%,
                        rgba(236, 72, 153, 0.15) 33%,
                        rgba(59, 130, 246, 0.1) 66%,
                        rgba(147, 51, 234, 0.05) 100%
                      )
                    `,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                />
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="bg-white/20 backdrop-blur-sm border-white/30">
                    Refraction: {Math.round(mousePosition.x)}%
                  </Badge>
                  <span className="text-2xl font-bold text-slate-800">47°</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Shadow Depth Study */}
          <Card 
            className="group transition-all duration-700 hover:-translate-y-2 cursor-pointer"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.2) 0%, 
                  rgba(255, 255, 255, 0.08) 100%
                )
              `,
              backdropFilter: 'blur(25px) brightness(110%)',
              WebkitBackdropFilter: 'blur(25px) brightness(110%)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: `
                0 ${4 + mousePosition.y * 0.3}px ${16 + mousePosition.y * 0.8}px rgba(0, 0, 0, 0.15),
                0 ${2 + mousePosition.y * 0.1}px ${8 + mousePosition.y * 0.4}px rgba(147, 51, 234, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.3)
              `
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div 
                  className="p-3 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.2))`,
                    boxShadow: `0 ${2 + mousePosition.y * 0.1}px ${12 + mousePosition.y * 0.3}px rgba(59, 130, 246, 0.4)`
                  }}
                >
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-800">Shadow Depth</CardTitle>
                  <p className="text-sm text-slate-600">Dynamic shadow casting</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className="h-4 rounded-full transition-all duration-500"
                      style={{
                        background: `linear-gradient(90deg, 
                          rgba(59, 130, 246, 0.3 - i * 0.1) 0%, 
                          rgba(59, 130, 246, 0.1 - i * 0.05) 100%
                        )`,
                        boxShadow: `0 ${i * 2}px ${i * 8}px rgba(59, 130, 246, 0.2 - i * 0.05)`,
                        transform: `translateX(${mousePosition.x * 0.2}px)`
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="bg-white/20 backdrop-blur-sm border-white/30">
                    Depth: {Math.round(mousePosition.y)}%
                  </Badge>
                  <span className="text-2xl font-bold text-slate-800">3D</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Specular Highlights */}
          <Card 
            className="group transition-all duration-700 hover:-translate-y-2 cursor-pointer relative overflow-hidden"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.18) 0%, 
                  rgba(255, 255, 255, 0.05) 100%
                )
              `,
              backdropFilter: 'blur(30px) saturate(200%)',
              WebkitBackdropFilter: 'blur(30px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: `
                0 12px 40px rgba(236, 72, 153, 0.15),
                0 4px 20px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.35)
              `
            }}
          >
            {/* Animated Specular Highlight */}
            <div 
              className={`absolute inset-0 transition-all duration-1000 ${isAnimating ? 'opacity-100' : 'opacity-60'}`}
              style={{
                background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                  rgba(255, 255, 255, 0.4) 0%, 
                  rgba(255, 255, 255, 0.1) 30%, 
                  transparent 70%
                )`,
                pointerEvents: 'none'
              }}
            />
            
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-3">
                <div 
                  className="p-3 rounded-xl transition-all duration-500"
                  style={{
                    background: `linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(147, 51, 234, 0.3))`,
                    boxShadow: '0 6px 25px rgba(236, 72, 153, 0.4)'
                  }}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-800">Specular Light</CardTitle>
                  <p className="text-sm text-slate-600">Real-time highlights</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div 
                  className="h-16 rounded-lg border transition-all duration-500"
                  style={{
                    background: `
                      radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                        rgba(255, 255, 255, 0.3) 0%,
                        rgba(236, 72, 153, 0.2) 30%,
                        rgba(147, 51, 234, 0.1) 60%,
                        transparent 100%
                      )
                    `,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.5)`
                  }}
                />
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="bg-white/20 backdrop-blur-sm border-white/30">
                    Specular: Active
                  </Badge>
                  <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    ✨
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Salon Stats Section with Advanced Glassmorphism */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center text-slate-800">
            Salon Dashboard - Enhanced Glassmorphism
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Appointments', value: '24', icon: Calendar, color: 'purple' },
              { label: 'Customers', value: '156', icon: Users, color: 'pink' },
              { label: 'Revenue', value: 'AED 3,990', icon: DollarSign, color: 'blue' },
              { label: 'Rating', value: '4.9', icon: Star, color: 'amber' }
            ].map((stat, index) => (
              <Card 
                key={stat.label}
                className="group transition-all duration-500 hover:scale-105 cursor-pointer"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.22) 0%, 
                      rgba(255, 255, 255, 0.08) 100%
                    )
                  `,
                  backdropFilter: 'blur(18px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(160%)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: `
                    0 6px 24px rgba(${
                      stat.color === 'purple' ? '147, 51, 234' :
                      stat.color === 'pink' ? '236, 72, 153' :
                      stat.color === 'blue' ? '59, 130, 246' : '245, 158, 11'
                    }, 0.15),
                    0 2px 12px rgba(0, 0, 0, 0.08),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3)
                  `,
                  transform: `translateY(${Math.sin((Date.now() + index * 1000) * 0.001) * 2}px)`
                }}
              >
                <CardContent className="p-6 text-center">
                  <div 
                    className="p-3 rounded-full mx-auto mb-3 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, 
                        rgba(${
                          stat.color === 'purple' ? '147, 51, 234' :
                          stat.color === 'pink' ? '236, 72, 153' :
                          stat.color === 'blue' ? '59, 130, 246' : '245, 158, 11'
                        }, 0.3) 0%, 
                        rgba(${
                          stat.color === 'purple' ? '147, 51, 234' :
                          stat.color === 'pink' ? '236, 72, 153' :
                          stat.color === 'blue' ? '59, 130, 246' : '245, 158, 11'
                        }, 0.1) 100%
                      )`,
                      boxShadow: `0 4px 16px rgba(${
                        stat.color === 'purple' ? '147, 51, 234' :
                        stat.color === 'pink' ? '236, 72, 153' :
                        stat.color === 'blue' ? '59, 130, 246' : '245, 158, 11'
                      }, 0.3)`,
                      width: 'fit-content'
                    }}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <Card 
          className="max-w-4xl mx-auto transition-all duration-500"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%, 
                rgba(255, 255, 255, 0.05) 100%
              )
            `,
            backdropFilter: 'blur(25px) saturate(150%)',
            WebkitBackdropFilter: 'blur(25px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: `
              0 10px 35px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(255, 255, 255, 0.1)
            `
          }}
        >
          <CardHeader>
            <CardTitle className="text-slate-800 text-center">WSAG Implementation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Light Effects</h4>
                <ul className="space-y-1 text-slate-600">
                  <li>• Specular highlights with mouse tracking</li>
                  <li>• Dynamic refraction angles</li>
                  <li>• Real-time light orb positioning</li>
                  <li>• Animated specular intensity</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Shadow System</h4>
                <ul className="space-y-1 text-slate-600">
                  <li>• Multi-layer shadow casting</li>
                  <li>• Dynamic depth calculation</li>
                  <li>• Interactive shadow direction</li>
                  <li>• Perspective-based shadows</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Glass Properties</h4>
                <ul className="space-y-1 text-slate-600">
                  <li>• 20-30px blur radius</li>
                  <li>• 150-200% saturation</li>
                  <li>• Multi-gradient backgrounds</li>
                  <li>• Enhanced backdrop filters</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}