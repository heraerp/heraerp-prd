// HERA Universal Learning Platform - Universal UI Interface
// Complete UI for processing ANY educational content across all domains

'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Upload,
  Brain,
  Sparkles,
  Target,
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Eye,
  FileText,
  Zap
} from 'lucide-react'

interface UniversalLearningInterfaceProps {
  className?: string
}

interface ProcessingStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  duration?: number
  result?: any
}

interface UniversalProcessingResult {
  content_processing?: any
  ai_analysis?: any
  entity_creation?: any
  learning_paths?: any[]
  domain_specialization?: any
  cross_domain_intelligence?: any
  pipeline_summary?: any
}

const SUPPORTED_DOMAINS = [
  {
    value: 'CA',
    label: 'Chartered Accountancy',
    description: 'Professional accounting and finance'
  },
  { value: 'MED', label: 'Medical Education', description: 'Healthcare and clinical learning' },
  { value: 'LAW', label: 'Legal Education', description: 'Law and jurisprudence' },
  { value: 'ENG', label: 'Engineering', description: 'Technical and applied sciences' },
  { value: 'LANG', label: 'Language Learning', description: 'Linguistic and cultural education' },
  { value: 'GENERAL', label: 'General Education', description: 'Universal learning principles' }
]

const PROCESSING_STEPS: ProcessingStep[] = [
  {
    id: 'content_processing',
    name: 'Content Processing',
    description: 'Extracting universal learning elements from content',
    status: 'pending',
    progress: 0
  },
  {
    id: 'ai_analysis',
    name: 'AI Analysis',
    description: 'AI-powered analysis with multi-provider routing',
    status: 'pending',
    progress: 0
  },
  {
    id: 'entity_creation',
    name: 'Entity Creation',
    description: 'Converting to HERA 6-table architecture',
    status: 'pending',
    progress: 0
  },
  {
    id: 'learning_paths',
    name: 'Learning Paths',
    description: 'Generating adaptive learning paths',
    status: 'pending',
    progress: 0
  },
  {
    id: 'domain_specialization',
    name: 'Domain Specialization',
    description: 'Applying domain-specific enhancements',
    status: 'pending',
    progress: 0
  },
  {
    id: 'cross_domain_intelligence',
    name: 'Cross-Domain Intelligence',
    description: 'Generating cross-domain insights',
    status: 'pending',
    progress: 0
  }
]

