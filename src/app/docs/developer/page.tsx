'use client'

import Link from 'next/link'
import {
  Code,
  Database,
  Shield,
  Zap,
  BookOpen,
  Cpu,
  GitBranch,
  Layers,
  Globe,
  Sparkles,
  Lock,
  Search,
  FileCode,
  Workflow,
  Palette,
  Package
} from 'lucide-react'

export const metadata = {
  title: 'HERA Developer Portal - Enterprise Documentation',
  description:
    'Technical documentation for HERA Universal API v2, Smart Code Engine, and enterprise architecture.'
}

export default function DeveloperPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/docs/developer" className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold text-white">HERA Developer Portal</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/docs/developer" className="text-sm font-medium text-white">
                  Overview
                </Link>
                <Link
                  href="/docs/developer/api-v2"
                  className="text-sm text-blue-200 hover:text-white"
                >
                  API v2
                </Link>
                <Link
                  href="/docs/developer/smart-code"
                  className="text-sm text-blue-200 hover:text-white"
                >
                  Smart Codes
                </Link>
                <Link
                  href="/docs/developer/ui-library"
                  className="text-sm text-blue-200 hover:text-white"
                >
                  UI Library
                </Link>
                <Link
                  href="/docs/developer/architecture"
                  className="text-sm text-blue-200 hover:text-white"
                >
                  Architecture
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-blue-200 hover:text-white">
                <Search className="h-5 w-5" />
              </button>
              <Link
                href="/api/docs/auth"
                className="text-sm text-red-400 hover:text-red-300"
                onClick={async e => {
                  e.preventDefault()
                  await fetch('/api/docs/auth', { method: 'DELETE' })
                  window.location.href = '/docs/login'
                }}
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">HERA Universal API v2</h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Self-assembling, DNA-driven enterprise architecture with Smart Code Engine, dynamic form
            generation, and universal business modeling
          </p>
          <div className="mt-8">
            <Link
              href="/docs/developer/work-summary"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all"
            >
              <Sparkles className="h-5 w-5" />
              View Complete Implementation Summary
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <div className="px-4 py-2 bg-blue-600/20 border border-blue-500/50 rounded-lg">
              <span className="text-blue-200">Version</span>
              <span className="ml-2 text-white font-semibold">2.0.0</span>
            </div>
            <div className="px-4 py-2 bg-green-600/20 border border-green-500/50 rounded-lg">
              <span className="text-green-200">Status</span>
              <span className="ml-2 text-white font-semibold">Production Ready</span>
            </div>
            <div className="px-4 py-2 bg-purple-600/20 border border-purple-500/50 rounded-lg">
              <span className="text-purple-200">Architecture</span>
              <span className="ml-2 text-white font-semibold">6-Table Universal</span>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Documentation</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Universal API v2 */}
            <Link
              href="/docs/developer/api-v2"
              className="group rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:bg-white/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-blue-600/20 p-3">
                  <Code className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-blue-400">
                    Universal API v2
                  </h3>
                  <p className="mt-2 text-sm text-blue-200/80">
                    RPC-first architecture, entity builder, guardrails, and smart code integration
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-blue-600/20 rounded text-blue-300">
                      RPC
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-600/20 rounded text-blue-300">
                      TypeScript
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-600/20 rounded text-blue-300">
                      Zod
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Smart Code Engine */}
            <Link
              href="/docs/developer/smart-code"
              className="group rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:bg-white/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-purple-600/20 p-3">
                  <Cpu className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-purple-400">
                    Smart Code Engine
                  </h3>
                  <p className="mt-2 text-sm text-blue-200/80">
                    DNA decoder, UCR system, dynamic validation, and business logic automation
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-purple-600/20 rounded text-purple-300">
                      UCR
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-600/20 rounded text-purple-300">
                      DNA
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-600/20 rounded text-purple-300">
                      Rules
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* UI Component Library */}
            <Link
              href="/docs/developer/ui-library"
              className="group rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:bg-white/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-green-600/20 p-3">
                  <Palette className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-green-400">
                    UI Library
                  </h3>
                  <p className="mt-2 text-sm text-blue-200/80">
                    React components, theme system, form generation, and Fiori-class patterns
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-green-600/20 rounded text-green-300">
                      React
                    </span>
                    <span className="text-xs px-2 py-1 bg-green-600/20 rounded text-green-300">
                      Tailwind
                    </span>
                    <span className="text-xs px-2 py-1 bg-green-600/20 rounded text-green-300">
                      Query
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Architecture */}
            <Link
              href="/docs/developer/architecture"
              className="group rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:bg-white/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-orange-600/20 p-3">
                  <Database className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-orange-400">
                    Architecture
                  </h3>
                  <p className="mt-2 text-sm text-blue-200/80">
                    6-table universal schema, multi-tenancy, and enterprise patterns
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-orange-600/20 rounded text-orange-300">
                      Schema
                    </span>
                    <span className="text-xs px-2 py-1 bg-orange-600/20 rounded text-orange-300">
                      RLS
                    </span>
                    <span className="text-xs px-2 py-1 bg-orange-600/20 rounded text-orange-300">
                      RBAC
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Integration Guide */}
            <Link
              href="/docs/developer/integration"
              className="group rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:bg-white/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-cyan-600/20 p-3">
                  <GitBranch className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-cyan-400">
                    Integration
                  </h3>
                  <p className="mt-2 text-sm text-blue-200/80">
                    OAuth2 connectors, webhook handling, and third-party integrations
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-cyan-600/20 rounded text-cyan-300">
                      OAuth2
                    </span>
                    <span className="text-xs px-2 py-1 bg-cyan-600/20 rounded text-cyan-300">
                      Webhooks
                    </span>
                    <span className="text-xs px-2 py-1 bg-cyan-600/20 rounded text-cyan-300">
                      APIs
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Security */}
            <Link
              href="/docs/developer/security"
              className="group rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:bg-white/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-red-600/20 p-3">
                  <Lock className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-red-400">Security</h3>
                  <p className="mt-2 text-sm text-blue-200/80">
                    Authentication, authorization, encryption, and compliance
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-red-600/20 rounded text-red-300">
                      JWT
                    </span>
                    <span className="text-xs px-2 py-1 bg-red-600/20 rounded text-red-300">
                      RBAC
                    </span>
                    <span className="text-xs px-2 py-1 bg-red-600/20 rounded text-red-300">
                      KMS
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Work Section */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Recent Implementations
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Universal API v2 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-6 w-6 text-yellow-400" />
                <h3 className="text-xl font-semibold text-white">Universal API v2</h3>
              </div>
              <ul className="space-y-3 text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>RPC-first architecture with direct database function calls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Smart Code Engine with UCR integration for dynamic validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Entity Builder with self-assembling Zod schemas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Guardrails enforcing HERA DNA principles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Signature registry with static fallbacks</span>
                </li>
              </ul>
            </div>

            {/* UI Component Library */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-6 w-6 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">UI Component Library</h3>
              </div>
              <ul className="space-y-3 text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>React Query hooks for all HERA operations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Dynamic theme system with CSS variables</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Form generation from Smart Codes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Fiori-class components (DataTable, FilterBar, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Complete TypeScript support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-white mb-8">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/docs/developer/api-v2/getting-started"
              className="text-blue-400 hover:text-blue-300"
            >
              → Getting Started
            </Link>
            <Link
              href="/docs/developer/api-v2/rpc-endpoints"
              className="text-blue-400 hover:text-blue-300"
            >
              → RPC Endpoints
            </Link>
            <Link
              href="/docs/developer/smart-code/patterns"
              className="text-blue-400 hover:text-blue-300"
            >
              → Smart Code Patterns
            </Link>
            <Link
              href="/docs/developer/ui-library/components"
              className="text-blue-400 hover:text-blue-300"
            >
              → UI Components
            </Link>
            <Link
              href="/docs/developer/architecture/schema"
              className="text-blue-400 hover:text-blue-300"
            >
              → Database Schema
            </Link>
            <Link
              href="/docs/developer/security/authentication"
              className="text-blue-400 hover:text-blue-300"
            >
              → Authentication
            </Link>
            <Link
              href="/docs/developer/integration/webhooks"
              className="text-blue-400 hover:text-blue-300"
            >
              → Webhooks
            </Link>
            <Link href="/docs/developer/examples" className="text-blue-400 hover:text-blue-300">
              → Code Examples
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm text-blue-200/60">
            HERA Developer Portal • Version 2.0.0 • © 2024
          </p>
        </div>
      </footer>
    </div>
  )
}
