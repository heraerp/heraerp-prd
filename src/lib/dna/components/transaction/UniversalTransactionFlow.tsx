'use client'

// ================================================================================
// HERA DNA UNIVERSAL TRANSACTION FLOW
// Smart Code: HERA.UI.TXN.FLOW.UNIVERSAL.ENGINE.v1
// Enterprise-grade multi-step transaction wizard with full localization
// ================================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Save,
  RotateCcw,
  Globe,
  Zap,
  Shield,
  Clock,
  FileText,
  Calculator,
  CreditCard,
  Package,
  Users,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ================================================================================
// TYPES AND INTERFACES
// ================================================================================

export interface TransactionStep {
  id: string
  name: string
  description?: string
  icon?: React.ComponentType<any>
  component: React.ComponentType<TransactionStepProps>
  validation?: (data: any) => Promise<ValidationResult> | ValidationResult
  skipCondition?: (data: any) => boolean
  requiredFields?: string[]
  smartCode?: string
  localizationKey?: string
}

export interface TransactionStepProps {
  data: Record<string, any>
  onChange: (updates: Record<string, any>) => void
  errors: Record<string, string>
  locale: string
  industry: string
  readonly?: boolean
}

export interface ValidationResult {
  valid: boolean
  errors?: Record<string, string>
  warnings?: Record<string, string>
}

export interface TransactionFlowProps {
  // Core configuration
  transactionType: string
  smartCode: string
  steps: TransactionStep[]

  // Localization
  locale?: string
  translations?: TranslationDictionary

  // Industry/Business configuration
  industry?: string
  businessType?: string
  currency?: string

  // Features
  allowDraft?: boolean
  allowSkip?: boolean
  showProgress?: boolean
  showStepNumbers?: boolean
  animationEnabled?: boolean
  autoSave?: boolean
  autoSaveInterval?: number

  // Data and callbacks
  initialData?: Record<string, any>
  onComplete: (data: Record<string, any>) => Promise<void> | void
  onStepChange?: (step: number, data: Record<string, any>) => void
  onSaveDraft?: (data: Record<string, any>) => Promise<void>
  onCancel?: () => void

  // Styling
  className?: string
  theme?: 'default' | 'minimal' | 'enterprise'
}

export interface TranslationDictionary {
  [locale: string]: {
    [key: string]: string | { [subkey: string]: string }
  }
}

// ================================================================================
// DEFAULT TRANSLATIONS
// ================================================================================

const defaultTranslations: TranslationDictionary = {
  en: {
    buttons: {
      next: 'Next',
      back: 'Back',
      complete: 'Complete',
      saveDraft: 'Save Draft',
      cancel: 'Cancel',
      skip: 'Skip',
      reset: 'Reset'
    },
    progress: {
      step: 'Step',
      of: 'of',
      complete: 'Complete'
    },
    validation: {
      required: 'This field is required',
      invalid: 'Invalid value',
      error: 'Error',
      warning: 'Warning'
    },
    status: {
      draft: 'Draft',
      inProgress: 'In Progress',
      completing: 'Completing...',
      complete: 'Complete',
      error: 'Error'
    }
  },
  es: {
    buttons: {
      next: 'Siguiente',
      back: 'Atrás',
      complete: 'Completar',
      saveDraft: 'Guardar Borrador',
      cancel: 'Cancelar',
      skip: 'Omitir',
      reset: 'Reiniciar'
    },
    progress: {
      step: 'Paso',
      of: 'de',
      complete: 'Completado'
    },
    validation: {
      required: 'Este campo es obligatorio',
      invalid: 'Valor inválido',
      error: 'Error',
      warning: 'Advertencia'
    },
    status: {
      draft: 'Borrador',
      inProgress: 'En Progreso',
      completing: 'Completando...',
      complete: 'Completo',
      error: 'Error'
    }
  },
  ar: {
    buttons: {
      next: 'التالي',
      back: 'رجوع',
      complete: 'إكمال',
      saveDraft: 'حفظ المسودة',
      cancel: 'إلغاء',
      skip: 'تخطي',
      reset: 'إعادة تعيين'
    },
    progress: {
      step: 'خطوة',
      of: 'من',
      complete: 'مكتمل'
    },
    validation: {
      required: 'هذا الحقل مطلوب',
      invalid: 'قيمة غير صالحة',
      error: 'خطأ',
      warning: 'تحذير'
    },
    status: {
      draft: 'مسودة',
      inProgress: 'قيد التقدم',
      completing: 'جاري الإكمال...',
      complete: 'مكتمل',
      error: 'خطأ'
    }
  },
  zh: {
    buttons: {
      next: '下一步',
      back: '上一步',
      complete: '完成',
      saveDraft: '保存草稿',
      cancel: '取消',
      skip: '跳过',
      reset: '重置'
    },
    progress: {
      step: '步骤',
      of: '共',
      complete: '完成'
    },
    validation: {
      required: '此字段为必填项',
      invalid: '无效值',
      error: '错误',
      warning: '警告'
    },
    status: {
      draft: '草稿',
      inProgress: '进行中',
      completing: '正在完成...',
      complete: '已完成',
      error: '错误'
    }
  }
}

