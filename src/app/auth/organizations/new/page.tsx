'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Loader2,
  Building2,
  AlertCircle,
  CheckCircle,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Store,
  Heart,
  Briefcase,
  Factory,
  Users,
  Globe,
  Shield,
  Zap,
  Hammer
} from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import Link from 'next/link'

const BUSINESS_TYPES = [
  { value: 'salon', label: 'Salon & Beauty', icon: Heart },
  { value: 'icecream', label: 'Ice Cream Manufacturing', icon: Factory },
  { value: 'restaurant', label: 'Restaurant & Food Service', icon: Store },
  { value: 'healthcare', label: 'Healthcare & Medical', icon: Heart },
  { value: 'furniture', label: 'Furniture Manufacturing', icon: Hammer },
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
      localStorage.setItem(
        `new-org-${org.id}`,
        JSON.stringify({
          id: org.id,
          name: formData.organization_name,
          subdomain: formData.subdomain,
          type: formData.organization_type
        })
      )

      // Redirect to appropriate app based on business type
      const redirectAfterOrg = localStorage.getItem('redirectAfterOrg')
      if (redirectAfterOrg) {
        localStorage.removeItem('redirectAfterOrg')
        router.push(redirectAfterOrg)
      } else {
        // Redirect to subdomain URL
        const protocol = window.location.protocol
        const hostname = window.location.hostname
        const port = window.location.port

        // Use appropriate subdomain pattern for development vs production
        let baseUrl: string

        if (process.env.NODE_ENV === 'production') {
          // Production: use actual heraerp.com subdomains
          baseUrl = `${protocol}//${formData.subdomain}.heraerp.com`
        } else {
          // Development: use .lvh.me for proper subdomain simulation
          const portSuffix = port ? `:${port}` : ''
          baseUrl = `${protocol}//${formData.subdomain}.lvh.me${portSuffix}`
        }

        switch (formData.organization_type) {
          case 'salon':
            window.location.href = `${baseUrl}/org/salon`
            break
          case 'icecream':
            window.location.href = `${baseUrl}/org/dashboard`
            break
          case 'restaurant':
            window.location.href = `${baseUrl}/org/restaurant`
            break
          case 'healthcare':
            window.location.href = `${baseUrl}/org/healthcare`
            break
          case 'jewelry':
            window.location.href = `${baseUrl}/org/jewelry`
            break
          default:
            window.location.href = `${baseUrl}/org/dashboard`
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Glassmorphic orbs for depth */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/auth/organizations">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-xl shadow-lg border border-white/20">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text">
                    Create Organization
                  </h1>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Set up your new business
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12 max-w-2xl">
        <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl border border-white/30 dark:border-gray-700/60 overflow-hidden">
          <CardHeader className="pb-8 pt-10 bg-gradient-to-br from-white/50 to-white/20 dark:from-gray-800/50 dark:to-gray-900/20">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm rounded-2xl shadow-lg">
                <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
              Organization Details
            </CardTitle>
            <CardDescription className="text-gray-700 dark:text-gray-300 text-center text-lg leading-relaxed max-w-lg mx-auto">
              Create a new organization to manage your business. Each organization gets its own
              subdomain and completely isolated data.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-50/90 dark:bg-red-900/40 backdrop-blur-lg border-red-200/60 dark:border-red-800/60"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Label
                  htmlFor="organization_name"
                  className="text-base font-semibold text-gray-800 dark:text-gray-200"
                >
                  Organization Name
                </Label>
                <Input
                  id="organization_name"
                  type="text"
                  placeholder="ACME Corporation"
                  value={formData.organization_name}
                  onChange={e => setFormData({ ...formData, organization_name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-14 text-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 dark:focus:border-blue-400/60 transition-all shadow-sm rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Your business or company name
                </p>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="organization_type"
                  className="text-base font-semibold text-gray-800 dark:text-gray-200"
                >
                  Business Type
                </Label>
                <Select
                  value={formData.organization_type}
                  onValueChange={value => setFormData({ ...formData, organization_type: value })}
                  disabled={false}
                >
                  <SelectTrigger
                    id="organization_type"
                    className="h-14 text-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 dark:focus:border-blue-400/60 transition-all shadow-sm rounded-xl text-gray-900 dark:text-gray-100"
                  >
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl border-2 border-white/30 dark:border-gray-700/60 shadow-2xl rounded-xl">
                    {BUSINESS_TYPES.map(type => {
                      const Icon = type.icon
                      return (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="py-3 px-4 text-base hover:bg-blue-50/70 dark:hover:bg-blue-900/30 focus:bg-blue-50/70 dark:focus:bg-blue-900/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-lg">
                              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {type.label}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Choose the type of business you're setting up
                </p>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="subdomain"
                  className="text-base font-semibold text-gray-800 dark:text-gray-200"
                >
                  Subdomain
                </Label>
                <div className="relative">
                  <Input
                    id="subdomain"
                    type="text"
                    placeholder="acme"
                    value={formData.subdomain}
                    onChange={e =>
                      setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })
                    }
                    required
                    disabled={isLoading}
                    className="pr-12 h-14 text-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 dark:focus:border-blue-400/60 transition-all shadow-sm rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    {isCheckingSubdomain && (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    )}
                    {!isCheckingSubdomain && subdomainAvailable === true && (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    )}
                    {!isCheckingSubdomain && subdomainAvailable === false && (
                      <X className="h-5 w-5 text-red-500 dark:text-red-400" />
                    )}
                  </div>
                </div>
                <div className="bg-blue-50/70 dark:bg-blue-900/30 backdrop-blur-sm rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    Your HERA URL will be:{' '}
                    <span className="font-bold">
                      {formData.subdomain || 'subdomain'}.heraerp.com
                    </span>
                  </p>
                </div>
                {subdomainAvailable === false && (
                  <div className="bg-red-50/70 dark:bg-red-900/30 backdrop-blur-sm rounded-lg p-3 border border-red-200/50 dark:border-red-700/50">
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                      This subdomain is not available. Please try another one.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-16 text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 rounded-xl"
                  disabled={isLoading || !subdomainAvailable || isCheckingSubdomain}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      <span>Creating Organization...</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="mr-3 h-6 w-6" />
                      <span>Create Organization</span>
                      <ArrowRight className="ml-3 h-6 w-6" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100/90 to-cyan-100/90 dark:from-blue-900/50 dark:to-cyan-900/50 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-blue-200/50 dark:border-blue-700/50 group-hover:scale-110 transition-transform duration-300">
              <Globe className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Custom Domain</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Professional branded URL for your business
            </p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100/90 to-cyan-100/90 dark:from-blue-900/50 dark:to-cyan-900/50 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-blue-200/50 dark:border-blue-700/50 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
              Team Collaboration
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Invite unlimited team members anytime
            </p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100/90 to-cyan-100/90 dark:from-blue-900/50 dark:to-cyan-900/50 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-blue-200/50 dark:border-blue-700/50 group-hover:scale-110 transition-transform duration-300">
              <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Instant Setup</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Start using your enterprise tools immediately
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
