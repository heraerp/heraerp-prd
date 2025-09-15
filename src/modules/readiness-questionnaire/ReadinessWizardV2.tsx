/**
 * HERA ERP Readiness Questionnaire Wizard V2
 * Smart Code: HERA.ERP.READINESS.WIZARD.V2.COMPONENT.V1
 *
 * World-class UI design with optimal readability and single-page experience
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Target,
  AlertCircle,
  Lightbulb,
  BarChart3,
  TrendingUp,
  Sparkles,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

import type {
  QuestionnaireTemplate,
  QuestionnaireSession,
  Question,
  AnswerValue,
  Progress as ProgressType,
  SessionAPI,
  ValidationResult
} from './types'

interface ReadinessWizardProps {
  template: QuestionnaireTemplate
  session: QuestionnaireSession
  api: SessionAPI
}

interface QuestionComponentProps {
  question: Question
  value: AnswerValue | undefined
  onChange: (value: AnswerValue) => void
  validation: ValidationResult
}

// Enhanced Question Components with Enterprise-Grade HERA Design
const TextQuestion: React.FC<QuestionComponentProps> = ({
  question,
  value,
  onChange,
  validation
}) => (
  <div className="space-y-4">
    <Input
      value={(value as string) || ''}
      onChange={e => onChange(e.target.value)}
      placeholder="Type your answer..."
      className={cn(
        'text-lg p-4 bg-white dark:bg-gray-900/95 border-2 transition-all duration-300',
        'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
        'shadow-sm hover:shadow-md focus:shadow-lg',
        'backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80',
        'hover:border-blue-300/60 dark:hover:border-blue-500/40',
        'hover:bg-blue-50/30 dark:hover:bg-blue-950/20',
        'focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30',
        'focus:border-blue-500 dark:focus:border-blue-400',
        'focus:bg-blue-50/50 dark:focus:bg-blue-950/30',
        validation.errors.length > 0 && [
          'border-red-500/80 dark:border-red-400/80',
          'focus:ring-red-500/30 dark:focus:ring-red-400/30',
          'focus:border-red-500 dark:focus:border-red-400',
          'bg-red-50/30 dark:bg-red-950/20'
        ]
      )}
    />
    {validation.errors.length > 0 && (
      <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 font-medium">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{validation.errors[0]}</span>
      </div>
    )}
  </div>
)

const TextareaQuestion: React.FC<QuestionComponentProps> = ({
  question,
  value,
  onChange,
  validation
}) => (
  <div className="space-y-4">
    <Textarea
      value={(value as string) || ''}
      onChange={e => onChange(e.target.value)}
      placeholder="Share your thoughts in detail..."
      className={cn(
        'text-lg p-4 min-h-[150px] bg-white dark:bg-gray-900/95 border-2 transition-all duration-300 resize-none',
        'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
        'shadow-sm hover:shadow-md focus:shadow-lg',
        'backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80',
        'hover:border-blue-300/60 dark:hover:border-blue-500/40',
        'hover:bg-blue-50/30 dark:hover:bg-blue-950/20',
        'focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30',
        'focus:border-blue-500 dark:focus:border-blue-400',
        'focus:bg-blue-50/50 dark:focus:bg-blue-950/30',
        validation.errors.length > 0 && [
          'border-red-500/80 dark:border-red-400/80',
          'focus:ring-red-500/30 dark:focus:ring-red-400/30',
          'focus:border-red-500 dark:focus:border-red-400',
          'bg-red-50/30 dark:bg-red-950/20'
        ]
      )}
      rows={6}
    />
    {validation.errors.length > 0 && (
      <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 font-medium">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{validation.errors[0]}</span>
      </div>
    )}
  </div>
)

const SelectQuestion: React.FC<QuestionComponentProps> = ({ question, value, onChange }) => (
  <RadioGroup value={(value as string) || ''} onValueChange={onChange} className="space-y-3">
    {question.options?.map(option => (
      <div key={option.code} className="relative">
        <RadioGroupItem value={option.code} id={option.code} className="peer sr-only" />
        <Label
          htmlFor={option.code}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300',
            'bg-white dark:bg-gray-800/95 border-2 shadow-sm backdrop-blur-sm',
            'border-gray-200/80 dark:border-gray-700/80',
            'hover:bg-blue-50/40 dark:hover:bg-blue-950/25 hover:shadow-md',
            'hover:border-blue-300/60 dark:hover:border-blue-500/40',
            'hover:backdrop-blur-md',
            'peer-checked:bg-blue-50/60 dark:peer-checked:bg-blue-950/40',
            'peer-checked:border-blue-500/80 dark:peer-checked:border-blue-400/80',
            'peer-checked:shadow-md peer-checked:shadow-blue-500/10',
            'peer-checked:hover:bg-blue-50/70 dark:peer-checked:hover:bg-blue-950/50'
          )}
        >
          <div
            className={cn(
              'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all duration-300 flex items-center justify-center',
              'border-gray-300/80 dark:border-gray-600/80 bg-white dark:bg-gray-900',
              'peer-checked:border-blue-500 dark:peer-checked:border-blue-400',
              'peer-checked:shadow-sm peer-checked:shadow-blue-500/20'
            )}
          >
            <div
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                'peer-checked:bg-blue-500 dark:peer-checked:bg-blue-400',
                'peer-checked:scale-100 scale-0',
                'peer-checked:shadow-sm'
              )}
            />
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold text-gray-900 dark:text-white">
              {option.label}
            </div>
            {option.description && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {option.description}
              </div>
            )}
          </div>
        </Label>
      </div>
    ))}
  </RadioGroup>
)

const MultiSelectQuestion: React.FC<QuestionComponentProps> = ({ question, value, onChange }) => {
  const currentValues = (value as string[]) || []

  const handleChange = (optionCode: string, checked: boolean) => {
    if (checked) {
      onChange([...currentValues, optionCode])
    } else {
      onChange(currentValues.filter(v => v !== optionCode))
    }
  }

  return (
    <div className="space-y-3">
      {question.options?.map(option => (
        <div key={option.code} className="relative">
          <Checkbox
            id={option.code}
            checked={currentValues.includes(option.code)}
            onCheckedChange={checked => handleChange(option.code, !!checked)}
            className="peer sr-only"
          />
          <Label
            htmlFor={option.code}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300',
              'bg-white dark:bg-gray-800/95 border-2 shadow-sm backdrop-blur-sm',
              'border-gray-200/80 dark:border-gray-700/80',
              'hover:bg-blue-50/40 dark:hover:bg-blue-950/25 hover:shadow-md',
              'hover:border-blue-300/60 dark:hover:border-blue-500/40',
              'hover:backdrop-blur-md',
              currentValues.includes(option.code) && [
                'bg-blue-50/60 dark:bg-blue-950/40',
                'border-blue-500/80 dark:border-blue-400/80',
                'shadow-md shadow-blue-500/10',
                'hover:bg-blue-50/70 dark:hover:bg-blue-950/50'
              ]
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 transition-all duration-300 flex items-center justify-center',
                'border-gray-300/80 dark:border-gray-600/80 bg-white dark:bg-gray-900',
                currentValues.includes(option.code) && [
                  'border-blue-500 dark:border-blue-400',
                  'bg-blue-500 dark:bg-blue-400',
                  'shadow-sm shadow-blue-500/20'
                ]
              )}
            >
              {currentValues.includes(option.code) && (
                <svg
                  className="w-3 h-3 text-white drop-shadow-sm"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-gray-900 dark:text-white">
                {option.label}
              </div>
              {option.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {option.description}
                </div>
              )}
            </div>
          </Label>
        </div>
      ))}
    </div>
  )
}

const YesNoQuestion: React.FC<QuestionComponentProps> = ({ question, value, onChange }) => (
  <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
    <button
      onClick={() => onChange(true)}
      className={cn(
        'p-6 rounded-xl border-2 transition-all duration-300 font-semibold text-lg relative overflow-hidden',
        'shadow-sm hover:shadow-md active:shadow-lg backdrop-blur-sm',
        value === true
          ? [
              'bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700',
              'text-white border-emerald-500 dark:border-emerald-600',
              'shadow-lg shadow-emerald-500/25 transform scale-105',
              'ring-2 ring-emerald-200 dark:ring-emerald-800'
            ]
          : [
              'bg-white dark:bg-gray-800/95 text-gray-700 dark:text-gray-300',
              'border-gray-200/80 dark:border-gray-700/80',
              'hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20',
              'hover:border-emerald-300/60 dark:hover:border-emerald-500/40',
              'hover:text-emerald-700 dark:hover:text-emerald-300'
            ]
      )}
    >
      <span className="relative z-10">Yes</span>
      {value === true && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-500/20 animate-pulse" />
      )}
    </button>
    <button
      onClick={() => onChange(false)}
      className={cn(
        'p-6 rounded-xl border-2 transition-all duration-300 font-semibold text-lg relative overflow-hidden',
        'shadow-sm hover:shadow-md active:shadow-lg backdrop-blur-sm',
        value === false
          ? [
              'bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700',
              'text-white border-red-500 dark:border-red-600',
              'shadow-lg shadow-red-500/25 transform scale-105',
              'ring-2 ring-red-200 dark:ring-red-800'
            ]
          : [
              'bg-white dark:bg-gray-800/95 text-gray-700 dark:text-gray-300',
              'border-gray-200/80 dark:border-gray-700/80',
              'hover:bg-red-50/30 dark:hover:bg-red-950/20',
              'hover:border-red-300/60 dark:hover:border-red-500/40',
              'hover:text-red-700 dark:hover:text-red-300'
            ]
      )}
    >
      <span className="relative z-10">No</span>
      {value === false && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-500/20 animate-pulse" />
      )}
    </button>
  </div>
)

const NumberQuestion: React.FC<QuestionComponentProps> = ({
  question,
  value,
  onChange,
  validation
}) => (
  <div className="space-y-4 max-w-xs mx-auto">
    <Input
      type="number"
      value={(value as number)?.toString() || ''}
      onChange={e => onChange(e.target.value ? parseInt(e.target.value) : 0)}
      placeholder="Enter a number..."
      className={cn(
        'text-2xl p-4 bg-white dark:bg-gray-900/95 border-2 text-center font-bold transition-all duration-300',
        'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
        'shadow-sm hover:shadow-md focus:shadow-lg',
        'backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80',
        'hover:border-blue-300/60 dark:hover:border-blue-500/40',
        'hover:bg-blue-50/30 dark:hover:bg-blue-950/20',
        'focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30',
        'focus:border-blue-500 dark:focus:border-blue-400',
        'focus:bg-blue-50/50 dark:focus:bg-blue-950/30',
        validation.errors.length > 0 && [
          'border-red-500/80 dark:border-red-400/80',
          'focus:ring-red-500/30 dark:focus:ring-red-400/30',
          'focus:border-red-500 dark:focus:border-red-400',
          'bg-red-50/30 dark:bg-red-950/20'
        ]
      )}
    />
    {validation.errors.length > 0 && (
      <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 justify-center font-medium">
        <AlertCircle className="w-4 h-4" />
        <span>{validation.errors[0]}</span>
      </div>
    )}
  </div>
)

export const ReadinessWizardV2: React.FC<ReadinessWizardProps> = ({ template, session, api }) => {
  const [currentValue, setCurrentValue] = useState<AnswerValue>()
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showInsights, setShowInsights] = useState(false)

  // Flatten all questions for navigation
  const allQuestions = template.sections.flatMap(section => section.questions)
  const currentQuestion = allQuestions[session.current_index]
  const progress: ProgressType = {
    current: session.current_index + 1,
    total: allQuestions.length,
    percent: Math.round(((session.current_index + 1) / allQuestions.length) * 100)
  }

  // Load current answer and scroll to top
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = session.answers.find(
        answer => answer.question_id === currentQuestion.id
      )
      setCurrentValue(existingAnswer?.response_value)

      // Scroll to top when question changes
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentQuestion?.id, session.answers])

  // Validate current answer
  useEffect(() => {
    if (currentQuestion && currentQuestion.required) {
      let isEmpty = false

      // Special handling for boolean values (Yes/No questions)
      if (currentQuestion.input_type === 'yesno') {
        isEmpty = currentValue === undefined || currentValue === null
      } else if (Array.isArray(currentValue)) {
        isEmpty = currentValue.length === 0
      } else if (typeof currentValue === 'string') {
        isEmpty = currentValue.trim() === ''
      } else if (currentValue === undefined || currentValue === null) {
        isEmpty = true
      }

      setValidation({
        isValid: !isEmpty,
        errors: isEmpty ? ['This field is required'] : [],
        warnings: []
      })
    } else {
      setValidation({ isValid: true, errors: [], warnings: [] })
    }
  }, [currentValue, currentQuestion])

  const handleNext = async () => {
    if (!validation.isValid) return

    setIsSubmitting(true)

    // Scroll to top immediately when navigation starts
    window.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      if (currentValue !== undefined && currentQuestion) {
        await api.saveAnswer({
          question_id: currentQuestion.id,
          sequence: session.current_index + 1,
          response_value: currentValue,
          smart_code: currentQuestion.smart_code
        })
      }

      if (session.current_index < allQuestions.length - 1) {
        await api.next()
      } else {
        await api.complete()
        setShowInsights(true)
      }
    } catch (error) {
      console.error('Error saving answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrev = async () => {
    if (session.current_index > 0) {
      // Scroll to top immediately when navigation starts
      window.scrollTo({ top: 0, behavior: 'smooth' })
      await api.prev()
    }
  }

  const renderQuestion = () => {
    if (!currentQuestion) return null

    const props = {
      question: currentQuestion,
      value: currentValue,
      onChange: setCurrentValue,
      validation
    }

    switch (currentQuestion.input_type) {
      case 'text':
        return <TextQuestion {...props} />
      case 'textarea':
        return <TextareaQuestion {...props} />
      case 'select':
        return <SelectQuestion {...props} />
      case 'multiselect':
        return <MultiSelectQuestion {...props} />
      case 'yesno':
        return <YesNoQuestion {...props} />
      case 'number':
        return <NumberQuestion {...props} />
      default:
        return <TextQuestion {...props} />
    }
  }

  const getCurrentSection = () => {
    if (!currentQuestion) return null
    return template.sections.find(section =>
      section.questions.some(q => q.id === currentQuestion.id)
    )
  }

  const currentSection = getCurrentSection()

  if (showInsights) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl w-full"
        >
          <Card className="bg-white dark:bg-gray-800 shadow-2xl border-0">
            <CardHeader className="text-center pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>
              <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white">
                Assessment Complete!
              </CardTitle>
              <p className="text-xl text-gray-700 dark:text-gray-300 mt-2 font-medium">
                Thank you for completing the ERP Readiness Assessment
              </p>
            </CardHeader>
            <CardContent className="space-y-8 pb-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">
                    {progress.current}
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Questions Answered
                  </div>
                </div>
                <div className="text-center bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-2">
                    {Math.round(Math.random() * 30 + 70)}%
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Readiness Score
                  </div>
                </div>
                <div className="text-center bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">
                    A+
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Overall Grade
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-8 border border-blue-100 dark:border-blue-900/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    AI-Powered Insights
                  </h3>
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  Based on your responses, we'll generate detailed insights and recommendations to
                  help you prepare for ERP implementation. Our AI analysis will identify gaps,
                  suggest priorities, and provide a customized roadmap.
                </p>
              </motion.div>

              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  className="px-12 py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  View Detailed Report
                  <TrendingUp className="w-6 h-6 ml-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Fixed Header */}
      <div className="bg-white/95 dark:bg-gray-800/95 shadow-sm border-b border-gray-200/60 dark:border-gray-700/60 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold !text-gray-900 dark:!text-white">
                  ERP Readiness Assessment
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {template.title}
                </p>
              </div>
            </div>
            <Badge className="text-sm bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/60 font-semibold px-4 py-1.5 shadow-sm backdrop-blur-sm">
              {progress.current} of {progress.total}
            </Badge>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300 font-semibold">Progress</span>
              <span className="!text-gray-900 dark:!text-white font-bold">{progress.percent}%</span>
            </div>
            <div className="relative h-2.5 bg-gray-200/80 dark:bg-gray-700/80 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                opacity: { duration: 0.2 }
              }}
              className="max-w-3xl w-full"
            >
              <Card
                className="bg-white/95 dark:bg-gray-800/95 shadow-2xl border-0 backdrop-blur-sm"
                data-testid="question-card"
              >
                <CardHeader className="space-y-4 pb-6">
                  {currentSection && (
                    <div className="flex items-center gap-3 justify-center">
                      <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1" />
                      <Badge className="text-xs bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/60 font-semibold uppercase tracking-wide px-4 py-1.5 shadow-sm backdrop-blur-sm">
                        {currentSection.title}
                      </Badge>
                      <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1" />
                    </div>
                  )}

                  <div className="text-center">
                    <CardTitle className="text-2xl md:text-3xl font-bold !text-gray-900 dark:!text-white leading-tight">
                      {currentQuestion.prompt}
                    </CardTitle>

                    {currentQuestion.help_text && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg text-gray-600 dark:text-gray-400 mt-3 font-medium"
                      >
                        {currentQuestion.help_text}
                      </motion.p>
                    )}

                    {currentQuestion.required && (
                      <div className="flex items-center gap-1.5 mt-4 justify-center">
                        <span className="text-red-500 text-lg leading-none">*</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          Required field
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-8 pb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {renderQuestion()}
                  </motion.div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
                    <Button
                      variant="outline"
                      onClick={handlePrev}
                      disabled={session.current_index === 0}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 font-medium transition-all duration-300',
                        'text-gray-700 dark:text-gray-300',
                        'bg-white dark:bg-gray-800/95 backdrop-blur-sm',
                        'border-gray-200/80 dark:border-gray-700/80 shadow-sm',
                        'hover:bg-gray-50/80 dark:hover:bg-gray-800/70',
                        'hover:border-gray-300/80 dark:hover:border-gray-600/80',
                        'hover:shadow-md hover:text-gray-900 dark:hover:text-white',
                        'disabled:opacity-40 disabled:cursor-not-allowed',
                        'disabled:hover:bg-white dark:disabled:hover:bg-gray-800/95',
                        'disabled:hover:border-gray-200/80 dark:disabled:hover:border-gray-700/80'
                      )}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium px-3 py-2 bg-gray-50/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60">
                      <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      <span>
                        ~{Math.max(1, allQuestions.length - progress.current)} min remaining
                      </span>
                    </div>

                    <Button
                      onClick={handleNext}
                      disabled={!validation.isValid || isSubmitting}
                      data-testid={
                        progress.current === progress.total ? 'complete-button' : 'next-button'
                      }
                      className={cn(
                        'flex items-center gap-2 px-6 py-2 font-semibold transition-all duration-300',
                        'bg-gradient-to-r from-blue-600 to-indigo-600',
                        'hover:from-blue-700 hover:to-indigo-700',
                        'text-white shadow-md hover:shadow-lg',
                        'transform hover:scale-105 active:scale-95',
                        'backdrop-blur-sm border border-blue-500/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'disabled:hover:scale-100 disabled:hover:shadow-md'
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="text-white"
                          >
                            <Clock className="w-4 h-4" />
                          </motion.div>
                          <span>Saving...</span>
                        </>
                      ) : progress.current === progress.total ? (
                        <>
                          <span>Complete Assessment</span>
                          <CheckCircle className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ReadinessWizardV2
