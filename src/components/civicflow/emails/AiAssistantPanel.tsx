'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useAiAssist } from '@/hooks/civicflow/useEmails'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  X,
  Loader2,
  MessageSquare,
  Brain,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Copy,
  RefreshCw,
  Send,
  Lightbulb,
  Tag,
  Clock,
  BarChart3
} from 'lucide-react'

interface AiAssistantPanelProps {
  emailId: string | null
  onClose: () => void
}

type AiTask = 'summarize' | 'classify' | 'suggest' | 'analyze' | 'extract'

interface AiResponse {
  task: AiTask
  result: any
  confidence: number
  processing_time: number
  timestamp: string
}

interface EmailSummary {
  key_points: string[]
  action_items: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  urgency: 'low' | 'medium' | 'high'
  entities: string[]
}

interface EmailClassification {
  priority: 'urgent' | 'normal' | 'low'
  category: string
  tags: string[]
  confidence: number
  reasoning: string
}

interface SuggestedReply {
  tone: 'professional' | 'friendly' | 'formal'
  content: string
  confidence: number
  reasoning: string
}

export function AiAssistantPanel({ emailId, onClose }: AiAssistantPanelProps) {
  const { toast } = useToast()
  const [activeTask, setActiveTask] = useState<AiTask | null>(null)
  const [responses, setResponses] = useState<Record<AiTask, AiResponse | null>>({
    summarize: null,
    classify: null,
    suggest: null,
    analyze: null,
    extract: null
  })

  const { mutateAsync: performAiTask, isPending } = useAiAssist()

  const handleAiTask = async (task: AiTask) => {
    if (!emailId) {
      toast({
        title: 'No email selected',
        description: 'Please select an email to use AI assistance.',
        variant: 'destructive'
      })
      return
    }

    setActiveTask(task)

    try {
      const response = await performAiTask({
        emailId,
        task
      })

      setResponses(prev => ({
        ...prev,
        [task]: {
          task,
          result: response.result,
          confidence: response.confidence,
          processing_time: response.processing_time,
          timestamp: new Date().toISOString()
        }
      }))

      toast({
        title: 'AI analysis complete',
        description: `${task} completed in ${response.processing_time}ms`
      })
    } catch (error: any) {
      toast({
        title: 'AI analysis failed',
        description: error.message || 'Failed to process AI request',
        variant: 'destructive'
      })
    } finally {
      setActiveTask(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to clipboard',
      description: 'Content has been copied to your clipboard.'
    })
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8)
      return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30'
    if (confidence >= 0.6)
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30'
    return 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
  }

  const renderSummary = (summary: EmailSummary) => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Key Points
        </h4>
        <ul className="space-y-1">
          {summary.key_points.map((point, index) => (
            <li key={index} className="text-sm flex items-start gap-2">
              <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      {summary.action_items.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Action Items
          </h4>
          <ul className="space-y-1">
            {summary.action_items.map((item, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sentiment:</span>
          <Badge
            className={cn(
              summary.sentiment === 'positive' && 'bg-green-100 text-green-800',
              summary.sentiment === 'negative' && 'bg-red-100 text-red-800',
              summary.sentiment === 'neutral' && 'bg-gray-100 text-gray-800'
            )}
          >
            {summary.sentiment}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Urgency:</span>
          <Badge
            className={cn(
              summary.urgency === 'high' && 'bg-red-100 text-red-800',
              summary.urgency === 'medium' && 'bg-yellow-100 text-yellow-800',
              summary.urgency === 'low' && 'bg-blue-100 text-blue-800'
            )}
          >
            {summary.urgency}
          </Badge>
        </div>
      </div>

      {summary.entities.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Entities</h4>
          <div className="flex flex-wrap gap-1">
            {summary.entities.map((entity, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {entity}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderClassification = (classification: EmailClassification) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Priority:</span>
          <Badge
            className={cn(
              classification.priority === 'urgent' && 'bg-red-100 text-red-800',
              classification.priority === 'normal' && 'bg-blue-100 text-blue-800',
              classification.priority === 'low' && 'bg-gray-100 text-gray-800'
            )}
          >
            {classification.priority}
          </Badge>
        </div>
        <Badge className={getConfidenceColor(classification.confidence)}>
          {Math.round(classification.confidence * 100)}% confident
        </Badge>
      </div>

      <div>
        <span className="font-medium">Category: </span>
        <span className="text-sm">{classification.category}</span>
      </div>

      <div>
        <h4 className="font-medium mb-2">Suggested Tags</h4>
        <div className="flex flex-wrap gap-1">
          {classification.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Reasoning</h4>
        <p className="text-sm text-muted-foreground">{classification.reasoning}</p>
      </div>
    </div>
  )

  const renderSuggestedReply = (reply: SuggestedReply) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">Tone:</span>
          <Badge variant="outline">{reply.tone}</Badge>
        </div>
        <Badge className={getConfidenceColor(reply.confidence)}>
          {Math.round(reply.confidence * 100)}% confident
        </Badge>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Suggested Reply</h4>
          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(reply.content)}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <Textarea value={reply.content} readOnly className="min-h-32 resize-none" />
      </div>

      <div>
        <h4 className="font-medium mb-2">Why this suggestion?</h4>
        <p className="text-sm text-muted-foreground">{reply.reasoning}</p>
      </div>

      <Button
        className="w-full"
        onClick={() => {
          // This would open the compose modal with the suggested reply
          copyToClipboard(reply.content)
        }}
      >
        <Send className="h-4 w-4 mr-2" />
        Use This Reply
      </Button>
    </div>
  )

  const aiTasks = [
    {
      key: 'summarize' as AiTask,
      label: 'Summarize',
      icon: MessageSquare,
      description: 'Get key points and action items',
      color: 'text-blue-600'
    },
    {
      key: 'classify' as AiTask,
      label: 'Classify',
      icon: Tag,
      description: 'Categorize priority and tags',
      color: 'text-purple-600'
    },
    {
      key: 'suggest' as AiTask,
      label: 'Suggest Reply',
      icon: Lightbulb,
      description: 'Generate smart reply options',
      color: 'text-green-600'
    },
    {
      key: 'analyze' as AiTask,
      label: 'Analyze',
      icon: BarChart3,
      description: 'Deep sentiment analysis',
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold">AI Assistant</h2>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {emailId ? 'AI-powered email analysis and assistance' : 'Select an email to get started'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!emailId ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Brain className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="font-medium mb-2">AI Assistant Ready</h3>
            <p className="text-sm text-muted-foreground">
              Select an email to get AI-powered insights, summaries, and reply suggestions.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* AI Task Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {aiTasks.map(task => {
                const Icon = task.icon
                const isActive = activeTask === task.key
                const hasResponse = responses[task.key] !== null

                return (
                  <Button
                    key={task.key}
                    variant={hasResponse ? 'default' : 'outline'}
                    className={cn(
                      'h-auto p-3 flex flex-col items-center gap-1',
                      hasResponse && 'bg-purple-100 dark:bg-purple-900 border-purple-200'
                    )}
                    onClick={() => handleAiTask(task.key)}
                    disabled={isPending}
                  >
                    {isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className={cn('h-4 w-4', task.color)} />
                    )}
                    <span className="text-xs font-medium">{task.label}</span>
                    {hasResponse && <div className="w-1 h-1 bg-green-500 rounded-full" />}
                  </Button>
                )
              })}
            </div>

            {/* AI Responses */}
            <div className="space-y-4">
              {Object.entries(responses).map(([taskKey, response]) => {
                if (!response) return null

                return (
                  <Card key={taskKey}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm capitalize flex items-center gap-2">
                          {taskKey === 'summarize' && <MessageSquare className="h-4 w-4" />}
                          {taskKey === 'classify' && <Tag className="h-4 w-4" />}
                          {taskKey === 'suggest' && <Lightbulb className="h-4 w-4" />}
                          {taskKey === 'analyze' && <BarChart3 className="h-4 w-4" />}
                          {taskKey}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getConfidenceColor(response.confidence)}
                            variant="secondary"
                          >
                            {Math.round(response.confidence * 100)}%
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleAiTask(taskKey as AiTask)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {response.processing_time}ms
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {taskKey === 'summarize' && renderSummary(response.result)}
                      {taskKey === 'classify' && renderClassification(response.result)}
                      {taskKey === 'suggest' && renderSuggestedReply(response.result)}
                      {taskKey === 'analyze' && (
                        <div className="text-sm">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(response.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Tips */}
            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                      AI Tips
                    </h4>
                    <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                      <li>• Use "Summarize" for long email threads</li>
                      <li>• "Classify" helps organize your inbox</li>
                      <li>• "Suggest Reply" saves time on responses</li>
                      <li>• Higher confidence = more reliable results</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-muted-foreground text-center">
          AI responses powered by Claude
        </div>
      </div>
    </div>
  )
}
