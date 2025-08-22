'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { 
  ChevronLeft,
  Save,
  Loader2,
  User,
  Phone,
  Mail,
  Calendar,
  Heart,
  Shield,
  AlertTriangle
} from 'lucide-react'

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [stylists, setStylists] = useState<Array<{ id: string, name: string }>>([])
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthDate: '',
    preferredStylist: '',
    notes: '',
    emergencyContact: '',
    allergies: '',
    preferences: '',
    status: 'active'
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (clientId && (currentOrganization || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID)) {
      fetchClientDetails()
      fetchStylists()
    }
  }, [clientId, currentOrganization])

  const fetchStylists = async () => {
    try {
      const orgId = currentOrganization?.id || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
      const response = await fetch(`/api/v1/salon/staff?organization_id=${orgId}&role=stylist`)
      const data = await response.json()
      
      if (data.success && data.staff) {
        setStylists(data.staff.map((s: any) => ({ id: s.id, name: s.name })))
      }
    } catch (error) {
      console.error('Error fetching stylists:', error)
    }
  }

  const fetchClientDetails = async () => {
    try {
      const response = await fetch(`/api/v1/salon/clients/${clientId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch client details')
      }
      
      if (data.success && data.client) {
        setFormData({
          name: data.client.name || '',
          phone: data.client.phone || '',
          email: data.client.email || '',
          birthDate: data.client.birthDate || '',
          preferredStylist: data.client.preferredStylist || '',
          notes: data.client.notes || '',
          emergencyContact: data.client.emergencyContact || '',
          allergies: data.client.allergies || '',
          preferences: data.client.preferences || '',
          status: data.client.status || 'active'
        })
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      setMessage({ type: 'error', text: 'Failed to load client details' })
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number format'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setMessage(null)
    
    try {
      const response = await fetch(`/api/v1/salon/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update client')
      }
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Client updated successfully!' })
        setTimeout(() => {
          router.push(`/salon/clients/${clientId}`)
        }, 1000)
      }
    } catch (error) {
      console.error('Error updating client:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update client' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated && !contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <Shield className="w-4 h-4" />
          <AlertDescription>
            Please log in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading client details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push(`/salon/clients/${clientId}`)}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Client Details
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Edit Client
            </h1>
          </div>

          {message && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-red-600' : 'text-green-600'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Client name"
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+971 50 123 4567"
                      className={formErrors.phone ? 'border-red-500' : ''}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="client@example.com"
                      className={formErrors.email ? 'border-red-500' : ''}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="blacklisted">Blacklisted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    Preferences & Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="preferredStylist">Preferred Stylist</Label>
                    <Select
                      value={formData.preferredStylist}
                      onValueChange={(value) => setFormData({ ...formData, preferredStylist: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stylist" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No preference</SelectItem>
                        {stylists.length > 0 ? (
                          stylists.map((stylist) => (
                            <SelectItem key={stylist.id} value={stylist.name}>
                              {stylist.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No stylists available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="Emergency contact number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="allergies">
                      <AlertTriangle className="w-4 h-4 inline mr-1 text-red-500" />
                      Allergies/Sensitivities
                    </Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      placeholder="List any allergies or sensitivities to products..."
                      rows={2}
                      className="text-red-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="preferences">Preferences</Label>
                    <Textarea
                      id="preferences"
                      value={formData.preferences}
                      onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                      placeholder="Hair type, style preferences, favorite services..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any other important information about this client..."
                  rows={4}
                />
              </CardContent>
            </Card>

            <div className="mt-8 flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push(`/salon/clients/${clientId}`)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Client
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}