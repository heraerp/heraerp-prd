/**
 * HERA Help Report Button
 * User-facing component to report production issues
 * Smart Code: HERA.MONITORING.HELP_BUTTON.v1
 */

'use client'

import React, { useState } from 'react'
import { AlertCircle, Send, CheckCircle, Loader2, Bug, MessageSquare } from 'lucide-react'
import { productionMonitor } from '@/lib/monitoring/production-monitor'
import { emailReporter } from '@/lib/monitoring/email-reporter'
import { toast } from 'sonner'

interface HelpReportButtonProps {
  variant?: 'fab' | 'button' | 'text' | 'minimal'
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  organizationId: string
  userEmail: string
}

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (message: string, includeErrors: boolean) => Promise<void>
  isSubmitting: boolean
}

export const HelpReportButton: React.FC<HelpReportButtonProps> = ({
  variant = 'fab',
  position = 'bottom-right',
  size = 'md',
  className = '',
  organizationId,
  userEmail
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleHelpRequest = async (message: string, includeErrors: boolean) => {
    setIsSubmitting(true)

    try {
      // Get recent errors if requested
      const errors = includeErrors ? productionMonitor.getBufferedErrors() : []

      // Send help request via email
      const result = await emailReporter.sendHelpRequest(
        errors,
        message,
        userEmail,
        organizationId
      )

      if (result.success) {
        toast.success('Help request sent! We\'ll get back to you soon.')
        setIsModalOpen(false)
      } else {
        toast.error('Failed to send help request. Please try again.')
      }
    } catch (error) {
      console.error('Help request error:', error)
      toast.error('Failed to send help request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getButtonStyles = () => {
    const baseStyles = 'flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
    
    const variantStyles = {
      fab: 'fixed bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl z-50',
      button: 'bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2',
      text: 'text-blue-600 hover:text-blue-700 underline',
      minimal: 'text-gray-600 hover:text-blue-600'
    }

    const positionStyles = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6', 
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6'
    }

    const sizeStyles = {
      sm: variant === 'fab' ? 'w-12 h-12' : 'text-sm',
      md: variant === 'fab' ? 'w-14 h-14' : 'text-base',
      lg: variant === 'fab' ? 'w-16 h-16' : 'text-lg'
    }

    return `
      ${baseStyles}
      ${variantStyles[variant]}
      ${variant === 'fab' ? positionStyles[position] : ''}
      ${sizeStyles[size]}
      ${className}
    `.trim()
  }

  const getIcon = () => {
    const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24
    
    switch (variant) {
      case 'fab':
        return <MessageSquare size={iconSize} />
      case 'button':
        return <Bug size={iconSize} className="mr-2" />
      default:
        return <AlertCircle size={iconSize} />
    }
  }

  const getLabel = () => {
    switch (variant) {
      case 'fab':
        return null
      case 'button':
        return 'Report Issue'
      case 'text':
        return 'Need Help?'
      case 'minimal':
        return '?'
      default:
        return 'Help'
    }
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={getButtonStyles()}
        title="Report an issue or get help"
        aria-label="Report an issue or get help"
      >
        {getIcon()}
        {getLabel() && <span>{getLabel()}</span>}
      </button>

      <HelpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleHelpRequest}
        isSubmitting={isSubmitting}
      />
    </>
  )
}

const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}) => {
  const [message, setMessage] = useState('')
  const [includeErrors, setIncludeErrors] = useState(true)
  const [errorCount] = useState(() => productionMonitor.getBufferedErrors().length)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (message.trim()) {
      onSubmit(message.trim(), includeErrors)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage('')
      setIncludeErrors(true)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare size={24} />
              <h2 className="text-xl font-semibold">Get Help</h2>
            </div>
            {!isSubmitting && (
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>
          <p className="text-blue-100 mt-2 text-sm">
            Describe the issue you're experiencing and our team will help you.
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Message Input */}
          <div>
            <label htmlFor="help-message" className="block text-sm font-medium text-gray-700 mb-2">
              What issue are you experiencing? *
            </label>
            <textarea
              id="help-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe what you were trying to do and what went wrong..."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Be as specific as possible to help us resolve your issue quickly.
            </p>
          </div>

          {/* Include Error Data */}
          <div className="bg-gray-50 rounded-md p-3">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={includeErrors}
                onChange={(e) => setIncludeErrors(e.target.checked)}
                disabled={isSubmitting}
                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900">
                  Include error data to help with diagnosis
                </span>
                <div className="text-xs text-gray-600 mt-1">
                  {errorCount > 0 ? (
                    <>
                      We've detected <span className="font-semibold">{errorCount}</span> error{errorCount > 1 ? 's' : ''} that may be related to your issue.
                      Including this data helps our team diagnose the problem faster.
                    </>
                  ) : (
                    'No recent errors detected, but we can still include system information.'
                  )}
                </div>
              </div>
            </label>
          </div>

          {/* Data Privacy Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <strong>Privacy:</strong> Your report will include technical information to help diagnose the issue.
                No sensitive business data or passwords will be included.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Send Help Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HelpReportButton