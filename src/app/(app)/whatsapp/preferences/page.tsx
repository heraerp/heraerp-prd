// ================================================================================
// WHATSAPP CUSTOMER PREFERENCES PAGE - CONSENT MANAGEMENT
// Smart Code: HERA.UI.WHATSAPP.PREFERENCES.v1
// Production-ready customer consent and preference management
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Shield, 
  UserCheck, 
  UserX,
  Search,
  Plus,
  Edit,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  Users,
  MessageSquare,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { useWhatsappApi } from '@/lib/api/whatsapp'
import { ChannelConsent } from '@/components/whatsapp/ChannelConsent'
import { useToast } from '@/components/ui/use-toast'

export default function WhatsAppPreferencesPage() {
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCustomer, setSelectedCustomer] = React.useState<string | null>(null)
  const [showConsentDialog, setShowConsentDialog] = React.useState(false)

  const {
    customerPrefs,
    isCustomerPrefsLoading,
    customerPrefsError,
    setCustomerPrefs,
    config
  } = useWhatsappApi(currentOrganization?.id || '')

  // Filter customer preferences based on search
  const filteredPrefs = React.useMemo(() => {
    if (!searchTerm.trim()) return customerPrefs

    const search = searchTerm.toLowerCase()
    return customerPrefs.filter(pref => 
      pref.customer_code.toLowerCase().includes(search) ||
      pref.phone_number.toLowerCase().includes(search)
    )
  }, [customerPrefs, searchTerm])

  // Get consent statistics
  const consentStats = React.useMemo(() => {
    const total = customerPrefs.length
    const optedIn = customerPrefs.filter(p => p.opted_in).length
    const optedOut = total - optedIn
    const recentOptIns = customerPrefs.filter(p => {
      if (!p.consent_ts) return false
      const consentDate = new Date(p.consent_ts)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return consentDate >= sevenDaysAgo && p.opted_in
    }).length

    return {
      total,
      optedIn,
      optedOut,
      recentOptIns,
      consentRate: total > 0 ? Math.round((optedIn / total) * 100) : 0
    }
  }, [customerPrefs])

  const handleUpdateConsent = async (customerCode: string, opted_in: boolean) => {
    try {
      const existing = customerPrefs.find(p => p.customer_code === customerCode)
      
      await setCustomerPrefs.mutateAsync({
        customerCode,
        prefs: {
          ...existing,
          opted_in,
          consent_ts: new Date().toISOString(),
          consent_method: 'explicit'
        }
      })

      toast({
        title: opted_in ? "Consent Granted" : "Consent Revoked",
        description: `Customer ${customerCode} has been ${opted_in ? 'opted in' : 'opted out'}.`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update consent",
        variant: "destructive"
      })
    }
  }

  const handleBulkExport = () => {
    // TODO: Implement CSV export of customer preferences
    const csvContent = [
      ['Customer Code', 'Phone Number', 'Opted In', 'Consent Date', 'Consent Method'].join(','),
      ...filteredPrefs.map(pref => [
        pref.customer_code,
        pref.phone_number,
        pref.opted_in ? 'Yes' : 'No',
        pref.consent_ts ? new Date(pref.consent_ts).toLocaleDateString() : '',
        pref.consent_method || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `whatsapp-preferences-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    if (phone.startsWith('+971')) {
      return phone.replace('+971', '0')
    }
    return phone
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to manage WhatsApp preferences.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="h-7 w-7 text-green-600" />
            Customer Preferences
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage WhatsApp consent and communication preferences for {currentOrganization.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-violet-700 border-violet-300">
              {currentOrganization.name}
            </Badge>
            <Badge variant="outline">
              {consentStats.total} customer{consentStats.total !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="text-green-700 border-green-300">
              {consentStats.consentRate}% consent rate
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleBulkExport}
            disabled={filteredPrefs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button
            onClick={() => setShowConsentDialog(true)}
            disabled={!config?.enabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* WhatsApp Not Configured Warning */}
      {!config?.enabled && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            WhatsApp integration is not enabled. 
            <Button variant="link" className="px-2 h-auto font-normal underline">
              Configure WhatsApp settings
            </Button>
            to manage customer preferences.
          </AlertDescription>
        </Alert>
      )}

      {/* Consent Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</div>
                <div className="text-2xl font-bold">{consentStats.total}</div>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-600">Opted In</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {consentStats.optedIn}
                </div>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-red-600">Opted Out</div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {consentStats.optedOut}
                </div>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-600">Recent Opt-ins</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {consentStats.recentOptIns}
                </div>
                <div className="text-xs text-gray-500">Last 7 days</div>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search customers by code or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Preferences List */}
      {isCustomerPrefsLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-green-600 mr-3" />
              <span className="text-gray-600 dark:text-gray-400">Loading customer preferences...</span>
            </div>
          </CardContent>
        </Card>
      ) : customerPrefsError ? (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load customer preferences: {customerPrefsError.message}
          </AlertDescription>
        </Alert>
      ) : filteredPrefs.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm ? 'No customers found' : 'No customer preferences yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search criteria.'
                  : 'Start managing customer WhatsApp consent and preferences.'
                }
              </p>
              {!searchTerm && config?.enabled && (
                <Button onClick={() => setShowConsentDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Customer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPrefs.map((pref) => (
            <Card key={pref.customer_code} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">
                      {pref.customer_code}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-mono text-gray-600">
                          {formatPhoneNumber(pref.phone_number)}
                        </span>
                      </div>
                      {pref.opted_in ? (
                        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Opted In
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                          <UserX className="h-3 w-3 mr-1" />
                          Opted Out
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-blue-600">
                        WhatsApp
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`consent_${pref.customer_code}`} className="text-sm">
                        WhatsApp Messages
                      </Label>
                      <Switch
                        id={`consent_${pref.customer_code}`}
                        checked={pref.opted_in}
                        onCheckedChange={(checked) => handleUpdateConsent(pref.customer_code, checked)}
                        disabled={setCustomerPrefs.isPending}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  
                  {/* Consent Details */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-600">Consent Date</Label>
                        <p className="font-medium">
                          {pref.consent_ts 
                            ? new Date(pref.consent_ts).toLocaleDateString('en-AE', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Not set'
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Consent Method</Label>
                        <p className="font-medium">
                          {pref.consent_method === 'explicit' ? 'Explicit Consent' :
                           pref.consent_method === 'implicit' ? 'Implicit Consent' :
                           'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Last updated: {pref.consent_ts 
                        ? new Date(pref.consent_ts).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(pref.customer_code)
                        setShowConsentDialog(true)
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Channel Consent Dialog */}
      <ChannelConsent
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        organizationId={currentOrganization.id}
        customerCode={selectedCustomer}
        onClose={() => {
          setShowConsentDialog(false)
          setSelectedCustomer(null)
        }}
      />

    </div>
  )
}