export function UniversalLearningInterface({ className }: UniversalLearningInterfaceProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>('CA')
  const [content, setContent] = useState<string>(
    'The Chartered Accountancy profession requires understanding of financial statements, audit procedures, and tax compliance. Key concepts include materiality, professional skepticism, and ethical conduct. Auditors must maintain independence and apply professional judgment when evaluating evidence. Financial reporting standards like IFRS and GAAP provide frameworks for preparing transparent and comparable financial statements.'
  )
  const [files, setFiles] = useState<FileList | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>(PROCESSING_STEPS)
  const [result, setResult] = useState<UniversalProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState({
    target_audience: 'mixed',
    learning_style: 'adaptive',
    time_constraint: 'flexible',
    assessment_frequency: 'adaptive',
    extract_images: true,
    generate_summaries: true,
    create_flashcards: true,
    difficulty_adjustment: true,
    personalization: true,
    gamification: true,
    cross_domain_insights: true,
    universal_patterns: true,
    learning_science_enhanced: true
  })
  const [activeTab, setActiveTab] = useState<string>('input')
  const [metadata, setMetadata] = useState({
    source: 'ui_upload',
    author: '',
    subject: '',
    grade_level: 'Professional'
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateStepStatus = useCallback(
    (stepId: string, status: ProcessingStep['status'], progress: number = 0, result?: any) => {
      setProcessingSteps(prev =>
        prev.map(step =>
          step.id === stepId
            ? {
                ...step,
                status,
                progress,
                result,
                duration: status === 'completed' ? Date.now() : step.duration
              }
            : step
        )
      )
    },
    []
  )

  const simulateStepProcessing = useCallback(
    async (stepId: string, duration: number = 2000) => {
      updateStepStatus(stepId, 'processing', 0)

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, duration / 10))
        if (i < 100) {
          updateStepStatus(stepId, 'processing', i)
        }
      }

      updateStepStatus(stepId, 'completed', 100)
    },
    [updateStepStatus]
  )

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔍 File upload triggered')
    const selectedFiles = event.target.files
    console.log('🔍 Selected files:', selectedFiles ? selectedFiles.length : 0)

    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(selectedFiles)
      const file = selectedFiles[0]
      console.log('🔍 Processing file:', file.name, file.type)

      // Handle different file types
      if (
        file.type.startsWith('text/') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.txt')
      ) {
        // Text files - read content immediately
        const reader = new FileReader()
        reader.onload = e => {
          setContent((e.target?.result as string) || '')
        }
        reader.onerror = () => {
          setError('Error reading file')
        }
        reader.readAsText(file)
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // PDF files - show placeholder, content will be extracted server-side
        console.log('🔍 PDF file selected:', file.name)
        setContent(
          `📄 PDF File Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)\n\nPDF content will be extracted during processing...`
        )
      } else if (file.name.endsWith('.docx')) {
        // Word documents - show placeholder
        console.log('📄 Word document selected:', file.name)
        setContent(
          `📄 Word Document Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)\n\nDocument content will be extracted during processing...`
        )
      } else {
        // Other files - show placeholder
        setContent(
          `📎 File Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)\n\nFile content will be processed during analysis...`
        )
      }
    }
  }, [])

  const processUniversalLearning = useCallback(async () => {
    if ((!content || content.trim().length === 0) && !files) {
      setError('Please provide content or upload files to process')
      return
    }

    if (!selectedDomain) {
      setError('Please select a domain')
      return
    }

    setIsProcessing(true)
    setError(null)
    setResult(null)
    setCurrentStep(0)
    setActiveTab('processing')

    // Reset all steps
    setProcessingSteps(PROCESSING_STEPS.map(step => ({ ...step, status: 'pending', progress: 0 })))

    try {
      console.log(`🚀 Starting Universal Learning Pipeline for ${selectedDomain}`)
      console.log(
        `📝 Content being sent: "${content.substring(0, 100)}..." (${content.length} chars)`
      )
      console.log(`📦 Request payload:`, {
        action: 'complete_pipeline',
        domain: selectedDomain,
        contentLength: content.length,
        hasContent: !!content && content.trim().length > 0
      })

      // Prepare request based on whether we have files or just text
      let response

      if (files && files.length > 0) {
        // Handle file upload with FormData
        console.log(`📁 Processing with ${files.length} file(s)`)
        const formData = new FormData()
        formData.append('action', 'complete_pipeline')
        formData.append('domain', selectedDomain)
        formData.append('options', JSON.stringify(options))
        formData.append(
          'metadata',
          JSON.stringify({
            ...metadata,
            subject: metadata.subject || selectedDomain
          })
        )

        // Add all files
        Array.from(files).forEach((file, index) => {
          formData.append(`file_${index}`, file)
        })

        // If we have content text too, add it
        if (
          content &&
          content.trim().length > 0 &&
          !content.includes('File Selected:') &&
          !content.includes('PDF content will be extracted')
        ) {
          formData.append('content', content)
        }

        response = await fetch('/api/v1/universal-learning', {
          method: 'POST',
          body: formData // No Content-Type header for FormData
        })
      } else {
        // Handle text-only processing
        response = await fetch('/api/v1/universal-learning', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'complete_pipeline',
            domain: selectedDomain,
            content: content,
            options: options,
            metadata: {
              ...metadata,
              subject: metadata.subject || selectedDomain
            }
          })
        })
      }

      const apiResult = await response.json()

      if (!response.ok) {
        console.error('API Error Response:', apiResult)
        throw new Error(
          apiResult.error || `API request failed: ${response.status} ${response.statusText}`
        )
      }

      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Universal Learning processing failed')
      }

      // Simulate step-by-step processing for UI
      for (let i = 0; i < PROCESSING_STEPS.length; i++) {
        setCurrentStep(i)
        await simulateStepProcessing(PROCESSING_STEPS[i].id, 1500)
      }

      // Set the final result
      setResult(apiResult.data)
      setActiveTab('results')

      console.log(`✅ Universal Learning Pipeline completed`)
      console.log(`📊 Processing metadata:`, apiResult.processing_metadata)
    } catch (error: any) {
      console.error('Universal Learning Error:', error)
      setError(error.message || 'An error occurred during processing')

      // Mark current step as error
      if (currentStep < processingSteps.length) {
        updateStepStatus(processingSteps[currentStep].id, 'error', 0)
      }
    } finally {
      setIsProcessing(false)
    }
  }, [
    content,
    files,
    selectedDomain,
    options,
    metadata,
    currentStep,
    processingSteps,
    simulateStepProcessing,
    updateStepStatus
  ])

  const resetInterface = useCallback(() => {
    setContent('')
    setFiles(null)
    setResult(null)
    setError(null)
    setIsProcessing(false)
    setCurrentStep(0)
    setProcessingSteps(PROCESSING_STEPS.map(step => ({ ...step, status: 'pending', progress: 0 })))
    setActiveTab('input')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const exportResults = useCallback(() => {
    if (!result) return

    const exportData = {
      domain: selectedDomain,
      processing_timestamp: new Date().toISOString(),
      options_used: options,
      metadata_used: metadata,
      results: result,
      summary: result.pipeline_summary
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `universal-learning-${selectedDomain.toLowerCase()}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [result, selectedDomain, options, metadata])

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-foreground">
            <Brain className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HERA Universal Learning Platform
            </h1>
            <p className="text-lg text-muted-foreground">
              Process ANY educational content across all domains with 95% code reuse
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span>AI-Powered Analysis</span>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-green-500" />
            <span>Adaptive Learning Paths</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span>Cross-Domain Intelligence</span>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="input">Input & Configuration</TabsTrigger>
          <TabsTrigger value="processing" disabled={!isProcessing && currentStep === 0}>
            Processing
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>
            Results
          </TabsTrigger>
          <TabsTrigger value="export" disabled={!result}>
            Export & Share
          </TabsTrigger>
        </TabsList>

        {/* Input & Configuration Tab */}
        <TabsContent value="input" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Content Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Educational Content</span>
                </CardTitle>
                <CardDescription>Upload files or paste content to process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div>
                  <Label htmlFor="file-upload">Upload Files</Label>
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      type="file"
                      multiple
                      accept=".txt,.md,.pdf,.docx,.pptx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log('🔍 Upload button clicked')
                        console.log('🔍 File input ref:', fileInputRef.current)
                        fileInputRef.current?.click()
                      }}
                      className="w-full h-20 border-dashed"
                    >
                      <Upload className="h-6 w-6 mr-2" />
                      {files ? `${files.length} file(s) selected` : 'Click to upload files'}
                    </Button>
                  </div>
                  {files && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {Array.from(files).map((file, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{file.name}</span>
                          <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Text Content */}
                <div>
                  <Label htmlFor="content">Or Paste Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste your educational content here..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="min-h-[200px] mt-2"
                  />
                  {content && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {content.length} characters, ~{Math.ceil(content.split(' ').length / 250)}{' '}
                      minutes to read
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configuration</span>
                </CardTitle>
                <CardDescription>Configure domain and processing options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Domain Selection */}
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_DOMAINS.map(domain => (
                        <SelectItem key={domain.value} value={domain.value}>
                          <div>
                            <div className="font-medium">{domain.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {domain.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Learning Options */}
                <div className="space-y-3">
                  <Label>Learning Options</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={options.target_audience}
                      onValueChange={value =>
                        setOptions(prev => ({ ...prev, target_audience: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="mixed">Mixed Audience</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={options.learning_style}
                      onValueChange={value =>
                        setOptions(prev => ({ ...prev, learning_style: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visual">Visual</SelectItem>
                        <SelectItem value="auditory">Auditory</SelectItem>
                        <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
                        <SelectItem value="reading_writing">Reading/Writing</SelectItem>
                        <SelectItem value="adaptive">Adaptive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-3">
                  <Label>Metadata (Optional)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Author"
                      value={metadata.author}
                      onChange={e => setMetadata(prev => ({ ...prev, author: e.target.value }))}
                    />
                    <Input
                      placeholder="Subject"
                      value={metadata.subject}
                      onChange={e => setMetadata(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Process Button */}
                <Button
                  onClick={processUniversalLearning}
                  disabled={isProcessing || ((!content || content.trim().length === 0) && !files)}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Process Universal Learning
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Processing Tab */}
        <TabsContent value="processing" className="space-y-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 animate-pulse" />
                  <span>Universal Learning Pipeline Processing</span>
                </CardTitle>
                <CardDescription>
                  Processing {selectedDomain} content through the Universal Learning Platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {processingSteps.map((step, index) => (
                  <div key={step.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.status === 'completed'
                              ? 'bg-green-100 text-green-600'
                              : step.status === 'processing'
                                ? 'bg-blue-100 text-primary'
                                : step.status === 'error'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {step.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : step.status === 'processing' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : step.status === 'error' ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{step.name}</div>
                          <div className="text-sm text-muted-foreground">{step.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{step.progress}%</div>
                        {step.duration && (
                          <div className="text-xs text-muted-foreground">
                            {(step.duration / 1000).toFixed(1)}s
                          </div>
                        )}
                      </div>
                    </div>
                    <Progress value={step.progress} className="h-2" />
                  </div>
                ))}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Processing Error</AlertTitle>
                    <AlertDescription>
                      <div>{error}</div>
                      {error.includes('Content or files are required') && (
                        <div className="mt-2 text-sm">
                          💡 <strong>Tip:</strong> Make sure you've entered some educational content
                          in the text area before clicking "Process Universal Learning"
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {result && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-2xl font-bold">
                          {result.pipeline_summary?.total_universal_elements || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Universal Elements</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-2xl font-bold">
                          {result.pipeline_summary?.total_entities_created || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">HERA Entities</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-2xl font-bold">
                          {result.pipeline_summary?.total_learning_paths || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Learning Paths</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-2xl font-bold">
                          {result.pipeline_summary?.cross_domain_insights || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Cross-Domain Insights</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Results */}
              <Tabs defaultValue="analysis" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                  <TabsTrigger value="entities">HERA Entities</TabsTrigger>
                  <TabsTrigger value="paths">Learning Paths</TabsTrigger>
                  <TabsTrigger value="specialization">Domain Specialization</TabsTrigger>
                  <TabsTrigger value="intelligence">Cross-Domain Intelligence</TabsTrigger>
                </TabsList>

                <TabsContent value="analysis">
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Analysis Results</CardTitle>
                      <CardDescription>Universal learning elements extracted by AI</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        {result.ai_analysis?.universalElements?.map(
                          (element: any, index: number) => (
                            <div key={index} className="mb-4 p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline">{element.type}</Badge>
                                <Badge variant="secondary">
                                  {((element.universalApplicability || 0) * 100).toFixed(0)}%
                                  Universal
                                </Badge>
                              </div>
                              <h4 className="font-medium mb-2">{element.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {element.content}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>
                                  Bloom's: {element.learningScience?.bloomsLevel || 'N/A'}
                                </span>
                                <span>
                                  Style: {element.learningScience?.learningStyle || 'N/A'}
                                </span>
                                <span>
                                  Difficulty: {element.learningScience?.difficulty || 'N/A'}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="entities">
                  <Card>
                    <CardHeader>
                      <CardTitle>HERA Entities Created</CardTitle>
                      <CardDescription>
                        Educational content converted to HERA's universal 6-table architecture
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        {result.entity_creation?.coreEntities?.map((entity: any, index: number) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{entity.entity_type}</Badge>
                              <Badge variant="secondary">{entity.status}</Badge>
                            </div>
                            <h4 className="font-medium mb-1">{entity.entity_name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              Code: {entity.entity_code}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Smart Code: {entity.smart_code}
                            </p>
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="paths">
                  <Card>
                    <CardHeader>
                      <CardTitle>Generated Learning Paths</CardTitle>
                      <CardDescription>
                        Adaptive learning paths for different learner types
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        {result.learning_paths?.map((path: any, index: number) => (
                          <div key={index} className="mb-4 p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{path.difficulty || 'Mixed'}</Badge>
                              <Badge variant="secondary">
                                {path.estimatedDuration || 0} minutes
                              </Badge>
                            </div>
                            <h4 className="font-medium mb-2">{path.pathName || 'Learning Path'}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {path.description || 'No description available'}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>{path.totalElements || 0} elements</span>
                              <span>{path.assessmentPoints?.length || 0} assessments</span>
                              <span>{path.learningSequence?.length || 0} steps</span>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="specialization">
                  <Card>
                    <CardHeader>
                      <CardTitle>Domain Specialization</CardTitle>
                      <CardDescription>
                        {selectedDomain} specific enhancements and professional context
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        {result.domain_specialization && (
                          <div className="space-y-4">
                            <div className="p-4 border rounded-lg">
                              <h4 className="font-medium mb-2">Professional Alignment</h4>
                              <p className="text-sm text-muted-foreground">
                                Enhanced with {selectedDomain}-specific professional context and
                                industry standards
                              </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <h4 className="font-medium mb-2">Certification Mapping</h4>
                              <p className="text-sm text-muted-foreground">
                                Aligned with professional certifications and examination patterns
                              </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <h4 className="font-medium mb-2">Practical Applications</h4>
                              <p className="text-sm text-muted-foreground">
                                {result.domain_specialization.practicalApplications?.length || 0}{' '}
                                real-world scenarios identified
                              </p>
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="intelligence">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cross-Domain Intelligence</CardTitle>
                      <CardDescription>
                        Insights from other domains that can enhance learning
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        {result.cross_domain_intelligence && (
                          <div className="space-y-4">
                            <div className="p-4 border rounded-lg">
                              <h4 className="font-medium mb-2">Learning Transfers</h4>
                              <p className="text-sm text-muted-foreground">
                                Identified{' '}
                                {result.cross_domain_intelligence.learningTransfers?.length || 0}{' '}
                                opportunities to apply insights from other domains
                              </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <h4 className="font-medium mb-2">Universal Patterns</h4>
                              <p className="text-sm text-muted-foreground">
                                {result.cross_domain_intelligence.universalPatterns?.length || 0}{' '}
                                universal learning patterns detected across domains
                              </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <h4 className="font-medium mb-2">Predictive Insights</h4>
                              <p className="text-sm text-muted-foreground">
                                {result.cross_domain_intelligence.predictiveInsights?.length || 0}{' '}
                                predictive insights for optimizing future learning
                              </p>
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Export & Share Results</span>
                </CardTitle>
                <CardDescription>
                  Export your Universal Learning results in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Button onClick={exportResults} className="h-12">
                    <Download className="h-4 w-4 mr-2" />
                    Export as JSON
                  </Button>
                  <Button variant="outline" className="h-12" disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                    <Badge variant="secondary" className="ml-2">
                      Soon
                    </Badge>
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Reset & Start Over</h4>
                  <Button onClick={resetInterface} variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Interface
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
