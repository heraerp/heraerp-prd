'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UCRTemplateCustomizer } from '@/src/components/salon/UCRTemplateCustomizer'
import { useUCRMCP } from '@/src/lib/hooks/use-ucr-mcp'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { useToast } from '@/src/components/ui/use-toast'

function CustomizeTemplateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')
  const { currentOrganization } = useMultiOrgAuth()
  const { listTemplates, cloneTemplate, loading } = useUCRMCP()
  const { toast } = useToast()
  const [template, setTemplate] = useState<any>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(true)

  useEffect(() => {
    loadTemplate()
  }, [templateId])

  const loadTemplate = async () => {
    if (!templateId) {
      setLoadingTemplate(false)
      return
    }

    try {
      const templates = await listTemplates()
      const found = templates.find(t => t.template_id === templateId)
      if (found) {
        setTemplate(found)
      }
    } catch (err) {
      console.error('Failed to load template:', err)
      toast({
        title: 'Failed to load template',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setLoadingTemplate(false)
    }
  }

  const handleSaveCustomization = async (customizedRule: any) => {
    if (!currentOrganization) {
      toast({
        title: 'No organization selected',
        description: 'Please select an organization first',
        variant: 'destructive'
      })
      return
    }

    try {
      // Clone the template with customized values
      const result = await cloneTemplate(template.template_id, customizedRule.smart_code)

      toast({
        title: 'Rule Created Successfully!',
        description: `Your customized rule "${customizedRule.title}" has been created`
      })

      // Redirect to rules management page
      router.push('/salon-data/config?tab=rules')
    } catch (err: any) {
      toast({
        title: 'Failed to create rule',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  if (loadingTemplate) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="mt-2 text-muted-foreground dark:text-muted-foreground">Loading template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background">
        <div className="px-4 py-6">
          <Alert className="max-w-2xl mx-auto">
            <AlertDescription>
              Template not found. Please go back and select a template to customize.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Link href="/salon-data/templates">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Templates
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-background">
      {/* Page Header */}
      <div className="border-b border-border dark:border-border bg-background dark:bg-muted">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/salon-data/templates">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Templates
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-100 dark:text-foreground">
                Customize Template
              </h1>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Personalize the template for {currentOrganization?.name || 'your salon'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <UCRTemplateCustomizer
          template={template}
          onSave={handleSaveCustomization}
          onCancel={() => router.push('/salon-data/templates')}
        />
      </div>
    </div>
  )
}

export default function CustomizeTemplatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="mt-2 text-muted-foreground dark:text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <CustomizeTemplateContent />
    </Suspense>
  )
}
