'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { UCRDeploymentManager } from '@/src/components/salon/UCRDeploymentManager'
import { useUCRMCP } from '@/src/lib/hooks/use-ucr-mcp'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft, Rocket, Loader2 } from 'lucide-react'
import Link from 'next/link'

function DeploymentContent() {
  const searchParams = useSearchParams()
  const ruleId = searchParams.get('rule')
  const { currentOrganization } = useMultiOrgAuth()
  const { getRule } = useUCRMCP()
  const [rule, setRule] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ruleId) {
      loadRule()
    }
  }, [ruleId])

  const loadRule = async () => {
    if (!ruleId) return

    setLoading(true)
    try {
      const ruleData = await getRule(ruleId)
      setRule(ruleData)
    } catch (err) {
      console.error('Failed to load rule:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    window.location.href = '/salon-data/config?tab=rules'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-600 mb-4" />
          <p className="text-muted-foreground dark:text-muted-foreground">Loading deployment manager...</p>
        </div>
      </div>
    )
  }

  if (!ruleId || !rule) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background p-4">
        <Card className="max-w-2xl mx-auto mt-12">
          <CardHeader>
            <CardTitle className="text-center">No Rule Selected</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground dark:text-muted-foreground">
              Please select a rule to deploy from the rules list.
            </p>
            <Link href="/salon-data/config?tab=rules">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rules
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-background">
      {/* Page Header */}
      <div className="border-b border-border dark:border-border bg-background dark:bg-muted">
        <div className="px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/salon-data/config?tab=rules">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-100 dark:text-foreground">
                  Deploy Rule to Production
                </h1>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Configure and deploy your business rule
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-6xl mx-auto">
        <UCRDeploymentManager ruleId={ruleId} rule={rule} onClose={handleClose} />
      </div>
    </div>
  )
}

export default function DeploymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-600 mb-4" />
            <p className="text-muted-foreground dark:text-muted-foreground">Loading deployment manager...</p>
          </div>
        </div>
      }
    >
      <DeploymentContent />
    </Suspense>
  )
}
