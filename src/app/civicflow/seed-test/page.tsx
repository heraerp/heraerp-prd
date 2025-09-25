'use client'

import { useState } from 'react'
import { useOrgStore } from '@/state/org'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { seedCivicFlowCases, clearCivicFlowCases } from '@/lib/civicflow/seed-cases'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export default function SeedTestPage() {
  const { currentOrgId } = useOrgStore()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleSeedDirect = async () => {
    setLoading(true)
    setResult('')
    setError('')

    try {
      const cases = await seedCivicFlowCases()
      setResult(`Successfully created ${cases?.length || 0} demo cases!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed data')
    } finally {
      setLoading(false)
    }
  }

  const handleClearDirect = async () => {
    setLoading(true)
    setResult('')
    setError('')

    try {
      await clearCivicFlowCases()
      setResult('All cases cleared successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data')
    } finally {
      setLoading(false)
    }
  }

  const handleSeedAPI = async () => {
    setLoading(true)
    setResult('')
    setError('')

    try {
      const response = await fetch('/api/civicflow/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': CIVICFLOW_ORG_ID
        },
        body: JSON.stringify({ action: 'seed' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'API request failed')
      }

      setResult(`API Success: ${data.message} (${data.cases_created} cases)`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to call API')
    } finally {
      setLoading(false)
    }
  }

  if (currentOrgId !== CIVICFLOW_ORG_ID) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please switch to the CivicFlow demo organization (ID: {CIVICFLOW_ORG_ID}) to use this
            test page.
            <br />
            Current org: {currentOrgId}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CivicFlow Seed Test</h1>
        <p className="text-muted-foreground">Test seed data creation for CivicFlow cases</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Direct Database Seeding</CardTitle>
          <CardDescription>
            Directly call the seed functions (requires Supabase service role key)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleSeedDirect} disabled={loading}>
              {loading ? 'Seeding...' : 'Seed Cases'}
            </Button>
            <Button onClick={handleClearDirect} disabled={loading} variant="destructive">
              {loading ? 'Clearing...' : 'Clear All'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Test</CardTitle>
          <CardDescription>Test the /api/civicflow/seed endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeedAPI} disabled={loading}>
            {loading ? 'Calling API...' : 'Test API Endpoint'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Alert>
          <AlertDescription className="text-green-600">{result}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Seed Data Overview</CardTitle>
          <CardDescription>
            The seed data includes various case types with realistic scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Infrastructure cases (pothole repair, street lights)</li>
            <li>Healthcare cases (equipment requests, vaccination campaigns)</li>
            <li>Social services cases (emergency housing, senior support)</li>
            <li>Environmental cases (illegal dumping)</li>
            <li>Closed cases for metrics and reporting</li>
            <li>Various priorities, RAG statuses, and due dates</li>
            <li>Integration with programs and subject entities</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
