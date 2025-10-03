'use client'

import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { Loader2, Sparkles, FileText, Zap } from 'lucide-react'

export default function AmplifyDemoPage() {
  const { currentOrganization } = useMultiOrgAuth()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const runDemo = async () => {
    if (!currentOrganization) return

    setIsProcessing(true)
    try {
      // Step 1: Ingest content
      const ingestResponse = await fetch('/api/amplify/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          topicOrDraft: {
            title: '10 Ways AI is Transforming Marketing',
            body: 'AI is revolutionizing how businesses connect with customers...',
            source_type: 'topic'
          }
        })
      })

      const { content } = await ingestResponse.json()

      toast({
        title: 'Content Ingested',
        description: 'Topic has been converted to content',
      })

      // Step 2: Optimize content
      await new Promise(resolve => setTimeout(resolve, 1000))

      const optimizeResponse = await fetch('/api/amplify/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: content.entity_id,
          organizationId: currentOrganization.id
        })
      })

      const { optimizations } = await optimizeResponse.json()

      toast({
        title: 'Content Optimized',
        description: 'SEO optimization complete',
      })

      // Success!
      setTimeout(() => {
        toast({
          title: '🎉 Demo Complete',
          description: 'Content has been ingested and optimized. Check the Content page.',
        })
      }, 500)

    } catch (error) {
      toast({
        title: 'Demo Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Amplify Demo</h1>
        <p className="text-muted-foreground">
          Experience the AI-powered content amplification workflow
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Quick Demo Workflow
          </CardTitle>
          <CardDescription>
            This demo will create sample content and run it through the amplification pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold">1. Ingest</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Convert topic to content
              </p>
            </div>

            <div className="text-center p-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold">2. Optimize</h3>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered SEO enhancement
              </p>
            </div>

            <div className="text-center p-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold">3. Amplify</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Multi-channel distribution
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={runDemo}
              disabled={isProcessing || !currentOrganization}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Run Demo
                </>
              )}
            </Button>
          </div>

          {!currentOrganization && (
            <p className="text-center text-sm text-muted-foreground">
              Please select an organization to run the demo
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}