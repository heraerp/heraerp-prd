'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { format } from 'date-fns'
import { 
  BarChart3, 
  FileText, 
  Download, 
  RefreshCw,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  Search,
  Building,
  Sparkles,
  Target,
  Activity,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'

// Custom scrollbar styles for glassmorphism design
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.6);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.8);
  }
`

interface Session {
  id: string
  transaction_date: string
  transaction_status: string
  total_amount: number // Overall score
  metadata: {
    completionRate: number
    totalQuestions: number
    overallScore: number
    categoryScores: Record<string, { total: number; count: number; score: number }>
    user_email?: string
    industry_type?: string
    completed_at?: string
  }
  answers: any[]
  insights?: {
    overallScore: number
    readinessLevel: string
    strengths: string[]
    improvements: string[]
    recommendations: string[]
    categoryScores: Record<string, { score: number }>
  }
}

export default function ReadinessDashboardPage() {
  const { currentOrganization, isAuthenticated, isLoading } = useMultiOrgAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [filter, setFilter] = useState({ status: 'all', industry: 'all', search: '' })
  const [answerSearch, setAnswerSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const answersPerPage = 10
  
  // Mouse tracking for interactive background
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setMousePosition({ x, y })
      }
    }
    
    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove)
    }
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [])

  useEffect(() => {
    // Fetch sessions when component mounts (auth disabled for testing)
    fetchSessions()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      console.log('🎯 Selected session changed:', {
        id: selectedSession.id,
        status: selectedSession.transaction_status,
        answers_count: selectedSession.answers?.length || 0,
        has_insights: !!selectedSession.insights,
        metadata: selectedSession.metadata
      })
    }
  }, [selectedSession])

  const fetchSessions = async () => {
    const orgId = currentOrganization?.id || '550e8400-e29b-41d4-a716-446655440000'
    
    console.log('🔍 Fetching sessions for org:', orgId)
    setLoading(true)
    try {
      const response = await fetch(
        `/api/v1/readiness/sessions?organization_id=${orgId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
      
      console.log('📡 Sessions API response status:', response.status)
      
      if (!response.ok) throw new Error('Failed to fetch sessions')
      
      const data = await response.json()
      console.log('📊 Sessions API response data:', JSON.stringify(data, null, 2))
      console.log('📝 Found sessions:', data.data?.length || 0)
      
      // Log the first session details
      if (data.data?.length > 0) {
        console.log('🔍 First session details:', {
          id: data.data[0].id,
          status: data.data[0].transaction_status,
          answers_count: data.data[0].answers?.length || 0,
          metadata: data.data[0].metadata,
          insights: data.data[0].insights,
          answers_sample: data.data[0].answers?.slice(0, 2)
        })
      }
      
      setSessions(data.data || [])
      
      // Select first session by default
      if (data.data?.length > 0 && !selectedSession) {
        console.log('📌 Setting selected session:', data.data[0].id)
        setSelectedSession(data.data[0])
      }
      
      // Debug: Check if any sessions have answers
      const sessionsWithAnswers = data.data?.filter(s => s.answers?.length > 0) || []
      console.log(`📊 Sessions with answers: ${sessionsWithAnswers.length} out of ${data.data?.length || 0} total sessions`)
    } catch (error) {
      console.error('❌ Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSessions()
    setRefreshing(false)
  }

  const exportSession = (session: Session) => {
    const data = {
      session_id: session.id,
      date: session.transaction_date,
      status: session.transaction_status,
      overall_score: session.metadata.overallScore,
      readiness_level: session.insights?.readinessLevel,
      category_scores: session.metadata.categoryScores,
      insights: session.insights,
      answers: session.answers.map(a => ({
        question: a.description,
        answer: a.line_data?.answer_value,
        category: a.line_data?.category,
        score: a.unit_amount
      }))
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `readiness-report-${session.id}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const filteredSessions = sessions.filter(session => {
    if (filter.status !== 'all' && session.transaction_status !== filter.status) return false
    if (filter.industry !== 'all' && session.metadata.industry_type !== filter.industry) return false
    if (filter.search && !session.metadata.user_email?.toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

  // Calculate aggregate statistics
  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.transaction_status === 'completed').length,
    inProgress: sessions.filter(s => s.transaction_status === 'in_progress').length,
    avgScore: sessions.filter(s => s.transaction_status === 'completed')
      .reduce((sum, s) => sum + (s.metadata.overallScore || 0), 0) / 
      (sessions.filter(s => s.transaction_status === 'completed').length || 1)
  }

  // Authentication checks commented out for testing
  // Uncomment these blocks to re-enable authentication
  /*
  if (!isAuthenticated) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please log in to access the readiness dashboard.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No organization context found. Please select an organization.</AlertDescription>
      </Alert>
    )
  }
  */

  return (
    <>
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      
      <div 
        ref={containerRef}
        className="min-h-screen relative overflow-hidden"
        role="main"
        aria-label="ERP Readiness Assessment Dashboard"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(0, 0, 0, 0.95) 0%, 
              rgba(17, 24, 39, 0.95) 25%,
              rgba(31, 41, 55, 0.9) 50%,
              rgba(17, 24, 39, 0.95) 75%,
              rgba(0, 0, 0, 0.95) 100%
            ),
            radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
              rgba(59, 130, 246, 0.08) 0%, 
              rgba(147, 51, 234, 0.05) 25%,
              rgba(16, 185, 129, 0.03) 50%,
              transparent 70%
            ),
            #0a0a0a
          `
        }}
      >
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div 
          className="absolute w-96 h-96 rounded-full"
          animate={{
            x: mousePosition.x * 0.1,
            y: mousePosition.y * 0.1,
          }}
          transition={{ type: "spring", damping: 30 }}
          style={{
            background: `radial-gradient(circle, 
              rgba(59, 130, 246, 0.15) 0%, 
              rgba(59, 130, 246, 0.08) 30%, 
              rgba(59, 130, 246, 0.02) 60%, 
              transparent 100%
            )`,
            filter: 'blur(60px)',
            left: '20%',
            top: '10%',
          }}
        />
        
        <motion.div 
          className="absolute w-80 h-80 rounded-full"
          animate={{
            x: -mousePosition.x * 0.08,
            y: -mousePosition.y * 0.08,
          }}
          transition={{ type: "spring", damping: 40 }}
          style={{
            background: `radial-gradient(circle, 
              rgba(147, 51, 234, 0.12) 0%, 
              rgba(147, 51, 234, 0.06) 30%, 
              rgba(147, 51, 234, 0.02) 60%, 
              transparent 100%
            )`,
            filter: 'blur(70px)',
            right: '15%',
            top: '60%',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header 
          className="sticky top-0 z-50 border-b shadow-lg"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(17, 24, 39, 0.85) 0%, 
                rgba(31, 41, 55, 0.8) 50%,
                rgba(17, 24, 39, 0.85) 100%
              )
            `,
            backdropFilter: 'blur(20px) saturate(120%)',
            WebkitBackdropFilter: 'blur(20px) saturate(120%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
          }}
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg cursor-pointer"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(59, 130, 246, 0.15) 0%, 
                        rgba(147, 51, 234, 0.1) 100%
                      )
                    `,
                    backdropFilter: 'blur(20px) saturate(120%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <BarChart3 className="w-5 h-5 text-white drop-shadow-md" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold !text-white">
                    Readiness Analytics
                  </h1>
                  <p className="text-xs text-gray-700 dark:text-gray-200 font-medium">
                    ERP Assessment Dashboard
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg disabled:opacity-50 transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <RefreshCw className={cn("h-4 w-4 inline mr-2", refreshing && "animate-spin")} />
                  Refresh
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/readiness-questionnaire'}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(147, 51, 234, 0.8) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Sparkles className="h-4 w-4 inline mr-2" />
                  New Assessment
                </motion.button>
              </div>
            </div>
          </div>
        </header>

          <main id="main-content" className="p-4 sm:p-6 lg:p-8">

            {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card 
              className="relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-300"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(59, 130, 246, 0.1) 0%, 
                    rgba(59, 130, 246, 0.05) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(120%)',
                WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-400 mb-1">
                      Total Assessments
                    </p>
                    <p className="text-3xl font-bold !text-white">
                      {stats.total}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <BarChart3 className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card 
              className="relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-300"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(16, 185, 129, 0.1) 0%, 
                    rgba(16, 185, 129, 0.05) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(120%)',
                WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-400 mb-1">
                      Completed
                    </p>
                    <p className="text-3xl font-bold !text-white">
                      {stats.completed}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card 
              className="relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-300"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(251, 146, 60, 0.1) 0%, 
                    rgba(251, 146, 60, 0.05) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(120%)',
                WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                border: '1px solid rgba(251, 146, 60, 0.2)',
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-400 mb-1">
                      In Progress
                    </p>
                    <p className="text-3xl font-bold !text-white">
                      {stats.inProgress}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(251, 146, 60, 0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Activity className="h-6 w-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card 
              className="relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-300"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(147, 51, 234, 0.1) 0%, 
                    rgba(147, 51, 234, 0.05) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(120%)',
                WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                border: '1px solid rgba(147, 51, 234, 0.2)',
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-400 mb-1">
                      Average Score
                    </p>
                    <p className="text-3xl font-bold !text-white">
                      {Math.round(stats.avgScore)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(147, 51, 234, 0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Target className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card 
            className="mb-8 border-0 shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(20px) saturate(120%)',
              WebkitBackdropFilter: 'blur(20px) saturate(120%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by email..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="w-full pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-blue-500"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                    }}
                  />
                </div>
                <Select
                  value={filter.status}
                  onValueChange={(value) => setFilter({ ...filter, status: value })}
                >
                  <SelectTrigger 
                    className="w-[180px] bg-white/5 border-white/10 text-white"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="all" className="hera-select-item">All Status</SelectItem>
                    <SelectItem value="completed" className="hera-select-item">Completed</SelectItem>
                    <SelectItem value="in_progress" className="hera-select-item">In Progress</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filter.industry}
                  onValueChange={(value) => setFilter({ ...filter, industry: value })}
                >
                  <SelectTrigger 
                    className="w-[180px] bg-white/5 border-white/10 text-white"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <SelectValue placeholder="Filter by industry" />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="all" className="hera-select-item">All Industries</SelectItem>
                    <SelectItem value="general" className="hera-select-item">General</SelectItem>
                    <SelectItem value="manufacturing" className="hera-select-item">Manufacturing</SelectItem>
                    <SelectItem value="retail" className="hera-select-item">Retail</SelectItem>
                    <SelectItem value="healthcare" className="hera-select-item">Healthcare</SelectItem>
                    <SelectItem value="services" className="hera-select-item">Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-2 border-gray-700 border-t-transparent"
              style={{
                borderTopColor: 'rgba(59, 130, 246, 0.8)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 w-16 h-16 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              }}
            />
          </div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card 
            className="border-0 shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(20px) saturate(120%)',
              WebkitBackdropFilter: 'blur(20px) saturate(120%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(147, 51, 234, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(147, 51, 234, 0.2)',
                }}
              >
                <FileText className="h-10 w-10 text-purple-400 drop-shadow-md" />
              </div>
              <h3 className="text-xl font-bold !text-white mb-3">
                No assessments found
              </h3>
              <p className="text-gray-500 dark:text-gray-300 mb-6">
                Start by creating your first readiness assessment.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/readiness-questionnaire'}
                className="px-6 py-3 rounded-xl text-sm font-medium text-white shadow-lg transition-all inline-flex items-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Start New Assessment
              </motion.button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card 
              className="h-full border-0 shadow-2xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(20px) saturate(120%)',
                WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <CardHeader 
                className="border-b"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <CardTitle className="text-lg !text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  Assessment Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredSessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={cn(
                        "relative px-4 py-4 cursor-pointer transition-all duration-300",
                        selectedSession?.id === session.id
                          ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                          : "hover:bg-white/5"
                      )}
                      onClick={() => setSelectedSession(session)}
                      style={{
                        borderLeft: selectedSession?.id === session.id 
                          ? '3px solid rgba(59, 130, 246, 0.8)'
                          : '3px solid transparent'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold !text-white truncate pr-2">
                          {session.metadata.user_email || 'Unknown User'}
                        </span>
                        <Badge 
                          variant={session.transaction_status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs shrink-0"
                          style={{
                            background: session.transaction_status === 'completed' 
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(251, 146, 60, 0.2)',
                            color: session.transaction_status === 'completed'
                              ? '#10b981'
                              : '#fb923c',
                            border: `1px solid ${session.transaction_status === 'completed' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(251, 146, 60, 0.4)'}`
                          }}
                        >
                          {session.transaction_status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-800 dark:text-gray-100">
                          {format(new Date(session.transaction_date), 'MMM d, yyyy')}
                        </span>
                        {session.transaction_status === 'completed' && (
                          <span className="font-medium text-blue-400">
                            Score: {session.metadata.overallScore}%
                          </span>
                        )}
                      </div>
                      {session.transaction_status === 'in_progress' && (
                        <div className="mt-3">
                          <div className="relative h-1 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${session.metadata.completionRate}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500"
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Session Details */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            {selectedSession ? (
              <Card 
                className="h-full border-0 shadow-2xl overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <CardHeader
                  className="border-b"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl !text-white mb-1">Assessment Details</CardTitle>
                      <CardDescription className="text-gray-800 dark:text-gray-100">
                        {selectedSession.metadata.user_email} • {format(new Date(selectedSession.transaction_date), 'MMMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportSession(selectedSession)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg transition-all"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Download className="h-4 w-4 inline mr-2" />
                      Export
                    </motion.button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Tabs defaultValue="overview">
                    <TabsList 
                      className="grid grid-cols-3 w-full mb-6"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <TabsTrigger 
                        value="overview" 
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-white"
                        style={{ color: 'rgb(204, 251, 241)' }}
                      >
                        Overview
                      </TabsTrigger>
                      <TabsTrigger 
                        value="categories"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-white"
                        style={{ color: 'rgb(204, 251, 241)' }}
                      >
                        Categories
                      </TabsTrigger>
                      <TabsTrigger 
                        value="answers"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-white"
                        style={{ color: 'rgb(204, 251, 241)' }}
                      >
                        Answers
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                      {selectedSession.transaction_status === 'completed' ? (
                        <>
                          {/* Overall Score */}
                          <motion.div 
                            className="text-center py-8"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <div className="relative inline-flex items-center justify-center mb-4">
                              <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute w-32 h-32 rounded-full"
                                style={{
                                  background: `conic-gradient(
                                    from 0deg,
                                    rgba(59, 130, 246, 0.2) 0deg,
                                    rgba(147, 51, 234, 0.2) ${(selectedSession.metadata.overallScore || 0) * 3.6}deg,
                                    rgba(255, 255, 255, 0.05) ${(selectedSession.metadata.overallScore || 0) * 3.6}deg,
                                    rgba(255, 255, 255, 0.05) 360deg
                                  )`,
                                  filter: 'blur(20px)'
                                }}
                              />
                              <div className="relative text-6xl font-bold !text-white drop-shadow-2xl">
                                {selectedSession.metadata.overallScore || 0}%
                              </div>
                            </div>
                            <Badge 
                              className="text-sm px-4 py-2"
                              style={{
                                background: selectedSession.insights?.readinessLevel === 'High' 
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : selectedSession.insights?.readinessLevel === 'Medium'
                                  ? 'rgba(251, 146, 60, 0.2)'
                                  : 'rgba(239, 68, 68, 0.2)',
                                color: selectedSession.insights?.readinessLevel === 'High'
                                  ? '#10b981'
                                  : selectedSession.insights?.readinessLevel === 'Medium'
                                  ? '#fb923c'
                                  : '#ef4444',
                                border: `1px solid ${selectedSession.insights?.readinessLevel === 'High' ? 'rgba(16, 185, 129, 0.4)' : selectedSession.insights?.readinessLevel === 'Medium' ? 'rgba(251, 146, 60, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                              }}
                            >
                              {selectedSession.insights?.readinessLevel || 'Not Analyzed'} Readiness
                            </Badge>
                          </motion.div>
                        </>
                      ) : (
                        <motion.div 
                          className="text-center py-8"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                            style={{
                              background: 'rgba(251, 146, 60, 0.1)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(251, 146, 60, 0.2)',
                            }}
                          >
                            <Activity className="h-10 w-10 text-orange-400 drop-shadow-md" />
                          </div>
                          <h3 className="text-xl font-bold !text-white mb-3">
                            Assessment In Progress
                          </h3>
                          <p className="text-gray-500 dark:text-gray-300 mb-6">
                            This assessment is {selectedSession.metadata?.completionRate || 0}% complete
                          </p>
                          <div className="max-w-xs mx-auto mb-6">
                            <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${selectedSession.metadata?.completionRate || 0}%` }}
                                transition={{ duration: 0.8 }}
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-yellow-500"
                              />
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.href = '/readiness-questionnaire'}
                            className="px-6 py-3 rounded-xl text-sm font-medium text-white shadow-lg transition-all inline-flex items-center"
                            style={{
                              background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.8) 0%, rgba(245, 158, 11, 0.8) 100%)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Continue Assessment
                          </motion.button>
                        </motion.div>
                      )}

                      {/* Insights */}
                      {selectedSession.insights && (
                        <div className="space-y-6">
                          {selectedSession.insights.strengths.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="rounded-xl p-4"
                              style={{
                                background: 'rgba(16, 185, 129, 0.05)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                              }}
                            >
                              <h4 className="font-semibold text-green-400 mb-3 flex items-center">
                                <TrendingUp className="h-5 w-5 mr-2" />
                                Strengths
                              </h4>
                              <ul className="space-y-2">
                                {selectedSession.insights.strengths.map((s, i) => (
                                  <li key={i} className="flex items-center text-sm text-gray-300">
                                    <CheckCircle className="h-4 w-4 text-green-400 mr-2 shrink-0" />
                                    <span className="capitalize">{s.replace('_', ' ')}</span>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}

                          {selectedSession.insights.improvements.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="rounded-xl p-4"
                              style={{
                                background: 'rgba(251, 146, 60, 0.05)',
                                border: '1px solid rgba(251, 146, 60, 0.2)',
                              }}
                            >
                              <h4 className="font-semibold text-orange-400 mb-3 flex items-center">
                                <TrendingDown className="h-5 w-5 mr-2" />
                                Areas for Improvement
                              </h4>
                              <ul className="space-y-2">
                                {selectedSession.insights.improvements.map((s, i) => (
                                  <li key={i} className="flex items-center text-sm text-gray-300">
                                    <AlertCircle className="h-4 w-4 text-orange-400 mr-2 shrink-0" />
                                    <span className="capitalize">{s.replace('_', ' ')}</span>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}

                          {selectedSession.insights.recommendations.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              className="rounded-xl p-4"
                              style={{
                                background: 'rgba(59, 130, 246, 0.05)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                              }}
                            >
                              <h4 className="font-semibold text-blue-400 mb-3 flex items-center">
                                <Zap className="h-5 w-5 mr-2" />
                                Recommendations
                              </h4>
                              <ul className="space-y-3">
                                {selectedSession.insights.recommendations.map((r, i) => (
                                  <li key={i} className="flex items-start text-sm text-gray-300">
                                    <Target className="h-4 w-4 text-blue-400 mr-2 shrink-0 mt-0.5" />
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="categories">
                      <div className="space-y-4">
                        {selectedSession.metadata?.categoryScores && Object.keys(selectedSession.metadata.categoryScores).length > 0 ? (
                          Object.entries(selectedSession.metadata.categoryScores).map(([category, data], index) => (
                          <motion.div 
                            key={category}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="rounded-xl p-4"
                            style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold capitalize !text-white">
                                {category.replace('_', ' ')}
                              </span>
                              <span className="text-sm font-bold"
                                style={{
                                  color: data.score >= 80 ? '#10b981' : data.score >= 60 ? '#fb923c' : '#ef4444'
                                }}
                              >
                                {data.score}%
                              </span>
                            </div>
                            <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${data.score}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                                className="absolute inset-y-0 left-0"
                                style={{
                                  background: `linear-gradient(90deg, 
                                    ${data.score >= 80 ? 'rgba(16, 185, 129, 0.8)' : data.score >= 60 ? 'rgba(251, 146, 60, 0.8)' : 'rgba(239, 68, 68, 0.8)'} 0%, 
                                    ${data.score >= 80 ? 'rgba(16, 185, 129, 0.4)' : data.score >= 60 ? 'rgba(251, 146, 60, 0.4)' : 'rgba(239, 68, 68, 0.4)'} 100%
                                  )`
                                }}
                              />
                            </div>
                          </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-300">No category scores available</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="answers">
                      {/* Search and pagination controls */}
                      <div className="mb-4 space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Search questions..."
                            value={answerSearch}
                            onChange={(e) => {
                              setAnswerSearch(e.target.value)
                              setCurrentPage(1)
                            }}
                            className="pl-10 bg-white/5 border-white/10 text-gray-900 dark:text-white placeholder-gray-500"
                            aria-label="Search answers"
                          />
                        </div>
                        {selectedSession.answers && selectedSession.answers.length > 0 && (
                          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>
                              Total: {selectedSession.answers.length} questions ({selectedSession.answers.filter(a => a.line_data?.answer_value === 'yes').length} Yes, {selectedSession.answers.filter(a => a.line_data?.answer_value === 'partial').length} Partial, {selectedSession.answers.filter(a => a.line_data?.answer_value === 'no').length} No)
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {selectedSession.answers && selectedSession.answers.length > 0 ? (
                          (() => {
                            // Filter answers based on search
                            const filteredAnswers = selectedSession.answers.filter((answer) => {
                              if (!answerSearch) return true
                              const searchLower = answerSearch.toLowerCase()
                              return (
                                answer.description?.toLowerCase().includes(searchLower) ||
                                answer.line_data?.category?.toLowerCase().includes(searchLower) ||
                                answer.line_data?.answer_value?.toLowerCase().includes(searchLower)
                              )
                            })
                            
                            // Paginate filtered results
                            const totalPages = Math.ceil(filteredAnswers.length / answersPerPage)
                            const startIndex = (currentPage - 1) * answersPerPage
                            const paginatedAnswers = filteredAnswers.slice(startIndex, startIndex + answersPerPage)
                            
                            return (
                              <>
                                {paginatedAnswers.map((answer, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-xl p-4 hover:shadow-lg transition-shadow"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                            }}
                            role="article"
                            aria-labelledby={`answer-${index}`}
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3" aria-label={`Question: ${answer.description}`}>
                              {answer.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge 
                                className="text-xs font-semibold"
                                aria-label={`Answer: ${answer.line_data?.answer_value || 'Unknown'}`}
                                style={{
                                  background: answer.line_data?.answer_value === 'yes' 
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : answer.line_data?.answer_value === 'partial'
                                    ? 'rgba(251, 146, 60, 0.2)'
                                    : 'rgba(239, 68, 68, 0.2)',
                                  color: answer.line_data?.answer_value === 'yes'
                                    ? '#10b981'
                                    : answer.line_data?.answer_value === 'partial'
                                    ? '#fb923c'
                                    : '#ef4444',
                                  border: `1px solid ${answer.line_data?.answer_value === 'yes' ? 'rgba(16, 185, 129, 0.4)' : answer.line_data?.answer_value === 'partial' ? 'rgba(251, 146, 60, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                                }}
                              >
                                {answer.line_data?.answer_value || 'Unknown'}
                              </Badge>
                              <span className="text-xs text-gray-900 dark:text-white capitalize" aria-label={`Category: ${answer.line_data?.category || 'General'}`}>
                                {answer.line_data?.category || 'General'}
                              </span>
                            </div>
                          </motion.div>
                                ))}
                                
                                {/* Pagination controls */}
                                {filteredAnswers.length > answersPerPage && (
                                  <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                                      <span className="font-medium">
                                        {Math.min(startIndex + answersPerPage, filteredAnswers.length)}
                                      </span>{' '}
                                      of <span className="font-medium">{filteredAnswers.length}</span> results
                                    </p>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                                        aria-label="Previous page"
                                      >
                                        Previous
                                      </Button>
                                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = i + 1
                                        return (
                                          <Button
                                            key={pageNum}
                                            variant={pageNum === currentPage ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setCurrentPage(pageNum)}
                                            aria-label={`Go to page ${pageNum}`}
                                            aria-current={pageNum === currentPage ? 'page' : undefined}
                                            className={pageNum === currentPage 
                                              ? "" 
                                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                                            }
                                          >
                                            {pageNum}
                                          </Button>
                                        )
                                      })}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                                        aria-label="Next page"
                                      >
                                        Next
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )
                          })()
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                              style={{
                                background: 'rgba(251, 146, 60, 0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(251, 146, 60, 0.2)',
                              }}
                            >
                              <AlertCircle className="h-8 w-8 text-orange-400" />
                            </div>
                            <p className="text-gray-300 font-medium mb-2">No answers recorded yet</p>
                            <p className="text-gray-400 text-sm">
                              {selectedSession.transaction_status === 'in_progress' 
                                ? 'This assessment is still in progress. Answers will appear here as they are submitted.'
                                : 'No answers were recorded for this assessment.'}
                            </p>
                            {selectedSession.transaction_status === 'in_progress' && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => window.location.href = `/readiness-questionnaire?sessionId=${selectedSession.id}`}
                                className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-lg transition-all inline-flex items-center"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.8) 0%, rgba(239, 68, 68, 0.8) 100%)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                }}
                              >
                                <Activity className="h-4 w-4 mr-2" />
                                Continue Assessment
                              </motion.button>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card 
                className="h-full flex items-center justify-center border-0 shadow-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(147, 51, 234, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(147, 51, 234, 0.2)',
                    }}
                  >
                    <FileText className="h-10 w-10 text-purple-400 drop-shadow-md" />
                  </div>
                  <p className="text-gray-400 text-lg">
                    Select a session to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      )}
          </main>
        </div>
      
        {/* Custom scrollbar styles */}
        <style dangerouslySetInnerHTML={{
          __html: customScrollbarStyles
        }} />
      </div>
    </>
  )
}