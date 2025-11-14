/**
 * HERA Jewelry - App Tile Component
 * Modern enterprise app tile with Royal Blue & Gold styling
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { LucideIcon, ExternalLink, Star, ChevronRight } from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface JewelryApp {
  id: string
  title: string
  description: string
  icon: React.ElementType | LucideIcon
  href: string
  category?: string
  featured?: boolean
  tags?: string[]
}

interface JewelryAppTileProps {
  app: JewelryApp
  index: number
  viewMode?: 'grid' | 'list'
  compact?: boolean
}

export function JewelryAppTile({
  app,
  index,
  viewMode = 'grid',
  compact = false
}: JewelryAppTileProps) {
  const router = useRouter()
  const prefersReducedMotion = usePrefersReducedMotion()
  const Icon = app.icon

  const handleClick = () => {
    router.push(app.href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  if (viewMode === 'list' && !compact) {
    return (
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 * (index % 10) }}
        whileHover={prefersReducedMotion ? {} : { x: 4 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
        className="jewelry-glass-card p-6 text-left w-full group hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent transition-all duration-300"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-6">
          {/* Icon */}
          <div className="jewelry-crown-glow p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/20 group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-8 w-8 jewelry-icon-gold" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="jewelry-text-high-contrast text-xl font-bold group-hover:jewelry-text-gold transition-colors">
                {app.title}
              </h3>
              {app.featured && (
                <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                  <Star className="h-3 w-3 jewelry-icon-gold" />
                  <span className="text-xs jewelry-text-gold font-medium">Featured</span>
                </div>
              )}
              {app.category && (
                <span className="text-xs jewelry-text-muted bg-white/10 px-2 py-1 rounded-full">
                  {app.category}
                </span>
              )}
            </div>

            <p className="jewelry-text-muted mb-3 line-clamp-2">{app.description}</p>

            {app.tags && (
              <div className="flex flex-wrap gap-1">
                {app.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="text-xs jewelry-text-muted bg-white/5 px-2 py-1 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
                {app.tags.length > 3 && (
                  <span className="text-xs jewelry-text-muted">+{app.tags.length - 3} more</span>
                )}
              </div>
            )}
          </div>

          {/* Action */}
          <div className="flex items-center gap-2">
            <div className="jewelry-glass-btn p-2 rounded-lg group-hover:bg-yellow-500/10 transition-colors">
              <ChevronRight className="h-5 w-5 jewelry-text-muted group-hover:jewelry-text-gold transition-colors" />
            </div>
          </div>
        </div>
      </motion.button>
    )
  }

  // Grid view (default) - enhanced for both compact and full modes
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * (index % 12), duration: 0.3 }}
      whileHover={prefersReducedMotion ? {} : { y: -4, scale: compact ? 1.05 : 1.02 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      className={`jewelry-glass-card text-left w-full group hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent transition-all duration-300 relative overflow-hidden ${
        compact ? 'p-4' : 'p-6'
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600"></div>
      </div>

      {/* Featured Badge */}
      {app.featured && (
        <div className="absolute top-3 right-3 z-10">
          <div className="jewelry-crown-glow p-1 rounded-full bg-yellow-500/20">
            <Star className="h-3 w-3 jewelry-icon-gold" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`relative z-10 ${compact ? 'space-y-3' : 'space-y-4'}`}>
        {/* Icon */}
        <div
          className={`jewelry-crown-glow mx-auto rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/20 group-hover:from-yellow-500/20 group-hover:to-yellow-600/30 group-hover:scale-110 transition-all duration-300 ${
            compact ? 'p-3 w-fit' : 'p-4 w-fit'
          }`}
        >
          <Icon
            className={`jewelry-icon-gold transition-transform duration-300 ${
              compact ? 'h-6 w-6' : 'h-8 w-8'
            }`}
          />
        </div>

        {/* Content */}
        <div className={compact ? 'space-y-2' : 'space-y-3'}>
          <div className="text-center">
            <h3
              className={`jewelry-text-high-contrast font-bold group-hover:jewelry-text-gold transition-colors duration-300 ${
                compact ? 'text-sm' : 'text-lg'
              }`}
            >
              {app.title}
            </h3>

            {app.category && !compact && (
              <span className="text-xs jewelry-text-muted bg-white/10 px-2 py-1 rounded-full mt-1 inline-block">
                {app.category}
              </span>
            )}
          </div>

          {!compact && (
            <p className="jewelry-text-muted text-sm text-center line-clamp-2 min-h-[2.5rem]">
              {app.description}
            </p>
          )}

          {!compact && app.tags && (
            <div className="flex flex-wrap gap-1 justify-center">
              {app.tags.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="text-xs jewelry-text-muted bg-white/5 px-2 py-1 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Legacy featured badge for compact mode */}
          {app.featured && compact && (
            <div className="text-center">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Featured
              </span>
            </div>
          )}
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-yellow-500 to-yellow-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      </div>

      {/* External Link Indicator */}
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <ExternalLink className="h-3 w-3 jewelry-text-muted" />
      </div>
    </motion.button>
  )
}
