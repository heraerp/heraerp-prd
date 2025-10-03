'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Shield, 
  Lock, 
  Key, 
  UserCheck, 
  Database, 
  Globe, 
  Layers,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Fingerprint,
  Eye,
  FileKey,
  ShieldCheck,
  Network,
  Zap,
  Code2,
  Building2,
  Users,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export default function SecurityPage() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const securityLayers = [
    {
      title: 'Organization Isolation',
      description: 'Sacred boundary enforcement with zero data leakage',
      icon: Building2,
      features: [
        'Every query filtered by organization_id',
        'Row Level Security (RLS) at database level',
        'Automatic multi-tenant isolation',
        'Zero cross-tenant data access'
      ],
      color: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Authentication & Authorization',
      description: 'Multi-layer identity and access management',
      icon: UserCheck,
      features: [
        'JWT-based authentication',
        'Dynamic role-based access control',
        'Organization-scoped permissions',
        'SSO/SAML 2.0 support'
      ],
      color: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-400'
    },
    {
      title: 'Data Encryption',
      description: 'Enterprise-grade encryption at rest and in transit',
      icon: Lock,
      features: [
        'AES-256 encryption at rest',
        'TLS 1.3 for data in transit',
        'KMS envelope encryption for PII',
        'Automatic key rotation'
      ],
      color: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-400'
    },
    {
      title: 'Audit & Compliance',
      description: 'Complete activity tracking and compliance reporting',
      icon: Activity,
      features: [
        'Immutable audit trail',
        'Real-time security monitoring',
        'GDPR/HIPAA compliance ready',
        'Automated compliance reports'
      ],
      color: 'from-amber-500/10 to-orange-500/10',
      iconColor: 'text-amber-400'
    }
  ]

  const enterpriseFeatures = [
    {
      title: 'SSO Provider',
      description: 'SAML 2.0 and OIDC with JIT provisioning',
      icon: Fingerprint,
      status: 'PRODUCTION'
    },
    {
      title: 'RBAC Engine',
      description: 'YAML-based policies with smart code families',
      icon: Shield,
      status: 'PRODUCTION'
    },
    {
      title: 'KMS Integration',
      description: 'Hardware security module support',
      icon: Key,
      status: 'PRODUCTION'
    },
    {
      title: 'Rate Limiting',
      description: 'DDoS protection with sliding windows',
      icon: Network,
      status: 'PRODUCTION'
    }
  ]

  const codeExample = `// HERA DNA Security Implementation
import { withSecurity } from '@/lib/security/security-middleware'
import { useBusinessSecurity } from '@/hooks/useBusinessSecurity'

// API Endpoint Protection
export const GET = withSecurity(async (req, context) => {
  // Automatic organization filtering applied
  // context.organizationId is guaranteed
  const data = await fetchData(context.organizationId)
  return NextResponse.json(data)
}, {
  allowedRoles: ['owner', 'manager'],
  enableAuditLogging: true,
  enableRateLimit: true
})

// Component-Level Protection
function FinancialDashboard() {
  const { canViewFinancials, hasPermission } = useBusinessSecurity()
  
  if (!canViewFinancials) {
    return <AccessDenied />
  }
  
  return <SensitiveFinancialData />
}`

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dark Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent" />
      
      {/* Floating Gradient Orbs */}
      {mounted && (
        <>
          <div className="fixed top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="fixed bottom-20 left-20 w-[30rem] h-[30rem] bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/70 border-b border-white/10 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <nav className="flex items-center gap-2 text-sm">
                <Link href="/docs" className="text-gray-400 hover:text-gray-200 transition-colors">
                  Docs
                </Link>
                <span className="text-gray-500">/</span>
                <span className="text-gray-100">Security</span>
              </nav>
              <Link href="/docs/hub">
                <Button size="sm" variant="outline" className="border-gray-600 text-gray-100 hover:border-amber-500 transition-colors">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Back to Hub
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-12 space-y-20">
          {/* Hero Section */}
          <div className={cn(
            "relative overflow-hidden rounded-3xl",
            "bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-900/40",
            "backdrop-blur-xl border border-white/10",
            "shadow-2xl transition-all duration-500",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-green-500/5" />
            <div className="relative p-12 md:p-16">
              <div className="max-w-4xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-green-500/20 backdrop-blur-sm rounded-xl border border-blue-500/20">
                    <Shield className="w-8 h-8 text-blue-400" />
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30">
                    ENTERPRISE GRADE
                  </Badge>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-gray-100 via-blue-400 to-gray-100 bg-clip-text text-transparent bg-300% animate-gradient">
                    HERA DNA Security
                  </span>
                </h1>
                
                <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl">
                  Bulletproof enterprise security with zero-trust architecture. Every request protected, 
                  every action audited, every boundary sacred.
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                    <span>Zero data leakage</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Lock className="w-4 h-4 text-blue-400" />
                    <span>End-to-end encryption</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Eye className="w-4 h-4 text-purple-400" />
                    <span>Complete audit trail</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Layers */}
          <div className={cn(
            "transition-all duration-500 delay-100",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm">
                <Layers className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100">
                Multi-Layer Security Architecture
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {securityLayers.map((layer, index) => (
                <Card
                  key={index}
                  className={cn(
                    "relative overflow-hidden",
                    "bg-gray-900/60 backdrop-blur-xl",
                    "border-white/10",
                    "shadow-lg hover:shadow-xl transition-all duration-300",
                    "group"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                    style={{
                      backgroundImage: `linear-gradient(to bottom right, ${layer.color})`
                    }} 
                  />
                  <CardHeader className="relative pb-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-3 rounded-xl bg-gradient-to-br backdrop-blur-sm",
                        layer.color
                      )}>
                        <layer.icon className={cn("w-6 h-6", layer.iconColor)} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl text-gray-100 mb-1">
                          {layer.title}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          {layer.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <ul className="space-y-2">
                      {layer.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Three-Layer Pattern */}
          <div className={cn(
            "transition-all duration-500 delay-200",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100">
                Three-Layer Authorization Pattern
              </h2>
            </div>

            <Alert className="bg-amber-900/20 border-amber-500/30 backdrop-blur-xl">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-300">
                ALL production pages MUST implement this pattern. Skipping any layer will cause security vulnerabilities.
              </AlertDescription>
            </Alert>

            <div className="mt-6 grid md:grid-cols-3 gap-6">
              <Card className={cn(
                "relative overflow-hidden",
                "bg-gray-900/60 backdrop-blur-xl",
                "border-white/10",
                "shadow-lg"
              )}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                      1
                    </div>
                    <CardTitle className="text-lg text-gray-100">Authentication Check</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-800/50 rounded p-3 text-xs overflow-x-auto">
                    <code className="text-gray-300">{`if (!isAuthenticated) {
  return <Alert>Please log in</Alert>
}`}</code>
                  </pre>
                  <p className="text-sm text-gray-400 mt-3">
                    Verify user is logged in
                  </p>
                </CardContent>
              </Card>

              <Card className={cn(
                "relative overflow-hidden",
                "bg-gray-900/60 backdrop-blur-xl",
                "border-white/10",
                "shadow-lg"
              )}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                      2
                    </div>
                    <CardTitle className="text-lg text-gray-100">Context Loading</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-800/50 rounded p-3 text-xs overflow-x-auto">
                    <code className="text-gray-300">{`if (contextLoading) {
  return <LoadingSpinner />
}`}</code>
                  </pre>
                  <p className="text-sm text-gray-400 mt-3">
                    Wait for security context
                  </p>
                </CardContent>
              </Card>

              <Card className={cn(
                "relative overflow-hidden",
                "bg-gray-900/60 backdrop-blur-xl",
                "border-white/10",
                "shadow-lg"
              )}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                      3
                    </div>
                    <CardTitle className="text-lg text-gray-100">Organization Check</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-800/50 rounded p-3 text-xs overflow-x-auto">
                    <code className="text-gray-300">{`if (!organizationId) {
  return <Alert>No org context</Alert>
}`}</code>
                  </pre>
                  <p className="text-sm text-gray-400 mt-3">
                    Ensure org boundary
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Code Implementation */}
          <div className={cn(
            "transition-all duration-500 delay-300",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
                <Code2 className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100">
                Implementation Example
              </h2>
            </div>

            <Card className={cn(
              "relative overflow-hidden",
              "bg-gray-900/60 backdrop-blur-xl",
              "border-white/10",
              "shadow-xl"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />
              <CardContent className="relative p-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                  <pre className="text-sm overflow-x-auto">
                    <code className="text-gray-300">{codeExample}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enterprise Features */}
          <div className={cn(
            "transition-all duration-500 delay-400",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm">
                <ShieldCheck className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100">
                Enterprise Security Features
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {enterpriseFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className={cn(
                    "relative overflow-hidden",
                    "bg-gray-900/60 backdrop-blur-xl",
                    "border-white/10",
                    "shadow-lg hover:shadow-xl transition-all duration-300",
                    "group"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="relative pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                        <feature.icon className="h-5 w-5 text-green-400" />
                      </div>
                      <Badge className="bg-green-500/10 text-green-300 border-green-500/20">
                        {feature.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-gray-100 mt-3">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-sm text-gray-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Security Best Practices */}
          <div className={cn(
            "transition-all duration-500 delay-500",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Card className={cn(
              "relative overflow-hidden",
              "bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-purple-900/40",
              "backdrop-blur-xl border border-white/10",
              "shadow-xl"
            )}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-blue-500/20">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-gray-100">Security Best Practices</CardTitle>
                    <CardDescription className="text-gray-400">
                      Follow these rules to maintain HERA's security integrity
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-100 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      Always DO
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-green-400 mt-2" />
                        Use SecuredBusinessProvider for all apps
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-green-400 mt-2" />
                        Include organization_id in every API call
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-green-400 mt-2" />
                        Implement the three-layer pattern
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-green-400 mt-2" />
                        Use withSecurity middleware for APIs
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-green-400 mt-2" />
                        Check permissions before sensitive data
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-100 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      Never DO
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-red-400 mt-2" />
                        Bypass organization_id filtering
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-red-400 mt-2" />
                        Store sensitive data in metadata
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-red-400 mt-2" />
                        Hardcode security roles
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-red-400 mt-2" />
                        Skip context loading checks
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-red-400 mt-2" />
                        Mix data between organizations
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300 flex items-start gap-2">
                    <FileKey className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      For complete security documentation, see{' '}
                      <Link href="/docs/hera-dna-security" className="underline hover:text-blue-200 transition-colors">
                        HERA DNA Security Guide
                      </Link>
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Related Documentation */}
          <div className={cn(
            "transition-all duration-500 delay-600",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm">
                <Globe className="h-5 w-5 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-100">
                Related Documentation
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/docs/authorization-pattern">
                <Card className={cn(
                  "relative overflow-hidden h-full",
                  "bg-gray-900/60 backdrop-blur-xl",
                  "border-white/10",
                  "shadow-lg hover:shadow-xl transition-all duration-300",
                  "group hover:scale-[1.02] cursor-pointer"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="relative">
                    <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                      Authorization Pattern
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Complete implementation guide for the three-layer pattern
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/docs/enterprise/rbac">
                <Card className={cn(
                  "relative overflow-hidden h-full",
                  "bg-gray-900/60 backdrop-blur-xl",
                  "border-white/10",
                  "shadow-lg hover:shadow-xl transition-all duration-300",
                  "group hover:scale-[1.02] cursor-pointer"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="relative">
                    <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                      RBAC System
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Dynamic role-based access control configuration
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/docs/enterprise/audit">
                <Card className={cn(
                  "relative overflow-hidden h-full",
                  "bg-gray-900/60 backdrop-blur-xl",
                  "border-white/10",
                  "shadow-lg hover:shadow-xl transition-all duration-300",
                  "group hover:scale-[1.02] cursor-pointer"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="relative">
                    <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                      Audit System
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Real-time audit logging and compliance reporting
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}