'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Activity,
  Zap,
  Star,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Heart,
  ThumbsUp,
  Award,
  Target,
  Sparkles,
  Coffee,
  Timer,
  Bell
} from 'lucide-react'

// Steve Jobs: "Details are not details. They make the design."

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'loading'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  showText?: boolean
  text?: string
}

export function StatusIndicator({
  status,
  size = 'md',
  animated = true,
  showText = false,
  text
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const colors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    loading: 'bg-gray-400'
  }

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`rounded-full ${sizeClasses[size]} ${colors[status]} ${
          animated && status === 'success' ? 'animate-pulse' : ''
        } ${animated && status === 'loading' ? 'animate-spin' : ''}`}
      />
      {showText && text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  )
}

interface PulseIndicatorProps {
  active: boolean
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple'
  size?: 'sm' | 'md' | 'lg'
}

export function PulseIndicator({ active, color = 'green', size = 'md' }: PulseIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  }

  return (
    <div className="relative">
      <div
        className={`rounded-full ${sizeClasses[size]} ${colors[color]} ${
          active ? 'animate-pulse' : 'opacity-50'
        }`}
      />
      {active && (
        <div className={`absolute inset-0 rounded-full ${colors[color]} animate-ping opacity-75`} />
      )}
    </div>
  )
}

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  className = ''
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    const startValue = displayValue

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.floor(startValue + (value - startValue) * easeOutQuart)

      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration, displayValue])

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}

interface FloatingNotificationProps {
  show: boolean
  message: string
  type?: 'success' | 'warning' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export function FloatingNotification({
  show,
  message,
  type = 'info',
  duration = 3000,
  onClose
}: FloatingNotificationProps) {
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Bell className="w-5 h-5 text-blue-500" />
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
            mass: 1
          }}
          className={`fixed top-4 right-4 z-50 flex items-center space-x-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm ${colors[type]}`}
        >
          {icons[type]}
          <span className="font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
  color?: string
}

export function ProgressRing({
  progress,
  size = 40,
  strokeWidth = 3,
  className = '',
  showPercentage = false,
  color = '#3b82f6'
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-700">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  message?: string
}

export function LoadingSpinner({ size = 'md', color = '#3b82f6', message }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className={`${sizes[size]} animate-spin`}>
        <svg className="w-full h-full" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeDasharray="15 5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {message && <p className="text-sm text-gray-600 animate-pulse">{message}</p>}
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  color?: string
  animated?: boolean
}

export function MetricCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  color = 'from-blue-500 to-indigo-600',
  animated = true
}: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const trendIcon = {
    up: <TrendingUp className="w-4 h-4 text-green-500" />,
    down: <TrendingDown className="w-4 h-4 text-red-500" />,
    neutral: null
  }

  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer"
      whileHover={{
        scale: animated ? 1.02 : 1,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <div
            className={`w-12 h-12 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-lg`}
          >
            {icon}
          </div>
        )}
        {change !== undefined && trendIcon[trend]}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="flex items-end space-x-2">
          {typeof value === 'number' ? (
            <AnimatedCounter value={value} className="text-3xl font-bold text-gray-900" />
          ) : (
            <span className="text-3xl font-bold text-gray-900">{value}</span>
          )}
          {change !== undefined && (
            <span
              className={`text-sm font-medium ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {change > 0 ? '+' : ''}
              {change}%
            </span>
          )}
        </div>
      </div>

      {/* Hover effect overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl opacity-0 pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  )
}

interface HeartbeatIndicatorProps {
  active: boolean
  rate?: number
  color?: string
  size?: number
}

export function HeartbeatIndicator({
  active,
  rate = 1000,
  color = '#ef4444',
  size = 20
}: HeartbeatIndicatorProps) {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (!active) return

    const interval = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 100)
    }, rate)

    return () => clearInterval(interval)
  }, [active, rate])

  return (
    <div className="flex items-center space-x-2">
      <motion.div animate={{ scale: pulse ? 1.3 : 1 }} transition={{ duration: 0.1 }}>
        <Heart
          className={`w-${size / 4} h-${size / 4}`}
          style={{ color, fill: pulse ? color : 'transparent' }}
        />
      </motion.div>
      {active && (
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 h-4 rounded-full"
              style={{ backgroundColor: color }}
              animate={{
                scaleY: pulse ? [1, 2, 1] : 1,
                opacity: pulse ? [0.5, 1, 0.5] : 0.3
              }}
              transition={{
                duration: 0.2,
                delay: i * 0.05,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface GlowButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  glowColor?: string
  disabled?: boolean
}

export function GlowButton({
  children,
  onClick,
  className = '',
  glowColor = 'rgba(59, 130, 246, 0.5)',
  disabled = false
}: GlowButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  return (
    <motion.button
      className={`relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl transition-all duration-200 ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
      }`}
      onClick={disabled ? undefined : onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      style={{
        boxShadow: isHovered && !disabled ? `0 0 20px ${glowColor}` : 'none'
      }}
    >
      {children}

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          opacity: isHovered && !disabled ? 0.6 : 0
        }}
        animate={{ opacity: isHovered && !disabled ? 0.6 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  )
}
