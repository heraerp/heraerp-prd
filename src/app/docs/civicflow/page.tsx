import Link from 'next/link'
import { Book, FileText, Rocket, Users, Shield, Zap, Search, HelpCircle } from 'lucide-react'
import { DocsSearch } from '@/components/docs/DocsSearch'

export const metadata = {
  title: 'Civicflow Documentation - User Guides & Help Center',
  description: 'Complete documentation for Civicflow CRM and grants management platform. Get started guides, user manuals, and best practices for public sector organizations.',
  keywords: 'Civicflow documentation, CRM help, grants management guide, public sector software docs',
}

export default function CivicflowDocsHome() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/civicflow" className="text-xl font-bold text-gray-900 dark:text-white">
                Civicflow Docs
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/docs/civicflow" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Home
                </Link>
                <Link href="/docs/civicflow/getting-started" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                  Getting Started
                </Link>
                <Link href="/docs/civicflow/crm-constituents" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                  User Guides
                </Link>
                <Link href="/docs/civicflow/api" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                  API Reference
                </Link>
              </nav>
            </div>
            <DocsSearch className="hidden md:block w-80" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 py-16 px-4">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Civicflow Documentation
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Everything you need to master Civicflow and transform your public sector operations
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/docs/civicflow/getting-started"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              <Rocket className="h-5 w-5" />
              Get Started
            </Link>
            <Link
              href="/docs/civicflow/dashboard-navigation"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Book className="h-5 w-5" />
              View User Guides
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Links Grid */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Popular Documentation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Getting Started */}
            <Link
              href="/docs/civicflow/getting-started"
              className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900 p-3">
                  <Rocket className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Getting Started
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    New to Civicflow? Start here for initial setup and configuration.
                  </p>
                </div>
              </div>
            </Link>

            {/* Dashboard Guide */}
            <Link
              href="/docs/civicflow/dashboard-navigation"
              className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-green-100 dark:bg-green-900 p-3">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                    Dashboard & Navigation
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Master your dashboard and navigate Civicflow efficiently.
                  </p>
                </div>
              </div>
            </Link>

            {/* CRM Guide */}
            <Link
              href="/docs/civicflow/crm-constituents"
              className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900 p-3">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    CRM & Constituents
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Manage constituents, organizations, and relationships.
                  </p>
                </div>
              </div>
            </Link>

            {/* Case Management */}
            <Link
              href="/docs/civicflow/case-management"
              className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-orange-100 dark:bg-orange-900 p-3">
                  <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                    Case Management
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Track service requests from intake to resolution.
                  </p>
                </div>
              </div>
            </Link>

            {/* Programs & Grants */}
            <Link
              href="/docs/civicflow/programs-grants"
              className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-cyan-100 dark:bg-cyan-900 p-3">
                  <Zap className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                    Programs & Grants
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Configure programs and manage grant applications.
                  </p>
                </div>
              </div>
            </Link>

            {/* Help & Support */}
            <Link
              href="/docs/civicflow/support"
              className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-pink-100 dark:bg-pink-900 p-3">
                  <HelpCircle className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400">
                    Help & Support
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Get help, report issues, and contact support.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-16 px-4 bg-gray-100 dark:bg-gray-800">
        <div className="mx-auto max-w-4xl text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Can't find what you're looking for?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Use our search to quickly find the documentation you need
          </p>
          <DocsSearch className="max-w-xl mx-auto" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-8 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2024 Civicflow. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/civicflow/help" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Contact Support
              </Link>
              <Link href="/docs/civicflow/api" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                API Docs
              </Link>
              <a href="https://status.civicflow.com" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                System Status
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}