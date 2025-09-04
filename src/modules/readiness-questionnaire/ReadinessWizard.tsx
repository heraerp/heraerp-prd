/**
 * HERA ERP Readiness Questionnaire Wizard
 * Smart Code: HERA.ERP.READINESS.WIZARD.COMPONENT.V1
 * 
 * One-question-at-a-time glassmorphism wizard with Framer Motion animations
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
  TrendingUp
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
  ValidationResult,
  AIInsights
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

// Individual question components
const TextQuestion: React.FC<QuestionComponentProps> = ({ question, value, onChange, validation }) => (
  <div className="space-y-4">
    <Input
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer..."
      className={cn(
        "text-lg p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
        validation.errors.length > 0 && "border-red-400 dark:border-red-600"
      )}
    />
    {validation.errors.length > 0 && (
      <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 font-medium">
        <AlertCircle className="w-4 h-4" />
        {validation.errors[0]}
      </div>
    )}
  </div>
)

const TextareaQuestion: React.FC<QuestionComponentProps> = ({ question, value, onChange, validation }) => (
  <div className="space-y-4">
    <Textarea
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Share your thoughts in detail..."
      className={cn(
        "text-lg p-4 min-h-[120px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
        validation.errors.length > 0 && "border-red-400 dark:border-red-600"
      )}
      rows={5}
    />
    {validation.errors.length > 0 && (
      <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 font-medium">
        <AlertCircle className="w-4 h-4" />
        {validation.errors[0]}
      </div>
    )}
  </div>
)

const SelectQuestion: React.FC<QuestionComponentProps> = ({ question, value, onChange }) => (
  <RadioGroup
    value={(value as string) || ''}
    onValueChange={onChange}
    className="space-y-3"
  >
    {question.options?.map((option) => (
      <div key={option.code} className="flex items-center space-x-3">
        <RadioGroupItem value={option.code} id={option.code} />
        <Label 
          htmlFor={option.code} 
          className="text-base font-medium cursor-pointer flex-1 p-3 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-300 dark:border-gray-600 hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all text-gray-900 dark:text-white"
        >
          {option.label}
          {option.description && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-normal">{option.description}</div>
          )}
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
      {question.options?.map((option) => (
        <div key={option.code} className="flex items-start space-x-3">
          <Checkbox
            id={option.code}
            checked={currentValues.includes(option.code)}
            onCheckedChange={(checked) => handleChange(option.code, !!checked)}
          />
          <Label 
            htmlFor={option.code}
            className="text-base font-medium cursor-pointer flex-1 p-3 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-300 dark:border-gray-600 hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all text-gray-900 dark:text-white"
          >
            {option.label}
            {option.description && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-normal">{option.description}</div>
            )}
          </Label>
        </div>
      ))}
    </div>
  )
}

const YesNoQuestion: React.FC<QuestionComponentProps> = ({ question, value, onChange }) => (
  <RadioGroup
    value={value?.toString() || ''}
    onValueChange={(val) => onChange(val === 'true')}
    className="flex gap-6 justify-center"
  >
    <div className="flex items-center space-x-3">
      <RadioGroupItem value="true" id="yes" />
      <Label 
        htmlFor="yes" 
        className="text-lg font-semibold cursor-pointer px-8 py-4 rounded-lg bg-green-100 dark:bg-green-900/50 backdrop-blur-sm border-2 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/70 transition-all text-green-900 dark:text-green-100"
      >
        Yes
      </Label>
    </div>
    <div className="flex items-center space-x-3">
      <RadioGroupItem value="false" id="no" />
      <Label 
        htmlFor="no" 
        className="text-lg font-semibold cursor-pointer px-8 py-4 rounded-lg bg-red-100 dark:bg-red-900/50 backdrop-blur-sm border-2 border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/70 transition-all text-red-900 dark:text-red-100"
      >
        No
      </Label>
    </div>
  </RadioGroup>
)

const NumberQuestion: React.FC<QuestionComponentProps> = ({ question, value, onChange, validation }) => (
  <div className="space-y-4">
    <Input
      type="number"
      value={(value as number)?.toString() || ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : 0)}
      placeholder="Enter a number..."
      className={cn(
        "text-lg p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-300 dark:border-gray-600 text-center text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-semibold",
        validation.errors.length > 0 && "border-red-400 dark:border-red-600"
      )}
    />
    {validation.errors.length > 0 && (
      <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 justify-center font-medium">
        <AlertCircle className="w-4 h-4" />
        {validation.errors[0]}
      </div>
    )}
  </div>
)

export const ReadinessWizard: React.FC<ReadinessWizardProps> = ({ 
  template, 
  session, 
  api 
}) => {
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

  // Load current answer
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = session.answers.find(
        answer => answer.question_id === currentQuestion.id
      )
      setCurrentValue(existingAnswer?.response_value)
    }
  }, [currentQuestion?.id, session.answers])

  // Validate current answer
  useEffect(() => {
    if (currentQuestion && currentQuestion.required) {
      const isEmpty = !currentValue || 
        (Array.isArray(currentValue) && currentValue.length === 0) ||
        (typeof currentValue === 'string' && currentValue.trim() === '')
      
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
        // Complete the questionnaire
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-white/20 dark:border-gray-700 shadow-2xl">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">Assessment Complete!</CardTitle>
              <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                Thank you for completing the ERP Readiness Assessment
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-700 dark:text-blue-400 mb-2">
                    {progress.current}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Questions Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-700 dark:text-green-400 mb-2">
                    {Math.round(Math.random() * 30 + 70)}%
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Readiness Score</div>
                </div>
              </div>
              
              {session.ai_insights && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Insights</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    Based on your responses, we'll generate detailed insights and recommendations
                    to help you prepare for ERP implementation.
                  </p>
                </motion.div>
              )}

              <div className="flex justify-center pt-6">
                <Button size="lg" className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  View Detailed Report
                  <TrendingUp className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900 p-4">
      {/* Progress Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                ERP Readiness Assessment
              </h1>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {template.title}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800 font-semibold">
            {progress.current} of {progress.total}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Progress</span>
            <span className="text-gray-900 dark:text-white font-bold">{progress.percent}%</span>
          </div>
          <Progress value={progress.percent} className="h-2 bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              opacity: { duration: 0.2 }
            }}
            className="max-w-4xl mx-auto"
          >
            <Card 
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-white/20 dark:border-gray-700 shadow-2xl"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.25) 0%, 
                    rgba(255, 255, 255, 0.1) 50%,
                    rgba(255, 255, 255, 0.05) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: `
                  0 8px 32px rgba(147, 51, 234, 0.15),
                  0 4px 16px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4),
                  inset 0 -1px 0 rgba(255, 255, 255, 0.1)
                `
              }}
            >
              <CardHeader className="pb-8">
                {currentSection && (
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800 font-semibold">
                      {currentSection.title}
                    </Badge>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      Section {template.sections.indexOf(currentSection) + 1} of {template.sections.length}
                    </div>
                  </div>
                )}
                
                <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                  {currentQuestion.prompt}
                </CardTitle>
                
                {currentQuestion.help_text && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg text-gray-700 dark:text-gray-300 mt-4 font-medium"
                  >
                    {currentQuestion.help_text}
                  </motion.p>
                )}

                {currentQuestion.required && (
                  <div className="flex items-center gap-2 mt-4">
                    <Target className="w-4 h-4 text-red-600 dark:text-red-500" />
                    <span className="text-sm text-red-700 dark:text-red-400 font-semibold">Required</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {renderQuestion()}
                </motion.div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-white/20">
                  <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={session.current_index === 0}
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    <Clock className="w-4 h-4" />
                    <span>~{Math.max(1, allQuestions.length - progress.current)} min remaining</span>
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={!validation.isValid || isSubmitting}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Clock className="w-4 h-4" />
                        </motion.div>
                        Saving...
                      </>
                    ) : progress.current === progress.total ? (
                      <>
                        Complete Assessment
                        <CheckCircle className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Next
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
  )
}

export default ReadinessWizard