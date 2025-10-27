'use client'

/**
 * Progress Stepper Component
 * Smart Code: HERA.ENTERPRISE.MASTER_DATA.PROGRESS_STEPPER.v1
 * 
 * SAP Fiori-inspired progress stepper with color-coded states and navigation
 */

import React from 'react'
import { Check, ChevronRight, AlertCircle, Clock } from 'lucide-react'
import { ProgressIndicatorConfig, MasterDataTab } from '@/lib/master-data/yaml-parser'

export interface StepState {
  id: string
  title: string
  icon?: string
  status: 'upcoming' | 'active' | 'completed' | 'error'
  completionPercentage?: number
  errors?: string[]
  isClickable?: boolean
}

export interface ProgressStepperProps {
  steps: StepState[]
  currentStepId: string
  config: ProgressIndicatorConfig
  onStepClick?: (stepId: string) => void
  className?: string
  orientation?: 'horizontal' | 'vertical'
  showLabels?: boolean
  showProgress?: boolean
  compact?: boolean
}

export function ProgressStepper({
  steps,
  currentStepId,
  config,
  onStepClick,
  className = '',
  orientation = 'horizontal',
  showLabels = true,
  showProgress = false,
  compact = false
}: ProgressStepperProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStepId)
  const overallProgress = calculateOverallProgress(steps)

  return (
    <div className={`progress-stepper ${className}`}>
      {/* Overall Progress Bar (if enabled) */}
      {showProgress && config.showPercentage && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-900">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${overallProgress}%`,
                backgroundColor: config.colourScheme.active
              }}
            />
          </div>
        </div>
      )}

      {/* Steps Container */}
      <div className={`
        flex 
        ${orientation === 'vertical' ? 'flex-col space-y-4' : 'items-center justify-between'}
        ${compact ? 'space-x-2' : 'space-x-4'}
      `}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <StepItem
              step={step}
              index={index}
              config={config}
              isActive={step.id === currentStepId}
              isClickable={step.isClickable && !!onStepClick}
              onClick={() => onStepClick?.(step.id)}
              showLabels={showLabels && config.labels}
              showIcons={config.icons}
              compact={compact}
              orientation={orientation}
            />
            
            {/* Connector Line */}
            {index < steps.length - 1 && orientation === 'horizontal' && (
              <StepConnector
                isCompleted={index < currentIndex}
                config={config}
                compact={compact}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Details (for active step) */}
      {!compact && currentIndex >= 0 && currentIndex < steps.length && (
        <StepDetails
          step={steps[currentIndex]}
          config={config}
          className="mt-6"
        />
      )}
    </div>
  )
}

interface StepItemProps {
  step: StepState
  index: number
  config: ProgressIndicatorConfig
  isActive: boolean
  isClickable: boolean
  onClick: () => void
  showLabels: boolean
  showIcons: boolean
  compact: boolean
  orientation: 'horizontal' | 'vertical'
}

