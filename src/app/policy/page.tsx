'use client'

import React, { useState, useEffect } from 'react'
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
  CheckCircle,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Zap,
  FileText,
  Clock,
  Award,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const lastUpdated = 'January 26, 2025'
  const effectiveDate = 'January 26, 2025'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)

      // Track active section for navigation highlighting
      const sections = document.querySelectorAll('section[id]')
      const scrollPosition = window.scrollY + 100

      sections.forEach(section => {
        const sectionTop = (section as HTMLElement).offsetTop
        const sectionHeight = (section as HTMLElement).offsetHeight
        const sectionId = section.getAttribute('id')

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(sectionId || '')
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigationItems = [
    { id: 'introduction', label: 'Introduction', icon: Globe },
    { id: 'data-collection', label: 'Data Collection', icon: Database },
    { id: 'data-usage', label: 'How We Use Data', icon: Users },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'cookies', label: 'Cookies', icon: Cookie },
    { id: 'your-rights', label: 'Your Rights', icon: Eye },
    { id: 'contact', label: 'Contact', icon: Mail }
  ]

  return (
    <div className="min-h-screen">
      {/* Modern Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent dark:from-blue-900/10" />

      {/* Subtle Grid Pattern */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]" />
      </div>

      {/* Hero Section with Modern Design */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 rounded-full border border-blue-200 dark:border-blue-800 mb-8">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                GDPR Compliant
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent leading-tight">
              Privacy & Cookie Policy
            </h1>

            {/* Subtitle */}
            <p className="text-xl ink-muted dark:text-slate-300 mb-8 leading-relaxed">
              Your privacy is fundamental to our mission. We're committed to protecting your data
              with enterprise-grade security and complete transparency.
            </p>

            {/* Date Information */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Clock className="w-4 h-4 ink-muted" />
                <span className="dark:ink-muted">Effective:</span>
                <span className="font-semibold ink dark:text-white">{effectiveDate}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <FileText className="w-4 h-4 ink-muted" />
                <span className="dark:ink-muted">Updated:</span>
                <span className="font-semibold ink dark:text-white">{lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* Feature Cards with Modern Design */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {[
              {
                icon: Lock,
                title: 'Multi-Tenant Isolation',
                description: 'Perfect data separation with organization_id isolation',
                gradient: 'from-blue-500/30 to-indigo-500/30',
                lightBg: 'bg-blue-50',
                darkBg: 'dark:bg-blue-950/20'
              },
              {
                icon: Database,
                title: 'Complete Audit Trail',
                description: 'Every action tracked with Smart Code intelligence',
                gradient: 'from-indigo-500/30 to-purple-500/30',
                lightBg: 'bg-indigo-50',
                darkBg: 'dark:bg-indigo-950/20'
              },
              {
                icon: Award,
                title: 'GDPR Compliant',
                description: 'Full compliance with EU data protection regulations',
                gradient: 'from-purple-500/30 to-pink-500/30',
                lightBg: 'bg-purple-50',
                darkBg: 'dark:bg-purple-950/20'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient Border on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative p-6">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <feature.icon
                      className={cn(
                        'w-6 h-6',
                        index === 0
                          ? 'text-blue-600 dark:text-blue-400'
                          : index === 1
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-purple-600 dark:text-purple-400'
                      )}
                    />
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-lg mb-2 ink dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm dark:ink-muted leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content with Side Navigation */}
      <section className="relative pb-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Side Navigation - Sticky */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24">
                <nav className="space-y-1">
                  {navigationItems.map(item => (
                    <Link
                      key={item.id}
                      href={`#${item.id}`}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        activeSection === item.id
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-blue-700 dark:text-blue-400 border-l-2 border-blue-600'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      )}
                      onClick={e => {
                        e.preventDefault()
                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>

                {/* Quick Actions */}
                <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-sm mb-3 ink dark:text-white">Quick Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Contact DPO
                    </button>
                    <button className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="lg:col-span-9 space-y-8">
              {/* Introduction Section */}
              <section id="introduction" className="scroll-mt-24">
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur rounded-xl flex items-center justify-center border border-blue-500/20">
                        <Globe className="w-5 h-5 text-blue-400" />
                      </div>
                      <h2 className="text-2xl font-bold ink dark:text-white">Introduction</h2>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="ink-muted dark:text-slate-300 leading-relaxed mb-4">
                        HERA ERP Ltd. ("HERA", "we", "our", or "us") is committed to protecting and
                        respecting your privacy. This Privacy & Cookie Policy explains how we
                        collect, use, disclose, and safeguard your personal data when you visit our
                        website at heraerp.com or use our enterprise resource planning services.
                      </p>
                      <p className="ink-muted dark:text-slate-300 leading-relaxed mb-6">
                        We comply with the General Data Protection Regulation (EU) 2016/679
                        ("GDPR"), the UK Data Protection Act 2018, and other applicable data
                        protection laws worldwide. Our revolutionary 6-table universal architecture
                        ensures perfect data isolation through our sacred organization_id boundary,
                        providing enterprise-grade security for all users.
                      </p>

                      {/* Info Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold ink dark:text-white mb-3">
                          Data Controller Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-3">
                            <span className="dark:ink-muted">Company:</span>
                            <span className="font-medium ink dark:text-white">HERA ERP Ltd.</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="dark:ink-muted">Contact:</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              privacy@heraerp.com
                            </span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="dark:ink-muted">DPO:</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              dpo@heraerp.com
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Collection Section */}
              <section id="data-collection" className="scroll-mt-24">
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <Database className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h2 className="text-2xl font-bold ink dark:text-white">
                        What Data We Collect
                      </h2>
                    </div>

                    <div className="space-y-6">
                      {/* Personal Data Section */}
                      <div>
                        <h3 className="text-lg font-semibold ink dark:text-white mb-4">
                          Personal Data You Provide
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {[
                            {
                              title: 'Contact Information',
                              items: 'Name, email, phone, job title'
                            },
                            {
                              title: 'Business Information',
                              items: 'Company, industry, size, address'
                            },
                            { title: 'Account Data', items: 'Username, password, preferences' },
                            {
                              title: 'Transaction Data',
                              items: 'Business transactions, audit logs'
                            }
                          ].map((category, index) => (
                            <div
                              key={index}
                              className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
                            >
                              <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h4 className="font-medium ink dark:text-white mb-1">
                                    {category.title}
                                  </h4>
                                  <p className="text-sm dark:ink-muted">{category.items}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Automated Data Section */}
                      <div>
                        <h3 className="text-lg font-semibold ink dark:text-white mb-4">
                          Data We Collect Automatically
                        </h3>
                        <div className="space-y-3">
                          {[
                            {
                              icon: Zap,
                              title: 'Usage Data',
                              description: 'IP address, browser type, pages visited, click paths'
                            },
                            {
                              icon: ChevronRight,
                              title: 'Performance Data',
                              description: 'API response times, system metrics (anonymized)'
                            },
                            {
                              icon: Cookie,
                              title: 'Cookie Data',
                              description: 'Session cookies, preferences, analytics (with consent)'
                            }
                          ].map((item, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                            >
                              <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border">
                                <item.icon className="w-5 h-5 dark:ink-muted" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium ink dark:text-white mb-1">
                                  {item.title}
                                </h4>
                                <p className="text-sm dark:ink-muted">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Warning Card */}
                      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                              Special Categories
                            </h4>
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                              HERA does not intentionally collect sensitive personal data (health,
                              biometric, political opinions). If your business processes such data,
                              it remains isolated within your organization's sacred boundary.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Usage Section */}
              <section id="data-usage" className="scroll-mt-24">
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur rounded-xl flex items-center justify-center border border-purple-500/20">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <h2 className="text-2xl font-bold ink dark:text-white">
                        How We Use Your Data
                      </h2>
                    </div>

                    <p className="ink-muted dark:text-slate-300 mb-6">
                      We process your personal data based on the following legal bases under GDPR:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        {
                          title: 'Contract Performance',
                          article: 'Article 6(1)(b) GDPR',
                          color: 'blue',
                          items: [
                            'Providing HERA ERP services',
                            'Managing your account',
                            'Processing transactions',
                            'Maintaining audit trails'
                          ]
                        },
                        {
                          title: 'Legitimate Interest',
                          article: 'Article 6(1)(f) GDPR',
                          color: 'green',
                          items: [
                            'Improving our services',
                            'Ensuring platform security',
                            'Service updates & notices',
                            'Business intelligence'
                          ]
                        },
                        {
                          title: 'Consent',
                          article: 'Article 6(1)(a) GDPR',
                          color: 'purple',
                          items: [
                            'Marketing communications',
                            'Non-essential cookies',
                            'Special data categories',
                            'Newsletter subscriptions'
                          ]
                        },
                        {
                          title: 'Legal Obligation',
                          article: 'Article 6(1)(c) GDPR',
                          color: 'red',
                          items: [
                            'Regulatory compliance',
                            'Authority requests',
                            'Tax records',
                            'Legal proceedings'
                          ]
                        }
                      ].map((basis, index) => (
                        <div
                          key={index}
                          className={cn(
                            'relative rounded-xl border overflow-hidden',
                            basis.color === 'blue' &&
                              'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20',
                            basis.color === 'green' &&
                              'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20',
                            basis.color === 'purple' &&
                              'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20',
                            basis.color === 'red' &&
                              'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20'
                          )}
                        >
                          <div
                            className={cn(
                              'absolute top-0 left-0 w-1 h-full',
                              basis.color === 'blue' && 'bg-blue-500',
                              basis.color === 'green' && 'bg-green-500',
                              basis.color === 'purple' && 'bg-purple-500',
                              basis.color === 'red' && 'bg-red-500'
                            )}
                          />
                          <div className="p-5 pl-6">
                            <h4 className="font-semibold ink dark:text-white mb-1">
                              {basis.title}
                            </h4>
                            <p className="text-xs dark:ink-muted mb-3">{basis.article}</p>
                            <ul className="space-y-1.5">
                              {basis.items.map((item, i) => (
                                <li
                                  key={i}
                                  className="text-sm ink-muted dark:text-slate-300 flex items-start gap-2"
                                >
                                  <span className="ink-muted mt-0.5">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Security Section */}
              <section id="security" className="scroll-mt-24">
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur rounded-xl flex items-center justify-center border border-green-500/20">
                        <Lock className="w-5 h-5 text-green-400" />
                      </div>
                      <h2 className="text-2xl font-bold ink dark:text-white">
                        Data Storage & Security
                      </h2>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold ink dark:text-white mb-4">
                          Technical & Organizational Measures
                        </h3>
                        <div className="grid gap-3">
                          {[
                            {
                              title: 'Multi-Tenant Isolation',
                              desc: 'Sacred organization_id boundary ensures zero data leakage'
                            },
                            {
                              title: 'Smart Code Architecture',
                              desc: 'Every transaction tagged with intelligent business context'
                            },
                            {
                              title: 'Encryption Standards',
                              desc: 'TLS 1.3 for data in transit, AES-256 for data at rest'
                            },
                            {
                              title: 'Access Control',
                              desc: 'Role-based access control (RBAC) with JWT authentication'
                            },
                            {
                              title: 'Real-time Monitoring',
                              desc: 'Security monitoring with Prometheus and Grafana'
                            },
                            {
                              title: 'Backup & Recovery',
                              desc: 'Automated backups with point-in-time recovery (RPO ≤ 5min)'
                            }
                          ].map((item, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50 to-green-50 dark:from-slate-800 dark:to-green-950/20 rounded-xl border border-slate-200 dark:border-slate-700"
                            >
                              <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-medium ink dark:text-white mb-1">
                                  {item.title}
                                </h4>
                                <p className="text-sm dark:ink-muted">{item.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Data Location Card */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold ink dark:text-white mb-3">
                          Data Location & Transfers
                        </h4>
                        <p className="text-sm ink-muted dark:text-slate-300 mb-3">
                          Primary data storage is within the European Economic Area (EEA). For
                          international transfers, we rely on:
                        </p>
                        <ul className="space-y-2 text-sm ink-muted dark:text-slate-300">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                            <span>EU-approved Standard Contractual Clauses (SCCs)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                            <span>Adequacy decisions by the European Commission</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                            <span>Your explicit consent for specific transfers</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Cookies Section */}
              <section id="cookies" className="scroll-mt-24">
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur rounded-xl flex items-center justify-center border border-amber-500/20">
                        <Cookie className="w-5 h-5 text-amber-400" />
                      </div>
                      <h2 className="text-2xl font-bold ink dark:text-white">
                        Cookies & Tracking Technologies
                      </h2>
                    </div>

                    <p className="ink-muted dark:text-slate-300 mb-6">
                      We use cookies and similar technologies to enhance your experience:
                    </p>

                    <div className="space-y-4">
                      {[
                        {
                          type: 'Essential Cookies',
                          status: 'Always Active',
                          color: 'green',
                          description:
                            'Required for basic functionality, security, and authentication. Cannot be disabled.',
                          examples: [
                            'Session management',
                            'Security tokens',
                            'Organization context'
                          ]
                        },
                        {
                          type: 'Functional Cookies',
                          status: 'Optional',
                          color: 'blue',
                          description:
                            'Enhance functionality and personalization. Can be disabled in preferences.',
                          examples: ['Language preferences', 'Theme settings', 'Dashboard layouts']
                        },
                        {
                          type: 'Analytics Cookies',
                          status: 'With Consent',
                          color: 'purple',
                          description:
                            'Help us understand usage patterns. Only set with your explicit consent.',
                          examples: [
                            'Google Analytics',
                            'Performance monitoring',
                            'User journey tracking'
                          ]
                        }
                      ].map((cookie, index) => (
                        <div
                          key={index}
                          className={cn(
                            'rounded-xl border p-5',
                            cookie.color === 'green' &&
                              'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
                            cookie.color === 'blue' &&
                              'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
                            cookie.color === 'purple' &&
                              'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold ink dark:text-white">{cookie.type}</h4>
                            <span
                              className={cn(
                                'text-xs font-medium px-2 py-1 rounded-full',
                                cookie.color === 'green' &&
                                  'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
                                cookie.color === 'blue' &&
                                  'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
                                cookie.color === 'purple' &&
                                  'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                              )}
                            >
                              {cookie.status}
                            </span>
                          </div>
                          <p className="text-sm ink-muted dark:text-slate-300 mb-3">
                            {cookie.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cookie.examples.map((example, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 bg-muted rounded-md border border-border"
                              >
                                {example}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-3">
                        <Cookie className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-900 dark:text-amber-200 mb-1">
                            Managing Cookies
                          </h4>
                          <p className="text-sm text-amber-800 dark:text-amber-300">
                            You can control cookies through our Cookie Banner on first visit, or
                            anytime via your browser settings. Note that disabling cookies may
                            affect functionality.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Your Rights Section */}
              <section id="your-rights" className="scroll-mt-24">
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <Eye className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h2 className="text-2xl font-bold ink dark:text-white">Your GDPR Rights</h2>
                    </div>

                    <p className="ink-muted dark:text-slate-300 mb-6">
                      Under GDPR, you have the following rights regarding your personal data:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      {[
                        {
                          title: 'Right to Access',
                          desc: 'Request a copy of your personal data we hold'
                        },
                        {
                          title: 'Right to Rectification',
                          desc: 'Request correction of inaccurate data'
                        },
                        {
                          title: 'Right to Erasure',
                          desc: "Request deletion of your data ('right to be forgotten')"
                        },
                        { title: 'Right to Restriction', desc: 'Request limitation of processing' },
                        {
                          title: 'Right to Data Portability',
                          desc: 'Receive your data in machine-readable format'
                        },
                        {
                          title: 'Right to Object',
                          desc: 'Object to processing based on legitimate interests'
                        }
                      ].map((right, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/20 rounded-xl p-5 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold ink dark:text-white mb-1">
                                {right.title}
                              </h4>
                              <p className="text-sm dark:ink-muted">{right.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* How to Exercise Rights */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                      <h4 className="font-semibold ink dark:text-white mb-3">
                        How to Exercise Your Rights
                      </h4>
                      <p className="text-sm ink-muted dark:text-slate-300 mb-4">
                        To exercise any of these rights, contact us through the following channels:
                      </p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xs font-medium dark:ink-muted">Email</span>
                          </div>
                          <p className="text-sm font-medium ink dark:text-white">
                            privacy@heraerp.com
                          </p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xs font-medium dark:ink-muted">DPO</span>
                          </div>
                          <p className="text-sm font-medium ink dark:text-white">dpo@heraerp.com</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xs font-medium dark:ink-muted">Response</span>
                          </div>
                          <p className="text-sm font-medium ink dark:text-white">Within 30 days</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Section - Enterprise Grade Glassmorphism */}
              <section id="contact" className="scroll-mt-24">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl" />
                  <div className="relative card-glass rounded-2xl border border-border overflow-hidden">
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur rounded-xl flex items-center justify-center border border-indigo-500/20">
                          <Mail className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold ink">Contact Information</h2>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="card-glass rounded-xl p-6 border border-border hover:border-indigo-500/30 transition-all">
                          <h3 className="font-semibold ink mb-4">Data Controller</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Sparkles className="w-4 h-4 text-indigo-400" />
                              <span className="ink-muted">HERA ERP Ltd.</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Mail className="w-4 h-4 text-indigo-400" />
                              <a
                                href="mailto:info@heraerp.com"
                                className="ink-muted hover:text-indigo-400 transition-colors"
                              >
                                info@heraerp.com
                              </a>
                            </div>
                            <div className="flex items-center gap-3">
                              <Globe className="w-4 h-4 text-indigo-400" />
                              <a
                                href="https://heraerp.com"
                                className="ink-muted hover:text-indigo-400 transition-colors"
                              >
                                heraerp.com
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="card-glass rounded-xl p-6 border border-border hover:border-purple-500/30 transition-all">
                          <h3 className="font-semibold ink mb-4">Data Protection Officer</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Mail className="w-4 h-4 text-purple-400" />
                              <a
                                href="mailto:dpo@heraerp.com"
                                className="ink-muted hover:text-purple-400 transition-colors"
                              >
                                dpo@heraerp.com
                              </a>
                            </div>
                            <div className="flex items-center gap-3">
                              <Shield className="w-4 h-4 text-purple-400" />
                              <span className="ink-muted">GDPR Compliance Team</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-purple-400" />
                              <span className="ink-muted">Response within 30 days</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </section>
    </div>
  )
}
