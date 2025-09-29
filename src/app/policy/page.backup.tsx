'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Shield,
  Lock,
  Database,
  Eye,
  Users,
  Globe,
  Cookie,
  Mail,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

export default function PrivacyPolicyPage() {
  const lastUpdated = 'January 26, 2025'
  const effectiveDate = 'January 26, 2025'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                HERA ERP
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="ink-muted dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/terms"
                className="ink-muted dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="ink-muted dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Privacy & Cookie Policy
            </h1>
            <p className="text-xl ink-muted dark:text-gray-300">
              Your privacy is our priority. GDPR-compliant data protection you can trust.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 text-sm dark:ink-muted">
              <span>Effective: {effectiveDate}</span>
              <span>•</span>
              <span>Last Updated: {lastUpdated}</span>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                <h3 className="font-semibold mb-2 ink dark:text-gray-100">
                  Multi-Tenant Isolation
                </h3>
                <p className="text-sm ink-muted dark:text-gray-300">
                  Perfect data separation with organization_id isolation
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <Database className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mb-3" />
                <h3 className="font-semibold mb-2 ink dark:text-gray-100">
                  Complete Audit Trail
                </h3>
                <p className="text-sm ink-muted dark:text-gray-300">
                  Every action tracked with Smart Code intelligence
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <Shield className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
                <h3 className="font-semibold mb-2 ink dark:text-gray-100">
                  GDPR Compliant
                </h3>
                <p className="text-sm ink-muted dark:text-gray-300">
                  Full compliance with EU data protection regulations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Section 1: Introduction */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  1. Introduction
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                <p className="ink dark:text-gray-300 mb-4">
                  HERA ERP Ltd. ("HERA", "we", "our", or "us") is committed to protecting and
                  respecting your privacy. This Privacy & Cookie Policy explains how we collect,
                  use, disclose, and safeguard your personal data when you visit our website at
                  heraerp.com or use our enterprise resource planning services.
                </p>
                <p className="ink dark:text-gray-300 mb-4">
                  We comply with the General Data Protection Regulation (EU) 2016/679 ("GDPR"), the
                  UK Data Protection Act 2018, and other applicable data protection laws worldwide.
                  Our revolutionary 6-table universal architecture ensures perfect data isolation
                  through our sacred organization_id boundary, providing enterprise-grade security
                  for all users.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Data Controller:</strong> HERA ERP Ltd.
                    <br />
                    <strong>Contact:</strong> privacy@heraerp.com
                    <br />
                    <strong>DPO Contact:</strong> dpo@heraerp.com (if applicable)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Data Collection */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Database className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  2. What Data We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold ink dark:text-gray-100">
                    Personal Data You Provide:
                  </h4>
                  <ul className="space-y-2 ink dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Contact Information:</strong> Name, email address, phone number, job
                        title
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Business Information:</strong> Company name, industry, organization
                        size, business address
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Account Data:</strong> Username, encrypted password,
                        organization_id, user preferences
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Transaction Data:</strong> Smart Code-tagged business transactions,
                        audit logs, workflow data
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold ink dark:text-gray-100">
                    Data We Collect Automatically:
                  </h4>
                  <ul className="space-y-2 ink dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Usage Data:</strong> IP address, browser type, device information,
                        pages visited, click paths
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Performance Data:</strong> API response times, system health metrics
                        (anonymized)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Cookie Data:</strong> Session cookies, preference cookies, analytics
                        cookies (with consent)
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mt-4">
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    <strong>Special Categories:</strong> HERA does not intentionally collect
                    sensitive personal data (health, biometric, political opinions). If your
                    business processes such data, it remains isolated within your organization's
                    sacred boundary.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: How We Use Data */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  3. How We Use Your Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="ink dark:text-gray-300">
                  We process your personal data based on the following legal bases under GDPR:
                </p>

                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      Contract Performance (Article 6(1)(b) GDPR)
                    </h4>
                    <ul className="space-y-1 text-sm ink dark:text-gray-300">
                      <li>• Providing HERA ERP services and support</li>
                      <li>• Managing your account and organization settings</li>
                      <li>• Processing transactions with Smart Code intelligence</li>
                      <li>• Maintaining audit trails for compliance</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      Legitimate Interest (Article 6(1)(f) GDPR)
                    </h4>
                    <ul className="space-y-1 text-sm ink dark:text-gray-300">
                      <li>• Improving our services through analytics</li>
                      <li>• Ensuring platform security and preventing fraud</li>
                      <li>• Sending service updates and important notices</li>
                      <li>• Conducting business intelligence and research</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      Consent (Article 6(1)(a) GDPR)
                    </h4>
                    <ul className="space-y-1 text-sm ink dark:text-gray-300">
                      <li>• Sending marketing communications and newsletters</li>
                      <li>• Setting non-essential cookies for analytics</li>
                      <li>• Processing special categories of data (if applicable)</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      Legal Obligation (Article 6(1)(c) GDPR)
                    </h4>
                    <ul className="space-y-1 text-sm ink dark:text-gray-300">
                      <li>• Complying with regulatory requirements</li>
                      <li>• Responding to lawful requests from authorities</li>
                      <li>• Maintaining records for tax and accounting purposes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Data Storage & Security */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
                  4. Data Storage & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold ink dark:text-gray-100">
                    Technical & Organizational Measures:
                  </h4>
                  <ul className="space-y-2 ink dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Multi-Tenant Isolation:</strong> Sacred organization_id boundary
                        ensures zero data leakage between organizations
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Smart Code Architecture:</strong> Every transaction tagged with
                        intelligent business context for perfect audit trails
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Encryption:</strong> TLS 1.3 for data in transit, AES-256 for data
                        at rest
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Access Control:</strong> Role-based access control (RBAC) with JWT
                        authentication
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Monitoring:</strong> Real-time security monitoring with Prometheus
                        and Grafana
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Backup & Recovery:</strong> Automated backups with point-in-time
                        recovery (RPO ≤ 5min)
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold ink dark:text-gray-100">Data Location:</h4>
                  <p className="ink dark:text-gray-300">
                    Primary data storage is within the European Economic Area (EEA). For
                    international transfers, we rely on:
                  </p>
                  <ul className="space-y-1 text-sm ink dark:text-gray-300 ml-4">
                    <li>• EU-approved Standard Contractual Clauses (SCCs)</li>
                    <li>• Adequacy decisions by the European Commission</li>
                    <li>• Your explicit consent for specific transfers</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-green-900 dark:text-green-200">
                    <strong>Security Incident Response:</strong> In the unlikely event of a data
                    breach affecting your personal data, we will notify you within 72 hours in
                    accordance with GDPR requirements.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Data Sharing */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  5. Data Sharing & Third Parties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="ink dark:text-gray-300">
                  We do not sell, rent, or trade your personal data. We only share data with:
                </p>

                <div className="space-y-3">
                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      Service Providers (Data Processors)
                    </h4>
                    <ul className="space-y-1 text-sm ink dark:text-gray-300">
                      <li>
                        • <strong>Supabase:</strong> Database and authentication services (EU/US
                        with SCCs)
                      </li>
                      <li>
                        • <strong>Vercel:</strong> Hosting and CDN services (Global with DPA)
                      </li>
                      <li>
                        • <strong>SendGrid:</strong> Email delivery services (US with SCCs)
                      </li>
                      <li>
                        • <strong>Stripe:</strong> Payment processing (PCI-DSS compliant)
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      Integration Partners (Optional)
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300 mb-2">
                      Only if you explicitly enable these integrations:
                    </p>
                    <ul className="space-y-1 text-sm ink dark:text-gray-300">
                      <li>• Microsoft 365, Google Workspace</li>
                      <li>• LinkedIn, Mailchimp</li>
                      <li>• Banking and payment gateways</li>
                      <li>• Industry-specific tools</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      Legal Requirements
                    </h4>
                    <ul className="space-y-1 text-sm ink dark:text-gray-300">
                      <li>• Law enforcement agencies (with valid legal basis)</li>
                      <li>• Regulatory bodies and government authorities</li>
                      <li>• Courts and tribunals</li>
                      <li>• Professional advisers (lawyers, accountants)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 6: Cookies */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Cookie className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  6. Cookies & Tracking Technologies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="ink dark:text-gray-300">
                  We use cookies and similar technologies to enhance your experience:
                </p>

                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                      Essential Cookies (Always Active)
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      Required for basic functionality, security, and authentication. Cannot be
                      disabled.
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-green-700 dark:text-green-400">
                      <li>• Session management (supabase-auth-token)</li>
                      <li>• Security tokens (csrf-token)</li>
                      <li>• Organization context (org-id)</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      Functional Cookies (Optional)
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Enhance functionality and personalization. Can be disabled in preferences.
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-400">
                      <li>• Language preferences</li>
                      <li>• Theme settings (dark/light mode)</li>
                      <li>• Dashboard layouts</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                      Analytics Cookies (With Consent)
                    </h4>
                    <p className="text-sm text-purple-800 dark:text-purple-300">
                      Help us understand usage patterns. Only set with your explicit consent.
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-purple-700 dark:text-purple-400">
                      <li>• Google Analytics (_ga, _gid)</li>
                      <li>• Performance monitoring</li>
                      <li>• User journey tracking</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-amber-500 pl-4">
                  <p className="text-sm ink dark:text-gray-300">
                    <strong>Managing Cookies:</strong> You can control cookies through our Cookie
                    Banner on first visit, or anytime via your browser settings. Note that disabling
                    cookies may affect functionality.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 7: Your Rights */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Eye className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  7. Your GDPR Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="ink dark:text-gray-300">
                  Under GDPR, you have the following rights regarding your personal data:
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Right to Access
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      Request a copy of your personal data we hold (Subject Access Request)
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Right to Rectification
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      Request correction of inaccurate or incomplete personal data
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Right to Erasure
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      Request deletion of your data ("right to be forgotten") where applicable
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Right to Restriction
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      Request limitation of processing in certain circumstances
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Right to Data Portability
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      Receive your data in a structured, machine-readable format
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Right to Object
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      Object to processing based on legitimate interests or direct marketing
                    </p>
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                    How to Exercise Your Rights
                  </h4>
                  <p className="text-sm text-indigo-800 dark:text-indigo-300 mb-2">
                    To exercise any of these rights, contact us at:
                  </p>
                  <ul className="space-y-1 text-sm text-indigo-700 dark:text-indigo-400">
                    <li>📧 Email: privacy@heraerp.com</li>
                    <li>📧 DPO: dpo@heraerp.com</li>
                    <li>⏱️ Response time: Within 30 days</li>
                  </ul>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <p className="text-sm ink dark:text-gray-300">
                    <strong>Right to Withdraw Consent:</strong> Where processing is based on
                    consent, you can withdraw it at any time without affecting the lawfulness of
                    processing before withdrawal.
                  </p>
                </div>

                <div className="border-l-4 border-amber-500 pl-4">
                  <p className="text-sm ink dark:text-gray-300">
                    <strong>Right to Complain:</strong> You have the right to lodge a complaint with
                    your local supervisory authority if you believe we have not handled your data
                    properly.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 8: Data Retention */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Database className="w-6 h-6 text-red-600 dark:text-red-400" />
                  8. Data Retention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="ink dark:text-gray-300">
                  We retain personal data only as long as necessary for the purposes collected:
                </p>

                <div className="space-y-3">
                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      Active Account Data
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      Retained for the duration of your subscription plus 30 days grace period
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      Transaction & Audit Logs
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      7 years for compliance with financial regulations and accounting standards
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      Marketing Data
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      Until you unsubscribe or withdraw consent, reviewed annually
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      Security Logs
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      90 days for security monitoring and incident response
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      Backup Data
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      30 days in encrypted backups for disaster recovery
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <p className="text-sm text-red-900 dark:text-red-200">
                    <strong>Deletion Process:</strong> When retention periods expire, data is
                    permanently deleted using secure deletion methods. Smart Code audit trails are
                    anonymized rather than deleted for system integrity.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 9: International Transfers */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  9. International Data Transfers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="ink dark:text-gray-300">
                  Your data may be transferred outside the EEA. We ensure adequate protection
                  through:
                </p>

                <ul className="space-y-2 ink dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>EU-approved Standard Contractual Clauses (SCCs) with all processors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Adequacy decisions (UK, Switzerland, Canada, Japan, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Binding Corporate Rules for intra-group transfers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Your explicit consent for specific transfers when required</span>
                  </li>
                </ul>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Transfer Impact Assessment:</strong> We conduct regular assessments to
                    ensure transfers meet GDPR standards and do not undermine your data protection
                    rights.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 10: Children's Privacy */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Users className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  10. Children's Privacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="ink dark:text-gray-300">
                  HERA ERP is designed for business use and is not intended for children under 16.
                  We do not knowingly collect personal data from children. If you believe a child
                  has provided us with personal data, please contact us immediately at
                  privacy@heraerp.com and we will delete such information.
                </p>
              </CardContent>
            </Card>

            {/* Section 11: Marketing */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Mail className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  11. Marketing Communications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="ink dark:text-gray-300">
                  We may send you marketing communications about our products, services, and updates
                  if:
                </p>

                <ul className="space-y-2 ink dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>You have given explicit consent (opt-in)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>You are an existing customer and haven't opted out (soft opt-in)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>The communication relates to similar products/services</span>
                  </li>
                </ul>

                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
                  <p className="text-sm text-teal-900 dark:text-teal-200">
                    <strong>Unsubscribe Anytime:</strong> Every marketing email contains an
                    unsubscribe link. You can also update preferences in your account settings or
                    email privacy@heraerp.com.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 12: Contact & DPO */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  12. Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold ink dark:text-gray-100 mb-3">
                      Data Controller
                    </h4>
                    <div className="space-y-2 text-sm ink dark:text-gray-300">
                      <p>
                        <strong>HERA ERP Ltd.</strong>
                      </p>
                      <p>📧 General: info@heraerp.com</p>
                      <p>📧 Privacy: privacy@heraerp.com</p>
                      <p>🌐 Website: heraerp.com</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold ink dark:text-gray-100 mb-3">
                      Data Protection Officer
                    </h4>
                    <div className="space-y-2 text-sm ink dark:text-gray-300">
                      <p>📧 DPO: dpo@heraerp.com</p>
                      <p>📮 Postal: [Address if required]</p>
                      <p>📞 Phone: [If provided]</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold ink dark:text-gray-100 mb-3">
                    Supervisory Authorities
                  </h4>
                  <p className="text-sm ink dark:text-gray-300 mb-2">
                    You may lodge a complaint with your local data protection authority:
                  </p>
                  <ul className="space-y-1 text-sm dark:ink-muted">
                    <li>• UK: Information Commissioner's Office (ico.org.uk)</li>
                    <li>• Ireland: Data Protection Commission (dataprotection.ie)</li>
                    <li>• Germany: BfDI (bfdi.bund.de)</li>
                    <li>• France: CNIL (cnil.fr)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Section 13: Updates */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  13. Updates to This Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="ink dark:text-gray-300">
                  We may update this Privacy Policy from time to time to reflect changes in our
                  practices, technology, legal requirements, or business operations.
                </p>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                    Notification Process
                  </h4>
                  <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
                    <li>
                      • <strong>Material Changes:</strong> Email notification to all users
                    </li>
                    <li>
                      • <strong>Minor Updates:</strong> Posted on this page with updated date
                    </li>
                    <li>
                      • <strong>Review Frequency:</strong> We review this policy annually
                    </li>
                    <li>
                      • <strong>Version History:</strong> Previous versions available upon request
                    </li>
                  </ul>
                </div>

                <p className="text-sm dark:ink-muted">
                  The latest version will always be available at heraerp.com/policy
                </p>
              </CardContent>
            </Card>

            {/* HERA-Specific Features */}
            <Card className="border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 ink dark:text-gray-100">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  HERA's Advanced Privacy Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      🔒 Perfect Multi-Tenancy
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      Sacred organization_id boundary ensures your data never mixes with others.
                      Mario's restaurant data is completely isolated from Dr. Smith's clinic.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      🧬 Smart Code Intelligence
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      Every transaction tagged with business context for perfect audit trails.
                      Complete transparency without exposing sensitive data.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      📊 6-Table Universal Architecture
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      All data stored in 6 sacred tables with consistent security model. No data
                      sprawl, no security gaps, perfect control.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
                    <h4 className="font-semibold ink dark:text-gray-100 mb-2">
                      🛡️ Enterprise Security DNA
                    </h4>
                    <p className="text-sm ink-muted dark:text-gray-300">
                      SSO/SAML 2.0, RBAC, KMS encryption, rate limiting built-in. Enterprise-grade
                      security as standard, not an add-on.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-800/30 dark:to-cyan-800/30 rounded-lg p-4">
                  <p className="text-center text-sm font-medium text-blue-900 dark:text-blue-200">
                    HERA's revolutionary architecture provides privacy by design, not by policy
                    alone.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8 px-6 mt-16">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4">
            <p className="text-sm dark:ink-muted">
              © 2025 HERA ERP Ltd. All rights reserved. | Privacy-first enterprise software.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <Link
                href="/terms"
                className="dark:ink-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Terms of Service
              </Link>
              <Link href="/policy" className="text-blue-600 dark:text-blue-400 font-semibold">
                Privacy Policy
              </Link>
              <Link
                href="/security"
                className="dark:ink-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Security
              </Link>
              <Link
                href="/contact"
                className="dark:ink-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
