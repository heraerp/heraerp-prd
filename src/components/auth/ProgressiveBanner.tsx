'use client'

import React, { useState } from 'react'
import { useProgressiveAuth } from './ProgressiveAuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  X, 
  Clock, 
  Save, 
  Mail, 
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react'

export function ProgressiveBanner() {
  const { 
    workspace, 
    isAnonymous, 
    isIdentified, 
    daysRemaining,
    saveWithEmail
  } = useProgressiveAuth()
  
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Don't show if registered, dismissed, or no workspace
  if (!workspace || workspace.type === 'registered' || dismissed) {
    return null
  }
  
  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    
    const result = await saveWithEmail(email)
    
    if (result.success) {
      setMessage({
        type: 'success',
        text: 'Workspace saved! Check your email to verify your account.'
      })
      setShowEmailForm(false)
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to save workspace'
      })
    }
    
    setSaving(false)
  }
  
  // Different banner styles based on state and urgency
  const getBannerStyle = () => {
    if (daysRemaining <= 3) {
      return 'bg-gradient-to-r from-red-500 to-orange-500'
    } else if (daysRemaining <= 7) {
      return 'bg-gradient-to-r from-orange-500 to-amber-500'
    } else if (isIdentified) {
      return 'bg-gradient-to-r from-green-500 to-emerald-500'
    } else {
      return 'bg-gradient-to-r from-blue-500 to-purple-500'
    }
  }
  
  return (
    <div className={`${getBannerStyle()} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {isIdentified ? (
                <CheckCircle className="h-5 w-5" />
              ) : daysRemaining <= 7 ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>
            
            {/* Message */}
            <div className="flex-1">
              {isAnonymous && (
                <p className="text-sm font-medium">
                  You're exploring HERA with sample data. 
                  {daysRemaining > 7 ? (
                    <span> Your workspace expires in {daysRemaining} days.</span>
                  ) : (
                    <span className="font-bold"> Only {daysRemaining} days left!</span>
                  )}
                </p>
              )}
              
              {isIdentified && (
                <p className="text-sm font-medium">
                  ✓ Workspace saved to {workspace.email}. 
                  <span className="ml-2">Ready to go live? Complete your registration.</span>
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-3">
              {!showEmailForm && (
                <>
                  {isAnonymous && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/50"
                      onClick={() => setShowEmailForm(true)}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save My Work
                    </Button>
                  )}
                  
                  {isIdentified && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white text-blue-600 hover:bg-white/90"
                      onClick={() => window.location.href = '/register'}
                    >
                      Complete Registration
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  
                  <button
                    onClick={() => setDismissed(true)}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Email Form */}
        {showEmailForm && (
          <div className="mt-3 pb-2">
            <form onSubmit={handleSaveWorkspace} className="flex items-center space-x-3 max-w-md">
              <Mail className="h-5 w-5 text-white/80" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to save workspace"
                className="flex-1 bg-white/20 border-white/50 text-white placeholder-white/70"
                required
              />
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-white text-blue-600 hover:bg-white/90"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setShowEmailForm(false)
                  setMessage(null)
                }}
                className="text-white/80 hover:text-white"
              >
                Cancel
              </button>
            </form>
            
            {message && (
              <p className={`mt-2 text-sm ${message.type === 'error' ? 'text-red-100' : 'text-green-100'}`}>
                {message.text}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}