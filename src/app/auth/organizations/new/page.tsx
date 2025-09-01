'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Loader2, Building2, AlertCircle, CheckCircle, X, 
  ArrowLeft, ArrowRight, Sparkles, Store, Heart, 
  Briefcase, Factory, Users, Globe, Shield, Zap
} from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import Link from 'next/link'

const BUSINESS_TYPES = [
  { value: 'salon', label: 'Salon & Beauty', icon: Heart },
  { value: 'icecream', label: 'Ice Cream Manufacturing', icon: Factory },
  { value: 'restaurant', label: 'Restaurant & Food Service', icon: Store },
  { value: 'healthcare', label: 'Healthcare & Medical', icon: Heart },
  { value: 'jewelry', label: 'Jewelry Retail', icon: Sparkles },
  { value: 'general', label: 'Other / General Business', icon: Building2 }
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
    organization_type: 'salon', // Default to salon since it's the only option
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
      
      // Store organization data temporarily for the apps page
      localStorage.setItem(`new-org-${org.id}`, JSON.stringify({
        id: org.id,
        name: formData.organization_name,
        subdomain: formData.subdomain,
        type: formData.organization_type
      }))
      
      // Redirect to appropriate app based on business type
      const redirectAfterOrg = localStorage.getItem('redirectAfterOrg')
      if (redirectAfterOrg) {
        localStorage.removeItem('redirectAfterOrg')
        router.push(redirectAfterOrg)
      } else {
        // Direct to appropriate app based on business type
        switch (formData.organization_type) {
          case 'salon':
            router.push('/salon')
            break
          case 'icecream':
            router.push('/icecream')
            break
          case 'restaurant':
            router.push('/restaurant')
            break
          case 'healthcare':
            router.push('/healthcare')
            break
          case 'jewelry':
            router.push('/jewelry')
            break
          default:
            router.push('/apps')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/auth/organizations">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Create Organization</h1>
                  <p className="text-xs text-slate-600">Set up your new business</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              Create a new organization to manage your business. Each organization gets its own subdomain and isolated data.
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
                  disabled={true} // Disabled since only salon is available
                >
                  <SelectTrigger id="organization_type">
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Currently, only Salon & Beauty businesses are supported. More industries coming soon!
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

        {/* Info Section */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-sm mb-1">Custom Domain</h3>
            <p className="text-xs text-slate-600">
              Access via subdomain.heraerp.com
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-medium text-sm mb-1">Team Ready</h3>
            <p className="text-xs text-slate-600">
              Invite team members later
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-medium text-sm mb-1">Instant Setup</h3>
            <p className="text-xs text-slate-600">
              Start using immediately
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}