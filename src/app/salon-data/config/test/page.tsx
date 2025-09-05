'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UCRRuleTester } from '@/components/salon/UCRRuleTester'
import { useUCRMCP } from '@/lib/hooks/use-ucr-mcp'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TestRulePage() {
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading rule...</p>
        </div>
      </div>
    )
  }

  if (!ruleId || !rule) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/salon-data/config?tab=rules">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rules
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Test Rule
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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