'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UCRRuleTester } from '@/src/components/salon/UCRRuleTester'
import { useUCRMCP } from '@/src/lib/hooks/use-ucr-mcp'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { Alert, AlertDescription } from '@/src/components/ui/alert'

function TestRuleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ruleId = searchParams.get('rule')
  const { getRule } = useUCRMCP()
  const [rule, setRule] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ruleId) {
      loadRule()
    } else {
      setLoading(false)
    }
  }, [ruleId])

  const loadRule = async () => {
    try {
      const ruleData = await getRule(ruleId)
      setRule(ruleData)
    } catch (err) {
      console.error('Failed to load rule:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="mt-2 text-muted-foreground dark:text-muted-foreground">Loading rule...</p>
        </div>
      </div>
    )
  }

  if (!ruleId || !rule) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background">
        <div className="px-4 py-6">
          <Alert className="max-w-2xl mx-auto">
            <AlertDescription>
              No rule selected for testing. Please select a rule from the rules management page.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Link href="/salon-data/config?tab=rules">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rules
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
            <Link href="/salon-data/config?tab=rules">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rules
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-100 dark:text-foreground">Test Rule</h1>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Validate your rule with real-world scenarios
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <UCRRuleTester
          ruleId={ruleId}
          rule={rule}
          onClose={() => router.push('/salon-data/config?tab=rules')}
        />
      </div>
    </div>
  )
}

export default function TestRulePage() {
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
      <TestRuleContent />
    </Suspense>
  )
}
