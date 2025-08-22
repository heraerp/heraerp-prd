/**
 * Currency Settings Component
 * Allows organizations to configure their default currency
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { getSupportedCurrencies } from '@/lib/currency'
import { Globe, Save } from 'lucide-react'

export function CurrencySettings() {
  const { currentOrganization, refreshOrganizations } = useMultiOrgAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(
    currentOrganization?.currency_code || 'USD'
  )

  const currencies = getSupportedCurrencies()

  const handleSave = async () => {
    if (!currentOrganization?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/v1/organizations/${currentOrganization.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency_code: selectedCurrency
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update currency')
      }

      toast({
        title: 'Currency Updated',
        description: `Your organization currency has been changed to ${selectedCurrency}`,
      })

      // Refresh organization data
      if (refreshOrganizations) {
        await refreshOrganizations()
      }
    } catch (error) {
      console.error('Error updating currency:', error)
      toast({
        title: 'Error',
        description: 'Failed to update currency settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Currency Settings
        </CardTitle>
        <CardDescription>
          Configure your organization's default currency for all transactions and displays
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Default Currency</Label>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger id="currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{currency.symbol}</span>
                    <span>{currency.code}</span>
                    <span className="text-muted-foreground">- {currency.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            This currency will be used for all new transactions and financial displays
          </p>
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleSave} 
            disabled={loading || selectedCurrency === currentOrganization?.currency_code}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Currency Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}