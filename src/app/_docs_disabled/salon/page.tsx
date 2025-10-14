import {
  BookOpen,
  Calendar,
  Users,
  ShoppingBag,
  CreditCard,
  Building2,
  TrendingUp,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { marked } from 'marked'

// Configure marked for better rendering
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false
})

async function getMarkdownContent() {
  const filePath = path.join(process.cwd(), 'docs', 'salon', 'README.md')
  const content = await fs.promises.readFile(filePath, 'utf-8')

  // Extract executive summary manually from markdown
  const lines = content.split('\n')
  let inSummary = false
  let executiveSummary = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('## ') && line.includes('Executive Summary')) {
      inSummary = true
      continue
    }
    if (inSummary && line.startsWith('## ')) {
      break
    }
    if (inSummary) {
      executiveSummary += line + '\n'
    }
  }

  // Convert executive summary to HTML
  const summaryHtml = await marked(executiveSummary)

  return {
    fullContent: await marked(content),
    executiveSummary: summaryHtml
  }
}

const salonModules = [
  {
    title: 'Getting Started',
    href: '/docs/salon/getting-started',
    icon: BookOpen,
    description: 'Quick setup guide and initial configuration'
  },
  {
    title: 'Appointments',
    href: '/docs/salon/appointments',
    icon: Calendar,
    description: 'Smart scheduling and appointment management'
  },
  {
    title: 'Client Management',
    href: '/docs/salon/clients',
    icon: Users,
    description: '360° customer view and relationship management'
  },
  {
    title: 'Service Catalog',
    href: '/docs/salon/services',
    icon: ShoppingBag,
    description: 'Dynamic service configuration and pricing'
  },
  {
    title: 'Point of Sale',
    href: '/docs/salon/pos',
    icon: CreditCard,
    description: 'Integrated payment processing and checkout'
  },
  {
    title: 'Multi-Branch',
    href: '/docs/salon/multi-branch',
    icon: Building2,
    description: 'Branch management and operations'
  },
  {
    title: 'Financial Integration',
    href: '/docs/salon/financial-integration',
    icon: TrendingUp,
    description: 'Auto-journal posting and GL integration'
  },
  {
    title: 'Architecture',
    href: '/docs/salon/architecture',
    icon: FileText,
    description: 'Technical architecture and system design'
  }
]

export default async function SalonDocsPage() {
  const { executiveSummary } = await getMarkdownContent()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            HERA Salon DNA Module
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-300 max-w-3xl mx-auto">
            Revolutionary Beauty Business Operating System - Transform your salon operations with
            HERA's Universal Architecture
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-3xl font-bold text-emerald-600">30 sec</div>
            <div className="text-gray-500 dark:text-gray-300">Deployment Time</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-3xl font-bold text-cyan-600">1,247</div>
            <div className="text-gray-500 dark:text-gray-300">Active Salons</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-3xl font-bold text-blue-600">99.99%</div>
            <div className="text-gray-500 dark:text-gray-300">Uptime</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="text-3xl font-bold text-purple-600">$2.4M</div>
            <div className="text-gray-500 dark:text-gray-300">Daily Revenue</div>
          </div>
        </div>

        {/* Executive Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Executive Summary
          </h2>
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: executiveSummary }}
          />
        </div>

        {/* Module Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">
            Documentation Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {salonModules.map(module => {
              const Icon = module.icon
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Icon className="w-12 h-12 text-emerald-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                    {module.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-300 text-sm">{module.description}</p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100">
                Universal Architecture Benefits
              </h3>
              <ul className="space-y-2 text-gray-500 dark:text-gray-300">
                <li>• Zero Schema Changes - All operations on 6 sacred tables</li>
                <li>• Instant Deployment - 30-second setup</li>
                <li>• Perfect Multi-Tenancy - Organization-level isolation</li>
                <li>• Infinite Scalability - Single chair to 1000+ locations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100">
                Salon-Specific Innovations
              </h3>
              <ul className="space-y-2 text-gray-500 dark:text-gray-300">
                <li>• Smart Appointment Engine - AI-powered scheduling</li>
                <li>• Dynamic Service Catalog - Flexible pricing</li>
                <li>• Multi-Branch Management - Central control</li>
                <li>• Integrated Finance - Automatic GL posting</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Implementation Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Implementation Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-emerald-600 rounded-full mr-4" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  Phase 1: Core Setup (1-4 days)
                </h3>
                <p className="text-gray-500 dark:text-gray-300">
                  Organization setup, branches, services, staff
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-cyan-600 rounded-full mr-4" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  Phase 2: Operations (5-8 days)
                </h3>
                <p className="text-gray-500 dark:text-gray-300">
                  Client import, inventory, POS configuration
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-600 rounded-full mr-4" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  Phase 3: Advanced (9-14 days)
                </h3>
                <p className="text-gray-500 dark:text-gray-300">
                  Financial integration, analytics, go live
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
