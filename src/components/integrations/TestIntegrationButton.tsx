'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'

export function TestIntegrationButton() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const testLinkedIn = async () => {
    setIsLoading(true)
    try {
      // Test the auth endpoint
      const response = await fetch('/api/integrations/test-auth')
      const data = await response.json()
      
      console.log('Test auth response:', data)
      
      // Test LinkedIn auth callback Simple
      const linkedinResponse = await fetch('/api/integrations/linkedin/auth/callback-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': data.fixes.currentOrgId
        },
        body: JSON.stringify({
          demo: true,
          organizationId: data.fixes.currentOrgId
        })
      })
      
      if (!linkedinResponse.ok) {
        const error = await linkedinResponse.json()
        throw new Error(error.details || error.error || 'Failed to connect')
      }
      
      const result = await linkedinResponse.json()
      console.log('LinkedIn connection result:', result)
      
      toast({
        title: 'Success!',
        description: `Connected to LinkedIn (Connector ID: ${result.connector_id})`,
      })
    } catch (error: any) {
      console.error('Test failed:', error)
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={testLinkedIn}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? 'Testing...' : 'Test LinkedIn Connection'}
    </Button>
  )
}