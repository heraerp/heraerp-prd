'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Cookie,
  Shield,
  BarChart3,
  Megaphone,
  Check,
  Settings,
  ChevronRight,
  Lock,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false
  })

  useEffect(() => {
    // Check if consent has been given
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      // Small delay for better UX
      setTimeout(() => {
        setVisible(true)
        setIsAnimating(true)
      }, 1000)
    }
  }, [])

  const handleAcceptAll = () => {
    const allPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true
    }
    localStorage.setItem(
      'cookieConsent',
      JSON.stringify({
        preferences: allPreferences,
        timestamp: new Date().toISOString(),
        type: 'all'
      })
    )
    setIsAnimating(false)
    setTimeout(() => setVisible(false), 300)
  }

  const handleRejectNonEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    }
    localStorage.setItem(
      'cookieConsent',
      JSON.stringify({
        preferences: essentialOnly,
        timestamp: new Date().toISOString(),
        type: 'essential'
      })
    )
    setIsAnimating(false)
    setTimeout(() => setVisible(false), 300)
  }

  const handleSavePreferences = () => {
    localStorage.setItem(
      'cookieConsent',
      JSON.stringify({
        preferences,
        timestamp: new Date().toISOString(),
        type: 'custom'
      })
    )
    setShowPreferences(false)
    setIsAnimating(false)
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible) return null

  return (
    <>
      {/* Main Cookie Banner */}
      <div
        className={cn(
          'fixed bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-auto md:max-w-md lg:max-w-lg z-50 transition-all duration-500 ease-out',
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        )}
      >
        {/* Glassmorphism Container */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* Backdrop Blur Background */}
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl" />

          {/* Gradient Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20" />

          {/* Glow Effect */}
          <div className="absolute -inset-px bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-2xl blur-lg" />

          {/* Content */}
          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Cookie className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Cookie Preferences</h3>
                  <p className="ink-muted text-xs mt-0.5">Your privacy is important to us</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAnimating(false)
                  setTimeout(() => setVisible(false), 300)
                }}
                className="ink-muted hover:text-white transition-colors p-1"
                aria-label="Close cookie banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              We use cookies to enhance your experience, provide essential functionality, analyze
              traffic, and personalize content. You control your data preferences.{' '}
              <Link
                href="/policy"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors inline-flex items-center gap-1"
              >
                Privacy & Cookie Policy
                <ChevronRight className="w-3 h-3" />
              </Link>
            </p>

            {/* Cookie Categories Preview */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-white/5 backdrop-blur rounded-lg p-2.5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">Essential</p>
                    <p className="text-xs text-green-400">Always Active</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur rounded-lg p-2.5 border border-white/10">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">Analytics</p>
                    <p className="text-xs ink-muted">Optional</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur rounded-lg p-2.5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-purple-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">Marketing</p>
                    <p className="text-xs ink-muted">Optional</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur rounded-lg p-2.5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">Functional</p>
                    <p className="text-xs ink-muted">Optional</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Accept All - Primary CTA */}
              <button
                onClick={handleAcceptAll}
                className="group relative flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/25 hover:scale-[1.02]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  Accept All
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Reject Non-Essential */}
              <button
                onClick={handleRejectNonEssential}
                className="flex-1 bg-white/10 backdrop-blur text-white px-4 py-2.5 rounded-xl font-medium text-sm border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-200"
              >
                Essential Only
              </button>

              {/* Manage Preferences */}
              <button
                onClick={() => setShowPreferences(true)}
                className="group flex-1 bg-slate-800/50 backdrop-blur text-slate-300 px-4 py-2.5 rounded-xl font-medium text-sm border border-slate-700/50 hover:bg-slate-800/70 hover:text-white hover:border-slate-600/50 transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  Customize
                </span>
              </button>
            </div>

            {/* Trust Badge */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-xs ink-muted">GDPR Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs ink-muted">Your Privacy Matters</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPreferences(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10" />

            {/* Content */}
            <div className="relative p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Cookie Preferences Center</h2>
                  <p className="ink-muted">
                    When you visit our website, we may store or retrieve information on your
                    browser, mostly in the form of cookies. Control your personal Cookie Services
                    here.
                  </p>
                </div>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="ink-muted hover:text-white transition-colors p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cookie Categories */}
              <div className="space-y-4 mb-8">
                {/* Essential Cookies */}
                <div className="bg-white/5 backdrop-blur rounded-xl p-5 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center">
                        <Lock className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Essential Cookies</h3>
                        <span className="text-xs text-green-400 font-medium">Always Active</span>
                      </div>
                    </div>
                    <div className="w-12 h-6 bg-green-600/30 rounded-full relative cursor-not-allowed">
                      <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-green-500 rounded-full" />
                    </div>
                  </div>
                  <p className="text-sm ink-muted leading-relaxed">
                    These cookies are necessary for the website to function and cannot be switched
                    off. They are usually set in response to actions you take, such as setting
                    privacy preferences, logging in, or filling forms.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-md ink-muted border border-white/10">
                      Session Management
                    </span>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-md ink-muted border border-white/10">
                      Security Tokens
                    </span>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-md ink-muted border border-white/10">
                      Authentication
                    </span>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="bg-white/5 backdrop-blur rounded-xl p-5 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Analytics Cookies</h3>
                        <span className="text-xs ink-muted font-medium">Optional</span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))
                      }
                      className={cn(
                        'w-12 h-6 rounded-full relative transition-all duration-200',
                        preferences.analytics ? 'bg-blue-600' : 'bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200',
                          preferences.analytics ? 'translate-x-6' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-sm ink-muted leading-relaxed">
                    These cookies help us understand how visitors interact with our website by
                    collecting and reporting information anonymously. This helps us improve our
                    services.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-md ink-muted border border-white/10">
                      Google Analytics
                    </span>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-md ink-muted border border-white/10">
                      Performance Metrics
                    </span>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-md ink-muted border border-white/10">
                      User Behavior
                    </span>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="bg-white/5 backdrop-blur rounded-xl p-5 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                        <Megaphone className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Marketing Cookies</h3>
                        <span className="text-xs ink-muted font-medium">Optional</span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setPreferences(prev => ({ ...prev, marketing: !prev.marketing }))
                      }
                      className={cn(
                        'w-12 h-6 rounded-full relative transition-all duration-200',
                        preferences.marketing ? 'bg-purple-600' : 'bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200',
                          preferences.marketing ? 'translate-x-6' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-sm ink-muted leading-relaxed">
                    These cookies are used to deliver advertisements more relevant to you and your
                    interests. They remember that you have visited our website and share this
                    information with advertisers.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-md ink-muted border border-white/10">
                      Targeted Ads
                    </span>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-md ink-muted border border-white/10">
                      Social Media
                    </span>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-md ink-muted border border-white/10">
                      Remarketing
                    </span>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="bg-white/5 backdrop-blur rounded-xl p-5 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-600/20 rounded-xl flex items-center justify-center">
                        <Settings className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Functional Cookies</h3>
                        <span className="text-xs ink-muted font-medium">Optional</span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setPreferences(prev => ({ ...prev, functional: !prev.functional }))
                      }
                      className={cn(
                        'w-12 h-6 rounded-full relative transition-all duration-200',
                        preferences.functional ? 'bg-amber-600' : 'bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200',
                          preferences.functional ? 'translate-x-6' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-sm ink-muted leading-relaxed">
                    These cookies enable enhanced functionality and personalization, such as videos
                    and live chats. They remember choices you make to give you enhanced features.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-md ink-muted border border-white/10">
                      Language Preferences
                    </span>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-md ink-muted border border-white/10">
                      Theme Settings
                    </span>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-md ink-muted border border-white/10">
                      User Preferences
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setPreferences({
                      essential: true,
                      analytics: true,
                      marketing: true,
                      functional: true
                    })
                  }}
                  className="flex-1 bg-white/10 backdrop-blur text-white px-4 py-3 rounded-xl font-medium text-sm border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-200"
                >
                  Accept All
                </button>
                <button
                  onClick={() => {
                    setPreferences({
                      essential: true,
                      analytics: false,
                      marketing: false,
                      functional: false
                    })
                  }}
                  className="flex-1 bg-white/10 backdrop-blur text-white px-4 py-3 rounded-xl font-medium text-sm border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-200"
                >
                  Reject All Optional
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/25"
                >
                  Save My Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
