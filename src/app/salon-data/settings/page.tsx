'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useRef, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import {
  Settings,
  Shield,
  Users,
  Building2,
  Code,
  Database,
  Bell,
  Key,
  Globe,
  Sparkles,
  CreditCard,
  Calendar,
  FileText,
  ArrowLeft,
  ChevronRight
} from 'lucide-react'

const settingSections = [
  {
    title: 'Business Configuration',
    items: [
      {
        name: 'Universal Configuration Rules',
        description: 'Manage salon business logic without code changes',
        icon: Code,
        href: '/salon-data/settings/ucr',
        color: 'text-champagne-500'
      },
      {
        name: 'Organization Settings',
        description: 'Salon details and preferences',
        icon: Building2,
        href: '/salon-data/settings/organization',
        color: 'text-sage-500'
      },
      {
        name: 'Staff Management',
        description: 'Manage stylists and permissions',
        icon: Users,
        href: '/salon-data/settings/staff',
        color: 'text-dusty-rose-500'
      }
    ]
  },
  {
    title: 'Salon Operations',
    items: [
      {
        name: 'Service Menu',
        description: 'Hair and beauty services configuration',
        icon: Sparkles,
        href: '/salon-data/settings/services',
        color: 'text-sage-600'
      },
      {
        name: 'Appointment Rules',
        description: 'Booking and scheduling settings',
        icon: Calendar,
        href: '/salon-data/settings/appointments',
        color: 'text-dusty-rose-600'
      },
      {
        name: 'Pricing & Promotions',
        description: 'Service pricing and special offers',
        icon: CreditCard,
        href: '/salon-data/settings/pricing',
        color: 'text-champagne-600'
      }
    ]
  },
  {
    title: 'System Configuration',
    items: [
      {
        name: 'Security',
        description: 'Authentication and access control',
        icon: Shield,
        href: '/salon-data/settings/security',
        color: 'text-red-500'
      },
      {
        name: 'Notifications',
        description: 'Appointment reminders and alerts',
        icon: Bell,
        href: '/salon-data/settings/notifications',
        color: 'text-yellow-500'
      },
      {
        name: 'Reports & Analytics',
        description: 'Performance tracking and insights',
        icon: FileText,
        href: '/salon-data/settings/reports',
        color: 'text-indigo-500'
      }
    ]
  }
]

export default function SalonDataSettingsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setMousePosition({ x, y })
      }
    }

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gray-900 relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(0, 0, 0, 0.95) 0%, 
            rgba(17, 24, 39, 0.95) 25%,
            rgba(31, 41, 55, 0.9) 50%,
            rgba(17, 24, 39, 0.95) 75%,
            rgba(0, 0, 0, 0.95) 100%
          ),
          radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(147, 51, 234, 0.08) 0%, 
            rgba(59, 130, 246, 0.05) 25%,
            rgba(16, 185, 129, 0.03) 50%,
            transparent 70%
          ),
          #0a0a0a
        `
      }}
    >
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full transition-all duration-[3000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)`,
            left: '10%',
            top: '20%',
            animation: 'float 10s ease-in-out infinite',
            filter: 'blur(40px)'
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full transition-all duration-[4000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)`,
            right: '15%',
            bottom: '30%',
            animation: 'float 12s ease-in-out infinite reverse',
            filter: 'blur(40px)'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/salon-data"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Salon Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure your Hair Talkz salon settings and preferences
            </p>
          </div>
        </div>

        {/* Setting Sections */}
        {settingSections.map(section => (
          <div key={section.title} className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground/90">{section.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map(item => {
                const gradientColors = {
                  'text-champagne-500': 'from-amber-400 to-orange-600',
                  'text-sage-500': 'from-green-400 to-emerald-600',
                  'text-dusty-rose-500': 'from-pink-400 to-rose-600',
                  'text-sage-600': 'from-teal-400 to-cyan-600',
                  'text-dusty-rose-600': 'from-rose-400 to-pink-600',
                  'text-champagne-600': 'from-yellow-400 to-amber-600',
                  'text-red-500': 'from-red-400 to-red-600',
                  'text-yellow-500': 'from-yellow-400 to-yellow-600',
                  'text-indigo-500': 'from-indigo-400 to-purple-600'
                }
                const gradient =
                  gradientColors[item.color as keyof typeof gradientColors] ||
                  'from-purple-400 to-pink-600'

                return (
                  <Link key={item.name} href={item.href} className="group">
                    <div className="relative h-full bg-background/5 backdrop-blur-lg border border-border/10 rounded-2xl p-6 hover:bg-background/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-border/20 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
                        >
                          <item.icon className="h-6 w-6 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground/90 mb-1 group-hover:text-foreground transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-sm text-muted-foreground group-hover:text-gray-300 transition-colors">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground 
                        opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* UCR Highlight Card */}
        <div className="relative mt-12">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-2xl blur-xl" />
          <div className="relative bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-blue-900/50 backdrop-blur-lg border border-border/20 rounded-2xl p-8 hover:border-white/30 transition-colors">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center shadow-2xl">
                <Code className="h-8 w-8 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Revolutionary: Universal Configuration Rules (UCR) for Salons
                </h3>
                <p className="text-gray-300 mb-4 leading-relaxed">
                  Change salon business logic without touching code. Configure service pricing,
                  appointment rules, staff commissions, loyalty programs, and more through a visual
                  interface tailored for beauty businesses.
                </p>
                <Link
                  href="/salon-data/settings/ucr"
                  className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors group"
                >
                  Manage Salon UCR Rules
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Add animation styles */}
        <style jsx global>{`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0) translateX(0);
            }
            33% {
              transform: translateY(-20px) translateX(10px);
            }
            66% {
              transform: translateY(10px) translateX(-10px);
            }
          }
        `}</style>
      </div>
    </div>
  )
}