function StepItem({
  step,
  index,
  config,
  isActive,
  isClickable,
  onClick,
  showLabels,
  showIcons,
  compact,
  orientation
}: StepItemProps) {
  const getStepColor = () => {
    switch (step.status) {
      case 'completed':
        return config.colourScheme.completed
      case 'active':
        return config.colourScheme.active
      case 'error':
        return config.colourScheme.error || '#e74c3c'
      case 'upcoming':
      default:
        return config.colourScheme.upcoming
    }
  }

  const getStepIcon = () => {
    if (!showIcons) return null

    switch (step.status) {
      case 'completed':
        return <Check className="w-4 h-4 text-white" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-white" />
      case 'active':
        return <Clock className="w-4 h-4 text-white" />
      default:
        return <span className="text-white text-sm font-medium">{index + 1}</span>
    }
  }

  const stepColor = getStepColor()
  const isInteractive = isClickable && step.status !== 'upcoming'

  return (
    <div className={`
      flex 
      ${orientation === 'vertical' ? 'flex-row items-center' : 'flex-col items-center'}
      ${isInteractive ? 'cursor-pointer' : 'cursor-default'}
      ${compact ? 'min-w-0' : 'min-w-[120px]'}
    `}>
      {/* Step Circle */}
      <div
        className={`
          relative flex items-center justify-center rounded-full transition-all duration-200
          ${compact ? 'w-8 h-8' : 'w-10 h-10'}
          ${isInteractive ? 'hover:scale-110 hover:shadow-lg' : ''}
          ${isActive ? 'ring-2 ring-offset-2' : ''}
        `}
        style={{ 
          backgroundColor: stepColor,
          ringColor: isActive ? stepColor : 'transparent'
        }}
        onClick={isInteractive ? onClick : undefined}
      >
        {getStepIcon()}
        
        {/* Progress Ring for Active Step */}
        {isActive && step.completionPercentage !== undefined && (
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="white"
              strokeWidth="6"
              strokeDasharray={`${step.completionPercentage * 2.83} 283`}
              className="transition-all duration-300"
            />
          </svg>
        )}
      </div>

      {/* Step Label */}
      {showLabels && (
        <div className={`
          ${orientation === 'vertical' ? 'ml-3 flex-1' : 'mt-2 text-center'}
          ${compact ? 'hidden sm:block' : ''}
        `}>
          <div
            className={`
              text-sm font-medium transition-colors duration-200
              ${isActive ? 'text-gray-900' : 'text-gray-600'}
              ${isInteractive ? 'hover:text-gray-900' : ''}
            `}
            onClick={isInteractive ? onClick : undefined}
          >
            {step.title}
          </div>
          
          {/* Step Status Indicator */}
          {!compact && (
            <div className="mt-1">
              {step.status === 'completed' && (
                <span className="text-xs text-green-600 font-medium">Completed</span>
              )}
              {step.status === 'active' && step.completionPercentage !== undefined && (
                <span className="text-xs text-blue-600 font-medium">
                  {Math.round(step.completionPercentage)}% Complete
                </span>
              )}
              {step.status === 'error' && step.errors && step.errors.length > 0 && (
                <span className="text-xs text-red-600 font-medium">
                  {step.errors.length} Error{step.errors.length > 1 ? 's' : ''}
                </span>
              )}
              {step.status === 'upcoming' && (
                <span className="text-xs text-gray-500">Pending</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface StepConnectorProps {
  isCompleted: boolean
  config: ProgressIndicatorConfig
  compact: boolean
}

function StepConnector({ isCompleted, config, compact }: StepConnectorProps) {
  return (
    <div className={`
      flex-1 h-0.5 transition-all duration-300
      ${compact ? 'min-w-4' : 'min-w-8'}
    `}>
      <div
        className="h-full rounded"
        style={{
          backgroundColor: isCompleted 
            ? config.colourScheme.completed 
            : config.colourScheme.upcoming
        }}
      />
    </div>
  )
}

interface StepDetailsProps {
  step: StepState
  config: ProgressIndicatorConfig
  className?: string
}

function StepDetails({ step, config, className = '' }: StepDetailsProps) {
  if (!step) return null

  return (
    <div className={`${className}`}>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
          <div className="flex items-center space-x-2">
            {step.status === 'active' && step.completionPercentage !== undefined && (
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${step.completionPercentage}%`,
                      backgroundColor: config.colourScheme.active
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {Math.round(step.completionPercentage)}%
                </span>
              </div>
            )}
            <StepStatusBadge status={step.status} config={config} />
          </div>
        </div>

        {/* Error Messages */}
        {step.status === 'error' && step.errors && step.errors.length > 0 && (
          <div className="mt-3">
            <div className="text-sm font-medium text-red-800 mb-2">Issues to resolve:</div>
            <ul className="space-y-1">
              {step.errors.map((error, index) => (
                <li key={index} className="text-sm text-red-700 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Completion Message */}
        {step.status === 'completed' && (
          <div className="mt-2 text-sm text-green-700 flex items-center">
            <Check className="w-4 h-4 mr-2" />
            All required fields completed successfully
          </div>
        )}
      </div>
    </div>
  )
}

interface StepStatusBadgeProps {
  status: StepState['status']
  config: ProgressIndicatorConfig
}

function StepStatusBadge({ status, config }: StepStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          color: config.colourScheme.completed,
          textColor: 'text-white'
        }
      case 'active':
        return {
          label: 'In Progress',
          color: config.colourScheme.active,
          textColor: 'text-white'
        }
      case 'error':
        return {
          label: 'Needs Attention',
          color: config.colourScheme.error || '#e74c3c',
          textColor: 'text-white'
        }
      case 'upcoming':
      default:
        return {
          label: 'Pending',
          color: config.colourScheme.upcoming,
          textColor: 'text-gray-700'
        }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${statusConfig.textColor}
      `}
      style={{ backgroundColor: statusConfig.color }}
    >
      {statusConfig.label}
    </span>
  )
}

// Helper functions

function calculateOverallProgress(steps: StepState[]): number {
  if (steps.length === 0) return 0

  let totalProgress = 0
  
  for (const step of steps) {
    switch (step.status) {
      case 'completed':
        totalProgress += 100
        break
      case 'active':
        totalProgress += step.completionPercentage || 0
        break
      case 'error':
        totalProgress += step.completionPercentage || 0
        break
      case 'upcoming':
      default:
        totalProgress += 0
        break
    }
  }

  return Math.round(totalProgress / steps.length)
}

export type { StepState, ProgressStepperProps }