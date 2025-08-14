'use client'

import React, { useState } from 'react'
import { useUniversalProgressive } from '@/components/auth/UniversalProgressiveProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Mail, 
  Zap, 
  Shield, 
  Clock, 
  CheckCircle,
  ArrowRight
} from 'lucide-react'

export function UniversalProgressiveBanner() {
  const { moduleConfig, progressiveAuth } = useUniversalProgressive()
  const [isExpanded, setIsExpanded] = useState(false)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showBanner, setShowBanner] = useState(true)

  // Don't show banner for registered users
  if (progressiveAuth.isRegistered || !showBanner) {
    return null
  }

  const handleSaveWithEmail = async () => {
    if (!email) return
    
    setIsLoading(true)
    try {
      const result = await progressiveAuth.saveWithEmail(email)
      if (result.success) {
        setShowBanner(false)
      }
    } catch (error) {
      console.error('Failed to save with email:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getBannerVariant = () => {
    if (progressiveAuth.isIdentified) {
      return {
        bgClass: 'bg-gradient-to-r from-green-500 to-emerald-600',
        icon: CheckCircle,
        title: 'Data Saved Successfully!',
        message: 'Your workspace is now saved for 365 days.',
        action: null
      }
    }

    if (progressiveAuth.daysRemaining <= 7) {
      return {
        bgClass: 'bg-gradient-to-r from-red-500 to-orange-600',
        icon: Clock,
        title: 'Workspace Expires Soon',
        message: `Only ${progressiveAuth.daysRemaining} days remaining. Save your ${moduleConfig.name} data now!`,
        action: 'save'
      }
    }

    return {
      bgClass: `bg-gradient-to-r ${moduleConfig.gradientColors}`,
      icon: Zap,
      title: `Save Your ${moduleConfig.title} Data`,
      message: `You're using HERA ${moduleConfig.name} anonymously. Save your progress with just an email!`,
      action: 'save'
    }
  }

  const variant = getBannerVariant()
  const IconComponent = variant.icon

  if (isExpanded) {
    return (
      <div className={`${variant.bgClass} text-white shadow-lg relative`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-3">
                <IconComponent className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-lg">{variant.title}</h3>
                  <p className="text-white/90 text-sm">{variant.message}</p>
                </div>
              </div>
              
              {variant.action === 'save' && (
                <div className="flex items-center space-x-3 ml-8">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-64 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveWithEmail()}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSaveWithEmail}
                    disabled={!email || isLoading}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    size="sm"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Save for 365 Days
                      </>
                    )}
                  </Button>
                  
                  <div className="text-white/80 text-xs">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Free forever</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>Data stays local</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 ml-4"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${variant.bgClass} text-white shadow-lg relative`}>
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent className="w-5 h-5" />
            <span className="font-medium">{variant.title}</span>
            {progressiveAuth.daysRemaining > 0 && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {progressiveAuth.daysRemaining} days left
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {variant.action === 'save' && (
              <Button
                onClick={() => setIsExpanded(true)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 text-sm"
              >
                Save Now
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            
            <Button
              onClick={() => setShowBanner(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}