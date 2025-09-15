'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play, Star, Users, TrendingUp } from 'lucide-react'

interface FranchiseHeroProps {
  title: string
  subtitle: string
  description?: string
  ctaText?: string
  ctaLink?: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
  showStats?: boolean
  showVideo?: boolean
  backgroundVariant?: 'default' | 'gradient' | 'dark'
}

export function FranchiseHero({
  title,
  subtitle,
  description,
  ctaText = 'Apply Now',
  ctaLink = '/franchise/apply',
  secondaryCtaText = 'Learn More',
  secondaryCtaLink = '/franchise/how-it-works',
  showStats = false,
  showVideo = false,
  backgroundVariant = 'default'
}: FranchiseHeroProps) {
  const backgroundClasses = {
    default:
      'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900',
    gradient: 'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700',
    dark: 'bg-slate-900'
  }

  const textClasses = {
    default: 'text-slate-900 dark:text-white',
    gradient: 'text-white',
    dark: 'text-white'
  }

  const subtitleClasses = {
    default: 'text-slate-600 dark:text-slate-300',
    gradient: 'text-blue-100',
    dark: 'text-slate-300'
  }

  return (
    <div className={`relative overflow-hidden ${backgroundClasses[backgroundVariant]}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5" />

      <div className="container mx-auto px-4 py-24 lg:py-32 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <div className="mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mb-4">
                  <Star className="h-4 w-4 mr-1" />
                  Join the ERP Revolution
                </span>
              </div>

              <h1
                className={`text-4xl lg:text-6xl font-bold mb-6 leading-tight ${textClasses[backgroundVariant]}`}
              >
                {title}
              </h1>

              <p
                className={`text-xl lg:text-2xl font-semibold mb-6 ${
                  backgroundVariant === 'default'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
                    : 'text-yellow-300'
                }`}
              >
                {subtitle}
              </p>

              {description && (
                <p className={`text-lg mb-8 leading-relaxed ${subtitleClasses[backgroundVariant]}`}>
                  {description}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 text-lg"
                >
                  <Link href={ctaLink} className="flex items-center">
                    {ctaText}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant={backgroundVariant === 'default' ? 'outline' : 'secondary'}
                  size="lg"
                  className="px-8 py-6 text-lg"
                >
                  <Link href={secondaryCtaLink} className="flex items-center">
                    {secondaryCtaText}
                    {showVideo && <Play className="ml-2 h-5 w-5" />}
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              {showStats && (
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${textClasses[backgroundVariant]}`}>
                      500+
                    </div>
                    <div className={`text-sm ${subtitleClasses[backgroundVariant]}`}>Partners</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${textClasses[backgroundVariant]}`}>
                      $50B
                    </div>
                    <div className={`text-sm ${subtitleClasses[backgroundVariant]}`}>
                      Market Size
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${textClasses[backgroundVariant]}`}>
                      95%
                    </div>
                    <div className={`text-sm ${subtitleClasses[backgroundVariant]}`}>
                      Success Rate
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Visual Element */}
            <div className="flex justify-center lg:justify-end">
              {showVideo ? (
                <div className="relative w-full max-w-lg">
                  <div className="aspect-video bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-600 to-purple-600">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
                      >
                        <Play className="h-6 w-6 mr-2" />
                        Watch Demo
                      </Button>
                    </div>
                  </div>
                  {/* Video placeholder overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl" />
                </div>
              ) : (
                <div className="relative">
                  {/* Feature Cards */}
                  <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                      <Users className="h-8 w-8 text-blue-400 mb-3" />
                      <h3 className="font-semibold text-white mb-2">Work From Home</h3>
                      <p className="text-sm text-slate-300">Build your empire from anywhere</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 ml-6">
                      <TrendingUp className="h-8 w-8 text-green-400 mb-3" />
                      <h3 className="font-semibold text-white mb-2">High Income</h3>
                      <p className="text-sm text-slate-300">Earn $25K–$500K+ annually</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                      <Star className="h-8 w-8 text-yellow-400 mb-3" />
                      <h3 className="font-semibold text-white mb-2">Market Leader</h3>
                      <p className="text-sm text-slate-300">Disrupt a $50B industry</p>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-400/20 rounded-full blur-xl" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-400/20 rounded-full blur-xl" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
