'use client'
import React from 'react'
import { motion } from 'framer-motion'
import {
  Crown,
  Diamond,
  Gem,
  Sparkles,
  Star,
  Heart,
  Shield,
  Award,
  Package,
  Calculator,
  TrendingUp,
  Settings
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface JewelryThemeShowcaseProps {
  title?: string
  showAllFeatures?: boolean
}

export function JewelryThemeShowcase({
  title = 'Luxury Jewelry Theme Showcase',
  showAllFeatures = true
}: JewelryThemeShowcaseProps) {
  const [selectedDemo, setSelectedDemo] = React.useState('cards')

  const demoSections = [
    {
      id: 'cards',
      name: 'Glass Cards',
      icon: Package,
      component: <GlassCardsDemo />
    },
    {
      id: 'buttons',
      name: 'Luxury Buttons',
      icon: Crown,
      component: <LuxuryButtonsDemo />
    },
    {
      id: 'animations',
      name: 'Animations',
      icon: Sparkles,
      component: <AnimationsDemo />
    },
    {
      id: 'typography',
      name: 'Typography',
      icon: Star,
      component: <TypographyDemo />
    }
  ]

  return (
    <div className="min-h-screen jewelry-gradient-luxury">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="container mx-auto p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="jewelry-glass-card p-6 inline-block mb-6"
            >
              <Crown className="text-jewelry-gold-600" size={60} />
            </motion.div>

            <h1 className="jewelry-heading text-4xl md:text-6xl mb-4">{title}</h1>
            <p className="jewelry-text-luxury text-xl">
              Enterprise-grade glassmorphism with precious metal aesthetics
            </p>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="jewelry-glass-panel mb-8"
          >
            <div className="flex flex-wrap justify-center gap-4">
              {demoSections.map((section, index) => {
                const Icon = section.icon
                const isActive = selectedDemo === section.id

                return (
                  <motion.button
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDemo(section.id)}
                    className={`
                      jewelry-nav-item flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300
                      ${
                        isActive
                          ? 'jewelry-btn-primary text-white'
                          : 'jewelry-glass-card hover:bg-white hover:bg-opacity-20'
                      }
                    `}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-jewelry-gold-600'} />
                    <span
                      className={`font-medium ${
                        isActive ? 'text-white' : 'text-jewelry-platinum-700'
                      }`}
                    >
                      {section.name}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          {/* Demo Content */}
          <motion.div
            key={selectedDemo}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="jewelry-glass-panel-strong"
          >
            {demoSections.find(s => s.id === selectedDemo)?.component}
          </motion.div>

          {/* Color Palette Preview */}
          {showAllFeatures && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="jewelry-glass-panel mt-8"
            >
              <h3 className="jewelry-text-luxury text-xl font-semibold mb-6 text-center">
                Color Palette
              </h3>
              <ColorPaletteDemo />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

// Demo Components
function GlassCardsDemo() {
  return (
    <div className="space-y-6">
      <h3 className="jewelry-text-luxury text-lg font-semibold mb-4">Glassmorphism Cards</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="jewelry-glass-card jewelry-luxury-hover p-6 text-center"
        >
          <Diamond className="mx-auto mb-3 text-jewelry-diamond" size={32} />
          <h4 className="jewelry-text-luxury font-semibold mb-2">Premium Diamond</h4>
          <p className="text-jewelry-platinum-600 text-sm">Exceptional clarity and cut</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="jewelry-glass-card jewelry-luxury-hover jewelry-shimmer p-6 text-center"
        >
          <Gem className="mx-auto mb-3 text-jewelry-emerald" size={32} />
          <h4 className="jewelry-text-luxury font-semibold mb-2">Emerald Collection</h4>
          <p className="text-jewelry-platinum-600 text-sm">Natural beauty preserved</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="jewelry-glass-card jewelry-luxury-hover jewelry-pulse-glow p-6 text-center"
        >
          <Crown className="mx-auto mb-3 text-jewelry-gold-600" size={32} />
          <h4 className="jewelry-text-luxury font-semibold mb-2">Royal Crown</h4>
          <p className="text-jewelry-platinum-600 text-sm">Handcrafted excellence</p>
        </motion.div>
      </div>
    </div>
  )
}

function LuxuryButtonsDemo() {
  return (
    <div className="space-y-6">
      <h3 className="jewelry-text-luxury text-lg font-semibold mb-4">Luxury Buttons</h3>

      <div className="flex flex-wrap gap-4 justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="jewelry-btn-primary"
        >
          <Crown className="inline mr-2" size={18} />
          Primary Action
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="jewelry-btn-secondary"
        >
          <Diamond className="inline mr-2" size={18} />
          Secondary Action
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="jewelry-btn-luxury"
        >
          <Sparkles className="inline mr-2" size={18} />
          Luxury Action
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="jewelry-status-active text-center">
          <Shield className="inline mr-2" size={16} />
          Active Status
        </div>
        <div className="jewelry-status-pending text-center">
          <Calculator className="inline mr-2" size={16} />
          Pending Status
        </div>
        <div className="jewelry-status-inactive text-center">
          <Settings className="inline mr-2" size={16} />
          Inactive Status
        </div>
      </div>
    </div>
  )
}

function AnimationsDemo() {
  return (
    <div className="space-y-6">
      <h3 className="jewelry-text-luxury text-lg font-semibold mb-4">Elegant Animations</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="jewelry-glass-card p-6 text-center">
          <div className="jewelry-float">
            <Sparkles className="mx-auto mb-3 text-jewelry-gold-600" size={32} />
          </div>
          <h4 className="jewelry-text-luxury font-semibold text-sm">Float Animation</h4>
        </div>

        <div className="jewelry-glass-card p-6 text-center">
          <div className="jewelry-gemstone-float">
            <Gem className="mx-auto mb-3 text-jewelry-amethyst" size={32} />
          </div>
          <h4 className="jewelry-text-luxury font-semibold text-sm">Gemstone Float</h4>
        </div>

        <div className="jewelry-glass-card p-6 text-center jewelry-diamond-sparkle">
          <Diamond className="mx-auto mb-3 text-jewelry-diamond" size={32} />
          <h4 className="jewelry-text-luxury font-semibold text-sm">Diamond Sparkle</h4>
        </div>

        <div className="jewelry-glass-card p-6 text-center">
          <div className="jewelry-spinner"></div>
          <h4 className="jewelry-text-luxury font-semibold text-sm mt-3">Loading Spinner</h4>
        </div>
      </div>
    </div>
  )
}

function TypographyDemo() {
  return (
    <div className="space-y-6">
      <h3 className="jewelry-text-luxury text-lg font-semibold mb-4">Luxury Typography</h3>

      <div className="space-y-4">
        <div className="text-center">
          <h1 className="jewelry-heading text-4xl mb-2">Elegant Heading</h1>
          <p className="jewelry-text-luxury text-lg">Luxury subtitle text</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="jewelry-glass-card p-6">
            <h4 className="jewelry-text-gold text-xl font-bold mb-2">Golden Text</h4>
            <p className="text-jewelry-platinum-700">
              This text shimmers like precious gold with animated effects.
            </p>
          </div>

          <div className="jewelry-glass-card p-6">
            <h4 className="jewelry-text-silver text-xl font-bold mb-2">Silver Text</h4>
            <p className="text-jewelry-platinum-700">
              Elegant silver text with sophisticated shimmer animation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorPaletteDemo() {
  const colors = [
    { name: 'Gold 500', class: 'bg-jewelry-gold-500', hex: '#f59e0b' },
    { name: 'Gold 600', class: 'bg-jewelry-gold-600', hex: '#d97706' },
    { name: 'Platinum 500', class: 'bg-jewelry-platinum-500', hex: '#64748b' },
    { name: 'Diamond', class: 'bg-jewelry-diamond', hex: '#3b82f6' },
    { name: 'Emerald', class: 'bg-jewelry-emerald', hex: '#10b981' },
    { name: 'Amethyst', class: 'bg-jewelry-amethyst', hex: '#a855f7' }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {colors.map((color, index) => (
        <motion.div
          key={color.name}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 * index }}
          className="jewelry-glass-card p-4 text-center"
        >
          <div className={`w-12 h-12 rounded-full mx-auto mb-2 ${color.class}`}></div>
          <h5 className="jewelry-text-luxury text-xs font-medium">{color.name}</h5>
          <p className="text-jewelry-platinum-600 text-xs font-mono">{color.hex}</p>
        </motion.div>
      ))}
    </div>
  )
}

export default JewelryThemeShowcase
