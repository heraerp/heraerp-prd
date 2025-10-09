import fs from 'fs'
import path from 'path'
import { marked } from 'marked'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false
})

async function getMarkdownContent() {
  const filePath = path.join(process.cwd(), 'docs', 'salon', 'getting-started.md')
  const content = await fs.promises.readFile(filePath, 'utf-8')
  return marked(content)
}

export default async function GettingStartedPage() {
  const content = await getMarkdownContent()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-300 mb-8">
          <Link href="/docs" className="hover:text-emerald-600">
            Docs
          </Link>
          <span>/</span>
          <Link href="/docs/salon" className="hover:text-emerald-600">
            Salon
          </Link>
          <span>/</span>
          <span className="text-gray-800 dark:text-gray-200">Getting Started</span>
        </nav>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <article
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Link
            href="/docs/salon"
            className="flex items-center text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Link>
          <Link
            href="/docs/salon/appointments"
            className="flex items-center text-emerald-600 hover:text-emerald-700"
          >
            Appointments
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}
