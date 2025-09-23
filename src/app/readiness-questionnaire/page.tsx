/**
 * HERA ERP Readiness Questionnaire Page
 * Smart Code: HERA.ERP.READINESS.PAGE.V1
 *
 * Main page hosting the ERP Readiness Questionnaire wizard
 */

'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Clock,
  Users,
  CheckCircle,
  ArrowLeft,
  Lightbulb,
  Target,
  Zap,
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { ReadinessWizardV2 as ReadinessWizard } from '@/modules/readiness-questionnaire/ReadinessWizardV2'
import { createReadinessTemplate } from '@/modules/readiness-questionnaire/template'
import type {
  QuestionnaireTemplate,
  QuestionnaireSession,
  SessionAPI
} from '@/modules/readiness-questionnaire/types'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useToast } from '@/hooks/use-toast'

export default function ReadinessQuestionnairePage() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, contextLoading  } = useHERAAuth()
  const { toast } = useToast()
  const [showWizard, setShowWizard] = useState(false)
  const [template, setTemplate] = useState<QuestionnaireTemplate | null>(null)
  const [session, setSession] = useState<QuestionnaireSession | null>(null)
  const [loading, setLoading] = useState(false)

  const organizationId = currentOrganization?.id || '550e8400-e29b-41d4-a716-446655440000'

  useEffect(() => {
    // Initialize template
    const readinessTemplate = createReadinessTemplate(organizationId)
    setTemplate(readinessTemplate)
  }, [organizationId])

  const startAssessment = async () => {
    if (!template) return

    setLoading(true)
    try {
      // Create session via API
      const response = await fetch('/api/v1/readiness/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          template_id: template.id,
          industry_type: 'general' // Can be made dynamic based on org type
        })
      })

      if (!response.ok) throw new Error('Failed to create session')

      const data = await response.json()
      console.log('API Response:', JSON.stringify(data, null, 2))
      console.log('data.data:', JSON.stringify(data.data, null, 2))
      console.log('data.data.id:', data.data?.id)

      // Ensure data structure exists
      if (!data || !data.data || !data.data.id) {
        console.error('Invalid response structure:', data)
        console.error('data.data exists?', !!data.data)
        console.error('data.data.id exists?', !!data.data?.id)
        throw new Error('Invalid response format: missing session data')
      }

      const newSession: QuestionnaireSession = {
        id: data.data.id,
        organization_id: organizationId,
        respondent_id: 'demo-user',
        template_id: template.id,
        status: 'IN_PROGRESS',
        started_at: data.data.transaction_date || new Date().toISOString(),
        current_index: 0,
        smart_code: 'HERA.ERP.Readiness.Session.Transaction.V1',
        answers: []
      }

      setSession(newSession)
      setShowWizard(true)
    } catch (error) {
      console.error('Error starting assessment:', error)
      toast({
        title: 'Error',
        description: 'Failed to start assessment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Real API implementation
  const createSessionAPI = (session: QuestionnaireSession): SessionAPI => ({
    saveAnswer: async line => {
      try {
        // Save answer via API
        const response = await fetch(`/api/v1/readiness/sessions/${session.id}/answers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            question_id: line.question_id,
            question_text: `Question ${line.sequence}`, // Fallback text
            answer_value: line.response_value,
            answer_type: 'questionnaire_answer', // Default type
            category: 'readiness_assessment',
            organization_id: organizationId
          })
        })

        if (!response.ok) throw new Error('Failed to save answer')

        // Update local state
        setSession(prev => {
          if (!prev) return prev

          const existingIndex = prev.answers.findIndex(a => a.question_id === line.question_id)
          const newAnswers = [...prev.answers]

          if (existingIndex >= 0) {
            newAnswers[existingIndex] = line
          } else {
            newAnswers.push(line)
          }

          return { ...prev, answers: newAnswers }
        })
      } catch (error) {
        console.error('Failed to save answer:', error)
        toast({
          title: 'Error',
          description: 'Failed to save answer. Please try again.',
          variant: 'destructive'
        })
      }
    },

    next: async () => {
      setSession(prev => {
        if (!prev || !template) return prev
        const allQuestions = template.sections.flatMap(s => s.questions)
        const nextIndex = Math.min(prev.current_index + 1, allQuestions.length - 1)
        return { ...prev, current_index: nextIndex }
      })
      return session
    },

    prev: async () => {
      setSession(prev => {
        if (!prev) return prev
        const prevIndex = Math.max(prev.current_index - 1, 0)
        return { ...prev, current_index: prevIndex }
      })
      return session
    },

    complete: async () => {
      if (!session) return session

      try {
        // Complete session and generate insights via API
        const response = await fetch(`/api/v1/readiness/sessions/${session.id}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            organization_id: organizationId
          })
        })

        if (!response.ok) throw new Error('Failed to complete session')

        const data = await response.json()

        setSession(prev => {
          if (!prev) return prev
          return {
            ...prev,
            status: 'COMPLETED',
            completed_at: new Date().toISOString(),
            ai_insights: data.data.insights
          }
        })

        toast({
          title: 'Assessment Complete!',
          description: 'Your readiness assessment has been saved.'
        })

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/readiness-dashboard')
        }, 2000)
      } catch (error) {
        console.error('Failed to complete session:', error)
        toast({
          title: 'Error',
          description: 'Failed to complete assessment. Please try again.',
          variant: 'destructive'
        })
      }

      return session
    }
  })

  // Authentication checks commented out for testing
  // Uncomment these blocks to re-enable authentication
  /*
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the readiness assessment.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No organization context found. Please select an organization.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  */

  if (showWizard && template && session) {
    return <ReadinessWizard template={template} session={session} api={createSessionAPI(session)} />
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-background">
      {/* Back Navigation */}
      <div className="container mx-auto px-4 pt-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-8 text-gray-700 dark:text-gray-300 hover:text-foreground dark:hover:text-foreground font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <BarChart3 className="w-10 h-10 text-foreground" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-100 dark:text-foreground mb-4">
              ERP Readiness Assessment
            </h1>

            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto font-medium">
              Discover how prepared your business is for ERP implementation with our comprehensive
              assessment tool.
            </p>
          </motion.div>

          {/* Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <Card
              className="bg-background dark:bg-muted shadow-2xl border-0"
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
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                      <Clock className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-gray-100 dark:text-foreground">
                      15 mins
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      Assessment Time
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                      <Target className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-gray-100 dark:text-foreground">
                      12 Sections
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      Business Areas
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                      <Lightbulb className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-gray-100 dark:text-foreground">
                      AI Insights
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      Smart Analysis
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <Lightbulb className="h-5 w-5 text-primary dark:text-blue-400" />
                  <AlertDescription className="text-gray-700 dark:text-gray-300 font-medium">
                    This assessment will evaluate your organization across 12 key areas including
                    sales, procurement, finance, HR, and technology readiness. You'll receive
                    personalized insights and recommendations.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>

          {/* Assessment Sections */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-100 dark:text-foreground mb-6 text-center">
              What We'll Assess
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Company Profile', icon: Users, color: 'from-blue-500 to-blue-600' },
                { title: 'Sales Management', icon: Target, color: 'from-green-500 to-green-600' },
                { title: 'Procurement', icon: Shield, color: 'from-purple-500 to-purple-600' },
                { title: 'Production', icon: Zap, color: 'from-orange-500 to-orange-600' },
                { title: 'Inventory', icon: CheckCircle, color: 'from-teal-500 to-teal-600' },
                {
                  title: 'Finance & Accounting',
                  icon: BarChart3,
                  color: 'from-indigo-500 to-indigo-600'
                }
              ].map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3 p-4 bg-background dark:bg-muted rounded-xl border border-border dark:border-border shadow-sm hover:shadow-md transition-all"
                >
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${section.color} rounded-lg flex items-center justify-center shadow-sm`}
                  >
                    <section.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="font-semibold text-gray-100 dark:text-foreground">
                    {section.title}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <Button
              size="lg"
              onClick={startAssessment}
              disabled={loading}
              className="px-12 py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-foreground font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mr-2"
                  >
                    <Clock className="w-5 h-5" />
                  </motion.div>
                  Starting Assessment...
                </>
              ) : (
                <>
                  Start Assessment
                  <BarChart3 className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-sm text-slate-500 dark:text-muted-foreground mt-4 font-medium">
              <span className="text-slate-700 dark:text-slate-300">Free assessment</span> •
              <span className="text-slate-700 dark:text-slate-300">No registration required</span> •
              <span className="text-slate-700 dark:text-slate-300">Instant results</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