// ================================================================================
// MAIN COMPONENT
// ================================================================================

export function UniversalTransactionFlow({
  transactionType,
  smartCode,
  steps,
  locale = 'en',
  translations = defaultTranslations,
  industry = 'general',
  businessType,
  currency = 'USD',
  allowDraft = true,
  allowSkip = false,
  showProgress = true,
  showStepNumbers = true,
  animationEnabled = true,
  autoSave = false,
  autoSaveInterval = 30000,
  initialData = {},
  onComplete,
  onStepChange,
  onSaveDraft,
  onCancel,
  className,
  theme = 'default'
}: TransactionFlowProps) {
  // State management
  const [currentStep, setCurrentStep] = useState(0)
  const [transactionData, setTransactionData] = useState<Record<string, any>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValidating, setIsValidating] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]))

  const { toast } = useToast()

  // Get translations
  const t = useCallback(
    (key: string) => {
      const keys = key.split('.')
      let value: any = translations[locale] || translations.en

      for (const k of keys) {
        value = value?.[k]
      }

      return value || key
    },
    [locale, translations]
  )

  // Filter active steps based on conditions
  const activeSteps = useMemo(() => {
    return steps.filter(step => {
      if (step.skipCondition) {
        return !step.skipCondition(transactionData)
      }
      return true
    })
  }, [steps, transactionData])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onSaveDraft) return

    const interval = setInterval(() => {
      onSaveDraft(transactionData).catch(error => {
        console.error('Auto-save failed:', error)
      })
    }, autoSaveInterval)

    return () => clearInterval(interval)
  }, [autoSave, autoSaveInterval, onSaveDraft, transactionData])

  // Handle data changes
  const handleDataChange = useCallback(
    (updates: Record<string, any>) => {
      setTransactionData(prev => ({
        ...prev,
        ...updates
      }))

      // Clear related errors
      const updatedErrors = { ...errors }
      Object.keys(updates).forEach(key => {
        delete updatedErrors[key]
      })
      setErrors(updatedErrors)
    },
    [errors]
  )

  // Validate current step
  const validateStep = async () => {
    const step = activeSteps[currentStep]
    if (!step.validation) return { valid: true }

    setIsValidating(true)
    try {
      const result = await step.validation(transactionData)

      if (!result.valid && result.errors) {
        setErrors(result.errors)
      }

      if (result.warnings) {
        Object.entries(result.warnings).forEach(([field, message]) => {
          toast({
            title: t('validation.warning'),
            description: `${field}: ${message}`,
            variant: 'default'
          })
        })
      }

      return result
    } finally {
      setIsValidating(false)
    }
  }

  // Navigation handlers
  const handleNext = async () => {
    const validation = await validateStep()
    if (!validation.valid) return

    const newStep = currentStep + 1
    setCurrentStep(newStep)
    setVisitedSteps(prev => new Set(prev).add(newStep))

    if (onStepChange) {
      onStepChange(newStep, transactionData)
    }
  }

  const handleBack = () => {
    setCurrentStep(Math.max(0, currentStep - 1))
  }

  const handleComplete = async () => {
    const validation = await validateStep()
    if (!validation.valid) return

    setIsCompleting(true)
    try {
      await onComplete({
        ...transactionData,
        _metadata: {
          transactionType,
          smartCode,
          locale,
          industry,
          businessType,
          currency,
          completedAt: new Date().toISOString()
        }
      })

      toast({
        title: t('status.complete'),
        description: `${transactionType} completed successfully`,
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: t('status.error'),
        description: error.message || 'Transaction failed',
        variant: 'destructive'
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return

    try {
      await onSaveDraft({
        ...transactionData,
        _draft: {
          currentStep,
          savedAt: new Date().toISOString()
        }
      })

      toast({
        title: t('status.draft'),
        description: 'Draft saved successfully'
      })
    } catch (error) {
      toast({
        title: t('status.error'),
        description: 'Failed to save draft',
        variant: 'destructive'
      })
    }
  }

  const currentStepData = activeSteps[currentStep]
  const StepComponent = currentStepData?.component
  const StepIcon = currentStepData?.icon

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === activeSteps.length - 1
  const progressPercentage = ((currentStep + 1) / activeSteps.length) * 100

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('progress.step')} {currentStep + 1} {t('progress.of')} {activeSteps.length}
            </span>
            <span className="font-medium">
              {Math.round(progressPercentage)}% {t('progress.complete')}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}

      {/* Step Indicators */}
      <div className="flex items-center justify-center space-x-2">
        {activeSteps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = visitedSteps.has(index) && index < currentStep
          const Icon = step.icon

          return (
            <div
              key={step.id}
              className={cn('flex items-center', index < activeSteps.length - 1 && 'flex-1')}
            >
              <button
                onClick={() => {
                  if (visitedSteps.has(index)) {
                    setCurrentStep(index)
                  }
                }}
                disabled={!visitedSteps.has(index)}
                className={cn(
                  'relative flex items-center justify-center w-10 h-10 rounded-full transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2',
                  isActive && 'bg-primary text-primary-foreground shadow-lg scale-110',
                  isCompleted && 'bg-primary/20 text-primary hover:bg-primary/30',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground',
                  visitedSteps.has(index) && 'cursor-pointer'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : Icon ? (
                  <Icon className="w-5 h-5" />
                ) : showStepNumbers ? (
                  <span className="text-sm font-semibold">{index + 1}</span>
                ) : null}
              </button>

              {index < activeSteps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-all',
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card
        className={cn('relative overflow-hidden', theme === 'enterprise' && 'shadow-xl border-2')}
      >
        <div className="p-6">
          {/* Step Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {StepIcon && <StepIcon className="w-5 h-5" />}
                {currentStepData?.name}
              </h3>
              {currentStepData?.description && (
                <p className="text-sm text-muted-foreground mt-1">{currentStepData.description}</p>
              )}
            </div>

            {/* Language Selector */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => {
                // In real implementation, this would open a language selector
                toast({
                  title: 'Language',
                  description: `Current: ${locale.toUpperCase()}`
                })
              }}
            >
              <Globe className="w-4 h-4" />
              {locale.toUpperCase()}
            </Button>
          </div>

          {/* Step Component */}
          <AnimatePresence mode="wait">
            {StepComponent && (
              <motion.div
                key={currentStep}
                initial={animationEnabled ? { opacity: 0, x: 20 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={animationEnabled ? { opacity: 0, x: -20 } : false}
                transition={{ duration: 0.2 }}
              >
                <StepComponent
                  data={transactionData}
                  onChange={handleDataChange}
                  errors={errors}
                  locale={locale}
                  industry={industry}
                  readonly={isCompleting}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/50">
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="ghost" onClick={onCancel} disabled={isCompleting}>
                {t('buttons.cancel')}
              </Button>
            )}

            {allowDraft && onSaveDraft && (
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isCompleting}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {t('buttons.saveDraft')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isValidating || isCompleting}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('buttons.back')}
              </Button>
            )}

            {isLastStep ? (
              <Button
                onClick={handleComplete}
                disabled={isValidating || isCompleting}
                className="gap-2"
              >
                {isCompleting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </motion.div>
                    {t('status.completing')}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {t('buttons.complete')}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isValidating || isCompleting}
                className="gap-2"
              >
                {t('buttons.next')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Validation Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <Card className="border-destructive/50 bg-destructive/10">
          <div className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">{t('validation.error')}</p>
                <ul className="text-sm space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field} className="text-muted-foreground">
                      {field}: {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// ================================================================================
// EXAMPLE STEP COMPONENTS
// ================================================================================

export const ExampleCustomerStep: React.FC<TransactionStepProps> = ({
  data,
  onChange,
  errors,
  locale
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Customer</label>
        <input
          type="text"
          value={data.customerName || ''}
          onChange={e => onChange({ customerName: e.target.value })}
          className={cn(
            'w-full px-3 py-2 border rounded-md',
            errors.customerName && 'border-destructive'
          )}
          placeholder="Enter customer name"
        />
        {errors.customerName && (
          <p className="text-sm text-destructive mt-1">{errors.customerName}</p>
        )}
      </div>
    </div>
  )
}

export const ExamplePaymentStep: React.FC<TransactionStepProps> = ({
  data,
  onChange,
  errors,
  locale,
  industry
}) => {
  const paymentMethods = {
    retail: ['cash', 'card', 'mobile'],
    restaurant: ['cash', 'card', 'mobile', 'voucher'],
    salon: ['cash', 'card', 'mobile', 'package'],
    healthcare: ['cash', 'card', 'insurance']
  }

  const methods = paymentMethods[industry] || paymentMethods.retail

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Payment Method</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {methods.map(method => (
            <button
              key={method}
              onClick={() => onChange({ paymentMethod: method })}
              className={cn(
                'p-3 border rounded-md capitalize transition-colors',
                data.paymentMethod === method
                  ? 'border-primary bg-primary/10'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Amount</label>
        <input
          type="number"
          value={data.amount || ''}
          onChange={e => onChange({ amount: parseFloat(e.target.value) })}
          className={cn(
            'w-full px-3 py-2 border rounded-md',
            errors.amount && 'border-destructive'
          )}
          placeholder="0.00"
        />
      </div>
    </div>
  )
}

// Export all components and types
export default UniversalTransactionFlow
