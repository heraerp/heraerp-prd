'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Building2, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant & Food Service' },
  { value: 'salon', label: 'Salon & Beauty' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'healthcare', label: 'Healthcare & Medical' },
  { value: 'professional', label: 'Professional Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'general', label: 'Other / General Business' }
]

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { createOrganization, checkSubdomainAvailability, isAuthenticated } = useMultiOrgAuth()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: 'general',
    subdomain: ''
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  // Auto-generate subdomain from organization name
  useEffect(() => {
    if (formData.organization_name) {
      const suggested = formData.organization_name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 63)
      
      setFormData(prev => ({ ...prev, subdomain: suggested }))
    }
  }, [formData.organization_name])

  // Check subdomain availability
  useEffect(() => {
    const checkSubdomain = async () => {
      if (formData.subdomain.length < 3) {
        setSubdomainAvailable(null)
        return
      }

      setIsCheckingSubdomain(true)
      try {
        const available = await checkSubdomainAvailability(formData.subdomain)
        setSubdomainAvailable(available)
      } catch (error) {
        console.error('Error checking subdomain:', error)
        setSubdomainAvailable(null)
      } finally {
        setIsCheckingSubdomain(false)
      }
    }

    const timer = setTimeout(checkSubdomain, 500)
    return () => clearTimeout(timer)
  }, [formData.subdomain, checkSubdomainAvailability])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!subdomainAvailable) {
      setError('Please choose an available subdomain')
      return
    }

    setIsLoading(true)

    try {
      const org = await createOrganization(formData)
      
      // Redirect to app selection for the new organization
      router.push(`/auth/organizations/${org.id}/apps`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Your Organization</CardTitle>
            <CardDescription>
              Set up your business on HERA with a custom subdomain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="organization_name">Organization Name</Label>
                <Input
                  id="organization_name"
                  type="text"
                  placeholder="ACME Corporation"
                  value={formData.organization_name}
                  onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Your business or company name
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="organization_type">Business Type</Label>
                <Select
                  value={formData.organization_type}
                  onValueChange={(value) => setFormData({...formData, organization_type: value})}
                  disabled={isLoading}
                >
                  <SelectTrigger id="organization_type">
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  This helps us suggest the right apps for your business
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="relative">
                  <Input
                    id="subdomain"
                    type="text"
                    placeholder="acme"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({...formData, subdomain: e.target.value.toLowerCase()})}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {isCheckingSubdomain && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {!isCheckingSubdomain && subdomainAvailable === true && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {!isCheckingSubdomain && subdomainAvailable === false && (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Your HERA URL will be: {formData.subdomain || 'subdomain'}.heraerp.com
                </p>
                {subdomainAvailable === false && (
                  <p className="text-xs text-red-600">
                    This subdomain is not available
                  </p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !subdomainAvailable || isCheckingSubdomain}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-4 w-4" />
                    Create Organization
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}